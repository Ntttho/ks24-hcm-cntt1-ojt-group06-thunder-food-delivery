package com.foodthunder.auth.repository;

import com.foodthunder.auth.model.DriverDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverDetailsRepository extends JpaRepository<DriverDetails, Long> {
}
