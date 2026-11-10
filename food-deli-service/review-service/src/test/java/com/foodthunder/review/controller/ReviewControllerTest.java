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
