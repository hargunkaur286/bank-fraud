package com.example.accountservice.service;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
@RequiredArgsConstructor
public class AccountEventConsumer {
    private final AccountService accountService;
    @KafkaListener(topics = "transaction.completed")
    // consume transaction completed event from kafka
    // credits receiver account
    public void consumeTransactionCompleted(
        @Payload Map<String, Object> payload
    ) {
        try{
            String receiverAccount = (String) payload.get("receiverAccountNumber");
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());

            log.info("Crediting account: {} amount: {}", receiverAccount, amount);
            accountService.creditBalance(receiverAccount, amount);
        } catch(Exception e){
            log.error("Error crediting account: {}", e.getMessage());
        }
    }


    // consume fraud.detected event from kafka and blocks the flagged account
    @KafkaListener (topics = "fraud.detected")
    public void comsumeFraudDetected(@Payload Map<String, Object> payload){
        try{
            String accountNumber = (String) payload.get("accountNumber");
            log.info("Fraud detected - blocking account: {}", accountNumber);

            accountService.blockAccount(accountNumber);
        }
        catch(Exception e){
            log.error("Error blocking account: {}", e.getMessage());
        }
    }
}
