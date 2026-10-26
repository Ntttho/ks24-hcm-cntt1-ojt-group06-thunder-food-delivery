# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## DỰ ÁN: FOOD THUNDER DELI

* **Mã dự án:** PRJ-FOOD-THUNDER-DELI-01
* **Tên dự án:** Food Thunder Deli (Nền tảng Đặt & Giao Đồ Ăn Trực Tuyến 4.0)
* **Mô hình kiến trúc:** Web Monolithic (Spring Boot Backend + ReactJS Frontend)
* **Thời gian dự kiến:** 2 - 4 tuần (Theo lộ trình OJT/Sprint tiêu chuẩn)

---

## 1. Tổng quan Dự án (Project Overview)

### 1.1. Mục đích tài liệu
Tài liệu này đặc tả toàn bộ các yêu cầu kỹ thuật, kiến trúc hệ thống, quy trình nghiệp vụ và các yêu cầu chức năng/phi chức năng cho dự án **Food Thunder Deli**. Tài liệu đóng vai trò làm kim chỉ nam phát triển cho toàn bộ đội ngũ lập trình viên (Frontend, Backend, DevOps, QA/Tester) và cơ sở đánh giá nghiệm thu sản phẩm.

### 1.2. Bối cảnh & Giá trị mang lại
Trong kỷ nguyên công nghệ 4.0, nhu cầu số hóa quy trình kinh doanh ăn uống và tối ưu hóa trải nghiệm khách hàng ngày càng trở nên cấp thiết:
* **Đối với Chủ quán (Merchant):** Giúp các chủ cửa hàng, quán ăn truyền thống tiếp cận với công nghệ số hiện đại; cho phép quản lý một hoặc nhiều chi nhánh/quán ăn (Multi-shop), tối ưu thực đơn, món ăn kèm (topping), chương trình khuyến mãi riêng biệt và theo dõi báo cáo doanh thu minh bạch theo thời gian thực.
* **Đối với Khách hàng (User/Customer):** Tiết kiệm thời gian, công sức di chuyển; mang đến trải nghiệm đặt món tiện lợi ngay tại nhà hoặc nơi làm việc tương tự như GrabFood, ShopeeFood, Baemin, hay Xanh SM Food với tính năng tùy chỉnh topping, áp mã giảm giá, theo dõi trạng thái đơn hàng và đánh giá chất lượng.
* **Đối với Tài xế (Shipper):** Cung cấp công cụ tiếp nhận và thực thi đơn hàng trên nền tảng Web Responsive với quy trình giao hàng ảo hóa (Virtual Delivery Workflow) trực quan, theo dõi thu nhập và đánh giá dịch vụ.
* **Đối với Quản trị viên (Admin):** Quản lý tập trung toàn bộ hệ sinh thái (người dùng, quán ăn, dòng tiền, báo cáo doanh số tổng hợp).

### 1.3. Phân chia Nhân sự & Trách nhiệm Module (Đội ngũ 6 thành viên)
Mô hình phát triển: **Full-stack theo Module/Feature Ownership** (mỗi thành viên đảm nhiệm trọn vẹn cả phần Backend REST API và Frontend React cho phân hệ mình phụ trách, phối hợp tích hợp chung vào hệ thống):

* **Member 1 (Team Leader / Full-stack Developer - Module Đặt hàng & Realtime Core):**
  * *Quản lý chung & Kiến trúc:* Điều phối tiến độ, thiết kế cấu trúc CSDL quan hệ tổng thể, chuẩn hóa chuẩn giao tiếp API RESTful, thiết lập khung Spring WebSocket và cấu hình Docker Compose cơ bản.
  * *Phân hệ Giỏ hàng & Đơn hàng & Realtime:*
    * **Backend:** Xây dựng nghiệp vụ Giỏ hàng (ràng buộc 1 quán duy nhất, cảnh báo xóa giỏ khi chuyển quán), xử lý Đặt hàng (Transaction ACID, áp dụng Voucher quán, trừ số lượng tồn), cấu hình WebSocket đẩy sự kiện đơn hàng thời gian thực tới Quán & Shipper.
    * **Frontend:** Xây dựng giao diện Giỏ hàng thông minh, Trang Thanh toán (Checkout), Màn hình Theo dõi đơn hàng thời gian thực (Realtime Order Tracking status bar) cho Khách hàng.

