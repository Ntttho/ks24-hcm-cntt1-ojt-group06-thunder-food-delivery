package com.foodthunder.restaurant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.restaurant.dto.CreateRestaurantRequest;
import com.foodthunder.restaurant.dto.RestaurantDto;
import com.foodthunder.restaurant.service.ProductService;
import com.foodthunder.restaurant.service.RestaurantService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RestaurantController.class)
@AutoConfigureMockMvc(addFilters = false)
class RestaurantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RestaurantService restaurantService;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("GET /api/v1/restaurants/mine trả về danh sách quán của chủ quán")
    void getMyRestaurants_success() throws Exception {
        RestaurantDto dto = RestaurantDto.builder()
                .id(10)
                .ownerId(5)
                .name("Quán Phở Thìn 1955")
                .address("13 Lò Đúc, Hà Nội")
                .isOpen(true)
                .build();

        when(restaurantService.getRestaurantsByOwner(5)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/restaurants/mine")
                        .header("X-User-Id", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].id").value(10))
                .andExpect(jsonPath("$.data[0].name").value("Quán Phở Thìn 1955"));
    }

    @Test
    @DisplayName("POST /api/v1/restaurants tạo quán mới thành công cho đối tác đăng ký lần đầu")
    void createRestaurant_success() throws Exception {
        CreateRestaurantRequest request = CreateRestaurantRequest.builder()
                .name("Trà Sữa KOI Thé")
                .address("120 Hai Bà Trưng, Q.1, TP.HCM")
                .openingTime(LocalTime.of(8, 30))
                .closingTime(LocalTime.of(22, 0))
                .imageUrl("https://cdn.foodthunder.com/shops/koi.jpg")
                .initialCategoryName("Món chính")
                .build();

        RestaurantDto created = RestaurantDto.builder()
                .id(99)
                .ownerId(7)
                .name("Trà Sữa KOI Thé")
                .address("120 Hai Bà Trưng, Q.1, TP.HCM")
                .openingTime(LocalTime.of(8, 30))
                .closingTime(LocalTime.of(22, 0))
                .isOpen(true)
                .approvalStatus("APPROVED")
                .build();

        when(restaurantService.createRestaurant(any(CreateRestaurantRequest.class), eq(7)))
                .thenReturn(created);

        mockMvc.perform(post("/api/v1/restaurants")
                        .header("X-User-Id", "7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.id").value(99))
                .andExpect(jsonPath("$.data.name").value("Trà Sữa KOI Thé"));
    }

    @Test
    @DisplayName("POST /api/v1/restaurants trả về 400 nếu thiếu tên hoặc địa chỉ")
    void createRestaurant_badRequest_missingFields() throws Exception {
        CreateRestaurantRequest badRequest = CreateRestaurantRequest.builder()
                .name("") // blank name
                .address("   ") // blank address
                .build();

        mockMvc.perform(post("/api/v1/restaurants")
                        .header("X-User-Id", "7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest());
    }
}
