/**
 * In-browser file viewer helpers (pure module — safe on client).
 * The viewer lives on the main site (/viewer/[fileId]); links from the CRM
 * subdomain must be absolute (crm.* rewrites every path into /crm/*).
 */

const VIEWABLE_EXT = new Set(["dcm", "dicom", "zip", "rar", "jpg", "jpeg", "png", "webp", "pdf"]);

/** Can this file open in the in-browser viewer (DICOM/ZIP/image/PDF)? */
export function isViewableFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return VIEWABLE_EXT.has(ext);
}

/** Viewer URL for a file — absolute when running on the CRM subdomain. */
export function viewerUrl(fileId: string): string {
  if (typeof window !== "undefined" && window.location.hostname.startsWith("crm.")) {
    return `https://rentgen.az/viewer/${fileId}`;
  }
  return `/viewer/${fileId}`;
}
