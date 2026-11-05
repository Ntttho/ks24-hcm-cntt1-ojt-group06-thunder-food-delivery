package com.foodthunder.restaurant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.restaurant.dto.CreateToppingRequest;
import com.foodthunder.restaurant.dto.ToppingDto;
import com.foodthunder.restaurant.dto.UpdateToppingRequest;
import com.foodthunder.restaurant.service.ToppingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ToppingController.class)
@AutoConfigureMockMvc(addFilters = false)
class ToppingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ToppingService toppingService;

    @Test
    @DisplayName("GET /api/v1/toppings?restaurantId=1 thành công")
    void getToppings_success() throws Exception {
        ToppingDto dto1 = ToppingDto.builder()
                .id(1)
                .restaurantId(1)
                .groupName("Topping thêm")
                .name("Trứng ốp la")
                .price(BigDecimal.valueOf(5000))
                .isAvailable(true)
                .build();

        ToppingDto dto2 = ToppingDto.builder()
                .id(2)
                .restaurantId(1)
                .groupName("Topping thêm")
                .name("Chả thêm")
                .price(BigDecimal.valueOf(10000))
                .isAvailable(true)
                .build();

        when(toppingService.getToppingsByRestaurant(eq(1), any())).thenReturn(List.of(dto1, dto2));

        mockMvc.perform(get("/api/v1/toppings").param("restaurantId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].name").value("Trứng ốp la"))
                .andExpect(jsonPath("$.data[1].price").value(10000));
    }

    @Test
    @DisplayName("POST /api/v1/toppings tạo mới topping thành công")
    void createTopping_success() throws Exception {
        CreateToppingRequest request = CreateToppingRequest.builder()
                .restaurantId(1)
                .groupName("Topping thêm")
                .name("Trân châu trắng")
                .price(BigDecimal.valueOf(10000))
                .isAvailable(true)
                .build();

        ToppingDto created = ToppingDto.builder()
                .id(5)
                .restaurantId(1)
                .groupName("Topping thêm")
                .name("Trân châu trắng")
                .price(BigDecimal.valueOf(10000))
                .isAvailable(true)
                .build();

        when(toppingService.createTopping(any(CreateToppingRequest.class), any(), any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/toppings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.id").value(5))
                .andExpect(jsonPath("$.data.name").value("Trân châu trắng"))
                .andExpect(jsonPath("$.data.price").value(10000));
    }

    @Test
    @DisplayName("PUT /api/v1/toppings/{id} cập nhật topping thành công")
    void updateTopping_success() throws Exception {
        UpdateToppingRequest request = UpdateToppingRequest.builder()
                .name("Trân châu hoàng kim")
                .price(BigDecimal.valueOf(12000))
                .build();

        ToppingDto updated = ToppingDto.builder()
                .id(5)
                .restaurantId(1)
                .groupName("Topping thêm")
                .name("Trân châu hoàng kim")
                .price(BigDecimal.valueOf(12000))
                .isAvailable(true)
                .build();

        when(toppingService.updateTopping(eq(5), any(UpdateToppingRequest.class), any(), any())).thenReturn(updated);

        mockMvc.perform(put("/api/v1/toppings/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.name").value("Trân châu hoàng kim"))
                .andExpect(jsonPath("$.data.price").value(12000));
    }

    @Test
    @DisplayName("DELETE /api/v1/toppings/{id} xóa topping thành công")
    void deleteTopping_success() throws Exception {
        doNothing().when(toppingService).deleteTopping(eq(5), any(), any());

        mockMvc.perform(delete("/api/v1/toppings/5")
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }
}

