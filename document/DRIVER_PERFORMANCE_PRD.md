# PRD - Quản lý hiệu suất và chỉ số tài xế

## 1. Mục tiêu

Tính năng này giúp hệ thống quản lý chất lượng vận hành của tài xế giao đồ ăn thông qua 3 chỉ số riêng biệt:

| Chỉ số | Tên | Ý nghĩa | Ảnh hưởng |
| --- | --- | --- | --- |
| AR | Acceptance Rate | Tài xế có sẵn sàng nhận đơn được phát hay không | Ưu tiên phát đơn, thưởng, cooldown ngắn |
| CR | Cancellation Rate | Tài xế có giữ cam kết sau khi đã nhận đơn hay không | Cảnh báo nghiêm trọng, khóa nhận đơn tạm thời |
| Rating | Driver Rating | Khách hàng/nhà hàng đánh giá chất lượng phục vụ | Đào tạo lại, hạn chế hoặc khóa tài khoản |

Nguyên tắc sản phẩm: AR, CR và Rating không được tính lẫn nhau. Rating thấp không làm giảm AR/CR. Từ chối/hủy đơn không tự làm giảm điểm sao.

## 2. Định nghĩa và công thức

### 2.1 Acceptance Rate - AR

AR được tính trên rolling window 100 offer gần nhất.

```text
AR = accepted_offers / eligible_offers * 100
```

| Thành phần | Định nghĩa |
| --- | --- |
| eligible_offers | Offer có kết quả cuối: ACCEPTED, COMPLETED, DRIVER_CANCELLED, REJECTED, IGNORED |
| accepted_offers | Offer có status ACCEPTED, COMPLETED hoặc DRIVER_CANCELLED |
| rejected_offers | Tài xế bấm từ chối |
| ignored_offers | Tài xế không phản hồi trước khi offer hết hạn |

Quy ước mặc định:

```text
Nếu eligible_offers = 0 thì AR = 100%
```

### 2.2 Cancellation Rate - CR

CR được tính trên rolling window 100 đơn đã nhận gần nhất.

```text
CR = chargeable_driver_cancelled_orders / accepted_orders * 100
```

| Thành phần | Định nghĩa |
| --- | --- |
| accepted_orders | Offer đã được tài xế nhận, gồm ACCEPTED, COMPLETED, DRIVER_CANCELLED |
| chargeable_driver_cancelled_orders | Offer chuyển sang DRIVER_CANCELLED và cancellation_chargeable = true |
| non_chargeable_cancel | Hủy do lỗi hệ thống/khách yêu cầu, không tính CR |

Quy ước mặc định:

```text
Nếu accepted_orders = 0 thì CR = 0%
```

### 2.3 Driver Rating

Rating được tính từ bảng review hiện có, chỉ lấy targetType = DRIVER.

```text
Driver Rating = sum(rating) / count(driver_reviews)
```

Điều kiện hợp lệ:

| Điều kiện | Mô tả |
| --- | --- |
| Đơn phải hoàn thành | Chỉ đơn COMPLETED mới được đánh giá |
| Sao hợp lệ | 1 đến 5 sao |
| Một loại đánh giá mỗi đơn | Một đơn chỉ có một review DRIVER của khách |

Rating tuyệt đối không cập nhật AR hoặc CR.

## 3. Workflow nghiệp vụ

### 3.1 Khi đơn được phát đến tài xế

```text
Order CONFIRMED
→ Dispatch engine tìm tài xế gần, online, không bận, không bị penalty
→ Tạo driver_offer
→ Push đến app tài xế
→ Tài xế Accept / Reject / Ignore
→ Cập nhật AR
```

| Current State | Action | Next State | Ảnh hưởng AR | Ảnh hưởng CR | Ảnh hưởng Rating |
| --- | --- | --- | --- | --- | --- |
| OFFERED | Accept | ACCEPTED | Có, tăng mẫu accepted | Không | Không |
| OFFERED | Reject | REJECTED | Có, giảm AR | Không | Không |
| OFFERED | Hết hạn | IGNORED | Có, giảm AR | Không | Không |
| ACCEPTED | Complete | COMPLETED | Vẫn được tính là accepted | Không | Sau đó có thể rating |

Luật phạt liên tiếp:

