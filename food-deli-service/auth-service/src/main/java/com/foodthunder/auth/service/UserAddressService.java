package com.foodthunder.auth.service;

import com.foodthunder.auth.dto.AddressRequest;
import com.foodthunder.auth.dto.AddressResponse;

import java.util.List;

public interface UserAddressService {
    List<AddressResponse> getUserAddresses(Long userId);
    AddressResponse createAddress(Long userId, AddressRequest request);
    AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request);
    AddressResponse setDefaultAddress(Long userId, Long addressId);
    void deleteAddress(Long userId, Long addressId);
}