* **Member 2 (Full-stack Developer - Module Quản lý Chủ quán / Merchant Portal):**
  * *Phân hệ Nghiệp vụ Chủ quán (Merchant Management & Menu & Dashboard):*
    * **Backend:** Xây dựng nghiệp vụ Quản lý nhiều quán ăn (**Multi-shops** per merchant), phân cấp Danh mục món ăn, Quản lý Topping phức tạp (cấu hình lựa chọn min/max, giá cộng thêm gắn theo món), Quản lý phát hành Voucher quán; Xử lý truy vấn và tính toán số liệu Dashboard (doanh thu từng quán, doanh thu trung bình, tỷ lệ hoàn tất đơn).
    * **Frontend:** Xây dựng toàn bộ giao diện Merchant Portal: Màn hình chuyển đổi giữa các quán, CRUD Menu/Món ăn & Nhóm Topping, Quản lý Voucher quán, Màn hình Tiếp nhận/Xử lý đơn hàng của Quán (tích hợp chuông báo/WebSocket) và Dashboard biểu đồ doanh thu trực quan (Chart.js/Recharts).

* **Member 3 (Full-stack Developer - Module Tài xế & Giao hàng Ảo hóa / Shipper Hub):**
  * *Phân hệ Tài xế & Quy trình Giao vận (Shipper Web Hub):*
    * **Backend:** API danh sách đơn hàng sẵn sàng nhận giao, API chuyển đổi trạng thái giao hàng ảo hóa (State Machine: Chờ nhận $\rightarrow$ Đã nhận $\rightarrow$ Đã lấy hàng $\rightarrow$ Đang giao $\rightarrow$ Giao thành công / Sự cố), API thống kê thu nhập và lịch sử giao hàng theo ngày/tuần.
    * **Frontend:** Xây dựng giao diện Shipper Web Hub (tối ưu Responsive di động): Màn hình danh sách đơn khả dụng, Màn hình điều hướng ảo hóa quy trình giao hàng từng bước trực quan, Màn hình ví thu nhập và xem điểm đánh giá cá nhân của Shipper.

* **Member 4 (Full-stack Developer - Module Định danh, Bảo mật & Kênh Chat):**
  * *Phân hệ Xác thực & Kết nối (Authentication, Profile & Realtime Chat):*
    * **Backend:** Cấu hình Spring Security 6 + JWT, phân quyền RBAC 5 vai trò (Admin, Merchant, Shipper, Customer, Anonymous), mã hóa BCrypt mật khẩu, API Quản lý hồ sơ cá nhân và Sổ địa chỉ giao hàng; Xây dựng API và WebSocket trung chuyển tin nhắn Chat trực tiếp giữa Khách hàng và Quán ăn.
    * **Frontend:** Giao diện Đăng ký, Đăng nhập, Quên mật khẩu, cơ chế điều hướng trang tương ứng theo từng Role sau đăng nhập; Màn hình Quản lý thông tin tài khoản, Sổ địa chỉ giao hàng của User; Hộp thoại Chat Realtime nổi giữa Khách hàng và Quán.

