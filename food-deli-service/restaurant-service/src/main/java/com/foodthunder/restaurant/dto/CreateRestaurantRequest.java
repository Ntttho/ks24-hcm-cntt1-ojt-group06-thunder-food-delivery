package com.foodthunder.restaurant.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRestaurantRequest {

    @NotBlank(message = "Tên quán ăn không được để trống")
    private String name;

    @NotBlank(message = "Địa chỉ quán ăn không được để trống")
    private String address;

    private Double latitude;
    private Double longitude;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime openingTime;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime closingTime;

    private String imageUrl;

    private String initialCategoryName;
}
