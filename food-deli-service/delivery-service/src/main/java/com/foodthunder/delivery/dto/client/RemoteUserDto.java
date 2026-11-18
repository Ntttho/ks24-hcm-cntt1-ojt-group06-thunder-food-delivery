package com.foodthunder.delivery.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RemoteUserDto {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private java.math.BigDecimal ratingAvg;
}
