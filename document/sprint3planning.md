# 🚀 KẾ HOẠCH CHI TIẾT TRIỂN KHAI SPRINT 3 (SPRINT 3 PLANNING)
## DỰ ÁN: FOOD THUNDER DELI - HỆ THỐNG ĐẶT VÀ GIAO ĐỒ ĂN TRỰC TUYẾN

> **Tên tài liệu:** Kế Hoạch Chi Tiết Triển Khai Sprint 3 (Self-Contained Full Specification)  
> **Thời gian thực hiện:** Sprint 3 (Thời lượng: 2 tuần)  
> **Phiên bản:** 3.0 - Bản phát hành chính thức  
> **Nguyên tắc biên soạn:** **Tự chứa hoàn toàn (Self-Contained) - Tuyệt đối không ghi tham chiếu chung chung**. Mọi đặc tả API, schema cơ sở dữ liệu, luồng nghiệp vụ, công thức toán học và thiết kế giao diện đều được trình bày trực tiếp, đầy đủ và chi tiết tại tài liệu này.

---

## 🎯 I. MỤC TIÊU CỐT LÕI CỦA SPRINT 3 (SPRINT 3 GOALS)

Mục tiêu tối thượng của Sprint 3 là:
1. **Hoàn thiện toàn bộ tất cả các module dành cho Tài xế (`driver` / `delivery-service`)**:
   - Xây dựng hoàn chỉnh microservice `delivery-service` (Port 8084).
   - Triển khai cơ chế **Khóa bi quan (`SELECT ... FOR UPDATE`)** xử lý triệt để bài toán tranh chấp đơn hàng (Race Condition) khi nhiều tài xế cùng bấm nhận 1 đơn tại cùng một thời điểm.
   - Hiện thực hóa trọn vẹn quy trình giao hàng ảo hóa (Virtual Delivery Workflow): Nhận đơn $\rightarrow$ Lấy món $\rightarrow$ Đang giao $\rightarrow$ Giao thành công & Thu tiền COD.
   - Lập trình bộ máy tính toán chỉ số hiệu suất tài xế: Tỷ lệ nhận cuốc (Acceptance Rate - AR) và Tỷ lệ hủy cuốc (Cancellation Rate - CR) trên cửa sổ trượt 100 đơn (Rolling Window).
   - Xây dựng giao diện **Shipper Web Hub** tối ưu trên thiết bị di động: Radar quét đơn khả dụng, bảng điều khiển lộ trình giao hàng, thống kê ví thu nhập tài xế.
2. **Hoàn thiện toàn bộ tất cả các module dành cho Quản trị viên (`admin` / Admin Portal)**:
   - Quản trị tài khoản người dùng toàn sàn: Tìm kiếm, phân trang, đổi vai trò (Role), khóa / mở khóa tài khoản vi phạm.
   - Phân hệ phê duyệt hồ sơ: Kiểm duyệt hồ sơ mở quán ăn mới và hồ sơ đăng ký tài xế mới gia nhập nền tảng.
   - Cấu hình tham số toàn hệ thống: Biểu phí giao hàng mặc định, phí tính thêm mỗi km, tỷ lệ chiết khấu hoa hồng sàn.
   - Quản trị toàn bộ đánh giá hệ thống: Xem, tìm kiếm, lọc theo đối tượng quán / xế, ẩn / xóa đánh giá vi phạm tiêu chuẩn cộng đồng.
3. **Khắc phục dứt điểm toàn bộ các lỗi tồn đọng ở Merchant và Admin**:
   - **Merchant:** Sửa lỗi chuyển đổi chi nhánh (Branch Switcher đa quán) không ăn khớp dữ liệu; sửa lỗi nút Bật/Tắt Còn hàng - Hết hàng của món ăn; ổn định chuông báo âm thanh WebSocket STOMP ("ding-dong"); hoàn thiện trang báo cáo doanh thu đa quán (`/merchant/analytics`).
   - **Admin & Customer:** Bổ sung hiển thị trực quan Tag `<Tag color="default">Không có tài xế</Tag>` kèm Tooltip giải thích trên màn hình Lịch sử đơn hàng khi đơn hoàn tất mà không qua shipper, giải tỏa hoàn toàn thắc mắc của khách hàng về nút đánh giá tài xế.
4. **Tích hợp Theo dõi Thời gian thực (Live Tracking) & Trò chuyện Trực tiếp (Chat)**:
   - Màn hình `/orders/:id` tự động cập nhật tiến trình 5 bước qua WebSocket STOMP mà không cần tải lại trang.
   - Widget Chat 2 chiều thời gian thực giữa Khách hàng $\leftrightarrow$ Quán ăn / Tài xế.
5. **Đóng gói Docker Compose Production & Nghiệm thu toàn diện**:
   - Toàn bộ 10 microservices, CSDL MySQL 8.0, Redis và Frontend Client khởi chạy hoàn hảo chỉ bằng 1 câu lệnh `docker compose up -d --build`.

---

## 👥 II. PHÂN CHIA NHÂN SỰ & TRÁCH NHIỆM TRONG SPRINT 3

