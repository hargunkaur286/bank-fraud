package com.example.transactionservice.service;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.transactionservice.exception.UnauthorizedException;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Verify-only counterpart to account-service's TokenService. transaction-
 * service never issues a token (only account-service does, at login) - it
 * just needs to confirm one is valid, which is why it's given the same
 * signing secret (APP_JWT_SECRET) rather than calling account-service to
 * check every request. This is what closes the gap called out in the
 * frontend README: transfer and OTP verification now require proof you own
 * the sender account, not just knowledge of its number.
 */
@Service
public class TokenService {

    private final SecretKey key;

    public TokenService(@Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String requireAccountNumber(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Please log in to do that.");
        }
        String token = authorizationHeader.substring("Bearer ".length());
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("Your session has expired. Please log in again.");
        }
    }
}
