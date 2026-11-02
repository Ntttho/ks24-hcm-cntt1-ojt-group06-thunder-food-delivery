package com.foodthunder.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.*;
import com.foodthunder.order.dto.client.RemoteProductDto;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.dto.client.RemoteToppingDto;
import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.repository.OrderRepository;
import com.foodthunder.order.repository.OrderStatusRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class OrderE2EIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStatusRepository orderStatusRepository;

    @MockBean
    private RestaurantClient restaurantClient;

    private RemoteRestaurantDto validRestaurant;

    @BeforeEach
    void setupDatabase() {
        orderRepository.deleteAll();
        // Seed order statuses if not already present in in-memory H2
        ensureStatusExists(OrderStatus.AWAITING_PAYMENT, "Chờ thanh toán VNPay", 1);
        ensureStatusExists(OrderStatus.PENDING, "Chờ xác nhận", 2);
        ensureStatusExists(OrderStatus.CONFIRMED, "Đã xác nhận", 3);
        ensureStatusExists(OrderStatus.DRIVER_ACCEPTED, "Tài xế đã nhận", 4);
        ensureStatusExists(OrderStatus.DRIVER_REJECTED, "Tài xế từ chối", 5);
        ensureStatusExists(OrderStatus.PICKING_UP, "Đang lấy hàng", 6);
        ensureStatusExists(OrderStatus.DELIVERING, "Đang giao hàng", 7);
        ensureStatusExists(OrderStatus.COMPLETED, "Hoàn thành", 8);
        ensureStatusExists(OrderStatus.CANCELLED, "Đã hủy", 9);
        ensureStatusExists(OrderStatus.TIMEOUT, "Quá thời gian", 10);

        validRestaurant = RemoteRestaurantDto.builder()
                .id(1)
                .name("Trà Sữa XiangPiao")
                .isOpen(true)
                .approvalStatus("APPROVED")
                .build();
    }

    private void ensureStatusExists(String code, String label, int sortOrder) {
        if (orderStatusRepository.findByCode(code).isEmpty()) {
            orderStatusRepository.save(OrderStatus.builder()
                    .code(code)
                    .label(label)
                    .sortOrder(sortOrder)
                    .build());
        }
    }

    @Test
    @DisplayName("E2E Test: Toàn bộ vòng đời đơn hàng từ Tạo đơn COD -> Đổi trạng thái State Machine -> Hoàn tất")
    void testFullOrderLifecycle_E2E() throws Exception {
        // --- 1. MOCK DỮ LIỆU TỪ RESTAURANT-SERVICE ---
        when(restaurantClient.getRestaurantDetail(eq(1)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(validRestaurant)));

        RemoteToppingDto pearlTopping = RemoteToppingDto.builder()
                .id(10)
                .name("Trân Châu Hoàng Kim")
                .price(BigDecimal.valueOf(10000))
                .isAvailable(true)
                .build();

        RemoteProductDto milkTea = RemoteProductDto.builder()
                .id(101)
                .name("Trà Sữa Ô Long Nướng")
                .price(BigDecimal.valueOf(45000))
                .restaurantId(1)
                .isAvailable(true)
                .toppings(List.of(pearlTopping))
                .build();

        when(restaurantClient.getProductDetail(eq(101)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(milkTea)));

        // --- 2. TẠO ĐƠN HÀNG COD (POST /api/v1/orders) ---
        CreateOrderRequest createRequest = CreateOrderRequest.builder()
                .restaurantId(1)
                .receiverAddress("Tòa Keangnam, Phạm Hùng, Cầu Giấy, Hà Nội")
                .receiverLat(21.0173)
                .receiverLng(105.7842)
                .distanceKm(3.2)
                .idempotencyKey("E2E-IDEM-KEY-001")
                .paymentMethod("COD")
                .items(List.of(
                        CreateOrderItemRequest.builder()
                                .foodId(101)
                                .quantity(2)
                                .toppings(List.of(
                                        CreateOrderItemToppingRequest.builder()
                                                .toppingId(10)
                                                .quantity(1)
                                                .build()
                                ))
                                .build()
                ))
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "100")
                        .header("X-User-Role", "ROLE_CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.statusCode").value("PENDING"))
                .andExpect(jsonPath("$.data.paymentMethod").value("COD"))
                // Tiền món: 45k * 2 = 90k, Topping: 10k * 1 * 2 = 20k => Subtotal: 110k
                .andExpect(jsonPath("$.data.subtotalAmount").value(110000.0))
                // Phí ship 3.2km: 15k (2km đầu) + ceil(1.2)*5k (10k) = 25k
                .andExpect(jsonPath("$.data.shippingFee").value(25000.0))
                // Tổng: 110k + 25k = 135k
                .andExpect(jsonPath("$.data.totalAmount").value(135000.0))
                .andExpect(jsonPath("$.data.items[0].foodName").value("Trà Sữa Ô Long Nướng"))
                .andExpect(jsonPath("$.data.items[0].toppings[0].toppingId").value(10))
                .andReturn();

        String responseBody = createResult.getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseBody).path("data").path("id").asLong();
        assertThat(orderId).isNotNull().isGreaterThan(0L);

        // --- 3. KIỂM TRA IDEMPOTENCY KEY TRÙNG LẶP ---
        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(orderId));

        assertThat(orderRepository.count()).isEqualTo(1);

        // --- 4. XEM LỊCH SỬ ĐƠN (GET /api/v1/orders/my-orders) ---
        mockMvc.perform(get("/api/v1/orders/my-orders")
                        .header("X-User-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content[0].id").value(orderId))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        // --- 5. XEM CHI TIẾT ĐƠN HÀNG (GET /api/v1/orders/{id}) ---
        mockMvc.perform(get("/api/v1/orders/" + orderId)
                        .header("X-User-Id", "100")
                        .header("X-User-Role", "ROLE_CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(orderId))
                .andExpect(jsonPath("$.data.statusLogs[0].newStatus").value("PENDING"));

        // --- 6. KIỂM TRA BẢO VỆ STATE MACHINE: CHẶN NHẢY CÓC BẤT HỢP LỆ ---
        UpdateOrderStatusRequest illegalSkip = UpdateOrderStatusRequest.builder()
                .statusCode("COMPLETED")
                .reason("Cố tình nhảy cóc trạng thái")
                .build();

        mockMvc.perform(put("/api/v1/orders/" + orderId + "/status")
                        .header("X-User-Id", "999")
                        .header("X-User-Role", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(illegalSkip)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Không thể chuyển trạng thái")));

        // --- 7. STATE MACHINE: PENDING -> CONFIRMED (Quán xác nhận đơn) ---
        mockMvc.perform(put("/api/v1/orders/" + orderId + "/status")
                        .header("X-User-Id", "50")
                        .header("X-User-Role", "ROLE_MERCHANT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateOrderStatusRequest.builder()
                                .statusCode("CONFIRMED")
                                .reason("Quán bắt đầu nấu món")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.statusCode").value("CONFIRMED"));

        // --- 8. STATE MACHINE: CONFIRMED -> DRIVER_ACCEPTED (Tài xế nhận cuốc) ---
        mockMvc.perform(put("/api/v1/orders/" + orderId + "/status")
                        .header("X-User-Id", "777")
                        .header("X-User-Role", "ROLE_DRIVER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateOrderStatusRequest.builder()
                                .statusCode("DRIVER_ACCEPTED")
                                .reason("Tài xế đã nhận đơn")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.statusCode").value("DRIVER_ACCEPTED"))
                .andExpect(jsonPath("$.data.driverId").value(777));

        // --- 9. STATE MACHINE: DRIVER_ACCEPTED -> PICKING_UP -> DELIVERING -> COMPLETED ---
        mockMvc.perform(put("/api/v1/orders/" + orderId + "/status")
                        .header("X-User-Id", "777")
                        .header("X-User-Role", "ROLE_DRIVER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateOrderStatusRequest.builder()
                                .statusCode("PICKING_UP").reason("Đã đến quán lấy đồ").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.statusCode").value("PICKING_UP"));

        mockMvc.perform(put("/api/v1/orders/" + orderId + "/status")
                        .header("X-User-Id", "777")
                        .header("X-User-Role", "ROLE_DRIVER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateOrderStatusRequest.builder()
                                .statusCode("DELIVERING").reason("Đang trên đường giao").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.statusCode").value("DELIVERING"));

        mockMvc.perform(put("/api/v1/orders/" + orderId + "/status")
                        .header("X-User-Id", "777")
                        .header("X-User-Role", "ROLE_DRIVER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateOrderStatusRequest.builder()
                                .statusCode("COMPLETED").reason("Giao hàng thành công").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.statusCode").value("COMPLETED"));

        // --- 10. KIỂM TRA BẢO VỆ TERMINAL STATE: KHÔNG THỂ HỦY ĐƠN ĐÃ HOÀN TẤT ---
        mockMvc.perform(put("/api/v1/orders/" + orderId + "/status")
                        .header("X-User-Id", "999")
                        .header("X-User-Role", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateOrderStatusRequest.builder()
                                .statusCode("CANCELLED").reason("Cố hủy đơn đã xong").build())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("E2E Test: Tạo đơn hàng chọn VNPay khởi tạo trạng thái AWAITING_PAYMENT")
    void testCreateOrderVNPay_E2E() throws Exception {
        when(restaurantClient.getRestaurantDetail(eq(1)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(validRestaurant)));

        RemoteProductDto milkTea = RemoteProductDto.builder()
                .id(101)
                .name("Trà Sữa Ô Long Nướng")
                .price(BigDecimal.valueOf(45000))
                .restaurantId(1)
                .isAvailable(true)
                .build();

        when(restaurantClient.getProductDetail(eq(101)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(milkTea)));

        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(1)
                .receiverAddress("Hà Nội")
                .distanceKm(2.0)
                .idempotencyKey("E2E-VNPAY-001")
                .paymentMethod("VNPAY")
                .items(List.of(CreateOrderItemRequest.builder().foodId(101).quantity(1).build()))
                .build();

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "101")
                        .header("X-User-Role", "ROLE_CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.statusCode").value("AWAITING_PAYMENT"))
                .andExpect(jsonPath("$.data.paymentMethod").value("VNPAY"));
    }

    @Test
    @DisplayName("E2E Test: Chặn tạo đơn khi món ăn thuộc các quán khác nhau (Single-shop constraint)")
    void testSingleShopConstraint_E2E() throws Exception {
        when(restaurantClient.getRestaurantDetail(eq(1)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(validRestaurant)));

        RemoteProductDto productOfOtherShop = RemoteProductDto.builder()
                .id(999)
                .name("Bún Đậu Mắm Tôm")
                .price(BigDecimal.valueOf(55000))
                .restaurantId(88) // Khác với restaurantId=1 trong request
                .isAvailable(true)
                .build();

        when(restaurantClient.getProductDetail(eq(999)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(productOfOtherShop)));

        CreateOrderRequest request = CreateOrderRequest.builder()
                .restaurantId(1)
                .receiverAddress("Hà Nội")
                .items(List.of(
                        CreateOrderItemRequest.builder().foodId(999).quantity(1).build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("thuộc quán ăn khác")));
    }
}
