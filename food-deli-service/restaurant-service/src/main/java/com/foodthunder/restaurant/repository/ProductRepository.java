package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    Optional<Product> findByIdAndDeletedAtIsNull(Integer id);

    List<Product> findByCategoryIdAndDeletedAtIsNull(Integer categoryId);

    List<Product> findByCategoryRestaurantIdAndDeletedAtIsNull(Integer restaurantId);
}
