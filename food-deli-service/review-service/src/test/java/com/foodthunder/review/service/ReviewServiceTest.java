package com.foodthunder.review.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.review.client.OrderClient;
import com.foodthunder.review.client.RestaurantClient;
import com.foodthunder.review.client.UserClient;
import com.foodthunder.review.dto.client.OrderClientDto;
import com.foodthunder.review.dto.request.SubmitOrderReviewRequest;
import com.foodthunder.review.dto.response.OrderReviewEligibilityDto;
import com.foodthunder.review.dto.response.ReviewResponseDto;
import com.foodthunder.review.entity.Review;
import com.foodthunder.review.exception.BadRequestException;
import com.foodthunder.review.exception.ForbiddenException;
import com.foodthunder.review.repository.ReviewRepository;
import com.foodthunder.review.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private OrderClient orderClient;

    @Mock
    private RestaurantClient restaurantClient;

    @Mock
    private UserClient userClient;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private SubmitOrderReviewRequest validRequest;
    private OrderClientDto completedOrder;

    @BeforeEach
    void setUp() {
        validRequest = SubmitOrderReviewRequest.builder()
                .orderId(100L)
                .restaurantReview(SubmitOrderReviewRequest.TargetReviewItem.builder()
                        .rating(5)
                        .comment("Món ăn rất ngon, nóng hổi!")
                        .foodItemId(10L)
                        .images(List.of("http://example.com/food.jpg"))
                        .build())
                .driverReview(SubmitOrderReviewRequest.TargetReviewItem.builder()
                        .rating(5)
                        .comment("Giao hàng siêu nhanh")
                        .build())
                .build();

        completedOrder = OrderClientDto.builder()
                .id(100L)
                .customerId(1)
                .restaurantId(5)
                .driverId(8)
                .statusCode("COMPLETED")
                .createdAt(LocalDateTime.now().minusHours(2))
                .statusLogs(List.of(
                        new OrderClientDto.OrderStatusLogClientDto("PENDING", LocalDateTime.now().minusHours(3)),
                        new OrderClientDto.OrderStatusLogClientDto("COMPLETED", LocalDateTime.now().minusHours(2))
                ))
                .items(List.of(
                        new OrderClientDto.OrderItemClientDto(1L, 10L, "Cơm Tấm Sườn Nướng")
                ))
                .build();
    }

    @Test
    @DisplayName("Deleting a restaurant review recalculates and updates its average")
    void deleteRestaurantReview_RecalculatesRating() {
        Review review = Review.builder()
                .id(12L)
                .targetType("RESTAURANT")
                .targetId(5L)
                .rating(1)
                .build();
        when(reviewRepository.findById(12L)).thenReturn(Optional.of(review));
        when(reviewRepository.calculateAverageRating("RESTAURANT", 5L)).thenReturn(4.25);

        reviewService.deleteReview(12L);

        verify(reviewRepository).delete(review);
        verify(reviewRepository).flush();
        verify(restaurantClient).updateRating(5, new BigDecimal("4.25"), "ROLE_ADMIN");
        verifyNoInteractions(userClient);
    }

    @Test
    @DisplayName("Deleting the final driver review restores the default average")
    void deleteDriverReview_UsesDefaultWhenNoReviewsRemain() {
        Review review = Review.builder()
                .id(13L)
                .targetType("DRIVER")
                .targetId(8L)
                .rating(1)
                .build();
        when(reviewRepository.findById(13L)).thenReturn(Optional.of(review));
        when(reviewRepository.calculateAverageRating("DRIVER", 8L)).thenReturn(null);

        reviewService.deleteReview(13L);

        verify(userClient).updateRating(8L, new BigDecimal("5.00"), "ROLE_ADMIN");
        verifyNoInteractions(restaurantClient);
    }

    @Test
    @DisplayName("Deleting a missing review returns not found")
    void deleteReview_NotFound() {
        when(reviewRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(com.foodthunder.review.exception.ResourceNotFoundException.class,
                () -> reviewService.deleteReview(404L));

        verify(reviewRepository, never()).delete(any(Review.class));
        verifyNoInteractions(restaurantClient, userClient);
    }

    @Test
    @DisplayName("Existing driver comments retain their previously embedded quick tags")
    void getReviewById_ParsesExistingQuickTags() {
        Review review = Review.builder()
                .id(14L)
                .targetType("DRIVER")
                .targetId(8L)
                .comment("[Giao nhanh, Thân thiện] Tài xế lịch sự")
                .build();
        when(reviewRepository.findById(14L)).thenReturn(Optional.of(review));

        ReviewResponseDto result = reviewService.getReviewById(14L);

        assertEquals(List.of("Giao nhanh", "Thân thiện"), result.getQuickTags());
    }

    @Test
    @DisplayName("Thành công: Gửi đánh giá đơn hàng hợp lệ trong vòng 24h")
    void submitOrderReview_Success() {
        when(reviewRepository.existsByOrderId(100L)).thenReturn(false);
        when(orderClient.getOrderById(100L, "1", "ROLE_CUSTOMER"))
                .thenReturn(ApiResponse.success(completedOrder));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(1L);
            r.setCreatedAt(LocalDateTime.now());
            return r;
        });

        List<ReviewResponseDto> results = reviewService.submitOrderReview(validRequest, 1L);

        assertNotNull(results);
        assertEquals(2, results.size()); // 1 review quán, 1 review tài xế
        verify(reviewRepository, times(2)).save(any(Review.class));
    }

    @Test
    @DisplayName("Thất bại: Đơn hàng đã được đánh giá trước đó (Chỉ được đánh giá 1 lần)")
    void submitOrderReview_AlreadyReviewed_ThrowsBadRequest() {
        when(reviewRepository.existsByOrderId(100L)).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> reviewService.submitOrderReview(validRequest, 1L));

        assertTrue(ex.getMessage().contains("đã được đánh giá trước đó"));
        verify(orderClient, never()).getOrderById(any(), any(), any());
    }

    @Test
    @DisplayName("Thất bại: Khách hàng không phải là người đặt đơn")
    void submitOrderReview_ForbiddenUser_ThrowsForbidden() {
        when(reviewRepository.existsByOrderId(100L)).thenReturn(false);
        when(orderClient.getOrderById(100L, "99", "ROLE_CUSTOMER"))
                .thenReturn(ApiResponse.success(completedOrder));

        ForbiddenException ex = assertThrows(ForbiddenException.class,
                () -> reviewService.submitOrderReview(validRequest, 99L));

        assertTrue(ex.getMessage().contains("không phải là người đặt đơn hàng"));
    }

    @Test
    @DisplayName("Thất bại: Đơn hàng chưa hoàn thành (Chưa ở trạng thái COMPLETED/DELIVERED)")
    void submitOrderReview_OrderNotCompleted_ThrowsBadRequest() {
        completedOrder.setStatusCode("DELIVERING");
        when(reviewRepository.existsByOrderId(100L)).thenReturn(false);
        when(orderClient.getOrderById(100L, "1", "ROLE_CUSTOMER"))
                .thenReturn(ApiResponse.success(completedOrder));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> reviewService.submitOrderReview(validRequest, 1L));

        assertTrue(ex.getMessage().contains("Chỉ có thể đánh giá sau khi đơn hàng đã hoàn thành"));
    }

    @Test
    @DisplayName("Thất bại: Đơn hàng hoàn thành quá 24 giờ")
    void submitOrderReview_Expired24Hours_ThrowsBadRequest() {
        // Hoàn thành cách đây 25 tiếng
        completedOrder.setStatusLogs(List.of(
                new OrderClientDto.OrderStatusLogClientDto("COMPLETED", LocalDateTime.now().minusHours(25))
        ));
        when(reviewRepository.existsByOrderId(100L)).thenReturn(false);
        when(orderClient.getOrderById(100L, "1", "ROLE_CUSTOMER"))
                .thenReturn(ApiResponse.success(completedOrder));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> reviewService.submitOrderReview(validRequest, 1L));

        assertTrue(ex.getMessage().contains("quá thời hạn 24 giờ"));
    }

    @Test
    @DisplayName("Kiểm tra điều kiện đánh giá: Đủ điều kiện và tính thời gian còn lại")
    void checkEligibility_Eligible() {
        when(reviewRepository.existsByOrderId(100L)).thenReturn(false);
        when(orderClient.getOrderById(100L, "1", "ROLE_CUSTOMER"))
                .thenReturn(ApiResponse.success(completedOrder));

        OrderReviewEligibilityDto dto = reviewService.checkEligibility(100L, 1L);

        assertTrue(dto.getCanReview());
        assertFalse(dto.getIsReviewed());
        assertTrue(dto.getRemainingSeconds() > 0);
    }

    @Test
    @DisplayName("Tách biệt: Đánh giá riêng Nhà hàng thành công")
    void submitRestaurantReview_Success() {
        com.foodthunder.review.dto.request.SubmitRestaurantReviewRequest req =
                com.foodthunder.review.dto.request.SubmitRestaurantReviewRequest.builder()
                        .orderId(100L)
                        .rating(5)
                        .comment("Món ăn rất ngon")
                        .foodItemId(10L)
                        .build();

        when(reviewRepository.existsByOrderIdAndTargetType(100L, "RESTAURANT")).thenReturn(false);
        when(orderClient.getOrderById(100L, "1", "ROLE_CUSTOMER"))
                .thenReturn(ApiResponse.success(completedOrder));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(10L);
            r.setCreatedAt(LocalDateTime.now());
            return r;
        });

        ReviewResponseDto res = reviewService.submitRestaurantReview(req, 1L);

        assertNotNull(res);
        assertEquals("RESTAURANT", res.getTargetType());
        assertEquals(5, res.getRating());
    }

    @Test
    @DisplayName("Tách biệt: Đánh giá riêng Tài xế thành công với Quick Tags")
    void submitDriverReview_Success() {
        com.foodthunder.review.dto.request.SubmitDriverReviewRequest req =
                com.foodthunder.review.dto.request.SubmitDriverReviewRequest.builder()
                        .orderId(100L)
                        .rating(5)
                        .comment("Giao nhanh lắm")
                        .quickTags(List.of("Giao đúng giờ", "Thân thiện"))
                        .build();

        when(reviewRepository.existsByOrderIdAndTargetType(100L, "DRIVER")).thenReturn(false);
        when(orderClient.getOrderById(100L, "1", "ROLE_CUSTOMER"))
                .thenReturn(ApiResponse.success(completedOrder));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(20L);
            r.setCreatedAt(LocalDateTime.now());
            return r;
        });

        ReviewResponseDto res = reviewService.submitDriverReview(req, 1L);

        assertNotNull(res);
        assertEquals("DRIVER", res.getTargetType());
        assertEquals(8L, res.getTargetId());
        assertTrue(res.getComment().contains("[Giao đúng giờ, Thân thiện]"));
    }

    @Test
    @DisplayName("Tách biệt: Trạng thái chi tiết cho phép review tài xế khi quán đã review")
    void getOrderReviewStatus_SeparateStates() {
        when(orderClient.getOrderById(100L, "1", "ROLE_CUSTOMER"))
                .thenReturn(ApiResponse.success(completedOrder));
        when(reviewRepository.existsByOrderIdAndTargetType(100L, "RESTAURANT")).thenReturn(true);
        when(reviewRepository.existsByOrderIdAndTargetType(100L, "DRIVER")).thenReturn(false);

        com.foodthunder.review.dto.response.OrderReviewStatusDto status =
                reviewService.getOrderReviewStatus(100L, 1L);

        assertTrue(status.getIsRestaurantReviewed());
        assertFalse(status.getIsDriverReviewed());
        assertFalse(status.getCanReviewRestaurant());
        assertTrue(status.getCanReviewDriver());
    }
}
