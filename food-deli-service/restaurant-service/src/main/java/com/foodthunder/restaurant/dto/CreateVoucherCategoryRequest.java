package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVoucherCategoryRequest {

    @NotBlank(message = "Mã danh mục voucher không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9_]{2,50}$", message = "Mã danh mục chỉ gồm chữ, số, gạch dưới và dài 2-50 ký tự")
    private String code;

    @NotBlank(message = "Tên danh mục voucher không được để trống")
    @Size(max = 100, message = "Tên danh mục tối đa 100 ký tự")
    private String name;

    @Size(max = 255, message = "Mô tả tối đa 255 ký tự")
    private String description;

    private Boolean isActive;
}

