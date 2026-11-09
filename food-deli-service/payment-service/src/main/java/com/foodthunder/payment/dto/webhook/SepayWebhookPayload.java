package com.foodthunder.payment.dto.webhook;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SepayWebhookPayload {

    /**
     * ID giao dịch trên hệ thống SePay.
     */
    private Long id;

    /**
     * Cổng / Tên ngân hàng ghi nhận giao dịch (ví dụ: MBBank, Vietcombank...).
     */
    private String gateway;

    /**
     * Thời gian diễn ra giao dịch trên ngân hàng.
     */
    @JsonAlias({"transactionDate", "transaction_date"})
    private String transactionDate;

    /**
     * Số tài khoản ngân hàng thụ hưởng nhận tiền.
     */
    @JsonAlias({"accountNumber", "account_number"})
    private String accountNumber;

    /**
     * Tài khoản phụ (nếu có).
     */
    @JsonAlias({"subAccount", "sub_account"})
    private String subAccount;

    /**
     * Loại giao dịch: "in" (tiền vào) hoặc "out" (tiền ra).
     */
    @JsonAlias({"transferType", "transfer_type"})
    private String transferType;

    /**
     * Số tiền giao dịch chuyển khoản.
     */
    @JsonAlias({"amount", "transferAmount", "amount_in", "transfer_amount"})
    private BigDecimal transferAmount;

    /**
     * Số dư tích lũy sau giao dịch.
     */
    private BigDecimal accumulated;

    /**
     * Mã code SePay bóc tách tự động nếu khớp cấu hình.
     */
    private String code;

    /**
     * Nội dung chuyển khoản thực tế từ ngân hàng.
     */
    @JsonAlias({"content", "transactionContent", "transaction_content"})
    private String content;

    /**
     * Mã tham chiếu của ngân hàng (FT... hoặc mã giao dịch).
     */
    @JsonAlias({"referenceCode", "reference_number", "reference_code"})
    private String referenceCode;

    /**
     * Mô tả chi tiết giao dịch từ sao kê ngân hàng.
     */
    private String description;

    /**
     * Tiện ích lấy nội dung chuyển khoản an toàn.
     */
    public String getSafeContent() {
        if (content != null && !content.isBlank()) {
            return content;
        }
        if (description != null && !description.isBlank()) {
            return description;
        }
        return code;
    }
}

