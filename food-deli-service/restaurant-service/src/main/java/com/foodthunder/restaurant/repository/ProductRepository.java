package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    Optional<Product> findByIdAndDeletedAtIsNull(Integer id);

    List<Product> findByCategoryIdAndDeletedAtIsNull(Integer categoryId);

    long countByCategoryIdAndDeletedAtIsNull(Integer categoryId);

    long countByDeletedAtIsNull();

    List<Product> findByCategoryRestaurantIdAndDeletedAtIsNull(Integer restaurantId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.deletedAt IS NULL AND p.category IS NOT NULL " +
           "AND p.category.restaurant.deletedAt IS NULL AND p.category.restaurant.approvalStatus = 'APPROVED'")
    long countActiveFoodItems();

    @Query("SELECT p FROM Product p WHERE (:restaurantId IS NULL OR p.category.restaurant.id = :restaurantId) AND p.deletedAt IS NULL " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:categoryName IS NULL OR LOWER(p.category.name) LIKE LOWER(CONCAT('%', :categoryName, '%'))) " +
           "AND (:isAvailable IS NULL OR p.isAvailable = :isAvailable)")
    Page<Product> findByRestaurantIdWithFilters(
            @Param("restaurantId") Integer restaurantId,
            @Param("search") String search,
            @Param("categoryId") Integer categoryId,
            @Param("categoryName") String categoryName,
            @Param("isAvailable") Boolean isAvailable,
            Pageable pageable
    );
}