| Thành viên | Vai trò chính | Trách nhiệm cụ thể trong Sprint 3 | Story Points |
| :--- | :--- | :--- | :---: |
| **Thọ (Leader)** | Lead Architect & DevOps | • Kiến trúc `delivery-service`, WebSocket Broker STOMP, Chat Service.<br>• Tối ưu chuông báo âm thanh "ding-dong" cho Merchant.<br>• Đóng gói Docker Compose Production toàn bộ 10 microservices.<br>• Phối hợp kiểm thử Concurrency & bảo vệ đồ án OJT. | **11 SP** |
| **Duy** | Backend Core Engineer | • Lập trình lõi `delivery-service`: Entity, Repository, Service.<br>• Xử lý Concurrency: Khóa bi quan `SELECT ... FOR UPDATE` chống Race Condition nhận đơn.<br>• Thuật toán tính chỉ số hiệu suất tài xế AR / CR trên rolling window 100 đơn. | **8 SP** |
| **Quang anh** | Backend / Fullstack Merchant | • Backend API Admin Phê duyệt Quán ăn & Tài xế mới (`restaurant_change_requests`, `driver_details`).<br>• Sửa lỗi Merchant: Multi-shop Branch Switcher, Toggle trạng thái món ăn.<br>• Hoàn thiện màn hình Báo cáo Doanh thu Merchant (`/merchant/analytics`). | **7 SP** |
| **Nhựt** | Frontend Core Engineer | • Frontend Màn hình Theo dõi Đơn hàng Thời gian thực (`/orders/:id` Live Stepper).<br>• Widget Live Chat Khách $\leftrightarrow$ Quán / Xế.<br>• Bổ sung Tag chú thích "Không có tài xế" trên `CustomerOrderCard.tsx` và `OrderDetailPage.tsx`. | **8 SP** |
| **Thịnh** | Frontend / Admin Specialist | • Frontend Admin Portal: Màn hình Quản lý Người dùng (`/admin/users`) & Khóa/Mở tài khoản.<br>• Frontend Admin Cấu hình Tham số Toàn sàn (`/admin/settings`).<br>• Frontend Admin Quản trị Toàn bộ Đánh giá Hệ thống (`/admin/reviews`). | **10 SP** |
| **Đức** | Frontend Shipper Hub Specialist | • Frontend Shipper Web Hub (`/shipper`): Radar quét đơn hàng mới 1-chạm.<br>• Bảng điều khiển lộ trình giao hàng ảo hóa & nút trượt trạng thái cuốc xe.<br>• Màn hình Thống kê Ví thu nhập & Lịch sử cuốc xe tài xế. | **8 SP** |
| **CẢ TEAM** | **Sprint 3 Delivery** | **Hoàn thiện toàn bộ các module & sửa dứt điểm lỗi tồn đọng** | **55 SP** |

---

## 🏗️ III. KIẾN TRÚC TỔNG THỂ & QUY CHUẨN KỸ THUẬT SPRINT 3

```
                             [CLIENT / WEB & MOBILE BROWSER]
                                            │
                                            ▼
                             [API GATEWAY - PORT 8080]
     ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
     │              │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼              ▼
[auth-service] [restaurant]   [order-service] [delivery-srv] [payment-srv]  [review-srv]
  Port: 8081     Port: 8082      Port: 8083     Port: 8084     Port: 8085     Port: 8086
     │              │              │              │              │              │
     └──────────────┴──────────────┴──────┬───────┴──────────────┴──────────────┘
                                          │
                                          ▼
                         [chat-notification-service :8087]
                           (WebSocket STOMP /ws-food-deli)
```

### Quy chuẩn kỹ thuật bắt buộc:
1. **Decoupled Plain IDs (Khóa Ngoại Logic):**
   - Giữa các microservice tuyệt đối không tạo ràng buộc khóa ngoại vật lý (`CONSTRAINT FOREIGN KEY REFERENCES`) và không dùng quan hệ JPA chéo (`@ManyToOne`, `@OneToMany`).
   - Các bảng chỉ lưu Plain ID: `driver_id` (INT), `order_id` (BIGINT), `restaurant_id` (INT), `customer_id` (INT).
   - Mọi cột Plain ID bắt buộc phải có chỉ mục B-Tree (`KEY idx_...`) để tối ưu tốc độ truy vấn $O(\log N)$.
2. **Chuẩn hóa API Response:**
   ```json
   {
     "status": 200,
     "message": "Thông điệp xử lý thành công",
     "data": { ... },
     "timestamp": "2026-11-08T16:30:00.000Z"
   }
   ```
3. **Phân quyền người dùng (RBAC):**
   - API Gateway xác thực JWT và inject các headers danh tính:
     - `X-User-Id`: ID của người dùng thực hiện request.
     - `X-User-Role`: Vai trò của người dùng (`ROLE_CUSTOMER`, `ROLE_MERCHANT`, `ROLE_DRIVER`, `ROLE_ADMIN`).
     - `X-User-Email`: Email của người dùng.

---

## 🛵 IV. CHI TIẾT MODULE 1: PHÂN HỆ VẬN CHUYỂN & TÀI XẾ (DELIVERY SERVICE & SHIPPER WEB HUB)

