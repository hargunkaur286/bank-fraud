package com.example.accountservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;


import com.example.accountservice.entity.AccountStatus;
import com.example.accountservice.entity.AccountType;

import lombok.Data;
@Data 

public class AccountResponse {

    private String id;

    private String accountNumber;

    private String accountHolderName;

    private String email;

    private String phone;

    private AccountType accountType;

    private AccountStatus status;

    private BigDecimal balance;

    private BigDecimal dailyTransactionLimit;

    private LocalDateTime createdAt;

}
