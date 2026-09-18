package com.example.transactionservice.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.transactionservice.dto.TransactionResponse;
import com.example.transactionservice.dto.TransferRequest;
import com.example.transactionservice.exception.UnauthorizedException;
import com.example.transactionservice.service.TokenService;
import com.example.transactionservice.service.TransactionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping ("/api/v1/transactions")
@Slf4j
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;
    private final TokenService tokenService;

    // Requires proof the caller owns the sender account - previously any
    // client that knew an account number could move money out of it. The
    // recipient does NOT need to be logged in; only the sender's identity is
    // checked here, same as blocking an account in account-service.
    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(
        @Valid @RequestBody TransferRequest request,
        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ){
        String callerAccountNumber = tokenService.requireAccountNumber(authorization);
        if (!callerAccountNumber.equals(request.getSenderAccountNumber())) {
            throw new UnauthorizedException("You can only send money from your own account.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.transfer(request));
    }

    @GetMapping ("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransaction(
        @PathVariable String transactionId
    ){
        return ResponseEntity.ok(transactionService.getTransaction(transactionId));
    }

    @GetMapping ("/account/{accountNumber}")
    public ResponseEntity<List<TransactionResponse>> getTransactionHistory(
        @PathVariable String accountNumber
    ){
        return ResponseEntity.ok(transactionService.getTransactionHistory(accountNumber));
    }

    @PostMapping ("/{transactionId}/verify")
    public ResponseEntity<TransactionResponse> verifyOTP(
        @PathVariable String transactionId,
        @RequestParam String otp,
        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ){
        log.info("OTP verification request - transaction: {}", transactionId);

        String callerAccountNumber = tokenService.requireAccountNumber(authorization);
        return ResponseEntity.ok(transactionService.verifyOtp(transactionId, otp, callerAccountNumber));
    }


}