### 1. Vòng Đời Trạng Thái Đơn Hàng & Thẩm Quyền Tài Xế
Trạng thái đơn hàng dịch chuyển tuần tự theo đúng State Machine:
$$\text{PENDING} \xrightarrow{\text{Quán xác nhận}} \text{CONFIRMED} \xrightarrow{\text{Tài xế nhận đơn}} \mathbf{DRIVER\_ACCEPTED} \xrightarrow{\text{Tới quán lấy món}} \mathbf{PICKING\_UP} \xrightarrow{\text{Đang giao}} \mathbf{DELIVERING} \xrightarrow{\text{Giao xong \& Thu COD}} \mathbf{COMPLETED}$$

- **Ràng buộc thẩm quyền (RBAC State Guard):**
  - Tài xế là người **duy nhất** có quyền chuyển đơn từ `CONFIRMED` sang `DRIVER_ACCEPTED`.
  - Tài xế là người **duy nhất** có quyền chuyển đơn sang `PICKING_UP`, `DELIVERING` và `COMPLETED`.
  - Quán ăn **tuyệt đối không được phép** bấm `COMPLETED` vì quán không trực tiếp vận chuyển đơn hàng.

---

### 2. Kỹ Thuật Khóa Bi Quan Chống Race Condition Nhận Đơn

#### Bài toán:
Khi một đơn hàng vừa được Quán xác nhận (`CONFIRMED`), hệ thống phát thông báo tới nhiều tài xế lân cận. Nếu 2 hoặc nhiều tài xế cùng lúc bấm nút "Nhận đơn ngay", hệ thống phải bảo đảm **chỉ có duy nhất 1 tài xế nhận thành công**, các tài xế bấm chậm hơn phải nhận được thông báo lỗi `409 Conflict: Đơn hàng đã được tài xế khác tiếp nhận!` mà không gây xung đột dữ liệu hay ghi đè.

#### Giải pháp kỹ thuật:
Tại tầng Repository của `delivery-service` / `order-service`, sử dụng annotation `@Lock(LockModeType.PESSIMISTIC_WRITE)`:
```java
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :orderId")
    Optional<Order> findByIdForUpdate(@Param("orderId") Long orderId);
}
```

Câu lệnh SQL thực thi tương đương tại MySQL InnoDB:
```sql
SELECT * FROM orders WHERE id = ? FOR UPDATE;
```

#### Luồng xử lý tại `DeliveryServiceImpl.java`:
```java
@Service
@RequiredArgsConstructor
public class DeliveryServiceImpl implements DeliveryService {

    private final OrderRepository orderRepository;
    private final DriverOfferRepository driverOfferRepository;

    @Transactional
    public DeliveryResponse acceptOrder(Long orderId, Integer driverId) {
        // 1. Khóa bi quan bản ghi đơn hàng
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng #" + orderId));

        // 2. Kiểm tra trạng thái hợp lệ
        if (!"CONFIRMED".equalsIgnoreCase(order.getStatus().getCode())) {
            throw new ConflictException("Đơn hàng này không còn ở trạng thái chờ tài xế (Hiện tại: " 
                    + order.getStatus().getCode() + ")");
        }

        // 3. Kiểm tra xem đơn đã có tài xế nào nhận chưa
        if (order.getDriverId() != null) {
            throw new ConflictException("Rất tiếc! Đơn hàng đã được tài xế khác nhanh tay tiếp nhận trước!");
        }

        // 4. Gán tài xế và chuyển trạng thái sang DRIVER_ACCEPTED
        order.setDriverId(driverId);
        order.setStatus(getStatusEntity("DRIVER_ACCEPTED"));
        orderRepository.save(order);

        // 5. Cập nhật trạng thái offer của tài xế này thành ACCEPTED
        driverOfferRepository.updateOfferStatus(orderId, driverId, "ACCEPTED", LocalDateTime.now());

        // 6. Đánh dấu các offer khác cùng gửi cho đơn này thành EXPIRED
        driverOfferRepository.expireOtherOffers(orderId, driverId, LocalDateTime.now());

        return DeliveryResponse.fromOrder(order);
    }
}
```

---

### 3. Thuật Toán Tính Chỉ Số Hiệu Suất Tài Xế (AR / CR)

#### Phạm vi áp dụng (Rolling Window 100):
Chỉ số tính toán trên **100 lượt phát đơn (offers) gần nhất** của tài xế, sắp xếp theo thời gian giảm dần (`offered_at DESC`). Nếu tài xế có dưới 100 offers trong lịch sử, tính trên toàn bộ số offers hiện có.

#### Công thức 1: Tỷ Lệ Chấp Nhận Đơn (Acceptance Rate - AR)
$$AR = \left( \frac{\text{Số cuốc tài xế bấm nhận (status = 'ACCEPTED')}}{\text{Tổng số cuốc phát hợp lệ (eligible offers)}} \right) \times 100\%$$
- **Điều kiện vi phạm:** Nếu $AR < 80\%$, hệ thống kích hoạt cảnh báo nhắc nhở tài xế.

#### Công thức 2: Tỷ Lệ Hủy Đơn (Cancellation Rate - CR)
$$CR = \left( \frac{\text{Số đơn tài xế tự ý hủy sau khi đã nhận (cancellation\_chargeable = 1)}}{\text{Tổng số đơn tài xế đã nhận (status = 'ACCEPTED')}} \right) \times 100\%$$
- **Điều kiện vi phạm:** Nếu $CR > 10\%$, hệ thống tự động gắn cờ vi phạm, trừ điểm uy tín và tạm đình chỉ quyền nhận cuốc trong vòng 24 giờ.

