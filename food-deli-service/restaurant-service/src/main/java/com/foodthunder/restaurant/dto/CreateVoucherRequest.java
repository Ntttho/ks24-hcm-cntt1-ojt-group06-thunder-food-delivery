package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVoucherRequest {

    private Integer restaurantId; // null = global voucher (Admin), not null = shop voucher (Merchant)

    @NotBlank(message = "Mã voucher không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9_]{3,20}$", message = "Mã voucher chỉ chứa chữ, số, gạch dưới và dài từ 3-20 ký tự")
    private String code;

    @NotBlank(message = "Loại giảm giá không được để trống")
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

    @NotNull(message = "Ngày hết hạn không được để trống")
    private LocalDateTime expiryDate;
}

