package com.foodthunder.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.auth.dto.*;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtProvider jwtProvider;

    @Test
    @DisplayName("POST /api/v1/auth/login returns 200 and AuthResponse")
    void login_validCredentials_returns200() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .phone("0987654321")
                .password("Password@123")
                .build();

        UserDto userDto = UserDto.builder()
                .id(1L)
                .phone("0987654321")
                .fullName("Nguyen Van A")
                .ratingAvg(new BigDecimal("5.00"))
                .roles(Set.of("CUSTOMER"))
                .role("CUSTOMER")
                .createdAt(LocalDateTime.now())
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .token("mocked.jwt.token")
                .user(userDto)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.data.user.phone").value("0987654321"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login returns 400 when missing mandatory fields")
    void login_missingPassword_returns400() throws Exception {
        LoginRequest invalidRequest = LoginRequest.builder()
                .phone("0987654321")
                .password("") // empty password
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register returns 201 Created")
    void register_validPayload_returns201() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .phone("0912345678")
                .password("Secret@123")
                .fullName("Tran Thi B")
                .role("CUSTOMER")
                .build();

        UserDto userDto = UserDto.builder()
                .id(2L)
                .phone("0912345678")
                .fullName("Tran Thi B")
                .roles(Set.of("CUSTOMER"))
                .role("CUSTOMER")
                .createdAt(LocalDateTime.now())
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .token("register.jwt.token")
                .user(userDto)
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.token").value("register.jwt.token"))
                .andExpect(jsonPath("$.data.user.phone").value("0912345678"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me returns 200 with X-User-Id header")
    void getMe_withGatewayHeader_returns200() throws Exception {
        UserDto userDto = UserDto.builder()
                .id(1L)
                .phone("0987654321")
                .fullName("Nguyen Van A")
                .roles(Set.of("CUSTOMER"))
                .role("CUSTOMER")
                .createdAt(LocalDateTime.now())
                .build();

        when(authService.getProfile(eq(1L))).thenReturn(userDto);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.fullName").value("Nguyen Van A"));
    }
}
