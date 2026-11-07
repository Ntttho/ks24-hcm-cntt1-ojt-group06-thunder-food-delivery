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
import com.foodthunder.restaurant.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final ShopRepository shopRepository;

    @Override
    @Transactional
    public VoucherDto createVoucher(CreateVoucherRequest request, Integer requesterUserId, String role) {
        String code = request.getCode().trim().toUpperCase();

        if (voucherRepository.existsByCodeIgnoreCase(code)) {
            throw new ConflictException("Mã voucher '" + code + "' đã tồn tại trong hệ thống");
        }

        String discountType = request.getDiscountType().trim().toUpperCase();
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

        // Restaurant check
        Integer restaurantId = request.getRestaurantId();
        if (restaurantId != null) {
            Shop shop = shopRepository.findByIdAndDeletedAtIsNull(restaurantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + restaurantId));

            if (role != null && role.contains("MERCHANT") && requesterUserId != null) {
                if (!shop.getOwnerId().equals(requesterUserId)) {
                    throw new ForbiddenException("Bạn không có quyền tạo voucher cho quán khác (Chủ quán: " + shop.getOwnerId() + ")");
                }
            }
        }

        Voucher voucher = Voucher.builder()
                .restaurantId(restaurantId)
                .code(code)
                .discountType(discountType)
                .discountValue(request.getDiscountValue())
                .discountAmount(request.getDiscountValue()) // Default nominal amount
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
        String code = request.getCode() != null ? request.getCode().trim().toUpperCase() : "";
        Optional<Voucher> voucherOpt = voucherRepository.findByCodeIgnoreCase(code);

        if (voucherOpt.isEmpty() || !Boolean.TRUE.equals(voucherOpt.get().getIsActive())) {
            return VoucherValidationResponse.builder()
                    .code(code)
                    .isValid(false)
                    .message("Mã voucher không tồn tại hoặc đã ngừng áp dụng")
                    .build();
        }

        Voucher voucher = voucherOpt.get();
        LocalDateTime now = LocalDateTime.now();

        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            return VoucherValidationResponse.builder()
                    .voucherId(voucher.getId())
                    .code(voucher.getCode())
                    .isValid(false)
                    .message("Mã voucher chưa đến thời gian áp dụng (Bắt đầu từ: " + voucher.getStartDate() + ")")
                    .build();
        }

        if (voucher.getExpiryDate() != null && now.isAfter(voucher.getExpiryDate())) {
            return VoucherValidationResponse.builder()
                    .voucherId(voucher.getId())
                    .code(voucher.getCode())
                    .isValid(false)
                    .message("Mã voucher đã hết hạn sử dụng")
                    .build();
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return VoucherValidationResponse.builder()
                    .voucherId(voucher.getId())
                    .code(voucher.getCode())
                    .isValid(false)
                    .message("Mã voucher đã hết lượt sử dụng")
                    .build();
        }

        if (voucher.getRestaurantId() != null) {
            if (request.getRestaurantId() == null || !voucher.getRestaurantId().equals(request.getRestaurantId())) {
                return VoucherValidationResponse.builder()
                        .voucherId(voucher.getId())
                        .code(voucher.getCode())
                        .isValid(false)
                        .message("Mã voucher chỉ áp dụng cho quán ăn ID: " + voucher.getRestaurantId())
                        .build();
            }
        }

        BigDecimal minOrder = voucher.getMinOrderValue() != null ? voucher.getMinOrderValue() : BigDecimal.ZERO;
        BigDecimal orderAmount = request.getOrderAmount() != null ? request.getOrderAmount() : BigDecimal.ZERO;

        if (orderAmount.compareTo(minOrder) < 0) {
            return VoucherValidationResponse.builder()
                    .voucherId(voucher.getId())
                    .code(voucher.getCode())
                    .minOrderValue(minOrder)
                    .isValid(false)
                    .message("Đơn hàng chưa đạt giá trị tối thiểu " + minOrder + "đ để áp dụng voucher này")
                    .build();
        }

        BigDecimal discountAmount;
        if ("PERCENTAGE".equalsIgnoreCase(voucher.getDiscountType())) {
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
                .code(voucher.getCode())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .discountAmount(discountAmount)
                .minOrderValue(minOrder)
                .isValid(true)
                .message("Áp dụng mã voucher thành công")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherDto> getVouchers(Integer restaurantId) {
        List<Voucher> vouchers;
        if (restaurantId != null) {
            vouchers = voucherRepository.findByRestaurantIdOrRestaurantIdIsNull(restaurantId);
        } else {
            vouchers = voucherRepository.findAll();
        }
        return vouchers.stream()
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

        String discountType = request.getDiscountType() != null ? request.getDiscountType().trim().toUpperCase() : voucher.getDiscountType();
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

    private void validateOwnership(Voucher voucher, Integer requesterUserId, String role) {
        if (role != null && role.contains("ADMIN")) {
            return;
        }
        if (voucher.getRestaurantId() != null && role != null && role.contains("MERCHANT") && requesterUserId != null) {
            Shop shop = shopRepository.findByIdAndDeletedAtIsNull(voucher.getRestaurantId())
                    .orElse(null);
            if (shop != null && !shop.getOwnerId().equals(requesterUserId)) {
                throw new ForbiddenException("Bạn không có quyền quản lý voucher của quán này");
            }
        }
    }

    private VoucherDto mapToDto(Voucher v) {
        return VoucherDto.builder()
                .id(v.getId())
                .restaurantId(v.getRestaurantId())
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

