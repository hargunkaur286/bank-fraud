package com.example.paymentservice.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.example.paymentservice.dto.CreatePaymentRequest;
import com.example.paymentservice.dto.PaymentOrderResponse;
import com.example.paymentservice.entity.Payment;
import com.example.paymentservice.entity.PaymentStatus;
import com.example.paymentservice.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Order;
import org.json.JSONObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
@RequiredArgsConstructor 
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value ("${razorpay.key.id}")
    private String keyId;

    @Value ("${razorpay.key.secret}")
    private String keySecret;

    private static final String PAYMENT_COMPLETED_TOPIC = "payment.completed";
    private static final String PAYMENT_FAILED_TOPIC = "payment.failed";

    /**
     * Create Razorpay payment order:
     * 
     * 1. Create order in razorpay
     * 2. Save the payment record in the DB
     * 3. Return order details to the frontend
     * 4. Frontend shows Razorpay checkout
     * 5. User pays
     * 6. Razorpay calls webhook
     * @param request
     * @return
     */

    public PaymentOrderResponse createPaymentOrder(
        CreatePaymentRequest request
    ) throws RazorpayException {

        log.info(
            "Creating payment order for account: {} amount: {}",
            request.getAccountNumber(),
            request.getAmount()
        );

        RazorpayClient razorpayClient =
            new RazorpayClient(keyId, keySecret);

        int convertedAmount = request.getAmount()
            .multiply(BigDecimal.valueOf(100))
            .intValue();

        JSONObject orderRequest = new JSONObject();

        orderRequest.put("amount", convertedAmount);
        orderRequest.put("currency", "INR");
        orderRequest.put(
            "receipt",
            "rcpt_"
                + System.currentTimeMillis()
                + UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 10)
        );

        Order razorpayOrder =
            razorpayClient.orders.create(orderRequest);

        String razorpayOrderId =
            razorpayOrder.get("id").toString();

        log.info(
            "Razorpay order created: {}",
            razorpayOrderId
        );

        Payment payment = new Payment();

        payment.setRazorpayOrderId(razorpayOrderId);
        payment.setAccountNumber(request.getAccountNumber());
        payment.setAmount(request.getAmount());
        payment.setCurrency("INR");
        payment.setStatus(PaymentStatus.CREATED);
        payment.setDescription(request.getDescription());

        Payment savedPayment =
            paymentRepository.save(payment);

        return new PaymentOrderResponse(
            savedPayment.getId(),
            razorpayOrderId,
            request.getAmount(),
            "INR",
            "created",
            keyId
        );
    }

    public void handleWebhook(Map<String, Object> payload){
        log.info("Received Razorpay webhook: {}", payload.get("event"));

        String event = (String) payload.get("event");

        if("payment.captured".equals(event)){
            handlePaymentSuccess(payload);
        }
        else if("payment.failed".equals(event)){
            handlePaymentFailure(payload);
        }
    }

    private void handlePaymentSuccess(Map<String, Object> payload){
        try{
            Map<String, Object> paymentData = extractPaymentData(payload);
            String orderId = (String) paymentData.get("order_id");
            String paymentId = (String) paymentData.get("id");

            Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                    .orElseThrow(() -> new RuntimeException(
                        "Payment not found for order"
                    ));
            
            payment.setRazorpayPaymentId(paymentId);
            payment.setStatus(PaymentStatus.COMPLETED);
            paymentRepository.save(payment);

            // publish payment completed event
            Map<String, Object> event = new HashMap<> ();
            event.put("paymentId", payment.getId());
            event.put("accountNumber", payment.getAccountNumber());
            event.put("amount", payment.getAmount());
            event.put("razorpayPaymentId", paymentId);
            
            kafkaTemplate.send(PAYMENT_COMPLETED_TOPIC, payment.getId(), event);
            log.info("Payment completed: {}", payment.getId());
        }
        catch(Exception e){
            log.error("Error handling payment success: {}", e.getMessage());
        }
    }

    private void handlePaymentFailure(Map<String, Object> payload){
        try{
            Map<String, Object> paymentData = extractPaymentData(payload);
            String orderId = (String) paymentData.get("order_id");

            Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                    .orElseThrow(() -> new RuntimeException(
                        "Payment not found for order"
                    ));
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Payment failed via Razorpay");
            paymentRepository.save(payment);

            // publish payment completed event
            Map<String, Object> event = new HashMap<> ();
            event.put("paymentId", payment.getId());
            event.put("accountNumber", payment.getAccountNumber());
            event.put("amount", payment.getAmount());
            event.put("razorpayPaymentId", "Payment failed via Razorpay");
            
            kafkaTemplate.send(PAYMENT_FAILED_TOPIC, payment.getId(), event);

            log.warn("Payment failed: {}", payment.getId());
        }
        catch(Exception e){
            log.error("Error handling payment failure: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
        private Map<String, Object> extractPaymentData(
            Map<String, Object> payload
        ) {
            Map<String, Object> entity =
                (Map<String, Object>) payload.get("payload");

            Map<String, Object> paymentWrapper =
                (Map<String, Object>) entity.get("payment");

            return (Map<String, Object>)
                paymentWrapper.get("entity");
        }
}   
