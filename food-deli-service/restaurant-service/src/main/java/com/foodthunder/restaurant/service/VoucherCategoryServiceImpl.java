package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateVoucherCategoryRequest;
import com.foodthunder.restaurant.dto.UpdateVoucherCategoryRequest;
import com.foodthunder.restaurant.dto.VoucherCategoryDto;
import com.foodthunder.restaurant.entity.VoucherCategory;
import com.foodthunder.restaurant.exception.BadRequestException;
import com.foodthunder.restaurant.exception.ConflictException;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.VoucherCategoryRepository;
import com.foodthunder.restaurant.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherCategoryServiceImpl implements VoucherCategoryService {

    private final VoucherCategoryRepository voucherCategoryRepository;
    private final VoucherRepository voucherRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VoucherCategoryDto> getCategories(Boolean activeOnly) {
        List<VoucherCategory> list = Boolean.TRUE.equals(activeOnly)
                ? voucherCategoryRepository.findByIsActiveTrueOrderByIdAsc()
                : voucherCategoryRepository.findAllByOrderByIdAsc();
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherCategoryDto getCategoryById(Integer id) {
        VoucherCategory category = voucherCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục voucher với ID: " + id));
        return mapToDto(category);
    }

    @Override
    @Transactional
    public VoucherCategoryDto createCategory(CreateVoucherCategoryRequest request, String role) {
        requireAdmin(role);
        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (voucherCategoryRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new ConflictException("Mã danh mục voucher '" + normalizedCode + "' đã tồn tại");
        }

        VoucherCategory category = VoucherCategory.builder()
                .code(normalizedCode)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return mapToDto(voucherCategoryRepository.save(category));
    }

    @Override
    @Transactional
    public VoucherCategoryDto updateCategory(Integer id, UpdateVoucherCategoryRequest request, String role) {
        requireAdmin(role);
        VoucherCategory category = voucherCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục voucher với ID: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            category.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription().trim());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        return mapToDto(voucherCategoryRepository.save(category));
    }

    @Override
    @Transactional
    public VoucherCategoryDto toggleCategoryStatus(Integer id, String role) {
        requireAdmin(role);
        VoucherCategory category = voucherCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục voucher với ID: " + id));

        category.setIsActive(!Boolean.TRUE.equals(category.getIsActive()));
        return mapToDto(voucherCategoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Integer id, String role) {
        requireAdmin(role);
        VoucherCategory category = voucherCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục voucher với ID: " + id));

        if (voucherRepository.existsByVoucherCategoryIgnoreCase(category.getCode())) {
            throw new BadRequestException("Không thể xóa danh mục '" + category.getCode() + "' vì vẫn còn voucher đang sử dụng");
        }
        voucherCategoryRepository.delete(category);
    }

    private void requireAdmin(String role) {
        if (role == null || !role.toUpperCase(Locale.ROOT).contains("ADMIN")) {
            throw new ForbiddenException("Chỉ Quản trị viên (Admin) mới có quyền quản lý danh mục voucher");
        }
    }

    private VoucherCategoryDto mapToDto(VoucherCategory c) {
        return VoucherCategoryDto.builder()
                .id(c.getId())
                .code(c.getCode())
                .name(c.getName())
                .description(c.getDescription())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}

