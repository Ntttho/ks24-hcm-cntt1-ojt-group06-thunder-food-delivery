# 📋 BÁO CÁO TỔNG KẾT & ĐÁNH GIÁ KỸ THUẬT SPRINT 1
## DỰ ÁN: THUNDER FOOD DELIVERY (SPRING BOOT MICROSERVICES + REACT 19 CLIENT)

> **Giai đoạn:** Sprint 1 - Nền tảng Core MVP & Xác thực tập trung  
> **Thời gian đánh giá:** 31/10/2026  
> **Đội ngũ phát triển (6 thành viên):** Thọ (Leader), Duy, Quang anh, Nhựt, Thịnh, Đức  
> **Tài liệu căn cứ:** [`ignore/báo cáo sprint 1.txt`](file:///d:/ojt-food-deli-start/ignore/báo%20cáo%20sprint%201.txt), [`TRELLO_BACKLOG_PLAN.md`](file:///d:/ojt-food-deli-start/TRELLO_BACKLOG_PLAN.md), kiểm tra mã nguồn thực tế tại `food-deli-client/` và `food-deli-service/`.

---

## 📑 MỤC LỤC
1. [Tổng Quan Kết Quả Story Points Sprint 1](#1-tổng-quan-kết-quả-story-points-sprint-1)
2. [Báo Cáo Thẩm Tra & Kiểm Định Mã Nguồn Thực Tế (Source Code Audit)](#2-báo-cáo-thẩm-tra--kiểm-định-mã-nguồn-thực-tế-source-code-audit)
3. [Bảng Phân Tích Lỗi Tồn Đọng Chi Tiết (Issue & Bug Matrix)](#3-bảng-phân-tích-lỗi-tồn-đọng-chi-tiết-issue--bug-matrix)
4. [Đánh Giá Tiến Độ & Hiệu Suất Từng Thành Viên](#4-đánh-giá-tiến-độ--hiệu-suất-từng-thành-viên)
5. [Kế Hoạch Khắc Phục Dứt Điểm Đầu Sprint 2](#5-kế-hoạch-khắc-phục-dứt-điểm-đầu-sprint-2)

---

## 1. Tổng Quan Kết Quả Story Points Sprint 1

| Chỉ số đánh giá | Giá trị | Tỷ lệ (%) | Đánh giá chung |
| :--- | :---: | :---: | :--- |
| **Tổng Story Points cam kết** | **42 SP** | 100% | Đặt mục tiêu dựng xong Core MVP |
| **Story Points đã hoàn thành (Done)** | **42 SP** | **100%** | Toàn bộ 9/9 thẻ công việc đều đã được đánh dấu hoàn thành (Pass) về mặt tiến độ |
| **Story Points chưa hoàn thành (Carry-over)** | **0 SP** | **0%** | Không có thẻ nào bị hủy hay bỏ dở |
| **Số lượng Bug & Nợ kỹ thuật tiềm ẩn tồn đọng** | **6 vấn đề lớn** | - | Nghiệm thu thực tế cho thấy còn nhiều lỗi UI và luồng dữ liệu cần làm mịn ngay đầu Sprint 2 |

### Bảng đối soát chi tiết từng thẻ công việc:
| Mã Thẻ | Nội dung công việc | Phụ trách | Điểm SP | Trạng thái báo cáo | Đánh giá nghiệm thu thực tế |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1.1** | Khởi tạo Microservice Hub, Eureka, Config Server & API Gateway | **Thọ** | 5 | ✅ **Hoàn thành** | Eureka (8761), Gateway (8080), Config (8888) chạy ổn định qua Docker. |
| **1.2** | Backend `auth-service`: Đăng ký, đăng nhập JWT, mã hóa BCrypt | **Thọ** | 5 | ✅ **Hoàn thành** | Đăng nhập theo số điện thoại/email, cấp token JWT 24h, phân quyền role. |
| **1.3** | Backend `restaurant-service`: Entity, CRUD cơ bản Quán ăn & Món ăn | **Quang anh** | 5 | ✅ **Hoàn thành** | Entity Shop, Category, Product, Topping và Seed database 26 bảng thành công. |
| **1.4** | Backend `order-service`: Giỏ hàng, Checkout & Order State Machine | **Duy** | 5 | ✅ **Hoàn thành xuất sắc** | **Duy hoàn thành hoàn hảo!** Dựng xong lõi `order-service`, Entity Order/OrderItem và State Machine. |
| **1.5** | Frontend Client: Form Login/Register & Lưu trữ Token Redux | **Nhựt** | 5 | ✅ **Hoàn thành** | Giao diện Auth tập trung chạy tốt, kết nối API Gateway, lưu trữ token an toàn. |
| **1.6** | Frontend Client: Trang chủ, Danh sách quán & Bộ lọc tìm kiếm | **Thịnh** | 4 | ✅ **Hoàn thành (Châm chước)** | **Miễn cưỡng chấp nhận hoàn thành:** Đã nộp file `HomePage.tsx`. Dù còn dùng mock data và thiếu bộ lọc, nhưng Thịnh đã hứa quyết tâm cải thiện ở Sprint 2 nên nhóm châm chước ghi nhận hoàn thành. |
| **1.7** | Frontend Client: Giỏ hàng Redux & Trang thanh toán Checkout | **Đức** | 5 | ✅ **Hoàn thành** | Giao diện Cart & Checkout dựng đẹp mắt, modal địa chỉ đầy đủ (logic nối API chuyển sang Sprint 2). |
| **1.8** | Frontend Merchant: Màn hình nhận đơn hàng cho chủ quán | **Quang anh** | 5 | ✅ **Hoàn thành (Bản MVP)** | Hoàn thành giao diện tiếp nhận đơn cơ bản (các tính năng realtime WebSocket đẩy sang Sprint 2). |
| **1.9** | Tích hợp kiểm thử luồng nền tảng & Review Sprint 1 | **Thọ** | 3 | ✅ **Hoàn thành** | Họp Sprint Review, rà soát toàn bộ source code và lên kế hoạch xử lý bug cho Sprint 2. |

---

## 2. Báo Cáo Thẩm Tra & Kiểm Định Mã Nguồn Thực Tế (Source Code Audit)

Sau khi rà soát trực tiếp toàn bộ source code của dự án, mặc dù 100% thẻ đều được ghi nhận hoàn thành về mặt tiến độ đầu việc, **hệ thống vẫn còn tồn tại 6 vấn đề kỹ thuật và lỗi tiềm ẩn (Technical Debt)** cần đội ngũ tập trung sửa dứt điểm ngay đầu Sprint 2:

### 🔍 Vấn đề 1: Giao diện Trang chủ (Home) còn thô và hardcode dữ liệu mẫu
* **Hiện trạng trong file:** [`food-deli-client/src/pages/public/home/HomePage.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/public/home/HomePage.tsx#L15-L65)
* **Bằng chứng mã nguồn:**
  ```typescript
  // Mock featured foods for demonstration of base setup
  const FEATURED_ITEMS = [
    { id: 'item-1', productId: 101, productName: 'Cơm Gà Xối Mỡ Giòn Cay', price: 45000, ... },
    { id: 'item-2', productId: 102, productName: 'Trà Sữa Trân Châu Đường Đen', price: 35000, ... },
    { id: 'item-3', productId: 103, productName: 'Bún Bò Huế Đặc Biệt', price: 55000, ... },
    { id: 'item-4', productId: 104, productName: 'Burger Bò Phô Mai Chảy', price: 69000, ... },
  ];
  ```
* **Đánh giá:** Trang chủ mới render tĩnh 4 món ăn mẫu. Giao diện card còn sơ sài, chưa đạt chuẩn UI/UX hiện đại của ShopeeFood/GrabFood. Cần gọi API `/api/v1/restaurants` thật từ backend `restaurant-service`.

---

### 🔍 Vấn đề 2: Trang chủ chưa có bộ lọc (Category Filter) và Tìm kiếm chưa hoạt động
* **Hiện trạng trong file:** [`food-deli-client/src/pages/public/home/HomePage.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/public/home/HomePage.tsx#L69-L115)
* **Bằng chứng mã nguồn:**
  - Ô tìm kiếm `<Input.Search value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />` chỉ lưu state `searchTerm` cục bộ nhưng **chưa áp dụng logic lọc mảng**. Bấm tìm kiếm chưa lọc được món ăn.
  - Hoàn toàn **thiếu thanh cuộn danh mục ẩm thực (Categories)**: Cơm, Bún/Phở, Trà sữa, Ăn vặt, Đồ chay,...

---

### 🔍 Vấn đề 3: Chưa gọi API chi tiết Quán ăn & Món ăn (Missing Restaurant Detail Page)
* **Hiện trạng:**
  - File Service [`food-deli-client/src/services/modules/restaurantApi.ts`](file:///d:/ojt-food-deli-start/food-deli-client/src/services/modules/restaurantApi.ts) đã viết sẵn `restaurantApi.getAll()` và `restaurantApi.getById(id)`.
  - **Nhưng:** Trong Router [`src/routes/index.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/routes/index.tsx), **chưa khai báo tuyến đường `/restaurants/:id`**.
  - Chưa có màn hình xem thực đơn đầy đủ của từng quán và modal chọn Topping/Size đi kèm món ăn.

---

### 🔍 Vấn đề 4: Giỏ hàng (Cart) lưu dữ liệu ở LocalStorage & Hardcode danh sách tĩnh
* **Hiện trạng trong file:** [`food-deli-client/src/store/slices/cartSlice.ts`](file:///d:/ojt-food-deli-start/food-deli-client/src/store/slices/cartSlice.ts#L25) và [`food-deli-client/src/pages/user/CartPage.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/user/CartPage.tsx#L14-L40)
* **Bằng chứng mã nguồn:**
  - `cartSlice.ts`:
    ```typescript
    const savedCart = storage.get<CartState>(STORAGE_KEYS.CART);
    storage.set(STORAGE_KEYS.CART, state);
    ```
  - Trong `CartPage.tsx`: Danh sách món trong giỏ hàng đang dùng mảng tĩnh `INITIAL_CART_ITEMS` chứ chưa đồng bộ 100% với dữ liệu người dùng vừa chọn từ trang chủ/quán ăn.

---

### 🔍 Vấn đề 5: LỖI NGHIÊM TRỌNG - Bấm thanh toán khi chưa đăng nhập KHÔNG chuyển hướng sang Login
* **Hiện trạng trong file:** [`food-deli-client/src/pages/user/CartPage.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/user/CartPage.tsx#L551) và [`food-deli-client/src/routes/index.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/routes/index.tsx#L61-L64)
* **Bằng chứng mã nguồn:**
  1. Nút "Tiến hành đặt hàng" trong `CartPage.tsx`:
     ```typescript
     onClick={() => navigate(APP_ROUTES.CHECKOUT)}
     ```
     $\rightarrow$ Chuyển thẳng sang `/checkout` mà **chưa kiểm tra `isAuthenticated`**.
  2. Tuyến đường `/checkout` trong `routes/index.tsx`:
     ```typescript
     {
       path: APP_ROUTES.CHECKOUT,
       element: <CheckoutPage />,
     }
     ```
     $\rightarrow$ Chưa bọc trong `<ProtectedRoute>`! Khách vãng lai (Anonymous) vẫn truy cập được trang thanh toán.
  3. Trong `CheckoutPage.tsx` (dòng 100-105):
     ```typescript
     const handlePlaceOrder = () => {
       setOrderState('loading');
       setTimeout(() => {
         setOrderState('success'); // Giả lập thành công sau 1.4s!
       }, 1400);
     };
     ```
     $\rightarrow$ Bấm đặt hàng chỉ chạy `setTimeout` giả lập 1.4s, cần nối với API `POST /api/v1/orders` thật của backend.

---

### 🔍 Vấn đề 6: Header Navigation chưa rẽ nhánh menu theo Role sau Đăng nhập
* **Hiện trạng:**
  - Backend `auth-service` đã cấp phát token JWT chứa `role` (CUSTOMER, MERCHANT, DRIVER, ADMIN).
  - Dự án sử dụng **duy nhất 1 trang Đăng nhập (`/login`) và 1 trang Đăng ký (`/register`) tập trung** (không có trang đăng nhập riêng cho Admin hay Merchant).
  - **Nhưng:** Sau khi đăng nhập thành công, Header [`MainLayout.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/layouts/MainLayout.tsx#L80-L127) mới chỉ có các mục cơ bản (*Sổ địa chỉ, Thông tin cá nhân, Đăng xuất*). Chưa có lối tắt linh hoạt cho Merchant (Quán ăn của tôi), Driver (Cổng tài xế) hay Admin (Trang quản trị).

---

## 3. Bảng Phân Tích Lỗi Tồn Đọng Chi Tiết (Issue & Bug Matrix)

Toàn bộ 6 vấn đề này được nhóm lập danh mục để phân chia thành các task cải thiện độc lập (1 - 3 SP) trong Sprint 2:

| STT | Vấn đề / Lỗi tiềm ẩn | Mức độ nghiêm trọng | File liên quan | Nguyên nhân kỹ thuật | Hướng xử lý tại Sprint 2 |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | **Chưa đăng nhập vẫn bấm checkout và đặt hàng được** | 🔴 **CRITICAL** | `CartPage.tsx`<br>`routes/index.tsx`<br>`CheckoutPage.tsx` | Không bọc `<ProtectedRoute>`, không kiểm tra `isAuthenticated` trước khi `navigate('/checkout')`. | Bắt buộc kiểm tra Auth: Nếu chưa login $\rightarrow$ chuyển hướng sang `/login` kèm `state: { from: '/checkout' }`. |
| **2** | **Trang chủ (Home) dùng dữ liệu giả lập, giao diện thô** | 🟠 **HIGH** | `HomePage.tsx` | Hardcode mảng `FEATURED_ITEMS`, chưa thiết kế UI hero banner & card chuẩn đẹp. | Gọi `restaurantApi.getAll()`, thiết kế lại layout theo phong cách ShopeeFood hiện đại. |
| **3** | **Thiếu bộ lọc danh mục và thanh tìm kiếm không hoạt động** | 🟠 **HIGH** | `HomePage.tsx` | `searchTerm` không áp dụng vào filter, chưa có component Category Slider. | Thêm thanh lọc danh mục (Cơm, Bún, Trà sữa...), tích hợp debounce search 300ms. |
| **4** | **Thiếu trang chi tiết quán ăn & món ăn** | 🟠 **HIGH** | `src/routes/index.tsx`<br>`RestaurantDetailPage.tsx` | Chưa tạo route `/restaurants/:id` và modal chọn Topping. | Tạo trang chi tiết quán, gọi API `getById`, hiển thị menu theo danh mục kèm modal Topping. |
| **5** | **Giỏ hàng chưa đồng bộ và lưu tĩnh ở localStorage** | 🟡 **MEDIUM** | `CartPage.tsx`<br>`cartSlice.ts` | `CartPage` dùng `INITIAL_CART_ITEMS` tĩnh, chưa lấy từ Redux store thật. | Đồng bộ 100% `CartPage` từ `useAppSelector((state) => state.cart)`, xóa sạch mock data. |
| **6** | **Header chưa điều hướng linh hoạt theo Role** | 🟡 **MEDIUM** | `MainLayout.tsx` | Menu Dropdown chưa đọc thuộc tính `user.role` từ Redux auth. | Thêm nút điều hướng động: Merchant thấy "Quán của tôi", Driver thấy "Cổng tài xế", Admin thấy "Quản trị". |

---

## 4. Đánh Giá Tiến Độ & Hiệu Suất Từng Thành Viên

### 1. Thọ (Leader & Architect / DevOps) - 13 / 13 SP (100% - Xuất sắc)
* **Đóng góp:** Khởi tạo thành công cụm Microservices Hub (Eureka Port 8761, API Gateway Port 8080, Config Server Port 8888) và hoàn thiện backend `auth-service` (JWT 24h, mã hóa BCrypt, phân quyền RBAC).
* **Đánh giá:** Hoàn thành xuất sắc vai trò dẫn dắt kỹ thuật, đảm bảo toàn bộ hệ thống container build và chạy trơn tru qua Docker.

### 2. Duy (Backend Core) - 5 / 5 SP (100% - Hoàn hảo)
* **Đóng góp:** **Duy đã hoàn thành hoàn hảo!** Hoàn thành trọn vẹn thẻ **1.4 (`order-service` & State Machine)**, xây dựng thành công nền tảng xử lý đơn hàng, thiết kế các Entity quan hệ (`Order`, `OrderItem`, `OrderItemTopping`), đảm bảo Transaction ACID và định nghĩa máy trạng thái đơn hàng chuẩn xác.
* **Đánh giá:** Code backend sạch sẽ, logic chặt chẽ, sẵn sàng kết nối trực tiếp với luồng Checkout ở Frontend.

### 3. Quang anh (Backend / Fullstack) - 10 / 10 SP (100% - Đạt yêu cầu)
* **Đóng góp:** Hoàn thành thẻ **1.3 (`restaurant-service`)** nạp seed data 26 bảng chuẩn và hoàn thành thẻ **1.8 (Merchant Dashboard MVP)** tiếp nhận đơn hàng cơ bản.
* **Đánh giá:** Đáp ứng tốt tiến độ được giao; các tính năng nâng cao như chuông báo WebSocket và quản lý đa chi nhánh sẽ được Quang anh tiếp tục hoàn thiện ở Sprint 2.

### 4. Nhựt (Frontend Core) - 5 / 5 SP (100% - Đạt yêu cầu)
* **Đóng góp:** Hoàn thành giao diện Đăng ký và Đăng nhập tập trung, kết nối thành công với API Gateway, lưu trữ token an toàn vào Redux & LocalStorage.
* **Kế hoạch Sprint 2:** Nhựt chịu trách nhiệm bọc Route Guard `<ProtectedRoute>` cho luồng Checkout và bổ sung rẽ nhánh Role trên Header.

### 5. Thịnh (Frontend UI) - 4 / 4 SP (100% - Miễn cưỡng chấp nhận hoàn thành / Châm chước)
* **Đóng góp:** Thịnh đã nộp file `HomePage.tsx` và hoàn thành đầu việc thẻ **1.6**.
* **Đánh giá thực tế:** Chất lượng thực tế còn sơ sài, trang chủ vẫn dùng mảng mock `FEATURED_ITEMS`, chưa nối API thật từ `restaurant-service`, thanh danh mục và ô tìm kiếm chưa lọc được dữ liệu.
* **Quyết định của Leader:** Mặc dù sản phẩm đầu ra thực chất chưa đạt kỳ vọng kỹ thuật, nhưng xét thấy **Thịnh đã nghiêm túc nhận thức rõ thiếu sót và cam kết sẽ quyết tâm cải thiện ở Sprint 2** (thiết kế lại UI chuẩn ShopeeFood, nối API thật, làm debounce search và trang chi tiết quán kèm modal topping), nhóm **châm chước đánh giá Đạt (Pass) thẻ 1.6 cho Thịnh** trong báo cáo Sprint 1 để khích lệ tinh thần. Thịnh sẽ dồn lực chứng minh năng lực ngay đầu Sprint 2!

### 6. Đức (Frontend Portals) - 5 / 5 SP (100% - Đạt yêu cầu)
* **Đóng góp:** Hoàn thành giao diện Giỏ hàng (Cart) và Thanh toán (Checkout) với đầy đủ modal chọn địa chỉ, ghi chú và phương thức COD.
* **Kế hoạch Sprint 2:** Đức tiếp tục kết nối luồng Checkout với API thật của Duy, đồng bộ giỏ hàng Redux và cùng Thọ tích hợp cổng thanh toán VNPay Sandbox.

---

## 5. Kế Hoạch Khắc Phục Dứt Điểm Đầu Sprint 2

Để chất lượng dự án đạt độ hoàn thiện cao nhất, toàn bộ 6 lỗi và nợ kỹ thuật trên sẽ được phân bổ xử lý ngay trong **3 ngày đầu tiên của Sprint 2**:

```
Ngày 1 - 2: Xử lý triệt để Lỗi Bảo mật & Dữ liệu
├── [Nhựt]   Bọc ProtectedRoute cho /checkout; Click "Đặt hàng" chưa login -> đẩy sang /login kèm redirect back.
├── [Thịnh]  Thiết kế lại UI Trang chủ, gắn API GET /api/v1/restaurants, thêm bộ lọc Category & Search (Đúng cam kết bù tiến độ).
└── [Duy]    Phối hợp cùng Đức kiểm thử liên thông API POST /api/v1/orders từ Frontend vào MySQL.

Ngày 3: Tích hợp thông luồng & Bàn giao
├── [Đức]    Nối Cart & Checkout với API của Duy, xóa bỏ hoàn toàn mock setTimeout 1.4s.
├── [Nhựt]   Bổ sung menu điều hướng theo Role trên Header cho Merchant, Shipper, Admin.
└── [Thọ]    Test End-to-End luồng: Khách đặt món thật -> Database nhận đơn -> Quán thấy đơn mới.
```

---

> 🎯 **Kết luận:** Sprint 1 đã chính thức hoàn thành **100% Story Points (42 / 42 SP)** về mặt tiến độ đầu mục công việc. Mặc dù nghiệm thu thực tế phát hiện 6 lỗi tiềm ẩn về giao diện và luồng dữ liệu, nhưng toàn bộ nguyên nhân kỹ thuật đã được khoanh vùng rõ ràng và các thành viên đều đã nhận việc để làm mịn dứt điểm ngay đầu Sprint 2, tiến thẳng tới mục tiêu hoàn thành đồ án ở Sprint 3!
