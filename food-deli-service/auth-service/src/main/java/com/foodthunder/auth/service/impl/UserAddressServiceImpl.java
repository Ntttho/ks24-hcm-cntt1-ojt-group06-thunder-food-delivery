package com.foodthunder.auth.service.impl;

import com.foodthunder.auth.dto.AddressRequest;
import com.foodthunder.auth.dto.AddressResponse;
import com.foodthunder.auth.exception.ResourceNotFoundException;
import com.foodthunder.auth.model.UserAddress;
import com.foodthunder.auth.repository.UserAddressRepository;
import com.foodthunder.auth.service.UserAddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAddressServiceImpl implements UserAddressService {

    private final UserAddressRepository addressRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        long addressCount = addressRepository.countByUserId(userId);
        boolean makeDefault = addressCount == 0 || Boolean.TRUE.equals(request.isDefault());

        if (makeDefault && addressCount > 0) {
            addressRepository.clearDefaultAddresses(userId);
        }

        UserAddress address = UserAddress.builder()
                .userId(userId)
                .address(request.address())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .isDefault(makeDefault)
                .label(request.label())
                .build();

        UserAddress saved = addressRepository.save(address);
        log.info("Created address id={} for user={}", saved.getId(), userId);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        if (Boolean.TRUE.equals(request.isDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.clearDefaultAddresses(userId);
            address.setIsDefault(true);
        } else if (request.isDefault() != null) {
            address.setIsDefault(request.isDefault());
        }

        address.setAddress(request.address());
        if (request.latitude() != null) address.setLatitude(request.latitude());
        if (request.longitude() != null) address.setLongitude(request.longitude());
        if (request.label() != null) address.setLabel(request.label());

        UserAddress updated = addressRepository.save(address);
        log.info("Updated address id={} for user={}", addressId, userId);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(Long userId, Long addressId) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        addressRepository.clearDefaultAddresses(userId);
        address.setIsDefault(true);
        UserAddress updated = addressRepository.save(address);

        log.info("Set address id={} as default for user={}", addressId, userId);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);
        log.info("Deleted address id={} for user={}", addressId, userId);

        if (wasDefault) {
            List<UserAddress> remaining = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                UserAddress newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
                log.info("Promoted address id={} to default for user={}", newDefault.getId(), userId);
            }
        }
    }

    private AddressResponse toResponse(UserAddress address) {
        return AddressResponse.builder()
                .id(address.getId())
                .userId(address.getUserId())
                .address(address.getAddress())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .isDefault(address.getIsDefault())
                .label(address.getLabel())
                .createdAt(address.getCreatedAt())
                .build();
    }
}
