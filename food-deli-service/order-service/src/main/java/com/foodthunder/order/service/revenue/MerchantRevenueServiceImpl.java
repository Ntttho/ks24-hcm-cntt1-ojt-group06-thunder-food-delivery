package com.foodthunder.order.service.revenue;

import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.dto.revenue.*;
import com.foodthunder.order.entity.Order;
import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.repository.OrderItemRepository;
import com.foodthunder.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MerchantRevenueServiceImpl implements MerchantRevenueService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestaurantClient restaurantClient;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter ISO_DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public MerchantRevenueSummaryResponse getRevenueSummary(
            Integer restaurantId,
            List<Integer> restaurantIds,
            String period,
            LocalDate startDate,
            LocalDate endDate,
            Integer merchantUserId,
            String userRole
    ) {
        DateRange range = resolveDateRange(period, startDate, endDate);
        List<Order> orders = fetchOrders(restaurantId, restaurantIds, range.start, range.end);

        String restaurantName = resolveRestaurantName(restaurantId, restaurantIds);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        long successfulOrders = 0L;
        long totalOrders = orders.size();
        long cancelledOrders = 0L;

        for (Order o : orders) {
            String statusCode = o.getStatus() != null ? o.getStatus().getCode() : "";
            if (OrderStatus.COMPLETED.equalsIgnoreCase(statusCode)) {
                successfulOrders++;
                if (o.getTotalAmount() != null) {
                    totalRevenue = totalRevenue.add(o.getTotalAmount());
                }
                if (o.getDiscountAmount() != null) {
                    totalDiscount = totalDiscount.add(o.getDiscountAmount());
                }
            } else if (OrderStatus.CANCELLED.equalsIgnoreCase(statusCode) || OrderStatus.TIMEOUT.equalsIgnoreCase(statusCode)) {
                cancelledOrders++;
            }
        }

        BigDecimal aov = successfulOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(successfulOrders), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        double completionRate = totalOrders > 0
                ? Math.round((successfulOrders * 100.0 / totalOrders) * 10.0) / 10.0
                : 0.0;

        return MerchantRevenueSummaryResponse.builder()
                .restaurantId(restaurantId)
                .restaurantName(restaurantName)
                .period(range.periodName)
                .startDate(range.start.toLocalDate())
                .endDate(range.end.toLocalDate())
                .totalRevenue(totalRevenue)
                .successfulOrders(successfulOrders)
                .totalOrders(totalOrders)
                .cancelledOrders(cancelledOrders)
                .averageOrderValue(aov)
                .totalDiscount(totalDiscount)
                .completionRate(completionRate)
                .build();
    }

    @Override
    public RevenueChartResponse getRevenueChart(
            Integer restaurantId,
            List<Integer> restaurantIds,
            String period,
            LocalDate startDate,
            LocalDate endDate,
            Integer merchantUserId,
            String userRole
    ) {
        DateRange range = resolveDateRange(period, startDate, endDate);
        List<Order> orders = fetchOrders(restaurantId, restaurantIds, range.start, range.end);

        List<RevenueDataPoint> points = generateChartPoints(range, orders);

        BigDecimal totalPeriodRevenue = BigDecimal.ZERO;
        long totalPeriodOrders = 0L;
        for (RevenueDataPoint p : points) {
            totalPeriodRevenue = totalPeriodRevenue.add(p.getRevenue());
            totalPeriodOrders += p.getOrderCount();
        }

        return RevenueChartResponse.builder()
                .restaurantId(restaurantId)
                .period(range.periodName)
                .totalPeriodRevenue(totalPeriodRevenue)
                .totalPeriodOrders(totalPeriodOrders)
                .points(points)
                .build();
    }

    @Override
    public List<TopSellingFoodDto> getTopSellingFoods(
            Integer restaurantId,
            List<Integer> restaurantIds,
            int limit,
            LocalDate startDate,
            LocalDate endDate,
            Integer merchantUserId,
            String userRole
    ) {
        DateRange range = resolveDateRange("MONTH", startDate, endDate);
        int safeLimit = Math.max(1, Math.min(limit, 50));
        PageRequest pageRequest = PageRequest.of(0, safeLimit);

        List<Object[]> rows;
        if (restaurantId != null && restaurantId > 0) {
            rows = orderItemRepository.findTopSellingFoodsByRestaurantId(restaurantId, range.start, range.end, pageRequest);
        } else if (restaurantIds != null && !restaurantIds.isEmpty()) {
            rows = orderItemRepository.findTopSellingFoodsByRestaurantIdIn(restaurantIds, range.start, range.end, pageRequest);
        } else {
            rows = Collections.emptyList();
        }

        List<TopSellingFoodDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 4) continue;
            Integer foodId = row[0] instanceof Number ? ((Number) row[0]).intValue() : null;
            String foodName = row[1] != null ? row[1].toString() : "Món #" + foodId;
            long qty = row[2] instanceof Number ? ((Number) row[2]).longValue() : 0L;
            BigDecimal rev = BigDecimal.ZERO;
            if (row[3] instanceof BigDecimal) {
                rev = (BigDecimal) row[3];
            } else if (row[3] instanceof Number) {
                rev = BigDecimal.valueOf(((Number) row[3]).doubleValue());
            }

            result.add(TopSellingFoodDto.builder()
                    .foodId(foodId)
                    .foodName(foodName)
                    .totalQuantitySold(qty)
                    .totalRevenue(rev)
                    .build());
        }
        return result;
    }

    @Override
    public List<MultiBranchRevenueDto> getMultiBranchComparison(
            List<Integer> restaurantIds,
            String period,
            LocalDate startDate,
            LocalDate endDate,
            Integer merchantUserId,
            String userRole
    ) {
        if (restaurantIds == null || restaurantIds.isEmpty()) {
            return Collections.emptyList();
        }

        DateRange range = resolveDateRange(period, startDate, endDate);
        List<Order> orders = orderRepository.findByRestaurantIdInAndCreatedAtBetween(restaurantIds, range.start, range.end);

        Map<Integer, List<Order>> ordersByRestaurant = orders.stream()
                .collect(Collectors.groupingBy(Order::getRestaurantId));

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<MultiBranchRevenueDto> branchList = new ArrayList<>();

        for (Integer rId : restaurantIds) {
            List<Order> rOrders = ordersByRestaurant.getOrDefault(rId, Collections.emptyList());
            BigDecimal rev = BigDecimal.ZERO;
            long completed = 0L;
            long cancelled = 0L;

            for (Order o : rOrders) {
                String code = o.getStatus() != null ? o.getStatus().getCode() : "";
                if (OrderStatus.COMPLETED.equalsIgnoreCase(code)) {
                    completed++;
                    if (o.getTotalAmount() != null) {
                        rev = rev.add(o.getTotalAmount());
                    }
                } else if (OrderStatus.CANCELLED.equalsIgnoreCase(code) || OrderStatus.TIMEOUT.equalsIgnoreCase(code)) {
                    cancelled++;
                }
            }

            grandTotal = grandTotal.add(rev);
            String name = resolveRestaurantName(rId, null);

            branchList.add(MultiBranchRevenueDto.builder()
                    .restaurantId(rId)
                    .restaurantName(name)
                    .totalRevenue(rev)
                    .completedOrders(completed)
                    .cancelledOrders(cancelled)
                    .build());
        }

        final BigDecimal finalGrandTotal = grandTotal;
        for (MultiBranchRevenueDto dto : branchList) {
            double percent = (finalGrandTotal.compareTo(BigDecimal.ZERO) > 0)
                    ? Math.round((dto.getTotalRevenue().doubleValue() * 100.0 / finalGrandTotal.doubleValue()) * 10.0) / 10.0
                    : 0.0;
            dto.setContributionPercentage(percent);
        }

        // Sort descending by revenue
        branchList.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));
        return branchList;
    }

    // --- Private Helper Methods ---

    private List<Order> fetchOrders(Integer restaurantId, List<Integer> restaurantIds, LocalDateTime start, LocalDateTime end) {
        if (restaurantId != null && restaurantId > 0) {
            return orderRepository.findByRestaurantIdAndCreatedAtBetween(restaurantId, start, end);
        } else if (restaurantIds != null && !restaurantIds.isEmpty()) {
            return orderRepository.findByRestaurantIdInAndCreatedAtBetween(restaurantIds, start, end);
        }
        return Collections.emptyList();
    }

    private String resolveRestaurantName(Integer restaurantId, List<Integer> restaurantIds) {
        if (restaurantId != null && restaurantId > 0) {
            try {
                ResponseEntity<ApiResponse<RemoteRestaurantDto>> res = restaurantClient.getRestaurantDetail(restaurantId);
                if (res != null && res.getBody() != null && res.getBody().getData() != null) {
                    return res.getBody().getData().getName();
                }
            } catch (Exception e) {
                log.debug("Could not fetch restaurant name for ID: {}", restaurantId);
            }
            return "Chi nhánh #" + restaurantId;
        } else if (restaurantIds != null && !restaurantIds.isEmpty()) {
            return "Tất cả chi nhánh (" + restaurantIds.size() + " quán)";
        }
        return "Tất cả chi nhánh";
    }

    private static class DateRange {
        LocalDateTime start;
        LocalDateTime end;
        String periodName;
    }

    private DateRange resolveDateRange(String period, LocalDate customStart, LocalDate customEnd) {
        DateRange dr = new DateRange();
        LocalDate today = LocalDate.now();

        if (customStart != null && customEnd != null) {
            dr.start = customStart.atStartOfDay();
            dr.end = customEnd.atTime(LocalTime.MAX);
            dr.periodName = "CUSTOM";
            return dr;
        }

        String p = period != null ? period.trim().toUpperCase() : "MONTH";
        dr.periodName = p;

        switch (p) {
            case "DAY":
            case "TODAY":
                dr.start = today.atStartOfDay();
                dr.end = today.atTime(LocalTime.MAX);
                break;
            case "WEEK":
                dr.start = today.minusDays(6).atStartOfDay();
                dr.end = today.atTime(LocalTime.MAX);
                break;
            case "YEAR":
                dr.start = LocalDate.of(today.getYear(), 1, 1).atStartOfDay();
                dr.end = LocalDate.of(today.getYear(), 12, 31).atTime(LocalTime.MAX);
                break;
            case "MONTH":
            default:
                dr.start = today.minusDays(29).atStartOfDay();
                dr.end = today.atTime(LocalTime.MAX);
                dr.periodName = "MONTH";
                break;
        }
        return dr;
    }

    private List<RevenueDataPoint> generateChartPoints(DateRange range, List<Order> orders) {
        List<RevenueDataPoint> points = new ArrayList<>();

        if ("DAY".equalsIgnoreCase(range.periodName) || "TODAY".equalsIgnoreCase(range.periodName)) {
            // Group by 2-hour slots across 24h
            for (int h = 0; h < 24; h += 2) {
                String slotLabel = String.format("%02d:00", h);
                int startHour = h;
                int endHour = h + 2;

                BigDecimal rev = BigDecimal.ZERO;
                long count = 0L;
                long cancelled = 0L;

                for (Order o : orders) {
                    if (o.getCreatedAt() != null) {
                        int orderHour = o.getCreatedAt().getHour();
                        if (orderHour >= startHour && orderHour < endHour) {
                            String code = o.getStatus() != null ? o.getStatus().getCode() : "";
                            if (OrderStatus.COMPLETED.equalsIgnoreCase(code)) {
                                count++;
                                if (o.getTotalAmount() != null) rev = rev.add(o.getTotalAmount());
                            } else if (OrderStatus.CANCELLED.equalsIgnoreCase(code)) {
                                cancelled++;
                            }
                        }
                    }
                }

                points.add(RevenueDataPoint.builder()
                        .label(slotLabel)
                        .date(range.start.toLocalDate().format(ISO_DATE_FMT) + " " + slotLabel)
                        .revenue(rev)
                        .orderCount(count)
                        .cancelledCount(cancelled)
                        .build());
            }
        } else if ("YEAR".equalsIgnoreCase(range.periodName)) {
            // Group by 12 months
            int year = range.start.getYear();
            for (int m = 1; m <= 12; m++) {
                String label = "Tháng " + m;
                BigDecimal rev = BigDecimal.ZERO;
                long count = 0L;
                long cancelled = 0L;

                for (Order o : orders) {
                    if (o.getCreatedAt() != null && o.getCreatedAt().getYear() == year && o.getCreatedAt().getMonthValue() == m) {
                        String code = o.getStatus() != null ? o.getStatus().getCode() : "";
                        if (OrderStatus.COMPLETED.equalsIgnoreCase(code)) {
                            count++;
                            if (o.getTotalAmount() != null) rev = rev.add(o.getTotalAmount());
                        } else if (OrderStatus.CANCELLED.equalsIgnoreCase(code)) {
                            cancelled++;
                        }
                    }
                }

                points.add(RevenueDataPoint.builder()
                        .label(label)
                        .date(String.format("%04d-%02d", year, m))
                        .revenue(rev)
                        .orderCount(count)
                        .cancelledCount(cancelled)
                        .build());
            }
        } else {
            // By day (WEEK, MONTH, CUSTOM)
            LocalDate cur = range.start.toLocalDate();
            LocalDate last = range.end.toLocalDate();

            long totalDays = ChronoUnit.DAYS.between(cur, last) + 1;
            // Map orders by day
            Map<LocalDate, List<Order>> ordersByDay = new HashMap<>();
            for (Order o : orders) {
                if (o.getCreatedAt() != null) {
                    LocalDate d = o.getCreatedAt().toLocalDate();
                    ordersByDay.computeIfAbsent(d, k -> new ArrayList<>()).add(o);
                }
            }

            while (!cur.isAfter(last)) {
                List<Order> dayOrders = ordersByDay.getOrDefault(cur, Collections.emptyList());
                BigDecimal rev = BigDecimal.ZERO;
                long count = 0L;
                long cancelled = 0L;

                for (Order o : dayOrders) {
                    String code = o.getStatus() != null ? o.getStatus().getCode() : "";
                    if (OrderStatus.COMPLETED.equalsIgnoreCase(code)) {
                        count++;
                        if (o.getTotalAmount() != null) rev = rev.add(o.getTotalAmount());
                    } else if (OrderStatus.CANCELLED.equalsIgnoreCase(code)) {
                        cancelled++;
                    }
                }

                String label = cur.format(DATE_FMT);
                points.add(RevenueDataPoint.builder()
                        .label(label)
                        .date(cur.format(ISO_DATE_FMT))
                        .revenue(rev)
                        .orderCount(count)
                        .cancelledCount(cancelled)
                        .build());

                cur = cur.plusDays(1);
            }
        }

        return points;
    }
}

