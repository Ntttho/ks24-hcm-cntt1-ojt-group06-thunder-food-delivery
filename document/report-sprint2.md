# 📋 BÁO CÁO TỔNG KẾT & ĐÁNH GIÁ KỸ THUẬT SPRINT 2
## DỰ ÁN: FOOD THUNDER DELI (SPRING BOOT MICROSERVICES + REACT 19 CLIENT)

> **Giai đoạn:** Sprint 2 - Hoàn thiện Phân hệ Đánh giá (Review Service), Trải nghiệm Khách hàng & Merchant Portal  
> **Thời gian đánh giá:** 08/11/2026  
> **Đội ngũ phát triển (6 thành viên):** Thọ (Leader), Duy, Quang anh, Nhựt, Thịnh, Đức  
> **Kiến trúc:** Spring Boot 3.3.5+, Spring Cloud 2023.x, MySQL 8.0 (Decoupled Schema), React 19 TypeScript  

---

## 1. Mục Tiêu Sprint 2 (Sprint 2 Goals)
Sprint 2 tập trung hoàn thiện trọn vẹn luồng trải nghiệm khách hàng và quản lý đối tác quán, xây dựng dịch vụ hậu mãi cốt lõi:
1. **Xây dựng Microservice mới `review-service` (Port 8086):** Phân hệ đánh giá và chấm điểm độc lập, tách biệt hoàn toàn giữa đánh giá Nhà hàng (kèm món ăn `food_item_id`) và đánh giá Tài xế (kèm nhận xét nhanh `quick_tags`).
2. **Khắc phục triệt để lỗi Build Maven Reactor Microservices:** Điều tra và xử lý dứt điểm các lỗi test case tại `restaurant-service` đang chặn đứng tiến trình `mvn clean package` của toàn bộ hệ thống backend.
3. **Container hóa Docker & Tích hợp Docker Compose:** Đóng gói Dockerfile cho `review-service` và tích hợp vào `docker-compose.yml` cùng cụm microservices.
4. **Phát triển Giao diện Khách hàng & Chủ quán:** Tạo 2 Modal đánh giá riêng biệt tại trang Lịch sử đơn hàng và trang Quản lý đánh giá dành cho Merchant (`MerchantReviewPage`).

---

## 2. Bảng Đối Chiếu Kết Quả Thực Tế Sprint 2

| Hạng mục công việc | Tiêu chí kỹ thuật & Nghiệp vụ | Hiện trạng thực tế | Bằng chứng kiểm chứng | Đánh giá |
| :--- | :--- | :--- | :--- | :---: |
| **Cơ sở dữ liệu Review** | Mở rộng bảng `reviews`: hỗ trợ `food_item_id`, `images_json`, unique index `unique_order_target` (`order_id`, `target_type`). | Hoàn thành | `database/seed_all.sql` (Line 420-440), không dùng FK vật lý chéo service. | **ĐẠT** |
| **Microservice `review-service`** | Spring Boot 3.3.5, Eureka Client, OpenFeign `OrderClient`, Spring Data JPA, port 8086. | Hoàn thành | Source code tại `food-deli-service/review-service/`, cấu hình Eureka & Gateway hoàn chỉnh. | **ĐẠT** |
| **API Tách Đánh Giá Độc Lập** | `POST /api/v1/reviews/restaurant` và `POST /api/v1/reviews/driver`. Giới hạn nội 24h sau khi đơn hoàn tất, mỗi đối tượng chỉ đánh giá 1 lần. | Hoàn thành | Đạt 9/9 unit tests tại `ReviewServiceTest.java`. Xử lý chặt chẽ ngoại lệ 400, 404, 409. | **ĐẠT** |
| **Sửa lỗi Build Microservices** | Xử lý lỗi load ApplicationContext và sai JSON Path assertion tại `restaurant-service`. | Hoàn thành | Sửa `CategoryControllerTest`, `ToppingControllerTest`, `RestaurantControllerTest`. 30/30 tests PASS. | **ĐẠT** |
| **Đóng gói toàn bộ Backend** | Lệnh `.\mvnw.cmd clean package -DskipTests` và `.\mvnw.cmd test` chạy thành công toàn bộ reactor. | Hoàn thành | Reactor Summary 9/9 modules SUCCESS. Toàn bộ 76 unit tests toàn hệ thống PASS 100%. | **ĐẠT** |
| **Dockerization & Compose** | Tạo `Dockerfile` tối ưu JRE 21 Alpine, khai báo `review-service` trong `docker-compose.yml`. | Hoàn thành | Lệnh `docker compose build review-service` xuất image `food-deli-service-review-service:latest` thành công. | **ĐẠT** |
| **Frontend Customer Review Modals** | 2 Modal độc lập: `RestaurantReviewModal.tsx` và `DriverReviewModal.tsx`. | Hoàn thành | Tích hợp vào `CustomerOrderCard.tsx` và `OrderDetailPage.tsx`, tự động tải trạng thái đánh giá qua API. | **ĐẠT** |
| **Frontend Merchant Review Page** | Trang `MerchantReviewPage.tsx`: Xem đánh giá quán, lọc theo món ăn, số sao, chỉ đọc (không sửa xóa). | Hoàn thành | Frontend build Vite thành công 100% không cảnh báo lỗi type. | **ĐẠT** |

