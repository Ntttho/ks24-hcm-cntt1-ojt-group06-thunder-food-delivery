package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateVoucherRequest;
import com.foodthunder.restaurant.dto.ValidateVoucherRequest;
import com.foodthunder.restaurant.dto.VoucherDto;
import com.foodthunder.restaurant.dto.VoucherValidationResponse;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.entity.Voucher;
import com.foodthunder.restaurant.exception.BadRequestException;
import com.foodthunder.restaurant.exception.ConflictException;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.repository.ShopRepository;
import com.foodthunder.restaurant.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoucherServiceTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private VoucherServiceImpl voucherService;

    private Shop sampleShop;
    private Voucher sampleVoucher;

    @BeforeEach
    void setUp() {
        sampleShop = Shop.builder()
                .id(1)
                .ownerId(3)
                .name("Quán Ăn Hạnh Dung")
                .isOpen(true)
                .approvalStatus("APPROVED")
                .build();

        sampleVoucher = Voucher.builder()
                .id(10)
                .restaurantId(1)
                .code("HANHDUNG20")
                .discountType("FIXED")
                .discountValue(BigDecimal.valueOf(20000))
                .discountAmount(BigDecimal.valueOf(20000))
                .minOrderValue(BigDecimal.valueOf(80000))
                .usageLimit(100)
                .usedCount(0)
                .startDate(LocalDateTime.now().minusDays(1))
                .expiryDate(LocalDateTime.now().plusDays(30))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Tạo voucher FIXED thành công khi chủ quán tạo mã riêng")
    void createVoucher_fixedDiscount_success() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .restaurantId(1)
                .code("SALE20")
                .discountType("FIXED")
                .discountValue(BigDecimal.valueOf(20000))
                .minOrderValue(BigDecimal.valueOf(50000))
                .expiryDate(LocalDateTime.now().plusDays(10))
                .build();

        when(voucherRepository.existsByCodeIgnoreCase("SALE20")).thenReturn(false);
        when(shopRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(sampleShop));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> {
            Voucher v = invocation.getArgument(0);
            v.setId(99);
            return v;
        });

        VoucherDto dto = voucherService.createVoucher(request, 3, "ROLE_MERCHANT");

        assertThat(dto).isNotNull();
        assertThat(dto.getCode()).isEqualTo("SALE20");
        assertThat(dto.getDiscountType()).isEqualTo("FIXED");
        assertThat(dto.getDiscountValue()).isEqualByComparingTo(BigDecimal.valueOf(20000));
        verify(voucherRepository).save(any(Voucher.class));
    }

    @Test
    @DisplayName("Tạo voucher PERCENTAGE thành công có giới hạn giảm tối đa")
    void createVoucher_percentageDiscount_success() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .restaurantId(1)
                .code("GIAM10PT")
                .discountType("PERCENTAGE")
                .discountValue(BigDecimal.valueOf(10))
                .maxDiscountAmount(BigDecimal.valueOf(30000))
                .minOrderValue(BigDecimal.valueOf(50000))
                .expiryDate(LocalDateTime.now().plusDays(10))
                .build();

        when(voucherRepository.existsByCodeIgnoreCase("GIAM10PT")).thenReturn(false);
        when(shopRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(sampleShop));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> {
            Voucher v = invocation.getArgument(0);
            v.setId(100);
            return v;
        });

        VoucherDto dto = voucherService.createVoucher(request, 3, "ROLE_MERCHANT");

        assertThat(dto).isNotNull();
        assertThat(dto.getCode()).isEqualTo("GIAM10PT");
        assertThat(dto.getDiscountType()).isEqualTo("PERCENTAGE");
        assertThat(dto.getMaxDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(30000));
    }

    @Test
    @DisplayName("Ném ConflictException khi tạo mã voucher đã tồn tại")
    void createVoucher_duplicateCode_throwsConflict() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .code("FREESHIP")
                .discountType("FIXED")
                .discountValue(BigDecimal.valueOf(15000))
                .expiryDate(LocalDateTime.now().plusDays(5))
                .build();

        when(voucherRepository.existsByCodeIgnoreCase("FREESHIP")).thenReturn(true);

        assertThatThrownBy(() -> voucherService.createVoucher(request, 1, "ROLE_ADMIN"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    @DisplayName("Ném BadRequestException khi tỷ lệ % vượt quá 100")
    void createVoucher_invalidPercentage_throwsBadRequest() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .code("GIAM150")
                .discountType("PERCENTAGE")
                .discountValue(BigDecimal.valueOf(150))
                .expiryDate(LocalDateTime.now().plusDays(5))
                .build();

        when(voucherRepository.existsByCodeIgnoreCase("GIAM150")).thenReturn(false);

        assertThatThrownBy(() -> voucherService.createVoucher(request, 1, "ROLE_ADMIN"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("từ 1 đến 100");
    }

    @Test
    @DisplayName("Ném ForbiddenException khi chủ quán tạo voucher cho quán của người khác")
    void createVoucher_merchantNotOwner_throwsForbidden() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .restaurantId(1)
                .code("HACKVOUCHER")
                .discountType("FIXED")
                .discountValue(BigDecimal.valueOf(50000))
                .expiryDate(LocalDateTime.now().plusDays(5))
                .build();

        when(voucherRepository.existsByCodeIgnoreCase("HACKVOUCHER")).thenReturn(false);
        when(shopRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(sampleShop)); // Owner is 3

        assertThatThrownBy(() -> voucherService.createVoucher(request, 99, "ROLE_MERCHANT")) // Requester is 99
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("không có quyền");
    }

    @Test
    @DisplayName("Validate voucher FIXED thành công khi đủ điều kiện")
    void validateVoucher_fixed_success() {
        when(voucherRepository.findByCodeIgnoreCase("HANHDUNG20")).thenReturn(Optional.of(sampleVoucher));

        ValidateVoucherRequest req = ValidateVoucherRequest.builder()
                .code("HANHDUNG20")
                .restaurantId(1)
                .orderAmount(BigDecimal.valueOf(100000))
                .build();

        VoucherValidationResponse res = voucherService.validateVoucher(req);

        assertThat(res.getIsValid()).isTrue();
        assertThat(res.getDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(20000));
        assertThat(res.getMessage()).contains("thành công");
    }

    @Test
    @DisplayName("Validate voucher PERCENTAGE thành công và bị giới hạn trần bởi maxDiscountAmount")
    void validateVoucher_percentageCapped_success() {
        Voucher percentVoucher = Voucher.builder()
                .id(20)
                .restaurantId(1)
                .code("GIAM20PT")
                .discountType("PERCENTAGE")
                .discountValue(BigDecimal.valueOf(20))
                .maxDiscountAmount(BigDecimal.valueOf(25000)) // Max 25,000 VND
                .minOrderValue(BigDecimal.valueOf(50000))
                .expiryDate(LocalDateTime.now().plusDays(10))
                .isActive(true)
                .build();

        when(voucherRepository.findByCodeIgnoreCase("GIAM20PT")).thenReturn(Optional.of(percentVoucher));

        // Order 200,000 VND -> 20% is 40,000 VND, capped at 25,000 VND
        ValidateVoucherRequest req = ValidateVoucherRequest.builder()
                .code("GIAM20PT")
                .restaurantId(1)
                .orderAmount(BigDecimal.valueOf(200000))
                .build();

        VoucherValidationResponse res = voucherService.validateVoucher(req);

        assertThat(res.getIsValid()).isTrue();
        assertThat(res.getDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(25000));
    }

    @Test
    @DisplayName("Validate voucher thất bại khi chưa đạt giá trị đơn tối thiểu")
    void validateVoucher_minOrderNotMet_returnsInvalid() {
        when(voucherRepository.findByCodeIgnoreCase("HANHDUNG20")).thenReturn(Optional.of(sampleVoucher));

        ValidateVoucherRequest req = ValidateVoucherRequest.builder()
                .code("HANHDUNG20")
                .restaurantId(1)
                .orderAmount(BigDecimal.valueOf(50000)) // Min is 80,000
                .build();

        VoucherValidationResponse res = voucherService.validateVoucher(req);

        assertThat(res.getIsValid()).isFalse();
        assertThat(res.getMessage()).contains("chưa đạt giá trị tối thiểu");
    }

    @Test
    @DisplayName("Validate voucher thất bại khi áp dụng vào quán khác")
    void validateVoucher_restaurantMismatch_returnsInvalid() {
        when(voucherRepository.findByCodeIgnoreCase("HANHDUNG20")).thenReturn(Optional.of(sampleVoucher));

        ValidateVoucherRequest req = ValidateVoucherRequest.builder()
                .code("HANHDUNG20")
                .restaurantId(2) // Voucher belongs to restaurant 1
                .orderAmount(BigDecimal.valueOf(100000))
                .build();

        VoucherValidationResponse res = voucherService.validateVoucher(req);

        assertThat(res.getIsValid()).isFalse();
        assertThat(res.getMessage()).contains("chỉ áp dụng cho quán ăn ID: 1");
    }

    @Test
    @DisplayName("Validate voucher thất bại khi voucher đã hết hạn")
    void validateVoucher_expired_returnsInvalid() {
        sampleVoucher.setExpiryDate(LocalDateTime.now().minusDays(1));
        when(voucherRepository.findByCodeIgnoreCase("HANHDUNG20")).thenReturn(Optional.of(sampleVoucher));

        ValidateVoucherRequest req = ValidateVoucherRequest.builder()
                .code("HANHDUNG20")
                .restaurantId(1)
                .orderAmount(BigDecimal.valueOf(100000))
                .build();

        VoucherValidationResponse res = voucherService.validateVoucher(req);

        assertThat(res.getIsValid()).isFalse();
        assertThat(res.getMessage()).contains("hết hạn");
    }

    @Test
    @DisplayName("Cập nhật trạng thái voucher (bật/tắt) thành công")
    void updateVoucherStatus_success() {
        when(voucherRepository.findById(10)).thenReturn(Optional.of(sampleVoucher));
        when(shopRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(sampleShop));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(i -> i.getArgument(0));

        VoucherDto updated = voucherService.updateVoucherStatus(10, false, 3, "ROLE_MERCHANT");

        assertThat(updated.getIsActive()).isFalse();
        verify(voucherRepository).save(sampleVoucher);
    }

    @Test
    @DisplayName("Xoá voucher thành công khi chủ quán yêu cầu")
    void deleteVoucher_success() {
        when(voucherRepository.findById(10)).thenReturn(Optional.of(sampleVoucher));
        when(shopRepository.findByIdAndDeletedAtIsNull(1)).thenReturn(Optional.of(sampleShop));

        voucherService.deleteVoucher(10, 3, "ROLE_MERCHANT");

        verify(voucherRepository).delete(sampleVoucher);
    }
}
