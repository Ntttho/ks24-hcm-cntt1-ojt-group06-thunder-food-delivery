package com.foodthunder.payment.util;

import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
public class VnPayUtil {

    private VnPayUtil() {
    }

    /**
     * Compute HMAC-SHA512 hex signature according to VNPay specification.
     */
    public static String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) {
                throw new IllegalArgumentException("Key and data cannot be null");
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.error("Failed to generate HMAC-SHA512", ex);
            return "";
        }
    }

    /**
     * Build hash data string from query parameter map (keys sorted alphabetically).
     */
    public static String buildHashData(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                try {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                } catch (UnsupportedEncodingException e) {
                    log.error("Encoding error for field: {}", fieldName, e);
                }
            }
        }
        return hashData.toString();
    }

    /**
     * Build URL-encoded query string for VNPay redirect URL.
     */
    public static String buildQueryUrl(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                try {
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                    }
                } catch (UnsupportedEncodingException e) {
                    log.error("Encoding error for field: {}", fieldName, e);
                }
            }
        }
        return query.toString();
    }

    /**
     * Verify VNPay callback or IPN signature.
     */
    public static boolean verifyChecksum(Map<String, String> rawParams, String secretKey) {
        String vnpSecureHash = rawParams.get("vnp_SecureHash");
        if (vnpSecureHash == null || vnpSecureHash.isBlank()) {
            log.warn("Missing vnp_SecureHash in callback params");
            return false;
        }

        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : rawParams.entrySet()) {
            String key = entry.getKey();
            String val = entry.getValue();
            if (val != null && !val.isBlank() && !key.equalsIgnoreCase("vnp_SecureHash")
                    && !key.equalsIgnoreCase("vnp_SecureHashType")) {
                fields.put(key, val);
            }
        }

        String hashData = buildHashData(fields);
        String calculatedHash = hmacSHA512(secretKey, hashData);

        boolean match = calculatedHash.equalsIgnoreCase(vnpSecureHash);
        if (!match) {
            log.warn("VNPay signature verification failed. Calculated: {}, Received: {}", calculatedHash,
                    vnpSecureHash);
        }
        return match;
    }
}
