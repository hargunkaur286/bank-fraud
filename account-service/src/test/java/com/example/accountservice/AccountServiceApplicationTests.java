package com.example.accountservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.ConfluentKafkaContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * As written before this change, this test needed a real MySQL reachable at
 * mysql:3307 (Hibernate's ddl-auto=update runs at context startup) and a
 * resolvable Kafka broker (the @KafkaListener beans in AccountEventConsumer
 * start eagerly during context refresh, and fail the whole refresh if the
 * configured hostname can't even be resolved via DNS - confirmed by running
 * this suite with none of docker-compose's infra up, which is exactly the
 * environment a CI runner starts from). Testcontainers gives it real,
 * disposable versions of both instead of silently depending on infra this
 * test never declared it needed.
 */
@SpringBootTest
@Testcontainers
class AccountServiceApplicationTests {

	@Container
	static MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.0"))
			.withDatabaseName("account_db_test");

	@Container
	static ConfluentKafkaContainer kafka =
			new ConfluentKafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));

	@DynamicPropertySource
	static void overrideInfrastructure(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", mysql::getJdbcUrl);
		registry.add("spring.datasource.username", mysql::getUsername);
		registry.add("spring.datasource.password", mysql::getPassword);
		registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
	}

	@Test
	void contextLoads() {
	}

}