---

### 4. Thiết Kế Cơ Sở Dữ Liệu Module Tài Xế

```sql
-- 1. Bảng hồ sơ chi tiết tài xế
CREATE TABLE `driver_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,                          -- [Logical FK] trỏ sang auth-service: users.id
  `vehicle_type` VARCHAR(50) DEFAULT 'MOTORBIKE',   -- Loại xe (MOTORBIKE, CAR)
  `license_plate` VARCHAR(20) NOT NULL,            -- Biển số xe (VD: 59-X3 888.88)
  `identity_card` VARCHAR(20) NOT NULL,            -- Số CCCD
  `license_number` VARCHAR(30) NOT NULL,           -- Số GPLX
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING (Chờ duyệt), ACTIVE, INACTIVE, SUSPENDED
  `acceptance_rate` DECIMAL(5,2) DEFAULT 100.00,   -- Tỷ lệ AR (%)
  `cancellation_rate` DECIMAL(5,2) DEFAULT 0.00,   -- Tỷ lệ CR (%)
  `wallet_balance` DECIMAL(12,2) DEFAULT 0.00,     -- Số dư ví thu nhập (VNĐ)
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_driver_user` (`user_id`),
  KEY `idx_driver_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng vị trí tọa độ GPS tài xế
CREATE TABLE `driver_locations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `driver_id` INT NOT NULL,                        -- [Logical FK] users.id
  `order_id` BIGINT DEFAULT NULL,                  -- [Logical FK] orders.id (đang giao)
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `heading` DOUBLE DEFAULT 0.0,                    -- Góc quay la bàn (0 - 360 độ)
  `speed_kmh` DOUBLE DEFAULT 0.0,                  -- Tốc độ di chuyển
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_driver_locations_driver_id` (`driver_id`),
  KEY `idx_driver_locations_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng phát cuốc và phản hồi nhận đơn
CREATE TABLE `driver_offers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,                      -- [Logical FK] orders.id
  `driver_id` INT NOT NULL,                        -- [Logical FK] users.id
  `status` VARCHAR(30) NOT NULL,                   -- OFFERED, ACCEPTED, REJECTED, EXPIRED, CANCELLED
  `algorithm` VARCHAR(50) DEFAULT 'NEAREST',       -- Thuật toán điều phối
  `distance_km` DOUBLE NOT NULL DEFAULT 1.0,       -- Khoảng cách từ shipper tới quán
  `pickup_eta_minutes` DOUBLE DEFAULT 5.0,         -- Thời gian dự kiến tới quán
  `cancellation_chargeable` TINYINT(1) DEFAULT 0,  -- 1 nếu hủy do lỗi chủ quan của tài xế
  `offered_at` DATETIME NOT NULL,                  -- Thời điểm phát cuốc
  `responded_at` DATETIME DEFAULT NULL,            -- Thời điểm tài xế bấm nhận / từ chối
  `expires_at` DATETIME NOT NULL,                  -- Hạn chót nhận (30 giây)
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_driver_offers_driver_id` (`driver_id`),
  KEY `idx_driver_offers_order_id` (`order_id`),
  KEY `idx_driver_offers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5. Đặc Tả Danh Sách API Endpoints Module Tài Xế

#### 🔹 API 1.1: Radar quét danh sách đơn hàng khả dụng chờ nhận
- **Method / URL:** `GET /api/v1/delivery/offers/available`
- **Request Headers:**
  - `Authorization: Bearer <JWT>`
  - `X-User-Id: 5`
  - `X-User-Role: ROLE_DRIVER`
- **Query Parameters:** `lat=10.7769&lng=106.7009&radiusKm=5.0`
- **Response Body (200 OK):**
```json
{
  "status": 200,
  "message": "Lấy danh sách cuốc xe khả dụng thành công",
  "data": [
    {
      "orderId": 28,
      "orderCode": "ORD-20261108-100201",
      "restaurantId": 8,
      "restaurantName": "Quán Trà Sữa Gong Cha - Nguyễn Huệ",
      "restaurantAddress": "88 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
      "restaurantLat": 10.7745,
      "restaurantLng": 106.7022,
      "receiverAddress": "120 Hai Bà Trưng, Phường Đa Kao, Quận 1, TP.HCM",
      "distanceKm": 1.8,
      "itemCount": 3,
      "totalAmount": 125000,
      "shippingFee": 18000,
      "driverEarning": 14400,
      "paymentMethod": "COD",
      "codAmountToCollect": 125000,
      "expiresInSeconds": 24
    }
  ],
  "timestamp": "2026-11-08T16:30:15.000Z"
}
```

#### 🔹 API 1.2: Tài xế chấp nhận đơn hàng (Có khóa bi quan chống Race Condition)
- **Method / URL:** `POST /api/v1/delivery/orders/{orderId}/accept`
- **Request Headers:**
  - `Authorization: Bearer <JWT>`
  - `X-User-Id: 5`
  - `X-User-Role: ROLE_DRIVER`
