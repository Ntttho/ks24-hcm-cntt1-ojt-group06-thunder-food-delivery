package com.foodthunder.restaurant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.restaurant.dto.PageResponse;
import com.foodthunder.restaurant.dto.ProductDto;
import com.foodthunder.restaurant.service.ProductService;
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
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("PUT /api/v1/products/{id}/status cập nhật trạng thái còn hàng thành công")
    void updateProductStatus_put_success() throws Exception {
        ProductDto dto = ProductDto.builder()
                .id(10)
                .name("Cơm Tấm Sườn Bì")
                .price(BigDecimal.valueOf(45000))
                .isAvailable(false)
                .build();

        when(productService.updateProductStatus(eq(10), eq(false))).thenReturn(dto);

        mockMvc.perform(put("/api/v1/products/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isAvailable", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.isAvailable").value(false));
    }

    @Test
    @DisplayName("PATCH /api/v1/products/{id}/status cập nhật trạng thái còn hàng thành công")
    void updateProductStatus_patch_success() throws Exception {
        ProductDto dto = ProductDto.builder()
                .id(10)
                .name("Cơm Tấm Sườn Bì")
                .price(BigDecimal.valueOf(45000))
                .isAvailable(true)
                .build();

        when(productService.updateProductStatus(eq(10), eq(true))).thenReturn(dto);

        mockMvc.perform(patch("/api/v1/products/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isAvailable", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.isAvailable").value(true));
    }
}
