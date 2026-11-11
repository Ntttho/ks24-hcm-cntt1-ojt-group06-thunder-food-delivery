package com.foodthunder.order.service;

import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.*;
import com.foodthunder.order.dto.client.RemoteProductDto;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.dto.client.RemoteToppingDto;
import com.foodthunder.order.dto.client.RemoteValidateVoucherRequest;
import com.foodthunder.order.dto.client.RemoteVoucherValidationResponse;
import com.foodthunder.order.entity.Order;
import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.exception.BadRequestException;
import com.foodthunder.order.exception.ConflictException;
import com.foodthunder.order.exception.ForbiddenException;
import com.foodthunder.order.repository.OrderRepository;
import com.foodthunder.order.repository.OrderStatusLogRepository;
import com.foodthunder.order.repository.OrderStatusRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderStatusRepository orderStatusRepository;

    @Mock
    private OrderStatusLogRepository orderStatusLogRepository;

    @Mock
    private RestaurantClient restaurantClient;

    @InjectMocks
    private OrderServiceImpl orderService;

    private OrderStatus awaitingPaymentStatus;
    private OrderStatus pendingStatus;
    private OrderStatus confirmedStatus;
    private OrderStatus driverAcceptedStatus;
    private OrderStatus pickingUpStatus;
    private OrderStatus deliveringStatus;
    private OrderStatus completedStatus;
    private OrderStatus cancelledStatus;
    private RemoteRestaurantDto validRestaurantDto;

    @BeforeEach
    void setUp() {
        awaitingPaymentStatus = OrderStatus.builder().id(0).code(OrderStatus.AWAITING_PAYMENT).label("Chờ thanh toán VNPay").build();
        pendingStatus = OrderStatus.builder().id(1).code(OrderStatus.PENDING).label("Chờ xác nhận").build();
        confirmedStatus = OrderStatus.builder().id(4).code(OrderStatus.CONFIRMED).label("Đã xác nhận").build();
        driverAcceptedStatus = OrderStatus.builder().id(2).code(OrderStatus.DRIVER_ACCEPTED).label("Tài xế đã nhận").build();
        pickingUpStatus = OrderStatus.builder().id(5).code(OrderStatus.PICKING_UP).label("Đang lấy hàng").build();
        deliveringStatus = OrderStatus.builder().id(6).code(OrderStatus.DELIVERING).label("Đang giao hàng").build();
        completedStatus = OrderStatus.builder().id(7).code(OrderStatus.COMPLETED).label("Hoàn thành").build();
        cancelledStatus = OrderStatus.builder().id(8).code(OrderStatus.CANCELLED).label("Đã hủy").build();

        validRestaurantDto = RemoteRestaurantDto.builder()
                .id(10)
                .name("Quán Ăn Ngon")
                .isOpen(true)
                .approvalStatus("APPROVED")
                .build();
    }

    @Test
    @DisplayName("Tạo đơn hàng COD thành công khi quán hợp lệ và tất cả món cùng thuộc 1 quán")
    void testCreateOrder_Success() {
        // Given
        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(10)
                .receiverAddress("123 Phố Huế, Hà Nội")
                .distanceKm(3.2)
                .idempotencyKey("KEY-123456")
                .paymentMethod("COD")
                .items(List.of(
                        CreateOrderItemRequest.builder()
                                .foodId(101)
                                .quantity(2)
                                .toppings(List.of(
                                        CreateOrderItemToppingRequest.builder().toppingId(1).quantity(1).build()
                                ))
                                .build()
                ))
                .build();

        RemoteToppingDto toppingDto = RemoteToppingDto.builder()
                .id(1)
                .name("Trân Châu Đen")
                .price(BigDecimal.valueOf(10000))
                .isAvailable(true)
                .build();

        RemoteProductDto productDto = RemoteProductDto.builder()
                .id(101)
                .name("Trà Sữa Ô Long")
                .price(BigDecimal.valueOf(45000))
                .restaurantId(10)
                .isAvailable(true)
                .toppings(List.of(toppingDto))
                .build();

        when(orderRepository.findByIdempotencyKey("KEY-123456")).thenReturn(Optional.empty());
        when(restaurantClient.getRestaurantDetail(10)).thenReturn(ResponseEntity.ok(ApiResponse.success(validRestaurantDto)));
        when(restaurantClient.getProductDetail(101)).thenReturn(ResponseEntity.ok(ApiResponse.success(productDto)));
        when(orderStatusRepository.findByCode(OrderStatus.PENDING)).thenReturn(Optional.of(pendingStatus));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(5001L);
            return o;
        });

        // When
        OrderResponse response = orderService.createOrder(request, 1);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(5001L);
        assertThat(response.getStatusCode()).isEqualTo(OrderStatus.PENDING);
        assertThat(response.getPaymentMethod()).isEqualTo("COD");
        assertThat(response.getRestaurantId()).isEqualTo(10);
        // Subtotal: (45000 * 2) + (10000 * 1 * 2) = 110,000
        assertThat(response.getSubtotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(110000));
        // Distance 3.2km: base 15,000 + ceil(1.2)*5,000 = 25,000
        assertThat(response.getShippingFee()).isEqualByComparingTo(BigDecimal.valueOf(25000));
        // Total: 110,000 + 25,000 = 135,000
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(135000));
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getFoodName()).isEqualTo("Trà Sữa Ô Long");
        assertThat(response.getItems().get(0).getToppings()).hasSize(1);
    }

    @Test
    @DisplayName("Tạo đơn hàng VNPay thành công và lưu trạng thái ban đầu là AWAITING_PAYMENT")
    void testCreateOrder_VNPay_Success() {
        // Given
        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(10)
                .receiverAddress("123 Phố Huế, Hà Nội")
                .distanceKm(2.0)
                .idempotencyKey("KEY-VNPAY-01")
                .paymentMethod("VNPAY")
                .items(List.of(
                        CreateOrderItemRequest.builder().foodId(101).quantity(1).build()
                ))
                .build();

        RemoteProductDto productDto = RemoteProductDto.builder()
                .id(101)
                .name("Trà Sữa Ô Long")
                .price(BigDecimal.valueOf(45000))
                .restaurantId(10)
                .isAvailable(true)
                .build();

        when(orderRepository.findByIdempotencyKey("KEY-VNPAY-01")).thenReturn(Optional.empty());
        when(restaurantClient.getRestaurantDetail(10)).thenReturn(ResponseEntity.ok(ApiResponse.success(validRestaurantDto)));
        when(restaurantClient.getProductDetail(101)).thenReturn(ResponseEntity.ok(ApiResponse.success(productDto)));
        when(orderStatusRepository.findByCode(OrderStatus.AWAITING_PAYMENT)).thenReturn(Optional.of(awaitingPaymentStatus));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(6001L);
            return o;
        });

        // When
        OrderResponse response = orderService.createOrder(request, 1);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(6001L);
        assertThat(response.getStatusCode()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
        assertThat(response.getPaymentMethod()).isEqualTo("VNPAY");
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(60000)); // 45k + 15k ship
    }

    @Test
    @DisplayName("Ném lỗi BadRequest khi quán ăn đang đóng cửa (isOpen = false)")
    void testCreateOrder_RestaurantClosed_ThrowsBadRequest() {
        // Given
        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(10)
                .receiverAddress("123 Phố Huế")
                .items(List.of(CreateOrderItemRequest.builder().foodId(101).quantity(1).build()))
                .build();

        RemoteRestaurantDto closedRestaurant = RemoteRestaurantDto.builder()
                .id(10)
                .name("Quán Trà Đóng Cửa")
                .isOpen(false)
                .approvalStatus("APPROVED")
                .build();

        when(restaurantClient.getRestaurantDetail(10)).thenReturn(ResponseEntity.ok(ApiResponse.success(closedRestaurant)));

        // When & Then
        assertThatThrownBy(() -> orderService.createOrder(request, 1))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đang đóng cửa");

        verify(restaurantClient, never()).getProductDetail(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném lỗi BadRequest khi món ăn trong giỏ thuộc quán ăn khác nhau")
    void testCreateOrder_MultipleRestaurants_ThrowsBadRequest() {
        // Given
        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(10)
                .receiverAddress("123 Phố Huế, Hà Nội")
                .items(List.of(
                        CreateOrderItemRequest.builder().foodId(101).quantity(1).build()
                ))
                .build();

        RemoteProductDto productDifferentShop = RemoteProductDto.builder()
                .id(101)
                .name("Bún Bò Huế")
                .price(BigDecimal.valueOf(50000))
                .restaurantId(99) // Belongs to different restaurant!
                .isAvailable(true)
                .build();

        when(restaurantClient.getRestaurantDetail(10)).thenReturn(ResponseEntity.ok(ApiResponse.success(validRestaurantDto)));
        when(restaurantClient.getProductDetail(101)).thenReturn(ResponseEntity.ok(ApiResponse.success(productDifferentShop)));

        // When & Then
        assertThatThrownBy(() -> orderService.createOrder(request, 1))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("quán ăn khác");

        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Idempotency key trùng lặp thì trả về đơn đã tạo và không tạo bản ghi mới")
    void testCreateOrder_IdempotencyDuplicate_ReturnsExistingOrder() {
        // Given
        Order existing = Order.builder()
                .id(888L)
                .orderCode("ORD-20261101-888")
                .idempotencyKey("KEY-REPEAT")
                .customerId(1)
                .restaurantId(10)
                .status(pendingStatus)
                .totalAmount(BigDecimal.valueOf(100000))
                .paymentMethod("COD")
                .build();

        when(orderRepository.findByIdempotencyKey("KEY-REPEAT")).thenReturn(Optional.of(existing));

        CreateOrderRequest request = CreateOrderRequest.builder()
                .idempotencyKey("KEY-REPEAT")
                .restaurantId(10)
                .receiverAddress("Address")
                .items(List.of(CreateOrderItemRequest.builder().foodId(101).quantity(1).build()))
                .build();

        // When
        OrderResponse response = orderService.createOrder(request, 1);

        // Then
        assertThat(response.getId()).isEqualTo(888L);
        assertThat(response.getOrderCode()).isEqualTo("ORD-20261101-888");
        verify(restaurantClient, never()).getRestaurantDetail(any());
        verify(restaurantClient, never()).getProductDetail(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Chuyển trạng thái Order State Machine hợp lệ qua các bước tuần tự với Pessimistic Lock")
    void testUpdateOrderStatus_ValidStateMachineWorkflow() {
        // Given
        Order order = Order.builder()
                .id(1L)
                .orderCode("ORD-001")
                .customerId(1)
                .restaurantId(10)
                .status(pendingStatus)
                .build();

        when(orderRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
        when(orderStatusRepository.findByCode(OrderStatus.CONFIRMED)).thenReturn(Optional.of(confirmedStatus));
        when(orderStatusRepository.findByCode(OrderStatus.DRIVER_ACCEPTED)).thenReturn(Optional.of(driverAcceptedStatus));
        when(orderStatusRepository.findByCode(OrderStatus.PICKING_UP)).thenReturn(Optional.of(pickingUpStatus));
        when(orderStatusRepository.findByCode(OrderStatus.DELIVERING)).thenReturn(Optional.of(deliveringStatus));
        when(orderStatusRepository.findByCode(OrderStatus.COMPLETED)).thenReturn(Optional.of(completedStatus));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        // 1. PENDING -> CONFIRMED (Merchant xác nhận)
        OrderResponse res1 = orderService.updateOrderStatus(1L,
                UpdateOrderStatusRequest.builder().statusCode(OrderStatus.CONFIRMED).reason("Quán nhận đơn").build(), 2, "ROLE_MERCHANT");
        assertThat(res1.getStatusCode()).isEqualTo(OrderStatus.CONFIRMED);

        // 2. CONFIRMED -> DRIVER_ACCEPTED (Driver nhận đơn)
        OrderResponse res2 = orderService.updateOrderStatus(1L,
                UpdateOrderStatusRequest.builder().statusCode(OrderStatus.DRIVER_ACCEPTED).reason("Tài xế nhận cuốc").build(), 3, "ROLE_DRIVER");
        assertThat(res2.getStatusCode()).isEqualTo(OrderStatus.DRIVER_ACCEPTED);
        assertThat(res2.getDriverId()).isEqualTo(3);

        // 3. DRIVER_ACCEPTED -> PICKING_UP (Driver tới quán)
        OrderResponse res3 = orderService.updateOrderStatus(1L,
                UpdateOrderStatusRequest.builder().statusCode(OrderStatus.PICKING_UP).reason("Đã đến quán lấy đồ").build(), 3, "ROLE_DRIVER");
        assertThat(res3.getStatusCode()).isEqualTo(OrderStatus.PICKING_UP);

        // 4. PICKING_UP -> DELIVERING (Driver đang giao)
        OrderResponse res4 = orderService.updateOrderStatus(1L,
                UpdateOrderStatusRequest.builder().statusCode(OrderStatus.DELIVERING).reason("Đang đi giao").build(), 3, "ROLE_DRIVER");
        assertThat(res4.getStatusCode()).isEqualTo(OrderStatus.DELIVERING);

        // 5. DELIVERING -> COMPLETED (Driver giao thành công)
        OrderResponse res5 = orderService.updateOrderStatus(1L,
                UpdateOrderStatusRequest.builder().statusCode(OrderStatus.COMPLETED).reason("Giao thành công").build(), 3, "ROLE_DRIVER");
        assertThat(res5.getStatusCode()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    @DisplayName("Khách hàng hủy đơn ở trạng thái PENDING thành công")
    void testUpdateOrderStatus_CustomerCancelsPending_Success() {
        // Given
        Order order = Order.builder()
                .id(1L)
                .orderCode("ORD-001")
                .customerId(10)
                .restaurantId(10)
                .status(pendingStatus)
                .build();

        when(orderRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
        when(orderStatusRepository.findByCode(OrderStatus.CANCELLED)).thenReturn(Optional.of(cancelledStatus));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse res = orderService.updateOrderStatus(1L,
                UpdateOrderStatusRequest.builder().statusCode(OrderStatus.CANCELLED).reason("Khách đổi ý").build(), 10, "ROLE_CUSTOMER");

        assertThat(res.getStatusCode()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getCancelledByUserId()).isEqualTo(10);
    }

    @Test
    @DisplayName("Ném lỗi Forbidden khi khách hàng cố tình chuyển trạng thái sang CONFIRMED")
    void testUpdateOrderStatus_CustomerCannotConfirm_ThrowsForbidden() {
        // Given
        Order order = Order.builder()
                .id(1L)
                .customerId(10)
                .status(pendingStatus)
                .build();

        when(orderRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = UpdateOrderStatusRequest.builder()
                .statusCode(OrderStatus.CONFIRMED)
                .build();

        assertThatThrownBy(() -> orderService.updateOrderStatus(1L, req, 10, "ROLE_CUSTOMER"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("không có quyền");
    }

    @Test
    @DisplayName("Ném lỗi BadRequest khi chuyển nhảy cóc trạng thái không hợp lệ trong State Machine")
    void testUpdateOrderStatus_InvalidTransition_ThrowsBadRequest() {
        // Given: Đơn hàng đang ở PENDING
        Order order = Order.builder()
                .id(1L)
                .customerId(1)
                .status(pendingStatus)
                .build();

        when(orderRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(order));

        // Cố tình chuyển thẳng từ PENDING sang COMPLETED (Admin)
        UpdateOrderStatusRequest invalidRequest = UpdateOrderStatusRequest.builder()
                .statusCode(OrderStatus.COMPLETED)
                .build();

        // When & Then
        assertThatThrownBy(() -> orderService.updateOrderStatus(1L, invalidRequest, 999, "ROLE_ADMIN"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể chuyển trạng thái");
    }

    @Test
    @DisplayName("Ném lỗi BadRequest khi cố chuyển trạng thái từ trạng thái kết thúc (Terminal State COMPLETED)")
    void testUpdateOrderStatus_FromTerminalState_ThrowsBadRequest() {
        // Given: Đơn hàng đã COMPLETED
        Order order = Order.builder()
                .id(1L)
                .customerId(1)
                .status(completedStatus)
                .build();

        when(orderRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest cancelRequest = UpdateOrderStatusRequest.builder()
                .statusCode(OrderStatus.CANCELLED)
                .reason("Cố hủy đơn đã xong")
                .build();

        // When & Then
        assertThatThrownBy(() -> orderService.updateOrderStatus(1L, cancelRequest, 999, "ROLE_ADMIN"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể chuyển trạng thái");
    }

    @Test
    @DisplayName("Tạo đơn hàng với mã voucher hợp lệ thì tính tiền chiết khấu chính xác")
    void testCreateOrder_WithValidVoucher_AppliesDiscount() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(10)
                .receiverAddress("123 Phố Huế, Hà Nội")
                .distanceKm(2.0)
                .paymentMethod("COD")
                .voucherCode("GIAM20K")
                .items(List.of(
                        CreateOrderItemRequest.builder()
                                .foodId(101)
                                .quantity(2)
                                .build()
                ))
                .build();

        RemoteProductDto productDto = RemoteProductDto.builder()
                .id(101)
                .name("Trà Sữa Ô Long")
                .price(BigDecimal.valueOf(50000))
                .restaurantId(10)
                .isAvailable(true)
                .toppings(List.of())
                .build();

        when(restaurantClient.getRestaurantDetail(10)).thenReturn(ResponseEntity.ok(ApiResponse.success(validRestaurantDto)));
        when(restaurantClient.getProductDetail(101)).thenReturn(ResponseEntity.ok(ApiResponse.success(productDto)));
        when(orderStatusRepository.findByCode(OrderStatus.PENDING)).thenReturn(Optional.of(pendingStatus));

        RemoteVoucherValidationResponse vResponse = RemoteVoucherValidationResponse.builder()
                .voucherId(99)
                .code("GIAM20K")
                .discountType("FIXED")
                .discountAmount(BigDecimal.valueOf(20000))
                .isValid(true)
                .message("Áp dụng thành công")
                .build();
        when(restaurantClient.validateVoucher(any(RemoteValidateVoucherRequest.class)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(vResponse)));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1001L);
            return o;
        });

        OrderResponse response = orderService.createOrder(request, 1);

        assertThat(response).isNotNull();
        assertThat(response.getSubtotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(100000));
        assertThat(response.getDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(20000));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(95000));
        assertThat(response.getVoucherId()).isEqualTo(99);
    }

    @Test
    @DisplayName("Ném BadRequestException khi mã voucher không hợp lệ lúc tạo đơn")
    void testCreateOrder_WithInvalidVoucher_ThrowsBadRequest() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(10)
                .receiverAddress("123 Phố Huế, Hà Nội")
                .distanceKm(2.0)
                .paymentMethod("COD")
                .voucherCode("EXPIRED_VOUCHER")
                .items(List.of(
                        CreateOrderItemRequest.builder()
                                .foodId(101)
                                .quantity(1)
                                .build()
                ))
                .build();

        RemoteProductDto productDto = RemoteProductDto.builder()
                .id(101)
                .name("Trà Sữa Ô Long")
                .price(BigDecimal.valueOf(50000))
                .restaurantId(10)
                .isAvailable(true)
                .toppings(List.of())
                .build();

        when(restaurantClient.getRestaurantDetail(10)).thenReturn(ResponseEntity.ok(ApiResponse.success(validRestaurantDto)));
        when(restaurantClient.getProductDetail(101)).thenReturn(ResponseEntity.ok(ApiResponse.success(productDto)));

        RemoteVoucherValidationResponse vResponse = RemoteVoucherValidationResponse.builder()
                .code("EXPIRED_VOUCHER")
                .isValid(false)
                .message("Mã giảm giá đã hết hạn")
                .build();
        when(restaurantClient.validateVoucher(any(RemoteValidateVoucherRequest.class)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(vResponse)));

        assertThatThrownBy(() -> orderService.createOrder(request, 1))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể áp dụng voucher");
    }

    @Test
    @DisplayName("Ném lỗi ConflictException (409) khi tài xế khác bấm nhận đơn đã có tài xế nhận trước")
    void testUpdateOrderStatus_SecondDriverAcceptSameOrder_ThrowsConflict() {
        Order order = Order.builder()
                .id(10L)
                .orderCode("ORD-010")
                .customerId(1)
                .restaurantId(10)
                .driverId(2)
                .status(driverAcceptedStatus)
                .build();

        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest acceptRequest = UpdateOrderStatusRequest.builder()
                .statusCode(OrderStatus.DRIVER_ACCEPTED)
                .reason("Tài xế #4 nhận đơn")
                .build();

        assertThatThrownBy(() -> orderService.updateOrderStatus(10L, acceptRequest, 4, "ROLE_DRIVER"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("đã được một tài xế khác nhận trước");

        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném lỗi ForbiddenException khi tài xế không phụ trách đơn cố cập nhật tiến trình giao")
    void testUpdateOrderStatus_OtherDriverUpdatesStep_ThrowsForbidden() {
        Order order = Order.builder()
                .id(11L)
                .orderCode("ORD-011")
                .customerId(1)
                .restaurantId(10)
                .driverId(2)
                .status(driverAcceptedStatus)
                .build();

        when(orderRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest pickupRequest = UpdateOrderStatusRequest.builder()
                .statusCode(OrderStatus.PICKING_UP)
                .build();

        assertThatThrownBy(() -> orderService.updateOrderStatus(11L, pickupRequest, 4, "ROLE_DRIVER"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("không phải tài xế phụ trách");

        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tài xế phụ trách có thể trả đơn (DRIVER_REJECTED) kèm lý do và giữ driverId để lưu lịch sử")
    void testUpdateOrderStatus_DriverRejectsAcceptedOrder_Success() {
        OrderStatus driverRejectedStatus = OrderStatus.builder()
                .id(3)
                .code(OrderStatus.DRIVER_REJECTED)
                .label("Tài xế từ chối")
                .build();

        Order order = Order.builder()
                .id(12L)
                .orderCode("ORD-012")
                .customerId(1)
                .restaurantId(10)
                .driverId(2)
                .status(driverAcceptedStatus)
                .build();

        when(orderRepository.findByIdForUpdate(12L)).thenReturn(Optional.of(order));
        when(orderStatusRepository.findByCode(OrderStatus.DRIVER_REJECTED)).thenReturn(Optional.of(driverRejectedStatus));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        UpdateOrderStatusRequest rejectRequest = UpdateOrderStatusRequest.builder()
                .statusCode(OrderStatus.DRIVER_REJECTED)
                .reason("Xe hỏng giữa đường")
                .build();

        OrderResponse res = orderService.updateOrderStatus(12L, rejectRequest, 2, "ROLE_DRIVER");

        assertThat(res.getStatusCode()).isEqualTo(OrderStatus.DRIVER_REJECTED);
        assertThat(res.getDriverId()).isEqualTo(2);
    }
}