- **Response Thành Công (200 OK):**
```json
{
  "status": 200,
  "message": "Nhận cuốc xe thành công! Chúc bạn thượng lộ bình an.",
  "data": {
    "orderId": 28,
    "orderCode": "ORD-20261108-100201",
    "driverId": 5,
    "statusCode": "DRIVER_ACCEPTED",
    "statusLabel": "Tài xế đã nhận đơn",
    "acceptedAt": "2026-11-08T16:30:20.120Z"
  },
  "timestamp": "2026-11-08T16:30:20.125Z"
}
```
- **Response Xảy Ra Tranh Chấp (409 Conflict):**
```json
{
  "status": 409,
  "message": "Rất tiếc! Đơn hàng này vừa được một tài xế khác nhanh tay tiếp nhận trước.",
  "data": null,
  "timestamp": "2026-11-08T16:30:20.145Z"
}
```

#### 🔹 API 1.3: Cập nhật trạng thái quy trình giao hàng ảo hóa
- **Method / URL:** `PUT /api/v1/delivery/orders/{orderId}/status`
- **Request Headers:**
  - `Authorization: Bearer <JWT>`
  - `X-User-Id: 5`
  - `X-User-Role: ROLE_DRIVER`
- **Request Body (JSON):**
```json
{
  "targetStatus": "DELIVERING",
  "note": "Đã nhận đủ 3 ly trà sữa tại quán, đang di chuyển giao tới khách",
  "codCollected": 0
}
```
*(Khi chuyển sang `COMPLETED`, truyền `"targetStatus": "COMPLETED"` và `"codCollected": 125000`)*.
- **Response Body (200 OK):**
```json
{
  "status": 200,
  "message": "Cập nhật tiến trình giao hàng thành công",
  "data": {
    "orderId": 28,
    "previousStatus": "PICKING_UP",
    "newStatus": "DELIVERING",
    "updatedAt": "2026-11-08T16:38:10.000Z"
  },
  "timestamp": "2026-11-08T16:38:10.000Z"
}
```

#### 🔹 API 1.4: Thống kê hiệu suất tài xế (AR / CR)
- **Method / URL:** `GET /api/v1/delivery/driver/performance`
- **Request Headers:**
  - `Authorization: Bearer <JWT>`
  - `X-User-Id: 5`
  - `X-User-Role: ROLE_DRIVER`
- **Response Body (200 OK):**
```json
{
  "status": 200,
  "message": "Lấy thông tin hiệu suất tài xế thành công",
  "data": {
    "driverId": 5,
    "vehiclePlate": "59-X3 888.88",
    "rollingOffersCount": 100,
    "acceptedCount": 94,
    "acceptanceRate": 94.0,
    "cancelledCount": 2,
    "cancellationRate": 2.12,
    "status": "EXCELLENT",
    "ratingAverage": 4.9,
    "totalRatingsCount": 142
  },
  "timestamp": "2026-11-08T16:30:00.000Z"
}
```

---

### 6. Thiết Kế Giao Diện Shipper Web Hub (`/shipper`)

1. **Route Bảo Vệ:** `<ProtectedRoute allowedRoles={['ROLE_DRIVER']}>` đặt tại `food-deli-client/src/routes/AppRoutes.tsx`.
2. **Màn hình Radar Quét Đơn (`ShipperRadarPage.tsx`):**
   - Header hiển thị: Trạng thái Sẵn sàng nhận đơn (Toggle Switch: Online / Offline), biển số xe, số dư ví thu nhập.
   - Bảng Radar: Hiển thị card đơn hàng với đồng hồ đếm ngược tròn (30 giây) màu cam.
   - Thông tin trên card: Tên quán, khoảng cách (km), tiền ship thực nhận, phương thức thanh toán (COD / VietQR).
   - Nút hành động: Nút xanh lá lớn `"NHẬN ĐƠN NGAY"` có hiệu ứng rung nhẹ (pulse).
3. **Màn hình Cuốc Xe Đang Giao (`ActiveDeliveryView.tsx`):**
   - Lộ trình 2 chặng:
     - Chặng 1: Vị trí shipper $\rightarrow$ Quán ăn (Nút mở Google Maps dẫn đường, Nút bấm gọi điện thoại cho quán).
     - Chặng 2: Quán ăn $\rightarrow$ Địa chỉ khách hàng (Nút mở Google Maps, Nút gọi khách hàng, Nút mở khung chat trực tiếp).
   - Thanh trượt hành động (Slide to Confirm) chống bấm nhầm:
     - Khi ở quán: Trượt xác nhận *"ĐÃ LẤY MÓN ĂN"*.
     - Khi đến nhà khách: Trượt xác nhận *"ĐÃ GIAO HÀNG & THU ĐỦ TIỀN"*.

---

## 🛡️ V. CHI TIẾT MODULE 2: PHÂN HỆ QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN PORTAL)

### 1. Phân Hệ Quản Lý Người Dùng Toàn Sàn (`/admin/users`)

#### Chức năng:
- Hiển thị danh sách toàn bộ tài khoản người dùng trong hệ thống (Khách hàng, Chủ quán, Tài xế, Quản trị viên).
- Lọc theo Role, tìm kiếm theo Tên, Email hoặc Số điện thoại.
- Thao tác khóa / mở khóa tài khoản: Khi khóa tài khoản, người dùng sẽ bị từ chối đăng nhập và vô hiệu hóa các token JWT đang phát hành.

