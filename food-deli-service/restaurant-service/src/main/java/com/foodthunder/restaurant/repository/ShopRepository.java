package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.Shop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Integer> {

    Optional<Shop> findByIdAndDeletedAtIsNull(Integer id);

    List<Shop> findByOwnerIdAndDeletedAtIsNull(Integer ownerId);

    @Query("""
        SELECT DISTINCT s FROM Shop s
        LEFT JOIN s.categories c
        WHERE s.deletedAt IS NULL
          AND (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:categoryId IS NULL OR c.id = :categoryId)
          AND (:isOpen IS NULL OR s.isOpen = :isOpen)
    """)
    Page<Shop> searchShops(
        @Param("search") String search,
        @Param("categoryId") Integer categoryId,
        @Param("isOpen") Boolean isOpen,
        Pageable pageable
    );
}
