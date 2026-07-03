import {
  ScanLine,
  ScanSearch,
  PanelsTopLeft,
  Ruler,
  Box,
  ScanFace,
  Layers,
  Stethoscope,
  AlignHorizontalDistributeCenter,
  Activity,
  Wind,
  Bone,
  Brain,
  Microscope,
  Camera,
  Aperture,
  Focus,
  Crosshair,
  Scan,
  Smile,
  Zap,
  Sparkles,
  Grid2x2,
  CircleDot,
  HeartPulse,
  Waves,
  Radiation,
  Syringe,
  type LucideIcon,
} from "lucide-react";

// Curated set of icons available as the built-in fallback. Admin-uploaded
// custom icons (iconUrl) take priority over anything here.
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  ScanLine,
  ScanSearch,
  PanelsTopLeft,
  Ruler,
  Box,
  ScanFace,
  Layers,
  Stethoscope,
  AlignHorizontalDistributeCenter,
  Activity,
  Wind,
  Bone,
  Brain,
  Microscope,
  Camera,
  Aperture,
  Focus,
  Crosshair,
  Scan,
  Smile,
  Zap,
  Sparkles,
  Grid2x2,
  CircleDot,
  HeartPulse,
  Waves,
  Radiation,
  Syringe,
};

export function ServiceIcon({
  name,
  url,
  className,
}: {
  /** lucide icon name (fallback when no uploaded icon) */
  name?: string | null;
  /** admin-uploaded custom icon image URL (takes priority) */
  url?: string | null;
  className?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={className} aria-hidden />;
  }
  const Icon = (name && ICON_REGISTRY[name]) || ScanLine;
  return <Icon className={className} aria-hidden />;
}
