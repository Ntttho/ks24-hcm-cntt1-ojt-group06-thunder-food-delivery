package com.foodthunder.order.service;

import com.foodthunder.order.dto.CreateOrderRequest;
import com.foodthunder.order.dto.OrderResponse;
import com.foodthunder.order.dto.PageResponse;
import com.foodthunder.order.dto.UpdateOrderStatusRequest;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request, Integer customerId);

    PageResponse<OrderResponse> getMyOrders(Integer customerId, int page, int size);

    OrderResponse getOrderById(Long orderId, Integer requestingUserId, String requestingUserRole);

    PageResponse<OrderResponse> getOrders(Integer restaurantId, Integer driverId, String statusCode, String keyword, int page, int size);

    OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, Integer requestingUserId, String requestingUserRole);

    OrderResponse confirmPaymentSuccess(Long orderId, String transactionNo);

    OrderResponse cancelOrder(Long orderId, String reason, Integer requestingUserId, String requestingUserRole);
}
