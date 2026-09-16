import { z } from "zod";

export const accountNumberSchema = z
  .string()
  .trim()
  .min(4, "Enter a valid account number")
  .max(32, "Enter a valid account number")
  .regex(/^[0-9]+$/, "Account numbers contain digits only");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const createAccountSchema = z.object({
  accountHolderName: z.string().trim().min(2, "Enter the account holder's full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Enter a valid phone number"),
  accountType: z.enum(["SAVINGS", "CURRENT", "FIXED_DEPOSIT"]),
  initialDeposit: z.coerce
    .number()
    .positive("Opening deposit must be greater than zero"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const transferSchema = z.object({
  senderAccountNumber: z.string(),
  receiverAccountNumber: accountNumberSchema,
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().trim().max(140, "Keep it under 140 characters").optional(),
});

export type TransferFormValues = z.infer<typeof transferSchema>;

export const otpSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
