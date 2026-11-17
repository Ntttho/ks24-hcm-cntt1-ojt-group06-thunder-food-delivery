package com.foodthunder.order.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteAddressDto {
    private Long id;
    private Long userId;
    private String address;
    private Double latitude;
    private Double longitude;
}
