package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Integer> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByVoucherCategoryIgnoreCase(String voucherCategory);

    List<Voucher> findByRestaurantId(Integer restaurantId);

    List<Voucher> findByRestaurantIdIsNull();

    List<Voucher> findByRestaurantIdOrRestaurantIdIsNull(Integer restaurantId);

    List<Voucher> findByIsActiveTrue();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Voucher v SET v.usedCount = v.usedCount + 1 " +
           "WHERE v.id = :id AND v.isActive = true " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)")
    int incrementUsedCountIfAvailable(@Param("id") Integer id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Voucher v SET v.usedCount = CASE WHEN v.usedCount > 0 THEN v.usedCount - 1 ELSE 0 END WHERE v.id = :id")
    int decrementUsedCount(@Param("id") Integer id);
}

