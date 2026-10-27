package com.foodthunder.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "food_toppings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductTopping {

    @EmbeddedId
    private ProductToppingId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("foodId")
    @JoinColumn(name = "food_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("toppingId")
    @JoinColumn(name = "topping_id", nullable = false)
    private Topping topping;
}