#### Chi tiết API:
- `GET /api/v1/admin/users?page=0&size=10&role=ROLE_MERCHANT&keyword=pho`
- `PUT /api/v1/admin/users/{userId}/toggle-status` (Body: `{"isActive": false, "reason": "Vi phạm chính sách"}`)

---

### 2. Phân Hệ Phê Duyệt Hồ Sơ Đối Tác (`/admin/approvals`)

#### Bảng 1: Phê duyệt Quán Ăn Mới (`restaurant_change_requests`)
- Khi một chủ quán đăng ký quán mới hoặc sửa đổi thông tin pháp lý/địa chỉ quán, bản ghi được ghi nhận vào bảng `restaurant_change_requests` với trạng thái `PENDING`.
- Admin xem xét: Tên quán, địa chỉ, ảnh mặt tiền, giờ hoạt động, giấy phép đăng ký kinh doanh.
- API Thao tác:
  - `GET /api/v1/admin/approvals/restaurants?status=PENDING`
  - `POST /api/v1/admin/approvals/restaurants/{requestId}/action`
    - Body duyệt: `{"decision": "APPROVED", "note": "Hồ sơ hợp lệ"}` $\rightarrow$ Quán ăn được tạo mới hoặc kích hoạt `is_active = 1` trong bảng `restaurants`.
    - Body từ chối: `{"decision": "REJECTED", "note": "Ảnh chụp giấy tờ mờ, vui lòng gửi lại"}`.

#### Bảng 2: Phê duyệt Hồ Sơ Tài Xế Mới (`driver_details`)
- Khi người dùng đăng ký làm tài xế, hồ sơ được tạo với trạng thái `PENDING`.
- Admin kiểm tra: Biển số xe, số CCCD, giấy phép lái xe, loại phương tiện.
- API Thao tác:
  - `GET /api/v1/admin/approvals/drivers?status=PENDING`
  - `POST /api/v1/admin/approvals/drivers/{driverId}/action` (Body: `{"decision": "ACTIVE", "note": "Hồ sơ đạt yêu cầu"}`).

---

### 3. Cấu Hình Tham Số Toàn Sàn (`/admin/settings`)

#### Bảng CSDL `system_settings`:
```sql
CREATE TABLE `system_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_by` INT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('BASE_SHIPPING_FEE', '15000', 'Phí giao hàng cơ bản cho 2km đầu tiên (VNĐ)'),
('PER_KM_SHIPPING_FEE', '5000', 'Phí giao hàng tính thêm cho mỗi km tiếp theo (VNĐ)'),
('PLATFORM_COMMISSION_RATE', '20.0', 'Tỷ lệ hoa hồng chiết khấu sàn trên đơn món (%)'),
('DRIVER_EARNING_RATE', '80.0', 'Tỷ lệ thu nhập tài xế nhận trên phí ship (%)'),
('SEARCH_RADIUS_KM', '5.0', 'Bán kính tối đa điều phối tài xế (km)');
```

#### API Cấu hình:
- `GET /api/v1/admin/settings`: Lấy toàn bộ tham số.
- `PUT /api/v1/admin/settings`: Cập nhật giá trị tham số (Headers: `X-User-Role: ROLE_ADMIN`).

---

### 4. Quản Trị Toàn Bộ Đánh Giá Hệ Thống (`/admin/reviews`)

#### Quyền hạn Quản trị:
- Xem danh sách toàn bộ các đánh giá của khách hàng trong hệ thống (gồm cả đánh giá Nhà hàng và đánh giá Tài xế).
- Tìm kiếm theo mã đơn hàng, tên khách hàng, tên quán ăn hoặc tên tài xế.
- Lọc theo số sao (1★, 2★, 3★, 4★, 5★) và loại đối tượng (`RESTAURANT` hoặc `DRIVER`).
- Quyền xóa hoặc ẩn đánh giá: Khi phát hiện đánh giá chứa từ ngữ xúc phạm hoặc hình ảnh vi phạm tiêu chuẩn cộng đồng, Admin có quyền bấm **"Ẩn đánh giá"** hoặc **"Xóa đánh giá"**.

#### API Quản trị Đánh giá:
- `GET /api/v1/reviews/admin?page=0&size=10&targetType=RESTAURANT&rating=1&search=te`
- `DELETE /api/v1/reviews/admin/{reviewId}` (Headers: `X-User-Role: ROLE_ADMIN`).

---

## 🔧 VI. CHI TIẾT MODULE 3: KHẮC PHỤC LỖI TỒN ĐỌNG Ở MERCHANT & ADMIN

### 1. Sửa Lỗi Đa Chi Nhánh (Multi-Shop Branch Switcher) Của Merchant
- **Lỗi hiện tại:** Khi chủ quán sở hữu nhiều chi nhánh (`GET /api/v1/restaurants/mine`), việc bấm chọn quán khác trên dropdown không tự động cập nhật lại thực đơn và đơn hàng của chi nhánh đó, gây nhầm lẫn chi nhánh xử lý.
- **Giải pháp xử lý:**
  1. Trong Redux store `merchantSlice.ts`, khai báo state `selectedRestaurantId: number | null`.
  2. Lưu giá trị `selectedRestaurantId` vào `localStorage` để giữ nguyên ngữ cảnh khi F5.
  3. Khi người dùng thay đổi chi nhánh trên Dropdown:
     - Dispatch `setSelectedRestaurantId(newId)`.
     - Kích hoạt gọi lại đồng thời: `fetchOrdersByRestaurant(newId)` và `fetchMenuByRestaurant(newId)`.

