---
trigger: always_on
description: Quy trình chuẩn xử lý Task và Subtasks dựa trên kiến trúc thực tế dự án (3 chế độ KIỂM TRA, TRIỂN KHAI, TẠO PROMPT cùng 6 bước xác định, khảo sát, đối chiếu, thực hiện, kiểm chứng và báo cáo).
---

# Quy Trình Chuẩn Xử Lý Task và Subtasks Dự Án

Khi tiếp nhận bất kỳ task, subtasks hoặc yêu cầu kỹ thuật nào, AI Agent PHẢI tuân thủ nghiêm ngặt quy trình và nguyên tắc dưới đây.

## Chế Độ Thực Hiện
Mặc định là **KIỂM TRA** nếu người dùng chưa chọn cụ thể.
1. **KIỂM TRA:** Đánh giá mức độ hoàn thành, phát hiện lỗi và phần còn thiếu; tuyệt đối không sửa code.
2. **TRIỂN KHAI:** Kiểm tra hiện trạng, sau đó triển khai hoặc sửa chữa những phần cần thiết để đáp ứng yêu cầu.
3. **TẠO PROMPT:** Kiểm tra hiện trạng, sau đó viết một prompt triển khai hoàn chỉnh cho AI Agent khác; không sửa code.

---

## Quy Trình 6 Bước Tiêu Chuẩn

### Bước 1: Xác Định Yêu Cầu
- Đọc toàn bộ task, subtasks và tài liệu liên quan. Nếu đầu vào là ảnh, trích xuất đầy đủ nội dung; đánh dấu phần không đọc rõ, không tự đoán.
- Chuyển từng yêu cầu thành tiêu chí có thể kiểm chứng:
  - Người dùng hoặc vai trò thực hiện (RBAC).
  - Điều kiện tiên quyết trước khi thực hiện.
  - Luồng xử lý chính và kết quả mong đợi.
  - Quy tắc nghiệp vụ, validation và phân quyền.
  - Trường hợp lỗi, ngoại lệ và điều kiện biên.
  - Dữ liệu cần lưu, thay đổi trạng thái và tác động đến chức năng liên quan.
- Phân biệt rõ yêu cầu được cung cấp, quy ước xác nhận được từ dự án và giả định cá nhân. Tuyệt đối không tự bổ sung tính năng ngoài phạm vi.
- Nếu thiếu thông tin có thể làm thay đổi nghiệp vụ, quyền truy cập, dữ liệu hoặc tiêu chí nghiệm thu: hỏi rõ trước khi thực hiện phần phụ thuộc; trong lúc chờ, tiếp tục những phần độc lập. Đối với lựa chọn kỹ thuật thông thường, chủ động quyết định theo chuẩn hiện có của dự án và nêu giả định.

### Bước 2: Khảo Sát Dự Án
- Đọc hướng dẫn áp dụng cho repository, tài liệu kiến trúc (`KIEN_TRUC_CSDL_LOGIC_MICROSERVICES.md`), cấu hình và các module liên quan (`food-deli-service/`).
- Xác định rõ:
  - Công nghệ, cấu trúc module và trách nhiệm của từng lớp.
  - Luồng dữ liệu và cách các thành phần tích hợp (OpenFeign, RabbitMQ, Gateway).
  - Cơ chế xác thực, phân quyền, validation và xử lý lỗi (`@RestControllerAdvice`).
  - Mô hình dữ liệu (Decoupled Plain IDs), migration và API contract liên quan.
  - Quy ước code và cách build, chạy, kiểm thử.
- Khảo sát đủ để hiểu chức năng từ đầu đến cuối, tập trung vào phạm vi liên quan. Ưu tiên tái sử dụng thành phần và mẫu triển khai hiện có. Không áp đặt kiến trúc mới hoặc thêm dependency khi chưa có nhu cầu rõ ràng.

### Bước 3: Đối Chiếu Từng Task/Subtask Với Code Thực Tế
Lập bảng đối chiếu đánh giá với cấu trúc cột:
| Yêu cầu | Tiêu chí nghiệm thu | Hiện trạng | Bằng chứng | Khoảng thiếu / Rủi ro | Việc cần làm |

Sử dụng 5 trạng thái chuẩn:
- **Đã đáp ứng và đã kiểm chứng.**
- **Có triển khai nhưng chưa đủ bằng chứng kiểm chứng.**
- **Đáp ứng một phần.**
- **Chưa triển khai.**
- **Chưa thể kết luận vì thiếu thông tin hoặc môi trường.**

