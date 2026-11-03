package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Integer> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Voucher> findByRestaurantId(Integer restaurantId);

    List<Voucher> findByRestaurantIdOrRestaurantIdIsNull(Integer restaurantId);

    List<Voucher> findByIsActiveTrue();
}

