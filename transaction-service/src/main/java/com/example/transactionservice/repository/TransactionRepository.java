package com.example.transactionservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.transactionservice.entity.Transaction;

public class TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findBySenderAccountNumberOrderByCreatedAtDesc(String accountNumber);
}
