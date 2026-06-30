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
  type LucideIcon,
} from "lucide-react";

const registry: Record<string, LucideIcon> = {
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
};

export function ServiceIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && registry[name]) || ScanLine;
  return <Icon className={className} aria-hidden />;
}
