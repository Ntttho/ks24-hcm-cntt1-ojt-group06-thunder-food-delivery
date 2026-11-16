package com.foodthunder.payment.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SepayUtilTest {

    @Test
    @DisplayName("Kiểm tra sinh cú pháp nội dung chuyển khoản theo chuẩn SePay Dashboard (Tiền tố FDL + tối thiểu 3 số)")
    void testBuildPaymentContent() {
        assertEquals("FDL001", SepayUtil.buildPaymentContent("FDL", 1L));
        assertEquals("FDL015", SepayUtil.buildPaymentContent("FDL", 15L));
        assertEquals("FDL123", SepayUtil.buildPaymentContent("FDL", 123L));
        assertEquals("FDL1005", SepayUtil.buildPaymentContent("FDL", 1005L));
        assertEquals("FDL001", SepayUtil.buildPaymentContent(null, 1L));
        assertEquals("FDL", SepayUtil.buildPaymentContent("FDL", null));
    }

    @Test
    @DisplayName("Kiểm tra bóc tách Order ID từ nhiều định dạng nội dung chuyển khoản SePay")
    void testExtractOrderId() {
        // Cú pháp chuẩn SePay mới
        assertEquals(1L, SepayUtil.extractOrderId("FDL001", "FDL"));
        assertEquals(15L, SepayUtil.extractOrderId("FDL015", "FDL"));
        assertEquals(123L, SepayUtil.extractOrderId("FDL123", "FDL"));
        assertEquals(1005L, SepayUtil.extractOrderId("FDL1005", "FDL"));

        // Cú pháp kèm khoảng trắng hoặc dấu gạch
        assertEquals(123L, SepayUtil.extractOrderId("FDL 123", "FDL"));
        assertEquals(123L, SepayUtil.extractOrderId("FDL_123", "FDL"));
        assertEquals(123L, SepayUtil.extractOrderId("FDL-123", "FDL"));

        // Tin nhắn ngân hàng đầy đủ
        assertEquals(1L, SepayUtil.extractOrderId("ND: NGUYEN VAN A CHUYEN TIEN FDL001 MA GD 987123", "FDL"));
        assertEquals(123L, SepayUtil.extractOrderId("ACB;17532841;FDL123;150000;TIEN VAO", "FDL"));

        // Tương thích ngược với tiền tố cũ
        assertEquals(123L, SepayUtil.extractOrderId("FOODDELI ORD123", "FDL"));
        assertEquals(123L, SepayUtil.extractOrderId("FOODDELI 123", "FDL"));
        assertEquals(123L, SepayUtil.extractOrderId("ORD123", "FDL"));
        assertEquals(123L, SepayUtil.extractOrderId("ORD 123", "FDL"));

        // Trường hợp không hợp lệ
        assertNull(SepayUtil.extractOrderId(null, "FDL"));
        assertNull(SepayUtil.extractOrderId("", "FDL"));
        assertNull(SepayUtil.extractOrderId("CHUYEN TIEN AN TOI KHONG CO MA", "FDL"));
    }
}
