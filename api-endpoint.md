# 📘 TÀI LIỆU ĐẶC TẢ CHI TIẾT API ENDPOINTS (FOOD THUNDER DELI)

> **Dự án:** Food Thunder Deli — Spring Boot 3 Microservices Platform  
> **Phiên bản tài liệu:** 1.0.0  
> **API Gateway Entry Point:** `http://localhost:8080`  
> **Chuẩn định dạng:** RESTful JSON & WebSocket STOMP  

---

## 📑 MỤC LỤC
1. [Quy chuẩn chung (General Conventions)](#1-quy-chuẩn-chung)
   - [Base URL & Cổng kết nối](#11-base-url--cổng-kết-nối)
   - [Định danh & Xác thực (JWT Bearer Token)](#12-định-danh--xác-thực-jwt-bearer-token)
   - [Cấu trúc phản hồi đồng nhất (Unified ApiResponse)](#13-cấu-trúc-phản-hồi-đồng-nhất-unified-apiresponse)
   - [Bảng mã phản hồi HTTP (Status Codes)](#14-bảng-mã-phản-hồi-http-status-codes)
2. [Phân hệ 1: Xác thực & Hồ sơ cá nhân (Auth & User Profile)](#phân-hệ-1-xác-thực--hồ-sơ-cá-nhân)
3. [Phân hệ 2: Quản trị người dùng (User Management)](#phân-hệ-2-quản-trị-người-dùng)
4. [Phân hệ 3: Sổ địa chỉ người dùng (User Addresses)](#phân-hệ-3-sổ-địa-chỉ-người-dùng)
5. [Phân hệ 4: Quán ăn & Gian hàng (Restaurants / Shops)](#phân-hệ-4-quán-ăn--gian-hàng)
6. [Phân hệ 5: Danh mục ẩm thực (Menu Categories)](#phân-hệ-5-danh-mục-ẩm-thực)
7. [Phân hệ 6: Món ăn & Thực đơn (Foods / Products)](#phân-hệ-6-món-ăn--thực-đơn)
8. [Phân hệ 7: Nhóm Topping & Món kèm (Toppings)](#phân-hệ-7-nhóm-topping--món-kèm)
9. [Phân hệ 8: Đơn hàng & Tiến trình giao (Orders & Tracking)](#phân-hệ-8-đơn-hàng--tiến-trình-giao)
10. [Phân hệ 9: Tài xế & Giao hàng ảo hóa (Drivers / Shippers)](#phân-hệ-9-tài-xế--giao-hàng-ảo-hóa)
11. [Phân hệ 10: Đơn xin gia nhập (Driver & Merchant Applications)](#phân-hệ-10-đơn-xin-gia-nhập)
12. [Phân hệ 11: Thanh toán (Payments)](#phân-hệ-11-thanh-toán)
13. [Phân hệ 12: Khuyến mãi & Mã giảm giá (Vouchers)](#phân-hệ-12-khuyến-mãi--mã-giảm-giá)
14. [Phân hệ 13: Đánh giá & Phản hồi (Reviews & Ratings)](#phân-hệ-13-đánh-giá--phản-hồi)
15. [Phân hệ 14: Trò chuyện & Thông báo Realtime (Chat & WebSocket)](#phân-hệ-14-trò-chuyện--thông-báo-realtime)
16. [Phân hệ 15: Cấu hình & Quản trị Hệ thống (Admin Management)](#phân-hệ-15-cấu-hình--quản-trị-hệ-thống)

---

## 1. QUY CHUẨN CHUNG

### 1.1. Base URL & Cổng kết nối
Mọi yêu cầu từ ứng dụng Frontend (ReactJS / Mobile Web) bắt buộc đi qua **Spring Cloud API Gateway**:
* **Gateway Base URL:** `http://localhost:8080/api/v1` (hoặc `/api` với các endpoint tương thích).
* **Load Balancing Scheme:** `lb://<service-name>` điều hướng tự động tới các instances của microservice được quản lý bởi Eureka Registry.

### 1.2. Định danh & Xác thực (JWT Bearer Token)
Đối với tất cả các API được bảo vệ (yêu cầu đăng nhập), Client phải truyền kèm HTTP Header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```
Hệ thống hỗ trợ 5 vai trò (Roles) trong phân quyền RBAC:
* `ROLE_ANONYMOUS`: Khách vãng lai chưa đăng nhập.
* `ROLE_CUSTOMER` (hoặc `ROLE_USER`): Khách hàng đặt món.
* `ROLE_MERCHANT`: Chủ quán ăn / đối tác kinh doanh (Multi-shops).
* `ROLE_DRIVER` (hoặc `ROLE_SHIPPER`): Tài xế nhận cuốc giao hàng.
* `ROLE_ADMIN`: Quản trị viên hệ thống toàn quyền.

### 1.3. Cấu trúc phản hồi đồng nhất (Unified ApiResponse)
Mọi phản hồi từ Backend đều tuân thủ cấu trúc Generic Record:
```json
{
  "status": 200,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-10-24T05:15:30.123Z"
}
```

### 1.4. Bảng mã phản hồi HTTP (Status Codes)
* `200 OK`: Truy vấn hoặc xử lý thành công.
* `201 Created`: Tạo mới bản ghi thành công (Đăng ký, Đặt hàng, Tạo món...).
* `400 Bad Request`: Dữ liệu gửi lên sai định dạng, vi phạm ràng buộc `@Valid`.
* `401 Unauthorized`: Chưa đăng nhập hoặc Token JWT hết hạn / không hợp lệ.
* `403 Forbidden`: Không đủ quyền truy cập tài nguyên (Role không khớp).
* `404 Not Found`: Không tìm thấy bản ghi theo ID / tiêu chí yêu cầu.
* `409 Conflict`: Xung đột dữ liệu (Số điện thoại đã tồn tại, mã voucher trùng...).
* `500 Internal Server Error`: Lỗi phát sinh từ phía server.

---

## PHÂN HỆ 1: XÁC THỰC & HỒ SƠ CÁ NHÂN

### 1.1. Đăng nhập tài khoản
* **Endpoint:** `POST /api/v1/auth/login`
* **Quyền hạn:** `Public`
* **Mô tả:** Đăng nhập hệ thống bằng SĐT và mật khẩu, trả về thông tin user và JWT Access Token (đồng thời đặt Set-Cookie HttpOnly).
* **Request Body:**
```json
{
  "phone": "0987654321",
  "password": "Password@123",
  "role": "CUSTOMER"
}
```
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Logged in",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "fullName": "Nguyễn Văn A",
      "phone": "0987654321",
      "ratingAvg": 4.9,
      "roles": ["CUSTOMER"],
      "role": "CUSTOMER",
      "createdAt": "2026-10-20T10:00:00"
    }
  },
  "timestamp": "2026-10-24T05:15:30.123Z"
}
```

### 1.2. Đăng ký tài khoản
* **Endpoint:** `POST /api/v1/auth/register`
* **Quyền hạn:** `Public`
* **Mô tả:** Đăng ký tài khoản người dùng mới. Mật khẩu được mã hóa an toàn bằng BCrypt.
* **Request Body:**
```json
{
  "fullName": "Trần Thị B",
  "phone": "0912345678",
  "password": "SecurePassword@123"
}
```
* **Response (200 OK / 201 Created):**
```json
{
  "status": 200,
  "message": "Registered",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 2,
      "fullName": "Trần Thị B",
      "phone": "0912345678",
      "roles": ["CUSTOMER"],
      "role": "CUSTOMER",
      "createdAt": "2026-10-24T05:16:00"
    }
  },
  "timestamp": "2026-10-24T05:16:00.123Z"
}
```

### 1.3. Lấy thông tin tài khoản hiện tại
* **Endpoint:** `GET /api/v1/auth/me`
* **Quyền hạn:** `Authenticated` (Yêu cầu Header Authorization Bearer)
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "phone": "0987654321",
    "ratingAvg": 5.0,
    "roles": ["CUSTOMER", "MERCHANT"],
    "role": "MERCHANT",
    "createdAt": "2026-10-20T10:00:00"
  },
  "timestamp": "2026-10-24T05:16:30.123Z"
}
```

### 1.4. Cập nhật hồ sơ cá nhân
* **Endpoint:** `PUT /api/v1/auth/profile`
* **Quyền hạn:** `Authenticated`
* **Request Body:**
```json
{
  "fullName": "Nguyễn Văn A (Cập nhật)"
}
```
* **Response (200 OK):** Trả về đối tượng `AuthUserDto` đã cập nhật.

### 1.5. Đổi mật khẩu
* **Endpoint:** `PUT /api/v1/auth/password`
* **Quyền hạn:** `Authenticated`
* **Request Body:**
```json
{
  "currentPassword": "Password@123",
  "newPassword": "NewSecurePassword@456"
}
```
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Password updated successfully",
  "data": null,
  "timestamp": "2026-10-24T05:17:00.123Z"
}
```

### 1.6. Kích hoạt / Đổi vai trò hoạt động
* **Endpoint:** `POST /api/v1/auth/activate-role`
* **Quyền hạn:** `Authenticated`
* **Request Body:**
```json
{
  "role": "DRIVER"
}
```

### 1.7. Quên mật khẩu & Đặt lại bằng OTP
* **Bước 1:** `POST /api/v1/auth/forgot-password`
  * Body: `{"phone": "0987654321"}`
  * Trả về thông báo: `"OTP sent to your phone"`
* **Bước 2:** `POST /api/v1/auth/reset-password`
  * Body: `{"phone": "0987654321", "otp": "123456", "newPassword": "ResetPassword@789"}`
  * Trả về thông báo: `"Password reset successfully"`

### 1.8. Đăng xuất
* **Endpoint:** `POST /api/v1/auth/logout`
* **Quyền hạn:** `Authenticated`
* **Mô tả:** Xóa cookie JWT trên trình duyệt và ghi nhận hủy phiên.

---

## PHÂN HỆ 2: QUẢN TRỊ NGƯỜI DÙNG

### 2.1. Lấy thông tin cá nhân
* **Endpoint:** `GET /api/v1/users/me`
* **Quyền hạn:** `Authenticated`

### 2.2. Danh sách đối tác Merchant
* **Endpoint:** `GET /api/v1/users/merchants`
* **Quyền hạn:** `ROLE_ADMIN`
* **Response (200 OK):** Trả về danh sách `List<AuthUserDto>`.

### 2.3. Tạo mới tài khoản Merchant (Dành cho Admin)
* **Endpoint:** `POST /api/v1/users/merchants`
* **Quyền hạn:** `ROLE_ADMIN`
* **Request Body:**
```json
{
  "fullName": "Chủ Quán Phở Thìn",
  "phone": "0901234567",
  "password": "Password@123"
}
```

### 2.4. Quản lý danh sách người dùng toàn hệ thống
* **Endpoint:** `GET /api/v1/users` (Quyền: `ROLE_ADMIN`) — Xem danh sách người dùng.
* **Endpoint:** `GET /api/v1/users/{id}` (Quyền: `ROLE_ADMIN`) — Xem chi tiết người dùng theo ID.
* **Endpoint:** `POST /api/v1/users` (Quyền: `ROLE_ADMIN`) — Tạo người dùng bất kỳ.
* **Endpoint:** `PUT /api/v1/users/{id}` (Quyền: `ROLE_ADMIN`) — Cập nhật thông tin/quyền hạn.
* **Endpoint:** `DELETE /api/v1/users/{id}` (Quyền: `ROLE_ADMIN`) — Xóa người dùng.

---

## PHÂN HỆ 3: SỔ ĐỊA CHỈ NGƯỜI DÙNG

### 3.1. Tìm kiếm & Gợi ý địa chỉ (Location Suggestion)
* **Endpoint:** `GET /api/v1/addresses/suggest?query=Ha+Noi`
* **Quyền hạn:** `Public`
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "placeId": "ChIJb_v1Zg...",
      "description": "Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội"
    }
  ]
}
```

### 3.2. Tra cứu chi tiết địa chỉ & Tọa độ
* **Endpoint:** `GET /api/v1/addresses/detail/{placeId}`
* **Quyền hạn:** `Public`
* **Endpoint:** `GET /api/v1/addresses/reverse?lat=21.007&lng=105.843` (Geocoding ngược từ tọa độ ra tên đường).

### 3.3. Quản lý Sổ địa chỉ cá nhân của Khách hàng
* **Endpoint:** `GET /api/v1/addresses/mine` (Quyền: `Authenticated`) — Danh sách địa chỉ đã lưu.
* **Endpoint:** `POST /api/v1/addresses/mine` (Quyền: `Authenticated`) — Thêm mới địa chỉ:
```json
{
  "address": "Phòng 802, Toà nhà Landmark 72, Cầu Giấy, Hà Nội",
  "latitude": 21.0169,
  "longitude": 105.7839,
  "isDefault": true,
  "label": "Văn phòng"
}
```
* **Endpoint:** `PUT /api/v1/addresses/mine/{id}` (Quyền: `Authenticated`) — Cập nhật địa chỉ.
* **Endpoint:** `DELETE /api/v1/addresses/mine/{id}` (Quyền: `Authenticated`) — Xóa địa chỉ.

---

## PHÂN HỆ 4: QUÁN ĂN & GIAN HÀNG

### 4.1. Danh sách quán ăn công khai
* **Endpoint:** `GET /api/v1/restaurants`
* **Quyền hạn:** `Public`
* **Mô tả:** Danh sách các quán ăn đang mở cửa phục vụ người dùng.
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": 10,
      "ownerId": 3,
      "ownerName": "Trần Quán",
      "name": "Trà Sữa Gong Cha - Cầu Giấy",
      "address": "123 Đường Cầu Giấy, Hà Nội",
      "latitude": 21.0333,
      "longitude": 105.7950,
      "openingTime": "08:00:00",
      "closingTime": "22:30:00",
      "isOpen": true,
      "isOpenToday": true,
      "imageUrl": "https://cdn.foodthunder.com/shops/gongcha.jpg",
      "ratingAvg": 4.8,
      "approvalStatus": "APPROVED"
    }
  ]
}
```

### 4.2. Danh sách quán ăn của tôi (Chủ quán Multi-shops)
* **Endpoint:** `GET /api/v1/restaurants/mine`
* **Quyền hạn:** `ROLE_MERCHANT`, `ROLE_ADMIN`
* **Mô tả:** Trả về tất cả các chi nhánh/quán ăn do tài khoản hiện tại sở hữu.

### 4.3. Tạo mới quán ăn
* **Endpoint:** `POST /api/v1/restaurants`
* **Quyền hạn:** `ROLE_MERCHANT`, `ROLE_ADMIN`
* **Request Body:**
```json
{
  "name": "Cơm Gà Xối Mỡ Hoàng Cúc",
  "address": "45 Hoàng Cúc, Quy Nhơn",
  "latitude": 13.7628,
  "longitude": 109.2285,
  "openingTime": "09:00:00",
  "closingTime": "21:00:00",
  "imageUrl": "https://cdn.foodthunder.com/shops/comga.jpg"
}
```

### 4.4. Xem chi tiết quán ăn & thực đơn
* **Endpoint:** `GET /api/v1/restaurants/{id}`
* **Quyền hạn:** `Public`
* **Response (200 OK):** Thông tin quán ăn kèm mảng các `categories` và món ăn bên trong.

### 4.5. Cập nhật thông tin & Trạng thái hoạt động
* **Endpoint:** `PUT /api/v1/restaurants/{id}` (Quyền: `ROLE_MERCHANT`, `ROLE_ADMIN`)
* **Endpoint:** `PATCH /api/v1/restaurants/{id}/status`
  * Body: `{"isOpen": true, "temporaryClosedReason": "Nghỉ lễ"}`
* **Endpoint:** `PATCH /api/v1/restaurants/{id}/today-status`
* **Endpoint:** `PATCH /api/v1/restaurants/{id}/location`
  * Body: `{"latitude": 21.0334, "longitude": 105.7951}`

### 4.6. Kiểm duyệt quán ăn (Admin Portal)
* **Endpoint:** `GET /api/v1/restaurants/admin/pending` (Quyền: `ROLE_ADMIN`) — Danh sách quán mới nộp đơn.
* **Endpoint:** `PATCH /api/v1/restaurants/admin/{id}/approve` (Quyền: `ROLE_ADMIN`) — Phê duyệt quán lên sàn.
* **Endpoint:** `PATCH /api/v1/restaurants/admin/{id}/reject` (Quyền: `ROLE_ADMIN`)
  * Body: `{"reason": "Ảnh giấy phép kinh doanh mờ"}`
* **Endpoint:** `GET /api/v1/restaurants/admin/change-requests` — Danh sách yêu cầu đổi tên/địa chỉ.
* **Endpoint:** `PATCH /api/v1/restaurants/admin/change-requests/{id}/approve`
* **Endpoint:** `PATCH /api/v1/restaurants/admin/change-requests/{id}/reject`

---

## PHÂN HỆ 5: DANH MỤC ẨM THỰC

### 5.1. Lấy danh sách danh mục
* **Endpoint:** `GET /api/v1/categories?restaurantId=10`
* **Quyền hạn:** `Public`
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "restaurantId": 10,
      "name": "Trà Sữa Truyền Thống",
      "displayOrder": 1
    },
    {
      "id": 2,
      "restaurantId": 10,
      "name": "Trà Trái Cây Thanh Nhiệt",
      "displayOrder": 2
    }
  ]
}
```

### 5.2. Quản lý danh mục (CRUD)
* **Endpoint:** `GET /api/v1/categories/{id}` (Quyền: `Public`)
* **Endpoint:** `POST /api/v1/categories` (Quyền: `ROLE_MERCHANT`, `ROLE_ADMIN`)
  * Body: `{"restaurantId": 10, "name": "Cà Phê & Đá Xay", "displayOrder": 3}`
* **Endpoint:** `PUT /api/v1/categories/{id}` (Quyền: `ROLE_MERCHANT`, `ROLE_ADMIN`)
* **Endpoint:** `DELETE /api/v1/categories/{id}` (Quyền: `ROLE_MERCHANT`, `ROLE_ADMIN`)

---

## PHÂN HỆ 6: MÓN ĂN & THỰC ĐƠN

### 6.1. Danh sách món ăn
* **Endpoint:** `GET /api/v1/foods?categoryId=1&restaurantId=10`
* **Quyền hạn:** `Public`
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": 101,
      "restaurantId": 10,
      "categoryId": 1,
      "name": "Trà Sữa Ô Long Nướng",
      "description": "Hương vị trà rang thơm nồng, béo ngậy ngọt ngào",
      "price": 45000,
      "imageUrl": "https://cdn.foodthunder.com/foods/olong.jpg",
      "isAvailable": true
    }
  ]
}
```

### 6.2. Xem chi tiết món ăn
* **Endpoint:** `GET /api/v1/foods/{id}`
* **Quyền hạn:** `Public`

### 6.3. Thêm mới món ăn vào thực đơn
* **Endpoint:** `POST /api/v1/foods`
* **Quyền hạn:** `ROLE_MERCHANT`, `ROLE_ADMIN`
* **Request Body:**
```json
{
  "restaurantId": 10,
  "categoryId": 1,
  "name": "Trà Xanh Kem Phô Mai (Macchiato)",
  "description": "Trà xanh lài thanh mát hòa quyện lớp kem cheese béo mịn",
  "price": 52000,
  "imageUrl": "https://cdn.foodthunder.com/foods/matcha-cheese.jpg"
}
```

### 6.4. Chỉnh sửa & Xóa món ăn
* **Endpoint:** `PUT /api/v1/foods/{id}` (Quyền: `ROLE_MERCHANT`, `ROLE_ADMIN`)
* **Endpoint:** `DELETE /api/v1/foods/{id}` (Quyền: `ROLE_MERCHANT`, `ROLE_ADMIN`)

---

## PHÂN HỆ 7: NHÓM TOPPING & MÓN KÈM

### 7.1. Danh sách Topping của Quán ăn
* **Endpoint:** `GET /api/v1/restaurants/{id}/toppings`
* **Quyền hạn:** `Public`
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Trân Châu Đen Hoàng Kim",
      "price": 10000,
      "restaurantId": 10
    },
    {
      "id": 2,
      "name": "Pudding Trứng",
      "price": 12000,
      "restaurantId": 10
    }
  ]
}
```

### 7.2. Tạo nhóm Topping mới
* **Endpoint:** `POST /api/v1/restaurants/{id}/toppings`
* **Quyền hạn:** `ROLE_MERCHANT`, `ROLE_ADMIN`
* **Request Body:**
```json
{
  "name": "Thạch Trái Cây Nhiệt Đới",
  "price": 8000
}
```

### 7.3. Gán Topping vào món ăn cụ thể
* **Endpoint:** `GET /api/v1/foods/{id}/toppings` (Quyền: `Public`) — Xem topping có thể chọn của món ăn.
* **Endpoint:** `POST /api/v1/foods/{id}/toppings` (Quyền: `ROLE_MERCHANT`, `ROLE_ADMIN`)
  * Body: `{"toppingId": 1}`
* **Endpoint:** `PUT /api/v1/toppings/{id}` & `DELETE /api/v1/toppings/{id}` (Cập nhật / Xóa topping).

---

## PHÂN HỆ 8: ĐƠN HÀNG & TIẾN TRÌNH GIAO

### 8.1. Đặt hàng (Checkout)
* **Endpoint:** `POST /api/v1/orders` (hoặc `/api/v1/orders/secure`)
* **Quyền hạn:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Mô tả:** Tạo đơn hàng mới trong ACID Transaction: kiểm tra tồn kho, áp dụng voucher, tính toán phí giao hàng và gửi tín hiệu WebSocket tới Quán.
* **Request Body:**
```json
{
  "restaurantId": 10,
  "voucherId": 5,
  "receiverAddress": "Tầng 5, Keangnam Tower, Phạm Hùng, Hà Nội",
  "receiverLat": 21.0173,
  "receiverLng": 105.7842,
  "distanceKm": 3.2,
  "shippingType": "STANDARD",
  "idempotencyKey": "req-uuid-12345678",
  "items": [
    {
      "foodId": 101,
      "quantity": 2,
      "toppings": [
        { "id": 1, "quantity": 1 }
      ]
    }
  ]
}
```
* **Response (200 OK / 201 Created):**
```json
{
  "status": 200,
  "message": "Order placed successfully",
  "data": {
    "id": 5001,
    "orderCode": "FTD-20261024-5001",
    "customerId": 1,
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0987654321",
    "restaurantId": 10,
    "restaurantName": "Trà Sữa Gong Cha - Cầu Giấy",
    "subtotalAmount": 110000,
    "taxAmount": 0,
    "shippingFee": 16000,
    "discountAmount": 20000,
    "totalAmount": 106000,
    "statusCode": "PENDING",
    "statusLabel": "Chờ quán xác nhận",
    "receiverAddress": "Tầng 5, Keangnam Tower, Phạm Hùng, Hà Nội",
    "items": [
      {
        "id": 901,
        "foodId": 101,
        "foodName": "Trà Sữa Ô Long Nướng",
        "quantity": 2,
        "priceAtOrder": 45000,
        "toppings": [
          { "id": 11, "toppingId": 1, "toppingName": "Trân Châu Đen", "quantity": 1, "price": 10000 }
        ]
      }
    ],
    "createdAt": "2026-10-24T05:20:00"
  }
}
```

### 8.2. Danh sách đơn hàng
* **Endpoint:** `GET /api/v1/orders?status=PENDING&restaurantId=10`
* **Quyền hạn:** `Authenticated`
* **Tham số Query:** `status`, `restaurantId`, `driverId`, `customerId`.

### 8.3. Xem chi tiết & Theo dõi Realtime
* **Endpoint:** `GET /api/v1/orders/{id}` — Chi tiết đơn hàng.
* **Endpoint:** `GET /api/v1/orders/{id}/tracking` — Thông tin tiến trình và tọa độ tài xế thời gian thực.

### 8.4. Các thao tác chuyển đổi trạng thái đơn hàng (Order State Machine)
* **Tài xế nhận đơn:** `POST /api/v1/orders/{id}/accept` (Quyền: `ROLE_DRIVER`, `ROLE_ADMIN`)
* **Tài xế từ chối lượt gọi đơn:** `POST /api/v1/orders/{id}/reject-offer` (Quyền: `ROLE_DRIVER`, `ROLE_ADMIN`)
  * Body: `{"reason": "Khoảng cách nhận quán quá xa"}`
* **Tài xế hủy đơn sau khi nhận:** `POST /api/v1/orders/{id}/driver-cancel`
  * Body: `{"reason": "Xe thủng săm"}`
* **Khách hàng hủy đơn:** `POST /api/v1/orders/{id}/cancel` (Quyền: `ROLE_CUSTOMER`, `ROLE_ADMIN`)
  * Body: `{"reason": "Đặt nhầm địa chỉ"}`
* **Quán từ chối đơn:** `PATCH /api/v1/orders/{id}/reject` (Quyền: `ROLE_MERCHANT`, `ROLE_ADMIN`)
  * Body: `{"reason": "Hết nguyên liệu trà ô long"}`
* **Cập nhật trạng thái tiến trình đơn:** `PUT /api/v1/orders/{id}/status`
  * Body: `{"statusCode": "DELIVERED", "status": "COMPLETED", "reason": "Giao thành công"}`

---

## PHÂN HỆ 9: TÀI XẾ & GIAO HÀNG ẢO HÓA

### 9.1. Nguồn cấp đơn hàng chờ giao (Order Feed)
* **Endpoint:** `GET /api/v1/drivers/me/orders`
* **Quyền hạn:** `ROLE_DRIVER`, `ROLE_ADMIN`
* **Mô tả:** Danh sách các đơn hàng đã được quán nấu xong, đang tìm tài xế giao.

### 9.2. Chỉ số hiệu suất & Thu nhập tài xế
* **Endpoint:** `GET /api/v1/drivers/me/metrics`
* **Quyền hạn:** `ROLE_DRIVER`, `ROLE_ADMIN`
* **Response (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "totalOrders": 128,
    "completedOrders": 125,
    "cancelledOrders": 3,
    "completionRate": 97.65,
    "totalEarnings": 3450000,
    "ratingAvg": 4.95
  }
}
```

### 9.3. Bật/Tắt trạng thái nhận đơn (Online / Offline)
* **Endpoint:** `PUT /api/v1/drivers/{id}/online`
  * Body: `{"isOnline": true}`
* **Endpoint:** `PUT /api/v1/drivers/{id}/online/on` — Chuyển sang Online.
* **Endpoint:** `PUT /api/v1/drivers/{id}/online/off` — Chuyển sang Offline.

### 9.4. Cập nhật vị trí di chuyển ảo hóa
* **Endpoint:** `POST /api/v1/drivers/{id}/location`
* **Quyền hạn:** `ROLE_DRIVER`
* **Request Body:**
```json
{
  "latitude": 21.0255,
  "longitude": 105.7912,
  "heading": 85.0,
  "speedKmh": 32.5,
  "orderId": 5001
}
```

### 9.5. Xem vị trí tài xế mới nhất
* **Endpoint:** `GET /api/v1/drivers/{id}/location`
* **Quyền hạn:** `Authenticated`

---

## PHÂN HỆ 10: ĐƠN XIN GIA NHẬP

### 10.1. Kiểm tra trạng thái nộp hồ sơ của tôi
* **Endpoint:** `GET /api/v1/applications/my-status`
* **Quyền hạn:** `Authenticated`

### 10.2. Nộp đơn đăng ký làm Tài xế (Driver Application)
* **Endpoint:** `POST /api/v1/applications/driver`
* **Quyền hạn:** `Authenticated`
* **Request Body:**
```json
{
  "licensePlate": "29B1-999.88",
  "vehicleType": "HONDA_WAVE",
  "idCardNumber": "001201004567"
}
```

### 10.3. Nộp đơn đăng ký mở Quán ăn (Merchant Application)
* **Endpoint:** `POST /api/v1/applications/merchant`
* **Quyền hạn:** `Authenticated`
* **Request Body:**
```json
{
  "businessLicense": "GPKD-HN-998811",
  "taxCode": "0109988776"
}
```

### 10.4. Quản trị viên duyệt hồ sơ tài xế
* **Endpoint:** `GET /api/v1/applications/drivers/pending` (Quyền: `ROLE_ADMIN`)
* **Endpoint:** `PATCH /api/v1/applications/drivers/{userId}/approve` (Quyền: `ROLE_ADMIN`)
* **Endpoint:** `PATCH /api/v1/applications/drivers/{userId}/reject` (Quyền: `ROLE_ADMIN`)

---

## PHÂN HỆ 11: THANH TOÁN

### 11.1. Tạo phiên thanh toán
* **Endpoint:** `POST /api/v1/payments/create`
* **Quyền hạn:** `Authenticated`
* **Request Body:**
```json
{
  "orderId": 5001,
  "paymentMethod": "MOMO_WALLET",
  "amount": 106000,
  "idempotencyKey": "pay-uuid-8888"
}
```

### 11.2. Webhook Callback từ cổng thanh toán
* **Endpoint:** `POST /api/v1/payments/callback`
* **Quyền hạn:** `Public`
* **Request Body:**
```json
{
  "orderId": 5001,
  "transactionRef": "TXN_MOMO_998877",
  "status": "SUCCESS",
  "gatewayResponse": "Giao dịch thành công"
}
```

### 11.3. Xem trạng thái thanh toán theo đơn
* **Endpoint:** `GET /api/v1/payments/{orderId}`
* **Quyền hạn:** `Authenticated`

---

## PHÂN HỆ 12: KHUYẾN MÃI & MÃ GIẢM GIÁ

### 12.1. Kiểm tra & Áp dụng Voucher
* **Endpoint:** `POST /api/v1/vouchers/validate`
* **Quyền hạn:** `Authenticated`
* **Request Body:**
```json
{
  "code": "THUNDER20K",
  "orderAmount": 110000,
  "restaurantId": 10
}
```
* **Response (200 OK):** Trả về thông tin voucher và số tiền giảm trừ thực tế.

---

## PHÂN HỆ 13: ĐÁNH GIÁ & PHẢN HỒI

### 13.1. Gửi đánh giá sau đơn hàng
* **Endpoint:** `POST /api/v1/reviews`
* **Quyền hạn:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Request Body:**
```json
{
  "orderId": 5001,
  "targetType": "RESTAURANT",
  "targetId": 10,
  "rating": 5,
  "comment": "Trà sữa đậm vị, trân châu dẻo thơm, đóng gói cẩn thận 10/10!"
}
```

### 13.2. Xem đánh giá & Tóm tắt sao của quán
* **Endpoint:** `GET /api/v1/reviews/restaurants/summary?restaurantId=10`
* **Endpoint:** `GET /api/v1/reviews/restaurants/{restaurantId}` (Danh sách bình luận).

---

## PHÂN HỆ 14: TRÒ CHUYỆN & THÔNG BÁO REALTIME

### 14.1. Gửi tin nhắn qua REST API
* **Endpoint:** `POST /api/v1/chat/messages`
* **Quyền hạn:** `Authenticated`
* **Request Body:**
```json
{
  "shopId": 10,
  "orderId": 5001,
  "message": "Quán cho mình xin thêm 1 bộ ống hút to nhé ạ!",
  "receiverId": 3
}
```

### 14.2. Xem lịch sử tin nhắn
* **Endpoint:** `GET /api/v1/chat/restaurants/{shopId}?orderId=5001`
* **Endpoint:** `GET /api/v1/chat/orders/{orderId}`

### 14.3. WebSocket Endpoint & Đăng ký kênh (STOMP Topics)
* **WebSocket Handshake URL:** `ws://localhost:8080/ws`
* **Đăng ký nhận cập nhật đơn hàng:** `/topic/orders/{orderId}`
* **Đăng ký nhận tin nhắn chat:** `/topic/chat/restaurants/{shopId}`
* **Nhận thông báo riêng tư:** `/user/queue/notifications`

---

## PHÂN HỆ 15: CẤU HÌNH & QUẢN TRỊ HỆ THỐNG

### 15.1. Quản lý Voucher toàn sàn (Admin)
* `GET /api/v1/admin/vouchers` — Danh sách voucher.
* `GET /api/v1/admin/vouchers/{id}` — Chi tiết voucher.
* `POST /api/v1/admin/vouchers` — Tạo voucher:
```json
{
  "code": "FREESHIP50K",
  "discountAmount": 50000,
  "minOrderValue": 150000,
  "expiryDate": "2026-12-31T23:59:59",
  "isActive": true
}
```
* `PUT /api/v1/admin/vouchers/{id}` & `DELETE /api/v1/admin/vouchers/{id}`.

### 15.2. Quản lý Tham số Hệ thống (System Settings)
* `GET /api/v1/admin/settings` — Danh sách cấu hình.
* `POST /api/v1/admin/settings` — Tạo tham số cấu hình:
```json
{
  "configKey": "DEFAULT_COMMISSION_PERCENT",
  "configValue": "15",
  "description": "Tỷ lệ hoa hồng sàn thu trên mỗi đơn hàng (%)"
}
```
* `PUT /api/v1/admin/settings/{id}` — Cập nhật cấu hình.
* `DELETE /api/v1/admin/settings/{id}` — Xóa cấu hình.