| Điều kiện | Hệ quả |
| --- | --- |
| Từ chối/bỏ qua 1 offer | Chỉ cập nhật AR |
| Từ chối/bỏ qua 2 offer liên tiếp | Hiển thị cảnh báo |
| Từ chối/bỏ qua 3 offer liên tiếp | Tạo AR_COOLDOWN 15 phút |

### 3.2 Khi tài xế đã nhận rồi hủy đơn

```text
Order DRIVER_ACCEPTED / PICKING_UP / DELIVERING
→ Driver chọn Hủy đơn
→ Bắt buộc chọn lý do
→ App hiển thị dự báo CR và hậu quả thưởng/phạt
→ Xác nhận hủy
→ driver_offer chuyển DRIVER_CANCELLED
→ Order quay về CONFIRMED và driver_id = null
→ Redispatch cho tài xế khác
→ Thông báo khách hàng
```

| Current State | Action | Next State | Ảnh hưởng |
| --- | --- | --- | --- |
| DRIVER_ACCEPTED | Driver cancel | CONFIRMED | Tăng CR nếu chargeable |
| PICKING_UP | Driver cancel | CONFIRMED | Tăng CR, mức rủi ro cao |
| DELIVERING | Driver cancel | CONFIRMED | Tăng CR, cần audit |

Lý do hủy giai đoạn đầu:

| Code | Nhãn UI | Tính CR |
| --- | --- | --- |
| MERCHANT_DELAY | Quán làm lâu | Có |
| VEHICLE_ISSUE | Thủng lốp / xe hỏng | Có |
| FLOODED_ROAD | Đường ngập / cấm đường | Có |
| PERSONAL_REASON | Lý do cá nhân | Có |
| CUSTOMER_REQUEST | Khách yêu cầu hủy | Không |
| SYSTEM_ISSUE | Lỗi hệ thống | Không |

### 3.3 Khi hoàn thành đơn và đánh giá sao

```text
Order COMPLETED
→ Customer/Merchant review 1-5 sao
→ Cập nhật User.ratingAvg của driver
→ Không thay đổi driver_offer
→ Không thay đổi AR/CR
```

| Event | AR | CR | Rating |
| --- | --- | --- | --- |
| Customer rates driver 5 sao | Không đổi | Không đổi | Tăng hoặc giữ |
| Customer rates driver 1 sao | Không đổi | Không đổi | Giảm |
| Merchant review | Không đổi | Không đổi | Có thể tính nếu bật |

## 4. Consequences - thưởng/phạt

### 4.1 Ngưỡng mặc định

| Chỉ số | Tốt | Cảnh báo | Nguy hiểm |
| --- | --- | --- | --- |
| AR | >= 85% | 70% - 84.9% | < 70% |
| CR | <= 3% | 3.1% - 7.9% | >= 8% |
| Rating | >= 4.7 | 4.3 - 4.69 | < 4.3 |

### 4.2 Hệ quả

| Điều kiện | Hệ quả |
| --- | --- |
| AR cao, CR thấp, Rating tốt | Đủ điều kiện thưởng ngày/tuần |
| AR >= 85%, CR <= 3%, Rating >= 4.7 | Ưu tiên phát đơn |
| Từ chối/bỏ qua 3 offer liên tiếp | Khóa nhận đơn 15 phút |
| CR >= 8% | Khóa nhận đơn 24 giờ |
| Rating < 4.3 | Bắt buộc học lại quy trình hoặc review tài khoản |

## 5. UI/UX app tài xế

### 5.1 Màn hình chính

App tài xế hiển thị 4 card:

| Card | Nội dung |
| --- | --- |
| AR | Phần trăm AR, accepted/total trong 100 offer |
| CR | Phần trăm CR, cancelled/accepted trong 100 đơn nhận |
| Rating | Điểm sao trung bình và số lượt đánh giá |
| Thưởng | Đủ điều kiện/chưa đạt, hoặc penalty đang active |

### 5.2 Cảnh báo trước khi từ chối

Popup cần hiển thị:

```text
Nếu từ chối đơn này:
- AR dự kiến giảm từ 86% xuống 85%
- Chuỗi từ chối/bỏ qua sẽ là 2/3
- Nếu đạt 3/3, bạn bị khóa nhận đơn 15 phút
```

### 5.3 Cảnh báo trước khi hủy

Popup cần hiển thị:

```text
Nếu hủy đơn này:
- CR dự kiến tăng từ 3.9% lên 4.8%
- Bạn có thể mất mốc thưởng ngày
- Đơn sẽ được điều phối lại cho tài xế khác
- Khách hàng sẽ được thông báo đổi tài xế
```

## 6. Kiến trúc logic triển khai

### 6.1 Bảng driver_offers

Nguồn dữ liệu chính của AR và CR.

| Field | Mô tả |
| --- | --- |
| order_id | Đơn được phát |
| driver_id | Tài xế nhận offer |
| status | OFFERED, ACCEPTED, REJECTED, IGNORED, DRIVER_CANCELLED, COMPLETED |
| distance_km | Khoảng cách tới quán tại thời điểm dispatch |
| pickup_eta_minutes | ETA tới quán |
| dispatch_score | Điểm thuật toán dispatch |
| offered_at | Thời điểm phát offer |
| responded_at | Thời điểm tài xế phản hồi |
| expires_at | Thời điểm offer hết hạn |
| cancellation_chargeable | Hủy này có tính CR hay không |

### 6.2 Bảng driver_penalties

| Field | Mô tả |
| --- | --- |
| driver_id | Tài xế bị phạt |
| type | AR_COOLDOWN hoặc CR_SUSPENSION |
| status | ACTIVE, EXPIRED, REVOKED |
| reason | Lý do |
| starts_at | Bắt đầu |
| ends_at | Kết thúc |

## 7. Pseudocode

### 7.1 Tính AR

```pseudo
function calculateAR(driverId):
    offers = getLastEligibleOffers(driverId, limit=100)
    accepted = count(offers where status in [ACCEPTED, COMPLETED, DRIVER_CANCELLED])
    total = count(offers)

    if total == 0:
        return 100

    return accepted / total * 100
```

### 7.2 Tính CR

```pseudo
function calculateCR(driverId):
    acceptedOffers = getLastAcceptedOffers(driverId, limit=100)
    cancelled = count(acceptedOffers where status == DRIVER_CANCELLED and cancellationChargeable == true)

    if acceptedOffers.count == 0:
        return 0

    return cancelled / acceptedOffers.count * 100
```

### 7.3 Từ chối offer

```pseudo
function rejectOffer(driverId, orderId):
    offer = findOrCreateOffer(driverId, orderId)
    offer.status = REJECTED
    offer.respondedAt = now()

    if countConsecutiveRejectedOrIgnored(driverId) >= 3:
        createPenalty(driverId, AR_COOLDOWN, 15 minutes)

    return calculateDriverMetrics(driverId)
```

### 7.4 Hủy đơn đã nhận

```pseudo
function cancelDriverOrder(driverId, orderId, reasonCode):
    order = lockOrder(orderId)

    if order.driverId != driverId:
        throw Forbidden

    if order.status not in [DRIVER_ACCEPTED, PICKING_UP, DELIVERING]:
        throw InvalidState

    offer = findAcceptedOffer(driverId, orderId)
    offer.status = DRIVER_CANCELLED
    offer.cancellationChargeable = isChargeable(reasonCode)

    order.driverId = null
    order.status = CONFIRMED
    order.cancelReason = reasonCode
    save(order)

    redispatch(order)
    notifyCustomer(order.customerId)

    return calculateDriverMetrics(driverId)
```

## 8. API đã triển khai

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET | /api/drivers/me/metrics | Lấy AR, CR, Rating, penalty hiện tại |
| POST | /api/orders/:id/reject-offer | Tài xế từ chối offer, cập nhật AR |
| POST | /api/orders/:id/driver-cancel | Tài xế hủy đơn đã nhận, cập nhật CR và redispatch |

## 9. Ghi chú mở rộng

Các bước nên làm ở giai đoạn tiếp theo:

| Hạng mục | Lý do |
| --- | --- |
| Job expire offer | Tự chuyển OFFERED quá hạn sang IGNORED để penalty ignore chạy ngay |
| Admin dashboard | Cho vận hành xem AR/CR/rating và penalty |
| Appeal flow | Tài xế khiếu nại hủy do bất khả kháng |
| Reward engine | Tách tính thưởng ngày/tuần thành service riêng |
| Experiment weights | Dùng AR/CR/rating trong dispatch score theo cấu hình A/B |
