/**
 * Azerbaijani phone number normalization.
 * Canonical stored format: +994XXXXXXXXX (E.164, 9 digits after the country code).
 *
 * Accepts inputs like:
 *   0501234567, 050 123 45 67, (050) 123-45-67, +994501234567, 994501234567, 501234567
 */

const AZ_CC = "994";

export function normalizePhone(input: string): string | null {
  if (!input) return null;
  // keep only digits
  let digits = input.replace(/\D/g, "");

  if (!digits) return null;

  // 00994... -> 994...
  if (digits.startsWith("00")) digits = digits.slice(2);

  // 994XXXXXXXXX
  if (digits.startsWith(AZ_CC)) {
    digits = digits.slice(AZ_CC.length);
  } else if (digits.startsWith("0")) {
    // local format with leading 0: 0XXXXXXXXX
    digits = digits.slice(1);
  }

  // Now `digits` should be the 9-digit national number: OOXXXXXXX
  // AZ mobile operators: 50, 51, 55, 70, 77, 99, 10 ... we only enforce 9 digits.
  if (digits.length !== 9) return null;

  // basic operator prefix sanity (2-digit operator code, first digit not 0)
  if (digits.startsWith("0")) return null;

  return `+${AZ_CC}${digits}`;
}

export function isValidAzPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** Pretty display: +994 50 123 45 67 */
export function formatPhoneDisplay(phone: string): string {
  const n = normalizePhone(phone);
  if (!n) return phone;
  const d = n.slice(4); // after +994
  return `+994 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

/** Digits only, for tel: and wa.me links (e.g. 994501234567) */
export function phoneToInternational(phone: string): string {
  const n = normalizePhone(phone);
  return n ? n.replace("+", "") : phone.replace(/\D/g, "");
}
