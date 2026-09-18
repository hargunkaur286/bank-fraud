package com.example.accountservice.exception;

import java.time.Instant;
import java.util.Map;

import lombok.Getter;

// The same shape (status/message/fieldErrors) is used across account-,
// transaction-, and payment-service so a frontend never has to guess
// which service's error it's looking at.
@Getter
public class ErrorResponse {
    private final Instant timestamp = Instant.now();
    private final int status;
    private final String message;
    private final Map<String, String> fieldErrors;

    public ErrorResponse(int status, String message) {
        this(status, message, null);
    }

    public ErrorResponse(int status, String message, Map<String, String> fieldErrors) {
        this.status = status;
        this.message = message;
        this.fieldErrors = fieldErrors;
    }
}
