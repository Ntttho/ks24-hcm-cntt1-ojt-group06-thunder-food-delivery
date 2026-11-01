package com.foodthunder.order.repository;

import com.foodthunder.order.entity.OrderItemTopping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemToppingRepository extends JpaRepository<OrderItemTopping, Long> {
    List<OrderItemTopping> findByOrderItemId(Long orderItemId);
}
