package com.example.accountservice.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

/**
 * Kafka only guarantees at-least-once delivery: the same message can be
 * redelivered after a consumer restart or rebalance, before its offset was
 * committed. Every state change triggered by a Kafka event that isn't
 * naturally idempotent (crediting a balance is NOT - applying it twice
 * really does double the money) claims a row here first. The database's own
 * unique constraint on event_key is what actually prevents a race between
 * two redelivered copies of the same message - not a check-then-act read.
 */
@Entity
@Table(name = "processed_events", uniqueConstraints = @UniqueConstraint(columnNames = "event_key"))
@Data
public class ProcessedEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "event_key", nullable = false)
    private String eventKey;

    @CreationTimestamp
    private LocalDateTime processedAt;
}
