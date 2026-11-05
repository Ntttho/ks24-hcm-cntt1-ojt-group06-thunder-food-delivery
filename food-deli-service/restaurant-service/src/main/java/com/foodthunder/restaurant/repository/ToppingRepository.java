package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.Topping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToppingRepository extends JpaRepository<Topping, Integer> {

    List<Topping> findByRestaurantId(Integer restaurantId);

    List<Topping> findByRestaurantIdAndIsAvailableTrue(Integer restaurantId);

    List<Topping> findByRestaurantIdAndGroupName(Integer restaurantId, String groupName);

    boolean existsByRestaurantIdAndNameIgnoreCase(Integer restaurantId, String name);

    boolean existsByRestaurantIdAndNameIgnoreCaseAndIdNot(Integer restaurantId, String name, Integer id);
}
