package com.foodthunder.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.order.dto.*;
import com.foodthunder.order.service.OrderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("POST /api/v1/orders trả về 201 Created và dữ liệu đơn hàng khi input hợp lệ")
    void testCreateOrderEndpoint_Success() throws Exception {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(10)
                .receiverAddress("Keangnam Tower, Hà Nội")
                .distanceKm(2.5)
                .items(List.of(
                        CreateOrderItemRequest.builder().foodId(101).quantity(2).build()
                ))
                .build();

        OrderResponse response = OrderResponse.builder()
                .id(9999L)
                .orderCode("ORD-20261101-9999")
                .restaurantId(10)
                .customerId(1)
                .statusCode("PENDING")
                .statusLabel("Chờ xác nhận")
                .totalAmount(BigDecimal.valueOf(115000))
                .build();

        when(orderService.createOrder(any(CreateOrderRequest.class), eq(1))).thenReturn(response);

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.id").value(9999))
                .andExpect(jsonPath("$.data.orderCode").value("ORD-20261101-9999"))
                .andExpect(jsonPath("$.data.statusCode").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/v1/orders trả về 400 Bad Request khi thiếu trường bắt buộc")
    void testCreateOrderEndpoint_ValidationFailure() throws Exception {
        // Thiếu restaurantId và items rỗng
        CreateOrderRequest invalidRequest = CreateOrderRequest.builder()
                .receiverAddress("Keangnam Tower")
                .build();

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.data.restaurantId").exists())
                .andExpect(jsonPath("$.data.items").exists());
    }

    @Test
    @DisplayName("GET /api/v1/orders/my-orders trả về 200 OK với danh sách đơn của khách")
    void testGetMyOrdersEndpoint_Success() throws Exception {
        OrderResponse o = OrderResponse.builder()
                .id(1L)
                .orderCode("ORD-001")
                .totalAmount(BigDecimal.valueOf(50000))
                .build();

        PageResponse<OrderResponse> pageResponse = PageResponse.<OrderResponse>builder()
                .content(List.of(o))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .build();

        when(orderService.getMyOrders(eq(5), eq(0), eq(10))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/orders/my-orders")
                        .header("X-User-Id", "5")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content[0].id").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{id} trả về 200 OK và chi tiết đơn hàng")
    void testGetOrderDetailEndpoint_Success() throws Exception {
        OrderResponse response = OrderResponse.builder()
                .id(100L)
                .orderCode("ORD-100")
                .statusCode("CONFIRMED")
                .build();

        when(orderService.getOrderById(eq(100L), eq(2), eq("ROLE_MERCHANT"))).thenReturn(response);

        mockMvc.perform(get("/api/v1/orders/100")
                        .header("X-User-Id", "2")
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.statusCode").value("CONFIRMED"));
    }

    @Test
    @DisplayName("PUT /api/v1/orders/{id}/status trả về 200 OK khi cập nhật trạng thái hợp lệ")
    void testUpdateOrderStatusEndpoint_Success() throws Exception {
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .statusCode("CONFIRMED")
                .reason("Quán đã nhận đơn")
                .build();

        OrderResponse response = OrderResponse.builder()
                .id(100L)
                .statusCode("CONFIRMED")
                .build();

        when(orderService.updateOrderStatus(eq(100L), any(UpdateOrderStatusRequest.class), eq(2), eq("ROLE_MERCHANT")))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/orders/100/status")
                        .header("X-User-Id", "2")
                        .header("X-User-Role", "ROLE_MERCHANT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.statusCode").value("CONFIRMED"));
    }
}
