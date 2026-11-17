package com.foodthunder.banner.repository;

import com.foodthunder.banner.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findAllByOrderByStartDateDesc();
}
