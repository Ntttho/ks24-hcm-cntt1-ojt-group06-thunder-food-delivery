# 🍔 Food Thunder Deli (ShopeeFood / GrabFood Clone 4.0)

Hệ thống đặt & giao đồ ăn trực tuyến chuẩn doanh nghiệp theo tài liệu đặc tả [Srs.md](file:///d:/ojt-food-deli/Srs.md).

---

## 🏛️ Kiến trúc Hệ thống Hiện tại (Production Tech Stack)

| Thành phần | Thư mục chính | Công nghệ sử dụng | Cổng mặc định (Port) |
| :--- | :--- | :--- | :---: |
| **Backend Chính** | [`grab-food-springboot/`](file:///d:/ojt-food-deli/nhom-17-dam-bao-chat-luong-phan-mem/shoopeFood-clone-main/grab-food-springboot) | **Java 21**, **Spring Boot 3.3.5**, Spring Security 6 (JWT + BCrypt), Spring Data JPA, Hibernate, MySQL 8.0, OpenAPI Swagger | `3000` |
| **Frontend Chính** | [`client/fe-flash-food/`](file:///d:/ojt-food-deli/nhom-17-dam-bao-chat-luong-phan-mem/shoopeFood-clone-main/client/fe-flash-food) | **React 19**, **TypeScript**, Vite 6, Tailwind CSS, Framer Motion, Lucide Icons, Sonner | `5173` |
| **Container & CI/CD** | [`docker-compose.yml`](file:///d:/ojt-food-deli/nhom-17-dam-bao-chat-luong-phan-mem/shoopeFood-clone-main/docker-compose.yml) | Docker Compose 3-Container (MySQL 8 + Spring Boot + Nginx React), GitHub Actions CI | `80` (Web) / `3000` (API) |

> ℹ️ *Ghi chú:* Toàn bộ mã nguồn cũ (`grab-food-monolith` Node.js và `client/fe_fegrapfood`) đã được dọn dẹp và loại bỏ hoàn toàn. Hệ thống chính thức duy nhất hiện tại gồm **`grab-food-springboot`** (Backend) và **`client/fe-flash-food`** (Frontend React TypeScript).

---

## 🚀 Hướng Dẫn Khởi Chạy Toàn Bộ Hệ Thống

### Cách 1: Khởi chạy bằng Docker Compose (Khuyên dùng - 1 lệnh duy nhất)

```bash
docker compose up --build -d
```
- **Web Frontend (Nginx):** `http://localhost` (Port 80)
- **Backend API (Spring Boot):** `http://localhost:3000`
- **Tài liệu API (Swagger UI):** `http://localhost:3000/swagger-ui.html`
- **Cơ sở dữ liệu (MySQL 8):** `localhost:3306` (`grabfood_db`, tự động nạp `seed_all.sql`)

---

### Cách 2: Khởi chạy Trực tiếp trên máy Local

#### 1. Khởi động Backend (Spring Boot 3.3.5)
Đảm bảo MySQL server local đang chạy với mật khẩu cấu hình trong `application.yml` (mặc định `root / 123456`).

```powershell
cd grab-food-springboot
.\mvnw.cmd spring-boot:run
```
> Server sẽ khởi động tại `http://localhost:3000`.

#### 2. Khởi động Frontend (React 19 + TypeScript + Vite)
Mở một terminal mới:

```powershell
cd client/fe-flash-food
npm install
npm run dev
```
> Giao diện sẽ hiển thị tại `http://localhost:5173`, tự động kết nối vào Backend tại `http://localhost:3000/api`.

---

## ✨ Các Tính Năng Giao Diện Nổi Bật (React TypeScript)

1. **Trợ lý Ẩm thực Thông minh (AI Food Assistant):** Widget chat gợi ý món ăn theo ngân sách, sở thích, thêm món vào giỏ hàng trực tiếp.
2. **Kênh Chat Trực Tiếp Khách Hàng - Quán Ăn:** Trò chuyện thời gian thực với chủ quán về ghi chú, đổi món.
3. **Ví Voucher & Mã Giảm Giá:** Lưu, sao chép 1-click mã giảm giá (`GIAM20K`, `FREESHIP`, `FLASH50K`).
4. **Banner Flash Sale Đếm Ngược:** Đồng hồ thời gian thực và danh mục deal giảm sốc.
5. **Sổ Địa Chỉ Giao Hàng:** Quản lý linh hoạt nhiều địa chỉ (Nhà riêng, Văn phòng), đặt mặc định.
6. **Hệ Thống Đánh Giá 5★ & Đặt Lại Đơn (Re-order):** Modal chấm sao, nhận xét chất lượng món & tài xế, xem review thực tế trên trang nhà hàng.
7. **Shipper Web Hub:** 3 Tab chuyên sâu: Nhận cuốc & radar đơn hàng, Ví thu nhập & thống kê cuốc xe, Điểm uy tín & đánh giá từ khách.
8. **Merchant Portal (Multi-shops):** Quản lý nhiều chi nhánh quán ăn, phân loại menu, AI gợi ý ảnh & giá món ăn, thống kê doanh thu.
