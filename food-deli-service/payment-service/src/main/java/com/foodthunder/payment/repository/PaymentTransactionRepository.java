package com.foodthunder.payment.repository;

import com.foodthunder.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    List<PaymentTransaction> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);

    Optional<PaymentTransaction> findByTransactionRef(String transactionRef);

    long countByPaymentId(Long paymentId);
}

