package com.foodthunder.auth.service;

import com.foodthunder.auth.dto.OrderCostConfigDto;
import com.foodthunder.auth.dto.SystemSettingsResponse;
import com.foodthunder.auth.dto.UpdateSystemSettingsRequest;

public interface SystemSettingService {

    SystemSettingsResponse getSystemSettings();

    SystemSettingsResponse updateSystemSettings(UpdateSystemSettingsRequest request);

    OrderCostConfigDto getOrderCostConfig();
}

