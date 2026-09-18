package com.example.paymentservice.exception;

import java.time.Instant;
import java.util.Map;

import lombok.Getter;

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
