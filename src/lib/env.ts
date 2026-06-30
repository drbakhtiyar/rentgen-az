/** Centralized, typed access to environment variables. */

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  authSecret: process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me-0000000000",
  otpSecret: process.env.OTP_SECRET ?? "dev-insecure-otp-secret-change-me",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  smsProvider: (process.env.SMS_PROVIDER ?? "dev") as
    | "dev"
    | "twilio"
    | "generic",
  adminPhone: process.env.ADMIN_PHONE ?? "",
  // Secret admin access link: /admin-giris/<ADMIN_ACCESS_KEY>
  adminAccessKey: process.env.ADMIN_ACCESS_KEY ?? "",
  // When true, the secret link also requires an emailed OTP code (2FA).
  admin2fa: process.env.ADMIN_2FA === "true",
  // Notification email (new appointment requests / referrals)
  notifyEmail: process.env.NOTIFY_EMAIL ?? "",
  emailProvider: (process.env.EMAIL_PROVIDER ?? "formsubmit") as
    | "formsubmit"
    | "resend"
    | "console",
  resend: {
    key: process.env.RESEND_API_KEY ?? "",
    from: process.env.RESEND_FROM ?? "Rentgen.az <onboarding@resend.dev>",
  },
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
