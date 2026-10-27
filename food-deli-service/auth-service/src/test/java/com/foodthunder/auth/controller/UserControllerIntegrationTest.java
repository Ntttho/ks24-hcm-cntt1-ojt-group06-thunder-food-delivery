package com.foodthunder.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.auth.dto.UpdateProfileRequest;
import com.foodthunder.auth.dto.UserDto;
import com.foodthunder.auth.security.JwtProvider;
import com.foodthunder.auth.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtProvider jwtProvider;

    @Test
    @DisplayName("GET /api/v1/users/me returns 200 with current user profile")
    void getMe_authenticated_returns200() throws Exception {
        UserDto userDto = UserDto.builder()
                .id(1L)
                .phone("0987654321")
                .fullName("Customer Demo")
                .ratingAvg(new BigDecimal("4.80"))
                .roles(Set.of("CUSTOMER"))
                .role("CUSTOMER")
                .createdAt(LocalDateTime.now())
                .build();

        when(authService.getProfile(1L)).thenReturn(userDto);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.phone").value("0987654321"))
                .andExpect(jsonPath("$.data.fullName").value("Customer Demo"));
    }

    @Test
    @DisplayName("PUT /api/v1/users/me updates profile name and returns 200")
    void updateMe_validRequest_returns200() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("New Customer Name");

        UserDto updatedDto = UserDto.builder()
                .id(1L)
                .phone("0987654321")
                .fullName("New Customer Name")
                .roles(Set.of("CUSTOMER"))
                .role("CUSTOMER")
                .createdAt(LocalDateTime.now())
                .build();

        when(authService.updateProfile(eq(1L), any(UpdateProfileRequest.class))).thenReturn(updatedDto);

        mockMvc.perform(put("/api/v1/users/me")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.fullName").value("New Customer Name"));
    }
}
