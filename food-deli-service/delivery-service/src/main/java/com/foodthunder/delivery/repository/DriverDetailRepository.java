package com.foodthunder.delivery.repository;

import com.foodthunder.delivery.entity.DriverDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverDetailRepository extends JpaRepository<DriverDetail, Integer> {
    Optional<DriverDetail> findByUserId(Integer userId);
}

