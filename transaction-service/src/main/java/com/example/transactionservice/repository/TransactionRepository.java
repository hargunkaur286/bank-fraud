package com.example.transactionservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.transactionservice.entity.Transaction;

public class TransactionRepository extends JpaRepository<Transaction, String> {
    
}
