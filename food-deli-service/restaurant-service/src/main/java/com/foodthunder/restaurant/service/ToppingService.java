package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateToppingRequest;
import com.foodthunder.restaurant.dto.ToppingDto;
import com.foodthunder.restaurant.dto.ToppingGroupDto;
import com.foodthunder.restaurant.dto.UpdateToppingRequest;

import java.util.List;

public interface ToppingService {

    List<ToppingDto> getToppingsByRestaurant(Integer restaurantId, String groupName);

    List<ToppingGroupDto> getToppingGroupsByRestaurant(Integer restaurantId);

    ToppingDto getToppingById(Integer id);

    ToppingDto createTopping(CreateToppingRequest request, Integer ownerId, String role);

    ToppingDto updateTopping(Integer id, UpdateToppingRequest request, Integer ownerId, String role);

    ToppingDto updateToppingStatus(Integer id, Boolean isAvailable, Integer ownerId, String role);

    void deleteTopping(Integer id, Integer ownerId, String role);
}
