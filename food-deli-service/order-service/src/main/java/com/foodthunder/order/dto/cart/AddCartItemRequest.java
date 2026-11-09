package com.foodthunder.order.dto.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddCartItemRequest {
    @NotNull(message = "Mã sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Tên món ăn không được để trống")
    private String productName;

    @NotNull(message = "Giá món ăn không được để trống")
    private BigDecimal price;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng tối thiểu là 1")
    private Integer quantity;

    private String imageUrl;

    @NotNull(message = "Mã quán ăn không được để trống")
    private Long shopId;

    private String shopName;

    @Builder.Default
    private List<CartItemToppingDto> toppings = new ArrayList<>();

    // Flag cho phép ghi đè giỏ hàng nếu khác quán ăn (Single-Shop Constraint)
    private Boolean replaceCart;
}

