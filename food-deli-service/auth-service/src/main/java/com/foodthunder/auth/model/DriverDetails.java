package com.foodthunder.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "driver_details")
@Getter
@Setter
@NoArgsConstructor
public class DriverDetails {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;
}
