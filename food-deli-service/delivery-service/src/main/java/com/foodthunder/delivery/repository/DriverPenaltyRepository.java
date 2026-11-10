package com.foodthunder.delivery.repository;

import com.foodthunder.delivery.entity.DriverPenalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DriverPenaltyRepository extends JpaRepository<DriverPenalty, Long> {

    List<DriverPenalty> findByDriverId(Integer driverId);

    /**
     * Tìm kiếm các hình phạt còn hiệu lực (status = 'ACTIVE' và endsAt còn trong tương lai hoặc null).
     */
    @Query("SELECT p FROM DriverPenalty p WHERE p.driverId = :driverId AND p.status = 'ACTIVE' " +
           "AND (p.endsAt IS NULL OR p.endsAt > :now) ORDER BY p.createdAt DESC")
    List<DriverPenalty> findActivePenalties(@Param("driverId") Integer driverId, @Param("now") LocalDateTime now);

    /**
     * Kiểm tra hình phạt theo loại cụ thể (LOW_AR_COOLDOWN, HIGH_CR_SUSPENSION) còn hiệu lực hay không.
     */
    @Query("SELECT p FROM DriverPenalty p WHERE p.driverId = :driverId AND p.type = :type AND p.status = 'ACTIVE' " +
           "AND (p.endsAt IS NULL OR p.endsAt > :now) ORDER BY p.createdAt DESC")
    List<DriverPenalty> findActivePenaltiesByType(@Param("driverId") Integer driverId, @Param("type") String type, @Param("now") LocalDateTime now);
}

