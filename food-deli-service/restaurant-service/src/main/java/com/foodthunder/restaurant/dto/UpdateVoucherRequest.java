package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateVoucherRequest {

    @Pattern(regexp = "^(FIXED|PERCENTAGE)$", message = "Loại giảm giá phải là FIXED hoặc PERCENTAGE")
    private String discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0.00", message = "Giá trị đơn tối thiểu không được âm")
    private BigDecimal minOrderValue;

    private Integer usageLimit;

    private LocalDateTime startDate;

    private LocalDateTime expiryDate;

    private Boolean isActive;
}

