import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

/** Live password requirement checks for inline UI feedback. */
export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export function checkPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ];
}

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(72),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, "Enter your name").max(120),
  accountType: z.enum(["worker", "business"]),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Keep a leading + and digits only, collapsing spaces/dashes. */
export function normalizePhoneInput(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return (plus ? "+" : "") + digits;
}

/** Accepts international numbers with 8–15 digits. */
export function isValidPhone(raw: string): boolean {
  const digits = normalizePhoneInput(raw).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Friendly message for phone save failures (duplicates, bans, etc.). */
export function phoneErrorMessage(error: { message?: string; code?: string } | null): string {
  const msg = error?.message ?? "";
  if (error?.code === "23505" || /duplicate key|unique/i.test(msg))
    return "That phone number is already used by another account.";
  if (/banned/i.test(msg)) return "This phone number cannot be used. Please contact support.";
  return "Could not save your phone number. Please try again.";
}