---

### 2. Sửa Lỗi Nút Toggle Trạng Thái Còn Hàng / Hết Hàng Của Món Ăn
- **Lỗi hiện tại:** Trên bảng danh sách món ăn của Merchant (`/merchant/products`), bấm gạt switch Còn hàng / Hết hàng thỉnh thoảng bị reset về trạng thái cũ hoặc không lưu vào CSDL.
- **Giải pháp xử lý:**
  - Kết nối trực tiếp vào API `PUT /api/v1/products/{id}/status` với body `{"isAvailable": boolean}`.
  - Áp dụng kỹ thuật Optimistic UI Update: Đổi state Switch ngay lập tức trên giao diện, nếu API trả về lỗi thì mới rollback lại trạng thái cũ kèm thông báo Toast cảnh báo.

---

### 3. Tối Ưu Hóa Chuông Báo Âm Thanh WebSocket STOMP Cho Merchant
- **Lỗi hiện tại:** Do chính sách Autoplay Audio Policy của trình duyệt hiện đại (Chrome/Edge), âm thanh chuông "ding-dong" khi có đơn hàng mới thường bị trình duyệt chặn nếu người dùng chưa tương tác với trang web.
- **Giải pháp xử lý:**
  1. Khởi tạo một đối tượng `AudioContext` toàn cục ngay khi người dùng click lần đầu vào bất kỳ vị trí nào trên Dashboard Merchant:
     ```typescript
     window.addEventListener('click', () => {
       if (audioContext.state === 'suspended') {
         audioContext.resume();
       }
     }, { once: true });
     ```
  2. Bổ sung chuông báo thị giác: Ngoài âm thanh, hiển thị Banner thông báo trượt từ trên xuống (Ant Design `notification.open`) với nút bấm trực tiếp vào đơn hàng vừa nhận.

---

### 4. Bổ Sung Hiển Thị Tag "Không Có Tài Xế" Cho Đơn Hàng Hoàn Tất
- **Vấn đề đã xác minh ở Sprint 2:** Khi đơn hàng hoàn tất nhưng `driverId == null` (do test chuyển thẳng sang `COMPLETED` mà không có shipper nhận đơn), nút "Đánh giá tài xế" bị ẩn khiến người dùng thắc mắc tại sao chỉ thấy nút đánh giá quán.
- **Giải pháp giao diện trực quan:**
  - Tại [`CustomerOrderCard.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/order/components/CustomerOrderCard.tsx) và [`OrderDetailPage.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/order/OrderDetailPage.tsx):
    ```tsx
    {isCompleted && isWithin24Hours && (
      <>
        {/* Đánh giá Quán */}
        {restaurantReviewed ? (
          <Tag color="orange"><StarFilled /> Quán: Đã đánh giá</Tag>
        ) : (
          <Button onClick={() => setIsRestaurantReviewOpen(true)}>Đánh giá quán</Button>
        )}

        {/* Đánh giá Tài xế */}
        {order.driverId ? (
          driverReviewed ? (
            <Tag color="green"><StarFilled /> Tài xế: Đã đánh giá</Tag>
          ) : (
            <Button onClick={() => setIsDriverReviewOpen(true)}>Đánh giá tài xế</Button>
          )
        ) : (
          <Tooltip title="Đơn hàng hoàn tất không qua tài xế giao nên không cần đánh giá tài xế">
            <Tag color="default" className="text-gray-400 bg-gray-100 border-gray-200">
              Không có tài xế
            </Tag>
          </Tooltip>
        )}
      </>
    )}
    ```

---

## 💬 VII. CHI TIẾT MODULE 4: THEO DÕI THỜI GIAN THỰC & CHAT TRỰC TIẾP

### 1. Màn Hình Theo Dõi Đơn Hàng Live Stepper (`/orders/:id`)
- Kết nối tới Spring WebSocket STOMP endpoint: `http://localhost:8080/ws-food-deli`.
- Đăng ký lắng nghe kênh riêng của đơn hàng: `/topic/orders/{orderId}`.
- Khi nhận message sự kiện từ backend:
  ```json
  {
    "orderId": 28,
    "statusCode": "DELIVERING",
    "driverName": "Nguyễn Tuấn Tài",
    "driverPhone": "0912345678",
    "updatedAt": "2026-11-08T16:35:00.000Z"
  }
  ```
  Thanh Stepper 5 bước trên màn hình tự động chuyển mốc sang trạng thái mới và cập nhật thông tin tài xế ngay lập tức mà không cần F5.

---

### 2. Khung Chat 2 Chiều Trực Tiếp Khách Hàng $\leftrightarrow$ Quán Ăn / Tài Xế
- **Kênh gửi tin nhắn:** `/app/chat.send`
- **Kênh nhận tin nhắn:** `/topic/chat/{orderId}`
- **Bảng CSDL `chat_messages`:**
```sql
CREATE TABLE `chat_messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `sender_id` INT NOT NULL,
  `sender_role` VARCHAR(20) NOT NULL,
  `receiver_id` INT NOT NULL,
  `receiver_role` VARCHAR(20) NOT NULL,
  `message_text` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🐳 VIII. CHI TIẾT MODULE 5: ĐÓNG GÓI DOCKER COMPOSE & TRIỂN KHAI PRODUCTION

