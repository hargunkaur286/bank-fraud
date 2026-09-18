package com.example.notification_service.service;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import lombok.extern.slf4j.Slf4j;

/**
 * notification-service previously made no outbound calls at all - every
 * Kafka payload it consumed only carried an account NUMBER, never a phone
 * number, so there was nothing to send an SMS to even once Twilio was wired
 * in. account-service's GET /accounts/{accountNumber} is already public
 * (Send Money's recipient lookup depends on that), so this reuses it rather
 * than adding a new endpoint.
 */
@Component
@Slf4j
public class AccountLookupClient {

    private final RestClient restClient;

    public AccountLookupClient(@Value("${account.service.url}") String accountServiceUrl) {
        this.restClient = RestClient.builder().baseUrl(accountServiceUrl).build();
    }

    @SuppressWarnings("unchecked")
    public Optional<String> findPhoneNumber(String accountNumber) {
        try {
            Map<String, Object> account = restClient.get()
                    .uri("/api/v1/accounts/{accountNumber}", accountNumber)
                    .retrieve()
                    .body(Map.class);

            Object phone = account != null ? account.get("phone") : null;
            return phone == null ? Optional.empty() : Optional.of(phone.toString());
        } catch (Exception e) {
            log.warn("Could not look up phone number for account {}: {}", accountNumber, e.getMessage());
            return Optional.empty();
        }
    }
}
