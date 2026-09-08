package com.example.transactionservice.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionStatus;

import com.example.transactionservice.client.AccountServiceClient;
import com.example.transactionservice.dto.TransactionResponse;
import com.example.transactionservice.dto.TransferRequest;
import com.example.transactionservice.entity.Transaction;
import com.example.transactionservice.entity.TransactionType;
import com.example.transactionservice.event.TransactionInitiatedEvent;
import com.example.transactionservice.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
@RequiredArgsConstructor 
public class TransactionService {
    private final TransactionRepository transactionRepository;

    private final AccountServiceClient accountServiceClient;

    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final String TRANSACTION_INTIATED_TOPIC = "transaction.initiated";
    private static final String TRANSACTION_COMPLETED_TOPIC = "transaction.completed";
    private static final String TRANSACTION_REFUNDED_TOPIC = "transaction.refunded";

    // SAGA STEP-1:
    // Deducts from sender via feign
    // Saves transaction as processing
    // Publish event to kafka for fraud detection
    // Returns
    // @param request
    // @return

    public TransactionResponse transfer(TransferRequest request){
        log.info("SAGA START - Transfer: {} -> {} amount: {}", 
            request.getSenderAccountNumber(),
            request.getReceiverAccountNumber(),
            request.getAmount()
        );
        
        // SAGA STEP 1: Deduct from sender
        accountServiceClient.deductBalance(
            request.getSenderAccountNumber(),
            request.getAmount()
        );

        Transaction transaction = new Transaction();
        transaction.setSenderAccountNumber(request.getSenderAccountNumber());
        transaction.setReceiverAccountNumber(request.getReceiverAccountNumber());
        transaction.setAmount(request.getAmount());
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.TRANSFER);
        transaction.setStatus(TransactionStatus.PROCESSING);
        transaction.setDescription(request.getDescription());
        transaction.setReferenceNumber(UUID.randomUUID().toString());

        Transaction savedTransaction = transactionRepository.save(transaction);
        log.info("Transaction saved as PROCESSING: {}", savedTransaction.getId());

        // SAGA STEP 2: publish for fraud check
        TransactionInitiatedEvent event = new TransactionInitiatedEvent(
            savedTransaction.getId(),
            savedTransaction.getSenderAccountNumber(),
            savedTransaction.getReceiverAccountNumber(),
            savedTransaction.getAmount(),
            savedTransaction.getDescription()
        );

        kafkaTemplate.send(TRANSACTION_INTIATED_TOPIC, savedTransaction.getId(), event);
        log.info("SAGA STEP 2 - TransactionInitiatedEvent published: {}", savedTransaction.getId());

        return mapToResponse(savedTransaction);
    }

    public TransactionResponse getTransaction(String transactionId){
        return mapToResponse(transactionRepository
            .findById(transactionId)
            .orElseThrow(() -> new RuntimeException(
                "Transaction not found: "+ transactionId
            )));
    }

    public List<TransactionResponse> getTransactionHistory(String accountNumber){
        return transactionRepository
        .findBySenderAccountNumberOrderByCreatedAtDesc(accountNumber)
        .stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
    }

    private TransactionResponse mapToResponse(Transaction transaction){
        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setSenderAccountNumber(transaction.getSenderAccountNumber());
        response.setReceiverAccountNumber(transaction.getReceiverAccountNumber());
        response.setAmount(transaction.getAmount());
        response.setType(transaction.getType());
        response.setStatus(transaction.getStatus());
        response.setDescription(transaction.getDescription());
        response.setReferenceNumber(transaction.getReferenceNumber());
        response.setFailureReason(transaction.getFailureReason());
        response.setCreatedAt(transaction.getCreatedAt());
        response.setCompletedAt(transaction.getCompletedAt());

        return response;
    }
}
