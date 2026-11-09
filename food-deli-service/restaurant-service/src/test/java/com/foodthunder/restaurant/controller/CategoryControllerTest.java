package com.foodthunder.restaurant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.restaurant.dto.CategoryRequestDto;
import com.foodthunder.restaurant.dto.ReorderCategoryRequest;
import com.foodthunder.restaurant.entity.MenuCategory;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.repository.MenuCategoryRepository;
import com.foodthunder.restaurant.repository.ProductRepository;
import com.foodthunder.restaurant.repository.ShopRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MenuCategoryRepository menuCategoryRepository;

    @MockBean
    private ShopRepository shopRepository;

    @MockBean
    private ProductRepository productRepository;

    @Test
    @DisplayName("GET /api/v1/restaurants/{id}/categories thành công và sắp xếp theo thứ tự hiển thị")
    void getCategoriesByRestaurant_success() throws Exception {
        when(shopRepository.existsById(1)).thenReturn(true);

        Shop shop = Shop.builder().id(1).name("Quán Hạnh Dung").build();
        MenuCategory cat1 = MenuCategory.builder().id(10).restaurant(shop).name("Món Chay").displayOrder(0).build();
        MenuCategory cat2 = MenuCategory.builder().id(11).restaurant(shop).name("Nước Uống").displayOrder(1).build();

        when(menuCategoryRepository.findByRestaurantIdOrderByDisplayOrderAscIdAsc(1)).thenReturn(List.of(cat1, cat2));
        when(productRepository.countByCategoryIdAndDeletedAtIsNull(10)).thenReturn(5L);
        when(productRepository.countByCategoryIdAndDeletedAtIsNull(11)).thenReturn(2L);

        mockMvc.perform(get("/api/v1/restaurants/1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].name").value("Món Chay"))
                .andExpect(jsonPath("$.data[0].displayOrder").value(0))
                .andExpect(jsonPath("$.data[0].productCount").value(5));
    }

    @Test
    @DisplayName("POST /api/v1/categories thành công khi thông tin hợp lệ")
    void createCategory_success() throws Exception {
        Shop shop = Shop.builder().id(1).ownerId(3).name("Quán Hạnh Dung").build();
        when(shopRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(shop));
        when(menuCategoryRepository.existsByRestaurantIdAndNameIgnoreCase(1, "Món Tráng Miệng")).thenReturn(false);

        MenuCategory saved = MenuCategory.builder().id(20).restaurant(shop).name("Món Tráng Miệng").displayOrder(0).build();
        when(menuCategoryRepository.save(any(MenuCategory.class))).thenReturn(saved);

        CategoryRequestDto request = CategoryRequestDto.builder()
                .restaurantId(1)
                .name("Món Tráng Miệng")
                .build();

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.name").value("Món Tráng Miệng"));
    }

    @Test
    @DisplayName("POST /api/v1/categories trả về 409 Conflict khi tên danh mục bị trùng lặp")
    void createCategory_duplicateName_conflict() throws Exception {
        Shop shop = Shop.builder().id(1).ownerId(3).name("Quán Hạnh Dung").build();
        when(shopRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(shop));
        when(menuCategoryRepository.existsByRestaurantIdAndNameIgnoreCase(1, "Món Chay")).thenReturn(true);

        CategoryRequestDto request = CategoryRequestDto.builder()
                .restaurantId(1)
                .name("Món Chay")
                .build();

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Danh mục 'Món Chay' đã tồn tại trong quán ăn này"));
    }

    @Test
    @DisplayName("PUT /api/v1/categories/{id} đổi tên danh mục thành công")
    void updateCategory_success() throws Exception {
        Shop shop = Shop.builder().id(1).ownerId(3).name("Quán Hạnh Dung").build();
        MenuCategory cat = MenuCategory.builder().id(10).restaurant(shop).name("Món Cũ").displayOrder(1).build();

        when(menuCategoryRepository.findById(10)).thenReturn(Optional.of(cat));
        when(menuCategoryRepository.existsByRestaurantIdAndNameIgnoreCaseAndIdNot(1, "Món Mới", 10)).thenReturn(false);
        when(menuCategoryRepository.save(any(MenuCategory.class))).thenReturn(cat);

        CategoryRequestDto request = CategoryRequestDto.builder()
                .name("Món Mới")
                .displayOrder(2)
                .build();

        mockMvc.perform(put("/api/v1/categories/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.name").value("Món Mới"));
    }

    @Test
    @DisplayName("DELETE /api/v1/categories/{id} xóa thành công khi danh mục không có món")
    void deleteCategory_success() throws Exception {
        Shop shop = Shop.builder().id(1).ownerId(3).name("Quán Hạnh Dung").build();
        MenuCategory cat = MenuCategory.builder().id(10).restaurant(shop).name("Danh mục trống").build();

        when(menuCategoryRepository.findById(10)).thenReturn(Optional.of(cat));
        when(productRepository.countByCategoryIdAndDeletedAtIsNull(10)).thenReturn(0L);

        mockMvc.perform(delete("/api/v1/categories/10")
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));

        verify(menuCategoryRepository).delete(cat);
    }

    @Test
    @DisplayName("DELETE /api/v1/categories/{id} trả về 409 Conflict khi danh mục còn món")
    void deleteCategory_hasProducts_badRequest() throws Exception {
        Shop shop = Shop.builder().id(1).ownerId(3).name("Quán Hạnh Dung").build();
        MenuCategory cat = MenuCategory.builder().id(10).restaurant(shop).name("Món Chay").build();

        when(menuCategoryRepository.findById(10)).thenReturn(Optional.of(cat));
        when(productRepository.countByCategoryIdAndDeletedAtIsNull(10)).thenReturn(3L);

        mockMvc.perform(delete("/api/v1/categories/10")
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("3 món ăn")));

        verify(menuCategoryRepository, never()).delete(any());
    }

    @Test
    @DisplayName("PUT /api/v1/categories/reorder sắp xếp lại danh mục thành công")
    void reorderCategories_success() throws Exception {
        Shop shop = Shop.builder().id(1).ownerId(3).name("Quán Hạnh Dung").build();
        when(shopRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(shop));

        MenuCategory cat1 = MenuCategory.builder().id(10).restaurant(shop).name("Cat 1").displayOrder(0).build();
        MenuCategory cat2 = MenuCategory.builder().id(11).restaurant(shop).name("Cat 2").displayOrder(1).build();

        when(menuCategoryRepository.findByIdAndRestaurantId(11, 1)).thenReturn(Optional.of(cat2));
        when(menuCategoryRepository.findByIdAndRestaurantId(10, 1)).thenReturn(Optional.of(cat1));
        when(menuCategoryRepository.findByRestaurantIdOrderByDisplayOrderAscIdAsc(1)).thenReturn(List.of(cat2, cat1));

        ReorderCategoryRequest req = ReorderCategoryRequest.builder()
                .restaurantId(1)
                .categoryIds(List.of(11, 10))
                .build();

        mockMvc.perform(put("/api/v1/categories/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }
}
