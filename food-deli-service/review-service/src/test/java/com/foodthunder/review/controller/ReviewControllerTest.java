package com.foodthunder.review.controller;

import com.foodthunder.review.exception.ForbiddenException;
import com.foodthunder.review.exception.UnauthorizedException;
import com.foodthunder.review.service.ReviewService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class ReviewControllerTest {

    @Mock
    private ReviewService reviewService;

    @InjectMocks
    private ReviewController reviewController;

    @Test
    @DisplayName("Admin can delete a review")
    void deleteAdminReview_adminDeletesSuccessfully() {
        var response = reviewController.deleteAdminReview(10L, "ROLE_ADMIN");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reviewService).deleteReview(10L);
    }

    @Test
    @DisplayName("Admin without ROLE_ prefix can delete a review")
    void deleteAdminReview_adminWithoutRolePrefix_success() {
        var response = reviewController.deleteAdminReview(11L, "ADMIN");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reviewService).deleteReview(11L);
    }

    @Test
    @DisplayName("Admin without ROLE_ prefix can get all admin reviews")
    void getAdminReviews_adminWithoutRolePrefix_success() {
        var response = reviewController.getAdminReviews(null, null, null, null, 0, 10, "ADMIN");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reviewService).getAdminReviews(null, null, null, null, 0, 10);
    }

    @Test
    @DisplayName("Merchant without ROLE_ prefix can get merchant reviews")
    void getMerchantReviews_merchantWithoutRolePrefix_success() {
        var response = reviewController.getMerchantReviews(1L, null, null, null, 0, 10, "3", "MERCHANT");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reviewService).getRestaurantReviews(1L, null, null, null, 0, 10);
    }

    @Test
    @DisplayName("Customer role cannot access merchant reviews (403 Forbidden)")
    void getMerchantReviews_customerRole_forbidden() {
        assertThrows(ForbiddenException.class,
                () -> reviewController.getMerchantReviews(1L, null, null, null, 0, 10, "1", "CUSTOMER"));

        verifyNoInteractions(reviewService);
    }

    @Test
    @DisplayName("Driver without ROLE_ prefix can get driver reviews")
    void getDriverReviews_driverWithoutRolePrefix_success() {
        var response = reviewController.getDriverReviews(null, null, null, 0, 10, "2", "DRIVER");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reviewService).getDriverReviews(2L, null, null, null, 0, 10);
    }

    @Test
    @DisplayName("Missing role is rejected before deleting a review")
    void deleteAdminReview_missingRoleIsUnauthorized() {
        assertThrows(UnauthorizedException.class,
                () -> reviewController.deleteAdminReview(10L, null));

        verifyNoInteractions(reviewService);
    }

    @Test
    @DisplayName("A role containing the admin text is not treated as an admin role")
    void deleteAdminReview_nonAdminRoleIsForbidden() {
        assertThrows(ForbiddenException.class,
                () -> reviewController.deleteAdminReview(10L, "ROLE_NOT_ADMIN"));

        verifyNoInteractions(reviewService);
    }
}
