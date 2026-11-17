package com.foodthunder.delivery.dto.response;

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
public class DriverWalletResponse {

    private Integer driverId;
    private Double availableBalance;       // Số dư ví thu nhập khả dụng (tiền ship các đơn COMPLETED)
    private Double holdingCodAmount;       // Tổng tiền mặt COD đang giữ của quán/hệ thống
    private Double todayEarnings;          // Thu nhập kiếm được trong ngày hôm nay
    private Long completedTripsCount;      // Tổng số cuốc xe đã giao thành công

    @Builder.Default
    private List<DriverWalletTransactionResponse> transactionHistory = new ArrayList<>();
}

