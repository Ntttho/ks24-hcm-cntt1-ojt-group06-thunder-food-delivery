package com.foodthunder.manager.repository;

import com.foodthunder.manager.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Integer> {
    Optional<SystemSetting> findByConfigKey(String configKey);
    boolean existsByConfigKey(String configKey);
}
