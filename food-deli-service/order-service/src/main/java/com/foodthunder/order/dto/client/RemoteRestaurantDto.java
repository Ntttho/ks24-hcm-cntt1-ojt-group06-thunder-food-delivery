package com.foodthunder.order.dto.client;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteRestaurantDto {
    private Integer id;
    private Integer ownerId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Boolean isOpen;
    private Boolean isOpenToday;
    private String temporaryClosedReason;
    private String imageUrl;
    private BigDecimal ratingAvg;
    private String approvalStatus;
}

