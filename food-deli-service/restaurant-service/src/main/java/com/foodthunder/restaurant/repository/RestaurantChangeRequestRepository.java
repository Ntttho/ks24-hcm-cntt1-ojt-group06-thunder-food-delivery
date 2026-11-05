package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.RestaurantChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantChangeRequestRepository extends JpaRepository<RestaurantChangeRequest, Integer> {
    List<RestaurantChangeRequest> findByRestaurantId(Integer restaurantId);
    List<RestaurantChangeRequest> findByRequestedBy(Integer requestedBy);
}

