package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignToppingsRequest {

    @NotNull(message = "Danh sách toppingIds không được để trống")
    private List<Integer> toppingIds;
}

