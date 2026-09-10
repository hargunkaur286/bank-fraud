package com.example.paymentservice.service;

import java.math.BigDecimal;
import java.util.UUID;

import org.apache.catalina.servlets.DefaultServlet.SortManager.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.paymentservice.dto.CreatePaymentRequest;
import com.example.paymentservice.dto.PaymentOrderResponse;
import com.example.paymentservice.entity.Payment;
import com.example.paymentservice.entity.PaymentStatus;
import com.example.paymentservice.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
@RequiredArgsConstructor 
public class PaymentService {
    private final PaymentRepository paymentRepository;

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

    public PaymentOrderResponse createPaymentOrder(CreatePaymentRequest request) throws RazorpayException {
        log.info("Creating payment order for account: {} amount: {}", request.getAccountNumber(), request.getAmount());

        RazorpayClient razorpayClient = new RazorpayClient();

        // Converted Amount
        int convertedAmount = request.getAmount()
            .multiply(BigDecimal.valueOf(100))
            .intValue();
        
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", convertedAmount);
        orderRequest.put("currency", "USD/INR");
        orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis() + UUID.randomUUID().toString().replace("-", "").substring(0, 10));

        Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        log.info("Razorpay order created: {}", razorpayOrder.get("id").toString);

        // Save the payment record
        Payment payment = new Payment();
        payment.setRazorpayOrderId(razorpayOrder.get("id").toString);
        payment.setAccountNumber(request.getAccountNumber());
        payment.setAmount(request.getAmount());
        payment.setCurrency("USD/INR");
        payment.setStatus(PaymentStatus.CREATED);
        payment.setDescription(request.getDescription());

        Payment savedPayment = paymentRepository.save(payment);

        return new PaymentOrderResponse(
            savedPayment.getId(),
            razorpayOrder.get("id").toString(),
            request.getAmount(),
            "USD/INR",
            "created",
            keyId
        );
    }
}   
