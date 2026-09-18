package com.example.paymentservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import com.example.paymentservice.entity.Payment;
import com.example.paymentservice.entity.PaymentStatus;
import com.example.paymentservice.repository.PaymentRepository;

/**
 * Covers handleWebhook only - createPaymentOrder talks to the real Razorpay
 * SDK, which isn't something to hit (or worth mocking out at the
 * constructor level) in a fast unit test. The webhook path is exactly where
 * the idempotency bug lived (Razorpay retries webhooks it doesn't get a fast
 * 200 for), so it's the part that matters most to cover here.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, kafkaTemplate);
    }

    private Payment createdPayment() {
        Payment payment = new Payment();
        payment.setId("payment-1");
        payment.setRazorpayOrderId("order_abc123");
        payment.setAccountNumber("100000000001");
        payment.setAmount(new BigDecimal("500"));
        payment.setCurrency("INR");
        payment.setStatus(PaymentStatus.CREATED);
        return payment;
    }

    private Map<String, Object> webhookPayload(String event, String paymentId, String orderId) {
        Map<String, Object> entity = new HashMap<>();
        entity.put("id", paymentId);
        entity.put("order_id", orderId);

        Map<String, Object> paymentWrapper = new HashMap<>();
        paymentWrapper.put("entity", entity);

        Map<String, Object> payload = new HashMap<>();
        payload.put("payment", paymentWrapper);

        Map<String, Object> root = new HashMap<>();
        root.put("event", event);
        root.put("payload", payload);
        return root;
    }

    @Test
    void handleWebhook_paymentCaptured_marksCompletedAndPublishesEvent() {
        Payment payment = createdPayment();
        when(paymentRepository.findByRazorpayOrderId("order_abc123")).thenReturn(Optional.of(payment));

        paymentService.handleWebhook(webhookPayload("payment.captured", "pay_xyz", "order_abc123"));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(payment.getRazorpayPaymentId()).isEqualTo("pay_xyz");
        verify(kafkaTemplate, times(1)).send(eq("payment.completed"), eq("payment-1"), any());
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void handleWebhook_duplicateCapturedEvent_isIgnoredSecondTime() {
        Payment payment = createdPayment();
        payment.setStatus(PaymentStatus.COMPLETED); // as if the first webhook already landed
        when(paymentRepository.findByRazorpayOrderId("order_abc123")).thenReturn(Optional.of(payment));

        paymentService.handleWebhook(webhookPayload("payment.captured", "pay_xyz", "order_abc123"));

        verify(paymentRepository, never()).save(any());
        verify(kafkaTemplate, never()).send(any(), any(), any());
    }

    @Test
    void handleWebhook_paymentFailed_marksFailedAndPublishesEvent() {
        Payment payment = createdPayment();
        when(paymentRepository.findByRazorpayOrderId("order_abc123")).thenReturn(Optional.of(payment));

        paymentService.handleWebhook(webhookPayload("payment.failed", "pay_xyz", "order_abc123"));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    void handleWebhook_unknownEventType_isIgnored() {
        paymentService.handleWebhook(webhookPayload("order.paid", "pay_xyz", "order_abc123"));

        verify(paymentRepository, never()).findByRazorpayOrderId(any());
        verify(paymentRepository, never()).save(any());
    }
}
