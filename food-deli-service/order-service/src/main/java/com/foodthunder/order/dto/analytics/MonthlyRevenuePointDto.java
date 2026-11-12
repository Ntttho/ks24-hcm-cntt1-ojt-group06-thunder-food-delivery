package com.foodthunder.order.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Điểm dữ liệu doanh thu theo từng tháng cho biểu đồ 12 tháng trên Admin Analytics Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyRevenuePointDto {
    /** Nhãn tháng dạng MM/YYYY (VD: "01/2026"). */
    private String month;

    /** Nhãn ngắn hiển thị trục X (VD: "T1".."T12"). */
    private String label;

    /** Tổng doanh thu các đơn COMPLETED trong tháng. */
    private BigDecimal revenue;

    /** Số đơn COMPLETED trong tháng. */
    private long completedOrdersCount;
}

