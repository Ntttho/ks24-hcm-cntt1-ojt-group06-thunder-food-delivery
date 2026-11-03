package com.foodthunder.common.dto.restaurant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantSummaryDto {
    private Integer id;
    private Integer ownerId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Boolean isOpen;
    private String imageUrl;
    private BigDecimal ratingAvg;
}
