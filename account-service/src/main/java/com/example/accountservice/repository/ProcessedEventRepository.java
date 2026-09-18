package com.example.accountservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.accountservice.entity.ProcessedEvent;

public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, String> {
}
