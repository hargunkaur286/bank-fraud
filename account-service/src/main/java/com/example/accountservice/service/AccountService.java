package com.example.accountservice.service;

import java.math.BigDecimal;
import java.security.SecureRandom;

import javax.management.RuntimeErrorException;

import org.springframework.stereotype.Service;

import com.example.accountservice.dto.AccountResponse;
import com.example.accountservice.dto.CreateAccountRequest;
import com.example.accountservice.entity.Account;
import com.example.accountservice.entity.AccountStatus;
import com.example.accountservice.entity.AccountType;
import com.example.accountservice.repository.AccountRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
@RequiredArgsConstructor 
public class AccountService {
    private final AccountRepository accountRepository;
    private static SecureRandom secureRandom = new SecureRandom();

    public AccountResponse createAccount(CreateAccountRequest request){
        log.info("Creating account for: {}", request.getEmail());

        if(accountRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("Account already exists for email: "+ request.getEmail());
        }

        Account account = new Account();
        account.setAccountHolderName(request.getAccountHolderName());
        account.setEmail(request.getEmail());
        account.setPhone(request.getPhone());
        account.setAccountType(request.getAccountType());
        account.setStatus(AccountStatus.ACTIVE);
        account.setBalance(request.getInitialDeposit());
        account.setAccountNumber(generateAccountNumber());
        account.setDailyTransactionLimit(
            request.getAccountType() == AccountType.SAVINGS
            ? new BigDecimal("1000000")
            : new BigDecimal("5000000")
        );

        Account savedAccount = accountRepository.save(account);
        log.info("Account created: {}", savedAccount.getAccountNumber());
        return mapToResponse(savedAccount);
    }

    //get account by account number
    public AccountResponse getAccount(String accountNumber){
        Account account = accountRepository.findByAccountNumber(accountNumber)
        .orElseThrow(() -> new RuntimeException("Account Not Found"));

        return mapToResponse(account);
    }

    // get account balance
    public BigDecimal getBalance(String accountNumber){
        Account account = accountRepository.findByAccountNumber(accountNumber)
        .orElseThrow(() -> new RuntimeException("Account Not Found"));

        return account.getBalance();
    }

    // block account - called by fraud detection service via kafka

    public void blockAccount(String accountNumber){
        log.info("Blocking account: {}", accountNumber);
        Account account = accountRepository.findByAccountNumber(accountNumber)
        .orElseThrow(() -> new RuntimeException("Account Not Found"));
        account.setStatus(AccountStatus.BLOCKED);
        accountRepository.save(account);
        log.info("Account blocked: {}", accountNumber);
    }

    // deduct balance -> called by transaction service
    public void deductBalance(String accountNumber, BigDecimal amount){
        log.info("Deducting balance {} from account: {}", amount, accountNumber);

        Account account =  accountRepository.findByAccountNumber(accountNumber)
        .orElseThrow(() -> new RuntimeException("Account Not Found"));

        if(account.getStatus() != AccountStatus.ACTIVE){
            throw new RuntimeException("Account not active" + accountNumber);
        }

        if(account.getBalance().compareTo(amount) < 0){
            throw new RuntimeException("Insufficient funds for account" + accountNumber);
        }

        account.setBalance(account.getBalance().subtract(amount));
        accountRepository.save(account);

        log.info("Balance updated. New Balance: {}", account.getBalance());
    }

    // credit balance -> called by transaction service via kafka
    public void creditBalance(String accountNumber, BigDecimal amount){
        log.info("Crediting {} to account: {}", amount, accountNumber);

        Account account = accountRepository.findByAccountNumber(accountNumber)
        .orElseThrow(() -> new RuntimeException("Account Not Found"));
        account.setStatus(AccountStatus.BLOCKED);

        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);

        log.info("Balance credited. New Balance: {}", account.getBalance());
    }

    // Generate unique 12-digit account number
    private String generateAccountNumber(){
        String accountNumber;

        do {
            long number = secureRandom.nextLong(1_000_000_000L);

            accountNumber = String.format("%012", number);
        } while (accountRepository
            .existsByAccountNumber(accountNumber)
        );
        return accountNumber;
    }

    private AccountResponse mapToResponse(Account account){
        AccountResponse response = new AccountResponse();
        response.setId(account.getId());
        response.setAccountNumber(account.getAccountNumber());
        response.setAccountHolderName(account.getAccountHolderName());
        response.setEmail(account.getEmail());
        response.setPhone(account.getPhone());
        response.setAccountType(account.getAccountType());
        response.setStatus(account.getStatus());
        response.setBalance(account.getBalance());
        response.setDailyTransactionLimit(account.getDailyTransactionLimit());
        response.setCreatedAt(account.getCreatedAt());

        return response;
    }
}
