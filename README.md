# 🍔 Food Thunder Deli (ShopeeFood / GrabFood Clone 4.0)

Hệ thống đặt & giao đồ ăn trực tuyến chuẩn doanh nghiệp theo tài liệu đặc tả [Srs.md](Srs.md).

---

## 🏛️ Kiến trúc Hệ thống Hiện tại (Production Microservices Tech Stack)

| Thành phần | Thư mục chính | Công nghệ sử dụng | Cổng mặc định (Port) |
| :--- | :--- | :--- | :---: |
| **Web Frontend** | [`food-deli-client/`](food-deli-client/) | **React 19**, **TypeScript**, Vite 6, Tailwind CSS, Nginx Reverse Proxy | `80` (hoặc cấu hình tùy ý) |
| **API Gateway** | [`food-deli-service/api-gateway/`](food-deli-service/api-gateway/) | **Spring Cloud Gateway**, JWT Filter, Dynamic Load Balancing (`lb://`) | `8080` |
| **Discovery Service** | [`food-deli-service/discovery-service/`](food-deli-service/discovery-service/) | **Netflix Eureka Server**, Service Registry & Discovery Dashboard | `8761` |
| **Config Server** | [`food-deli-service/config-server/`](food-deli-service/config-server/) | **Spring Cloud Config Server**, Centralized Configuration | `8888` |
| **Auth & User Service** | [`food-deli-service/auth-service/`](food-deli-service/auth-service/) | **Spring Boot 3.3.5**, Spring Security 6 (JWT + BCrypt), JPA | `8081` |
| **Restaurant & Catalog** | [`food-deli-service/restaurant-service/`](food-deli-service/restaurant-service/) | **Spring Boot 3.3.5**, JPA, Hibernate, Catalog, Toppings, Vouchers | `8082` |
| **Cơ sở dữ liệu** | [`database/seed_all.sql`](database/seed_all.sql) | **MySQL 8.0**, Auto-seed schema & sample data, Named Volume | `3306` |

---

## 🚀 Hướng Dẫn Khởi Chạy Toàn Bộ Hệ Thống (Deploy Lên Server)

> 📖 **Xem tài liệu hướng dẫn đầy đủ từ A-Z tại:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) (Bao gồm cài đặt Docker, mở Firewall UFW, tạo Swap RAM, cấu hình .env, sao lưu database và xử lý sự cố).

### Cách 1: Khởi chạy bằng Docker Compose (Khuyên dùng khi đẩy lên Server)

Chỉ cần cài đặt **Docker** & **Docker Compose** trên máy chủ (Linux / Ubuntu / Debian / VPS):

```bash
# 1. Tạo file cấu hình môi trường từ template
cp .env.example .env

# 2. Khởi chạy toàn bộ hệ thống (Frontend + 5 Microservices + MySQL)
docker compose up -d --build
```

#### Các cổng và đường dẫn dịch vụ:
- **Web Frontend (React UI):** `http://<SERVER_IP>` (Cổng 80)
- **API Gateway (Swagger & API):** `http://<SERVER_IP>:8080`
- **Eureka Service Registry Dashboard:** `http://<SERVER_IP>:8761`
- **Spring Cloud Config Server:** `http://<SERVER_IP>:8888`
- **Cơ sở dữ liệu MySQL 8:** `<SERVER_IP>:3306` (Database: `grabfood_db`, tự động nạp `seed_all.sql` vào volume `mysql_data`)

---

### Cách 2: Khởi chạy Trực tiếp trên máy Local (Development)

#### 1. Khởi động Backend (Spring Boot 3.3.5 Microservices)
Khởi động theo thứ tự:
1. `discovery-service` (Port 8761)
2. `config-server` (Port 8888)
3. `api-gateway` (Port 8080)
4. `auth-service` (Port 8081) & `restaurant-service` (Port 8082)

```powershell
cd food-deli-service
.\mvnw.cmd clean package -DskipTests
.\mvnw.cmd -pl discovery-service spring-boot:run
```

#### 2. Khởi động Frontend (React 19 + TypeScript + Vite)
Mở một terminal mới:

```powershell
cd food-deli-client
npm install
npm run dev
```
> Giao diện sẽ hiển thị tại `http://localhost:3000`, tự động kết nối vào API Gateway tại `http://localhost:8080/api/v1`.

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
