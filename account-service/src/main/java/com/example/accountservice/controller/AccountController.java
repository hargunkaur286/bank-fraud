package com.example.accountservice.controller;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import com.example.accountservice.dto.AccountResponse;
import com.example.accountservice.dto.CreateAccountRequest;
import com.example.accountservice.service.AccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController 
@RequestMapping("/api/v1/accounts")
@Slf4j 
@RequiredArgsConstructor 
public class AccountController {
    private final AccountService accountService;

    @PostMapping 
    public ResponseEntity<AccountResponse> createAccount(
        @Valid @RequestBody CreateAccountRequest request
    ){
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(accountService.createAccount(request));
    }

    @GetMapping("{accountNumber}")
    public ResponseEntity<AccountResponse> getAccount(
        @PathVariable String accountNumber
    ) {
        return ResponseEntity.ok(accountService.getAccount(accountNumber));
    }

    @GetMapping ("/{accountNumber}/balance")
    public ResponseEntity<BigDecimal> getBalance(
        @PathVariable String accountNumber
    ){
        return ResponseEntity.ok(accountService.getBalance(accountNumber));
    }

    @PutMapping("/{accountNumber}/block")
    public ResponseEntity<String> blockAccount(
        @PathVariable String accountNumber
    ){
        accountService.blockAccount(accountNumber);
        return ResponseEntity.ok("Account blocked Successfully");
    }

    // STEP 1: DEDUCT BALANCE
    // CALLED BY TRANSACTION SERVICE WHEN TRANSFER IS INITIATED

    @PutMapping ("/{accountNumber}/deduct")
    public ResponseEntity<String> deductBalance(
        @PathVariable String accountNumber,
        @RequestParam BigDecimal amount
    ){
        accountService.deductBalance(accountNumber, amount);
        return ResponseEntity.ok("Balance deducted successfully!");
    }

    // STEP 4: COMPENSATING TRANSACTION ENDPOINT
    // CALLED BY THE TRANSACTION SERVICE IN TWO SCENARIOS:
    // 1. FRAUD DETECTION -> REFUND SENDER (UNDO STEP 1)
    // 2. TRANSACTION COMPLETED -> CREDIT RECEIVER

    @PutMapping ("/{accountNumber}/credit")
    public ResponseEntity<String> creditBalance(
        @PathVariable String accountNumber,
        @RequestBody BigDecimal amount
    ){
        accountService.creditBalance(accountNumber, amount);
        return ResponseEntity.ok("Balance Credited Successfully");
    }
}

// endpoints:
// 1. Create Account
// 2. Get Account
// 3. Get Balance
// 4. Block account

// SAGA pattern
// 5. Deduct Balance
// 6. Credit Balance -> Credit Receiver and Credit Sender(refund)