package com.foodthunder.review.repository;

import com.foodthunder.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long>, JpaSpecificationExecutor<Review> {

    boolean existsByOrderId(Long orderId);

    boolean existsByOrderIdAndTargetType(Long orderId, String targetType);

    Optional<Review> findByOrderIdAndTargetType(Long orderId, String targetType);

    List<Review> findByOrderId(Long orderId);

    List<Review> findByTargetTypeAndTargetId(String targetType, Long targetId);

    Page<Review> findByTargetTypeAndTargetId(String targetType, Long targetId, Pageable pageable);

    long countByTargetTypeAndTargetId(String targetType, Long targetId);

    long countByTargetTypeAndTargetIdAndRating(String targetType, Long targetId, Integer rating);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.targetType = :targetType AND r.targetId = :targetId")
    Double calculateAverageRating(@Param("targetType") String targetType, @Param("targetId") Long targetId);
}

