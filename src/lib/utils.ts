import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case "safe":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "reach":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "ambitious":
      return "text-rose-700 bg-rose-50 border-rose-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case "safe":
      return "Safe Match";
    case "reach":
      return "Reach";
    case "ambitious":
      return "Ambitious";
    default:
      return tier;
  }
}

export function getCountryFlag(country: string): string {
  const map: Record<string, string> = {
    USA: "🇺🇸",
    UK: "🇬🇧",
    Australia: "🇦🇺",
    Canada: "🇨🇦",
    "New Zealand": "🇳🇿",
    Ireland: "🇮🇪",
    Germany: "🇩🇪",
    France: "🇫🇷",
    UAE: "🇦🇪",
    Singapore: "🇸🇬",
    Malaysia: "🇲🇾",
  };
  return map[country] ?? "🌍";
}
