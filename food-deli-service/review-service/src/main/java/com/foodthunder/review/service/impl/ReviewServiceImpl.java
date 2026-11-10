package com.foodthunder.review.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.common.dto.response.PageResponse;
import com.foodthunder.review.client.OrderClient;
import com.foodthunder.review.client.RestaurantClient;
import com.foodthunder.review.client.UserClient;
import com.foodthunder.review.dto.client.OrderClientDto;
import com.foodthunder.review.dto.request.AdminReviewRequest;
import com.foodthunder.review.dto.request.SubmitDriverReviewRequest;
import com.foodthunder.review.dto.request.SubmitOrderReviewRequest;
import com.foodthunder.review.dto.request.SubmitRestaurantReviewRequest;
import com.foodthunder.review.dto.response.OrderReviewEligibilityDto;
import com.foodthunder.review.dto.response.OrderReviewStatusDto;
import com.foodthunder.review.dto.response.ReviewResponseDto;
import com.foodthunder.review.dto.response.ReviewSummaryDto;
import com.foodthunder.review.entity.Review;
import com.foodthunder.review.exception.BadRequestException;
import com.foodthunder.review.exception.ForbiddenException;
import com.foodthunder.review.exception.ResourceNotFoundException;
import com.foodthunder.review.repository.ReviewRepository;
import com.foodthunder.review.service.ReviewService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderClient orderClient;
    private final RestaurantClient restaurantClient;
    private final UserClient userClient;
    private final ObjectMapper objectMapper;

    private static final long MAX_REVIEW_WINDOW_HOURS = 24L;

    @Override
    @Transactional
    public List<ReviewResponseDto> submitOrderReview(SubmitOrderReviewRequest request, Long customerId) {
        log.info("Processing submit review for order #{} by customer #{}", request.getOrderId(), customerId);

        // 1. Kiểm tra Idempotency: Mỗi order chỉ được đánh giá duy nhất 1 lần
        if (reviewRepository.existsByOrderId(request.getOrderId())) {
            throw new BadRequestException("Đơn hàng #" + request.getOrderId() + " đã được đánh giá trước đó. Mỗi đơn hàng chỉ được đánh giá 1 lần.");
        }

        // 2. Lấy thông tin đơn hàng từ order-service qua OpenFeign
        OrderClientDto order = fetchOrderOrThrow(request.getOrderId(), customerId);

        // 3. Kiểm tra tính sở hữu của khách hàng với đơn hàng
        if (order.getCustomerId() == null || order.getCustomerId().longValue() != customerId) {
            throw new ForbiddenException("Bạn không phải là người đặt đơn hàng #" + request.getOrderId());
        }

        // 4. Kiểm tra trạng thái đơn: Bắt buộc đã hoàn tất (COMPLETED hoặc DELIVERED)
        String status = order.getStatusCode() != null ? order.getStatusCode().toUpperCase() : "";
        if (!"COMPLETED".equals(status) && !"DELIVERED".equals(status)) {
            throw new BadRequestException("Chỉ có thể đánh giá sau khi đơn hàng đã hoàn thành (Giao thành công). Trạng thái hiện tại: " + status);
        }

        // 5. Kiểm tra thời hạn 24 giờ tính từ khi hoàn thành
        LocalDateTime completedAt = resolveCompletedAt(order);
        Duration duration = Duration.between(completedAt, LocalDateTime.now());
        if (duration.isNegative()) {
            // Trường hợp lệch clock server
            duration = Duration.ZERO;
        }

        if (duration.toHours() >= MAX_REVIEW_WINDOW_HOURS) {
            throw new BadRequestException("Đã quá thời hạn 24 giờ kể từ khi hoàn thành đơn hàng để gửi đánh giá.");
        }

        List<Review> savedReviews = new ArrayList<>();

        // 6. Lưu đánh giá Nhà hàng (+ Món ăn nếu có)
        SubmitOrderReviewRequest.TargetReviewItem resReview = request.getRestaurantReview();
        Long restaurantId = order.getRestaurantId() != null ? order.getRestaurantId().longValue() : null;
        if (restaurantId == null) {
            throw new BadRequestException("Không xác định được nhà hàng cho đơn hàng #" + request.getOrderId());
        }

        // Kiểm tra món ăn foodItemId có thuộc đơn hàng không nếu được chỉ định
        Long foodItemId = resReview.getFoodItemId();
        if (foodItemId != null && order.getItems() != null && !order.getItems().isEmpty()) {
            boolean itemExists = order.getItems().stream()
                    .anyMatch(item -> item.getFoodId() != null && item.getFoodId().equals(foodItemId));
            if (!itemExists) {
                log.warn("foodItemId {} not found in order items of order #{}", foodItemId, request.getOrderId());
            }
        }

        Review restaurantReviewEntity = Review.builder()
                .orderId(request.getOrderId())
                .customerId(customerId)
                .targetType("RESTAURANT")
                .targetId(restaurantId)
                .foodItemId(foodItemId)
                .rating(resReview.getRating())
                .comment(resReview.getComment())
                .imagesJson(serializeImages(resReview.getImages()))
                .build();
        savedReviews.add(reviewRepository.save(restaurantReviewEntity));

        // 7. Lưu đánh giá Tài xế / Shipper (nếu có thông tin shipper trong đơn và khách có gửi đánh giá shipper)
        SubmitOrderReviewRequest.TargetReviewItem driverReview = request.getDriverReview();
        if (driverReview != null && driverReview.getRating() != null && order.getDriverId() != null) {
            Review driverReviewEntity = Review.builder()
                    .orderId(request.getOrderId())
                    .customerId(customerId)
                    .targetType("DRIVER")
                    .targetId(order.getDriverId().longValue())
                    .rating(driverReview.getRating())
                    .comment(driverReview.getComment())
                    .imagesJson(serializeImages(driverReview.getImages()))
                    .quickTagsJson(serializeStringList(driverReview.getQuickTags()))
                    .build();
            savedReviews.add(reviewRepository.save(driverReviewEntity));
        }

        return savedReviews.stream().map(this::mapToDto).toList();
    }

    @Override
    @Transactional
    public ReviewResponseDto submitRestaurantReview(SubmitRestaurantReviewRequest request, Long customerId) {
        log.info("Processing separate restaurant review for order #{} by customer #{}", request.getOrderId(), customerId);

        // 1. Kiểm tra đã đánh giá nhà hàng cho đơn này chưa
        if (reviewRepository.existsByOrderIdAndTargetType(request.getOrderId(), "RESTAURANT")) {
            throw new BadRequestException("Bạn đã đánh giá nhà hàng cho đơn hàng #" + request.getOrderId() + " rồi. Mỗi đơn chỉ được đánh giá quán 1 lần.");
        }

        // 2. Lấy thông tin đơn hàng từ order-service
        OrderClientDto order = fetchOrderOrThrow(request.getOrderId(), customerId);

        // 3. Kiểm tra tính sở hữu của khách hàng với đơn hàng
        if (order.getCustomerId() == null || order.getCustomerId().longValue() != customerId) {
            throw new ForbiddenException("Bạn không phải là người đặt đơn hàng #" + request.getOrderId());
        }

        // 4. Kiểm tra trạng thái đơn: Bắt buộc đã hoàn tất (COMPLETED hoặc DELIVERED)
        validateOrderCompleted(order);

        // 5. Kiểm tra thời hạn 24 giờ
        validateWithin24Hours(order);

        Long restaurantId = order.getRestaurantId() != null ? order.getRestaurantId().longValue() : null;
        if (restaurantId == null) {
            throw new BadRequestException("Không xác định được nhà hàng cho đơn hàng #" + request.getOrderId());
        }

        Review restaurantReviewEntity = Review.builder()
                .orderId(request.getOrderId())
                .customerId(customerId)
                .targetType("RESTAURANT")
                .targetId(restaurantId)
                .foodItemId(request.getFoodItemId())
                .rating(request.getRating())
                .comment(request.getComment())
                .imagesJson(serializeImages(request.getImages()))
                .build();

        return mapToDto(reviewRepository.save(restaurantReviewEntity));
    }

    @Override
    @Transactional
    public ReviewResponseDto submitDriverReview(SubmitDriverReviewRequest request, Long customerId) {
        log.info("Processing separate driver review for order #{} by customer #{}", request.getOrderId(), customerId);

        // 1. Lấy thông tin đơn hàng từ order-service
        OrderClientDto order = fetchOrderOrThrow(request.getOrderId(), customerId);

        // 2. Kiểm tra tính sở hữu của khách hàng với đơn hàng
        if (order.getCustomerId() == null || order.getCustomerId().longValue() != customerId) {
            throw new ForbiddenException("Bạn không phải là người đặt đơn hàng #" + request.getOrderId());
        }

        // 3. Kiểm tra đơn hàng có tài xế vận chuyển không
        if (order.getDriverId() == null) {
            throw new BadRequestException("Đơn hàng #" + request.getOrderId() + " không có tài xế vận chuyển để đánh giá.");
        }

        // 4. Kiểm tra đã đánh giá tài xế cho đơn này chưa
        if (reviewRepository.existsByOrderIdAndTargetType(request.getOrderId(), "DRIVER")) {
            throw new BadRequestException("Bạn đã đánh giá tài xế cho đơn hàng #" + request.getOrderId() + " rồi. Mỗi đơn chỉ được đánh giá tài xế 1 lần.");
        }

        // 5. Kiểm tra trạng thái đơn: Bắt buộc đã hoàn tất
        validateOrderCompleted(order);

        // 6. Kiểm tra thời hạn 24 giờ
        validateWithin24Hours(order);

        // Ghép quickTags vào nội dung bình luận nếu có
        StringBuilder fullComment = new StringBuilder();
        if (request.getQuickTags() != null && !request.getQuickTags().isEmpty()) {
            fullComment.append("[").append(String.join(", ", request.getQuickTags())).append("] ");
        }
        if (request.getComment() != null && !request.getComment().isBlank()) {
            fullComment.append(request.getComment().trim());
        }

        Review driverReviewEntity = Review.builder()
                .orderId(request.getOrderId())
                .customerId(customerId)
                .targetType("DRIVER")
                .targetId(order.getDriverId().longValue())
                .rating(request.getRating())
                .comment(fullComment.toString().trim())
                .quickTagsJson(serializeStringList(request.getQuickTags()))
                .build();

        return mapToDto(reviewRepository.save(driverReviewEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderReviewStatusDto getOrderReviewStatus(Long orderId, Long customerId) {
        OrderClientDto order = fetchOrderOrThrow(orderId, customerId);
        if (order.getCustomerId() == null || order.getCustomerId().longValue() != customerId) {
            throw new ForbiddenException("Bạn không phải người sở hữu đơn hàng này");
        }

        boolean hasDriver = order.getDriverId() != null;
        Long driverId = hasDriver ? order.getDriverId().longValue() : null;

        boolean isRestaurantReviewed = reviewRepository.existsByOrderIdAndTargetType(orderId, "RESTAURANT");
        boolean isDriverReviewed = hasDriver && reviewRepository.existsByOrderIdAndTargetType(orderId, "DRIVER");

        String status = order.getStatusCode() != null ? order.getStatusCode().toUpperCase() : "";
        boolean isCompleted = "COMPLETED".equals(status) || "DELIVERED".equals(status);

        LocalDateTime completedAt = resolveCompletedAt(order);
        long elapsedSeconds = Duration.between(completedAt, LocalDateTime.now()).getSeconds();
        long maxSeconds = MAX_REVIEW_WINDOW_HOURS * 3600;
        long remaining = Math.max(0, maxSeconds - elapsedSeconds);
        boolean isExpired = remaining <= 0;

        boolean canReviewRestaurant = !isRestaurantReviewed && !isExpired && isCompleted;
        boolean canReviewDriver = hasDriver && !isDriverReviewed && !isExpired && isCompleted;

        String message = "Thành công";
        if (!isCompleted) {
            message = "Đơn hàng chưa hoàn thành (Chưa thể đánh giá)";
        } else if (isExpired) {
            message = "Đã hết thời hạn 24 giờ kể từ khi hoàn tất đơn hàng";
        } else if (isRestaurantReviewed && (!hasDriver || isDriverReviewed)) {
            message = "Đơn hàng đã được đánh giá đầy đủ";
        }

        return OrderReviewStatusDto.builder()
                .orderId(orderId)
                .hasDriver(hasDriver)
                .driverId(driverId)
                .isRestaurantReviewed(isRestaurantReviewed)
                .isDriverReviewed(isDriverReviewed)
                .canReviewRestaurant(canReviewRestaurant)
                .canReviewDriver(canReviewDriver)
                .remainingSeconds(remaining)
                .completedAt(completedAt)
                .message(message)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderReviewEligibilityDto checkEligibility(Long orderId, Long customerId) {
        boolean alreadyReviewed = reviewRepository.existsByOrderId(orderId);
        if (alreadyReviewed) {
            return OrderReviewEligibilityDto.builder()
                    .orderId(orderId)
                    .canReview(false)
                    .isReviewed(true)
                    .remainingSeconds(0L)
                    .message("Đơn hàng này đã được đánh giá")
                    .build();
        }

        OrderClientDto order = fetchOrderOrThrow(orderId, customerId);
        if (order.getCustomerId() == null || order.getCustomerId().longValue() != customerId) {
            return OrderReviewEligibilityDto.builder()
                    .orderId(orderId)
                    .canReview(false)
                    .isReviewed(false)
                    .remainingSeconds(0L)
                    .message("Bạn không phải người sở hữu đơn hàng này")
                    .build();
        }

        String status = order.getStatusCode() != null ? order.getStatusCode().toUpperCase() : "";
        if (!"COMPLETED".equals(status) && !"DELIVERED".equals(status)) {
            return OrderReviewEligibilityDto.builder()
                    .orderId(orderId)
                    .canReview(false)
                    .isReviewed(false)
                    .remainingSeconds(0L)
                    .message("Đơn hàng chưa hoàn thành (Chưa thể đánh giá)")
                    .build();
        }

        LocalDateTime completedAt = resolveCompletedAt(order);
        long elapsedSeconds = Duration.between(completedAt, LocalDateTime.now()).getSeconds();
        long maxSeconds = MAX_REVIEW_WINDOW_HOURS * 3600;
        long remaining = maxSeconds - elapsedSeconds;

        if (remaining <= 0) {
            return OrderReviewEligibilityDto.builder()
                    .orderId(orderId)
                    .canReview(false)
                    .isReviewed(false)
                    .remainingSeconds(0L)
                    .completedAt(completedAt)
                    .message("Đã hết thời hạn 24 giờ kể từ khi hoàn tất đơn hàng")
                    .build();
        }

        return OrderReviewEligibilityDto.builder()
                .orderId(orderId)
                .canReview(true)
                .isReviewed(false)
                .remainingSeconds(remaining)
                .completedAt(completedAt)
                .message("Đủ điều kiện đánh giá")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponseDto> getRestaurantReviews(Long restaurantId, Long foodItemId, Integer rating, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Review> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("targetType"), "RESTAURANT"));
            predicates.add(cb.equal(root.get("targetId"), restaurantId));

            if (foodItemId != null) {
                predicates.add(cb.equal(root.get("foodItemId"), foodItemId));
            }
            if (rating != null) {
                predicates.add(cb.equal(root.get("rating"), rating));
            }
            if (keyword != null && !keyword.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("comment")), "%" + keyword.trim().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Review> result = reviewRepository.findAll(spec, pageable);
        List<ReviewResponseDto> dtoList = result.getContent().stream().map(this::mapToDto).toList();

        return PageResponse.of(dtoList, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryDto getRestaurantSummary(Long restaurantId) {
        long total = reviewRepository.countByTargetTypeAndTargetId("RESTAURANT", restaurantId);
        Double avg = reviewRepository.calculateAverageRating("RESTAURANT", restaurantId);
        double roundedAvg = avg != null ? Math.round(avg * 100.0) / 100.0 : 5.0;

        Map<Integer, Long> breakdown = new HashMap<>();
        for (int star = 1; star <= 5; star++) {
            long count = reviewRepository.countByTargetTypeAndTargetIdAndRating("RESTAURANT", restaurantId, star);
            breakdown.put(star, count);
        }

        return ReviewSummaryDto.builder()
                .targetId(restaurantId)
                .targetType("RESTAURANT")
                .totalReviews(total)
                .averageRating(roundedAvg)
                .ratingBreakdown(breakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponseDto> getDriverReviews(Long driverId, LocalDate fromDate, LocalDate toDate, Integer rating, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Review> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("targetType"), "DRIVER"));
            predicates.add(cb.equal(root.get("targetId"), driverId));

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate.atTime(LocalTime.MAX)));
            }
            if (rating != null) {
                predicates.add(cb.equal(root.get("rating"), rating));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Review> result = reviewRepository.findAll(spec, pageable);
        List<ReviewResponseDto> dtoList = result.getContent().stream().map(this::mapToDto).toList();

        return PageResponse.of(dtoList, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryDto getDriverSummary(Long driverId) {
        long total = reviewRepository.countByTargetTypeAndTargetId("DRIVER", driverId);
        Double avg = reviewRepository.calculateAverageRating("DRIVER", driverId);
        double roundedAvg = avg != null ? Math.round(avg * 100.0) / 100.0 : 5.0;

        Map<Integer, Long> breakdown = new HashMap<>();
        for (int star = 1; star <= 5; star++) {
            long count = reviewRepository.countByTargetTypeAndTargetIdAndRating("DRIVER", driverId, star);
            breakdown.put(star, count);
        }

        return ReviewSummaryDto.builder()
                .targetId(driverId)
                .targetType("DRIVER")
                .totalReviews(total)
                .averageRating(roundedAvg)
                .ratingBreakdown(breakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponseDto> getAdminReviews(String targetType, Long targetId, Integer rating, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Review> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (targetType != null && !targetType.isBlank()) {
                predicates.add(cb.equal(root.get("targetType"), targetType.toUpperCase()));
            }
            if (targetId != null) {
                predicates.add(cb.equal(root.get("targetId"), targetId));
            }
            if (rating != null) {
                predicates.add(cb.equal(root.get("rating"), rating));
            }
            if (keyword != null && !keyword.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("comment")), "%" + keyword.trim().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Review> result = reviewRepository.findAll(spec, pageable);
        List<ReviewResponseDto> dtoList = result.getContent().stream().map(this::mapToDto).toList();

        return PageResponse.of(dtoList, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponseDto getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá #" + id));
        return mapToDto(review);
    }

    @Override
    @Transactional
    public ReviewResponseDto createAdminReview(AdminReviewRequest req) {
        Review review = Review.builder()
                .orderId(req.getOrderId())
                .customerId(req.getCustomerId())
                .targetType(req.getTargetType().toUpperCase())
                .targetId(req.getTargetId())
                .foodItemId(req.getFoodItemId())
                .rating(req.getRating())
                .comment(req.getComment())
                .imagesJson(serializeImages(req.getImages()))
                .quickTagsJson(serializeStringList(req.getQuickTags()))
                .build();

        return mapToDto(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá #" + id + " để xóa"));

        reviewRepository.delete(review);
        reviewRepository.flush();

        Double average = reviewRepository.calculateAverageRating(review.getTargetType(), review.getTargetId());
        BigDecimal ratingAvg = BigDecimal.valueOf(average != null ? average : 5.0)
                .setScale(2, RoundingMode.HALF_UP);

        if ("RESTAURANT".equalsIgnoreCase(review.getTargetType())) {
            restaurantClient.updateRating(Math.toIntExact(review.getTargetId()), ratingAvg, "ROLE_ADMIN");
        } else if ("DRIVER".equalsIgnoreCase(review.getTargetType())) {
            userClient.updateRating(review.getTargetId(), ratingAvg, "ROLE_ADMIN");
        } else {
            throw new BadRequestException("Loại đối tượng đánh giá không hợp lệ: " + review.getTargetType());
        }

        log.info("Admin successfully deleted review #{}", id);
    }

    // Helper methods
    private void validateOrderCompleted(OrderClientDto order) {
        String status = order.getStatusCode() != null ? order.getStatusCode().toUpperCase() : "";
        if (!"COMPLETED".equals(status) && !"DELIVERED".equals(status)) {
            throw new BadRequestException("Chỉ có thể đánh giá sau khi đơn hàng đã hoàn thành (Giao thành công). Trạng thái hiện tại: " + status);
        }
    }

    private void validateWithin24Hours(OrderClientDto order) {
        LocalDateTime completedAt = resolveCompletedAt(order);
        Duration duration = Duration.between(completedAt, LocalDateTime.now());
        if (!duration.isNegative() && duration.toHours() >= MAX_REVIEW_WINDOW_HOURS) {
            throw new BadRequestException("Đã quá thời hạn 24 giờ kể từ khi hoàn thành đơn hàng để gửi đánh giá.");
        }
    }

    private OrderClientDto fetchOrderOrThrow(Long orderId, Long customerId) {
        try {
            ApiResponse<OrderClientDto> res = orderClient.getOrderById(orderId, String.valueOf(customerId), "ROLE_CUSTOMER");
            if (res != null && res.data() != null) {
                return res.data();
            }
        } catch (Exception ex) {
            log.error("Failed to query order-service for order #{}", orderId, ex);
        }
        throw new ResourceNotFoundException("Không thể tìm thấy thông tin đơn hàng #" + orderId);
    }

    private LocalDateTime resolveCompletedAt(OrderClientDto order) {
        if (order.getStatusLogs() != null && !order.getStatusLogs().isEmpty()) {
            for (OrderClientDto.OrderStatusLogClientDto logItem : order.getStatusLogs()) {
                String sc = logItem.getStatusCode() != null ? logItem.getStatusCode().toUpperCase() : "";
                if ("COMPLETED".equals(sc) || "DELIVERED".equals(sc)) {
                    if (logItem.getCreatedAt() != null) {
                        return logItem.getCreatedAt();
                    }
                }
            }
        }
        return order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
    }

    private String serializeImages(List<String> images) {
        return serializeStringList(images);
    }

    private String serializeStringList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            log.warn("Failed to serialize review list values: {}", e.getMessage());
            return null;
        }
    }

    private List<String> deserializeImages(String json) {
        return deserializeStringList(json);
    }

    private List<String> deserializeStringList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private ReviewResponseDto mapToDto(Review r) {
        return ReviewResponseDto.builder()
                .id(r.getId())
                .orderId(r.getOrderId())
                .customerId(r.getCustomerId())
                .targetType(r.getTargetType())
                .targetId(r.getTargetId())
                .foodItemId(r.getFoodItemId())
                .rating(r.getRating())
                .comment(r.getComment())
                .images(deserializeImages(r.getImagesJson()))
                .quickTags(deserializeQuickTags(r))
                .createdAt(r.getCreatedAt())
                .build();
    }

    private List<String> deserializeQuickTags(Review review) {
        List<String> quickTags = deserializeStringList(review.getQuickTagsJson());
        if (!quickTags.isEmpty() || !"DRIVER".equalsIgnoreCase(review.getTargetType())
                || review.getComment() == null || !review.getComment().startsWith("[")) {
            return quickTags;
        }

        int closingBracket = review.getComment().indexOf(']');
        if (closingBracket <= 1) {
            return quickTags;
        }
        return Arrays.stream(review.getComment().substring(1, closingBracket).split(","))
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .toList();
    }
}
