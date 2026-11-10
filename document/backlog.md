# 📋 PRODUCT BACKLOG DỰ ÁN FOOD THUNDER DELI
> **Dự án:** Food Thunder Deli (Nền tảng Đặt & Giao Đồ Ăn Trực Tuyến)  
> **Nguồn đặc tả:** Trích xuất và chuẩn hóa từ [`document/Srs.md`](file:///d:/ojt-food-deli-start/document/Srs.md)  
> **Phương pháp quản lý:** Agile / Scrum (Mô hình 3 Sprints chuẩn OJT)  
> **Tổng số Epic:** 7 Epics chính | **Tổng Story Points toàn dự án:** 143 SP  

---

## 📑 I. BẢNG TỔNG HỢP PRODUCT BACKLOG THEO MỨC ĐỘ ƯU TIÊN

| Mã User Story | Tên Tính Năng (Ý Chính) | Vai Trò (Actor) | Độ Ưu Tiên | Sprint | Trạng Thái | Story Points |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **US-AUTH-01** | Đăng ký tài khoản tập trung (Unified Register) | Khách / Quán / Xế | 🟠 High | Sprint 1 | ✅ Hoàn thành | 5 SP |
| **US-AUTH-02** | Đăng nhập JWT & Header Navigation theo Role | Toàn bộ User | 🟠 High | Sprint 1 & 2 | ✅ Hoàn thành | 4 SP |
| **US-AUTH-03** | Quản lý Hồ sơ cá nhân & Sổ địa chỉ giao hàng | Customer | 🟡 Medium | Sprint 2 | ✅ Hoàn thành | 3 SP |
| **US-CUST-01** | Khám phá ẩm thực, Tìm kiếm & Lọc theo Danh mục | Anonymous / Cust | 🟠 High | Sprint 2 | ✅ Hoàn thành | 4 SP |
| **US-CUST-02** | Xem Chi tiết Quán & Thực đơn phân nhóm Category | Anonymous / Cust | 🟠 High | Sprint 2 | ✅ Hoàn thành | 2 SP |
| **US-CUST-03** | Modal Tùy biến Món ăn & Topping tính tiền realtime | Customer | 🟠 High | Sprint 2 | ✅ Hoàn thành | 3 SP |
| **US-CUST-04** | Giỏ hàng thông minh (Ràng buộc 1 quán, đồng bộ Redux) | Customer | 🟠 High | Sprint 2 | ✅ Hoàn thành | 2 SP |
| **US-CUST-05** | Route Guard bảo vệ thanh toán (Yêu cầu login) | Customer | 🟠 High | Sprint 2 | ✅ Hoàn thành | 2 SP |
| **US-CUST-06** | Đặt hàng linh hoạt đa phương thức (COD & VietQR) | Customer | 🟠 High | Sprint 2 | ✅ Hoàn thành | 6 SP |
| **US-CUST-07** | Xem Lịch sử Đơn hàng & Chi tiết món đã đặt | Customer | 🟡 Medium | Sprint 2 | ✅ Hoàn thành | 3 SP |
| **US-CUST-09** | Phân hệ Đánh giá 5★ riêng Quán & Tài xế (`review-service`) | Customer / Merch | 🟠 High | Sprint 2 | ✅ Hoàn thành | 5 SP |
| **US-MERCH-01**| Quản lý đa chi nhánh (1 Merchant sở hữu nhiều quán) | Merchant | 🟠 High | Sprint 2 | ✅ Hoàn thành | 2 SP |
| **US-MERCH-02**| Merchant Dashboard tiếp nhận & xử lý đơn hàng Realtime | Merchant | 🟠 High | Sprint 2 | ✅ Hoàn thành | 3 SP |
| **US-MERCH-03**| Chuông báo âm thanh đơn mới qua WebSocket STOMP | Merchant | 🟠 High | Sprint 2 | ✅ Hoàn thành | 4 SP |
| **US-MERCH-04**| Quản lý Thực đơn & Món ăn (CRUD, toggle Còn/Hết hàng) | Merchant | 🟠 High | Sprint 2 | ✅ Hoàn thành | 3 SP |
| **US-MERCH-05**| Quản lý Nhóm Topping & Gán Topping vào món cụ thể | Merchant | 🟠 High | Sprint 2 | ✅ Hoàn thành | 7 SP |
| **US-MERCH-06**| Quản lý Danh mục món (Category) & Voucher quán ăn | Merchant | 🟡 Medium | Sprint 2 | ✅ Hoàn thành | 2 SP |
| **US-OPS-01**  | Hạ tầng Cổng thanh toán VietQR Napas 247 (Dynamic QR + Webhook)| Core / Backend | 🟠 High | Sprint 2 | ✅ Hoàn thành | 5 SP |
| **US-OPS-02**  | Kiến trúc Microservices Hub, Gateway JWT & Eureka | Architecture | 🟠 High | Sprint 1 | ✅ Hoàn thành | 13 SP |
| **US-DRV-01**  | Backend Delivery & Khóa bi quan chống Race Condition | Shipper / Core | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 8 SP |
| **US-DRV-02**  | Shipper Radar (1-Click, dừng hiển thị khi đang nhận 1 đơn)| Shipper | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 5 SP |
| **US-DRV-03**  | Giao diện Điều hướng Giao hàng Ảo hóa Trực quan, Dễ hiểu| Shipper | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 4 SP |
| **US-DRV-04**  | Bộ máy Tính toán Hiệu suất Tài xế Chuẩn PRD (AR / CR) | Shipper / Admin | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 5 SP |
| **US-DRV-05**  | Quản lý Lịch sử Đơn hàng & Thống kê Ví thu nhập Tài xế| Shipper | 🟡 Medium | Sprint 3 | ⏳ Sprint 3 Goal | 3 SP |
| **US-ADM-01**  | Màn hình Quản trị Người dùng (CRUD: Thêm/Sửa/Khóa/Xóa)| Admin | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 4 SP |
| **US-ADM-02**  | Phân hệ Phê duyệt Quán ăn mới & Tài xế mới gia nhập sàn| Admin | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 4 SP |
| **US-ADM-03**  | Cấu hình Tham số Toàn sàn (Phí ship, % Hoa hồng sàn) | Admin | 🟡 Medium | Sprint 3 | ⏳ Sprint 3 Goal | 3 SP |
| **US-ADM-04**  | Quản trị Review Xem & Xóa (Tách 2 trang Quán & Tài xế)| Admin | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 4 SP |
| **US-ADM-05**  | Dashboard Quản lý Tổng thu Toàn sàn & Biểu đồ Tháng | Admin | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 5 SP |
| **US-FIX-MERCH**| Khắc phục lỗi tồn đọng Merchant (Multi-shop, Toggle, STOMP)| Merchant | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 4 SP |
| **US-FIX-ADM**  | Khắc phục lỗi tồn đọng Admin (Duyệt hồ sơ, Tag Shipper)| Admin | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 3 SP |
| **US-CUST-08** | Theo dõi Tiến trình Đơn hàng Realtime (Live Stepper) | Customer | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 3 SP |
| **US-CHAT-01** | Soạn tin nhắn Chat 2 chiều Khách hàng <-> Tài xế Realtime| Cust / Driver | 🟡 Medium | Sprint 3 | ⏳ Sprint 3 Goal | 3 SP |
| **US-OPS-03**  | Đóng gói Docker Compose, Load Test HikariCP & Nghiệm thu| DevOps / Lead | 🟠 High | Sprint 3 | ⏳ Sprint 3 Goal | 7 SP |

---

## 🎯 II. CHI TIẾT CÁC Ý CHÍNH TỪNG PHÂN HỆ (EPICS)

---

### 🛡️ EPIC 1: ĐỊNH DANH, XÁC THỰC & HỒ SƠ (AUTHENTICATION & RBAC)
*(Căn cứ: SRS Mục 4.1 - FR-01, FR-02, FR-03)*

* **US-AUTH-01: Đăng ký tài khoản tập trung (Unified Registration)**
  * **Ý chính:** Hệ thống dùng duy nhất 1 form `/register` cho mọi đối tượng; mật khẩu mã hóa BCrypt an toàn.
  * **Tiêu chí nghiệm thu (AC):** Đăng ký bằng Email/SĐT + Mật khẩu $\rightarrow$ Chọn vai trò muốn đăng ký (Khách hàng, Quán ăn, Tài xế) $\rightarrow$ Lưu vào database với role tương ứng.
* **US-AUTH-02: Đăng nhập JWT & Điều hướng động theo Role**
  * **Ý chính:** Duy nhất 1 form `/login`, cấp phát Access Token JWT, lưu vào Redux & LocalStorage.
  * **Tiêu chí nghiệm thu (AC):** Sau khi login thành công, Header tự động hiển thị Avatar Dropdown theo Role:
    * `ROLE_MERCHANT` $\rightarrow$ Lối tắt vào *Merchant Portal*.
    * `ROLE_DRIVER` $\rightarrow$ Lối tắt vào *Shipper Hub*.
    * `ROLE_ADMIN` $\rightarrow$ Lối tắt vào *Admin Portal*.
* **US-AUTH-03: Quản lý Hồ sơ & Sổ địa chỉ nhận hàng**
  * **Ý chính:** Cập nhật thông tin cá nhân và quản lý danh sách địa chỉ giao hàng (Nhà riêng, Văn phòng...).
  * **Tiêu chí nghiệm thu (AC):** Thêm/Sửa/Xóa địa chỉ giao hàng; gắn cờ "Địa chỉ mặc định" để tự động điền khi checkout.

---

### 🍜 EPIC 2: KHÁM PHÁ ẨM THỰC & LUỒNG ĐẶT MÓN (CUSTOMER ORDERING FLOW)
*(Căn cứ: SRS Mục 4.2 - FR-04, FR-05, FR-06, FR-07, FR-08, FR-09)*

* **US-CUST-01: Khám phá Trang chủ, Tìm kiếm & Lọc ẩm thực**
  * **Ý chính:** Giao diện Home chuẩn đẹp, gọi API thật (bỏ Mock), hỗ trợ Debounce Search và thanh cuộn Category.
  * **Tiêu chí nghiệm thu (AC):** Bấm chọn danh mục (Cơm, Bún/Phở, Trà sữa...) $\rightarrow$ Tự động lọc danh sách quán tương ứng; Ô tìm kiếm Debounce 300ms lọc tức thì theo tên món/quán.
* **US-CUST-02: Xem Chi tiết Quán & Thực đơn (`/restaurants/:id`)**
  * **Ý chính:** Hiển thị thông tin quán (tên, địa chỉ, giờ hoạt động, số sao) và danh sách món ăn phân theo từng danh mục.
* **US-CUST-03: Modal Tùy biến Món ăn & Topping**
  * **Ý chính:** Bấm vào món mở popup chọn Size, Độ ngọt, Đá và các Topping ăn kèm; tổng tiền tự động cộng dồn realtime trước khi thêm vào giỏ.
* **US-CUST-04: Giỏ hàng thông minh (Single-Shop Constraint & Redux)**
  * **Ý chính:** Giỏ hàng đồng bộ Redux Toolkit; áp dụng **ràng buộc 1 quán duy nhất**: nếu khách chọn món từ quán khác, hệ thống cảnh báo xác nhận xóa giỏ cũ để tạo giỏ mới.
* **US-CUST-05: Route Guard bảo vệ luồng Thanh toán**
  * **Ý chính:** Chặn khách chưa đăng nhập bấm thanh toán; tự động đẩy sang `/login` và chuyển hướng quay lại `/checkout` ngay sau khi đăng nhập thành công.
* **US-CUST-06: Đặt hàng Đa phương thức (COD & VietQR Napas 247)**
  * **Ý chính:** Khách chọn thanh toán bằng Tiền mặt (COD) hoặc Quét mã VietQR.
  * **Tiêu chí nghiệm thu (AC):** Chọn COD $\rightarrow$ Đặt thành công chuyển sang `/orders/:id`; Chọn VietQR $\rightarrow$ Mở modal quét mã VietQR động kèm thông tin chuyển khoản $\rightarrow$ Hệ thống tự động xác nhận qua Webhook/Polling và cập nhật trạng thái `PAID`.
* **US-CUST-07: Lịch sử Đơn hàng (`/orders`) & Chi tiết đơn đã đặt**
  * **Ý chính:** Xem toàn bộ đơn hàng trong quá khứ kèm trạng thái, chi tiết từng món và phương thức thanh toán.

---

### 🏪 EPIC 3: CỔNG QUẢN LÝ ĐỐI TÁC QUÁN ĂN (MERCHANT MANAGEMENT & MULTI-SHOPS)
*(Căn cứ: SRS Mục 4.3 - FR-12, FR-13, FR-14, FR-15, FR-16, FR-19)*

* **US-MERCH-01: Quản lý Đa Chi nhánh (1 Merchant sở hữu nhiều Quán ăn)**
  * **Ý chính:** 1 tài khoản Merchant có thể sở hữu chuỗi nhiều quán ăn (`GET /api/v1/restaurants/mine`); Dropdown trên Header cho phép đổi chi nhánh làm việc nhanh chóng.
* **US-MERCH-02: Merchant Dashboard Tiếp nhận & Xử lý Đơn hàng Realtime**
  * **Ý chính:** Bảng điều khiển đơn hàng phân tab (`Mới`, `Đang nấu`, `Hoàn thành`, `Đã hủy`); Nút bấm 1-click **Xác nhận đơn (`CONFIRMED`)** hoặc **Báo hết món/Từ chối (`CANCELLED`)**.
* **US-MERCH-03: Chuông báo Âm thanh Đơn mới qua WebSocket STOMP**
  * **Ý chính:** Khi khách đặt đơn thành công, hệ thống đẩy tín hiệu WebSocket tức thì kích hoạt tiếng chuông reo "ding-dong" và popup cảnh báo trên Dashboard của quán.
* **US-MERCH-04: Quản lý Thực đơn & Món ăn (Menu & Product CRUD)**
  * **Ý chính:** Thêm/Sửa/Xóa món ăn, tải ảnh minh họa; Toggle Bật/Tắt trạng thái **Còn hàng (In Stock) $\leftrightarrow$ Hết hàng (Out of Stock)** tức thì.
* **US-MERCH-05: Quản lý Nhóm Topping & Gán Topping vào Món cụ thể**
  * **Ý chính:** Tạo danh sách Topping (Size, Thạch, Trứng... kèm giá tiền cộng thêm); Gán các nhóm topping tương ứng vào từng món ăn (`product_toppings`).
* **US-MERCH-06: Quản lý Danh mục (Category) & Voucher khuyến mãi quán**
  * **Ý chính:** Quản lý các nhóm menu của quán; tạo mã giảm giá riêng của quán (giảm %, giảm tiền mặt, giá trị đơn tối thiểu).
* **US-MERCH-07: Dashboard Báo cáo & Thống kê Doanh thu Đa quán**
  * **Ý chính:** Biểu đồ doanh thu theo ngày/tuần/tháng theo từng quán hoặc tính tổng toàn bộ các chi nhánh.

---

### 🛵 EPIC 4: CỔNG TÀI XẾ & QUY TRÌNH GIAO HÀNG ẢO HÓA (SHIPPER WEB HUB)
*(Căn cứ: SRS Mục 4.4 - FR-20, FR-21, FR-22, FR-23 + PRD AR/CR)*

* **US-DRV-01: Backend Delivery & Khóa bi quan chống Race Condition**
  * **Ý chính:** Áp dụng **Pessimistic Locking (`SELECT ... FOR UPDATE`)** khi nhiều tài xế cùng bấm nhận 1 đơn hàng $\rightarrow$ Người đầu tiên nhận thành công, người thứ hai nhận phản hồi `409 Conflict` an toàn, không tranh chấp.
* **US-DRV-02: Shipper Web Hub - Radar Quét Đơn & Ràng Buộc Đơn Duy Nhất (Single Active Order)**
  * **Ý chính:** Giao diện tối ưu Mobile Web hiển thị danh sách các đơn đã được quán xác nhận (`CONFIRMED`) đang chờ tài xế lân cận tiếp nhận. **Đặc biệt: Dừng hiển thị đơn mới khi tài xế đã và đang nhận 1 đơn hàng** (`DRIVER_ACCEPTED`, `PICKING_UP`, `DELIVERING`) để tài xế tập trung giao 1 đơn duy nhất.
* **US-DRV-03: Quy trình Giao hàng Ảo hóa Trực quan, Dễ hiểu (Virtual Delivery Workflow)**
  * **Ý chính:** Các nút thao tác chuyển đổi trạng thái một chạm rõ ràng, dễ hiểu: *"Đã đến quán lấy món"* $\rightarrow$ *"Bắt đầu đi giao"* $\rightarrow$ *"Giao thành công & Thu tiền COD"*.
* **US-DRV-04: Bộ máy Tính toán Chỉ số Hiệu suất Tài xế Chuẩn PRD**
  * **Ý chính:** Thuật toán tính toán độc lập trên rolling window 100 đơn gần nhất: Tỷ lệ chấp nhận đơn (AR $\ge 80\%$) và Tỷ lệ hủy đơn (CR $\le 10\%$).
* **US-DRV-05: Quản lý Lịch sử Đơn hàng & Thống kê Ví Thu nhập**
  * **Ý chính:** Danh sách chi tiết các cuốc xe đã hoàn thành, tổng tiền ship thu được trong ngày/tuần và số dư ví.

---

### 💬 EPIC 5: TƯƠNG TÁC THỜI GIAN THỰC & CHAT (REALTIME & CHAT)
*(Căn cứ: SRS Mục 4.2 & 4.3 - FR-08, FR-10, FR-11, FR-17, FR-18)*

* **US-RT-01: Theo dõi Đơn hàng Thời gian thực (Live Stepper 5 bước)**
  * **Ý chính:** Màn hình `/orders/:id` kết nối STOMP WebSocket tự động nhảy trạng thái khi Quán/Tài xế bấm thao tác mà không cần tải lại (F5) trang.
* **US-CHAT-01: Soạn Tin Nhắn Chat 2 Chiều Trực Tiếp Khách Hàng $\leftrightarrow$ Tài Xế**
  * **Ý chính:** Khung chat nổi thời gian thực qua WebSocket STOMP giúp Khách hàng và Tài xế nhắn tin trực tiếp dặn dò, trao đổi lộ trình kèm các mẫu tin nhắn nhanh (Quick Replies).

---

### ⚙️ EPIC 6: CỔNG QUẢN TRỊ VIÊN HỆ THỐNG (SYSTEM ADMIN PORTAL)
*(Căn cứ: SRS Mục 4.5 - FR-24, FR-25, FR-26, FR-27)*

* **US-ADM-01: Quản lý Người dùng Toàn sàn (CRUD Toàn Diện - `/admin/users`)**
  * **Ý chính:** Đầy đủ thao tác: Xem danh sách phân trang/tìm kiếm/lọc role, Thêm mới tài khoản, Sửa thông tin & vai trò, Khóa/Mở khóa hoặc Xóa tài khoản vi phạm.
* **US-ADM-02: Phân hệ Phê duyệt Quán ăn Mới & Tài xế Mới**
  * **Ý chính:** Màn hình kiểm duyệt hồ sơ mở quán mới (`restaurant_change_requests`) và duyệt hồ sơ xin làm tài xế mới (`driver_details` pending).
* **US-ADM-03: Cấu hình Tham số Toàn sàn (System Settings)**
  * **Ý chính:** Bảng cấu hình phí vận chuyển mỗi km, % hoa hồng sàn (`system_settings`).
* **US-ADM-04: Quản trị Đánh Giá Toàn Sàn Xem & Xóa (Tách Biệt 2 Trang)**
  * **Ý chính:** Tách 2 màn hình riêng biệt: Trang 1 Quản lý đánh giá Quán ăn (`/admin/reviews/restaurants`), Trang 2 Quản lý đánh giá Tài xế (`/admin/reviews/drivers`). Hỗ trợ xem chi tiết và nút Xóa đánh giá vi phạm tiêu chuẩn.
* **US-ADM-05: Giao diện Quản lý Tổng thu & Chỉ số Hệ thống (`/admin/analytics`)**
  * **Ý chính:** Biểu đồ doanh thu toàn sàn tính theo tháng và 5 thẻ thống kê: Số lượng người dùng, Số lượng nhà hàng, Số lượng đối tác kinh doanh (Merchants), Tỷ lệ đơn thành công / tổng đơn đặt hàng, Số lượng món ăn toàn sàn.
* **US-FIX-MERCH: Khắc phục Lỗi Tồn Đọng Phân hệ Merchant**
  * **Ý chính:** Sửa triệt để các lỗi ở Cổng Quán: lỗi chọn chi nhánh (Branch Switcher đa quán), toggle trạng thái món ăn, đồng bộ chuông đơn STOMP, bổ sung báo cáo doanh thu đa quán.
* **US-FIX-ADM: Khắc phục Lỗi Tồn Đọng Phân hệ Admin & Customer**
  * **Ý chính:** Sửa các lỗi phê duyệt hồ sơ quán/tài xế, lưu cấu hình hệ thống, và đồng bộ hiển thị Tag "Không có tài xế" trên chi tiết đơn hàng khi đơn hoàn tất không có shipper.

---

### 🏗️ EPIC 7: HẠ TẦNG KỸ THUẬT, BẢO MẬT & DEVOPS (TECHNICAL & ARCHITECTURE)
*(Căn cứ: SRS Mục 3, 5 - NFR-01 đến NFR-13)*

* **US-OPS-01: Cổng Thanh toán Điện tử VietQR (Napas 247)**
  * **Ý chính:** Module xử lý thanh toán trực tuyến quét mã VietQR động, Webhook tự động đối soát nội dung đơn hàng và Polling tra cứu trạng thái đồng bộ đơn hàng.
* **US-OPS-02: Kiến trúc Microservices Hub, Gateway & Service Discovery**
  * **Ý chính:** Spring Cloud Gateway (Port 8080) làm đầu mối duy nhất, Eureka Service Registry (Port 8761), xác thực JWT tập trung và liên kết dữ liệu bằng Plain ID.
* **US-OPS-03: Đóng gói Docker Compose Production & Kiểm thử Chịu tải**
  * **Ý chính:** Khởi chạy toàn bộ hệ sinh thái bằng 1 lệnh `docker compose up -d --build`, kiểm thử chịu tải HikariCP Pool 100 req/s đảm bảo hệ thống vận hành ổn định.

---

## 📌 III. NGUYÊN TẮC VẬN HÀNH BACKLOG (BACKLOG MANAGEMENT RULES)

1. **Thứ tự Ưu tiên (Prioritization):**
   * Các User Stories có nhãn `🟠 High` thuộc luồng Đặt hàng - Thanh toán - Vận hành Quán là các tính năng chặn luồng (Blocker), bắt buộc hoàn thành trong **Sprint 1 & Sprint 2**.
   * Các User Stories về Tài xế, Đánh giá, Realtime Live Chat và Admin Portal sẽ được hoàn thiện dứt điểm trong **Sprint 3**.
2. **Quy chuẩn Định nghĩa Hoàn thành (Definition of Done - DoD):**
   * Mỗi User Story chỉ được tính là hoàn thành khi thỏa mãn đầy đủ các Tiêu chí Nghiệm thu (Acceptance Criteria), code đã được Leader review merge và chạy thông suốt trên môi trường tích hợp.
3. **Mối quan hệ với Kế hoạch Trello:**
   * File [**`backlog.md`**](file:///d:/ojt-food-deli-start/backlog.md) này đóng vai trò là **Product Backlog** (Kho yêu cầu toàn diện trích xuất từ SRS).
   * File [**`TRELLO_BACKLOG_PLAN.md`**](file:///d:/ojt-food-deli-start/TRELLO_BACKLOG_PLAN.md) là **Sprint Backlog** chia chi tiết từng Task, phân bổ đích danh cho 6 thành viên trong từng đợt chạy 1 - 2 tuần.

