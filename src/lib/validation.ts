import { z } from "zod";
import { normalizePhone } from "./phone";

const phoneField = z
  .string()
  .min(1, "Telefon nömrəsi tələb olunur")
  .transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Telefon nömrəsi düzgün deyil (məs: 050 123 45 67)",
      });
      return z.NEVER;
    }
    return n;
  });

// A non-normalized phone for contact fields (still validated as AZ)
const contactPhoneField = z
  .string()
  .min(1, "Telefon nömrəsi tələb olunur")
  .refine((v) => normalizePhone(v) !== null, "Telefon nömrəsi düzgün deyil");

export const requestOtpSchema = z.object({
  phone: phoneField,
  role: z.enum(["PATIENT", "CENTER", "DOCTOR"]).optional(),
});

export const verifyOtpSchema = z.object({
  phone: phoneField,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Kod 6 rəqəmdən ibarət olmalıdır"),
  role: z.enum(["PATIENT", "CENTER", "DOCTOR"]).optional(),
});

export const patientProfileSchema = z.object({
  firstName: z.string().trim().min(2, "Ad ən azı 2 hərf olmalıdır").max(60),
  lastName: z.string().trim().min(2, "Soyad ən azı 2 hərf olmalıdır").max(60),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
});

export const centerProfileSchema = z.object({
  name: z.string().trim().min(2, "Mərkəzin adı tələb olunur").max(120),
  phone: contactPhoneField,
  whatsapp: z
    .string()
    .trim()
    .refine((v) => v === "" || normalizePhone(v) !== null, "WhatsApp nömrəsi düzgün deyil")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Şəhər seçin").max(80),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  mapsUrl: z.string().trim().url("Düzgün link daxil edin").optional().or(z.literal("")),
  workingHours: z.string().trim().max(240).optional().or(z.literal("")),
  equipment: z.string().trim().max(1000).optional().or(z.literal("")),
  responsiblePerson: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const appointmentRequestSchema = z.object({
  name: z.string().trim().min(2, "Ad tələb olunur").max(120),
  phone: contactPhoneField,
  centerId: z.string().trim().min(1).optional().or(z.literal("")),
  doctorId: z.string().trim().min(1).optional().or(z.literal("")),
  serviceSlug: z.string().trim().max(80).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//.test(v), "Düzgün link daxil edin (https://...)")
  .optional()
  .or(z.literal(""));

export const doctorProfileSchema = z.object({
  firstName: z.string().trim().min(2, "Ad ən azı 2 hərf olmalıdır").max(60),
  lastName: z.string().trim().min(2, "Soyad ən azı 2 hərf olmalıdır").max(60),
  clinic: z.string().trim().max(160).optional().or(z.literal("")),
  specializations: z.array(z.string().trim().max(120)).max(8).optional().default([]),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional().or(z.literal("")),
  website: optionalUrl,
  diplomaUrl: optionalUrl,
  certificateUrl: optionalUrl,
});

export const referralSchema = z.object({
  doctorName: z.string().trim().min(2, "Həkimin adı tələb olunur").max(120),
  clinic: z.string().trim().max(160).optional().or(z.literal("")),
  doctorPhone: contactPhoneField,
  patientName: z.string().trim().min(2, "Pasiyentin adı tələb olunur").max(120),
  examType: z.string().trim().min(1, "Müayinə növü seçin").max(120),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  centerId: z.string().trim().min(1).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  centerId: z.string().trim().min(1, "Mərkəz seçilməyib"),
  rating: z.coerce.number().int().min(1, "Qiymət seçin").max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const blogPostSchema = z.object({
  slug: z.string().trim().min(2).max(160),
  title: z.string().trim().min(2).max(200),
  excerpt: z.string().trim().max(400).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Məzmun tələb olunur"),
  coverImage: z.string().trim().url().optional().or(z.literal("")),
  metaTitle: z.string().trim().max(200).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(400).optional().or(z.literal("")),
  tags: z.string().trim().optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export const waitlistSignupSchema = z
  .object({
    name: z.string().trim().min(2, "Ad ən azı 2 hərf olmalıdır / Имя — минимум 2 буквы").max(120),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    email: z.string().trim().email("E-poçt düzgün deyil / Неверный email").max(160).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    audience: z.enum(["patient", "doctor", "center"]).optional(),
    locale: z.enum(["az", "ru"]).default("az"),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((v) => (v.phone && v.phone.trim() !== "") || (v.email && v.email.trim() !== ""), {
    message: "Telefon və ya e-poçt daxil edin / Укажите телефон или email",
    path: ["phone"],
  })
  .transform((v) => ({
    ...v,
    phone: v.phone ? (normalizePhone(v.phone) ?? v.phone) : undefined,
  }));

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type CenterProfileInput = z.infer<typeof centerProfileSchema>;
export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
