package com.example.transactionservice.entity;

// Transaction lifecycle flow:
// PENDING -> PROCESSING -> COMPLETED(CLEAN TRANSACTION)
//                       -> PENDING VERIFICATION (SUSPICIOUS DETECTED)
//                                              -> COMPLETED (VERIFIED)
//                                              -> FLAGGED
//                        -> FAILED
//                        -> FLAGGED
public enum TransactionStatus { 
            PENDING,
            PROCESSING,
            PENDING_VERIFICATION,
            COMPLETED,
            FAILED,
            FLAGGED
}
