package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateVoucherRequest;
import com.foodthunder.restaurant.dto.UpdateVoucherRequest;
import com.foodthunder.restaurant.dto.ValidateVoucherRequest;
import com.foodthunder.restaurant.dto.VoucherDto;
import com.foodthunder.restaurant.dto.VoucherValidationResponse;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.entity.Voucher;
import com.foodthunder.restaurant.exception.BadRequestException;
import com.foodthunder.restaurant.exception.ConflictException;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.ShopRepository;
import com.foodthunder.restaurant.repository.VoucherCategoryRepository;
import com.foodthunder.restaurant.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private static final String DEFAULT_VOUCHER_CATEGORY = "DISCOUNT_FOOD";

    private final VoucherRepository voucherRepository;
    private final ShopRepository shopRepository;

    @Autowired(required = false)
    private VoucherCategoryRepository voucherCategoryRepository;

    @Override
    @Transactional
    public VoucherDto createVoucher(CreateVoucherRequest request, Integer requesterUserId, String role) {
        String code = request.getCode().trim().toUpperCase(Locale.ROOT);

        if (voucherRepository.existsByCodeIgnoreCase(code)) {
            throw new ConflictException("Mã voucher '" + code + "' đã tồn tại trong hệ thống");
        }

        String discountType = request.getDiscountType().trim().toUpperCase(Locale.ROOT);
        if ("PERCENTAGE".equals(discountType)) {
            if (request.getDiscountValue().compareTo(BigDecimal.ONE) < 0
                    || request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BadRequestException("Tỷ lệ giảm giá (%) phải nằm trong khoảng từ 1 đến 100");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        if (request.getExpiryDate().isBefore(now)) {
            throw new BadRequestException("Ngày hết hạn phải sau thời điểm hiện tại");
        }

        if (request.getStartDate() != null && request.getExpiryDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Ngày hết hạn phải sau ngày bắt đầu có hiệu lực");
        }

        String voucherCategory = resolveAndValidateCategory(request.getVoucherCategory(), true);

        // Scope & permission check
        Integer restaurantId = request.getRestaurantId();
        if (restaurantId == null) {
            if (!isAdminRole(role)) {
                throw new ForbiddenException("Chỉ Quản trị viên (Admin) mới có quyền tạo Voucher toàn hệ thống");
            }
        } else {
            Shop shop = shopRepository.findByIdAndDeletedAtIsNull(restaurantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + restaurantId));

            if (!"APPROVED".equalsIgnoreCase(shop.getApprovalStatus())) {
                throw new BadRequestException("Quán ăn '" + shop.getName() + "' chưa được Ban Quản Trị phê duyệt, không thể tạo voucher!");
            }

            if (!isAdminRole(role)) {
                if (role != null && role.toUpperCase(Locale.ROOT).contains("MERCHANT") && requesterUserId != null) {
                    if (!shop.getOwnerId().equals(requesterUserId)) {
                        throw new ForbiddenException("Bạn không có quyền tạo voucher cho quán khác (Chủ quán: " + shop.getOwnerId() + ")");
                    }
                } else {
                    throw new ForbiddenException("Bạn không có quyền tạo voucher cho quán này");
                }
            }
        }

        Voucher voucher = Voucher.builder()
                .restaurantId(restaurantId)
                .voucherCategory(voucherCategory)
                .code(code)
                .discountType(discountType)
                .discountValue(request.getDiscountValue())
                .discountAmount(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO)
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .startDate(request.getStartDate())
                .expiryDate(request.getExpiryDate())
                .isActive(true)
                .build();

        Voucher saved = voucherRepository.save(voucher);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherValidationResponse validateVoucher(ValidateVoucherRequest request) {
        String code = request.getCode() != null ? request.getCode().trim().toUpperCase(Locale.ROOT) : "";
        Optional<Voucher> voucherOpt = voucherRepository.findByCodeIgnoreCase(code);

        if (voucherOpt.isEmpty() || !Boolean.TRUE.equals(voucherOpt.get().getIsActive())) {
            return VoucherValidationResponse.builder()
                    .code(code)
                    .isValid(false)
                    .message("Mã voucher không tồn tại hoặc đã ngừng áp dụng")
                    .build();
        }

        Voucher voucher = voucherOpt.get();
        String category = normalizeCategory(voucher.getVoucherCategory());
        boolean isSystemVoucher = voucher.getRestaurantId() == null;
        LocalDateTime now = LocalDateTime.now();

        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            return invalidResponse(voucher, "Mã voucher chưa đến thời gian áp dụng (Bắt đầu từ: " + voucher.getStartDate() + ")");
        }

        if (voucher.getExpiryDate() != null && now.isAfter(voucher.getExpiryDate())) {
            return invalidResponse(voucher, "Mã voucher đã hết hạn sử dụng");
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return invalidResponse(voucher, "Mã voucher đã hết lượt sử dụng");
        }

        // System-wide voucher (restaurantId == null) applies to any restaurant order;
        // Shop voucher requires matching restaurantId.
        if (voucher.getRestaurantId() != null) {
            if (request.getRestaurantId() == null || !voucher.getRestaurantId().equals(request.getRestaurantId())) {
                return invalidResponse(voucher, "Mã voucher chỉ áp dụng cho quán ăn ID: " + voucher.getRestaurantId());
            }
        }

        if ("NEW_USER".equalsIgnoreCase(category) && Boolean.FALSE.equals(request.getIsNewUser())) {
            return invalidResponse(voucher, "Mã ưu đãi '" + voucher.getCode() + "' chỉ áp dụng cho đơn hàng đầu tiên của khách hàng mới");
        }

        BigDecimal minOrder = voucher.getMinOrderValue() != null ? voucher.getMinOrderValue() : BigDecimal.ZERO;
        BigDecimal orderAmount = request.getOrderAmount() != null ? request.getOrderAmount() : BigDecimal.ZERO;

        if (orderAmount.compareTo(minOrder) < 0) {
            return VoucherValidationResponse.builder()
                    .voucherId(voucher.getId())
                    .restaurantId(voucher.getRestaurantId())
                    .isSystemVoucher(isSystemVoucher)
                    .voucherCategory(category)
                    .code(voucher.getCode())
                    .minOrderValue(minOrder)
                    .isValid(false)
                    .message("Đơn hàng chưa đạt giá trị tối thiểu " + minOrder + "đ để áp dụng voucher này")
                    .build();
        }

        BigDecimal discountAmount;
        BigDecimal shippingDiscountAmount = BigDecimal.ZERO;

        if ("FREESHIP".equalsIgnoreCase(category)) {
            BigDecimal shippingBase = request.getShippingFee();
            if ("PERCENTAGE".equalsIgnoreCase(voucher.getDiscountType())) {
                if (shippingBase != null) {
                    BigDecimal calc = shippingBase.multiply(voucher.getDiscountValue())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    if (voucher.getMaxDiscountAmount() != null && calc.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                        calc = voucher.getMaxDiscountAmount();
                    }
                    discountAmount = calc.min(shippingBase);
                } else {
                    discountAmount = voucher.getMaxDiscountAmount() != null
                            ? voucher.getMaxDiscountAmount()
                            : BigDecimal.ZERO;
                }
            } else {
                discountAmount = shippingBase != null
                        ? voucher.getDiscountValue().min(shippingBase)
                        : voucher.getDiscountValue();
            }
            shippingDiscountAmount = discountAmount;
        } else if ("PERCENTAGE".equalsIgnoreCase(voucher.getDiscountType())) {
            BigDecimal calc = orderAmount.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountAmount() != null && calc.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                calc = voucher.getMaxDiscountAmount();
            }
            discountAmount = calc.min(orderAmount);
        } else {
            discountAmount = voucher.getDiscountValue().min(orderAmount);
        }

        return VoucherValidationResponse.builder()
                .voucherId(voucher.getId())
                .restaurantId(voucher.getRestaurantId())
                .isSystemVoucher(isSystemVoucher)
                .voucherCategory(category)
                .code(voucher.getCode())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .discountAmount(discountAmount)
                .shippingDiscountAmount(shippingDiscountAmount)
                .minOrderValue(minOrder)
                .isValid(true)
                .message("Áp dụng mã voucher thành công")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherDto> getVouchers(Integer restaurantId) {
        return getVouchers(restaurantId, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherDto> getVouchers(Integer restaurantId, String scope, String category, Boolean activeOnly) {
        List<Voucher> vouchers;
        String normalizedScope = scope != null ? scope.trim().toUpperCase(Locale.ROOT) : "";
        if ("SYSTEM".equals(normalizedScope)) {
            vouchers = voucherRepository.findByRestaurantIdIsNull();
        } else if ("RESTAURANT".equals(normalizedScope)) {
            if (restaurantId != null) {
                vouchers = voucherRepository.findByRestaurantId(restaurantId);
            } else {
                vouchers = voucherRepository.findAll().stream()
                        .filter(v -> v.getRestaurantId() != null)
                        .collect(Collectors.toList());
            }
        } else if (restaurantId != null) {
            vouchers = voucherRepository.findByRestaurantIdOrRestaurantIdIsNull(restaurantId);
        } else {
            vouchers = voucherRepository.findAll();
        }

        String categoryFilter = (category != null && !category.isBlank()) ? category.trim().toUpperCase(Locale.ROOT) : null;
        return vouchers.stream()
                .filter(v -> categoryFilter == null || categoryFilter.equalsIgnoreCase(normalizeCategory(v.getVoucherCategory())))
                .filter(v -> !Boolean.TRUE.equals(activeOnly) || Boolean.TRUE.equals(v.getIsActive()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherDto getVoucherById(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));
        return mapToDto(voucher);
    }

    @Override
    @Transactional
    public VoucherDto updateVoucher(Integer id, UpdateVoucherRequest request, Integer requesterUserId, String role) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        validateOwnership(voucher, requesterUserId, role);

        String discountType = request.getDiscountType() != null
                ? request.getDiscountType().trim().toUpperCase(Locale.ROOT)
                : voucher.getDiscountType();
        if ("PERCENTAGE".equals(discountType)) {
            if (request.getDiscountValue().compareTo(BigDecimal.ONE) < 0
                    || request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BadRequestException("Tỷ lệ giảm giá (%) phải nằm trong khoảng từ 1 đến 100");
            }
        }

        if (request.getStartDate() != null && request.getExpiryDate() != null
                && request.getExpiryDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Ngày hết hạn phải sau ngày bắt đầu có hiệu lực");
        }

        if (request.getVoucherCategory() != null && !request.getVoucherCategory().isBlank()) {
            voucher.setVoucherCategory(resolveAndValidateCategory(request.getVoucherCategory(), false));
        }

        voucher.setDiscountType(discountType);
        voucher.setDiscountValue(request.getDiscountValue());
        if ("FIXED".equals(discountType)) {
            voucher.setDiscountAmount(request.getDiscountValue());
        }
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        if (request.getMinOrderValue() != null) {
            voucher.setMinOrderValue(request.getMinOrderValue());
        }
        if (request.getUsageLimit() != null) {
            voucher.setUsageLimit(request.getUsageLimit());
        }
        if (request.getStartDate() != null) {
            voucher.setStartDate(request.getStartDate());
        }
        if (request.getExpiryDate() != null) {
            voucher.setExpiryDate(request.getExpiryDate());
        }
        if (request.getIsActive() != null) {
            voucher.setIsActive(request.getIsActive());
        }

        Voucher updated = voucherRepository.save(voucher);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteVoucher(Integer id, Integer requesterUserId, String role) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        validateOwnership(voucher, requesterUserId, role);
        voucherRepository.delete(voucher);
    }

    @Override
    @Transactional
    public VoucherDto toggleVoucherStatus(Integer id, Integer requesterUserId, String role) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        validateOwnership(voucher, requesterUserId, role);
        voucher.setIsActive(voucher.getIsActive() == null || !voucher.getIsActive());
        Voucher saved = voucherRepository.save(voucher);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public VoucherDto redeemVoucher(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));

        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            throw new BadRequestException("Mã voucher '" + voucher.getCode() + "' hiện đã ngừng áp dụng");
        }
        LocalDateTime now = LocalDateTime.now();
        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            throw new BadRequestException("Mã voucher '" + voucher.getCode() + "' chưa đến thời gian áp dụng");
        }
        if (voucher.getExpiryDate() != null && now.isAfter(voucher.getExpiryDate())) {
            throw new BadRequestException("Mã voucher '" + voucher.getCode() + "' đã hết hạn sử dụng");
        }

        int updatedRows = voucherRepository.incrementUsedCountIfAvailable(id);
        if (updatedRows == 0) {
            throw new BadRequestException("Mã voucher '" + voucher.getCode() + "' đã hết lượt sử dụng");
        }
        Voucher refreshed = voucherRepository.findById(id).orElse(voucher);
        return mapToDto(refreshed);
    }

    @Override
    @Transactional
    public VoucherDto releaseVoucher(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với ID: " + id));
        voucherRepository.decrementUsedCount(id);
        Voucher refreshed = voucherRepository.findById(id).orElse(voucher);
        return mapToDto(refreshed);
    }

    private void validateOwnership(Voucher voucher, Integer requesterUserId, String role) {
        if (isAdminRole(role)) {
            return;
        }
        if (voucher.getRestaurantId() == null) {
            throw new ForbiddenException("Chỉ Quản trị viên (Admin) mới có quyền quản lý Voucher toàn hệ thống");
        }
        if (role != null && role.toUpperCase(Locale.ROOT).contains("MERCHANT") && requesterUserId != null) {
            Shop shop = shopRepository.findByIdAndDeletedAtIsNull(voucher.getRestaurantId())
                    .orElse(null);
            if (shop != null && !shop.getOwnerId().equals(requesterUserId)) {
                throw new ForbiddenException("Bạn không có quyền quản lý voucher của quán này");
            }
            return;
        }
        throw new ForbiddenException("Bạn không có quyền quản lý voucher này");
    }

    private boolean isAdminRole(String role) {
        return role != null && role.toUpperCase(Locale.ROOT).contains("ADMIN");
    }

    private String resolveAndValidateCategory(String rawCategory, boolean checkActive) {
        String normalized = normalizeCategory(rawCategory);
        if (voucherCategoryRepository != null && voucherCategoryRepository.count() > 0) {
            var categoryOpt = voucherCategoryRepository.findByCodeIgnoreCase(normalized);
            if (categoryOpt.isEmpty()) {
                throw new BadRequestException("Danh mục voucher không tồn tại: " + normalized);
            }
            if (checkActive && !Boolean.TRUE.equals(categoryOpt.get().getIsActive())) {
                throw new BadRequestException("Danh mục voucher '" + normalized + "' hiện đang tạm ngừng");
            }
            return categoryOpt.get().getCode();
        }
        return normalized;
    }

    private String normalizeCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.isBlank()) {
            return DEFAULT_VOUCHER_CATEGORY;
        }
        return rawCategory.trim().toUpperCase(Locale.ROOT);
    }

    private VoucherValidationResponse invalidResponse(Voucher voucher, String message) {
        return VoucherValidationResponse.builder()
                .voucherId(voucher.getId())
                .restaurantId(voucher.getRestaurantId())
                .isSystemVoucher(voucher.getRestaurantId() == null)
                .voucherCategory(normalizeCategory(voucher.getVoucherCategory()))
                .code(voucher.getCode())
                .isValid(false)
                .message(message)
                .build();
    }

    private VoucherDto mapToDto(Voucher v) {
        return VoucherDto.builder()
                .id(v.getId())
                .restaurantId(v.getRestaurantId())
                .isSystemVoucher(v.getRestaurantId() == null)
                .voucherCategory(normalizeCategory(v.getVoucherCategory()))
                .code(v.getCode())
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .discountAmount(v.getDiscountAmount())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .minOrderValue(v.getMinOrderValue())
                .usageLimit(v.getUsageLimit())
                .usedCount(v.getUsedCount())
                .startDate(v.getStartDate())
                .expiryDate(v.getExpiryDate())
                .isActive(v.getIsActive())
                .build();
    }
}

