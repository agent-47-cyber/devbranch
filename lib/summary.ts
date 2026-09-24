import type { CityStatus, PossibleLink } from "@/types/city";

export function createSummary(status: CityStatus, link?: PossibleLink): string {
  if (link) {
    return `Heavy rain in ${link.area} is happening alongside increased waterlogging reports and transport delays. These events may be related.`;
  }

  if (status.area) {
    return `${status.area} is currently ${status.label.toLowerCase()}. CityPulse is continuing to monitor available civic signals.`;
  }

  return "No unusual changes have been noticed in the available recent observations. CityPulse is keeping watch across Jaipur.";
}

export function createWhyItMatters(
  status: CityStatus,
  link?: PossibleLink,
): string {
  if (link) {
    return `Road and public transport problems may increase in ${link.area} while heavy rain continues. Residents may want to avoid low-lying roads until conditions improve.`;
  }

  if (status.label === "High") {
    return "Conditions need attention. Residents should check local conditions before travelling.";
  }

  return "Knowing which signals are changing together can help residents plan everyday travel more calmly.";
}
