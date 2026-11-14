package com.foodthunder.order.service;

import com.foodthunder.order.client.AuthClient;
import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.*;
import com.foodthunder.order.dto.client.RemoteOrderCostConfigDto;
import com.foodthunder.order.dto.client.RemoteProductDto;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.dto.client.RemoteToppingDto;
import com.foodthunder.order.dto.client.RemoteValidateVoucherRequest;
import com.foodthunder.order.dto.client.RemoteVoucherValidationResponse;
import com.foodthunder.order.entity.*;
import com.foodthunder.order.exception.BadRequestException;
import com.foodthunder.order.exception.ConflictException;
import com.foodthunder.order.exception.ForbiddenException;
import com.foodthunder.order.exception.ResourceNotFoundException;
import com.foodthunder.order.exception.UnauthorizedException;
import com.foodthunder.order.repository.OrderRepository;
import com.foodthunder.order.repository.OrderStatusLogRepository;
import com.foodthunder.order.repository.OrderStatusRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final OrderStatusRepository orderStatusRepository;
    private final OrderStatusLogRepository orderStatusLogRepository;
    private final RestaurantClient restaurantClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final SystemSettingsService systemSettingsService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.foodthunder.order.client.NotificationClient notificationClient;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private AuthClient authClient;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            OrderStatusRepository orderStatusRepository,
            OrderStatusLogRepository orderStatusLogRepository,
            RestaurantClient restaurantClient,
            SimpMessagingTemplate messagingTemplate,
            SystemSettingsService systemSettingsService
    ) {
        this.orderRepository = orderRepository;
        this.orderStatusRepository = orderStatusRepository;
        this.orderStatusLogRepository = orderStatusLogRepository;
        this.restaurantClient = restaurantClient;
        this.messagingTemplate = messagingTemplate;
        this.systemSettingsService = systemSettingsService;
    }

    // Defined State Machine transitions: Current Status -> Set of allowed Next Statuses
    private static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
            OrderStatus.AWAITING_PAYMENT, Set.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.TIMEOUT),
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
            throw new UnauthorizedException("Yêu cầu thông tin định danh khách hàng hợp lệ (X-User-Id)");
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

        // 2. Validate restaurant existence and operational status via OpenFeign
        Integer targetRestaurantId = request.getRestaurantId();
        ResponseEntity<ApiResponse<RemoteRestaurantDto>> restaurantResponse;
        try {
            restaurantResponse = restaurantClient.getRestaurantDetail(targetRestaurantId);
        } catch (Exception e) {
            log.error("Failed to fetch restaurant id: {} from restaurant-service", targetRestaurantId, e);
            throw new ResourceNotFoundException("Không tìm thấy thông tin quán ăn với ID=" + targetRestaurantId);
        }

        if (restaurantResponse == null || restaurantResponse.getBody() == null || restaurantResponse.getBody().getData() == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin quán ăn với ID=" + targetRestaurantId);
        }

        RemoteRestaurantDto restaurantDto = restaurantResponse.getBody().getData();
        if (restaurantDto.getApprovalStatus() != null && !"APPROVED".equalsIgnoreCase(restaurantDto.getApprovalStatus())) {
            throw new BadRequestException("Quán ăn '" + restaurantDto.getName() + "' hiện chưa được phê duyệt hoạt động");
        }

        if (Boolean.FALSE.equals(restaurantDto.getIsOpen())) {
            throw new BadRequestException("Quán ăn '" + restaurantDto.getName() + "' hiện đang đóng cửa hoặc tạm ngưng nhận đơn");
        }

        // 3. Fetch products and validate single-shop constraint via OpenFeign
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        List<com.foodthunder.order.dto.client.RemoteDeductStockItemRequest> stockDeductItems = new ArrayList<>();

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

            // Check stock quantity
            if (product.getCurrentQuantity() != null && product.getCurrentQuantity() < itemRequest.getQuantity()) {
                throw new BadRequestException("Món ăn '" + product.getName() + "' chỉ còn " + product.getCurrentQuantity()
                        + " phần, không đủ số lượng đặt (" + itemRequest.getQuantity() + ")");
            }

            stockDeductItems.add(new com.foodthunder.order.dto.client.RemoteDeductStockItemRequest(product.getId(), itemRequest.getQuantity()));

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

        // 4. Calculate shipping fee, service fee & VAT dynamically from auth-service Admin Settings (or fallback to shipping settings)
        RemoteOrderCostConfigDto costConfig = fetchOrderCostConfig();
        Double distanceKm = request.getDistanceKm();
        if (distanceKm == null || distanceKm <= 0) {
            distanceKm = (costConfig != null && costConfig.getBaseKm() != null && costConfig.getBaseKm() > 0)
                    ? costConfig.getBaseKm() : 2.0;
        }
        BigDecimal shippingFee = calculateShippingFee(distanceKm, request.getDeliverySpeed(), costConfig);
        BigDecimal serviceFee = (costConfig != null && costConfig.getServiceFee() != null && costConfig.getServiceFee().compareTo(BigDecimal.ZERO) > 0)
                ? costConfig.getServiceFee() : BigDecimal.ZERO;
        BigDecimal vatAmount = BigDecimal.ZERO;
        if (costConfig != null && Boolean.FALSE.equals(costConfig.getVatIncluded())
                && costConfig.getVatRate() != null && costConfig.getVatRate() > 0) {
            vatAmount = subtotal.multiply(BigDecimal.valueOf(costConfig.getVatRate()))
                    .setScale(0, java.math.RoundingMode.HALF_UP);
        }
        BigDecimal taxAmount = serviceFee.add(vatAmount);
        BigDecimal discountAmount = BigDecimal.ZERO;
        Integer appliedVoucherId = request.getVoucherId();

        // 4.1 Validate & apply voucher if provided
        String voucherCode = request.getVoucherCode();
        if ((voucherCode != null && !voucherCode.isBlank()) || appliedVoucherId != null) {
            if ((voucherCode == null || voucherCode.isBlank()) && appliedVoucherId != null) {
                try {
                    ResponseEntity<ApiResponse<RemoteVoucherValidationResponse>> vRes = restaurantClient.getVoucherById(appliedVoucherId);
                    if (vRes != null && vRes.getBody() != null && vRes.getBody().getData() != null) {
                        voucherCode = vRes.getBody().getData().getCode();
                    }
                } catch (Exception ex) {
                    log.warn("Could not fetch voucher by id {}: {}", appliedVoucherId, ex.getMessage());
                }
            }

            if (voucherCode != null && !voucherCode.isBlank()) {
                RemoteValidateVoucherRequest vReq = RemoteValidateVoucherRequest.builder()
                        .code(voucherCode)
                        .restaurantId(targetRestaurantId)
                        .orderAmount(subtotal)
                        .build();

                try {
                    ResponseEntity<ApiResponse<RemoteVoucherValidationResponse>> vRes = restaurantClient.validateVoucher(vReq);
                    RemoteVoucherValidationResponse vData = (vRes != null && vRes.getBody() != null) ? vRes.getBody().getData() : null;
                    if (vData == null || !Boolean.TRUE.equals(vData.getIsValid())) {
                        String errMsg = (vData != null && vData.getMessage() != null)
                                ? vData.getMessage()
                                : "Mã voucher không hợp lệ";
                        throw new BadRequestException("Không thể áp dụng voucher: " + errMsg);
                    }
                    discountAmount = vData.getDiscountAmount() != null ? vData.getDiscountAmount() : BigDecimal.ZERO;
                    appliedVoucherId = vData.getVoucherId();
                } catch (BadRequestException bre) {
                    throw bre;
                } catch (Exception ex) {
                    log.error("Error validating voucher with restaurant-service: {}", ex.getMessage());
                    throw new BadRequestException("Lỗi xác thực mã voucher: " + ex.getMessage());
                }
            }
        }

        BigDecimal totalAmount = subtotal.add(shippingFee).add(taxAmount).subtract(discountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        // 5. Retrieve initial status based on payment method (COD vs SEPAY/VIETQR/VNPAY)
        String paymentMethod = (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                ? request.getPaymentMethod().trim().toUpperCase() : "COD";

        OrderStatus initialStatus;
        String initialReason;
        if ("VNPAY".equalsIgnoreCase(paymentMethod) || "SEPAY".equalsIgnoreCase(paymentMethod)
                || "VIETQR".equalsIgnoreCase(paymentMethod) || "WALLET".equalsIgnoreCase(paymentMethod)) {
            paymentMethod = ("WALLET".equalsIgnoreCase(paymentMethod) || "VIETQR".equalsIgnoreCase(paymentMethod)) ? "SEPAY" : paymentMethod;
            initialStatus = getOrCreateStatus(OrderStatus.AWAITING_PAYMENT, "Chờ thanh toán", "Đơn hàng đang chờ thanh toán qua cổng SePay/VietQR (8 phút)", 10);
            initialReason = "Khách hàng tạo đơn hàng qua " + paymentMethod + " (Chờ thanh toán 8 phút)";
        } else {
            paymentMethod = "COD";
            initialStatus = getOrCreateStatus(OrderStatus.PENDING, "Chờ xác nhận", "Đơn hàng vừa được tạo, đang chờ xử lý", 1);
            initialReason = "Khách hàng tạo đơn hàng COD (Chờ xác nhận)";
        }

        // 6. Generate unique order code
        String orderCode = generateOrderCode();

        String finalCustomerName = (request.getCustomerName() != null && !request.getCustomerName().isBlank())
                ? request.getCustomerName().trim() : ("Khách hàng #" + customerId);
        String finalCustomerPhone = (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank())
                ? request.getCustomerPhone().trim() : "0900000000";

        // 7. Build Order entity
        Order order = Order.builder()
                .orderCode(orderCode)
                .idempotencyKey(idempotencyKey)
                .customerId(customerId)
                .customerName(finalCustomerName)
                .customerPhone(finalCustomerPhone)
                .restaurantId(targetRestaurantId)
                .voucherId(appliedVoucherId)
                .receiverAddress(request.getReceiverAddress())
                .note(request.getNote())
                .receiverLat(request.getReceiverLat())
                .receiverLng(request.getReceiverLng())
                .distanceKm(distanceKm)
                .subtotalAmount(subtotal)
                .taxAmount(taxAmount)
                .shippingFee(shippingFee)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .paymentMethod(paymentMethod)
                .status(initialStatus)
                .version(0)
                .createdAt(LocalDateTime.now())
                .build();

        for (OrderItem oi : orderItems) {
            order.addItem(oi);
        }

        OrderStatusLog initialLog = OrderStatusLog.builder()
                .previousStatus(null)
                .newStatus(initialStatus.getCode())
                .changedBy(customerId)
                .reason(initialReason)
                .createdAt(LocalDateTime.now())
                .build();
        order.addStatusLog(initialLog);

        // Deduct product stock via restaurantClient
        if (!stockDeductItems.isEmpty()) {
            try {
                restaurantClient.deductStock(new com.foodthunder.order.dto.client.RemoteDeductStockBatchRequest(stockDeductItems));
            } catch (BadRequestException bre) {
                throw bre;
            } catch (Exception ex) {
                log.error("Failed to deduct stock from restaurant-service: {}", ex.getMessage());
                throw new BadRequestException("Không thể trừ số lượng tồn kho của món ăn: " + ex.getMessage());
            }
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully with id: {}, code: {}, paymentMethod: {}, discount: {}, status: {}",
                savedOrder.getId(), savedOrder.getOrderCode(), paymentMethod, discountAmount, initialStatus.getCode());

        // Broadcast realtime notification to Merchant if order is already PENDING (e.g. COD)
        if (OrderStatus.PENDING.equalsIgnoreCase(initialStatus.getCode())) {
            broadcastOrderToMerchant(savedOrder);
        }

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
    public List<ReviewOrderContextResponse> getReviewOrderContexts(List<Long> orderIds) {
        List<Long> uniqueOrderIds = orderIds.stream().distinct().toList();
        if (uniqueOrderIds.isEmpty()) {
            return List.of();
        }

        return orderRepository.findAllWithItemsByIdIn(uniqueOrderIds).stream()
                .map(order -> ReviewOrderContextResponse.builder()
                        .orderId(order.getId())
                        .restaurantId(order.getRestaurantId())
                        .items(order.getItems().stream()
                                .map(item -> ReviewOrderContextResponse.Item.builder()
                                        .foodId(item.getFoodId())
                                        .foodName(item.getFoodName())
                                        .quantity(item.getQuantity())
                                        .build())
                                .toList())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getOrders(Integer restaurantId, Integer driverId, String statusCode, String keyword, int page, int size) {
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
                String upper = statusCode.toUpperCase().trim();
                if ("DELIVERING".equals(upper)) {
                    predicates.add(root.get("status").get("code").in(java.util.List.of("DELIVERING", "DRIVER_ACCEPTED", "PICKING_UP")));
                } else if (upper.contains(",")) {
                    java.util.List<String> codes = java.util.Arrays.stream(upper.split(",")).map(String::trim).toList();
                    predicates.add(root.get("status").get("code").in(codes));
                } else {
                    predicates.add(cb.equal(root.get("status").get("code"), upper));
                }
            }

            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                if (query != null) {
                    query.distinct(true);
                }
                Join<Order, OrderItem> itemsJoin = root.join("items", JoinType.LEFT);
                List<Predicate> searchOrList = new ArrayList<>();
                searchOrList.add(cb.like(cb.lower(root.get("orderCode")), kw));
                searchOrList.add(cb.like(cb.lower(root.get("customerName")), kw));
                searchOrList.add(cb.like(cb.lower(root.get("customerPhone")), kw));
                searchOrList.add(cb.like(cb.lower(itemsJoin.get("foodName")), kw));

                try {
                    Long numericId = Long.parseLong(keyword.trim());
                    searchOrList.add(cb.equal(root.get("id"), numericId));
                } catch (NumberFormatException ignored) {
                }

                predicates.add(cb.or(searchOrList.toArray(new Predicate[0])));
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
        // Pessimistic Locking with SELECT ... FOR UPDATE to prevent race conditions during status changes
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID=" + orderId));

        String currentStatus = order.getStatus().getCode();
        String targetStatus = request.getStatusCode().trim().toUpperCase();

        log.info("Request status transition for order {}: {} -> {} (user: {}, role: {})",
                orderId, currentStatus, targetStatus, requestingUserId, requestingUserRole);

        // 1. Chặn Race Condition khi nhiều tài xế cùng bấm nhận 1 đơn hàng
        if (OrderStatus.DRIVER_ACCEPTED.equals(targetStatus)
                && order.getDriverId() != null
                && (requestingUserId == null || !order.getDriverId().equals(requestingUserId))) {
            throw new ConflictException("Đơn hàng này đã được một tài xế khác nhận trước. Vui lòng chọn đơn khác!");
        }

        // 2. If same status, no-op return (only valid for same driver on DRIVER_ACCEPTED)
        if (currentStatus.equals(targetStatus)) {
            return mapToOrderResponse(order);
        }

        // 3. Validate state machine transition graph
        Set<String> allowedNext = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Collections.emptySet());
        if (!allowedNext.contains(targetStatus)) {
            throw new BadRequestException("Không thể chuyển trạng thái đơn hàng từ '" + currentStatus + "' sang '" + targetStatus + "'");
        }

        // 4. RBAC validation based on user role
        if (requestingUserRole != null && !requestingUserRole.isBlank()) {
            String roleUpper = requestingUserRole.toUpperCase();
            if (roleUpper.contains("CUSTOMER")) {
                if (requestingUserId != null && !requestingUserId.equals(order.getCustomerId())) {
                    throw new ForbiddenException("Bạn không có quyền thao tác trên đơn hàng của người khác");
                }
                if (OrderStatus.CANCELLED.equals(targetStatus)) {
                    if (!OrderStatus.PENDING.equals(currentStatus) && !OrderStatus.AWAITING_PAYMENT.equals(currentStatus)) {
                        throw new BadRequestException("Khách hàng chỉ có thể hủy đơn khi đơn hàng đang ở trạng thái Chờ thanh toán hoặc Chờ xác nhận");
                    }
                } else {
                    throw new ForbiddenException("Khách hàng không có quyền chuyển trạng thái đơn hàng sang '" + targetStatus + "'");
                }
            } else if (roleUpper.contains("DRIVER")) {
                if (OrderStatus.CANCELLED.equals(targetStatus)) {
                    throw new BadRequestException("Tài xế không thể hủy đơn trực tiếp, vui lòng thực hiện qua quy trình trả đơn");
                }
                if (OrderStatus.CONFIRMED.equals(targetStatus)
                        || OrderStatus.PENDING.equals(targetStatus)
                        || OrderStatus.AWAITING_PAYMENT.equals(targetStatus)
                        || OrderStatus.TIMEOUT.equals(targetStatus)) {
                    throw new ForbiddenException("Tài xế không có quyền chuyển đơn sang trạng thái '" + targetStatus + "'");
                }
                if (OrderStatus.DRIVER_ACCEPTED.equals(targetStatus) && requestingUserId == null) {
                    throw new UnauthorizedException("Thiếu thông tin định danh tài xế (X-User-Id)");
                }
                if ((OrderStatus.PICKING_UP.equals(targetStatus)
                        || OrderStatus.DELIVERING.equals(targetStatus)
                        || OrderStatus.COMPLETED.equals(targetStatus)
                        || OrderStatus.DRIVER_REJECTED.equals(targetStatus))
                        && order.getDriverId() != null
                        && requestingUserId != null
                        && !order.getDriverId().equals(requestingUserId)) {
                    throw new ForbiddenException("Bạn không phải tài xế phụ trách đơn hàng này");
                }
            } else if (roleUpper.contains("MERCHANT")) {
                if (!OrderStatus.CONFIRMED.equals(targetStatus) && !OrderStatus.CANCELLED.equals(targetStatus)) {
                    throw new BadRequestException("Quán ăn chỉ có quyền xác nhận đơn (CONFIRMED) hoặc từ chối hủy đơn (CANCELLED)");
                }
            }
        }

        // 4. Handle status-specific side effects
        if (OrderStatus.CANCELLED.equals(targetStatus)) {
            order.setCancelReason(request.getReason() != null ? request.getReason() : "Đơn hàng đã bị hủy");
            order.setCancelledByRole(requestingUserRole != null ? requestingUserRole : "SYSTEM");
            order.setCancelledByUserId(requestingUserId);
            order.setCancelledAt(LocalDateTime.now());
            restoreProductStock(order);
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

        broadcastOrderToMerchant(updatedOrder);

        return mapToOrderResponse(updatedOrder);
    }

    private RemoteOrderCostConfigDto fetchOrderCostConfig() {
        if (authClient == null) {
            return null;
        }
        try {
            ResponseEntity<ApiResponse<RemoteOrderCostConfigDto>> res = authClient.getOrderFeeConfig();
            if (res != null && res.getBody() != null && res.getBody().getData() != null
                    && !res.getBody().getData().isFallback()) {
                return res.getBody().getData();
            }
        } catch (Exception ex) {
            log.warn("Could not fetch order cost config from auth-service, using shipping settings fallback: {}", ex.getMessage());
        }
        return null;
    }

    private BigDecimal calculateShippingFee(Double distanceKm, String deliverySpeed, RemoteOrderCostConfigDto cfg) {
        if (cfg == null) {
            if (systemSettingsService != null) {
                var settings = systemSettingsService.getShippingSettings();
                return settings.getDefaultShippingFee().add(
                        settings.getShippingFeePerKilometer().multiply(BigDecimal.valueOf(distanceKm))
                );
            }
            BigDecimal baseFee = BigDecimal.valueOf(15000);
            if (distanceKm <= 2.0) {
                return baseFee;
            }
            double extraKm = Math.ceil(distanceKm - 2.0);
            return baseFee.add(BigDecimal.valueOf(extraKm * 5000));
        }

        double baseKm = (cfg.getBaseKm() != null && cfg.getBaseKm() > 0) ? cfg.getBaseKm() : 2.0;
        BigDecimal baseFee = cfg.getBaseFee() != null ? cfg.getBaseFee() : BigDecimal.valueOf(15000);
        BigDecimal extraPerKm = cfg.getExtraPerKm() != null ? cfg.getExtraPerKm() : BigDecimal.valueOf(5000);

        BigDecimal total = baseFee;
        if (distanceKm > baseKm) {
            double extraKm = Math.ceil(distanceKm - baseKm);
            total = total.add(extraPerKm.multiply(BigDecimal.valueOf(extraKm)));
        }
        if ("priority".equalsIgnoreCase(deliverySpeed)
                && cfg.getPriorityFee() != null
                && cfg.getPriorityFee().compareTo(BigDecimal.ZERO) > 0) {
            total = total.add(cfg.getPriorityFee());
        }
        return total;
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
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .restaurantId(order.getRestaurantId())
                .driverId(order.getDriverId())
                .voucherId(order.getVoucherId())
                .receiverAddress(order.getReceiverAddress())
                .note(order.getNote())
                .receiverLat(order.getReceiverLat())
                .receiverLng(order.getReceiverLng())
                .distanceKm(order.getDistanceKm())
                .subtotalAmount(order.getSubtotalAmount())
                .taxAmount(order.getTaxAmount())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .statusCode(order.getStatus() != null ? order.getStatus().getCode() : null)
                .statusLabel(order.getStatus() != null ? order.getStatus().getLabel() : null)
                .version(order.getVersion())
                .cancelReason(order.getCancelReason())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .statusLogs(logResponses)
                .build();
    }

    @Override
    @Transactional
    public OrderResponse confirmPaymentSuccess(Long orderId, String transactionNo) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID=" + orderId));

        if (!OrderStatus.AWAITING_PAYMENT.equalsIgnoreCase(order.getStatus().getCode())) {
            log.info("Order ID={} is already at status={}, skipping payment success update",
                    orderId, order.getStatus().getCode());
            return mapToOrderResponse(order);
        }

        OrderStatus pendingStatus = getOrCreateStatus(OrderStatus.PENDING, "Chờ xác nhận", "Đơn hàng vừa được tạo, đang chờ xử lý", 1);
        order.setStatus(pendingStatus);

        OrderStatusLog logEntry = OrderStatusLog.builder()
                .previousStatus(OrderStatus.AWAITING_PAYMENT)
                .newStatus(OrderStatus.PENDING)
                .changedBy(order.getCustomerId())
                .reason("Thanh toán thành công qua SePay VietQR (Mã GD: " + (transactionNo != null ? transactionNo : "SEPAY-AUTO") + ")")
                .createdAt(LocalDateTime.now())
                .build();
        order.addStatusLog(logEntry);

        Order saved = orderRepository.save(order);
        log.info("Order ID={} successfully transitioned from AWAITING_PAYMENT to PENDING via SePay payment", orderId);

        broadcastOrderToMerchant(saved);
        return mapToOrderResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId, String reason, Integer requestingUserId, String requestingUserRole) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID=" + orderId));

        String currentStatus = order.getStatus().getCode();
        if (OrderStatus.COMPLETED.equalsIgnoreCase(currentStatus) || OrderStatus.CANCELLED.equalsIgnoreCase(currentStatus)) {
            throw new BadRequestException("Không thể hủy đơn hàng đã ở trạng thái: " + currentStatus);
        }

        OrderStatus cancelledStatus = getOrCreateStatus(OrderStatus.CANCELLED, "Đã huỷ", "Đơn hàng đã bị huỷ", 8);
        order.setStatus(cancelledStatus);
        order.setCancelReason(reason != null ? reason : "Hủy đơn hàng");
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelledByRole(requestingUserRole != null ? requestingUserRole : "CUSTOMER");
        order.setCancelledByUserId(requestingUserId);

        OrderStatusLog logEntry = OrderStatusLog.builder()
                .previousStatus(currentStatus)
                .newStatus(OrderStatus.CANCELLED)
                .changedBy(requestingUserId)
                .reason(reason != null ? reason : "Hủy đơn hàng")
                .createdAt(LocalDateTime.now())
                .build();
        order.addStatusLog(logEntry);

        restoreProductStock(order);

        Order saved = orderRepository.save(order);
        log.info("Order ID={} cancelled with reason: {}", orderId, reason);

        broadcastOrderToMerchant(saved);

        return mapToOrderResponse(saved);
    }

    private void restoreProductStock(Order order) {
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            try {
                List<com.foodthunder.order.dto.client.RemoteDeductStockItemRequest> restoreItems = order.getItems().stream()
                        .map(it -> new com.foodthunder.order.dto.client.RemoteDeductStockItemRequest(it.getFoodId(), it.getQuantity()))
                        .collect(Collectors.toList());
                restaurantClient.restoreStock(new com.foodthunder.order.dto.client.RemoteDeductStockBatchRequest(restoreItems));
                log.info("Restored stock for cancelled order ID={}, itemCount={}", order.getId(), restoreItems.size());
            } catch (Exception ex) {
                log.warn("Failed to restore stock on cancellation for order ID={}: {}", order.getId(), ex.getMessage());
            }
        }
    }

    private void broadcastOrderToMerchant(Order order) {
        try {
            OrderResponse response = mapToOrderResponse(order);
            // 1. Broadcast to merchant topic
            String destination = "/topic/merchant/" + order.getRestaurantId() + "/orders";
            messagingTemplate.convertAndSend(destination, response);

            // 2. Broadcast to customer live tracking topic: /topic/orders/{orderId}
            String orderTrackingDestination = "/topic/orders/" + order.getId();
            messagingTemplate.convertAndSend(orderTrackingDestination, response);

            // 3. Forward to central WebSocket Hub (chat-notification-service)
            if (notificationClient != null) {
                try {
                    notificationClient.broadcastEvent(new com.foodthunder.order.client.NotificationClient.BroadcastRequest(orderTrackingDestination, response));
                    notificationClient.broadcastEvent(new com.foodthunder.order.client.NotificationClient.BroadcastRequest(destination, response));
                } catch (Exception ignored) {}
            }

            log.info("Broadcasted realtime order {} to {} and {}", order.getOrderCode(), destination, orderTrackingDestination);
        } catch (Exception e) {
            log.warn("Failed to broadcast WebSocket order message: {}", e.getMessage());
        }
    }
}
