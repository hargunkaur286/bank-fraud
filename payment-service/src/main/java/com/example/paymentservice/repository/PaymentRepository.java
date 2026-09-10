package com.example.paymentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.paymentservice.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, String> {

}
