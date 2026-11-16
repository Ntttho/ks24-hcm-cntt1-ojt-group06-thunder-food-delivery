# Nguyên lý kết nối SePay Webhook qua Ngrok

Bình thường, máy tính của bạn chạy backend ở địa chỉ `http://localhost:8080` (mạng nội bộ, có router/firewall bảo vệ). Máy chủ **SePay** nằm ngoài Internet không thể nào kết nối trực tiếp vào `localhost` của bạn được.

**Ngrok** giải quyết bài toán này thông qua luồng hoạt động chi tiết dưới đây:

## 1. Sơ đồ luồng kết nối

```text
[Ngân hàng] 
     │ (Khách quét VietQR chuyển tiền)
     ▼
[Máy chủ SePay] (Trên Internet)
     │ 
     │ Bắn HTTP POST Webhook
     ▼
[https://chihuahua-delegator-thrift.ngrok-free.dev] (Ngrok Cloud Edge)
     │ 
     │ Truyền qua đường hầm bảo mật (Tunnel)
     ▼
[Tiến trình ngrok.exe trên máy bạn]
     │ 
     │ Chuyển tiếp nội bộ (Forwarding)
     ▼
[API Gateway: localhost:8080]
     │
     │ Route tới
     ▼
[Payment Service: localhost:8085]
     │
     │ Xác thực token -> Tìm mã đơn FDLxxx -> Gọi Order Service
     ▼
[Order Service: localhost:8083]
     │
     │ Chuyển trạng thái đơn -> PENDING -> Kêu chuông "Ding Dong"
     ▼
   Hoàn tất!
```

---

## 2. ⚠️ Điểm bắt buộc lưu ý trên SePay Dashboard

Khi cấu hình trường **URL Webhook** trên giao diện quản lý của SePay:

* ❌ **KHÔNG ĐƯỢC** chỉ để trần domain:
  `https://chihuahua-delegator-thrift.ngrok-free.dev` *(Sẽ bị lỗi `404 Not Found`)*
* ✅ **BẮT BUỘC** phải điền đầy đủ đường dẫn API:
  `https://chihuahua-delegator-thrift.ngrok-free.dev/api/v1/payments/sepay/webhook`

---

## 3. Quy trình vận hành thực tế

1. **Khởi chạy Ngrok Tunnel** trên máy của bạn bằng lệnh:
   ```bash
   ngrok http --url=chihuahua-delegator-thrift.ngrok-free.dev 8080
   ```
2. **Khách hàng thanh toán:** Khách thực hiện chuyển khoản với nội dung đúng cú pháp mã đơn hàng (ví dụ: `FDL001`).
3. **Xử lý tự động:** SePay lập tức bắn webhook vào đường dẫn đã cấu hình $\rightarrow$ Backend tiếp nhận và tự động cập nhật trạng thái đơn hàng ngay lập tức!