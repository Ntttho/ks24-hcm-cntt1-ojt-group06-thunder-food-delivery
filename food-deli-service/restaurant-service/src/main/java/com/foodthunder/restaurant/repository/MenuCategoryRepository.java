package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Integer> {

    List<MenuCategory> findByRestaurantId(Integer restaurantId);

    Optional<MenuCategory> findByIdAndRestaurantId(Integer id, Integer restaurantId);
}
