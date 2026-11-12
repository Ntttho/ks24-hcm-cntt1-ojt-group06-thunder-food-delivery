# Food Thunder Deli - Microservices Platform

Welcome to the **Food Thunder Deli** Spring Boot 3 Microservices Platform.

## 🏛️ Infrastructure Components & Ports

| Component | Module Name | Port | Description |
| :--- | :--- | :---: | :--- |
| **API Gateway** | `api-gateway` | `8080` | Unified client entry point, JWT validation & dynamic client-side load balancing (`lb://`) |
| **Discovery Service** | `discovery-service` | `8761` | Netflix Eureka Service Registry & Instance Discovery Dashboard |
| **Config Server** | `config-server` | `8888` | Centralized Spring Cloud Configuration Server (`classpath:/config`) |
| **Auth & User Service** | `auth-service` | `8081` | Authentication (JWT 24h, BCrypt), User Profiles, and Delivery Address Book |
| **Restaurant & Catalog Service** | `restaurant-service` | `8082` | Multi-shop management, menu categories, products, toppings & vouchers |

---
 
## 🚀 Startup Order (Thứ tự khởi chạy)

When running locally in your IDE or via command line, always start services in this sequence:

1. **`discovery-service`** (`http://localhost:8761`): Start first so all subsequent services can register themselves.
2. **`config-server`** (`http://localhost:8888`): Start second to serve centralized configuration properties.
3. **`api-gateway`** (`http://localhost:8080`): Start third to listen for incoming HTTP requests and route via load balancing.
4. **Business Services** (`auth-service`, `restaurant-service`, `order-service`, `delivery-service`, `review-service`, `chat-notification-service`).

---

## ⚡ Dynamic Load Balancing (`lb://`) in API Gateway

API Gateway is configured with `spring-cloud-starter-loadbalancer`. Routes automatically discover service instances registered in Eureka and load-balance client requests across available instances:

- `/api/v1/auth/**`, `/api/v1/users/**` $\rightarrow$ `lb://auth-service`
- `/api/v1/shops/**`, `/api/v1/products/**`, `/api/v1/categories/**`, `/api/v1/vouchers/**` $\rightarrow$ `lb://restaurant-service`
- `/api/v1/orders/**`, `/api/v1/cart/**` $\rightarrow$ `lb://order-service`
- `/api/v1/deliveries/**`, `/api/v1/shippers/**` $\rightarrow$ `lb://delivery-service`
- `/api/v1/reviews/**` $\rightarrow$ `lb://review-service`
- `/api/v1/chat/**`, `/ws/**` $\rightarrow$ `lb://chat-notification-service`

---

## 🛠️ Build & Run Commands

Using the included Maven Wrapper:

```bash
# Build all modules
.\mvnw.cmd clean package -DskipTests

# Run Discovery Service
.\mvnw.cmd -pl discovery-service spring-boot:run

# Run Config Server
.\mvnw.cmd -pl config-server spring-boot:run

# Run API Gateway
.\mvnw.cmd -pl api-gateway spring-boot:run

# Run Auth & User Service
.\mvnw.cmd -pl auth-service spring-boot:run
```

### Chạy qua Docker Compose:

```bash
docker compose up -d --build
```

Lệnh trên build các image từ mã nguồn, khởi chạy database và toàn bộ services. Từ thư mục gốc repository, frontend được mở tại `http://<server-ip>:3001`; API Gateway tại `http://<server-ip>:8080`. Đặt `MYSQL_ROOT_PASSWORD` và `JWT_SECRET` trong file `.env` tại thư mục gốc để thay giá trị mặc định trước khi triển khai public.

---

## 🐬 Hướng Dẫn Sử Dụng DBeaver (Quản lý Database & Import Seed Data)

DBeaver là công cụ giao diện trực quan miễn phí để quản trị MySQL. Dưới đây là các bước kết nối và nạp dữ liệu mẫu cho hệ thống:

### Bước 1: Tạo kết nối mới (New Database Connection)
1. Mở **DBeaver** $\rightarrow$ chọn biểu tượng **New Database Connection** (phím tắt `Ctrl + Shift + N` hoặc menu `Database > New Database Connection...`).
2. Chọn loại cơ sở dữ liệu: **MySQL** $\rightarrow$ nhấn **Next**.

### Bước 2: Điền thông tin kết nối
- **Host:** `localhost`
- **Port:** `3306`
- **Database:** `grabfood_db` *(hoặc để trống nếu chưa tạo)*
- **Username:** `root`
- **Password:** nhập mật khẩu MySQL của bạn (mặc định cấu hình dự án là `123456`).

### Bước 3: Cấu hình Driver Properties (Khắc phục lỗi xác thực MySQL 8)
1. Trong cửa sổ cấu hình kết nối, chuyển sang tab **Driver properties**.
2. Tìm và chỉnh 2 thuộc tính quan trọng:
   - `allowPublicKeyRetrieval` $\rightarrow$ đổi thành `TRUE`.
   - `useSSL` $\rightarrow$ đổi thành `FALSE` (khi chạy môi trường dev local).
3. Bấm nút **Test Connection** ở góc dưới bên trái:
   - Nếu DBeaver yêu cầu tải driver MySQL, nhấn **Download**.
   - Khi hiện thông báo `Connected` màu xanh lá $\rightarrow$ Nhấn **Finish**.

### Bước 4: Thực thi nạp dữ liệu mẫu (`seed_all.sql`)
1. Trên thanh menu DBeaver, chọn **File** $\rightarrow$ **Open File...** (hoặc `Ctrl + O`).
2. Điều hướng đến thư mục dự án và chọn file:
   ```
   d:\ojt-food-deli-start\database\seed_all.sql
   ```
3. File SQL sẽ hiển thị trong trình soạn thảo của DBeaver. Nhấn tổ hợp phím **`Alt + X`** (hoặc bấm biểu tượng **Execute SQL Script** trên thanh công cụ bên trái) để chạy toàn bộ kịch bản.
4. Quá trình chạy sẽ tự động tạo cơ sở dữ liệu `grabfood_db`, toàn bộ bảng và dữ liệu mẫu đầy đủ (users, shops, products, vouchers, categories,...).
5. Sau khi hoàn tất, click chuột phải vào Connection ở cây thư mục bên trái $\rightarrow$ chọn **Refresh** (`F5`) để xem cơ sở dữ liệu `grabfood_db`.
