import type { HintMode } from "@/lib/storage";

export function normalizeHintMode(
  value: unknown
): HintMode {
  if (value === "on" || value === "off") {
    return value;
  }

  if (value === "always") {
    return "on";
  }

  return "off";
}
