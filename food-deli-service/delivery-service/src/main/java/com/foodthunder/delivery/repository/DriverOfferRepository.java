package com.foodthunder.delivery.repository;

import com.foodthunder.delivery.entity.DriverOffer;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverOfferRepository extends JpaRepository<DriverOffer, Long> {

    /**
     * Pessimistic Locking query: Acquires an exclusive row-level lock (SELECT ... FOR UPDATE)
     * on all offers matching the specified orderId to eliminate race conditions
     * when multiple drivers attempt to accept the same order simultaneously.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM DriverOffer o WHERE o.orderId = :orderId")
    List<DriverOffer> findAllByOrderIdForUpdate(@Param("orderId") Long orderId);

    Optional<DriverOffer> findByOrderIdAndDriverId(Long orderId, Integer driverId);

    List<DriverOffer> findByOrderId(Long orderId);

    List<DriverOffer> findByDriverIdAndStatus(Integer driverId, String status);

    List<DriverOffer> findByDriverIdOrderByCreatedAtDesc(Integer driverId);

    /**
     * Query Rolling Window: Lấy tối đa N offer gần nhất có trạng thái kết thúc để tính AR (chuẩn PRD).
     * Bao gồm: ACCEPTED, COMPLETED, DRIVER_CANCELLED, REJECTED, IGNORED, EXPIRED
     */
    @Query("SELECT o FROM DriverOffer o WHERE o.driverId = :driverId " +
           "AND o.status IN ('ACCEPTED', 'COMPLETED', 'DRIVER_CANCELLED', 'REJECTED', 'IGNORED', 'EXPIRED') " +
           "ORDER BY o.createdAt DESC")
    List<DriverOffer> findRollingWindowEligibleOffers(@Param("driverId") Integer driverId, Pageable pageable);

    /**
     * Query Rolling Window: Lấy tối đa N đơn tài xế đã tiếp nhận gần nhất để tính CR (chuẩn PRD).
     * Bao gồm: ACCEPTED, COMPLETED, DRIVER_CANCELLED
     */
    @Query("SELECT o FROM DriverOffer o WHERE o.driverId = :driverId " +
           "AND o.status IN ('ACCEPTED', 'COMPLETED', 'DRIVER_CANCELLED') " +
           "ORDER BY o.createdAt DESC")
    List<DriverOffer> findRollingWindowAcceptedOffers(@Param("driverId") Integer driverId, Pageable pageable);
}

