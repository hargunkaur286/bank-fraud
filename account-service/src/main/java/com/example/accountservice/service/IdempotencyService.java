package com.example.accountservice.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.accountservice.entity.ProcessedEvent;
import com.example.accountservice.repository.ProcessedEventRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final ProcessedEventRepository processedEventRepository;

    /**
     * Attempts to claim a unique key for a piece of work that must run
     * exactly once. Returns true the first time (the caller should proceed),
     * false on every later attempt with the same key (the caller should
     * skip). Correct under concurrent redelivery because it relies on the
     * database's unique constraint rejecting the insert, not on reading
     * "does this exist yet" first.
     */
    @Transactional
    public boolean claim(String eventKey) {
        try {
            ProcessedEvent event = new ProcessedEvent();
            event.setEventKey(eventKey);
            processedEventRepository.saveAndFlush(event);
            return true;
        } catch (DataIntegrityViolationException e) {
            return false;
        }
    }
}
