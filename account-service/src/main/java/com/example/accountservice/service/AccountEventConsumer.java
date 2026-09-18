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
    private final IdempotencyService idempotencyService;

    @KafkaListener(topics = "transaction.completed")
    // consume transaction completed event from kafka
    // credits receiver account
    public void consumeTransactionCompleted(
        @Payload Map<String, Object> payload
    ) {
        try{
            String transactionId = String.valueOf(payload.get("transactionId"));
            String receiverAccount = (String) payload.get("receiverAccountNumber");
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());

            // Kafka is at-least-once delivery - the same message can arrive
            // twice after a consumer restart/rebalance. Without this guard a
            // redelivered transaction.completed would credit the receiver
            // twice for the same transfer.
            if (!idempotencyService.claim("credit-transaction:" + transactionId)) {
                log.info("transaction.completed for {} already processed - skipping duplicate credit", transactionId);
                return;
            }

            log.info("Crediting account: {} amount: {}", receiverAccount, amount);
            accountService.creditBalance(receiverAccount, amount);
        } catch(Exception e){
            log.error("Error crediting account: {}", e.getMessage());
        }
    }

    /**
     * Added while closing the idempotency gap: previously nothing in the
     * system ever consumed payment.completed, so a successful Razorpay
     * top-up updated the Payment row in payment-service but never actually
     * credited the user's account balance here. This is the fix.
     */
    @KafkaListener(topics = "payment.completed")
    public void consumePaymentCompleted(
        @Payload Map<String, Object> payload
    ) {
        try {
            String paymentId = String.valueOf(payload.get("paymentId"));
            String accountNumber = (String) payload.get("accountNumber");
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());

            if (!idempotencyService.claim("credit-payment:" + paymentId)) {
                log.info("payment.completed for {} already processed - skipping duplicate credit", paymentId);
                return;
            }

            log.info("Crediting account: {} amount: {} for completed payment {}", accountNumber, amount, paymentId);
            accountService.creditBalance(accountNumber, amount);
        } catch (Exception e) {
            log.error("Error crediting account for completed payment: {}", e.getMessage());
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
