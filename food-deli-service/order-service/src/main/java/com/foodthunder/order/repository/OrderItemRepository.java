package com.foodthunder.order.repository;

import com.foodthunder.order.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT i.foodId, i.foodName, SUM(i.quantity), SUM(i.quantity * i.priceAtOrder) " +
           "FROM OrderItem i " +
           "WHERE i.order.restaurantId = :restaurantId " +
           "AND i.order.status.code = 'COMPLETED' " +
           "AND i.order.createdAt >= :startDate AND i.order.createdAt <= :endDate " +
           "GROUP BY i.foodId, i.foodName " +
           "ORDER BY SUM(i.quantity * i.priceAtOrder) DESC")
    List<Object[]> findTopSellingFoodsByRestaurantId(
            @Param("restaurantId") Integer restaurantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT i.foodId, i.foodName, SUM(i.quantity), SUM(i.quantity * i.priceAtOrder) " +
           "FROM OrderItem i " +
           "WHERE i.order.restaurantId IN :restaurantIds " +
           "AND i.order.status.code = 'COMPLETED' " +
           "AND i.order.createdAt >= :startDate AND i.order.createdAt <= :endDate " +
           "GROUP BY i.foodId, i.foodName " +
           "ORDER BY SUM(i.quantity * i.priceAtOrder) DESC")
    List<Object[]> findTopSellingFoodsByRestaurantIdIn(
            @Param("restaurantIds") List<Integer> restaurantIds,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
