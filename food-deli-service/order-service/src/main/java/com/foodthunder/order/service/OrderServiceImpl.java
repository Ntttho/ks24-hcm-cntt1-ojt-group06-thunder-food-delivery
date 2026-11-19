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
            OrderStatus.DRIVER_ACCEPTED, Set.of(OrderStatus.PICKING_UP, OrderStatus.DRIVER_REJECTED, OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
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
        List<Integer> selectedToppingIds = new ArrayList<>();

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

            // Check stock quantity (Số lượng còn lại của món ăn)
            Integer availableStock = product.getCurrentQuantity() != null ? product.getCurrentQuantity() : product.getDefaultQuantity();
            if (availableStock != null && availableStock < itemRequest.getQuantity()) {
                throw new BadRequestException("Món ăn '" + product.getName() + "' chỉ còn " + availableStock
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
                    selectedToppingIds.add(toppingDto.getId());

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
        BigDecimal shippingDiscountAmount = BigDecimal.ZERO;
        Integer appliedVoucherId = null;
        String appliedVoucherCode = null;
        Integer appliedSystemVoucherId = null;
        String appliedSystemVoucherCode = null;
        Set<Integer> voucherIdsToRedeem = new LinkedHashSet<>();

        // 4.1 Validate & apply shop voucher + system voucher (both optional, max 1 each)
        boolean isNewUser = isNewUserForVouchers(customerId);
        List<RemoteVoucherValidationResponse> validatedVouchers = new ArrayList<>();

        String primaryCode = resolveVoucherCode(request.getVoucherId(), request.getVoucherCode());
        RemoteVoucherValidationResponse primaryVoucher = null;
        if (primaryCode != null && !primaryCode.isBlank()) {
            primaryVoucher = validateSingleVoucher(
                    primaryCode, targetRestaurantId, subtotal, shippingFee, customerId, isNewUser,
                    "Không thể áp dụng voucher: "
            );
            validatedVouchers.add(primaryVoucher);
        }

        String systemCode = resolveVoucherCode(request.getSystemVoucherId(), request.getSystemVoucherCode());
        if (systemCode != null && !systemCode.isBlank()) {
            boolean isSameAsPrimary = primaryVoucher != null
                    && ((primaryVoucher.getCode() != null && primaryVoucher.getCode().equalsIgnoreCase(systemCode))
                    || (request.getSystemVoucherId() != null && request.getSystemVoucherId().equals(primaryVoucher.getVoucherId())));
            if (!isSameAsPrimary) {
                RemoteVoucherValidationResponse systemVoucher = validateSingleVoucher(
                        systemCode, targetRestaurantId, subtotal, shippingFee, customerId, isNewUser,
                        "Không thể áp dụng voucher toàn hệ thống: "
                );
                if (Boolean.FALSE.equals(systemVoucher.getIsSystemVoucher()) || systemVoucher.getRestaurantId() != null) {
                    throw new BadRequestException("Mã '" + systemVoucher.getCode() + "' là voucher riêng của quán, không thể dùng ở mục Voucher toàn hệ thống");
                }
                if (primaryVoucher != null && Boolean.TRUE.equals(primaryVoucher.getIsSystemVoucher())) {
                    throw new BadRequestException("Mỗi đơn hàng chỉ được áp dụng tối đa 1 voucher toàn hệ thống");
                }
                validatedVouchers.add(systemVoucher);
                appliedSystemVoucherId = systemVoucher.getVoucherId();
                appliedSystemVoucherCode = systemVoucher.getCode();
            }
        }

        if (primaryVoucher != null) {
            appliedVoucherId = primaryVoucher.getVoucherId();
            appliedVoucherCode = primaryVoucher.getCode();
            if (Boolean.TRUE.equals(primaryVoucher.getIsSystemVoucher()) && appliedSystemVoucherId == null) {
                appliedSystemVoucherId = primaryVoucher.getVoucherId();
                appliedSystemVoucherCode = primaryVoucher.getCode();
            }
        } else if (appliedSystemVoucherId != null) {
            appliedVoucherId = appliedSystemVoucherId;
            appliedVoucherCode = appliedSystemVoucherCode;
        }

        BigDecimal remainingShipping = shippingFee;
        BigDecimal foodDiscountAmount = BigDecimal.ZERO;

        for (RemoteVoucherValidationResponse vData : validatedVouchers) {
            if (vData.getVoucherId() != null) {
                voucherIdsToRedeem.add(vData.getVoucherId());
            }
            if ("FREESHIP".equalsIgnoreCase(vData.getVoucherCategory())) {
                BigDecimal rawShip = vData.getShippingDiscountAmount() != null
                        ? vData.getShippingDiscountAmount()
                        : (vData.getDiscountAmount() != null ? vData.getDiscountAmount() : BigDecimal.ZERO);
                BigDecimal appliedShip = rawShip.max(BigDecimal.ZERO).min(remainingShipping);
                remainingShipping = remainingShipping.subtract(appliedShip);
                shippingDiscountAmount = shippingDiscountAmount.add(appliedShip);
            } else {
                BigDecimal rawFood = vData.getDiscountAmount() != null ? vData.getDiscountAmount() : BigDecimal.ZERO;
                foodDiscountAmount = foodDiscountAmount.add(rawFood.max(BigDecimal.ZERO));
            }
        }

        BigDecimal grossTotal = subtotal.add(shippingFee).add(taxAmount);
        BigDecimal totalRequestedDiscount = foodDiscountAmount.add(shippingDiscountAmount);
        BigDecimal effectiveDiscount = totalRequestedDiscount.min(grossTotal);
        discountAmount = effectiveDiscount;

        BigDecimal totalAmount = grossTotal.subtract(effectiveDiscount);
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
                .restaurantName(restaurantDto.getName())
                .restaurantAddress(restaurantDto.getAddress())
                .restaurantPhone("02838383838")
                .voucherId(appliedVoucherId)
                .voucherCode(appliedVoucherCode)
                .systemVoucherId(appliedSystemVoucherId)
                .systemVoucherCode(appliedSystemVoucherCode)
                .receiverAddress(request.getReceiverAddress())
                .note(request.getNote())
                .receiverLat(request.getReceiverLat())
                .receiverLng(request.getReceiverLng())
                .distanceKm(distanceKm)
                .subtotalAmount(subtotal)
                .taxAmount(taxAmount)
                .shippingFee(shippingFee)
                .shippingDiscountAmount(shippingDiscountAmount)
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

        // Deduct product stock and validate toppings via restaurantClient
        if (!stockDeductItems.isEmpty() || !selectedToppingIds.isEmpty()) {
            try {
                restaurantClient.deductStock(new com.foodthunder.order.dto.client.RemoteDeductStockBatchRequest(stockDeductItems, selectedToppingIds));
            } catch (BadRequestException bre) {
                throw bre;
            } catch (Exception ex) {
                log.error("Failed to deduct stock from restaurant-service: {}", ex.getMessage());
                throw new BadRequestException("Không thể trừ số lượng tồn kho của món ăn hoặc xác thực topping: " + ex.getMessage());
            }
        }

        // Redeem voucher usage counters cleanly with compensation on failure
        redeemOrderVouchers(voucherIdsToRedeem, stockDeductItems);

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
                        .restaurantName(order.getRestaurantName() != null ? order.getRestaurantName() : "Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi")
                        .customerName(order.getCustomerName() != null ? order.getCustomerName() : "Khách hàng")
                        .driverName(order.getDriverName() != null && !order.getDriverName().isBlank()
                                ? order.getDriverName()
                                : (order.getDriverId() != null ? ("Tài xế #" + order.getDriverId()) : null))
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
                if (requestingUserId != null && order.getRestaurantId() != null) {
                    try {
                        ResponseEntity<ApiResponse<RemoteRestaurantDto>> res = restaurantClient.getRestaurantDetail(order.getRestaurantId());
                        if (res != null && res.getBody() != null && res.getBody().getData() != null) {
                            RemoteRestaurantDto rest = res.getBody().getData();
                            if (rest.getOwnerId() != null && !rest.getOwnerId().equals(requestingUserId)) {
                                throw new ForbiddenException("Bạn không phải chủ sở hữu của quán ăn này, không có quyền thao tác trên đơn hàng!");
                            }
                        }
                    } catch (ForbiddenException fe) {
                        throw fe;
                    } catch (Exception ex) {
                        log.warn("Could not verify restaurant ownership for restaurantId={}, error: {}", order.getRestaurantId(), ex.getMessage());
                    }
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
            releaseOrderVouchers(order);
        } else if (OrderStatus.DRIVER_ACCEPTED.equals(targetStatus) && requestingUserId != null) {
            order.setDriverId(requestingUserId);
            if (request.getDriverName() != null && !request.getDriverName().isBlank()) {
                order.setDriverName(request.getDriverName().trim());
            } else if (order.getDriverName() == null || order.getDriverName().isBlank()) {
                order.setDriverName("Tài xế #" + requestingUserId);
            }
            if (request.getDriverPhone() != null && !request.getDriverPhone().isBlank()) {
                order.setDriverPhone(request.getDriverPhone().trim());
            } else if (order.getDriverPhone() == null || order.getDriverPhone().isBlank()) {
                order.setDriverPhone("090000000" + requestingUserId);
            }
        } else if (OrderStatus.DRIVER_REJECTED.equals(targetStatus)) {
            // Khi tài xế trả đơn: xóa gán tài xế và chuyển trạng thái về CONFIRMED để tài xế khác có thể nhận trên Radar
            log.info("Driver {} returned/rejected order {}. Resetting driver assignment and transitioning back to CONFIRMED.",
                    requestingUserId, orderId);
            order.setDriverId(null);
            order.setDriverName(null);
            order.setDriverPhone(null);
            targetStatus = OrderStatus.CONFIRMED;
            if (request.getReason() == null || request.getReason().isBlank()) {
                request.setReason("Tài xế đã trả đơn - Trả đơn về hàng đợi điều phối cho tài xế khác tiếp nhận");
            }
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
        String resolvedRestaurantName = order.getRestaurantName();
        if (resolvedRestaurantName == null || resolvedRestaurantName.isBlank()) {
            resolvedRestaurantName = "Quán ăn đối tác";
        }
        String resolvedRestaurantAddress = order.getRestaurantAddress();
        if (resolvedRestaurantAddress == null || resolvedRestaurantAddress.isBlank()) {
            resolvedRestaurantAddress = "123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM";
        }
        Double resolvedRestaurantLat = 10.7551;
        Double resolvedRestaurantLng = 106.6789;

        String resolvedDriverName = order.getDriverName();
        String resolvedDriverPhone = order.getDriverPhone();
        if (order.getDriverId() != null) {
            if (resolvedDriverName == null || resolvedDriverName.isBlank()) {
                resolvedDriverName = "Tài xế Thunder #" + order.getDriverId();
            }
            if (resolvedDriverPhone == null || resolvedDriverPhone.isBlank()) {
                resolvedDriverPhone = "090000000" + order.getDriverId();
            }
        }

        String resolvedCustomerName = order.getCustomerName();
        if (resolvedCustomerName == null || resolvedCustomerName.isBlank()) {
            resolvedCustomerName = (order.getCustomerId() != null)
                    ? "Khách hàng #" + order.getCustomerId()
                    : "Khách hàng";
        }
        String resolvedCustomerPhone = order.getCustomerPhone();
        if (resolvedCustomerPhone == null || resolvedCustomerPhone.isBlank()) {
            resolvedCustomerPhone = (order.getCustomerId() != null)
                    ? "090000000" + order.getCustomerId()
                    : "0900000001";
        }

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
                .customerName(resolvedCustomerName)
                .customerPhone(resolvedCustomerPhone)
                .restaurantId(order.getRestaurantId())
                .restaurantName(resolvedRestaurantName)
                .restaurantAddress(resolvedRestaurantAddress)
                .restaurantLat(resolvedRestaurantLat)
                .restaurantLng(resolvedRestaurantLng)
                .driverId(order.getDriverId())
                .driverName(resolvedDriverName)
                .driverPhone(resolvedDriverPhone)
                .voucherId(order.getVoucherId())
                .voucherCode(order.getVoucherCode())
                .systemVoucherId(order.getSystemVoucherId())
                .systemVoucherCode(order.getSystemVoucherCode())
                .receiverAddress(order.getReceiverAddress())
                .note(order.getNote())
                .receiverLat(order.getReceiverLat())
                .receiverLng(order.getReceiverLng())
                .distanceKm(order.getDistanceKm())
                .subtotalAmount(order.getSubtotalAmount())
                .taxAmount(order.getTaxAmount())
                .shippingFee(order.getShippingFee())
                .shippingDiscountAmount(order.getShippingDiscountAmount())
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

        String role = requestingUserRole != null ? requestingUserRole.replace("ROLE_", "").toUpperCase() : "CUSTOMER";

        if ("CUSTOMER".equalsIgnoreCase(role)) {
            if (requestingUserId != null && !order.getCustomerId().equals(requestingUserId)) {
                throw new BadRequestException("Bạn không có quyền hủy đơn hàng của người khác!");
            }
            if (!OrderStatus.PENDING.equalsIgnoreCase(currentStatus) && !"AWAITING_PAYMENT".equalsIgnoreCase(currentStatus)) {
                throw new BadRequestException("Không thể hủy đơn hàng! Quán ăn đã xác nhận nấu món hoặc đơn đang được vận chuyển.");
            }
            if (order.getCreatedAt() != null) {
                long secondsElapsed = java.time.Duration.between(order.getCreatedAt(), LocalDateTime.now()).getSeconds();
                if (secondsElapsed > 60) {
                    throw new BadRequestException("Đã quá thời gian cho phép hủy đơn (Tối đa 60 giây kể từ khi đặt hàng)!");
                }
            }
        } else if ("MERCHANT".equalsIgnoreCase(role)) {
            if (OrderStatus.DELIVERING.equalsIgnoreCase(currentStatus)
                    || OrderStatus.PICKING_UP.equalsIgnoreCase(currentStatus)) {
                throw new BadRequestException("Không thể hủy đơn hàng! Đơn đã có tài xế tiếp nhận hoặc đang giao hàng.");
            }
            if (requestingUserId != null && order.getRestaurantId() != null) {
                try {
                    ResponseEntity<ApiResponse<RemoteRestaurantDto>> res = restaurantClient.getRestaurantDetail(order.getRestaurantId());
                    if (res != null && res.getBody() != null && res.getBody().getData() != null) {
                        RemoteRestaurantDto rest = res.getBody().getData();
                        if (rest.getOwnerId() != null && !rest.getOwnerId().equals(requestingUserId)) {
                            throw new ForbiddenException("Bạn không phải chủ sở hữu của quán ăn này, không có quyền hủy đơn hàng!");
                        }
                    }
                } catch (ForbiddenException fe) {
                    throw fe;
                } catch (Exception ex) {
                    log.warn("Could not verify restaurant ownership in cancelOrder for restaurantId={}, error: {}", order.getRestaurantId(), ex.getMessage());
                }
            }
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
        releaseOrderVouchers(order);

        Order saved = orderRepository.save(order);
        log.info("Order ID={} cancelled with reason: {}", orderId, reason);

        broadcastOrderToMerchant(saved);

        return mapToOrderResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherEligibilityResponse getVoucherEligibility(Integer customerId) {
        if (customerId == null) {
            return VoucherEligibilityResponse.builder()
                    .isNewUser(true)
                    .priorOrderCount(0L)
                    .build();
        }
        long priorOrders = orderRepository.countByCustomerIdAndDeletedAtIsNullAndStatus_CodeNotIn(
                customerId,
                List.of(OrderStatus.CANCELLED, OrderStatus.TIMEOUT)
        );
        return VoucherEligibilityResponse.builder()
                .isNewUser(priorOrders == 0)
                .priorOrderCount(priorOrders)
                .build();
    }

    private boolean isNewUserForVouchers(Integer customerId) {
        if (customerId == null) {
            return true;
        }
        return !orderRepository.existsByCustomerIdAndDeletedAtIsNullAndStatus_CodeNotIn(
                customerId,
                List.of(OrderStatus.CANCELLED, OrderStatus.TIMEOUT)
        );
    }

    private String resolveVoucherCode(Integer voucherId, String voucherCode) {
        if (voucherCode != null && !voucherCode.isBlank()) {
            return voucherCode.trim().toUpperCase(Locale.ROOT);
        }
        if (voucherId == null) {
            return null;
        }
        try {
            ResponseEntity<ApiResponse<RemoteVoucherValidationResponse>> vRes = restaurantClient.getVoucherById(voucherId);
            if (vRes != null && vRes.getBody() != null && vRes.getBody().getData() != null) {
                String code = vRes.getBody().getData().getCode();
                return code != null ? code.trim().toUpperCase(Locale.ROOT) : null;
            }
        } catch (Exception ex) {
            log.warn("Could not fetch voucher by id {}: {}", voucherId, ex.getMessage());
        }
        throw new BadRequestException("Không tìm thấy thông tin mã voucher ID=" + voucherId);
    }

    private RemoteVoucherValidationResponse validateSingleVoucher(
            String voucherCode,
            Integer targetRestaurantId,
            BigDecimal subtotal,
            BigDecimal shippingFee,
            Integer customerId,
            boolean isNewUser,
            String errorPrefix
    ) {
        RemoteValidateVoucherRequest vReq = RemoteValidateVoucherRequest.builder()
                .code(voucherCode)
                .restaurantId(targetRestaurantId)
                .orderAmount(subtotal)
                .shippingFee(shippingFee)
                .customerId(customerId)
                .isNewUser(isNewUser)
                .build();

        try {
            ResponseEntity<ApiResponse<RemoteVoucherValidationResponse>> vRes = restaurantClient.validateVoucher(vReq);
            RemoteVoucherValidationResponse vData = (vRes != null && vRes.getBody() != null) ? vRes.getBody().getData() : null;
            if (vData == null || !Boolean.TRUE.equals(vData.getIsValid())) {
                String errMsg = (vData != null && vData.getMessage() != null)
                        ? vData.getMessage()
                        : "Mã voucher không hợp lệ";
                throw new BadRequestException(errorPrefix + errMsg);
            }
            return vData;
        } catch (BadRequestException bre) {
            throw bre;
        } catch (Exception ex) {
            log.error("Error validating voucher with restaurant-service: {}", ex.getMessage());
            throw new BadRequestException("Lỗi xác thực mã voucher: " + ex.getMessage());
        }
    }

    private void redeemOrderVouchers(
            Set<Integer> voucherIdsToRedeem,
            List<com.foodthunder.order.dto.client.RemoteDeductStockItemRequest> stockDeductItems
    ) {
        if (voucherIdsToRedeem == null || voucherIdsToRedeem.isEmpty()) {
            return;
        }
        List<Integer> redeemedSoFar = new ArrayList<>();
        for (Integer voucherId : voucherIdsToRedeem) {
            try {
                ResponseEntity<ApiResponse<Void>> res = restaurantClient.redeemVoucher(voucherId);
                if (res != null && res.getBody() != null && res.getBody().getStatus() >= 400) {
                    throw new BadRequestException(res.getBody().getMessage() != null
                            ? res.getBody().getMessage()
                            : "Không thể sử dụng voucher ID=" + voucherId);
                }
                redeemedSoFar.add(voucherId);
            } catch (BadRequestException bre) {
                compensateVoucherAndStock(redeemedSoFar, stockDeductItems);
                throw bre;
            } catch (Exception ex) {
                compensateVoucherAndStock(redeemedSoFar, stockDeductItems);
                throw new BadRequestException("Không thể ghi nhận lượt sử dụng voucher: " + ex.getMessage());
            }
        }
    }

    private void compensateVoucherAndStock(
            List<Integer> redeemedVoucherIds,
            List<com.foodthunder.order.dto.client.RemoteDeductStockItemRequest> stockDeductItems
    ) {
        for (Integer id : redeemedVoucherIds) {
            try {
                restaurantClient.releaseVoucher(id);
            } catch (Exception ex) {
                log.warn("Failed to release voucher ID={} during compensation: {}", id, ex.getMessage());
            }
        }
        if (stockDeductItems != null && !stockDeductItems.isEmpty()) {
            try {
                restaurantClient.restoreStock(new com.foodthunder.order.dto.client.RemoteDeductStockBatchRequest(stockDeductItems));
            } catch (Exception ex) {
                log.warn("Failed to restore stock during voucher compensation: {}", ex.getMessage());
            }
        }
    }

    private void releaseOrderVouchers(Order order) {
        Set<Integer> idsToRelease = new LinkedHashSet<>();
        if (order.getVoucherId() != null) {
            idsToRelease.add(order.getVoucherId());
        }
        if (order.getSystemVoucherId() != null) {
            idsToRelease.add(order.getSystemVoucherId());
        }
        for (Integer id : idsToRelease) {
            try {
                restaurantClient.releaseVoucher(id);
            } catch (Exception ex) {
                log.warn("Failed to release voucher ID={} on order cancellation {}: {}", id, order.getId(), ex.getMessage());
            }
        }
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

            // 4. When order is CONFIRMED (ready for driver pickup), broadcast to driver available pool
            if (order.getStatus() != null && OrderStatus.CONFIRMED.equalsIgnoreCase(order.getStatus().getCode())) {
                String driverAvailableDestination = "/topic/drivers/available-orders";
                if (messagingTemplate != null) {
                    messagingTemplate.convertAndSend(driverAvailableDestination, response);
                }
                if (notificationClient != null) {
                    try {
                        notificationClient.broadcastEvent(new com.foodthunder.order.client.NotificationClient.BroadcastRequest(driverAvailableDestination, response));
                    } catch (Exception ignored) {}
                }
                log.info("Broadcasted CONFIRMED order {} to driver available channel {}", order.getOrderCode(), driverAvailableDestination);
            }

            log.info("Broadcasted realtime order {} to {} and {}", order.getOrderCode(), destination, orderTrackingDestination);
        } catch (Exception e) {
            log.warn("Failed to broadcast WebSocket order message: {}", e.getMessage());
        }
    }
}
