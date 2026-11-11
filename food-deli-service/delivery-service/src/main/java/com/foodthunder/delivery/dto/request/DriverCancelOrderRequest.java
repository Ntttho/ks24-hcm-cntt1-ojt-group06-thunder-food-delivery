package com.foodthunder.delivery.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverCancelOrderRequest {

    /**
     * Mã lý do hủy đơn theo đặc tả PRD:
     * - MERCHANT_DELAY (Quán làm lâu - có tính lỗi CR)
     * - VEHICLE_ISSUE (Thủng lốp / hỏng xe - có tính lỗi CR)
     * - FLOODED_ROAD (Đường ngập / cấm đường - có tính lỗi CR)
     * - PERSONAL_REASON (Lý do cá nhân - có tính lỗi CR)
     * - CUSTOMER_REQUEST (Khách hàng yêu cầu hủy - không tính lỗi CR)
     * - SYSTEM_ISSUE (Lỗi kỹ thuật hệ thống - không tính lỗi CR)
     */
    @NotBlank(message = "Mã lý do hủy đơn (reasonCode) không được để trống")
    private String reasonCode;

    private String note;
}

