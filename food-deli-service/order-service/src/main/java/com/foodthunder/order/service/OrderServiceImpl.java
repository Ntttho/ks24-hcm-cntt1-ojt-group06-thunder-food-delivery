package com.foodthunder.order.service;

import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.*;
import com.foodthunder.order.dto.client.RemoteProductDto;
import com.foodthunder.order.dto.client.RemoteToppingDto;
import com.foodthunder.order.entity.*;
import com.foodthunder.order.exception.BadRequestException;
import com.foodthunder.order.exception.ResourceNotFoundException;
import com.foodthunder.order.repository.OrderRepository;
import com.foodthunder.order.repository.OrderStatusLogRepository;
import com.foodthunder.order.repository.OrderStatusRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderStatusRepository orderStatusRepository;
    private final OrderStatusLogRepository orderStatusLogRepository;
    private final RestaurantClient restaurantClient;

    // Defined State Machine transitions: Current Status -> Set of allowed Next Statuses
    private static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
            OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.TIMEOUT),
            OrderStatus.CONFIRMED, Set.of(OrderStatus.DRIVER_ACCEPTED, OrderStatus.CANCELLED, OrderStatus.TIMEOUT),
            OrderStatus.DRIVER_ACCEPTED, Set.of(OrderStatus.PICKING_UP, OrderStatus.DRIVER_REJECTED, OrderStatus.CANCELLED),
            OrderStatus.DRIVER_REJECTED, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.PICKING_UP, Set.of(OrderStatus.DELIVERING),
            OrderStatus.DELIVERING, Set.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
            OrderStatus.COMPLETED, Collections.emptySet(),
            OrderStatus.CANCELLED, Collections.emptySet(),
            OrderStatus.TIMEOUT, Collections.emptySet()
    );

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, Integer customerId) {
        if (customerId == null) {
            customerId = 1; // Default fallback if not yet passed from auth token
        }
        log.info("Starting order creation for customerId: {}, restaurantId: {}", customerId, request.getRestaurantId());

        // 1. Idempotency Key validation
        String idempotencyKey = request.getIdempotencyKey();
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            idempotencyKey = "IDEM-" + UUID.randomUUID().toString();
        } else {
            Optional<Order> existingOrder = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existingOrder.isPresent()) {
                log.info("Idempotent request detected. Returning existing order id: {}", existingOrder.get().getId());
                return mapToOrderResponse(existingOrder.get());
            }
        }

        // 2. Fetch products and validate single-shop constraint via OpenFeign
        Integer targetRestaurantId = request.getRestaurantId();
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CreateOrderItemRequest itemRequest : request.getItems()) {
            ResponseEntity<ApiResponse<RemoteProductDto>> productResponse;
            try {
                productResponse = restaurantClient.getProductDetail(itemRequest.getFoodId());
            } catch (Exception e) {
                log.error("Failed to fetch product id: {} from restaurant-service", itemRequest.getFoodId(), e);
                throw new ResourceNotFoundException("Không tìm thấy món ăn với ID=" + itemRequest.getFoodId());
            }

            if (productResponse == null || productResponse.getBody() == null || productResponse.getBody().getData() == null) {
                throw new ResourceNotFoundException("Không tìm thấy thông tin món ăn ID=" + itemRequest.getFoodId());
            }

            RemoteProductDto product = productResponse.getBody().getData();

            // Check availability
            if (Boolean.FALSE.equals(product.getIsAvailable())) {
                throw new BadRequestException("Món ăn '" + product.getName() + "' hiện đang tạm ngưng phục vụ");
            }

            // Check Single-Shop Constraint
            if (!targetRestaurantId.equals(product.getRestaurantId())) {
                throw new BadRequestException("Món ăn '" + product.getName() + "' thuộc quán ăn khác (ID=" + product.getRestaurantId()
                        + "). Tất cả món trong giỏ hàng phải thuộc cùng quán ăn (ID=" + targetRestaurantId + ")");
            }

            // Map available toppings
            Map<Integer, RemoteToppingDto> availableToppingsMap = product.getToppings().stream()
                    .collect(Collectors.toMap(RemoteToppingDto::getId, t -> t, (a, b) -> a));

            // Calculate item price
            BigDecimal itemUnitPrice = product.getPrice();
            BigDecimal itemTotal = itemUnitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .foodId(product.getId())
                    .foodName(product.getName())
                    .quantity(itemRequest.getQuantity())
                    .priceAtOrder(itemUnitPrice)
                    .build();

            // Process Toppings
            if (itemRequest.getToppings() != null && !itemRequest.getToppings().isEmpty()) {
                for (CreateOrderItemToppingRequest toppingRequest : itemRequest.getToppings()) {
                    RemoteToppingDto toppingDto = availableToppingsMap.get(toppingRequest.getToppingId());
                    if (toppingDto == null) {
                        throw new BadRequestException("Topping ID=" + toppingRequest.getToppingId()
                                + " không thuộc danh mục món '" + product.getName() + "'");
                    }

                    BigDecimal toppingPrice = toppingDto.getPrice();
                    int toppingQty = toppingRequest.getQuantity() != null && toppingRequest.getQuantity() > 0
                            ? toppingRequest.getQuantity() : 1;

                    BigDecimal toppingLineTotal = toppingPrice.multiply(BigDecimal.valueOf((long) toppingQty * itemRequest.getQuantity()));
                    itemTotal = itemTotal.add(toppingLineTotal);

                    OrderItemTopping orderItemTopping = OrderItemTopping.builder()
                            .toppingId(toppingDto.getId())
                            .quantity(toppingQty)
                            .price(toppingPrice)
                            .build();

                    orderItem.addTopping(orderItemTopping);
                }
            }

            subtotal = subtotal.add(itemTotal);
            orderItems.add(orderItem);
        }

        // 3. Calculate shipping fee based on distance
        Double distanceKm = request.getDistanceKm();
        if (distanceKm == null || distanceKm <= 0) {
            distanceKm = 2.0;
        }
        BigDecimal shippingFee = calculateShippingFee(distanceKm);
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(shippingFee).add(taxAmount).subtract(discountAmount);

        // 4. Retrieve initial status PENDING
        OrderStatus pendingStatus = getOrCreateStatus(OrderStatus.PENDING, "Chờ xác nhận", "Đơn hàng vừa được tạo, đang chờ xử lý", 1);

        // 5. Generate unique order code
        String orderCode = generateOrderCode();

        // 6. Build Order entity
        Order order = Order.builder()
                .orderCode(orderCode)
                .idempotencyKey(idempotencyKey)
                .customerId(customerId)
                .restaurantId(targetRestaurantId)
                .voucherId(request.getVoucherId())
                .receiverAddress(request.getReceiverAddress())
                .receiverLat(request.getReceiverLat())
                .receiverLng(request.getReceiverLng())
                .distanceKm(distanceKm)
                .subtotalAmount(subtotal)
                .taxAmount(taxAmount)
                .shippingFee(shippingFee)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .status(pendingStatus)
                .version(0)
                .createdAt(LocalDateTime.now())
                .build();

        for (OrderItem oi : orderItems) {
            order.addItem(oi);
        }

        OrderStatusLog initialLog = OrderStatusLog.builder()
                .previousStatus(null)
                .newStatus(OrderStatus.PENDING)
                .changedBy(customerId)
                .reason("Khách hàng tạo đơn hàng")
                .createdAt(LocalDateTime.now())
                .build();
        order.addStatusLog(initialLog);

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully with id: {}, code: {}", savedOrder.getId(), savedOrder.getOrderCode());

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(Integer customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable);

        List<OrderResponse> content = orderPage.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
                .content(content)
                .pageNumber(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, Integer requestingUserId, String requestingUserRole) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID=" + orderId));

        if (requestingUserRole != null && requestingUserRole.contains("CUSTOMER")) {
            if (requestingUserId != null && !requestingUserId.equals(order.getCustomerId())) {
                throw new BadRequestException("Bạn không có quyền xem thông tin đơn hàng này");
            }
        }

        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getOrders(Integer restaurantId, Integer driverId, String statusCode, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (restaurantId != null) {
                predicates.add(cb.equal(root.get("restaurantId"), restaurantId));
            }
            if (driverId != null) {
                predicates.add(cb.equal(root.get("driverId"), driverId));
            }
            if (statusCode != null && !statusCode.isBlank()) {
                predicates.add(cb.equal(root.get("status").get("code"), statusCode.toUpperCase()));
            }
            predicates.add(cb.isNull(root.get("deletedAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Order> orderPage = orderRepository.findAll(spec, pageable);
        List<OrderResponse> content = orderPage.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
                .content(content)
                .pageNumber(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, Integer requestingUserId, String requestingUserRole) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID=" + orderId));

        String currentStatus = order.getStatus().getCode();
        String targetStatus = request.getStatusCode().trim().toUpperCase();

        log.info("Request status transition for order {}: {} -> {}", orderId, currentStatus, targetStatus);

        // 1. If same status, no-op return
        if (currentStatus.equals(targetStatus)) {
            return mapToOrderResponse(order);
        }

        // 2. Validate state machine transition
        Set<String> allowedNext = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Collections.emptySet());
        if (!allowedNext.contains(targetStatus)) {
            throw new BadRequestException("Không thể chuyển trạng thái đơn hàng từ '" + currentStatus + "' sang '" + targetStatus + "'");
        }

        // 3. Handle status-specific side effects
        if (OrderStatus.CANCELLED.equals(targetStatus)) {
            order.setCancelReason(request.getReason() != null ? request.getReason() : "Đơn hàng đã bị hủy");
            order.setCancelledByRole(requestingUserRole != null ? requestingUserRole : "SYSTEM");
            order.setCancelledByUserId(requestingUserId);
            order.setCancelledAt(LocalDateTime.now());
        } else if (OrderStatus.DRIVER_ACCEPTED.equals(targetStatus) && requestingUserId != null) {
            order.setDriverId(requestingUserId);
        }

        // 4. Update status entity
        OrderStatus newStatusEntity = getOrCreateStatus(targetStatus, targetStatus, "Chuyển sang " + targetStatus, 0);
        order.setStatus(newStatusEntity);

        // 5. Append log
        OrderStatusLog statusLog = OrderStatusLog.builder()
                .previousStatus(currentStatus)
                .newStatus(targetStatus)
                .changedBy(requestingUserId)
                .reason(request.getReason())
                .createdAt(LocalDateTime.now())
                .build();
        order.addStatusLog(statusLog);

        Order updatedOrder = orderRepository.save(order);
        log.info("Order status updated successfully for id: {}, newStatus: {}", updatedOrder.getId(), targetStatus);

        return mapToOrderResponse(updatedOrder);
    }

    private BigDecimal calculateShippingFee(Double distanceKm) {
        BigDecimal baseFee = BigDecimal.valueOf(15000); // 15,000 VND for <= 2.0 km
        if (distanceKm <= 2.0) {
            return baseFee;
        }
        double extraKm = Math.ceil(distanceKm - 2.0);
        BigDecimal extraFee = BigDecimal.valueOf(extraKm * 5000); // 5,000 VND per extra km
        return baseFee.add(extraFee);
    }

    private OrderStatus getOrCreateStatus(String code, String defaultLabel, String defaultDescription, int sortOrder) {
        return orderStatusRepository.findByCode(code)
                .orElseGet(() -> orderStatusRepository.save(
                        OrderStatus.builder()
                                .code(code)
                                .label(defaultLabel)
                                .description(defaultDescription)
                                .sortOrder(sortOrder)
                                .build()
                ));
    }

    private String generateOrderCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(100000, 999999);
        return "ORD-" + datePart + "-" + randomSuffix;
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> {
                    List<OrderItemToppingResponse> toppingResponses = item.getToppings().stream()
                            .map(topping -> OrderItemToppingResponse.builder()
                                    .id(topping.getId())
                                    .toppingId(topping.getToppingId())
                                    .quantity(topping.getQuantity())
                                    .price(topping.getPrice())
                                    .build())
                            .collect(Collectors.toList());

                    return OrderItemResponse.builder()
                            .id(item.getId())
                            .foodId(item.getFoodId())
                            .foodName(item.getFoodName())
                            .quantity(item.getQuantity())
                            .priceAtOrder(item.getPriceAtOrder())
                            .toppings(toppingResponses)
                            .build();
                })
                .collect(Collectors.toList());

        List<OrderStatusLogResponse> logResponses = order.getStatusLogs().stream()
                .map(l -> OrderStatusLogResponse.builder()
                        .id(l.getId())
                        .previousStatus(l.getPreviousStatus())
                        .newStatus(l.getNewStatus())
                        .changedBy(l.getChangedBy())
                        .reason(l.getReason())
                        .createdAt(l.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .idempotencyKey(order.getIdempotencyKey())
                .customerId(order.getCustomerId())
                .restaurantId(order.getRestaurantId())
                .driverId(order.getDriverId())
                .voucherId(order.getVoucherId())
                .receiverAddress(order.getReceiverAddress())
                .receiverLat(order.getReceiverLat())
                .receiverLng(order.getReceiverLng())
                .distanceKm(order.getDistanceKm())
                .subtotalAmount(order.getSubtotalAmount())
                .taxAmount(order.getTaxAmount())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .statusCode(order.getStatus() != null ? order.getStatus().getCode() : null)
                .statusLabel(order.getStatus() != null ? order.getStatus().getLabel() : null)
                .version(order.getVersion())
                .cancelReason(order.getCancelReason())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .statusLogs(logResponses)
                .build();
    }
}
