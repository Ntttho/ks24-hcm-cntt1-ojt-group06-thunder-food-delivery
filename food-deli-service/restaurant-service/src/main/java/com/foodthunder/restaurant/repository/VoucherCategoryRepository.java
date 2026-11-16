package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.VoucherCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherCategoryRepository extends JpaRepository<VoucherCategory, Integer> {

    Optional<VoucherCategory> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<VoucherCategory> findByIsActiveTrueOrderByIdAsc();

    List<VoucherCategory> findAllByOrderByIdAsc();
}

