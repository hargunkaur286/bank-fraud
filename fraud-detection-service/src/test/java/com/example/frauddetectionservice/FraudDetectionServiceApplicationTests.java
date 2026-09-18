package com.example.frauddetectionservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.ConfluentKafkaContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * See account-service's equivalent test for why this needs real,
 * disposable infrastructure instead of the kafka:29092 / redis hostnames
 * from application.yaml (unresolvable outside docker-compose's network).
 */
@SpringBootTest
@Testcontainers
class FraudDetectionServiceApplicationTests {

	@Container
	static ConfluentKafkaContainer kafka =
			new ConfluentKafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));

	@Container
	static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:latest"))
			.withExposedPorts(6379);

	@DynamicPropertySource
	static void overrideInfrastructure(DynamicPropertyRegistry registry) {
		registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
		registry.add("spring.data.redis.host", redis::getHost);
		registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
	}

	@Test
	void contextLoads() {
	}

}
