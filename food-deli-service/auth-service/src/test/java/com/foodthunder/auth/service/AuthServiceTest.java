package com.foodthunder.auth.service;

import com.foodthunder.auth.dto.AuthResponse;
import com.foodthunder.auth.dto.LoginRequest;
import com.foodthunder.auth.dto.RegisterRequest;
import com.foodthunder.auth.dto.UpdateProfileRequest;
import com.foodthunder.auth.dto.UserDto;
import com.foodthunder.auth.exception.ConflictException;
import com.foodthunder.auth.exception.ResourceNotFoundException;
import com.foodthunder.auth.exception.UnauthorizedException;
import com.foodthunder.auth.model.Role;
import com.foodthunder.auth.model.User;
import com.foodthunder.auth.repository.RoleRepository;
import com.foodthunder.auth.repository.UserRepository;
import com.foodthunder.auth.security.JwtProvider;
import com.foodthunder.auth.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        customerRole = Role.builder().id(1).name("CUSTOMER").build();
        sampleUser = User.builder()
                .id(1L)
                .phone("0987654321")
                .password("$2a$10$hashedpassword")
                .fullName("Nguyen Van A")
                .ratingAvg(new BigDecimal("5.00"))
                .roles(new HashSet<>(Set.of(customerRole)))
                .build();
    }

    @Test
    @DisplayName("login: returns token and userDto on valid credentials")
    void login_validCredentials_success() {
        LoginRequest request = LoginRequest.builder()
                .phone("0987654321")
                .password("Password@123")
                .build();

        when(userRepository.findByPhone("0987654321")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password@123", "$2a$10$hashedpassword")).thenReturn(true);
        when(jwtProvider.generateToken(eq(sampleUser), any())).thenReturn("mocked.jwt.token");

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("mocked.jwt.token");
        assertThat(response.user().phone()).isEqualTo("0987654321");
        assertThat(response.user().fullName()).isEqualTo("Nguyen Van A");
    }

    @Test
    @DisplayName("login: throws UnauthorizedException when user does not exist")
    void login_userNotFound_throwsUnauthorized() {
        LoginRequest request = LoginRequest.builder()
                .phone("0999999999")
                .password("Password@123")
                .build();

        when(userRepository.findByPhone("0999999999")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid phone number or password");
    }

    @Test
    @DisplayName("login: throws UnauthorizedException on password mismatch")
    void login_wrongPassword_throwsUnauthorized() {
        LoginRequest request = LoginRequest.builder()
                .phone("0987654321")
                .password("WrongPassword")
                .build();

        when(userRepository.findByPhone("0987654321")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "$2a$10$hashedpassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid phone number or password");
    }

    @Test
    @DisplayName("register: creates user and returns token when phone is unique")
    void register_success() {
        RegisterRequest request = RegisterRequest.builder()
                .phone("0912345678")
                .password("Secret@123")
                .fullName("Tran Thi B")
                .role("CUSTOMER")
                .build();

        when(userRepository.existsByPhone("0912345678")).thenReturn(false);
        when(roleRepository.findByName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("Secret@123")).thenReturn("$2a$10$encodedpassword");

        User savedUser = User.builder()
                .id(2L)
                .phone("0912345678")
                .password("$2a$10$encodedpassword")
                .fullName("Tran Thi B")
                .ratingAvg(new BigDecimal("5.00"))
                .roles(new HashSet<>(Set.of(customerRole)))
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtProvider.generateToken(any(User.class), eq("CUSTOMER"))).thenReturn("new.user.jwt.token");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("new.user.jwt.token");
        assertThat(response.user().id()).isEqualTo(2L);
        assertThat(response.user().phone()).isEqualTo("0912345678");
    }

    @Test
    @DisplayName("register: throws ConflictException when phone is already registered")
    void register_duplicatePhone_throwsConflict() {
        RegisterRequest request = RegisterRequest.builder()
                .phone("0987654321")
                .password("Secret@123")
                .fullName("Duplicate User")
                .build();

        when(userRepository.existsByPhone("0987654321")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    @DisplayName("getProfile: returns UserDto when user exists")
    void getProfile_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        UserDto dto = authService.getProfile(1L);

        assertThat(dto).isNotNull();
        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.fullName()).isEqualTo("Nguyen Van A");
    }

    @Test
    @DisplayName("getProfile: throws ResourceNotFoundException when user does not exist")
    void getProfile_notFound_throwsNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getProfile(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("updateProfile: updates fullName and saves user")
    void updateProfile_success() {
        UpdateProfileRequest request = new UpdateProfileRequest("Nguyen Van A Updated");
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserDto updated = authService.updateProfile(1L, request);

        assertThat(updated).isNotNull();
        assertThat(sampleUser.getFullName()).isEqualTo("Nguyen Van A Updated");
    }
}
