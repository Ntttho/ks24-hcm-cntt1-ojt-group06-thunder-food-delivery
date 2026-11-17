package com.foodthunder.restaurant.config;

import com.foodthunder.restaurant.entity.Voucher;
import com.foodthunder.restaurant.entity.VoucherCategory;
import com.foodthunder.restaurant.repository.VoucherCategoryRepository;
import com.foodthunder.restaurant.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * Tự động khởi tạo danh mục voucher mặc định (FREESHIP, DISCOUNT_FOOD, NEW_USER)
 * và đồng bộ dữ liệu voucher cũ chưa có voucher_category khi service khởi động.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VoucherDataInitializer implements ApplicationRunner {

    private final ObjectProvider<VoucherCategoryRepository> categoryRepositoryProvider;
    private final ObjectProvider<VoucherRepository> voucherRepositoryProvider;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        VoucherCategoryRepository catRepo = categoryRepositoryProvider.getIfAvailable();
        VoucherRepository voucherRepo = voucherRepositoryProvider.getIfAvailable();
        if (catRepo == null || voucherRepo == null) {
            return;
        }

        seedDefaultCategory(catRepo, "FREESHIP", "Miễn phí vận chuyển", "Mã ưu đãi giảm trực tiếp vào phí giao hàng");
        seedDefaultCategory(catRepo, "DISCOUNT_FOOD", "Giảm giá món ăn", "Mã giảm giá trực tiếp hoặc theo % áp dụng cho giá trị món ăn");
        seedDefaultCategory(catRepo, "NEW_USER", "Khách hàng mới", "Mã khuyến mãi đặc biệt dành riêng cho đơn hàng đầu tiên");

        List<Voucher> allVouchers = voucherRepo.findAll();
        for (Voucher v : allVouchers) {
            if (v.getVoucherCategory() == null || v.getVoucherCategory().isBlank()) {
                v.setVoucherCategory(inferDefaultCategory(v.getCode()));
                voucherRepo.save(v);
            }
        }

        if (allVouchers.isEmpty()) {
            seedSystemVoucher(voucherRepo, "FREESHIP", "FREESHIP", "FIXED", 15000, 50000);
            seedSystemVoucher(voucherRepo, "FLASHFOOD20", "DISCOUNT_FOOD", "FIXED", 20000, 80000);
            seedSystemVoucher(voucherRepo, "WELCOME50", "NEW_USER", "FIXED", 50000, 150000);
            log.info("Seeded default voucher categories and starter system vouchers");
        }
    }

    private void seedDefaultCategory(VoucherCategoryRepository repo, String code, String name, String description) {
        if (!repo.existsByCodeIgnoreCase(code)) {
            repo.save(VoucherCategory.builder()
                    .code(code)
                    .name(name)
                    .description(description)
                    .isActive(true)
                    .build());
        }
    }

    private void seedSystemVoucher(
            VoucherRepository repo,
            String code,
            String category,
            String discountType,
            long discountValue,
            long minOrderValue
    ) {
        if (!repo.existsByCodeIgnoreCase(code)) {
            repo.save(Voucher.builder()
                    .restaurantId(null)
                    .voucherCategory(category)
                    .code(code)
                    .discountType(discountType)
                    .discountValue(BigDecimal.valueOf(discountValue))
                    .discountAmount(BigDecimal.valueOf(discountValue))
                    .minOrderValue(BigDecimal.valueOf(minOrderValue))
                    .usedCount(0)
                    .expiryDate(LocalDateTime.now().plusYears(1))
                    .isActive(true)
                    .build());
        }
    }

    private String inferDefaultCategory(String code) {
        if (code == null) {
            return "DISCOUNT_FOOD";
        }
        String upper = code.trim().toUpperCase(Locale.ROOT);
        if (upper.contains("FREESHIP") || upper.contains("SHIP")) {
            return "FREESHIP";
        }
        if (upper.contains("WELCOME") || upper.contains("NEW")) {
            return "NEW_USER";
        }
        return "DISCOUNT_FOOD";
    }
}

