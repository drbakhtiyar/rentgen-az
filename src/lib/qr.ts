import "server-only";
import QRCode from "qrcode";
import sharp from "sharp";
import { QR_LABEL_B64 } from "./qr-label";

/**
 * Branded QR: high error-correction (H = 30% redundancy) with a small
 * "Rentgen.az" pill composited in the center — the label covers ~4% of the
 * modules, well within H-level recovery, so scanning is unaffected. The label
 * ships as a pre-rendered PNG (no font rendering on the server).
 * Returns a PNG data URL (also used for the download link, so prints carry
 * the branding too).
 */
export async function brandedQrDataUrl(url: string): Promise<string> {
  const qr = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    width: 640,
    margin: 2,
    type: "png",
  });
  const label = await sharp(Buffer.from(QR_LABEL_B64, "base64"))
    .resize(320) // ~50% of the QR width, ~7% of its area — still safe at level H
    .png()
    .toBuffer();
  const out = await sharp(qr)
    .composite([{ input: label, gravity: "center" }])
    .png()
    .toBuffer();
  return `data:image/png;base64,${out.toString("base64")}`;
}
