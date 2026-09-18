package com.example.notification_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.ConfluentKafkaContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * See account-service's equivalent test for why this needs a real,
 * disposable Kafka broker instead of the kafka:29092 hostname from
 * application.yaml (unresolvable outside docker-compose's network).
 */
@SpringBootTest
@Testcontainers
class NotificationServiceApplicationTests {

	@Container
	static ConfluentKafkaContainer kafka =
			new ConfluentKafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));

	@DynamicPropertySource
	static void overrideInfrastructure(DynamicPropertyRegistry registry) {
		registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
	}

	@Test
	void contextLoads() {
	}

}
