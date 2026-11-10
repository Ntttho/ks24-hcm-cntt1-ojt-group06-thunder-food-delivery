package com.foodthunder.delivery.repository;

import com.foodthunder.delivery.entity.DriverLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverLocationRepository extends JpaRepository<DriverLocation, Long> {

    Optional<DriverLocation> findFirstByDriverIdOrderByCreatedAtDesc(Integer driverId);

    Optional<DriverLocation> findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);
}

