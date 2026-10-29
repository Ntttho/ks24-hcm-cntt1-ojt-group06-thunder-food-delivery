package com.foodthunder.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToppingGroupDto {
    private String groupName;
    private Boolean required;
    private Integer minSelection;
    private Integer maxSelection;
    @Builder.Default
    private List<ToppingDto> toppings = new ArrayList<>();
}