- Mỗi kết luận phải có bằng chứng cụ thể: đường dẫn file, symbol, vị trí dòng code, kiểm thử hoặc hành vi quan sát được.
- Không kết luận chức năng hoàn thành chỉ vì có giao diện, endpoint, tên hàm hoặc đoạn code tương ứng. Bắt buộc kiểm tra khả năng hoạt động và kết nối thực tế giữa các thành phần liên quan.
- Chú ý rà soát: code chưa được gọi, route chưa đăng ký, dữ liệu giả còn trong luồng chính, TODO/placeholder, thiếu lưu dữ liệu, thiếu phân quyền, sai validation, lỗi chuyển trạng thái hoặc sai API contract. Chỉ báo cáo vấn đề có căn cứ.

### Bước 4: Thực Hiện Theo Chế Độ Đã Chọn
- **Nếu là KIỂM TRA:**
  - Giữ nguyên toàn bộ code.
  - Báo cáo mức độ đáp ứng của từng yêu cầu.
  - Chỉ rõ lỗi, phần thiếu, ảnh hưởng và thứ tự ưu tiên xử lý.
  - Phân biệt lỗi đã xác nhận với rủi ro cần kiểm chứng thêm.
- **Nếu là TRIỂN KHAI:**
  - Dựa trên kết quả kiểm tra, nêu kế hoạch ngắn rồi thực hiện phần còn thiếu hoặc sai.
  - Giữ nguyên phần đã đáp ứng, trừ khi cần điều chỉnh để tích hợp đúng.
  - Hoàn thiện các thành phần cần thiết xuyên suốt luồng chức năng, từ API/Controller đến Service và Persistence.
  - Tuân thủ trách nhiệm từng lớp, quy ước dự án và API contract thống nhất (`ApiResponse<T>`).
  - Không refactor diện rộng, thay đổi hành vi không liên quan hoặc ghi đè thay đổi sẵn có của người dùng.
  - Không để lại placeholder/TODO trong luồng cần bàn giao.
  - Chỉ cập nhật tài liệu, cấu hình, dependency hoặc migration khi thực sự cần thiết.
- **Nếu là TẠO PROMPT:**
  - Tạo một prompt độc lập, đủ ngữ cảnh để AI Agent khác thực hiện.
  - Đưa vào prompt: mục tiêu, yêu cầu nghiệp vụ, hiện trạng đã xác minh, module/file liên quan, phần cần triển khai, ràng buộc kiến trúc, tiêu chí nghiệm thu, cách kiểm thử và định dạng báo cáo.
  - Chỉ rõ thông tin chưa xác minh và câu hỏi còn mở.
  - Giữ ở mức định hướng nếu chưa đủ bằng chứng để chỉ định chi tiết triển khai.
  - Trả về prompt hoàn chỉnh trong một khối văn bản dễ sao chép.

### Bước 5: Kiểm Chứng
- Trong chế độ KIỂM TRA hoặc TRIỂN KHAI, thực hiện các kiểm tra phù hợp: lint, type-check, build, kiểm thử tự động (JUnit 5, Mockito, MockMvc) hoặc kiểm tra hành vi thực tế.
- Trong chế độ TRIỂN KHAI, bổ sung hoặc cập nhật kiểm thử khi cần để chứng minh quy tắc nghiệp vụ, tái hiện lỗi hoặc bảo vệ luồng quan trọng. Tránh kiểm thử chỉ lặp lại chi tiết implementation.
- Ưu tiên kiểm tra:
  - Luồng thành công (Happy path).
  - Đầu vào không hợp lệ và điều kiện biên.
  - Phân quyền (RBAC).
  - Lưu dữ liệu và chuyển trạng thái (State Machine, Pessimistic Locking).
  - Tích hợp giữa các thành phần.
  - Khả năng hồi quy ở chức năng liên quan.
- Ghi rõ lệnh đã chạy, kết quả và giới hạn kiểm chứng. Nếu không chạy được, nêu nguyên nhân và cách kiểm chứng tiếp theo. Không coi kiểm thử chưa chạy là đã đạt.

### Bước 6: Báo Cáo Kết Quả
- Trình bày bằng tiếng Việt có dấu, kết luận trước, bằng chứng sau.
- Cấu trúc báo cáo:
  1. Mức độ đáp ứng của task và từng subtask.
  2. Bảng đối chiếu yêu cầu với hiện trạng.
  3. Lỗi hoặc khoảng thiếu, kèm ảnh hưởng và vị trí liên quan.
  4. Những thay đổi đã thực hiện nếu có, và lý do.
  5. Kết quả kiểm chứng.
  6. Việc còn lại, thông tin cần bổ sung hoặc giới hạn môi trường.
- Nếu đã sửa code, cập nhật bảng đối chiếu theo trạng thái sau khi sửa và phân biệt rõ với hiện trạng ban đầu.
- Chỉ kết luận hoàn thành khi tất cả tiêu chí bắt buộc đều được đáp ứng và có bằng chứng kiểm chứng phù hợp. Nếu chưa đủ bằng chứng, nêu chính xác phần còn chưa xác minh; không tự đưa ra tỷ lệ hoàn thành hoặc khẳng định "đầy đủ 100%".