* **Member 5 (Full-stack Developer - Module Quản trị Hệ thống / Admin Portal):**
  * *Phân hệ Quản trị Hệ thống (Admin Portal & Master Data):*
    * **Backend:** Các API Quản trị tiêu chuẩn: Quản lý danh mục ẩm thực hệ thống (Master Categories), Quản lý danh sách người dùng toàn sàn (tìm kiếm, phân trang, khóa/mở khóa tài khoản), API phê duyệt yêu cầu mở quán của Merchant; API thống kê tổng quan sàn (tổng user, tổng quán, tổng đơn).
    * **Frontend:** Xây dựng giao diện Admin Portal: Bảng điều khiển quản lý người dùng, Danh sách kiểm duyệt quán ăn mới, Màn hình CRUD danh mục món ăn hệ thống, Admin Dashboard hiển thị các thẻ KPI tổng quan.
    * *Đảm bảo chất lượng:* Phối hợp viết tài liệu đặc tả API Swagger/OpenAPI và chuẩn bị kịch bản kiểm thử (Test cases).

* **Member 6 (Full-stack Developer - Module Tra cứu, Khách vãng lai & Đánh giá):**
  * *Phân hệ Khách vãng lai, Trang chủ & Đánh giá (Catalog Browsing & Reviews):*
    * **Backend:** API danh sách quán ăn đang mở cửa, API tìm kiếm món ăn/quán ăn theo từ khóa và bộ lọc danh mục ẩm thực, API xem chi tiết quán & thực đơn; API tạo và hiển thị Đánh giá / Bình luận (Review món ăn và Shipper sau khi đơn hoàn tất), API xem lịch sử mua hàng cá nhân của User.
    * **Frontend:** Giao diện Trang chủ (Banner, Danh mục ẩm thực nổi bật, Quán ăn thịnh hành), Thanh tìm kiếm & bộ lọc món ăn cho Anonymous/Customer, Trang chi tiết quán ăn hiển thị món & menu, Khối hiển thị đánh giá của khách hàng, Form chấm sao và gửi nhận xét đơn hàng.
    * *Đảm bảo chất lượng:* Phối hợp thực hiện kiểm thử chức năng End-to-End (E2E Testing) các luồng mua hàng và ghi nhận bug.

---

## 2. Phân quyền & Vai trò người dùng (User Roles)

Hệ thống phân định rõ ràng 5 nhóm đối tượng người dùng:

| Vai trò (Role) | Mô tả & Trách nhiệm chính |
| :--- | :--- |
| **ANONYMOUS** *(Khách vãng lai)* | Khách chưa đăng nhập vào hệ thống. Được phép tra cứu quán ăn, duyệt menu món ăn, thêm món/topping vào giỏ hàng tạm (Client-side), xem bình luận/đánh giá trước khi quyết định đăng nhập/đăng ký để thanh toán. |
| **CUSTOMER / USER** *(Khách hàng)* | Đăng ký, đăng nhập tài khoản; quản lý thông tin cá nhân, sổ địa chỉ nhận hàng; tùy chọn món & topping; đặt hàng và thanh toán (COD / Chuyển khoản giả lập); theo dõi trạng thái đơn hàng thời gian thực; xem lịch sử mua; chat/liên hệ với quán; đánh giá món ăn và shipper. |
| **MERCHANT** *(Đối tác Quán ăn)* | Một tài khoản Merchant có thể sở hữu và quản lý **nhiều quán ăn/chi nhánh (Multi-shop)**; quản lý danh mục thực đơn, danh sách món ăn, nhóm topping đính kèm; cấu hình mã giảm giá (Voucher) riêng cho từng quán; tiếp nhận, duyệt hoặc từ chối đơn hàng; chat với khách; quản lý đánh giá/phản hồi; xem báo cáo Dashboard từng quán và thống kê trung bình/tổng tất cả các quán. |
| **SHIPPER** *(Tài xế giao hàng)* | Giao diện Web Responsive tối ưu thiết bị di động (không cần native app); xem danh sách đơn hàng khả dụng chờ nhận; nhận đơn và thực thi **Quy trình giao hàng ảo hóa (Virtual Delivery Workflow)**; quản lý lịch sử đơn đã giao, thống kê thu nhập và xem đánh giá xếp hạng từ khách hàng. |
| **ADMIN** *(Quản trị viên hệ thống)* | Quản lý toàn bộ tài khoản người dùng và phân quyền trong hệ thống; phê duyệt quán ăn/merchant đăng ký mới; khóa/mở tài khoản vi phạm; quản lý danh mục ẩm thực hệ thống; xem Dashboard báo cáo tổng quan toàn sàn (tổng doanh thu, lượng đơn, phí hoa hồng sàn). |

