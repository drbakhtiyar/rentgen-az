/** Centralized, typed access to environment variables. */

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  authSecret: process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me-0000000000",
  otpSecret: process.env.OTP_SECRET ?? "dev-insecure-otp-secret-change-me",
  // Use `||`/trim so an empty or whitespace-only value (e.g. an unset Vercel
  // env var that resolves to "") falls back instead of producing `new URL("")`.
  siteUrl:
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || "http://localhost:3000",
  smsProvider: (process.env.SMS_PROVIDER ?? "dev") as
    | "dev"
    | "twilio"
    | "generic",
  adminPhone: process.env.ADMIN_PHONE ?? "",
  twilio: {
    sid: process.env.TWILIO_ACCOUNT_SID ?? "",
    token: process.env.TWILIO_AUTH_TOKEN ?? "",
    from: process.env.TWILIO_FROM_NUMBER ?? "",
  },
  smsGeneric: {
    url: process.env.SMS_GENERIC_URL ?? "",
    token: process.env.SMS_GENERIC_TOKEN ?? "",
    sender: process.env.SMS_GENERIC_SENDER ?? "",
  },
  isProd: process.env.NODE_ENV === "production",
};

export const SITE_URL = env.siteUrl.replace(/\/$/, "");
