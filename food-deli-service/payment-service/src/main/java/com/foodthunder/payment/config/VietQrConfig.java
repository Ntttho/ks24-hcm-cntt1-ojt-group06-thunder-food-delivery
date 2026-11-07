package com.foodthunder.payment.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "vietqr")
public class VietQrConfig {

    /**
     * Mã định danh ngân hàng thụ hưởng (BIN / Bank ID).
     * Ví dụ: MBBank (970422), Vietcombank (970436), Techcombank (970407)...
     */
    private String bankId = "970422";

    /**
     * Số tài khoản ngân hàng thụ hưởng nhận tiền chuyển khoản.
     */
    private String accountNo = "0987654321";

    /**
     * Tên chủ tài khoản thụ hưởng.
     */
    private String accountName = "FOOD THUNDER DELI";

    /**
     * Template sinh ảnh QR của VietQR (ví dụ: compact, compact2, qr_only, print).
     */
    private String template = "compact2";

    /**
     * Base URL sinh ảnh mã VietQR (mặc định https://img.vietqr.io/image).
     */
    private String apiBaseUrl = "https://img.vietqr.io/image";

    /**
     * Khóa bảo mật xác thực Webhook biến động số dư (SePay / VietQR webhook secret token).
     */
    private String webhookSecret = "foodthunder_webhook_secret_key";

    /**
     * Tiền tố nội dung chuyển khoản định danh đơn hàng (mặc định: FOODDELI).
     */
    private String orderPrefix = "FOODDELI";

    /**
     * Client ID nếu đăng ký VietQR Open API.
     */
    private String clientId = "";

    /**
     * API Key nếu đăng ký VietQR Open API.
     */
    private String apiKey = "";
}

