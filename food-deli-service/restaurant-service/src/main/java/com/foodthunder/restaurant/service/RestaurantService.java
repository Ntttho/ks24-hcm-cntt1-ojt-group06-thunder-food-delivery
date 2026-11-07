package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateRestaurantRequest;
import com.foodthunder.restaurant.dto.PageResponse;
import com.foodthunder.restaurant.dto.RestaurantDetailDto;
import com.foodthunder.restaurant.dto.RestaurantDto;

import java.util.List;

public interface RestaurantService {

    PageResponse<RestaurantDto> getRestaurants(String search, Integer categoryId, Boolean isOpen, int page, int size);

    RestaurantDetailDto getRestaurantDetail(Integer id);

    List<RestaurantDto> getRestaurantsByOwner(Integer ownerId);

    PageResponse<RestaurantDto> getRestaurantsByOwnerPaged(Integer ownerId, String search, int page, int size);

    RestaurantDto createRestaurant(CreateRestaurantRequest request, Integer ownerId);

    RestaurantDto updateRestaurantDetails(Integer id, CreateRestaurantRequest request, Integer ownerId);

    RestaurantDto updateShopStatus(Integer id, Boolean isOpen, String temporaryClosedReason);
}
