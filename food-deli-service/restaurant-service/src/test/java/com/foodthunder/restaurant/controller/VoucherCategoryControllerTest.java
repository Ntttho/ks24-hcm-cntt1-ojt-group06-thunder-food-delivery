package com.foodthunder.restaurant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.restaurant.dto.CreateVoucherCategoryRequest;
import com.foodthunder.restaurant.dto.VoucherCategoryDto;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.service.VoucherCategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VoucherCategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class VoucherCategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VoucherCategoryService voucherCategoryService;

    @Test
    @DisplayName("GET /api/v1/voucher-categories trả về danh sách danh mục voucher")
    void getCategories_success() throws Exception {
        List<VoucherCategoryDto> categories = List.of(
                VoucherCategoryDto.builder().id(1).code("FREESHIP").name("Miễn phí vận chuyển").isActive(true).build(),
                VoucherCategoryDto.builder().id(2).code("DISCOUNT_FOOD").name("Giảm giá món ăn").isActive(true).build(),
                VoucherCategoryDto.builder().id(3).code("NEW_USER").name("Khách hàng mới").isActive(true).build()
        );

        when(voucherCategoryService.getCategories(null)).thenReturn(categories);

        mockMvc.perform(get("/api/v1/voucher-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].code").value("FREESHIP"));
    }

    @Test
    @DisplayName("POST /api/v1/voucher-categories cho phép Admin tạo danh mục mới")
    void createCategory_admin_success() throws Exception {
        CreateVoucherCategoryRequest req = CreateVoucherCategoryRequest.builder()
                .code("FLASH_SALE")
                .name("Giờ vàng giảm sốc")
                .description("Khuyến mãi theo khung giờ")
                .build();

        VoucherCategoryDto res = VoucherCategoryDto.builder()
                .id(4)
                .code("FLASH_SALE")
                .name("Giờ vàng giảm sốc")
                .isActive(true)
                .build();

        when(voucherCategoryService.createCategory(any(CreateVoucherCategoryRequest.class), eq("ROLE_ADMIN")))
                .thenReturn(res);

        mockMvc.perform(post("/api/v1/voucher-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("X-User-Role", "ROLE_ADMIN"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("FLASH_SALE"));
    }

    @Test
    @DisplayName("POST /api/v1/voucher-categories từ chối non-admin với 403 Forbidden")
    void createCategory_nonAdmin_forbidden() throws Exception {
        CreateVoucherCategoryRequest req = CreateVoucherCategoryRequest.builder()
                .code("FLASH_SALE")
                .name("Giờ vàng giảm sốc")
                .build();

        when(voucherCategoryService.createCategory(any(CreateVoucherCategoryRequest.class), eq("ROLE_MERCHANT")))
                .thenThrow(new ForbiddenException("Chỉ Quản trị viên (Admin) mới có quyền quản lý danh mục voucher"));

        mockMvc.perform(post("/api/v1/voucher-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isForbidden());
    }
}

