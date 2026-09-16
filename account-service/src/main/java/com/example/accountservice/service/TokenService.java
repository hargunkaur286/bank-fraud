package com.example.accountservice.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.accountservice.exception.UnauthorizedException;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

// Issues and verifies the session token handed out at login. Scoped to
// account-service only: transaction-service and payment-service do not (yet)
// validate this token, so it does not protect money movement today - see the
// frontend README for that boundary.
@Service
public class TokenService {

    private final SecretKey key;
    private final long expirationMs;

    public TokenService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(String accountNumber) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(accountNumber)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    // Returns the account number the token was issued for, or throws
    // UnauthorizedException if the token is missing, malformed, expired, or
    // signed with a different key.
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
