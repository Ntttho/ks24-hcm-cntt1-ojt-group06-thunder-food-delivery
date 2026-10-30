# 🚀 Hướng Dẫn Chi Tiết Triển Khai (Deploy) Lên Server Cho Food Thunder Deli

Tài liệu này hướng dẫn chi tiết từng bước (A-Z) để triển khai toàn bộ hệ thống **Food Thunder Deli** (Frontend React 19 + 5 Spring Boot 3 Microservices + MySQL 8.0) lên một máy chủ thực tế (Cloud VPS / Dedicated Server: Ubuntu 22.04 / 24.04 LTS, AWS EC2, DigitalOcean, Google Cloud Compute Engine, Linode, Hetzner, Hostinger,...).

---

## 📑 Mục Lục
1. [Yêu cầu cấu hình máy chủ (System Requirements)](#1-yêu-cầu-cấu-hình-máy-chủ-system-requirements)
2. [Cài đặt môi trường trên Server (Docker & Docker Compose)](#2-cài-đặt-môi-trường-trên-server-docker--docker-compose)
3. [Cấu hình Tường lửa (Firewall / UFW / Security Groups)](#3-cấu-hình-tường-lửa-firewall--ufw--security-groups)
4. [Tối ưu bộ nhớ với Swap RAM (Khắc phục tràn RAM khi build)](#4-tối-ưu-bộ-nhớ-với-swap-ram-khắc-phục-tràn-ram-khi-build)
5. [Tải mã nguồn & Cấu hình Biến môi trường](#5-tải-mã-nguồn--cấu-hình-biến-môi-trường)
6. [Khởi chạy hệ thống bằng Docker Compose](#6-khởi-chạy-hệ-thống-bằng-docker-compose)
7. [Kiểm tra trạng thái & Nhật ký hoạt động (Logs)](#7-kiểm-tra-trạng-thái--nhật-ký-hoạt-động-logs)
8. [Cập nhật mã nguồn khi có phiên bản mới (CI/CD Thủ công)](#8-cập-nhật-mã-nguồn-khi-có-phiên-bản-mới-cicd-thủ-công)
9. [Sao lưu & Phục hồi Cơ sở dữ liệu (Backup & Restore MySQL)](#9-sao-lưu--phục-hồi-cơ-sở-dữ-liệu-backup--restore-mysql)
10. [Xử lý các sự cố thường gặp (Troubleshooting)](#10-xử-lý-các-sự-cố-thường-gặp-troubleshooting)

---

## 1. Yêu cầu cấu hình máy chủ (System Requirements)

Hệ thống bao gồm **7 Containers** chạy đồng thời:
1. `ft-mysql` (MySQL 8.0)
2. `ft-discovery-service` (Eureka Server)
3. `ft-config-server` (Spring Cloud Config Server)
4. `ft-api-gateway` (Spring Cloud Gateway)
5. `ft-auth-service` (Authentication & Profile)
6. `ft-restaurant-service` (Restaurant, Menu, Topping, Voucher)
7. `ft-client` (React 19 + TypeScript + Nginx)

### Cấu hình phần cứng tối thiểu:
- **Hệ điều hành:** Ubuntu 22.04 LTS / 24.04 LTS (hoặc Debian 11/12)
- **CPU:** Tối thiểu 2 vCPU (khuyên dùng 4 vCPU)
- **RAM:**
  - Tối thiểu: **4 GB RAM** (nếu máy 2GB - 4GB RAM, **bắt buộc tạo thêm 4GB Swap RAM** theo [Mục 4](#4-tối-ưu-bộ-nhớ-với-swap-ram-khắc-phục-tràn-ram-khi-build)).
  - Khuyên dùng: **8 GB RAM** để build và chạy đa dịch vụ mượt mà.
- **Ổ cứng (Disk):** Tối thiểu 25 GB SSD trống.

---

## 2. Cài đặt môi trường trên Server (Docker & Docker Compose)

Đăng nhập vào server qua SSH từ terminal máy tính của bạn:
```bash
ssh root@<IP_SERVER_CUA_BAN>
```

### Bước 2.1: Cập nhật hệ điều hành & cài công cụ cơ bản
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw htop ca-certificates gnupg lsb-release
```

### Bước 2.2: Cài đặt Docker Engine & Docker Compose Plugin chính thức
```bash
# Thêm khóa GPG chính thức của Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Cấu hình apt repository của Docker
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker và Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Kiểm tra phiên bản cài đặt thành công
docker --version
docker compose version
```

### Bước 2.3: Phân quyền Docker (Chạy không cần sudo)
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 3. Cấu hình Tường lửa (Firewall / UFW / Security Groups)

Nếu bạn dùng VPS (như AWS EC2, GCP, DigitalOcean), hãy mở các cổng tương ứng trong phần **Inbound Security Groups** của nhà cung cấp, đồng thời cấu hình tường lửa UFW trên server:

```bash
# 1. Cho phép SSH (Bắt buộc để không bị ngắt kết nối SSH)
sudo ufw allow 22/tcp

# 2. Cổng Web Frontend (Nginx Client)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 3. Cổng API Gateway (Nếu cho phép gọi trực tiếp từ Swagger / Mobile App)
sudo ufw allow 8080/tcp

# 4. Cổng Eureka Dashboard (Kiểm tra trạng thái Service Registry)
sudo ufw allow 8761/tcp

# 5. Cổng MySQL (CHỈ MỞ nếu cần kết nối DBeaver / DataGrip từ máy cá nhân)
# Khuyên dùng: Chỉ cho phép IP máy của bạn, ví dụ: sudo ufw allow from <IP_NHA_BAN> to any port 3306 proto tcp
# Hoặc mở toàn bộ (cần đặt password MySQL phức tạp):
sudo ufw allow 3306/tcp

# Bật tường lửa
sudo ufw enable
sudo ufw status verbose
```

---

## 4. Tối ưu bộ nhớ với Swap RAM (Khắc phục tràn RAM khi build)

> [!IMPORTANT]
> Khi chạy lệnh `docker compose up --build` trên server, Docker sẽ biên dịch 5 microservices Java bằng Maven. Quá trình biên dịch cần nhiều RAM đột xuất. Nếu máy chủ của bạn có dưới 8GB RAM, hãy tạo ngay **4GB Swap RAM** để tránh bị hệ điều hành tắt tiến trình (`Out of Memory - OOM Killed`):

```bash
# 1. Kiểm tra trạng thái swap hiện tại
free -h

# 2. Tạo file swap 4GB (nếu chưa có)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. Lưu swap vĩnh viễn sau mỗi lần reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 4. Kiểm tra lại RAM & Swap đã được nhận
free -h
```

---

## 5. Tải mã nguồn & Cấu hình Biến môi trường

### Bước 5.1: Clone repository về thư mục làm việc trên server
```bash
cd /opt
# Hoặc thư mục cá nhân: cd ~

git clone https://github.com/<tai-khoan>/<ten-repo>.git foodthunder
cd foodthunder
```

### Bước 5.2: Tạo file `.env` từ `.env.example`
```bash
cp .env.example .env
```

### Bước 5.3: Chỉnh sửa thông số trong `.env`
Mở file `.env` bằng trình soạn thảo `nano`:
```bash
nano .env
```

Các thông số quan trọng cần lưu ý:
```dotenv
# Port chạy Web UI (Mặc định 80 để vào trực tiếp qua IP máy chủ hoặc tên miền)
CLIENT_PORT=80

# Cổng MySQL (Mặc định 3306)
MYSQL_PORT=3306

# Mật khẩu Root của Database (NÊN THAY ĐỔI khi lên production)
MYSQL_ROOT_PASSWORD=your_strong_password_here
MYSQL_DATABASE=grabfood_db

# Cấu hình API URL cho Frontend:
# - Để '/api/v1' nếu dùng Nginx Reverse Proxy (Khuyên dùng - không lo mở port, không lo CORS)
# - Hoặc 'http://<IP_SERVER_CUA_BAN>:8080/api/v1' nếu muốn gọi thẳng Gateway
VITE_API_BASE_URL=/api/v1

# Mã bí mật JWT (Phải có độ dài tối thiểu 256-bit, giữ bí mật)
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```
> Nhấn `Ctrl + O` $\rightarrow$ `Enter` để lưu, `Ctrl + X` để thoát `nano`.

---

## 6. Khởi chạy hệ thống bằng Docker Compose

Sau khi đã chuẩn bị xong file `.env`, bạn chỉ cần chạy đúng **1 lệnh**:

```bash
docker compose up -d --build
```

### Quá trình Docker Compose tự động thực thi:
1. **Khởi tạo MySQL 8.0:** Mount named volume `ft_mysql_data` để lưu trữ dữ liệu vĩnh viễn, tự động thực thi kịch bản `database/seed_all.sql` để tạo schema và toàn bộ dữ liệu mẫu (users, shops, products, vouchers,...).
2. **Biên dịch Backend Microservices:** Dùng image `maven:3.9.8-eclipse-temurin-21-alpine` để biên dịch các module Java 21 độc lập, sau đó chuyển sang container siêu nhẹ `eclipse-temurin:21-jre-alpine` chạy với quyền `non-root user`.
3. **Biên dịch Frontend:** Dùng Node 20 để `npm ci` và build code React 19 / TypeScript / Tailwind CSS thành thư mục tĩnh `/dist`, sau đó Nginx 1.27 phục vụ với gzip và reverse proxy.
4. **Cơ chế Healthcheck:** Tự động giám sát Eureka $\rightarrow$ Config Server $\rightarrow$ API Gateway $\rightarrow$ Auth/Restaurant Service $\rightarrow$ Client để đảm bảo dịch vụ phụ thuộc chỉ khởi động khi dịch vụ nền tảng đã hoàn toàn sẵn sàng.

---

## 7. Kiểm tra trạng thái & Nhật ký hoạt động (Logs)

### Bước 7.1: Xem danh sách các Container đang chạy
```bash
docker compose ps
```
Bạn sẽ thấy trạng thái `healthy` của các container:
```text
NAME                    IMAGE                         STATUS                    PORTS
ft-mysql                mysql:8.0                     Up (healthy)              0.0.0.0:3306->3306/tcp
ft-discovery-service    foodthunder-discovery-service Up (healthy)              0.0.0.0:8761->8761/tcp
ft-config-server        foodthunder-config-server     Up (healthy)              0.0.0.0:8888->8888/tcp
ft-api-gateway          foodthunder-api-gateway       Up (healthy)              0.0.0.0:8080->8080/tcp
ft-auth-service         foodthunder-auth-service      Up (healthy)              0.0.0.0:8081->8081/tcp
ft-restaurant-service   foodthunder-restaurant-service Up (healthy)              0.0.0.0:8082->8082/tcp
ft-client               foodthunder-food-deli-client  Up                        0.0.0.0:80->80/tcp
```

### Bước 7.2: Xem Log thời gian thực
- **Xem log toàn bộ các service:**
  ```bash
  docker compose logs -f
  ```
- **Xem log của riêng API Gateway:**
  ```bash
  docker compose logs -f api-gateway
  ```
- **Xem log của Auth Service:**
  ```bash
  docker compose logs -f auth-service
  ```
- **Xem log của Nginx Client:**
  ```bash
  docker compose logs -f food-deli-client
  ```
> Nhấn `Ctrl + C` để thoát màn hình xem log.

---

## 8. Cập nhật mã nguồn khi có phiên bản mới (CI/CD Thủ công)

Mỗi khi bạn có code mới đẩy lên Git (`git push`), hãy thực hiện các bước sau trên server để cập nhật không gián đoạn:

```bash
# 1. Di chuyển vào thư mục dự án
cd /opt/foodthunder

# 2. Kéo code mới nhất từ Git về
git pull origin main

# 3. Build lại các container có thay đổi và khởi động ngầm
docker compose up -d --build

# 4. Dọn dẹp các Docker image cũ không dùng đến để giải phóng ổ cứng
docker image prune -f
```

---

## 9. Sao lưu & Phục hồi Cơ sở dữ liệu (Backup & Restore MySQL)

### 9.1. Xuất file sao lưu (Backup / Dump Database)
Lệnh sau sẽ tạo ra file sao lưu `backup_YYYY-MM-DD.sql` ngay trên máy host:
```bash
docker exec -t ft-mysql mysqldump -u root -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) grabfood_db > "backup_$(date +%Y-%m-%d).sql"
```

### 9.2. Phục hồi dữ liệu (Restore Database)
Khi muốn nạp lại dữ liệu từ một file backup:
```bash
docker exec -i ft-mysql mysql -u root -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) grabfood_db < backup_2026-10-29.sql
```

---

## 10. Xử lý các sự cố thường gặp (Troubleshooting)

### Sự cố 1: Báo lỗi `port is already allocated` (Trùng cổng)
- **Nguyên nhân:** Trên server đã cài sẵn Apache/Nginx (chiếm cổng 80) hoặc MySQL local (chiếm cổng 3306).
- **Cách xử lý:**
  - Dừng dịch vụ trùng trên server:
    ```bash
    sudo systemctl stop nginx apache2 mysql
    sudo systemctl disable nginx apache2 mysql
    ```
  - Hoặc đổi port trong file `.env`:
    ```dotenv
    CLIENT_PORT=8088
    MYSQL_PORT=3307
    ```

### Sự cố 2: Quá trình build bị đơ hoặc báo `Killed`
- **Nguyên nhân:** Hết RAM (Out of memory) khi Maven biên dịch.
- **Cách xử lý:** Kiểm tra xem bạn đã tạo Swap RAM theo [Mục 4](#4-tối-ưu-bộ-nhớ-với-swap-ram-khắc-phục-tràn-ram-khi-build) chưa. Chạy lệnh `free -h` để đảm bảo Swap $\ge$ 4GB.

### Sự cố 3: Frontend báo lỗi `Network Error` hoặc không gọi được API
- **Nguyên nhân:** Trình duyệt client không thể kết nối tới API Gateway.
- **Cách xử lý:**
  - Trong file `.env`, đảm bảo giá trị `VITE_API_BASE_URL=/api/v1` để Nginx tự động reverse proxy qua đường dẫn nội bộ Docker.
  - Sau khi sửa `.env`, cần build lại client bằng lệnh:
    ```bash
    docker compose up -d --build food-deli-client
    ```

### Sự cố 4: Muốn xóa sạch toàn bộ hệ thống để nạp lại từ đầu
```bash
# Dừng và xóa toàn bộ container, network và dữ liệu database volume
docker compose down -v

# Khởi chạy lại từ đầu (sẽ tự động nạp seed_all.sql mới)
docker compose up -d --build
```

---

## 🎯 Bảng Tổng Kết Cổng & Endpoint Trên Server

| Dịch vụ | Địa chỉ URL | Chức năng chính |
| :--- | :--- | :--- |
| **Web Frontend (React 19)** | `http://<IP_SERVER>` | Giao diện người dùng đặt món, giỏ hàng, shipper portal, merchant portal |
| **API Gateway** | `http://<IP_SERVER>:8080` | Entry point API duy nhất định tuyến toàn bộ microservices |
| **Eureka Registry** | `http://<IP_SERVER>:8761` | Bảng điều khiển giám sát tình trạng sống của các microservices |
| **Config Server** | `http://<IP_SERVER>:8888` | Quản lý cấu hình tập trung |
| **Auth Service** | `http://<IP_SERVER>:8081` | Đăng ký, đăng nhập JWT, quản lý tài khoản & địa chỉ |
| **Restaurant Service** | `http://<IP_SERVER>:8082` | Quản lý nhà hàng, danh mục món, topping, voucher |
| **MySQL 8.0** | `<IP_SERVER>:3306` | Lưu trữ dữ liệu hệ thống (User `root`) |

