package com.foodthunder.order.repository;

import com.foodthunder.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    Optional<Order> findByOrderCode(String orderCode);

    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Integer customerId, Pageable pageable);

    Page<Order> findByRestaurantIdOrderByCreatedAtDesc(Integer restaurantId, Pageable pageable);

    Page<Order> findByDriverIdOrderByCreatedAtDesc(Integer driverId, Pageable pageable);

    Optional<Order> findByIdAndCustomerId(Long id, Integer customerId);
}
