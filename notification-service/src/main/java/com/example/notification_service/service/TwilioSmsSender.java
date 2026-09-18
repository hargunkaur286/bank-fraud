package com.example.notification_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import lombok.extern.slf4j.Slf4j;

/**
 * Before this existed, notification-service only ever logged the OTP to its
 * own container's stdout - there was no way for a real user to receive it.
 * This is the one notification in the system that actually gets sent as a
 * real SMS (see NotificationService.consumeOtpGenerated); everything else
 * (debit/credit/fraud/refund/payment alerts) stays log-only on purpose - an
 * OTP is the one message a user genuinely has to act on to finish a flagged
 * transfer.
 *
 * Twilio credentials are optional: if they're not set, this quietly no-ops
 * and the OTP is still visible in the logs exactly as before, so the rest of
 * the system keeps working in an environment with no Twilio account at all.
 */
@Component
@Slf4j
public class TwilioSmsSender {

    private final boolean configured;
    private final String fromNumber;
    private final String defaultCountryCode;

    public TwilioSmsSender(
            @Value("${twilio.account-sid:}") String accountSid,
            @Value("${twilio.auth-token:}") String authToken,
            @Value("${twilio.from-number:}") String fromNumber,
            @Value("${notification.sms.default-country-code:+91}") String defaultCountryCode
    ) {
        this.fromNumber = fromNumber;
        this.defaultCountryCode = defaultCountryCode;
        this.configured = !accountSid.isBlank() && !authToken.isBlank() && !fromNumber.isBlank();

        if (configured) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio initialized - OTP codes will be sent as real SMS");
        } else {
            log.warn("Twilio is not configured (twilio.account-sid / twilio.auth-token / "
                    + "twilio.from-number) - OTP codes will only appear in these logs");
        }
    }

    public boolean isConfigured() {
        return configured;
    }

    public void send(String rawPhoneNumber, String message) {
        if (!configured) {
            return;
        }
        String to = rawPhoneNumber.startsWith("+") ? rawPhoneNumber : defaultCountryCode + rawPhoneNumber;
        try {
            Message.creator(new PhoneNumber(to), new PhoneNumber(fromNumber), message).create();
            log.info("SMS sent to {}", mask(to));
        } catch (Exception e) {
            log.error("Failed to send SMS via Twilio to {}: {}", mask(to), e.getMessage());
        }
    }

    private String mask(String phone) {
        return phone.length() > 4
                ? "*".repeat(phone.length() - 4) + phone.substring(phone.length() - 4)
                : phone;
    }
}
