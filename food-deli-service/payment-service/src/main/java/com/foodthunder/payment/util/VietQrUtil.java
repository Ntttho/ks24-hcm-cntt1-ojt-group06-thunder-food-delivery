package com.foodthunder.payment.util;

import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public final class VietQrUtil {

    private VietQrUtil() {
        // Utility class
    }

    /**
     * Sinh URL ảnh mã QR động VietQR theo định dạng chuẩn:
     * https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount={amount}&addInfo={addInfo}&accountName={accountName}
     */
    public static String buildQrImageUrl(String baseUrl,
                                         String bankId,
                                         String accountNo,
                                         String template,
                                         BigDecimal amount,
                                         String content,
                                         String accountName) {
        StringBuilder sb = new StringBuilder();
        sb.append(baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl);
        sb.append("/").append(bankId).append("-").append(accountNo).append("-").append(template).append(".png");

        sb.append("?amount=").append(amount.longValue());

        if (content != null && !content.isBlank()) {
            sb.append("&addInfo=").append(urlEncode(content));
        }

        if (accountName != null && !accountName.isBlank()) {
            sb.append("&accountName=").append(urlEncode(accountName));
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
     * Trích xuất mã đơn hàng (orderId) từ nội dung chuyển khoản của biến động số dư.
     * Hỗ trợ các định dạng phong phú:
     * - "ND: CHUYEN TIEN FOODDELI ORD123 MA GD 87219" -> 123
     * - "FOODDELI_ORD_123" -> 123
     * - "ORD123" -> 123
     */
    public static Long extractOrderId(String transactionContent, String prefix) {
        if (transactionContent == null || transactionContent.isBlank()) {
            return null;
        }

        String safePrefix = (prefix == null || prefix.isBlank()) ? "FOODDELI" : prefix.trim();

        // 1. Tìm theo định dạng có prefix: FOODDELI ORD123 hoặc FOODDELI123 hoặc FOODDELI_123
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