---

## 3. Kiến Trúc Kỹ Thuật Đã Triển Khai

```
[Client / Web Browser]
       │
       ▼ (HTTP / REST)
[api-gateway :8080]
  ├── /api/v1/reviews/**  ──────► [review-service :8086] ──► [MySQL: reviews table]
  │                                    │
  │                                    ▼ (OpenFeign Client)
  ├── /api/v1/orders/**   ──────► [order-service :8083]
  └── /api/v1/restaurants/** ───► [restaurant-service :8082]
```

### Các nguyên tắc kỹ thuật cốt lõi:
1. **Decoupled Plain IDs Pattern:** `review-service` tuyệt đối không dùng JPA `@ManyToOne` hay Foreign Key vật lý sang bảng của microservice khác. Bảng `reviews` chỉ lưu các khóa logic dạng Plain ID (`order_id`, `restaurant_id`, `driver_id`, `customer_id`, `food_item_id`).
2. **Pre-validation qua OpenFeign:** Khi nhận request đánh giá, `review-service` gọi `OrderClient.getOrderDetail(orderId)` để kiểm tra 3 điều kiện tiên quyết:
   - Đơn hàng có thuộc về khách hàng đang đăng nhập hay không?
   - Trạng thái đơn đã là `DELIVERED` hoặc `COMPLETED` chưa?
   - Thời gian từ lúc tạo đơn đến hiện tại có vượt quá 24 giờ hay không?
3. **Chống đánh giá trùng lặp (Idempotency):** Áp dụng Unique Composite Index `unique_order_target (order_id, target_type)` tại cơ sở dữ liệu và kiểm tra `existsByOrderIdAndTargetType` tại tầng service để loại trừ nguy cơ gửi đánh giá lặp lại.

---

## 4. Xử Lý Sự Cố Kỹ Thuật & Giải Đáp Nghiệp Vụ Trong Sprint

### 4.1. Sự cố Build Maven Reactor bị dừng
- **Hiện tượng:** Chạy `mvn clean package` toàn hệ thống thì bị ngắt giữa chừng, `order-service` và `review-service` bị đánh dấu `SKIPPED`. Người dùng nghi ngờ `review-service` bị lỗi.
- **Nguyên nhân gốc rễ:** Lỗi bắt nguồn từ 3 ca kiểm thử trong `restaurant-service`:
  - `CategoryControllerTest`: Thiếu `@MockBean ProductRepository` dẫn đến `UnsatisfiedDependencyException`.
  - `ToppingControllerTest`: Controller trả về `PageResponse` nhưng test lại assert `$.data.length()` thay vì `$.data.content.length()`.
  - `RestaurantControllerTest`: Thiếu `@MockBean ToppingService` và assert sai cấu trúc dữ liệu phân trang.
- **Kết quả xử lý:** Sau khi sửa, toàn bộ 30 tests của `restaurant-service` đã PASS; toàn bộ 9 microservices đã đóng gói file `.jar` thành công.

### 4.2. Giải đáp: Tại sao nút "Đánh giá tài xế" chưa hiển thị trên đơn hoàn tất?
- **Nguyên nhân thực tế:** Truy vấn dữ liệu thực tế đơn hàng `#ORD-20261107-529307` (`id=24`) từ API `order-service` cho thấy `driverId: null`. Đơn hàng này được test chuyển trạng thái thẳng từ `CONFIRMED` sang `COMPLETED` mà chưa từng qua bước Tài xế bấm nhận đơn (`DRIVER_ACCEPTED`).
- **Logic bảo vệ Frontend:** Giao diện bọc điều kiện `{order.driverId && (...)}`. Vì không có tài xế nào nhận đơn, hệ thống chủ động ẩn nút đánh giá tài xế để đảm bảo đúng nghiệp vụ (tránh trường hợp gửi request lên Backend bị từ chối với lỗi `400 Bad Request: Đơn hàng này không có thông tin tài xế giao hàng!`).

