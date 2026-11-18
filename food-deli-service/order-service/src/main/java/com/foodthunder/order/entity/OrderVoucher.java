package com.foodthunder.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "order_vouchers",
        uniqueConstraints = {
                @UniqueConstraint(name = "uniq_order_voucher_category", columnNames = {"order_id", "voucher_category"}),
                @UniqueConstraint(name = "uniq_order_voucher_id", columnNames = {"order_id", "voucher_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "voucher_id", nullable = false)
    private Integer voucherId;

    @Column(name = "voucher_code", nullable = false, length = 30)
    private String voucherCode;

    @Column(name = "voucher_category", nullable = false, length = 50)
    private String voucherCategory;

    @Column(name = "is_system_voucher", nullable = false)
    @Builder.Default
    private Boolean isSystemVoucher = false;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;
}