---

## 3. Kiến trúc & Yêu cầu Kỹ thuật (Technical Specifications)

### 3.1. Sơ đồ Tech Stack
* **Kiến trúc:** Web Monolithic / Modular Monolith (Dễ triển khai, dễ kiểm soát transaction và quản lý dữ liệu tập trung, không phân tách microservices phức tạp).
* **Backend:** Java 17+, **Spring Boot 3.x**
  * *Spring Security 6* + *JSON Web Token (JWT)* để xác thực và phân quyền RBAC.
  * *Spring Data JPA (Hibernate)* tương tác cơ sở dữ liệu quan hệ.
  * *Spring WebSocket (STOMP / SockJS)* cho tính năng cập nhật trạng thái đơn hàng realtime và live chat.
  * *MapStruct / Lombok* tối ưu code DTO, Entity.
  * *Swagger / OpenAPI 3.0* tự động sinh tài liệu API.
* **Database:** **MySQL 8.0** (Hỗ trợ Transaction ACID, Indexing tối ưu truy vấn tìm kiếm món/quán).
* **Frontend:** **ReactJS (Vite)**
  * *Ngôn ngữ / CSS:* JavaScript / TypeScript + Tailwind CSS (hoặc Shadcn UI / Ant Design).
  * *Quản lý State:* Zustand / Redux Toolkit (kết hợp LocalStorage cho giỏ hàng của Anonymous).
  * *Giao tiếp API:* Axios + React Query (TanStack Query) hỗ trợ caching và đồng bộ state server.
  * *Biểu đồ Dashboard:* Chart.js / Recharts.
  * *Realtime Client:* StompJS / SockJS-client.
* **DevOps & Môi trường:**
  * *Docker & Docker Compose:* Đóng gói 3 container (MySQL Service, Spring Boot Backend Service, ReactJS Nginx Frontend Service).
  * *CI/CD:* GitHub Actions tự động kiểm tra build, test và build Docker Image khi push code lên nhánh chính (`main`/`dev`).

### 3.2. Cấu hình Docker & Docker Compose
* **MySQL Service:** Khởi tạo DB `food_thunder_deli_db`, cấu hình UTF8MB4, thiết lập volumes lưu trữ dữ liệu an toàn.
* **Backend Service:** Build thông qua Dockerfile sử dụng Gradle/Maven + OpenJDK 17. Expose port `8080`.
* **Frontend Service:** Multi-stage build (Node.js build production static files -> Nginx alpine phục vụ static assets và reverse proxy API). Expose port `3000` hoặc `80`.

---

## 4. Đặc tả Yêu cầu Chức năng (Functional Requirements - FR)

### 4.1. Phân hệ Xác thực & Quản lý Người dùng (Authentication & RBAC)
* **FR-01 (Đăng ký tài khoản):** Cho phép người dùng đăng ký tài khoản Khách hàng (Customer), Quán ăn (Merchant) hoặc Tài xế (Shipper) bằng Email, Số điện thoại và Mật khẩu. Mật khẩu được mã hóa an toàn bằng BCrypt.
* **FR-02 (Đăng nhập & Cấp phát JWT):** Xác thực thông tin đăng nhập, trả về Access Token JWT có kèm vai trò (Role). Hỗ trợ cơ chế phân trang điều hướng sau đăng nhập tương ứng với từng Role (Admin -> Admin Dashboard, Merchant -> Merchant Portal, Shipper -> Shipper Delivery Hub, Customer -> Trang chủ đặt đồ ăn).
* **FR-03 (Hồ sơ cá nhân & Sổ địa chỉ):** Cho phép người dùng cập nhật thông tin cá nhân, ảnh đại diện, đổi mật khẩu và quản lý danh sách địa chỉ giao hàng (địa chỉ mặc định, văn phòng, nhà riêng).

