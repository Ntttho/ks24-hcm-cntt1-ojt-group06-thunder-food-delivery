package com.foodthunder.order.repository;

import com.foodthunder.order.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    Optional<Order> findByOrderCode(String orderCode);

    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Integer customerId, Pageable pageable);

    Page<Order> findByRestaurantIdOrderByCreatedAtDesc(Integer restaurantId, Pageable pageable);

    Page<Order> findByDriverIdOrderByCreatedAtDesc(Integer driverId, Pageable pageable);

    Optional<Order> findByIdAndCustomerId(Long id, Integer customerId);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id IN :orderIds")
    List<Order> findAllWithItemsByIdIn(@Param("orderIds") Collection<Long> orderIds);
    @Query("SELECT o FROM Order o WHERE o.restaurantId = :restaurantId " +
           "AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "ORDER BY o.createdAt ASC")
    java.util.List<Order> findByRestaurantIdAndCreatedAtBetween(
            @Param("restaurantId") Integer restaurantId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    @Query("SELECT o FROM Order o WHERE o.restaurantId IN :restaurantIds " +
           "AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "ORDER BY o.createdAt ASC")
    java.util.List<Order> findByRestaurantIdInAndCreatedAtBetween(
            @Param("restaurantIds") java.util.List<Integer> restaurantIds,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate ORDER BY o.createdAt ASC")
    java.util.List<Order> findByCreatedAtBetween(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    @Query("SELECT COUNT(o) FROM Order o WHERE o.deletedAt IS NULL")
    long countAllActiveOrders();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.deletedAt IS NULL AND UPPER(o.status.code) = UPPER(:statusCode)")
    long countActiveOrdersByStatusCode(@Param("statusCode") String statusCode);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.deletedAt IS NULL AND UPPER(o.status.code) = 'COMPLETED'")
    java.math.BigDecimal sumCompletedTotalRevenue();

    @Query("SELECT MONTH(o.createdAt), COALESCE(SUM(o.totalAmount), 0), COUNT(o.id) " +
           "FROM Order o " +
           "WHERE o.deletedAt IS NULL " +
           "AND UPPER(o.status.code) = 'COMPLETED' " +
           "AND o.createdAt >= :startDate AND o.createdAt < :endDate " +
           "GROUP BY MONTH(o.createdAt) " +
           "ORDER BY MONTH(o.createdAt) ASC")
    List<Object[]> findMonthlyCompletedRevenueBetween(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );
}
