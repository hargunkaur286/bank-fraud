package com.example.transactionservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.kafka.core.KafkaTemplate;

import com.example.transactionservice.client.AccountServiceClient;
import com.example.transactionservice.dto.TransactionResponse;
import com.example.transactionservice.dto.TransferRequest;
import com.example.transactionservice.entity.Transaction;
import com.example.transactionservice.entity.TransactionStatus;
import com.example.transactionservice.exception.NotFoundException;
import com.example.transactionservice.exception.UnauthorizedException;
import com.example.transactionservice.repository.TransactionRepository;

/**
 * Unit tests for the SAGA logic itself, with account-service, Kafka, and
 * Redis all mocked out. TransactionSagaIntegrationTest (Testcontainers) is
 * the complementary test that exercises a real Kafka broker instead of
 * mocking it.
 */
@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private AccountServiceClient accountServiceClient;
    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock
    private RedisTemplate<String, String> redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    private TransactionService transactionService;

    @BeforeEach
    void setUp() {
        transactionService = new TransactionService(
                transactionRepository, accountServiceClient, kafkaTemplate, redisTemplate);
    }

    private Transaction pendingVerificationTransaction() {
        Transaction transaction = new Transaction();
        transaction.setId("txn-1");
        transaction.setSenderAccountNumber("100000000001");
        transaction.setReceiverAccountNumber("200000000002");
        transaction.setAmount(new BigDecimal("40000"));
        transaction.setStatus(TransactionStatus.PENDING_VERIFICATION);
        return transaction;
    }

    @Test
    void transfer_deductsSenderAndPublishesInitiatedEvent() {
        TransferRequest request = new TransferRequest("100000000001", "200000000002", new BigDecimal("500"), "rent");
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction saved = inv.getArgument(0);
            saved.setId("txn-generated");
            return saved;
        });

        TransactionResponse response = transactionService.transfer(request);

        verify(accountServiceClient).deductBalance("100000000001", new BigDecimal("500"));
        assertThat(response.getStatus()).isEqualTo(TransactionStatus.PROCESSING);
        verify(kafkaTemplate).send(eq("transaction.initiated"), anyString(), any());
    }

    @Test
    void verifyOtp_correctCode_completesTransactionAndPublishesCompletedEvent() {
        Transaction transaction = pendingVerificationTransaction();
        when(transactionRepository.findById("txn-1")).thenReturn(Optional.of(transaction));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("verification:otp:txn-1")).thenReturn("482913");

        TransactionResponse response = transactionService.verifyOtp("txn-1", "482913", "100000000001");

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(kafkaTemplate).send(eq("transaction.completed"), eq("txn-1"), any());
        verify(accountServiceClient, never()).creditBalance(anyString(), any());
    }

    @Test
    void verifyOtp_wrongCode_flagsBlocksAndRefundsSender() {
        Transaction transaction = pendingVerificationTransaction();
        when(transactionRepository.findById("txn-1")).thenReturn(Optional.of(transaction));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("verification:otp:txn-1")).thenReturn("482913");

        TransactionResponse response = transactionService.verifyOtp("txn-1", "000000", "100000000001");

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.FLAGGED);
        assertThat(response.getFailureReason()).contains("Wrong OTP");
        verify(accountServiceClient).creditBalance("100000000001", new BigDecimal("40000"));
        verify(kafkaTemplate).send(eq("fraud.detected"), eq("100000000001"), any());
        verify(kafkaTemplate).send(eq("transaction.refunded"), eq("txn-1"), any());
    }

    @Test
    void verifyOtp_expiredCode_refundsButDoesNotPublishFraudDetected() {
        Transaction transaction = pendingVerificationTransaction();
        when(transactionRepository.findById("txn-1")).thenReturn(Optional.of(transaction));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("verification:otp:txn-1")).thenReturn(null);

        TransactionResponse response = transactionService.verifyOtp("txn-1", "482913", "100000000001");

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.FLAGGED);
        verify(accountServiceClient).creditBalance("100000000001", new BigDecimal("40000"));
        // Expired is treated as a system/timing issue, not proof of fraud -
        // only a wrong code blocks the account.
        verify(kafkaTemplate, never()).send(eq("fraud.detected"), anyString(), any());
    }

    @Test
    void verifyOtp_callerIsNotTheSender_throwsUnauthorized() {
        Transaction transaction = pendingVerificationTransaction();
        when(transactionRepository.findById("txn-1")).thenReturn(Optional.of(transaction));

        assertThatThrownBy(() -> transactionService.verifyOtp("txn-1", "482913", "999999999999"))
                .isInstanceOf(UnauthorizedException.class);

        verify(redisTemplate, never()).opsForValue();
    }

    @Test
    void verifyOtp_transactionAlreadyResolved_isIdempotentAndDoesNotDoubleRefund() {
        Transaction transaction = pendingVerificationTransaction();
        transaction.setStatus(TransactionStatus.COMPLETED);
        when(transactionRepository.findById("txn-1")).thenReturn(Optional.of(transaction));

        TransactionResponse response = transactionService.verifyOtp("txn-1", "000000", "100000000001");

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(accountServiceClient, never()).creditBalance(anyString(), any());
        verify(kafkaTemplate, never()).send(anyString(), anyString(), any());
    }

    @Test
    void verifyOtp_transactionNotFound_throwsNotFound() {
        when(transactionRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.verifyOtp("missing", "123456", "100000000001"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void processCleanResult_alreadyCompleted_skipsAndDoesNotRepublish() {
        Transaction transaction = pendingVerificationTransaction();
        transaction.setStatus(TransactionStatus.COMPLETED);
        when(transactionRepository.findById("txn-1")).thenReturn(Optional.of(transaction));

        transactionService.processCleanResult("txn-1");

        verify(kafkaTemplate, never()).send(eq("transaction.completed"), anyString(), any());
        verify(transactionRepository, times(0)).save(any());
    }

    @Test
    void processCleanResult_stillProcessing_completesAndPublishes() {
        Transaction transaction = pendingVerificationTransaction();
        transaction.setStatus(TransactionStatus.PROCESSING);
        when(transactionRepository.findById("txn-1")).thenReturn(Optional.of(transaction));

        transactionService.processCleanResult("txn-1");

        assertThat(transaction.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(kafkaTemplate).send(eq("transaction.completed"), eq("txn-1"), any());
    }
}
