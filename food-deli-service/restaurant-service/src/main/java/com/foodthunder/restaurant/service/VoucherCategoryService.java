package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateVoucherCategoryRequest;
import com.foodthunder.restaurant.dto.UpdateVoucherCategoryRequest;
import com.foodthunder.restaurant.dto.VoucherCategoryDto;

import java.util.List;

public interface VoucherCategoryService {

    List<VoucherCategoryDto> getCategories(Boolean activeOnly);

    VoucherCategoryDto getCategoryById(Integer id);

    VoucherCategoryDto createCategory(CreateVoucherCategoryRequest request, String role);

    VoucherCategoryDto updateCategory(Integer id, UpdateVoucherCategoryRequest request, String role);

    VoucherCategoryDto toggleCategoryStatus(Integer id, String role);

    void deleteCategory(Integer id, String role);
}

