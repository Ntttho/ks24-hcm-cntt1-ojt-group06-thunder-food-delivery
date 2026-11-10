package com.foodthunder.delivery.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.delivery.dto.request.DriverLocationRequest;
import com.foodthunder.delivery.dto.request.UpdateDeliveryStepRequest;
import com.foodthunder.delivery.dto.response.AcceptOrderResponse;
import com.foodthunder.delivery.dto.response.DriverLocationResponse;
import com.foodthunder.delivery.dto.response.DriverStatusResponse;
import com.foodthunder.delivery.exception.ConflictException;
import com.foodthunder.delivery.service.DeliveryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DeliveryController.class)
@AutoConfigureMockMvc(addFilters = false)
class DeliveryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DeliveryService deliveryService;

    @Test
    @DisplayName("POST /api/v1/deliveries/orders/{orderId}/accept trả về 200 OK khi nhận đơn thành công")
    void testAcceptOrderEndpoint_Success() throws Exception {
        AcceptOrderResponse resp = AcceptOrderResponse.builder()
                .offerId(1L)
                .orderId(500L)
                .driverId(101)
                .status("ACCEPTED")
                .respondedAt(LocalDateTime.now())
                .build();

        when(deliveryService.acceptOrder(101, 500L)).thenReturn(resp);

        mockMvc.perform(post("/api/v1/deliveries/orders/500/accept")
                        .header("X-User-Id", "101")
                        .header("X-User-Role", "ROLE_DRIVER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.orderId").value(500))
                .andExpect(jsonPath("$.data.driverId").value(101))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test
    @DisplayName("POST /api/v1/deliveries/orders/{orderId}/accept trả về 409 Conflict khi đơn đã có tài xế khác nhận trước")
    void testAcceptOrderEndpoint_Conflict_AlreadyAccepted() throws Exception {
        when(deliveryService.acceptOrder(102, 500L))
                .thenThrow(new ConflictException("Đơn hàng này đã được một tài xế khác nhanh tay nhận trước. Vui lòng chọn đơn khác!"));

        mockMvc.perform(post("/api/v1/deliveries/orders/500/accept")
                        .header("X-User-Id", "102")
                        .header("X-User-Role", "ROLE_DRIVER"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Đơn hàng này đã được một tài xế khác nhanh tay nhận trước. Vui lòng chọn đơn khác!"))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("PUT /api/v1/deliveries/driver/toggle-online chuyển đổi trạng thái online")
    void testToggleOnlineEndpoint() throws Exception {
        DriverStatusResponse resp = DriverStatusResponse.builder()
                .userId(101)
                .isOnline(true)
                .approvalStatus("APPROVED")
                .licensePlate("59A1-12345")
                .build();

        when(deliveryService.toggleOnline(101)).thenReturn(resp);

        mockMvc.perform(put("/api/v1/deliveries/driver/toggle-online")
                        .header("X-User-Id", "101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.isOnline").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/deliveries/location lưu vị trí GPS của tài xế")
    void testUpdateLocationEndpoint() throws Exception {
        DriverLocationRequest req = DriverLocationRequest.builder()
                .orderId(500L)
                .latitude(10.7769)
                .longitude(106.7009)
                .heading(90.0)
                .speedKmh(25.0)
                .build();

        DriverLocationResponse resp = DriverLocationResponse.builder()
                .id(1L)
                .driverId(101)
                .orderId(500L)
                .latitude(10.7769)
                .longitude(106.7009)
                .build();

        when(deliveryService.updateLocation(eq(101), any(DriverLocationRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/deliveries/location")
                        .header("X-User-Id", "101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.latitude").value(10.7769))
                .andExpect(jsonPath("$.data.longitude").value(106.7009));
    }

    @Test
    @DisplayName("PUT /api/v1/deliveries/orders/{orderId}/step cập nhật tiến trình giao hàng")
    void testUpdateDeliveryStepEndpoint() throws Exception {
        UpdateDeliveryStepRequest req = UpdateDeliveryStepRequest.builder()
                .step("DELIVERING")
                .note("Đã nhận món từ quán, đang trên đường giao đến khách")
                .currentLat(10.7780)
                .currentLng(106.7020)
                .build();

        mockMvc.perform(put("/api/v1/deliveries/orders/500/step")
                        .header("X-User-Id", "101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Cập nhật tiến trình giao hàng thành công"));
    }

    @Test
    @DisplayName("GET /api/v1/deliveries/metrics trả về 200 OK và các chỉ số hiệu suất của tài xế")
    void testGetDriverMetricsEndpoint() throws Exception {
        com.foodthunder.delivery.dto.response.DriverMetricsResponse metrics = com.foodthunder.delivery.dto.response.DriverMetricsResponse.builder()
                .driverId(101)
                .totalOrders(10L)
                .completedOrders(8L)
                .cancelledOrders(2L)
                .completionRate(80.0)
                .totalEarnings(160000.0)
                .ratingAvg(5.0)
                .build();

        when(deliveryService.getDriverMetrics(101)).thenReturn(metrics);

        mockMvc.perform(get("/api/v1/deliveries/metrics")
                        .header("X-User-Id", "101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.driverId").value(101))
                .andExpect(jsonPath("$.data.completedOrders").value(8))
                .andExpect(jsonPath("$.data.totalEarnings").value(160000.0));
    }

    @Test
    @DisplayName("POST /api/v1/deliveries/orders/{orderId}/cancel trả về 200 OK khi tài xế hủy nhận đơn")
    void testCancelOrderEndpoint() throws Exception {
        com.foodthunder.delivery.dto.request.DriverCancelOrderRequest req = com.foodthunder.delivery.dto.request.DriverCancelOrderRequest.builder()
                .reasonCode("VEHICLE_ISSUE")
                .note("Xe bị thủng lốp")
                .build();

        com.foodthunder.delivery.dto.response.DriverMetricsResponse metrics = com.foodthunder.delivery.dto.response.DriverMetricsResponse.builder()
                .driverId(101)
                .acceptanceRate(90.0)
                .cancellationRate(5.0)
                .performanceStatus("GOOD")
                .build();

        when(deliveryService.cancelOrder(eq(101), eq(500L), any(com.foodthunder.delivery.dto.request.DriverCancelOrderRequest.class))).thenReturn(metrics);

        mockMvc.perform(post("/api/v1/deliveries/orders/500/cancel")
                        .header("X-User-Id", "101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Hủy nhận đơn và trả về hệ thống thành công"))
                .andExpect(jsonPath("$.data.driverId").value(101))
                .andExpect(jsonPath("$.data.cancellationRate").value(5.0));
    }
}
