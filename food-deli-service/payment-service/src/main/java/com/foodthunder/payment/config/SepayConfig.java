package com.foodthunder.payment.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "sepay")
public class SepayConfig {

    /**
     * Tên ngân hàng viết tắt (dùng cho cổng SePay QR).
     * Ví dụ: MBBank, MB, VCB, Vietcombank, ACB, TPBank, VPBank, Techcombank...
     */
    private String bankName = "MBBank";

    /**
     * Mã BIN định danh ngân hàng Napas 247 (Ví dụ: MBBank 970422).
     */
    private String bankBin = "970422";

    /**
     * Số tài khoản ngân hàng thụ hưởng đã liên kết trên SePay.
     */
    private String accountNo = "0987654321";

    /**
     * Tên chủ tài khoản thụ hưởng.
     */
    private String accountName = "FOOD THUNDER DELI";

    /**
     * API Key xác thực khi gọi SePay API (từ https://my.sepay.vn).
     */
    private String apiKey = "sepay_api_token_here";

    /**
     * Webhook Token bí mật dùng để xác thực request gửi đến từ SePay.
     * Thường gửi qua header: `Authorization: Apikey <webhookToken>`
     */
    private String webhookToken = "sepay_webhook_token_here";

    /**
     * Tiền tố nội dung chuyển khoản định danh đơn hàng (mặc định: FOODDELI).
     * Cú pháp chuyển khoản sẽ là: FOODDELI ORD{orderId}
     */
    private String orderPrefix = "FOODDELI";

    /**
     * Template sinh ảnh QR của SePay (compact, compact2, qronly...).
     */
    private String template = "compact2";

    /**
     * Base URL sinh ảnh mã QR SePay (mặc định: https://qr.sepay.vn/img).
     */
    private String qrBaseUrl = "https://qr.sepay.vn/img";
}

