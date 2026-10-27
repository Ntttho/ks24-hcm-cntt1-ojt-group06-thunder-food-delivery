package com.foodthunder.auth.service;

import com.foodthunder.auth.dto.AddressRequest;
import com.foodthunder.auth.dto.AddressResponse;
import com.foodthunder.auth.exception.ResourceNotFoundException;
import com.foodthunder.auth.model.UserAddress;
import com.foodthunder.auth.repository.UserAddressRepository;
import com.foodthunder.auth.service.impl.UserAddressServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAddressServiceTest {

    @Mock
    private UserAddressRepository addressRepository;

    @InjectMocks
    private UserAddressServiceImpl addressService;

    private UserAddress address1;
    private UserAddress address2;

    @BeforeEach
    void setUp() {
        address1 = UserAddress.builder()
                .id(1L)
                .userId(1L)
                .address("144 Xuan Thuy, Cau Giay, Ha Noi")
                .latitude(21.0368)
                .longitude(105.7827)
                .isDefault(true)
                .label("Nha rieng")
                .createdAt(LocalDateTime.now())
                .build();

        address2 = UserAddress.builder()
                .id(2L)
                .userId(1L)
                .address("Landmark 72, Nam Tu Liem, Ha Noi")
                .latitude(21.0173)
                .longitude(105.7838)
                .isDefault(false)
                .label("Cong ty")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
    }

    @Test
    @DisplayName("getUserAddresses: returns sorted addresses for user")
    void getUserAddresses_success() {
        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(1L))
                .thenReturn(List.of(address1, address2));

        List<AddressResponse> results = addressService.getUserAddresses(1L);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).address()).isEqualTo("144 Xuan Thuy, Cau Giay, Ha Noi");
        assertThat(results.get(0).isDefault()).isTrue();
    }

    @Test
    @DisplayName("createAddress: first address is automatically set as default")
    void createAddress_firstAddress_becomesDefault() {
        AddressRequest request = AddressRequest.builder()
                .address("144 Xuan Thuy")
                .latitude(21.0368)
                .longitude(105.7827)
                .isDefault(false) // user sent false, but it's first address
                .label("Nha rieng")
                .build();

        when(addressRepository.countByUserId(1L)).thenReturn(0L);
        when(addressRepository.save(any(UserAddress.class))).thenAnswer(inv -> {
            UserAddress ua = inv.getArgument(0);
            ua.setId(10L);
            return ua;
        });

        AddressResponse response = addressService.createAddress(1L, request);

        assertThat(response.isDefault()).isTrue();
        verify(addressRepository, never()).clearDefaultAddresses(1L);
    }

    @Test
    @DisplayName("createAddress: setting isDefault true clears existing defaults")
    void createAddress_withIsDefaultTrue_clearsExisting() {
        AddressRequest request = AddressRequest.builder()
                .address("New Default Address")
                .isDefault(true)
                .build();

        when(addressRepository.countByUserId(1L)).thenReturn(2L);
        when(addressRepository.save(any(UserAddress.class))).thenAnswer(inv -> {
            UserAddress ua = inv.getArgument(0);
            ua.setId(11L);
            return ua;
        });

        AddressResponse response = addressService.createAddress(1L, request);

        assertThat(response.isDefault()).isTrue();
        verify(addressRepository).clearDefaultAddresses(1L);
    }

    @Test
    @DisplayName("setDefaultAddress: updates address to default and clears others")
    void setDefaultAddress_success() {
        when(addressRepository.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(address2));
        when(addressRepository.save(any(UserAddress.class))).thenReturn(address2);

        AddressResponse response = addressService.setDefaultAddress(1L, 2L);

        assertThat(response.isDefault()).isTrue();
        verify(addressRepository).clearDefaultAddresses(1L);
    }

    @Test
    @DisplayName("setDefaultAddress: throws ResourceNotFoundException if address not found")
    void setDefaultAddress_notFound_throwsNotFound() {
        when(addressRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.setDefaultAddress(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteAddress: deletes address successfully")
    void deleteAddress_success() {
        when(addressRepository.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(address2));

        addressService.deleteAddress(1L, 2L);

        verify(addressRepository).delete(address2);
    }
}
