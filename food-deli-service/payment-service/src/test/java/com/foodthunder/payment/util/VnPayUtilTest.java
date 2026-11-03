package com.foodthunder.payment.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class VnPayUtilTest {

    private final String secretKey = "OQQTQXPPWRLNWHQFDNWCGMDYZTSYHHMP";

    @Test
    @DisplayName("Should generate valid HMAC-SHA512 checksum")
    void shouldGenerateHmacSha512Checksum() {
        String data = "vnp_Amount=10000000&vnp_Command=pay&vnp_CurrCode=VND";
        String hash = VnPayUtil.hmacSHA512(secretKey, data);

        assertNotNull(hash);
        assertEquals(128, hash.length(), "HMAC-SHA512 hex string should be 128 characters long");
    }

    @Test
    @DisplayName("Should verify checksum correctly when valid")
    void shouldVerifyChecksumCorrectlyWhenValid() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "10000000");
        params.put("vnp_Command", "pay");
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", "12345");

        String hashData = VnPayUtil.buildHashData(params);
        String secureHash = VnPayUtil.hmacSHA512(secretKey, hashData);
        params.put("vnp_SecureHash", secureHash);

        boolean isValid = VnPayUtil.verifyChecksum(params, secretKey);
        assertTrue(isValid, "Checksum should be valid");
    }

    @Test
    @DisplayName("Should reject checksum when payload is tampered")
    void shouldRejectChecksumWhenPayloadIsTampered() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "10000000");
        params.put("vnp_Command", "pay");
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", "12345");

        String hashData = VnPayUtil.buildHashData(params);
        String secureHash = VnPayUtil.hmacSHA512(secretKey, hashData);
        params.put("vnp_SecureHash", secureHash);

        // Tamper payload
        params.put("vnp_Amount", "50000000");

        boolean isValid = VnPayUtil.verifyChecksum(params, secretKey);
        assertFalse(isValid, "Tampered payload must fail checksum verification");
    }
}
