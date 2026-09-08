package com.example.frauddetectionservice.service;

import java.util.Map;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j
public class FraudDetectionEventConsumer {

    private final FraudDetectionService fraudDetectionService;

    //listens to transaction.initiated topic
    // every transaction goes through fraud check before completing
    // @param payload
    @KafkaListener (topics = "transaction.initiated", groupId = "fraud-detection-group")
    public void consumeTransactionInitiated(
        @Payload Map<String, Object> payload
    ){
        log.info("Received transaction for fraud check: {}", payload.get("transactionId"));
        try{
            fraudDetectionService.checkTransaction(payload);
        }
        catch(Exception e){

        }
    }
}
