package com.foodthunder.common.dto.user;

import com.foodthunder.common.enums.RoleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private Long id;
    private String phone;
    private String fullName;
    private Set<RoleType> roles;
}

