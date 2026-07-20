/** Centralized, typed access to environment variables. */

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  authSecret: process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me-0000000000",
  otpSecret: process.env.OTP_SECRET ?? "dev-insecure-otp-secret-change-me",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  smsProvider: (process.env.SMS_PROVIDER ?? "dev") as
    | "dev"
    | "twilio"
    | "generic"
    | "lsim",
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
  // Lsim.az (sendsms.az) QuickSMS HTTP API
  lsim: {
    login: process.env.LSIM_LOGIN ?? "",
    password: process.env.LSIM_PASSWORD ?? "",
    sender: process.env.LSIM_SENDER ?? "",
  },
  // Payriff payment gateway (credentials added after official registration)
  payriff: {
    secret: process.env.PAYRIFF_SECRET ?? "",
    merchant: process.env.PAYRIFF_MERCHANT ?? "",
    base: process.env.PAYRIFF_BASE ?? "https://api.payriff.com",
  },
  // Google Places API (server-side, single platform key) — used to fetch and
  // display each center's Google rating from their Place ID.
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY ?? "",
  // Backblaze B2 (S3-compatible) — private bucket for rentgen files
  b2: {
    keyId: process.env.B2_KEY_ID ?? "",
    appKey: process.env.B2_APP_KEY ?? "",
    bucket: process.env.B2_BUCKET ?? "",
    endpoint: process.env.B2_ENDPOINT ?? "",
    region: process.env.B2_REGION ?? "eu-central-003",
  },
  isProd: process.env.NODE_ENV === "production",
};

export const SITE_URL = env.siteUrl.replace(/\/$/, "");
