package com.foodthunder.restaurant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductToppingId implements Serializable {

    @Column(name = "food_id")
    private Integer foodId;

    @Column(name = "topping_id")
    private Integer toppingId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductToppingId that = (ProductToppingId) o;
        return Objects.equals(foodId, that.foodId) && Objects.equals(toppingId, that.toppingId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(foodId, toppingId);
    }
}