### Danh Sách Toàn Bộ 10 Microservices Trong `docker-compose.yml`:
1. `mysql-db`: CSDL MySQL 8.0 (Port 3306).
2. `redis`: Bộ nhớ đệm phân tán Redis (Port 6379).
3. `discovery-service`: Eureka Server (Port 8761).
4. `config-server`: Spring Cloud Config Server (Port 8888).
5. `api-gateway`: Spring Cloud Gateway (Port 8080).
6. `auth-service`: Dịch vụ định danh & xác thực (Port 8081).
7. `restaurant-service`: Dịch vụ quản lý quán & thực đơn (Port 8082).
8. `order-service`: Dịch vụ đơn hàng (Port 8083).
9. `delivery-service`: Dịch vụ điều phối & tài xế (Port 8084).
10. `payment-service`: Dịch vụ thanh toán VietQR & COD (Port 8085).
11. `review-service`: Dịch vụ đánh giá hậu mãi (Port 8086).
12. `chat-notification-service`: Dịch vụ chat & websocket realtime (Port 8087).

---

## 🧪 IX. KẾ HOẠCH KIỂM THỬ TỰ ĐỘNG & TIÊU CHÍ NGHIỆM THU (TEST MATRIX & DoD)

### 1. Ma Trận Kịch Bản Kiểm Thử (Test Cases)

| Mã Test | Phân hệ | Kịch bản kiểm thử | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) |
| :---: | :--- | :--- | :--- | :--- |
| **TC-DRV-01** | `delivery-service` | Happy Path: Tài xế bấm nhận đơn thành công | Đơn trạng thái `CONFIRMED`, `driverId = null` | Trả về 200 OK, đơn chuyển sang `DRIVER_ACCEPTED`, gán `driverId` |
| **TC-DRV-02** | `delivery-service` | **Concurrency Race Condition:** 2 tài xế cùng bấm nhận 1 đơn tại cùng 1 mili-giây | Driver A & Driver B cùng gửi request đồng thời | Driver A nhận 200 OK, Driver B nhận 409 Conflict, CSDL chỉ lưu duy nhất 1 driver |
| **TC-DRV-03** | `delivery-service` | Tài xế chuyển trạng thái giao hàng tuần tự | `DRIVER_ACCEPTED` $\rightarrow$ `PICKING_UP` $\rightarrow$ `DELIVERING` $\rightarrow$ `COMPLETED` | Chuyển trạng thái hợp lệ, cập nhật doanh thu ví tài xế |
| **TC-DRV-04** | `delivery-service` | Tính toán chỉ số AR / CR | Lịch sử 100 offers: 85 accepted, 5 cancelled | $AR = 85\%$, $CR = 5.88\%$, trạng thái `GOOD` |
| **TC-ADM-01** | `admin-service` | Khóa tài khoản người dùng vi phạm | Admin gửi request toggle-status `isActive = false` | Người dùng bị khóa, đăng nhập báo 403 Forbidden |
| **TC-ADM-02** | `admin-service` | Phê duyệt yêu cầu mở quán ăn mới | Yêu cầu ID hợp lệ, decision: `APPROVED` | Quán ăn kích hoạt `is_active = 1`, xuất hiện trên trang chủ |
| **TC-ADM-03** | `review-service` | Admin xóa đánh giá có nội dung xấu | Review ID hợp lệ, caller có `ROLE_ADMIN` | Đánh giá bị xóa khỏi CSDL, trả về 200 OK |
| **TC-MERCH-01**| Frontend Merchant | Đổi chi nhánh trên Branch Switcher | Chọn quán ăn #2 từ dropdown | State đổi sang quán #2, fetch lại menu và order của quán #2 |
| **TC-MERCH-02**| Frontend Merchant | Toggle Còn hàng / Hết hàng món ăn | Gạt Switch món ID #51 sang false | Gọi API `PUT`, cập nhật `is_available = 0` vào MySQL |
| **TC-CUST-01** | Frontend Customer | Hiển thị tag đơn hoàn tất không có tài xế | Đơn `COMPLETED`, `driverId = null` | Hiển thị nút "Đánh giá quán" và Tag "Không có tài xế" (có tooltip) |

---

### 2. Tiêu Chuẩn Hoàn Thành Toàn Diện Sprint 3 (Definition of Done - DoD)
- [ ] 100% các Unit & Integration Tests của toàn bộ 10 microservices đều PASS xanh.
- [ ] Đạt chuẩn Concurrency: Không phát sinh Race Condition khi chạy kiểm thử mô phỏng 10 tài xế tranh nhận 1 đơn hàng.
- [ ] Toàn bộ 4 vai trò (Customer, Merchant, Driver, Admin) đăng nhập qua 1 form duy nhất (`/login`) và truy cập đúng cổng chức năng theo Role.
- [ ] Khởi chạy toàn bộ hệ thống bằng duy nhất 1 lệnh `docker compose up -d --build` trên môi trường sạch.
- [ ] Bàn giao đầy đủ tài liệu hướng dẫn triển khai và kịch bản demo bảo vệ đồ án OJT.

