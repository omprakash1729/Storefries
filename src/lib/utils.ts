import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBestCategory(category: string | null, raw: any, name?: string): string | null {
  const genericTerms = ["establishment", "point_of_interest", "service", "services", "store", "food"];
  
  let display = category;
  
  // If the direct primary category is generic or empty, look for something better
  if (!display || genericTerms.includes(display.toLowerCase())) {
    if (raw?.primaryTypeDisplayName?.text) {
      const primary = raw.primaryTypeDisplayName.text;
      if (!genericTerms.includes(primary.toLowerCase())) {
        display = primary;
      }
    }
  }

  // If still generic, loop through all available types and pick the first non-generic one
  if (!display || genericTerms.includes(display.toLowerCase())) {
    if (raw?.types && Array.isArray(raw.types)) {
      const nonGeneric = raw.types.find((t: string) => !genericTerms.includes(t.toLowerCase()));
      if (nonGeneric) {
        display = nonGeneric;
      }
    }
  }

  // Final normalization if it came from types directly without pretty format
  if (display) {
    // Clean up underscores and capitalize each word
    display = display.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  return display || category; // fallback to whatever was initially there if everything fails
}
