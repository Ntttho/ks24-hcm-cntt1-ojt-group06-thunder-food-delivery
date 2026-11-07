package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateVoucherRequest;
import com.foodthunder.restaurant.dto.UpdateVoucherRequest;
import com.foodthunder.restaurant.dto.ValidateVoucherRequest;
import com.foodthunder.restaurant.dto.VoucherDto;
import com.foodthunder.restaurant.dto.VoucherValidationResponse;

import java.util.List;

public interface VoucherService {

    VoucherDto createVoucher(CreateVoucherRequest request, Integer requesterUserId, String role);

    VoucherDto updateVoucher(Integer id, UpdateVoucherRequest request, Integer requesterUserId, String role);

    void deleteVoucher(Integer id, Integer requesterUserId, String role);

    VoucherDto toggleVoucherStatus(Integer id, Integer requesterUserId, String role);

    VoucherValidationResponse validateVoucher(ValidateVoucherRequest request);

    List<VoucherDto> getVouchers(Integer restaurantId);

    VoucherDto getVoucherById(Integer id);
}

