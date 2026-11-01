package com.foodthunder.restaurant.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDetailDto {
    private Integer id;
    private Integer ownerId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime openingTime;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime closingTime;

    private Boolean isOpen;
    private Boolean isOpenToday;
    private String temporaryClosedReason;
    private String imageUrl;
    private BigDecimal ratingAvg;
    private String approvalStatus;

    @Builder.Default
    private List<CategoryMenuDto> categories = new ArrayList<>();
}
