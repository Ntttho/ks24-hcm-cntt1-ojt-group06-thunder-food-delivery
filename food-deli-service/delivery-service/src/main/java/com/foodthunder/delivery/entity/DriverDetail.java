package com.foodthunder.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "driver_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDetail {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    @Column(name = "id_card_number", length = 20)
    private String idCardNumber;

    @Column(name = "vehicle_type", length = 50)
    private String vehicleType;

    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private String approvalStatus = "PENDING";

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "is_online")
    @Builder.Default
    private Boolean isOnline = false;
}

