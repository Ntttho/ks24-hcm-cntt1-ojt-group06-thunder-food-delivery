package com.foodthunder.auth.service.impl;

import com.foodthunder.auth.dto.*;
import com.foodthunder.auth.exception.BadRequestException;
import com.foodthunder.auth.exception.ConflictException;
import com.foodthunder.auth.exception.ResourceNotFoundException;
import com.foodthunder.auth.exception.UnauthorizedException;
import com.foodthunder.auth.model.Role;
import com.foodthunder.auth.model.DriverDetails;
import com.foodthunder.auth.model.User;
import com.foodthunder.auth.repository.DriverDetailsRepository;
import com.foodthunder.auth.repository.RoleRepository;
import com.foodthunder.auth.repository.UserRepository;
import com.foodthunder.auth.security.JwtProvider;
import com.foodthunder.auth.service.AuthService;
import com.foodthunder.auth.service.UserDataCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final DriverDetailsRepository driverDetailsRepository;
    private final RoleRepository roleRepository;
    private final UserDataCleanupService userDataCleanupService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(() -> new UnauthorizedException("Invalid phone number or password"));

        boolean matches = passwordEncoder.matches(request.password(), user.getPassword());
        // Support legacy plain text migration if seed data was inserted unhashed
        if (!matches && request.password().equals(user.getPassword())) {
            log.info("Migrating plain-text password to BCrypt for user: {}", user.getPhone());
            user.setPassword(passwordEncoder.encode(request.password()));
            userRepository.save(user);
            matches = true;
        }

        if (!matches) {
            throw new UnauthorizedException("Invalid phone number or password");
        }

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        String targetRole = request.role();
        if (targetRole != null && !targetRole.isBlank()) {
            targetRole = targetRole.toUpperCase();
            if ("SHIPPER".equals(targetRole)) {
                targetRole = "DRIVER";
            }
            if (!roleNames.contains(targetRole)) {
                log.warn("User {} attempted login with unauthorized role: {}", user.getPhone(), targetRole);
                throw new UnauthorizedException("Tài khoản chưa được cấp quyền truy cập với vai trò: " + targetRole);
            }
        } else {
            targetRole = roleNames.contains("CUSTOMER") ? "CUSTOMER"
                    : (roleNames.isEmpty() ? "CUSTOMER" : roleNames.iterator().next());
        }

        String token = jwtProvider.generateToken(user, targetRole);

        UserDto userDto = toUserDto(user, targetRole);
        log.info("User {} successfully logged in with role: {}", user.getPhone(), targetRole);

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.phone())) {
            throw new ConflictException("Phone number " + request.phone() + " is already registered");
        }

        String rawRole = (request.role() != null && !request.role().isBlank())
                ? request.role().toUpperCase()
                : "CUSTOMER";

        if ("SHIPPER".equals(rawRole)) {
            rawRole = "DRIVER";
        }

        if ("ADMIN".equals(rawRole)) {
            throw new com.foodthunder.auth.exception.BadRequestException("Không được phép tự đăng ký tài khoản Quản trị viên (ADMIN)");
        }

        final String roleName = rawRole;
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));

        User user = User.builder()
                .phone(request.phone())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .ratingAvg(new BigDecimal("5.00"))
                .build();

        user.addRole(role);
        User savedUser = userRepository.save(user);

        String token = jwtProvider.generateToken(savedUser, roleName);
        UserDto userDto = toUserDto(savedUser, roleName);

        log.info("New user registered successfully: id={}, phone={}, role={}", savedUser.getId(), savedUser.getPhone(), roleName);

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return toUserDto(user, null);
    }

    @Override
    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setFullName(request.fullName());
        User updatedUser = userRepository.save(user);

        log.info("Updated profile for user id: {}", userId);
        return toUserDto(updatedUser, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDto> getUsers(String search, String role, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String roleParam = (role != null && !role.trim().isEmpty()) ? role.trim() : null;
        String statusParam = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;

        Page<User> userPage = userRepository.searchUsers(searchParam, roleParam, statusParam, pageable);
        List<UserDto> content = userPage.getContent().stream()
                .map(u -> toUserDto(u, null))
                .collect(Collectors.toList());

        return PageResponse.<UserDto>builder()
                .content(content)
                .pageNumber(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        String phone = request.phone().trim();
        if (userRepository.existsByPhone(phone)) {
            throw new ConflictException("Số điện thoại " + phone + " đã được đăng ký trên hệ thống");
        }

        Set<Role> roles = resolveRoles(request.roles(), request.role());

        User user = User.builder()
                .phone(phone)
                .fullName(request.fullName().trim())
                .email(request.email() != null && !request.email().isBlank() ? request.email().trim() : null)
                .password(passwordEncoder.encode(request.password()))
                .roles(roles)
                .ratingAvg(new BigDecimal("5.00"))
                .deletedAt("LOCKED".equalsIgnoreCase(request.status()) ? java.time.LocalDateTime.now() : null)
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created new user id={}, phone={}", saved.getId(), saved.getPhone());
        return toUserDto(saved, null);
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        if (isUserAdmin(user)) {
            throw new BadRequestException("Không được phép chỉnh sửa tài khoản có vai trò Quản trị viên (Admin)");
        }

        if (request.phone() != null && !request.phone().isBlank()) {
            String newPhone = request.phone().trim();
            if (!newPhone.equals(user.getPhone()) && userRepository.existsByPhoneAndIdNot(newPhone, id)) {
                throw new ConflictException("Số điện thoại " + newPhone + " đã được sử dụng bởi tài khoản khác");
            }
            user.setPhone(newPhone);
        }

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }

        if (request.email() != null) {
            user.setEmail(request.email().isBlank() ? null : request.email().trim());
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        if ((request.roles() != null && !request.roles().isEmpty()) || (request.role() != null && !request.role().isBlank())) {
            Set<Role> updatedRoles = resolveRoles(request.roles(), request.role());
            user.setRoles(updatedRoles);
        }

        if (request.status() != null && !request.status().isBlank()) {
            if ("LOCKED".equalsIgnoreCase(request.status())) {
                user.setDeletedAt(java.time.LocalDateTime.now());
            } else if ("ACTIVE".equalsIgnoreCase(request.status())) {
                user.setDeletedAt(null);
            }
        }

        User updated = userRepository.save(user);
        log.info("Admin updated user id={}", updated.getId());
        return toUserDto(updated, null);
    }

    @Override
    @Transactional
    public UserDto updateUserStatus(Long id, UpdateUserStatusRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        if (isUserAdmin(user)) {
            throw new BadRequestException("Không được phép khóa hoặc thay đổi trạng thái của tài khoản Quản trị viên (Admin)");
        }

        if (request.status() != null && !request.status().isBlank()) {
            if ("LOCKED".equalsIgnoreCase(request.status())) {
                user.setDeletedAt(java.time.LocalDateTime.now());
            } else if ("ACTIVE".equalsIgnoreCase(request.status())) {
                user.setDeletedAt(null);
            }
        } else if (request.isActive() != null) {
            if (Boolean.FALSE.equals(request.isActive())) {
                user.setDeletedAt(java.time.LocalDateTime.now());
            } else {
                user.setDeletedAt(null);
            }
        } else {
            if (user.getDeletedAt() == null) {
                user.setDeletedAt(java.time.LocalDateTime.now());
            } else {
                user.setDeletedAt(null);
            }
        }

        User updated = userRepository.save(user);
        log.info("Admin updated status for user id={}, isLocked={}", updated.getId(), updated.getDeletedAt() != null);
        return toUserDto(updated, null);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        if (isUserAdmin(user)) {
            throw new BadRequestException("Không được phép xóa tài khoản có vai trò Quản trị viên (Admin)");
        }

        userDataCleanupService.purgeRelatedData(id);
        if (user.getRoles() != null) {
            user.getRoles().clear();
        }
        userRepository.delete(user);
        userRepository.flush();
        userDataCleanupService.scheduleExternalCleanup(id);
        log.info("Admin permanently deleted user id={} and all related history", id);
    }

    private boolean isUserAdmin(User user) {
        if (user == null || user.getRoles() == null) {
            return false;
        }
        return user.getRoles().stream()
                .anyMatch(r -> r.getName() != null &&
                        ("ADMIN".equalsIgnoreCase(r.getName()) || "ROLE_ADMIN".equalsIgnoreCase(r.getName())));
    }

    private Set<Role> resolveRoles(List<String> rolesList, String singleRole) {
        java.util.Set<String> roleNames = new java.util.HashSet<>();
        if (rolesList != null && !rolesList.isEmpty()) {
            for (String r : rolesList) {
                if (r != null && !r.isBlank()) {
                    roleNames.add(normalizeRoleName(r));
                }
            }
        }
        if (roleNames.isEmpty() && singleRole != null && !singleRole.isBlank()) {
            roleNames.add(normalizeRoleName(singleRole));
        }
        if (roleNames.isEmpty()) {
            roleNames.add("CUSTOMER");
        }

        Set<Role> roles = new java.util.HashSet<>();
        for (String rName : roleNames) {
            Role role = roleRepository.findByName(rName)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(rName).build()));
            roles.add(role);
        }
        return roles;
    }

    private String normalizeRoleName(String raw) {
        String r = raw.trim().toUpperCase();
        if (r.startsWith("ROLE_")) {
            r = r.substring(5);
        }
        if ("SHIPPER".equals(r)) {
            r = "DRIVER";
        }
        return r;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .filter(u -> u.getDeletedAt() == null)
                .map(u -> toUserDto(u, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserAnalyticsCountsDto getAnalyticsCounts() {
        long totalUsers = userRepository.countByDeletedAtIsNull();
        long totalMerchants = userRepository.countActiveMerchants();
        return UserAnalyticsCountsDto.builder()
                .totalUsersCount(totalUsers)
                .totalMerchantsCount(totalMerchants)
                .build();
    }

    @Override
    @Transactional
    public UserDto updateRating(Long userId, BigDecimal ratingAvg) {
        if (ratingAvg == null || ratingAvg.compareTo(BigDecimal.ZERO) < 0
                || ratingAvg.compareTo(BigDecimal.valueOf(5)) > 0) {
            throw new com.foodthunder.auth.exception.BadRequestException("Điểm đánh giá phải nằm trong khoảng 0 đến 5");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng #" + userId));
        user.setRatingAvg(ratingAvg.setScale(2, java.math.RoundingMode.HALF_UP));
        return toUserDto(userRepository.save(user), null);
    }

    private UserDto toUserDto(User user, String activeRole) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        String currentRole = activeRole != null ? activeRole
                : (roleNames.contains("CUSTOMER") ? "CUSTOMER"
                : (roleNames.isEmpty() ? "CUSTOMER" : roleNames.iterator().next()));
        String licensePlate = roleNames.contains("DRIVER") || roleNames.contains("SHIPPER")
                ? driverDetailsRepository.findById(user.getId())
                        .map(DriverDetails::getLicensePlate)
                        .orElse(null)
                : null;

        String status = user.getDeletedAt() == null ? "ACTIVE" : "LOCKED";

        return UserDto.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .ratingAvg(user.getRatingAvg())
                .licensePlate(licensePlate)
                .roles(roleNames)
                .role(currentRole)
                .status(status)
                .createdAt(user.getCreatedAt())
                .deletedAt(user.getDeletedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserStatsSummaryDto getUserStatsSummary() {
        long totalUsers = userRepository.countByDeletedAtIsNull();
        long totalMerchants = userRepository.countActiveMerchants();
        return UserStatsSummaryDto.builder()
                .totalUsers(totalUsers)
                .totalMerchants(totalMerchants)
                .build();
    }
}
