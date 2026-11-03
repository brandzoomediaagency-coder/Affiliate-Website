import { z } from "zod";

/** Standard result returned by Server Actions to forms. */
export type ActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  warnings?: string[];
  id?: string;
  redirectTo?: string;
};

export const initialActionResult: ActionResult = { ok: false };

export function fail(message: string, fieldErrors?: ActionResult["fieldErrors"]): ActionResult {
  return { ok: false, message, fieldErrors };
}

export function fromZodError(error: z.ZodError): ActionResult {
  const flat = z.flattenError(error);
  const first = flat.formErrors[0] ?? Object.values(flat.fieldErrors).flat()[0];
  return {
    ok: false,
    message: first ? `Please fix the highlighted fields: ${first}` : "Please check the form and try again.",
    fieldErrors: flat.fieldErrors as Record<string, string[]>,
  };
}

export function getString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function getOptionalString(fd: FormData, key: string): string | null {
  const v = getString(fd, key);
  return v === "" ? null : v;
}

export function getBool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function getLines(fd: FormData, key: string): string[] {
  return getString(fd, key)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function getJson<T>(fd: FormData, key: string, fallback: T): T {
  const v = getString(fd, key);
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function getNumber(fd: FormData, key: string): number | null {
  const v = getString(fd, key).replace(/[,₹\s]/g, "");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/** Converts a datetime-local value (interpreted as IST) to ISO, or null. */
export function getDateTime(fd: FormData, key: string): string | null {
  const v = getString(fd, key);
  if (!v) return null;
  const withZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(v) ? v : `${v}${v.length === 16 ? ":00" : ""}+05:30`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
