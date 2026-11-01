# 📋 BÁO CÁO TỔNG KẾT & ĐÁNH GIÁ KỸ THUẬT SPRINT 1
## DỰ ÁN: THUNDER FOOD DELIVERY (SPRING BOOT MICROSERVICES + REACT 19 CLIENT)

> **Giai đoạn:** Sprint 1 - Nền tảng Core MVP & Xác thực tập trung  
> **Thời gian đánh giá:** 31/10/2026  
> **Đội ngũ phát triển (6 thành viên):** Thọ (Leader), Duy, Quang anh, Nhựt, Thịnh, Đức  
> **Tài liệu căn cứ:** [`báo cáo sprint 1.txt`](file:///d:/ojt-food-deli-start/báo%20cáo%20sprint%201.txt), [`TRELLO_BACKLOG_PLAN.md`](file:///d:/ojt-food-deli-start/TRELLO_BACKLOG_PLAN.md), kiểm tra mã nguồn thực tế tại `food-deli-client/` và `food-deli-service/`.

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
| **Story Points đã hoàn thành (Done)** | **28 SP** | **66.7%** | Nền tảng hạ tầng & Auth hoạt động ổn |
| **Story Points chưa hoàn thành (Carry-over)** | **14 SP** | **33.3%** | 3 thẻ dở dang (1.4, 1.6, 1.8) |
| **Số lượng Bug & Lỗi UX tồn đọng** | **6 lỗi lớn** | - | Cần xử lý dứt điểm trước khi mở rộng Sprint 2 |

### Bảng đối soát chi tiết từng thẻ công việc:
| Mã Thẻ | Nội dung công việc | Phụ trách | Điểm SP | Trạng thái thực tế | Đánh giá nghiệm thu |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1.1** | Khởi tạo Microservice Hub, Eureka, Config Server & API Gateway | **Thọ** | 5 | ✅ **Đạt** | Eureka (8761), Gateway (8080), Config (8888) chạy ổn định qua Docker. |
| **1.2** | Backend `auth-service`: Đăng ký, đăng nhập JWT, mã hóa BCrypt | **Thọ** | 5 | ✅ **Đạt** | Đăng nhập theo số điện thoại/email, cấp token JWT 24h, phân quyền role. |
| **1.3** | Backend `restaurant-service`: Entity, CRUD cơ bản Quán ăn & Món ăn | **Quang anh** | 5 | ✅ **Đạt** | Entity Shop, Category, Product, Topping và Seed database thành công. |
| **1.4** | Backend `order-service`: Giỏ hàng, Checkout & Order State Machine | **Duy** | 5 | ❌ **Chưa xong** | Chưa dựng xong module `order-service`, chưa có API `POST /api/v1/orders`. |
| **1.5** | Frontend Client: Form Login/Register & Lưu trữ Token Redux | **Nhựt** | 5 | ✅ **Đạt** | Giao diện Auth chạy được, kết nối API Gateway, lưu trữ token an toàn. |
| **1.6** | Frontend Client: Trang chủ, Danh sách quán & Bộ lọc tìm kiếm | **Thịnh** | 4 | ❌ **Chưa xong** | Trang chủ dùng mock data tĩnh, chưa gọi API, chưa có bộ lọc và tìm kiếm. |
| **1.7** | Frontend Client: Giỏ hàng Redux & Trang thanh toán Checkout | **Đức** | 5 | ✅ **Đạt (UI)** | Giao diện Cart & Checkout dựng đẹp, nhưng logic thanh toán chưa nối backend. |
| **1.8** | Frontend Merchant: Màn hình nhận đơn hàng cho chủ quán | **Quang anh** | 5 | ❌ **Chưa xong** | Chưa dựng giao diện Merchant Dashboard để quán bấm nhận đơn. |
| **1.9** | Tích hợp kiểm thử luồng nền tảng & Review Sprint 1 | **Thọ** | 3 | ✅ **Đạt** | Họp Sprint Review, rà soát lỗi và lập kế hoạch bù tiến độ. |

---

## 2. Báo Cáo Thẩm Tra & Kiểm Định Mã Nguồn Thực Tế (Source Code Audit)

Sau khi rà soát trực tiếp toàn bộ source code của dự án, **xác nhận 100% các vấn đề bạn đã chỉ ra là hoàn toàn chính xác**. Dưới đây là kết quả kiểm tra chi tiết kèm bằng chứng mã nguồn:

### 🔍 Vấn đề 1: Giao diện Trang chủ (Home) còn xấu, sơ sài và hardcode dữ liệu mẫu
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
* **Đánh giá:** Trang chủ chỉ render tĩnh 4 món ăn giả lập. Giao diện dạng card thô sơ, chưa đạt chuẩn UI/UX hiện đại của ShopeeFood/GrabFood. Hoàn toàn không gọi API `/api/v1/restaurants` hay `/api/v1/products` của backend.

---

### 🔍 Vấn đề 2: Trang chủ chưa có bộ lọc (Category Filter) và Tìm kiếm chưa hoạt động
* **Hiện trạng trong file:** [`food-deli-client/src/pages/public/home/HomePage.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/public/home/HomePage.tsx#L69-L115)
* **Bằng chứng mã nguồn:**
  - Ô tìm kiếm `<Input.Search value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />` chỉ lưu state `searchTerm` cục bộ nhưng **không hề có logic lọc mảng `FEATURED_ITEMS`**. Bấm tìm kiếm không có tác dụng gì.
  - Hoàn toàn **thiếu thanh cuộn danh mục ẩm thực (Categories)**: Cơm, Bún/Phở, Trà sữa, Ăn vặt, Đồ chay,...

---

### 🔍 Vấn đề 3: Chưa gọi API chi tiết Quán ăn & Món ăn (Missing Restaurant Detail Page)
* **Hiện trạng:**
  - File Service [`food-deli-client/src/services/modules/restaurantApi.ts`](file:///d:/ojt-food-deli-start/food-deli-client/src/services/modules/restaurantApi.ts) đã viết sẵn `restaurantApi.getAll()` và `restaurantApi.getById(id)`.
  - **Nhưng:** Trong Router [`src/routes/index.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/routes/index.tsx), **hoàn toàn chưa khai báo tuyến đường `/restaurants/:id`**.
  - Không có màn hình xem thực đơn đầy đủ của quán, không có modal chọn Topping đi kèm của món ăn. Người dùng bấm vào card món ăn trên trang chủ không chuyển đi đâu được.

---

### 🔍 Vấn đề 4: Giỏ hàng (Cart) lưu dữ liệu ở LocalStorage & Hardcode danh sách
* **Hiện trạng trong file:** [`food-deli-client/src/store/slices/cartSlice.ts`](file:///d:/ojt-food-deli-start/food-deli-client/src/store/slices/cartSlice.ts#L25) và [`food-deli-client/src/pages/user/CartPage.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/user/CartPage.tsx#L14-L40)
* **Bằng chứng mã nguồn:**
  - `cartSlice.ts`:
    ```typescript
    const savedCart = storage.get<CartState>(STORAGE_KEYS.CART);
    storage.set(STORAGE_KEYS.CART, state);
    ```
  - Trong `CartPage.tsx`: Danh sách món trong giỏ hàng đang dùng mảng tĩnh `INITIAL_CART_ITEMS` (Cơm tấm sườn bì chả, Canh khổ qua nhồi thịt...) chứ chưa đồng bộ 100% với dữ liệu người dùng vừa chọn từ trang chủ.

---

### 🔍 Vấn đề 5: LỖI NGHIÊM TRỌNG - Bấm thanh toán khi chưa đăng nhập KHÔNG chuyển hướng sang Login
* **Hiện trạng trong file:** [`food-deli-client/src/pages/user/CartPage.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/pages/user/CartPage.tsx#L551) và [`food-deli-client/src/routes/index.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/routes/index.tsx#L61-L64)
* **Bằng chứng mã nguồn:**
  1. Nút "Tiến hành đặt hàng" trong `CartPage.tsx`:
     ```typescript
     onClick={() => navigate(APP_ROUTES.CHECKOUT)}
     ```
     $\rightarrow$ Chuyển thẳng sang `/checkout` mà **hoàn toàn không kiểm tra `isAuthenticated`**.
  2. Tuyến đường `/checkout` trong `routes/index.tsx`:
     ```typescript
     {
       path: APP_ROUTES.CHECKOUT,
       element: <CheckoutPage />,
     }
     ```
     $\rightarrow$ Không bọc trong `<ProtectedRoute>`! Bất kỳ khách vãng lai (Anonymous) nào cũng truy cập được trang thanh toán.
  3. Trong `CheckoutPage.tsx` (dòng 100-105):
     ```typescript
     const handlePlaceOrder = () => {
       setOrderState('loading');
       setTimeout(() => {
         setOrderState('success'); // Giả lập thành công sau 1.4s!
       }, 1400);
     };
     ```
     $\rightarrow$ Bấm đặt hàng chỉ chạy `setTimeout` giả lập, không kiểm tra đăng nhập, không gọi API backend, không sinh ra đơn hàng thật trong cơ sở dữ liệu.

---

### 🔍 Vấn đề 6: Cổng Đăng nhập/Đăng ký tập trung và Phân quyền Giao diện chưa rẽ nhánh
* **Hiện trạng:**
  - Backend `auth-service` đã cấp phát token JWT chứa `role` (CUSTOMER, MERCHANT, DRIVER, ADMIN).
  - Dự án sử dụng **duy nhất 1 trang Đăng nhập (`/login`) và 1 trang Đăng ký (`/register`) tập trung** (không có trang riêng cho Admin hay Merchant).
  - **Nhưng:** Sau khi đăng nhập thành công, Header [`MainLayout.tsx`](file:///d:/ojt-food-deli-start/food-deli-client/src/layouts/MainLayout.tsx#L80-L127) chỉ có các mục: *Sổ địa chỉ, Thông tin cá nhân, Đơn hàng của tôi, Đăng xuất*. Chưa có lối tắt linh hoạt cho Merchant (Quản lý quán), Driver (Shipper Hub) hay Admin (Cổng quản trị).

---

## 3. Bảng Phân Tích Lỗi Tồn Đọng Chi Tiết (Issue & Bug Matrix)

| STT | Vấn đề / Lỗi phát hiện | Mức độ nghiêm trọng | File liên quan | Nguyên nhân kỹ thuật | Hướng xử lý đề xuất |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | **Chưa đăng nhập vẫn bấm checkout và đặt hàng được** | 🔴 **CRITICAL** | `CartPage.tsx`<br>`routes/index.tsx`<br>`CheckoutPage.tsx` | Không bọc `<ProtectedRoute>`, không kiểm tra `isAuthenticated` trước khi `navigate('/checkout')`. | Bắt buộc kiểm tra Auth: Nếu chưa đăng nhập $\rightarrow$ chuyển hướng sang `/login` kèm `state: { from: '/checkout' }`. |
| **2** | **Trang chủ (Home) dùng dữ liệu giả lập, giao diện thô** | 🟠 **HIGH** | `HomePage.tsx` | Hardcode mảng `FEATURED_ITEMS`, chưa thiết kế UI hero banner & category grid. | Dùng `useEffect` gọi `restaurantApi.getAll()`, thiết kế lại layout theo Tailwind UI hiện đại. |
| **3** | **Thiếu bộ lọc danh mục và thanh tìm kiếm không hoạt động** | 🟠 **HIGH** | `HomePage.tsx` | `searchTerm` không áp dụng vào filter, chưa có component Category Slider. | Thêm thanh lọc danh mục (Cơm, Bún, Trà sữa...), tích hợp debounce search khi gõ từ khóa. |
| **4** | **Thiếu trang chi tiết quán ăn & món ăn** | 🟠 **HIGH** | `src/routes/index.tsx`<br>`RestaurantDetailPage.tsx` | Chưa tạo route `/restaurants/:id` và modal chọn Topping. | Tạo trang chi tiết quán, gọi API `getById`, hiển thị menu theo danh mục kèm modal Topping. |
| **5** | **Giỏ hàng chưa đồng bộ và lưu tĩnh ở localStorage** | 🟡 **MEDIUM** | `CartPage.tsx`<br>`cartSlice.ts` | `CartPage` dùng `INITIAL_CART_ITEMS` tĩnh, chưa lấy từ Redux store thật. | Đồng bộ 100% `CartPage` từ `useAppSelector((state) => state.cart)`, xóa sạch mock data. |
| **6** | **Header chưa điều hướng linh hoạt theo Role** | 🟡 **MEDIUM** | `MainLayout.tsx` | Menu Dropdown chưa đọc thuộc tính `user.role` từ Redux auth. | Thêm nút điều hướng động: Merchant thấy "Quản lý quán", Shipper thấy "Cổng tài xế", Admin thấy "Quản trị". |

---

## 4. Đánh Giá Tiến Độ & Hiệu Suất Từng Thành Viên

### 1. Thọ (Leader & Architect / DevOps) - 13 / 13 SP (100%)
* **Đóng góp:** Khởi tạo thành công cụm Microservices Hub (Eureka Port 8761, API Gateway Port 8080, Config Server Port 8888) và hoàn thiện backend `auth-service` (JWT 24h, mã hóa BCrypt, phân quyền RBAC).
* **Đánh giá:** Hoàn thành xuất sắc vai trò dẫn dắt kỹ thuật, đảm bảo toàn bộ hệ thống container build và chạy trơn tru qua Docker.

### 2. Quang anh (Backend / Fullstack) - 5 / 10 SP (50%)
* **Đóng góp:** Hoàn thành `restaurant-service` (bảng `restaurants`, `categories`, `food_items`, `toppings` và nạp seed data).
* **Hạn chế:** Thẻ **1.8 (Merchant Portal)** chưa hoàn thành do dồn thời gian hỗ trợ chỉnh sửa lược đồ CSDL. Chuyển thẻ 1.8 sang làm trọng tâm đầu Sprint 2.

### 3. Duy (Backend Core) - 0 / 5 SP (0%)
* **Hạn chế:** Thẻ **1.4 (`order-service` & State Machine)** chưa hoàn thành. Đây là nguyên nhân trực tiếp khiến luồng Giỏ hàng ở Frontend chưa thể đặt hàng thành công vào cơ sở dữ liệu.
* **Kế hoạch bù tiến độ:** Duy cần tập trung 100% nguồn lực vào tuần đầu Sprint 2 để hoàn thiện `order-service` và phối hợp với Thọ triển khai `delivery-service`.

### 4. Nhựt (Frontend Core) - 5 / 5 SP (100%)
* **Đóng góp:** Hoàn thành giao diện Đăng nhập và Đăng ký tập trung, kết nối thành công với API Gateway, lưu trữ token vào Redux & LocalStorage.
* **Kế hoạch tiếp theo:** Nhựt chịu trách nhiệm sửa lỗi Header Navigation, Route Guard `<ProtectedRoute>` cho luồng Checkout và rẽ nhánh giao diện theo Role.

### 5. Thịnh (Frontend UI) - 0 / 4 SP (0%)
* **Hạn chế:** Thẻ **1.6 (Trang chủ & Menu)** chưa hoàn thành. Giao diện trang chủ hiện tại còn xấu, chỉ có mock data, thiếu bộ lọc và tìm kiếm.
* **Kế hoạch bù tiến độ:** Thịnh nhận nhiệm vụ thiết kế lại toàn bộ trang chủ, gắn API thật từ `restaurant-service`, hoàn thiện thanh tìm kiếm và bộ lọc ẩm thực.

### 6. Đức (Frontend Portals) - 5 / 5 SP (100% UI)
* **Đóng góp:** Hoàn thành giao diện Giỏ hàng (Cart) và Thanh toán (Checkout) với đầy đủ modal chọn địa chỉ, ghi chú và phương thức COD.
* **Kế hoạch tiếp theo:** Đức kết nối luồng Checkout với API `order-service` của Duy và bắt đầu xây dựng giao diện Shipper Web Hub.

---

## 5. Kế Hoạch Khắc Phục Dứt Điểm Đầu Sprint 2

Để không làm ảnh hưởng đến lộ trình kết thúc dự án ở Sprint 3, toàn bộ 6 lỗi trên sẽ được phân bổ xử lý ngay trong **3 ngày đầu tiên của Sprint 2**:

```
Ngày 1 - 2: Xử lý triệt để Lỗi Bảo mật & Dữ liệu
├── [Nhựt]   Bọc ProtectedRoute cho /checkout; Click "Đặt hàng" chưa login -> đẩy sang /login kèm redirect back.
├── [Thịnh]  Thiết kế lại UI Trang chủ, gắn API GET /api/v1/restaurants, thêm bộ lọc Category & Search.
└── [Duy]    Hoàn thiện Backend order-service: Viết API POST /api/v1/orders lưu đơn hàng vào MySQL.

Ngày 3: Tích hợp thông luồng & Bàn giao
├── [Đức]    Nối Cart & Checkout với API của Duy, xóa bỏ hoàn toàn mock setTimeout.
├── [Nhựt]   Bổ sung menu điều hướng theo Role trên Header cho Merchant, Shipper, Admin.
└── [Thọ]    Test End-to-End luồng: Khách đặt món thật -> Database nhận đơn -> Quán thấy đơn mới.
```

---

> 🎯 **Kết luận:** Sprint 1 đã hoàn thành tốt phần **Khung hạ tầng Microservices và Cơ chế Xác thực JWT**. Mặc dù còn 3 thẻ dở dang và 6 lỗi giao diện/luồng dữ liệu, nhưng toàn bộ nguyên nhân kỹ thuật đã được khoanh vùng chính xác. Đội ngũ tự tin sẽ giải quyết 100% các tồn đọng này ngay đầu Sprint 2 để tiến thẳng về đích ở Sprint 3!

