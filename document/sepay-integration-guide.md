# 💳 HƯỚNG DẪN TÍCH HỢP CỔNG THANH TOÁN SEPAY (VIETQR NAPAS 247) & WEBSOCKET REALTIME

> **Tài liệu đặc tả:** Kiến trúc, cơ chế hoạt động, hướng dẫn cấu hình, tích hợp API SePay Server và điều phối sự kiện Real-time WebSocket cho hệ thống **Food Thunder Deli**.  
> **Phân hệ phụ trách:** `payment-service` (Port 8085) $\longleftrightarrow$ `order-service` (Port 8083) $\longleftrightarrow$ `chat-notification-service` (Port 8087) $\longleftrightarrow$ `food-deli-client` (Frontend).

---

## 📑 MỤC LỤC
1. [SePay Là Gì & Nguyên Lý Hoạt Động Cốt Lõi](#1-sepay-là-gì--nguyên-lý-hoạt-động-cốt-lõi)
2. [Sơ Đồ Tuần Tự Toàn Diện (Sequence Diagram)](#2-sơ-đồ-tuần-tự-toàn-diện-sequence-diagram)
3. [Hướng Dẫn Cấu Hình SePay (Setup & Configuration)](#3-hướng-dẫn-cấu-hình-sepay-setup--configuration)
4. [Đặc Tả API Endpoints & Payload Chi Tiết](#4-đặc-tả-api-endpoints--payload-chi-tiết)
5. [Cơ Chế Điều Phối WebSocket Real-Time](#5-cơ-chế-điều-phối-websocket-real-time)
6. [Xử Lý Lỗi, Bảo Mật & Kịch Bản Ngoại Lệ (Edge Cases)](#6-xử-lý-lỗi-bảo-mật--kịch-bản-ngoại-lệ-edge-cases)

---

## 💡 1. SEPAY LÀ GÌ & NGUYÊN LÝ HOẠT ĐỘNG CỐT LÕI

### 1.1. SePay là gì?
**SePay** (`sepay.vn`) là nền tảng trung gian tự động hóa thanh toán chuyển khoản qua ngân hàng tại Việt Nam (hỗ trợ toàn bộ các ngân hàng trong mạng lưới **Napas 247** như MBBank, Vietcombank, Techcombank, ACB, TPBank, BIDV, VPBank...).
- Thay vì phải tích hợp cổng thanh toán truyền thống với thủ tục giấy phép phức tạp và phí giao dịch từ 1.5% - 2.5%, SePay sử dụng chính **tài khoản ngân hàng của doanh nghiệp**.
- Khách hàng chuyển khoản trực tiếp vào tài khoản ngân hàng của sàn.
- Tiền nổi vào tài khoản ngay lập tức (Real-time $0$ giây).
- SePay đọc biến động số dư tài khoản ngân hàng (qua App Notification / Open Banking / SMS Gateway) và tự động bắn **HTTP Webhook** về máy chủ Food Thunder Deli để xác nhận đơn hàng.

### 1.2. Cơ chế nhận diện thanh toán (Transaction Content Matching)
Để phân biệt giữa hàng ngàn giao dịch chuyển tiền cùng lúc, hệ thống sử dụng **Cú pháp định danh nội dung chuyển khoản duy nhất**:
$$\mathbf{FOODDELI \quad ORD\{orderId\}}$$
*Ví dụ:* `FOODDELI ORD123` (Cho đơn hàng có ID = 123).

Khi khách hàng quét mã VietQR do hệ thống tạo, ứng dụng Mobile Banking của khách hàng sẽ **tự động điền 100%**:
1. Số tài khoản thụ hưởng.
2. Ngân hàng thụ hưởng.
3. Số tiền chính xác (không thể sửa đổi).
4. Cú pháp nội dung chuyển khoản (`FOODDELI ORD123`).

---

## 🗺️ 2. SƠ ĐỒ TUẦN TỰ TOÀN DIỆN (SEQUENCE DIAGRAM)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Khách hàng (Client UI)
    participant Gateway as 🚪 API Gateway (8080)
    participant OrderSvc as 📑 order-service (8083)
    participant PaymentSvc as 💳 payment-service (8085)
    participant SePayServer as 🏦 Cổng SePay (sepay.vn)
    participant BankApp as 📱 App Ngân hàng (Napas 247)
    participant WsHub as 📡 WebSocket Hub (8087)
    actor Merchant as 🏪 Quán ăn (Dashboard)

    Note over Customer,PaymentSvc: BƯỚC 1: KHỞI TẠO ĐƠN & SINH MÃ QR SEPAY
    Customer->>Gateway: POST /api/v1/orders (Tạo đơn hàng thanh toán SePay)
    Gateway->>OrderSvc: Ghi nhận đơn: status = 'AWAITING_PAYMENT'
    Customer->>Gateway: POST /api/v1/payments/sepay/generate (orderId, amount)
    Gateway->>PaymentSvc: Sinh URL ảnh QR SePay động & Tạo Payment PENDING
    PaymentSvc-->>Customer: Trả về qrCodeUrl, cú pháp 'FOODDELI ORD{id}', expiresAt
    Customer->>Customer: Mở SepayQrPaymentModal hiển thị mã QR & Bộ đếm ngược 15p
    Customer->>WsHub: Subscribe kênh riêng: /topic/orders/{orderId}
    Merchant->>WsHub: Subscribe kênh quán: /topic/merchant/{shopId}/orders

    Note over Customer,BankApp: BƯỚC 2: KHÁCH HÀNG QUÉT MÃ QR & CHUYỂN KHOẢN
    Customer->>BankApp: Mở App Ngân hàng quét QR trên màn hình
    BankApp->>BankApp: Tự động nạp: STK, Số tiền, Nội dung 'FOODDELI ORD{id}'
    Customer->>BankApp: Bấm 'Xác nhận chuyển khoản' (OTP / FaceID)
    BankApp->>SePayServer: Tiền vào tài khoản thụ hưởng sàn qua Napas 247

    Note over SePayServer,PaymentSvc: BƯỚC 3: SEPAY PHÁT HIỆN BIẾN ĐỘNG & BẮN WEBHOOK
    SePayServer->>Gateway: POST /api/v1/payments/sepay/webhook (Header: Authorization Apikey)
    Gateway->>PaymentSvc: Chuyển tiếp payload giao dịch ngân hàng
    PaymentSvc->>PaymentSvc: 1. Kiểm tra API Key xác thực Webhook<br/>2. Kiểm tra Idempotency chống trùng giao dịch<br/>3. Regex trích xuất orderId từ transactionContent<br/>4. Khóa bi quan: SELECT ... FOR UPDATE trên Payment<br/>5. Đối soát số tiền nhận >= số tiền đơn hàng<br/>6. Cập nhật Payment -> SUCCESS, lưu Transaction Ref
    PaymentSvc->>OrderSvc: Feign Client: Cập nhật order.status = 'PENDING' (Đã thanh toán)
    PaymentSvc-->>Gateway: HTTP 200 OK (Báo cho SePay đã xử lý thành công)

    Note over PaymentSvc,Merchant: BƯỚC 4: BẮN SỰ KIỆN REALTIME QUA WEBSOCKET
    PaymentSvc->>WsHub: Broadcast PaymentCompletedEvent (orderId, shopId, amount)
    WsHub-->>Customer: Push: /topic/orders/{orderId} {"status":"PAID"}
    Customer->>Customer: Tự động đóng Modal QR -> Chuyển hướng tới /orders/{orderId}
    WsHub-->>Merchant: Push: /topic/merchant/{shopId}/orders {"event":"NEW_PAID_ORDER"}
    Merchant->>Merchant: Phát âm thanh chuông 'Ding-Dong' 🔔 & Hiện đơn mới trên Dashboard
```

---

## ⚙️ 3. HƯỚNG DẪN CẤU HÌNH SEPAY (SETUP & CONFIGURATION)

### 3.1. Cấu hình trên Dashboard SePay (`my.sepay.vn`)
1. **Đăng ký tài khoản:** Truy cập [https://my.sepay.vn](https://my.sepay.vn) và tạo tài khoản doanh nghiệp / cá nhân.
2. **Liên kết Ngân hàng:**
   - Vào menu **"Ngân hàng"** $\rightarrow$ **"Thêm tài khoản ngân hàng"**.
   - Chọn ngân hàng thụ hưởng (ví dụ: `MBBank`, `Vietcombank`, `ACB`, `Techcombank`...).
   - Nhập số tài khoản, tên chủ tài khoản và cấp quyền đọc biến động (qua Open Banking hoặc ứng dụng SePay Gateway trên điện thoại).
3. **Lấy API Access Token:**
   - Vào menu **"Tích hợp" (Integration)** $\rightarrow$ **"API Key"**.
   - Tạo mã Token mới. Ví dụ mã token của bạn:
     ```
     RKXHAMJPZ0UQLIYGSD0GJ6L1OEEMOMHU44ILHNTPI6FZFX5KMJEPZTAQIQTBNSBK
     ```
4. **Cài đặt Webhook:**
   - Vào menu **"Tích hợp"** $\rightarrow$ **"Webhooks"** $\rightarrow$ **"Thêm Webhook"**.
   - **URL Webhook nhận dữ liệu:**
     - *Môi trường Production:* `https://api.yourdomain.com/api/v1/payments/sepay/webhook`
     - *Môi trường Localhost (Dùng Ngrok):* `https://xxxx-xx-xx.ngrok-free.app/api/v1/payments/sepay/webhook`
   - **Xác thực Webhook:** Chọn phương thức xác thực `API Key` (gửi qua Header `Authorization: Apikey <TOKEN>`).
   - **Sự kiện kích hoạt:** Chọn **"Biến động số dư tiền vào (Transfer In)"**.

---

### 3.2. Cấu hình Backend `payment-service`
Cấu hình tại file `food-deli-service/payment-service/src/main/resources/application.yml` hoặc file môi trường `.env`:

```yaml
sepay:
  # Tên viết tắt ngân hàng dùng tạo URL QR SePay (MBBank, Vietcombank, ACB, TPBank...)
  bank-name: ${SEPAY_BANK_NAME:MBBank}
  # Mã định danh ngân hàng Napas 247 (MBBank = 970422)
  bank-bin: ${SEPAY_BANK_BIN:970422}
  # Số tài khoản ngân hàng thụ hưởng đã kết nối với SePay
  account-no: ${SEPAY_ACCOUNT_NO:0987654321}
  # Tên chủ tài khoản ngân hàng
  account-name: ${SEPAY_ACCOUNT_NAME:FOOD THUNDER DELI}
  # API Token của bạn trên my.sepay.vn
  api-key: ${SEPAY_API_KEY:RKXHAMJPZ0UQLIYGSD0GJ6L1OEEMOMHU44ILHNTPI6FZFX5KMJEPZTAQIQTBNSBK}
  # Token bí mật xác thực request gửi tới Webhook
  webhook-token: ${SEPAY_WEBHOOK_TOKEN:RKXHAMJPZ0UQLIYGSD0GJ6L1OEEMOMHU44ILHNTPI6FZFX5KMJEPZTAQIQTBNSBK}
  # Tiền tố nội dung chuyển khoản định danh đơn hàng
  order-prefix: FOODDELI
  # Mẫu template hiển thị QR (compact2: gọn đẹp kèm logo Napas)
  template: compact2
```

---

## 📡 4. ĐẶC TẢ API ENDPOINTS & PAYLOAD CHI TIẾT

### 4.1. API Sinh Mã QR SePay Động
Client gọi khi người dùng bấm "Đặt hàng" với phương thức chuyển khoản.

- **Endpoint:** `POST /api/v1/payments/sepay/generate`
- **Quyền:** Authenticated (`Bearer <JWT>`)
- **Request Body:**
  ```json
  {
    "orderId": 123,
    "amount": 154000
  }
  ```
- **Cơ chế sinh URL mã QR SePay:**
  Không cần gửi request mạng sang SePay để tạo QR, backend tự động tổng hợp URL ảnh chuẩn SePay:
  $$\text{URL} = \text{https://qr.sepay.vn/img?bank=MBBank\&acc=0987654321\&template=compact2\&amount=154000\&des=FOODDELI\%20ORD123}$$
- **Response trả về (HTTP 201 Created):**
  ```json
  {
    "status": 201,
    "message": "Tạo mã QR SePay thành công",
    "data": {
      "orderId": 123,
      "amount": 154000,
      "qrCodeUrl": "https://qr.sepay.vn/img?bank=MBBank&acc=0987654321&template=compact2&amount=154000&des=FOODDELI%20ORD123",
      "bankName": "MBBank",
      "bankBin": "970422",
      "accountNo": "0987654321",
      "accountName": "FOOD THUNDER DELI",
      "paymentContent": "FOODDELI ORD123",
      "status": "PENDING",
      "expiresAt": "2026-11-07T05:30:00Z"
    },
    "timestamp": "2026-11-07T05:15:00Z"
  }
  ```

---

### 4.2. API Webhook Tiếp Nhận Biến Động Số Dư Từ SePay Server
SePay Server tự động bắn HTTP POST tới endpoint này ngay khi ngân hàng nhận được tiền.

- **Endpoint:** `POST /api/v1/payments/sepay/webhook`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Apikey RKXHAMJPZ0UQLIYGSD0GJ6L1OEEMOMHU44ILHNTPI6FZFX5KMJEPZTAQIQTBNSBK`
- **Payload SePay gửi đến:**
  ```json
  {
    "id": 982143,
    "gateway": "MBBank",
    "transactionDate": "2026-11-07 05:16:30",
    "accountNumber": "0987654321",
    "subAccount": null,
    "transferType": "in",
    "transferAmount": 154000,
    "accumulated": 15400000,
    "code": null,
    "transactionContent": "ND: CHUYEN TIEN FOODDELI ORD123 MA GD 87219",
    "referenceCode": "FT261107123"
  }
  ```

#### Quy trình xử lý tại `PaymentServiceImpl.java`:
1. **Xác thực bảo mật:** Kiểm tra Header `Authorization` có khớp với `sepay.webhook-token` hay không. Nếu sai từ chối ngay lập tức (`401 Unauthorized`).
2. **Kiểm tra loại giao dịch:** Bỏ qua nếu `transferType == "out"` (tiền rút/chuyển đi).
3. **Trích xuất mã đơn hàng:**
   Sử dụng biểu thức chính quy (Regex) phân tích trường `transactionContent`:
   ```regex
   FOODDELI\s+ORD(\d+)
   ```
   $\rightarrow$ Trích xuất ra được `orderId = 123`.
4. **Idempotency Check (Chống Replay Attack):**
   Kiểm tra `referenceCode` trong bảng `payment_transactions`. Nếu đã từng xử lý rồi, trả về HTTP 200 ngay mà không cộng tiền hay đổi trạng thái lần 2.
5. **Khóa bi quan (Pessimistic Locking):**
   `SELECT * FROM payments WHERE order_id = 123 FOR UPDATE;`
6. **Đối soát số tiền:**
   Kiểm tra `transferAmount >= payment.amount`. Nếu khách chuyển thiếu tiền, chuyển trạng thái giao dịch sang `FAILED` và ném ngoại lệ thông báo.
7. **Cập nhật trạng thái:**
   - Bảng `payments`: Cập nhật `status = 'SUCCESS'`.
   - Bảng `payment_transactions`: Lưu log chi tiết kèm `referenceCode` và toàn bộ JSON phản hồi từ SePay.
8. **Đồng bộ liên dịch vụ (OpenFeign):**
   Gọi `order-service` cập nhật đơn hàng:
   $$\text{order.status: AWAITING\_PAYMENT} \longrightarrow \mathbf{PENDING} \text{ (Sẵn sàng chuyển cho quán nấu)}$$

---

### 4.3. API Tra Cứu Trực Tiếp Từ SePay Server (Polling / Audit Fallback)
Khi cần chủ động kiểm tra trạng thái hoặc chạy đối soát định kỳ:
- **Endpoint SePay Server:** `GET https://my.sepay.vn/userapi/transactions/list`
- **Header:** `Authorization: Bearer RKXHAMJPZ0UQLIYGSD0GJ6L1OEEMOMHU44ILHNTPI6FZFX5KMJEPZTAQIQTBNSBK`
- **Params:** `?account_number=0987654321&limit=20`

---

## 📡 5. CƠ CHẾ ĐIỀU PHỐI WEBSOCKET REAL-TIME

Khi Webhook xử lý thành công, sự kiện Real-time được kích hoạt để cập nhật giao diện mà người dùng không cần tải lại trang (Zero Reload).

```mermaid
flowchart LR
    A["SePay Webhook Thành Công"] --> B["payment-service"]
    B -- "Broadcast PaymentCompletedEvent" --> C["WebSocket Hub\n(chat-notification-service:8087)"]
    C -- "Push STOMP Message" --> D["/topic/orders/{orderId}\n(Màn hình Khách hàng)"]
    C -- "Push STOMP Message" --> E["/topic/merchant/{shopId}/orders\n(Dashboard Quán ăn)"]
```

### 5.1. Kênh Khách hàng (`/topic/orders/{orderId}`)
- **Client Subscribe:** Khi khách mở Modal `SepayQrPaymentModal.tsx`:
  ```typescript
  stompClient.subscribe(`/topic/orders/${orderId}`, (message) => {
    const data = JSON.parse(message.body);
    if (data.status === 'PAID' || data.status === 'SUCCESS') {
      // 1. Dừng bộ đếm Polling dự phòng
      // 2. Xóa sạch giỏ hàng Redux: dispatch(clearCart())
      // 3. Hiển thị thông báo thành công
      // 4. Đóng modal QR và điều hướng sang trang /orders/:id
    }
  });
  ```
- **Cơ chế Polling dự phòng (Fallback):** Trong lúc mở modal QR, Frontend kết hợp polling nhẹ mỗi 3 giây gọi `GET /api/v1/payments/orders/{orderId}/status` để phòng trường hợp mạng khách bị rớt kết nối WebSocket.

### 5.2. Kênh Quán ăn (`/topic/merchant/{shopId}/orders`)
- **Merchant Subscribe:** Trang `MerchantDashboardPage` luôn giữ kết nối STOMP tới:
  ```typescript
  stompClient.subscribe(`/topic/merchant/${currentShopId}/orders`, (message) => {
    const newOrder = JSON.parse(message.body);
    // 1. Kích hoạt âm thanh chuông 'Ding-Dong' 🔔
    // 2. Thêm thẻ đơn hàng mới vào cột 'Đơn Mới Chờ Xác Nhận'
    // 3. Hiển thị Toast thông báo: 'Có đơn hàng mới #123 đã thanh toán online!'
  });
  ```

---

## 🛡️ 6. XỬ LÝ LỖI, BẢO MẬT & KỊCH BẢN NGOẠI LỆ (EDGE CASES)

| Kịch bản ngoại lệ | Hiện tượng | Giải pháp xử lý kỹ thuật |
| :--- | :--- | :--- |
| **Khách chuyển thiếu tiền** | Khách cần trả 154.000đ nhưng chỉ chuyển 100.000đ. | Giao dịch bị đánh dấu `FAILED`, đơn hàng vẫn ở `AWAITING_PAYMENT`. Hệ thống ghi nhận số tiền thiếu và hiển thị thông báo yêu cầu chuyển thêm phần chênh lệch. |
| **Khách chuyển thừa tiền** | Khách chuyển 200.000đ cho đơn 154.000đ. | Đơn hàng vẫn được duyệt thành công (`SUCCESS`). Ghi log số tiền thừa vào `payment_transactions` để hoàn trả về ví khách sau. |
| **Khách quên ghi mã đơn hàng** | Nội dung chuyển khoản là `"Nguyen Van A chuyen tien"`. | Không thể trích xuất `orderId`. Webhook ghi log vào hàng đợi **"Giao dịch treo cần đối soát thủ công" (Manual Audit Queue)** để Admin rà soát đối chiếu. |
| **Webhook bị lặp lại (Replay Attack / Network Retry)** | SePay gửi lại cùng một giao dịch 3 lần do mạng chập chờn. | Sử dụng **Idempotency Pattern**: Kiểm tra trường `referenceCode` trong bảng `payment_transactions`. Nếu đã tồn tại, lập tức trả về `HTTP 200 OK` mà không xử lý lại. |
| **Hết hạn thanh toán (QR Expired)** | Khách hàng quét mã sau 15 phút. | Hệ thống hủy đơn tự động (`CANCELLED`). Nếu tiền vẫn vào tài khoản sau đó, Admin đối soát hoàn trả tiền cho khách. |

