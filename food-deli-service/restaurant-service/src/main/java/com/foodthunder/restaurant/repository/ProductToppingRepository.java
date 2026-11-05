package com.foodthunder.restaurant.repository;

import com.foodthunder.restaurant.entity.ProductTopping;
import com.foodthunder.restaurant.entity.ProductToppingId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductToppingRepository extends JpaRepository<ProductTopping, ProductToppingId> {

    List<ProductTopping> findByIdFoodId(Integer foodId);

    List<ProductTopping> findByIdToppingId(Integer toppingId);

    void deleteByIdFoodId(Integer foodId);

    void deleteByIdToppingId(Integer toppingId);
}
