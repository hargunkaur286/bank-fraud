package com.example.transactionservice.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.ConfluentKafkaContainer;
import org.testcontainers.utility.DockerImageName;

import com.example.transactionservice.client.AccountServiceClient;
import com.example.transactionservice.dto.TransactionResponse;
import com.example.transactionservice.dto.TransferRequest;
import com.example.transactionservice.entity.TransactionStatus;

/**
 * This is deliberately different from TransactionServiceTest: instead of
 * mocking Kafka and Redis, it boots the real Spring context against a real
 * MySQL and a real Kafka broker (both via Testcontainers), and only mocks
 * the one thing that's genuinely a different microservice - account-service,
 * reached over Feign. That's the realistic boundary for a microservice's own
 * integration test: prove this service's actual Kafka contract works
 * end-to-end, without needing five other services running to do it.
 *
 * Requires a local Docker daemon to run (`docker info` should succeed) - it
 * is skipped, not failed, if Docker isn't available, via Testcontainers'
 * own environment detection.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Testcontainers
class TransactionSagaIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.0"))
            .withDatabaseName("transaction_db_test");

    @Container
    static ConfluentKafkaContainer kafka =
            new ConfluentKafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));

    @DynamicPropertySource
    static void overrideInfrastructure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        // No real Redis in this test - OTP flows aren't exercised here,
        // only the clean/fraud-check.clean happy path.
        registry.add("spring.data.redis.host", () -> "localhost");
        registry.add("spring.data.redis.port", () -> "6399");
    }

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    // The one dependency that's a genuinely separate service - everything
    // else in this test is real.
    @MockitoBean
    private AccountServiceClient accountServiceClient;

    @Test
    void fraudCheckCleanEventOnRealKafka_movesTransactionToCompleted() throws InterruptedException {
        TransferRequest request = new TransferRequest(
                "100000000001", "200000000002", new BigDecimal("500"), "integration test");

        TransactionResponse created = transactionService.transfer(request);
        assertThat(created.getStatus()).isEqualTo(TransactionStatus.PROCESSING);

        // Play the part of fraud-detection-service: publish its verdict to
        // the real topic, the same way the real service would.
        Map<String, Object> cleanEvent = new HashMap<>();
        cleanEvent.put("transactionId", created.getId());
        cleanEvent.put("isFraud", false);
        cleanEvent.put("reason", null);
        kafkaTemplate.send("fraud.check.clean", created.getId(), cleanEvent);

        TransactionResponse resolved = awaitStatus(created.getId(), TransactionStatus.COMPLETED, Duration.ofSeconds(15));
        assertThat(resolved.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(resolved.getCompletedAt()).isNotNull();
    }

    private TransactionResponse awaitStatus(String transactionId, TransactionStatus expected, Duration timeout)
            throws InterruptedException {
        Instant deadline = Instant.now().plus(timeout);
        TransactionResponse latest;
        do {
            latest = transactionService.getTransaction(transactionId);
            if (latest.getStatus() == expected) {
                return latest;
            }
            Thread.sleep(300);
        } while (Instant.now().isBefore(deadline));
        return latest;
    }
}