---

### 4.2. Phân hệ Khách vãng lai & Khách hàng (Anonymous & Customer)
* **FR-04 (Tra cứu & Tìm kiếm quán/món ăn):**
  * Cho phép cả Anonymous và Customer xem danh sách quán ăn đang mở cửa, lọc theo danh mục ẩm thực (Cơm, Bún/Phở, Trà sữa, Fastfood, Đồ ăn vặt...).
  * Tìm kiếm theo từ khóa tên món ăn, tên quán ăn hoặc địa chỉ.
* **FR-05 (Xem chi tiết Quán & Thực đơn):** Hiển thị đầy đủ thông tin quán (tên, địa chỉ, giờ mở/đóng cửa, đánh giá sao trung bình), danh mục món ăn, hình ảnh, giá gốc, giá khuyến mại và danh sách topping kèm theo từng món.
* **FR-06 (Quản lý Giỏ hàng):**
  * Cho phép thêm món kèm lựa chọn Topping (ví dụ: Trà sữa chọn Size L, 50% đường, 50% đá, thêm Trân châu đen).
  * Hỗ trợ lưu trữ giỏ hàng tại Client (LocalStorage) cho Anonymous và đồng bộ khi đăng nhập.
  * Cơ chế kiểm soát giỏ hàng thông minh: Một giỏ hàng tại một thời điểm chỉ thuộc về **một quán ăn duy nhất**. Nếu khách chọn món của quán khác, hệ thống sẽ đưa ra cảnh báo xác nhận xóa giỏ cũ để tạo giỏ mới.
* **FR-07 (Đặt hàng & Áp dụng Voucher):**
  * Khách hàng chọn địa chỉ nhận hàng, ghi chú cho tài xế/quán (ví dụ: "Không lấy hành", "Bấm chuông khi tới").
  * Nhập hoặc chọn mã giảm giá (Voucher) do chính quán ăn phát hành.
  * Lựa chọn phương thức thanh toán: COD (Tiền mặt khi nhận hàng) hoặc Thanh toán trực tuyến giả lập (Simulated Online Banking / Ví điện tử).
  * Bấm đặt hàng: Hệ thống ghi nhận đơn, trừ lượt sử dụng voucher và gửi thông báo đơn mới tới Merchant.
* **FR-08 (Theo dõi đơn hàng Realtime):** Khách hàng theo dõi tiến trình đơn hàng theo thời gian thực (Chờ quán nhận -> Quán đang chuẩn bị -> Shipper đã nhận đơn & đang đến quán -> Shipper đang giao -> Đã giao thành công).
* **FR-09 (Lịch sử đơn hàng):** Xem danh sách các đơn đã đặt, chi tiết từng đơn hàng, trạng thái, và nút "Đặt lại" (Re-order) nhanh chóng.
* **FR-10 (Đánh giá & Bình luận):** Sau khi đơn hoàn thành, khách hàng có thể chấm điểm (1 - 5 sao) và để lại nhận xét:
  * Đánh giá món ăn của Quán (chất lượng, hương vị, đóng gói).
  * Đánh giá Shipper (thái độ, tốc độ giao hàng).
* **FR-11 (Liên hệ & Chat với Quán):** Khách hàng có thể gửi tin nhắn trao đổi trực tiếp với quán ăn về tình trạng món hoặc yêu cầu đặc biệt.

---

### 4.3. Phân hệ Chủ quán (Merchant Portal)
* **FR-12 (Quản lý đa quán ăn - Multi-shops):**
  * Một tài khoản Merchant có thể tạo và quản lý nhiều quán/chi nhánh ăn uống.
  * Thêm mới, chỉnh sửa thông tin quán: Tên quán, Logo, Ảnh bìa, Địa chỉ, Số điện thoại, Giờ mở/đóng cửa, Trạng thái hoạt động (Đang mở / Tạm nghỉ).
