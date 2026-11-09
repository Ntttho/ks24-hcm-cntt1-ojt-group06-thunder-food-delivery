package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.Topping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToppingRepository extends JpaRepository<Topping, Integer> {

    List<Topping> findByRestaurantId(Integer restaurantId);

    List<Topping> findByRestaurantIdAndIsAvailableTrue(Integer restaurantId);

    List<Topping> findByRestaurantIdAndGroupName(Integer restaurantId, String groupName);

    boolean existsByRestaurantIdAndNameIgnoreCase(Integer restaurantId, String name);

    boolean existsByRestaurantIdAndNameIgnoreCaseAndIdNot(Integer restaurantId, String name, Integer id);

    @Query("SELECT t FROM Topping t WHERE t.restaurantId = :restaurantId " +
           "AND (:search IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.groupName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:groupName IS NULL OR t.groupName = :groupName) " +
           "AND (:isAvailable IS NULL OR t.isAvailable = :isAvailable)")
    Page<Topping> findByRestaurantIdWithFilters(
            @Param("restaurantId") Integer restaurantId,
            @Param("search") String search,
            @Param("groupName") String groupName,
            @Param("isAvailable") Boolean isAvailable,
            Pageable pageable
    );
}
