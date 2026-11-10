package com.foodthunder.order.service.revenue;

import com.foodthunder.order.dto.revenue.*;

import java.time.LocalDate;
import java.util.List;

public interface MerchantRevenueService {

    MerchantRevenueSummaryResponse getRevenueSummary(
            Integer restaurantId,
            List<Integer> restaurantIds,
            String period,
            LocalDate startDate,
            LocalDate endDate,
            Integer merchantUserId,
            String userRole
    );

    RevenueChartResponse getRevenueChart(
            Integer restaurantId,
            List<Integer> restaurantIds,
            String period,
            LocalDate startDate,
            LocalDate endDate,
            Integer merchantUserId,
            String userRole
    );

    List<TopSellingFoodDto> getTopSellingFoods(
            Integer restaurantId,
            List<Integer> restaurantIds,
            int limit,
            LocalDate startDate,
            LocalDate endDate,
            Integer merchantUserId,
            String userRole
    );

    List<MultiBranchRevenueDto> getMultiBranchComparison(
            List<Integer> restaurantIds,
            String period,
            LocalDate startDate,
            LocalDate endDate,
            Integer merchantUserId,
            String userRole
    );
}