* **FR-13 (Quản lý Thực đơn & Món ăn):**
  * Tạo các nhóm thực đơn (Menu Category) theo từng quán.
  * Thêm/sửa/xóa món ăn: Tên món, Hình ảnh, Mô tả, Giá tiền, Trạng thái (Còn hàng / Tạm hết hàng).
* **FR-14 (Quản lý Nhóm Topping & Tùy chọn đi kèm):**
  * Tạo các nhóm topping (ví dụ: "Topping thêm", "Mức đường", "Mức đá").
  * Cấu hình số lượng chọn tối thiểu/tối đa và giá cộng thêm của từng topping.
  * Gắn nhóm topping vào một hoặc nhiều món ăn cụ thể.
* **FR-15 (Quản lý Voucher & Mã giảm giá theo từng quán):**
  * Tạo mã voucher áp dụng riêng cho từng quán (Giảm theo %, giảm số tiền cố định, giá trị đơn hàng tối thiểu, ngày bắt đầu - kết thúc, giới hạn lượt dùng).
  * Kích hoạt hoặc vô hiệu hóa voucher.
* **FR-16 (Xử lý Đơn hàng):**
  * Nhận thông báo âm thanh / popup khi có đơn hàng mới theo thời gian thực (WebSocket).
  * Xem chi tiết món, topping, ghi chú khách hàng.
  * Cập nhật trạng thái đơn: Tiếp nhận -> Đang nấu -> Sẵn sàng bàn giao cho Shipper.
* **FR-17 (Quản lý Đánh giá & Phản hồi Khách hàng):** Xem toàn bộ bình luận, số sao khách đánh giá cho từng quán và viết phản hồi công khai của quán đến khách hàng.
* **FR-18 (Liên hệ Khách hàng):** Kênh chat nội bộ kết nối trực tiếp với khách đang có đơn tại quán để giải quyết các vấn đề phát sinh (hết món, xin đổi món...).
* **FR-19 (Dashboard Báo cáo & Thống kê đa quán):**
  * Thống kê chi tiết theo từng quán: Doanh thu theo ngày/tuần/tháng, số lượng đơn hoàn thành/đơn hủy, món bán chạy nhất.
  * Thống kê tổng hợp: Tổng doanh thu toàn bộ các quán, doanh thu trung bình mỗi quán, biểu đồ tăng trưởng.

---

### 4.4. Phân hệ Tài xế & Giao hàng ảo hóa (Shipper Web Hub)
* **FR-20 (Bảng đơn hàng chờ nhận):** Hiển thị danh sách các đơn hàng đã được quán nấu xong đang cần shipper nhận giao (gồm địa chỉ quán, địa chỉ khách, phí ship dự kiến).
* **FR-21 (Quy trình Giao hàng Ảo hóa - Virtual Delivery Workflow):**
  * Do không sử dụng ứng dụng di động native/GPS phần cứng, hệ thống xây dựng giao diện điều hướng ảo hóa trực quan cho Shipper trên nền Web:
    1. **Bấm "Nhận đơn" (Accept Order):** Đơn chuyển sang trạng thái đã có tài xế tiếp nhận.
    2. **Bấm "Đã đến quán & Lấy món" (Picked Up):** Tài xế xác nhận đã kiểm tra đủ món/topping từ quán.
    3. **Bấm "Đang trên đường giao" (Delivering):** Giao diện mô phỏng tiến trình giao (Hiển thị thời gian ước tính, trạng thái di chuyển giả lập).
    4. **Bấm "Xác nhận giao thành công" (Delivered):** Thu tiền COD (nếu có) và hoàn tất đơn hàng.
    5. **Trường hợp phát sinh sự cố:** Bấm "Hủy đơn/Giao thất bại" và chọn lý do (Không liên lạc được khách, khách hủy...).
