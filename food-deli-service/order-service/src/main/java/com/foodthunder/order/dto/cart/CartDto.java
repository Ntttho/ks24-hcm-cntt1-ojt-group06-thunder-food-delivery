package com.foodthunder.order.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDto implements Serializable {
    private Long userId;
    private Long shopId;
    private String shopName;

    @Builder.Default
    private List<CartItemDto> items = new ArrayList<>();

    @Builder.Default
    private Integer totalQuantity = 0;

    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public void recalculateTotals() {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        int qty = 0;
        BigDecimal total = BigDecimal.ZERO;

        for (CartItemDto item : this.items) {
            int itemQty = (item.getQuantity() != null && item.getQuantity() > 0) ? item.getQuantity() : 1;
            qty += itemQty;

            BigDecimal itemPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
            BigDecimal toppingSum = BigDecimal.ZERO;
            if (item.getToppings() != null) {
                for (CartItemToppingDto t : item.getToppings()) {
                    if (t.getPrice() != null) {
                        toppingSum = toppingSum.add(t.getPrice());
                    }
                }
            }

            BigDecimal unitPrice = itemPrice.add(toppingSum);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(itemQty)));
        }

        this.totalQuantity = qty;
        this.totalAmount = total;
        this.updatedAt = Instant.now();
    }
}

