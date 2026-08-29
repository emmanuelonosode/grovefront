import sanitizeHtml from "sanitize-html";
import type {
  PropertyFeeAPI,
  PropertySchoolAPI,
  PropertyOfficeInfoAPI,
} from "./properties";

/** A recurring charge, normalised and ready to render. */
export interface MonthlyCharge {
  title: string;
  amount: number;
  description: string;
  required: boolean;
}

export interface MonthlyCostBreakdown {
  baseRent: number;
  charges: MonthlyCharge[];
  /** Base rent plus every required recurring charge. */
  requiredTotal: number;
  hasOptional: boolean;
}

/** "2,320.00" | "9.95" | 40 -> 2320 | 9.95 | 40. Returns 0 for anything unparseable. */
export function parseFeeAmount(raw: string | number | undefined | null): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Turns the raw `fees` array into a monthly cost breakdown.
 *
 * The feed always leads with a "Base Rent" row that simply repeats `price`, so
 * it is dropped rather than counted twice. Only MONTHLY charges roll into the
 * total; anything one-off would misrepresent a monthly figure.
 */
export function buildMonthlyCost(
  fees: PropertyFeeAPI[] | null | undefined,
  price: number,
): MonthlyCostBreakdown | null {
  if (!Array.isArray(fees) || fees.length === 0) return null;

  const charges: MonthlyCharge[] = [];
  for (const fee of fees) {
    const title = (fee.title || fee.name || "").trim();
    if (!title) continue;
    if (title.toLowerCase() === "base rent") continue;

    const frequency = (fee.frequency || "MONTHLY").toUpperCase();
    if (frequency !== "MONTHLY") continue;

    const amount = parseFeeAmount(fee.fee_amount);
    if (amount <= 0) continue;

    charges.push({
      title,
      amount,
      description: (fee.description || "").trim(),
      required: fee.is_required !== false,
    });
  }

  if (charges.length === 0) return null;

  charges.sort((a, b) => b.amount - a.amount);
  const requiredTotal =
    price + charges.filter((c) => c.required).reduce((sum, c) => sum + c.amount, 0);

  return {
    baseRent: price,
    charges,
    requiredTotal,
    hasOptional: charges.some((c) => !c.required),
  };
}

/** Money for display. Whole dollars unless the value has real cents. */
export function formatMoney(n: number): string {
  const hasCents = Math.round(n * 100) % 100 !== 0;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

export interface Availability {
  /** True when the home can be moved into today. */
  isNow: boolean;
  /** e.g. "Available now" or "Available Aug 19, 2026". */
  label: string;
}

/** Reads `available_on` (ISO) against today. Returns null when unparseable. */
export function parseAvailability(raw: string | null | undefined): Availability | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  // Compare calendar days in UTC; the feed stores midnight-UTC timestamps, so a
  // local-time comparison would flip the label for anyone west of Greenwich.
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const thenUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  if (thenUTC <= todayUTC) return { isNow: true, label: "Available now" };

  return {
    isNow: false,
    label: `Available ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })}`,
  };
}

/** "8132570126" -> "(813) 257-0126". Falls back to the input when not 10 digits. */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = String(raw).replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1")) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return String(raw);
}

export interface SchoolEntry {
  name: string;
  grades: string;
  distance: number | null;
  url: string;
  /** Derived from the grade range so schools can be grouped and labelled. */
  level: "Elementary" | "Middle" | "High" | "School";
}

const GRADE_TO_NUMBER: Record<string, number> = { PK: -1, KG: 0, K: 0, UG: 12 };

function gradeValue(token: string): number {
  const t = token.trim().toUpperCase();
  if (t in GRADE_TO_NUMBER) return GRADE_TO_NUMBER[t];
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Classifies "PK-5" / "6-8" / "9-12" / "KG-8" into a readable level.
 * Uses the highest grade served, which is what distinguishes an elementary
 * school from a K-8 or a high school.
 */
function levelFor(grades: string): SchoolEntry["level"] {
  if (!grades) return "School";
  const parts = grades.split("-");
  const high = gradeValue(parts[parts.length - 1]);
  if (high <= 5) return "Elementary";
  if (high <= 8) return "Middle";
  if (high <= 12) return "High";
  return "School";
}

/** Normalises the `schools` array, dropping entries with no name. */
export function buildSchools(raw: PropertySchoolAPI[] | null | undefined): SchoolEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const name = (s.name || "").trim();
      if (!name) return null;
      const grades = (s.grade_level_description || "").trim();
      const distance =
        typeof s.distance === "number" && Number.isFinite(s.distance) ? s.distance : null;
      return {
        name,
        grades,
        distance,
        url: (s.detail_url || "").trim(),
        level: levelFor(grades),
      } satisfies SchoolEntry;
    })
    .filter((s): s is SchoolEntry => s !== null)
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
}

export interface LeasingOffice {
  phone: string;
  phoneHref: string;
  email: string;
  license: string;
}

/** Normalises `office_info`. Returns null when there is nothing to show. */
export function buildLeasingOffice(
  raw: PropertyOfficeInfoAPI | null | undefined,
): LeasingOffice | null {
  if (!raw) return null;
  const digits = String(raw.phone_digits || "").replace(/\D/g, "");
  const office: LeasingOffice = {
    phone: formatPhone(raw.phone_digits),
    phoneHref: digits ? `tel:+1${digits.length === 11 ? digits.slice(1) : digits}` : "",
    email: (raw.email_address || "").trim(),
    license: (raw.brokerage_license_number || "").trim(),
  };
  return office.phone || office.email || office.license ? office : null;
}


/**
 * Turns a raw `description` into display paragraphs.
 *
 * About 10% of descriptions carry markup, and every anchor in the corpus
 * (435 of 435) points at invitationhomes.com. Rendering that HTML would both
 * leak the upstream operator and send visitors to a competitor, so all tags are
 * stripped to their text and the copy is split on blank lines instead. This
 * also fixes the raw `<a href=...>` that was previously printed on the page,
 * since the field was being rendered as plain text.
 */
export function toParagraphs(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const text = sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {} });
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

/** Recognised 3D tour hosts, for labelling the embed. */
export function tourProvider(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.endsWith("insidemaps.com")) return "InsideMaps";
    if (host.endsWith("zillow.com")) return "Zillow 3D Home";
    if (host.endsWith("matterport.com")) return "Matterport";
    return null;
  } catch {
    return null;
  }
}


/** "2026-08-27" -> "Aug 27". Empty string when unparseable. */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