* **FR-22 (Lịch sử giao hàng & Thống kê thu nhập):** Shipper theo dõi danh sách các đơn đã hoàn thành, tổng số tiền phí giao hàng thu được theo ngày/tuần.
* **FR-23 (Xem Đánh giá cá nhân):** Xem điểm uy tín, số sao trung bình và phản hồi từ các khách hàng đã từng nhận đơn.

---

### 4.5. Phân hệ Quản trị viên Hệ thống (System Admin)
* **FR-24 (Quản lý Người dùng):** Xem danh sách tất cả tài khoản (Customer, Merchant, Shipper). Hỗ trợ tìm kiếm, phân trang và khóa/mở khóa tài khoản khi có vi phạm.
* **FR-25 (Kiểm duyệt & Quản lý Quán ăn):** Phê duyệt hoặc từ chối yêu cầu mở quán mới từ Merchant; quản lý danh sách toàn bộ các quán trong hệ thống.
* **FR-26 (Quản lý Danh mục Ẩm thực Hệ thống):** Quản lý các thể loại món ăn chính (Cơm, Đồ uống, Đồ ăn nhanh, Món chay...) hiển thị trên thanh điều hướng trang chủ.
* **FR-27 (Admin Global Dashboard):** Báo cáo số liệu toàn hệ thống: Tổng số lượng người dùng mới, tổng số quán đang hoạt động, tổng số đơn hàng đã hoàn tất, tổng giá trị giao dịch (GMV) và biểu đồ phân bổ doanh thu.

---

## 5. Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)

### 5.1. Hiệu năng & Khả năng mở rộng (Performance & Scalability)
* **NFR-01 (Tốc độ phản hồi API):** Các API tìm kiếm món, danh sách quán ăn, tải thực đơn và giỏ hàng phải phản hồi dưới **400ms** trong điều kiện mạng bình thường.
* **NFR-02 (Thời gian tải trang Frontend):** Sử dụng Vite tối ưu đóng gói mã nguồn, thời gian tải trang đầu tiên (First Contentful Paint) đạt dưới **1.5 giây**.
* **NFR-03 (Xử lý đồng thời):** Kiến trúc Spring Boot kết hợp kết nối HikariCP Pool đảm bảo hệ thống chịu tải tối thiểu **100 yêu cầu đồng thời (concurrent requests)** ổn định không gây rò rỉ bộ nhớ (Memory Leak).
* **NFR-04 (Realtime Event Delivery):** Thông báo trạng thái đơn hàng qua WebSocket phải đến client của Merchant/Customer/Shipper trong vòng **1 giây** kể từ khi sự kiện phát sinh.

### 5.2. Bảo mật & An toàn dữ liệu (Security)
* **NFR-05 (Mã hóa mật khẩu):** 100% mật khẩu được băm bằng thuật toán **BCrypt** với salt ngẫu nhiên, tuyệt đối không lưu plaintext.
* **NFR-06 (Bảo vệ API & Token):** Xác thực định danh thông qua Bearer JWT. Token có thời hạn sử dụng (TTL) hợp lý; kiểm tra chặt chẽ quyền hạn (Role-Based Authorization) ở tầng Controller bằng `@PreAuthorize`.
* **NFR-07 (CORS & Chống tấn công cơ bản):** Cấu hình CORS an toàn chỉ cho phép Frontend Domain gọi tài nguyên; áp dụng Validation đầu vào (Spring Bean Validation `@Valid`) để chống SQL Injection và XSS.
* **NFR-08 (Toàn vẹn Transaction):** Nghiệp vụ đặt hàng, trừ voucher, thay đổi trạng thái đơn phải được bọc trong `@Transactional` để tránh sai lệch dữ liệu tài chính hoặc số lượng tồn kho.

