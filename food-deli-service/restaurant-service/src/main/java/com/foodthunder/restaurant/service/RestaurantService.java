package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.PageResponse;
import com.foodthunder.restaurant.dto.RestaurantDetailDto;
import com.foodthunder.restaurant.dto.RestaurantDto;

import java.util.List;

public interface RestaurantService {

    PageResponse<RestaurantDto> getRestaurants(String search, Integer categoryId, Boolean isOpen, int page, int size);

    RestaurantDetailDto getRestaurantDetail(Integer id);

    List<RestaurantDto> getRestaurantsByOwner(Integer ownerId);

    RestaurantDto updateShopStatus(Integer id, Boolean isOpen, String temporaryClosedReason);
}
