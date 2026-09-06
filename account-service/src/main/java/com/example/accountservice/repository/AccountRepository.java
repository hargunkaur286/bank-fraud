package com.example.accountservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.accountservice.entity.Account;

public interface AccountRepository extends JpaRepository<Account, String> {
    boolean existsByEmail(String email);
    boolean existsByAccountNumber(String accountNumber);
    Optional<Account> findByAccountNumber(String accountNumber);
}
