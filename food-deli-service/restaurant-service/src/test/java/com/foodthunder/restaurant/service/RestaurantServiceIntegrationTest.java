package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateRestaurantRequest;
import com.foodthunder.restaurant.dto.RestaurantDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RestaurantServiceIntegrationTest {

    @Autowired
    private RestaurantService restaurantService;

    @Test
    @Transactional
    @DisplayName("createRestaurant saves shop and change request without throwing any exception")
    void testCreateRestaurantIntegration() {
        CreateRestaurantRequest request = CreateRestaurantRequest.builder()
                .name("Nhà Hàng Số 1 Thọ")
                .address("123 Nguyễn Huệ, Quận 1, TP.HCM")
                .latitude(10.7769)
                .longitude(106.7009)
                .openingTime(LocalTime.of(7, 0))
                .closingTime(LocalTime.of(22, 0))
                .imageUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5")
                .initialCategoryName("Món chính")
                .build();

        RestaurantDto dto = restaurantService.createRestaurant(request, 3);
        assertNotNull(dto);
        assertNotNull(dto.getId());
        assertEquals("Nhà Hàng Số 1 Thọ", dto.getName());
        assertEquals(3, dto.getOwnerId());
    }

    @Test
    @Transactional
    @DisplayName("updateRestaurantDetails updates shop and change request")
    void testUpdateRestaurantDetailsIntegration() {
        CreateRestaurantRequest request = CreateRestaurantRequest.builder()
                .name("Nhà Hàng Mới")
                .address("456 Lê Lợi, TP.HCM")
                .latitude(10.7769)
                .longitude(106.7009)
                .openingTime(LocalTime.of(7, 0))
                .closingTime(LocalTime.of(22, 0))
                .imageUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5")
                .initialCategoryName("Món chính")
                .build();

        RestaurantDto created = restaurantService.createRestaurant(request, 3);

        CreateRestaurantRequest updateReq = CreateRestaurantRequest.builder()
                .name("Nhà Hàng Đã Đổi Tên")
                .address("789 Trần Hưng Đạo")
                .latitude(10.7500)
                .longitude(106.6800)
                .build();

        RestaurantDto updated = restaurantService.updateRestaurantDetails(created.getId(), updateReq, 3);
        assertNotNull(updated);
        assertEquals("Nhà Hàng Đã Đổi Tên", updated.getName());
    }
}

