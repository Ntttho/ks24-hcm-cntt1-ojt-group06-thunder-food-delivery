package com.foodthunder.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.auth.dto.AddressRequest;
import com.foodthunder.auth.dto.AddressResponse;
import com.foodthunder.auth.security.JwtProvider;
import com.foodthunder.auth.service.UserAddressService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserAddressController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserAddressControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserAddressService addressService;

    @MockBean
    private JwtProvider jwtProvider;

    @Test
    @DisplayName("GET /api/v1/users/addresses returns 200 and address list")
    void getMyAddresses_returns200() throws Exception {
        AddressResponse addr = AddressResponse.builder()
                .id(1L)
                .userId(1L)
                .address("144 Xuan Thuy, Cau Giay, Ha Noi")
                .isDefault(true)
                .label("Nha rieng")
                .createdAt(LocalDateTime.now())
                .build();

        when(addressService.getUserAddresses(1L)).thenReturn(List.of(addr));

        mockMvc.perform(get("/api/v1/users/addresses")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].address").value("144 Xuan Thuy, Cau Giay, Ha Noi"))
                .andExpect(jsonPath("$.data[0].isDefault").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/users/addresses returns 201 Created")
    void createAddress_returns201() throws Exception {
        AddressRequest request = AddressRequest.builder()
                .address("Landmark 72, Nam Tu Liem, Ha Noi")
                .latitude(21.0173)
                .longitude(105.7838)
                .isDefault(true)
                .label("Cong ty")
                .build();

        AddressResponse response = AddressResponse.builder()
                .id(2L)
                .userId(1L)
                .address("Landmark 72, Nam Tu Liem, Ha Noi")
                .latitude(21.0173)
                .longitude(105.7838)
                .isDefault(true)
                .label("Cong ty")
                .createdAt(LocalDateTime.now())
                .build();

        when(addressService.createAddress(eq(1L), any(AddressRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/users/addresses")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.id").value(2))
                .andExpect(jsonPath("$.data.label").value("Cong ty"));
    }

    @Test
    @DisplayName("PATCH /api/v1/users/addresses/{id}/default returns 200")
    void setDefaultAddress_returns200() throws Exception {
        AddressResponse response = AddressResponse.builder()
                .id(2L)
                .userId(1L)
                .address("Landmark 72, Nam Tu Liem, Ha Noi")
                .isDefault(true)
                .build();

        when(addressService.setDefaultAddress(1L, 2L)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/users/addresses/2/default")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.isDefault").value(true));
    }

    @Test
    @DisplayName("DELETE /api/v1/users/addresses/{id} returns 200")
    void deleteAddress_returns200() throws Exception {
        mockMvc.perform(delete("/api/v1/users/addresses/2")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }
}