---

## 5. Kết Quả Kiểm Thử Toàn Diện (Test Metrics)

```
[INFO] Reactor Summary for microservice-backend 1.0.0-SNAPSHOT:
[INFO]   microservice-backend ............................... SUCCESS
[INFO]   common-library-service ............................. SUCCESS
[INFO]   discovery-service .................................. SUCCESS
[INFO]   config-server ...................................... SUCCESS
[INFO]   api-gateway ........................................ SUCCESS
[INFO]   auth-service ....................................... SUCCESS
[INFO]   restaurant-service ................................. SUCCESS
[INFO]   order-service ...................................... SUCCESS
[INFO]   review-service ..................................... SUCCESS
[INFO] BUILD SUCCESS (Tổng thời gian build & test: 01:11 min)
```
- **Tổng số tests:** 76/76 unit & integration tests đạt tỷ lệ vượt qua 100%.
- **Docker Compose:** Đã build thành công Docker image `food-deli-service-review-service:latest`.

---

## 6. Mục Tiêu Sprint 3 (Sprint 3 Goal - Đã Điều Chỉnh)

> [!IMPORTANT]
> **MỤC TIÊU CỐT LÕI SPRINT 3:**  
> **Hoàn thiện toàn bộ tất cả các module (`admin`, `driver`), bao gồm cả sửa những lỗi tồn đọng của các tính năng ở `merchant` và `admin`.**

### Các trụ cột trọng tâm Sprint 3:
1. **Hoàn thiện trọn vẹn Phân hệ Tài xế (`driver-service` & Shipper Web Hub):**
   - Backend `delivery-service` (Port 8084): Triển khai cơ chế **Khóa bi quan (`SELECT ... FOR UPDATE`)** chống Race Condition khi tài xế tranh nhận đơn.
   - Vòng đời giao hàng ảo hóa: `DRIVER_ACCEPTED` $\rightarrow$ `PICKING_UP` $\rightarrow$ `DELIVERING` $\rightarrow$ `DELIVERED`/`COMPLETED`.
   - Thuật toán tính chỉ số hiệu suất tài xế theo tài liệu PRD: Tỷ lệ nhận đơn (AR - Acceptance Rate) và Tỷ lệ hủy đơn (CR - Cancellation Rate) trên rolling window 100 đơn.
   - Frontend Shipper Web Hub: Radar quét đơn mới, nhận cuốc 1 chạm, trượt chuyển trạng thái giao hàng, thống kê ví thu nhập.
2. **Hoàn thiện trọn vẹn Phân hệ Quản trị Viên (`admin-service` & Admin Portal):**
   - Quản lý tài khoản toàn sàn: Bảng danh sách, phân quyền Role, khóa / mở khóa tài khoản người dùng vi phạm.
   - Phê duyệt Quán ăn & Tài xế mới: Xử lý hồ sơ `restaurant_change_requests` và đăng ký hồ sơ tài xế (`APPROVED` / `REJECTED`).
   - Cấu hình hệ thống toàn sàn: Cài đặt phí ship mặc định, bán kính tìm kiếm, tỷ lệ hoa hồng chiết khấu sàn (`system_settings`).
   - Quản trị Đánh giá toàn sàn: Xem, tìm kiếm, lọc theo quán/tài xế, xóa/ẩn review vi phạm tiêu chuẩn cộng đồng.
3. **Dứt điểm toàn bộ lỗi tồn đọng ở Merchant & Admin:**
   - Hoàn thiện tính năng đa chi nhánh và bộ chọn quán ăn (Branch Switcher).
   - Tối ưu chuông báo âm thanh WebSocket STOMP ("ding-dong") khi có đơn mới đổ về cho Merchant.
   - Bổ sung hiển thị trực quan Tag chú thích `<Tag color="default">Không có tài xế</Tag>` kèm Tooltip giải thích khi đơn hoàn tất không có shipper, tránh gây nhầm lẫn cho người dùng.
   - Hoàn thiện trang thống kê báo cáo doanh thu đa quán cho Merchant (`/merchant/analytics`).
   - Khắc phục các lỗi validation và hiển thị trong Admin Portal.
4. **Nghiệm thu toàn hệ thống & Triển khai Docker Production:**
   - Khởi chạy toàn bộ 10 microservices, MySQL 8.0, Redis bằng duy nhất 1 lệnh `docker compose up -d`.

