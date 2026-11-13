package com.foodthunder.auth.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Yêu cầu cập nhật tham số toàn sàn và chi phí Order từ Admin Portal.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSystemSettingsRequest {

    @NotNull(message = "Khoảng cách cơ bản không được để trống")
    @DecimalMin(value = "0.5", message = "Khoảng cách cơ bản phải từ 0.5 km trở lên")
    @DecimalMax(value = "20.0", message = "Khoảng cách cơ bản tối đa 20 km")
    private Double baseKm;

    @NotNull(message = "Phí ship cơ bản không được để trống")
    @DecimalMin(value = "0", message = "Phí ship cơ bản không được âm")
    private BigDecimal baseFee;

    @NotNull(message = "Phí mỗi km tiếp theo không được để trống")
    @DecimalMin(value = "0", message = "Phí mỗi km tiếp theo không được âm")
    private BigDecimal extraPerKm;

    @NotNull(message = "Phụ phí giao ưu tiên không được để trống")
    @DecimalMin(value = "0", message = "Phụ phí giao ưu tiên không được âm")
    private BigDecimal priorityFee;

    @NotNull(message = "Phí dịch vụ & đóng gói không được để trống")
    @DecimalMin(value = "0", message = "Phí dịch vụ & đóng gói không được âm")
    private BigDecimal serviceFee;

    @NotNull(message = "Thuế VAT không được để trống")
    @DecimalMin(value = "0", message = "Thuế VAT không được âm")
    @DecimalMax(value = "1", message = "Thuế VAT phải nằm trong khoảng 0 đến 1 (vd: 0.08 = 8%)")
    private BigDecimal vatRate;

    @NotNull(message = "Tùy chọn giá món đã bao gồm VAT không được để trống")
    private Boolean vatIncluded;

    @NotNull(message = "Tỷ lệ hoa hồng sàn không được để trống")
    @DecimalMin(value = "0", message = "Tỷ lệ hoa hồng sàn không được âm")
    @DecimalMax(value = "50", message = "Tỷ lệ hoa hồng sàn tối đa 50%")
    private BigDecimal platformCommissionPercent;
}