### 5.3. Khả năng bảo trì & Tiêu chuẩn mã nguồn (Maintainability & Clean Code)
* **NFR-09 (Container hóa chuẩn mực):** Toàn bộ dự án (Database, Backend, Frontend Nginx) có file `docker-compose.yml` khởi chạy với 1 câu lệnh duy nhất (`docker compose up --build`).
* **NFR-10 (Tự động hóa CI/CD):** Cấu hình GitHub Actions tự động kiểm tra biên dịch mã nguồn (Build Backend Gradle/Maven + Frontend Vite build) trên mỗi pull request hoặc push vào nhánh chính.
* **NFR-11 (Quy chuẩn đặt tên & Ghi log):** Tuân thủ CamelCase cho Java/JS, snake_case cho CSDL. Backend tích hợp SLF4J / Logback ghi nhận vết lỗi và luồng giao dịch đơn hàng.

### 5.4. Trải nghiệm người dùng (UI/UX & Khả năng tương thích)
* **NFR-12 (Responsive Design):** Giao diện tương thích mượt mà trên Desktop, Tablet và đặc biệt là Mobile Web (phục vụ tối ưu cho màn hình Shipper và Customer đặt món trên điện thoại).
* **NFR-13 (Tính thân thiện & Tốc độ):** Bố cục hiện đại, màu sắc bắt mắt (phong cách ấm áp kích thích vị giác - vàng cam/đỏ kết hợp đen sang trọng), có thông báo toast, modal xác nhận hành động nguy hiểm và trạng thái loading trực quan.

---

## 6. Sơ đồ Thực thể Dữ liệu Chính (Core Data Entities)

Hệ thống quản lý dữ liệu tập trung thông qua các bảng quan hệ chính sau:

```
[Users] 1 --- * [Shops] (quán ăn thuộc merchant)
[Shops] 1 --- * [MenuCategories] 1 --- * [Products] (món ăn)
[Products] * --- * [Toppings] (thông qua bảng ProductToppings)
[Shops] 1 --- * [Vouchers] (mã giảm giá quán)
[Users] 1 --- * [Orders] (khách đặt)
[Shops] 1 --- * [Orders] (quán nhận)
[Users (Shipper)] 1 --- * [Orders] (shipper giao)
[Orders] 1 --- * [OrderItems] 1 --- * [OrderItemToppings]
[Orders] 1 --- 1 [Reviews] (đánh giá món & shipper)
[Users] 1 --- * [ChatMessages] * --- 1 [Shops]
```

---

## 7. Tiêu chí Đánh giá & Nghiệm thu (Grading / Acceptance Criteria)

| Hạng mục | Trọng số | Tiêu chí chi tiết |
| :--- | :---: | :--- |
| **Yêu cầu Chức năng (Functional)** | **60%** | • Hoàn thành đầy đủ các luồng chính cho 5 nhóm vai trò (Anonymous, Customer, Merchant, Shipper, Admin).<br>• Luồng nghiệp vụ từ: Tìm món $\rightarrow$ Thêm Topping $\rightarrow$ Đặt đơn $\rightarrow$ Quán nhận đơn $\rightarrow$ Shipper thực thi giao hàng ảo hóa $\rightarrow$ Đánh giá chạy thông suốt.<br>• Quản lý Merchant đa quán (Multi-shops) và Dashboard báo cáo doanh thu hoạt động chuẩn xác.<br>• Phân quyền JWT bảo mật đúng vai trò, không xảy ra xung đột quyền hạn. |
| **Yêu cầu Kỹ thuật & Phi chức năng** | **40%** | • Kiến trúc Monolith Spring Boot + ReactJS sạch sẽ, chuẩn Layered Architecture (Controller - Service - Repository - Entity).<br>• Hệ thống chạy mượt mà thông qua Docker Compose (1 lệnh dựng toàn bộ DB, Backend, Frontend).<br>• Tích hợp WebSocket cập nhật đơn hàng realtime.<br>• Pipeline GitHub Actions hoạt động tốt (Auto build & test).<br>• Giao diện Web Responsive, đẹp mắt, đạt chuẩn UI/UX hiện đại. |
| **Tổng điểm** | **100%** | **Đạt chuẩn nghiệm thu dự án hoàn thiện** |
