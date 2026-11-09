package com.foodthunder.delivery.service;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.client.OrderClient;
import com.foodthunder.delivery.dto.client.RemoteUpdateOrderStatusRequest;
import com.foodthunder.delivery.dto.request.DriverLocationRequest;
import com.foodthunder.delivery.dto.request.UpdateDeliveryStepRequest;
import com.foodthunder.delivery.dto.response.AcceptOrderResponse;
import com.foodthunder.delivery.dto.response.DriverLocationResponse;
import com.foodthunder.delivery.dto.response.DriverOfferResponse;
import com.foodthunder.delivery.dto.response.DriverStatusResponse;
import com.foodthunder.delivery.entity.DriverDetail;
import com.foodthunder.delivery.entity.DriverLocation;
import com.foodthunder.delivery.entity.DriverOffer;
import com.foodthunder.delivery.exception.BadRequestException;
import com.foodthunder.delivery.exception.ConflictException;
import com.foodthunder.delivery.exception.ResourceNotFoundException;
import com.foodthunder.delivery.repository.DriverDetailRepository;
import com.foodthunder.delivery.repository.DriverLocationRepository;
import com.foodthunder.delivery.repository.DriverOfferRepository;
import com.foodthunder.delivery.service.impl.DeliveryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {

    @Mock
    private DriverDetailRepository driverDetailRepository;

    @Mock
    private DriverLocationRepository driverLocationRepository;

    @Mock
    private DriverOfferRepository driverOfferRepository;

    @Mock
    private OrderClient orderClient;

    @InjectMocks
    private DeliveryServiceImpl deliveryService;

    private DriverDetail onlineDriver;
    private DriverDetail offlineDriver;
    private DriverOffer pendingOfferDriver1;
    private DriverOffer pendingOfferDriver2;

    @BeforeEach
    void setUp() {
        onlineDriver = DriverDetail.builder()
                .userId(101)
                .licensePlate("59A1-12345")
                .idCardNumber("123456789012")
                .vehicleType("Motorbike")
                .approvalStatus("APPROVED")
                .isOnline(true)
                .build();

        offlineDriver = DriverDetail.builder()
                .userId(102)
                .licensePlate("59A1-67890")
                .idCardNumber("987654321098")
                .vehicleType("Motorbike")
                .approvalStatus("APPROVED")
                .isOnline(false)
                .build();

        pendingOfferDriver1 = DriverOffer.builder()
                .id(1L)
                .orderId(500L)
                .driverId(101)
                .status("OFFERED")
                .offeredAt(LocalDateTime.now())
                .build();

        pendingOfferDriver2 = DriverOffer.builder()
                .id(2L)
                .orderId(500L)
                .driverId(102)
                .status("OFFERED")
                .offeredAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("acceptOrder thành công: Tài xế online nhận đơn, cập nhật ACCEPTED và đồng bộ sang order-service")
    void testAcceptOrder_Success() {
        when(driverDetailRepository.findById(101)).thenReturn(Optional.of(onlineDriver));

        List<DriverOffer> offers = new ArrayList<>(List.of(pendingOfferDriver1, pendingOfferDriver2));
        when(driverOfferRepository.findAllByOrderIdForUpdate(500L)).thenReturn(offers);

        when(orderClient.updateOrderStatus(eq(500L), any(RemoteUpdateOrderStatusRequest.class), eq(101), eq("ROLE_DRIVER")))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Updated")));

        AcceptOrderResponse response = deliveryService.acceptOrder(101, 500L);

        assertThat(response).isNotNull();
        assertThat(response.getOrderId()).isEqualTo(500L);
        assertThat(response.getDriverId()).isEqualTo(101);
        assertThat(response.getStatus()).isEqualTo("ACCEPTED");

        // Xác nhận offer của tài xế 1 chuyển thành ACCEPTED
        assertThat(pendingOfferDriver1.getStatus()).isEqualTo("ACCEPTED");
        // Xác nhận offer của tài xế khác (tài xế 2) chuyển thành MISSED (Hụt cuốc)
        assertThat(pendingOfferDriver2.getStatus()).isEqualTo("MISSED");

        verify(driverOfferRepository).saveAll(offers);
        verify(orderClient).updateOrderStatus(eq(500L), any(RemoteUpdateOrderStatusRequest.class), eq(101), eq("ROLE_DRIVER"));
    }

    @Test
    @DisplayName("acceptOrder thất bại: Tài xế ngoại tuyến (Offline) ném BadRequestException")
    void testAcceptOrder_DriverOffline_ThrowsBadRequest() {
        when(driverDetailRepository.findById(102)).thenReturn(Optional.of(offlineDriver));

        assertThatThrownBy(() -> deliveryService.acceptOrder(102, 500L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tài xế đang ngoại tuyến (Offline)");

        verify(driverOfferRepository, never()).findAllByOrderIdForUpdate(any());
    }

    @Test
    @DisplayName("acceptOrder thất bại: Tài xế chưa được duyệt (Pending) ném BadRequestException")
    void testAcceptOrder_DriverNotApproved_ThrowsBadRequest() {
        DriverDetail pendingDriver = DriverDetail.builder()
                .userId(103)
                .approvalStatus("PENDING")
                .isOnline(true)
                .build();
        when(driverDetailRepository.findById(103)).thenReturn(Optional.of(pendingDriver));

        assertThatThrownBy(() -> deliveryService.acceptOrder(103, 500L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chưa được phê duyệt");

        verify(driverOfferRepository, never()).findAllByOrderIdForUpdate(any());
    }

    @Test
    @DisplayName("acceptOrder phát hiện Race Condition: Đơn đã có tài xế khác nhận trước -> Trả về lỗi 409 Conflict thân thiện")
    void testAcceptOrder_AlreadyAcceptedByAnotherDriver_ThrowsConflictException() {
        when(driverDetailRepository.findById(101)).thenReturn(Optional.of(onlineDriver));

        // Tài xế 2 đã nhận trước đó (status = ACCEPTED)
        pendingOfferDriver2.setStatus("ACCEPTED");
        List<DriverOffer> offers = List.of(pendingOfferDriver1, pendingOfferDriver2);

        when(driverOfferRepository.findAllByOrderIdForUpdate(500L)).thenReturn(offers);

        assertThatThrownBy(() -> deliveryService.acceptOrder(101, 500L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Đơn hàng này đã được một tài xế khác nhanh tay nhận trước");

        verify(driverOfferRepository, never()).saveAll(any());
        verify(orderClient, never()).updateOrderStatus(any(), any(), any(), any());
    }

    @Test
    @DisplayName("rejectOrder thành công: Cập nhật offer thành REJECTED kèm lý do")
    void testRejectOrder_Success() {
        when(driverOfferRepository.findByOrderIdAndDriverId(500L, 101))
                .thenReturn(Optional.of(pendingOfferDriver1));

        deliveryService.rejectOrder(101, 500L, "Kẹt xe không đi kịp");

        assertThat(pendingOfferDriver1.getStatus()).isEqualTo("REJECTED");
        assertThat(pendingOfferDriver1.getResponseReason()).isEqualTo("Kẹt xe không đi kịp");
        verify(driverOfferRepository).save(pendingOfferDriver1);
    }

    @Test
    @DisplayName("toggleOnline thành công: Đổi trạng thái từ online sang offline và ngược lại")
    void testToggleOnline_Success() {
        when(driverDetailRepository.findById(101)).thenReturn(Optional.of(onlineDriver));

        DriverStatusResponse response = deliveryService.toggleOnline(101);

        assertThat(response).isNotNull();
        assertThat(response.getIsOnline()).isFalse(); // từ true -> false
        verify(driverDetailRepository).save(onlineDriver);
    }

    @Test
    @DisplayName("updateLocation thành công: Lưu vết tọa độ GPS của tài xế")
    void testUpdateLocation_Success() {
        DriverLocationRequest req = DriverLocationRequest.builder()
                .orderId(500L)
                .latitude(10.7769)
                .longitude(106.7009)
                .heading(180.0)
                .speedKmh(30.0)
                .build();

        DriverLocation saved = DriverLocation.builder()
                .id(1L)
                .driverId(101)
                .orderId(500L)
                .latitude(10.7769)
                .longitude(106.7009)
                .heading(180.0)
                .speedKmh(30.0)
                .createdAt(LocalDateTime.now())
                .build();

        when(driverLocationRepository.save(any(DriverLocation.class))).thenReturn(saved);

        DriverLocationResponse response = deliveryService.updateLocation(101, req);

        assertThat(response).isNotNull();
        assertThat(response.getDriverId()).isEqualTo(101);
        assertThat(response.getLatitude()).isEqualTo(10.7769);
        assertThat(response.getLongitude()).isEqualTo(106.7009);
        verify(driverLocationRepository).save(any(DriverLocation.class));
    }

    @Test
    @DisplayName("updateDeliveryStep thành công: Tài xế cập nhật tiến trình PICKING_UP, DELIVERING, COMPLETED")
    void testUpdateDeliveryStep_Success() {
        pendingOfferDriver1.setStatus("ACCEPTED");
        when(driverOfferRepository.findByOrderIdAndDriverId(500L, 101))
                .thenReturn(Optional.of(pendingOfferDriver1));

        when(orderClient.updateOrderStatus(eq(500L), any(RemoteUpdateOrderStatusRequest.class), eq(101), eq("ROLE_DRIVER")))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Step updated")));

        UpdateDeliveryStepRequest req = UpdateDeliveryStepRequest.builder()
                .step("PICKING_UP")
                .note("Đã đến quán ăn, chờ lấy món")
                .currentLat(10.7769)
                .currentLng(106.7009)
                .build();

        deliveryService.updateDeliveryStep(101, 500L, req);

        verify(orderClient).updateOrderStatus(eq(500L), any(RemoteUpdateOrderStatusRequest.class), eq(101), eq("ROLE_DRIVER"));
        verify(driverLocationRepository).save(any(DriverLocation.class));
    }

    @Test
    @DisplayName("updateDeliveryStep thất bại: Bước chuyển trạng thái không hợp lệ ném BadRequestException")
    void testUpdateDeliveryStep_InvalidStep_ThrowsBadRequest() {
        UpdateDeliveryStepRequest req = UpdateDeliveryStepRequest.builder()
                .step("INVALID_STEP")
                .build();

        assertThatThrownBy(() -> deliveryService.updateDeliveryStep(101, 500L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Bước chuyển trạng thái không hợp lệ");
    }

    @Test
    @DisplayName("getPendingOffers: Lấy danh sách các đơn đang gửi mời nhận cuốc")
    void testGetPendingOffers() {
        when(driverOfferRepository.findByDriverIdAndStatus(101, "OFFERED"))
                .thenReturn(List.of(pendingOfferDriver1));

        List<DriverOfferResponse> offers = deliveryService.getPendingOffers(101);

        assertThat(offers).hasSize(1);
        assertThat(offers.get(0).getOrderId()).isEqualTo(500L);
    }
}
