package com.foodthunder.payment.util;

import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public final class SepayUtil {

    private SepayUtil() {
        // Utility class
    }

    /**
     * Sinh URL ảnh mã QR SePay (tích hợp VietQR Napas 247):
     * Cú pháp SePay: https://qr.sepay.vn/img?bank={bank}&acc={acc}&template={template}&amount={amount}&des={des}
     */
    public static String buildSepayQrUrl(String baseUrl,
                                         String bankName,
                                         String accountNo,
                                         String template,
                                         BigDecimal amount,
                                         String content) {
        StringBuilder sb = new StringBuilder();
        String cleanBaseUrl = (baseUrl == null || baseUrl.isBlank()) ? "https://qr.sepay.vn/img" : baseUrl.trim();
        sb.append(cleanBaseUrl.endsWith("/") ? cleanBaseUrl.substring(0, cleanBaseUrl.length() - 1) : cleanBaseUrl);

        sb.append("?bank=").append(urlEncode(bankName != null ? bankName : "MBBank"));
        sb.append("&acc=").append(urlEncode(accountNo != null ? accountNo : ""));
        sb.append("&template=").append(urlEncode(template != null ? template : "compact2"));
        sb.append("&amount=").append(amount != null ? amount.longValue() : 0);

        if (content != null && !content.isBlank()) {
            sb.append("&des=").append(urlEncode(content));
        }

        return sb.toString();
    }

    /**
     * Sinh cú pháp nội dung chuyển khoản định danh đơn hàng:
     * Ví dụ: FOODDELI ORD123
     */
    public static String buildPaymentContent(String prefix, Long orderId) {
        String cleanPrefix = (prefix == null || prefix.isBlank()) ? "FOODDELI" : prefix.trim();
        return cleanPrefix + " ORD" + orderId;
    }

    /**
     * Trích xuất mã đơn hàng (orderId) từ nội dung chuyển khoản của SePay Webhook.
     * Hỗ trợ các trường hợp SePay chuyển tiếp:
     * - "FOODDELI ORD123"
     * - "ND: CHUYEN TIEN FOODDELI ORD123 MA GD 87219"
     * - "FOODDELI123" hoặc "ORD123"
     */
    public static Long extractOrderId(String transactionContent, String prefix) {
        if (transactionContent == null || transactionContent.isBlank()) {
            return null;
        }

        String safePrefix = (prefix == null || prefix.isBlank()) ? "FOODDELI" : prefix.trim();

        // 1. Tìm theo tiền tố định danh (FOODDELI ORD123 / FOODDELI 123)
        Pattern prefixPattern = Pattern.compile(Pattern.quote(safePrefix) + "[\\s_:-]*ORD?(\\d+)", Pattern.CASE_INSENSITIVE);
        Matcher prefixMatcher = prefixPattern.matcher(transactionContent);
        if (prefixMatcher.find()) {
            try {
                return Long.parseLong(prefixMatcher.group(1));
            } catch (NumberFormatException e) {
                log.warn("Lỗi parse orderId từ prefixMatcher: {}", prefixMatcher.group(1));
            }
        }

        // 2. Tìm theo mẫu ORD123 hoặc ORD 123
        Pattern ordPattern = Pattern.compile("ORD[\\s_:-]*(\\d+)", Pattern.CASE_INSENSITIVE);
        Matcher ordMatcher = ordPattern.matcher(transactionContent);
        if (ordMatcher.find()) {
            try {
                return Long.parseLong(ordMatcher.group(1));
            } catch (NumberFormatException e) {
                log.warn("Lỗi parse orderId từ ordMatcher: {}", ordMatcher.group(1));
            }
        }

        return null;
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}

