// The house manual's parts. Hostaway keeps each manual as one long text with headings, written
// in one of three ways: "CHECK-IN" (upper case), "Check-In Guide:" (title case with a colon), or
// "Building Amenities" (title case on a line of its own). Sync Hostaway cuts out the parts this
// app shows. Where a manual has no such heading, check-in and check-out fall back to Airbnb's settings.

export type ManualPart = 'manualCheckIn' | 'manualCheckOut' | 'manualRubbish' | 'manualParking';

const PARTS: [ManualPart, RegExp][] = [
  ['manualCheckIn', /^check[\s-]?in\b/i],
  ['manualCheckOut', /^check[\s-]?out\b/i],
  ['manualRubbish', /\b(rubbish|bins?|trash|garbage|waste|recycling)\b/i],
  ['manualParking', /\bparking\b/i],
];

const partOf = (h: string) => PARTS.find(([, re]) => re.test(h))?.[0] ?? null;

const CONNECTORS = new Set(['and', '&', 'or', '/', '-']);

/** Other topics manuals use as headings, recognised even straight after a line of text ("…\nWIFI Details\n…"). */
const OTHER_TOPICS =
  /^(address|level and unit|wi-?fi( details)?|free wifi|laundry|(building )?amenities|tv|safety|pool|gym|pool & gym|notes|noise reminder|contact( details)?|blinds|coffee machine|alarm|heating|getting here|power & lights|minut (device|sensor))$/i;

/**
 * A heading line, or null. Never one with digits, so "PW: 3232A…" or a phone number isn't a heading.
 * - "CHECK-IN", "POOL & GYM": short and upper case.
 * - "Check-In Guide:", "Level and Unit:": up to four words, each capitalised, ending in a colon.
 *   "Do not dispose of:" inside the rubbish part is a sentence, so it stays part of the text.
 * - "Building Amenities", "Check-In Guide": the same without the colon, after a blank line
 *   (or naming a known topic). "Photo & Video Guide to help you!" is a sentence, not a heading.
 */
function heading(line: string, afterBlank: boolean): string | null {
  const t = line.trim();
  // Trailing emoji or punctuation: "Parking Spot Number 🚗".
  const bare = t.replace(/[:\s\p{Extended_Pictographic}️]+$/u, '').trim();
  if (bare.length < 2 || bare.length > 40 || /\d/.test(bare)) return null;
  if (/[A-Z]{2}/.test(bare) && bare === bare.toUpperCase()) return bare;
  const words = bare.split(/\s+/);
  if (words.length > 4 || !words.every((w) => CONNECTORS.has(w) || /^[A-Z]/.test(w))) return null;
  if (!t.endsWith(':') && !afterBlank && !partOf(bare) && !OTHER_TOPICS.test(bare)) return null;
  return bare;
}

/** The text under each of the four headings, when the manual has it. */
export function splitManual(manual: string | null): Partial<Record<ManualPart, string>> {
  if (!manual) return {};
  const out: Partial<Record<ManualPart, string>> = {};
  let current: ManualPart | null = null;
  let lines: string[] = [];
  const flush = () => {
    const text = lines.join('\n').trim();
    if (current && text && !out[current]) out[current] = text;
    lines = [];
  };
  let afterBlank = true;
  for (const line of manual.split(/\r?\n/)) {
    const h = heading(line, afterBlank);
    afterBlank = line.trim() === '';
    if (h === null) {
      if (current) lines.push(line.trimEnd());
      continue;
    }
    const part = partOf(h);
    // A sub-heading on the same topic ("Recycling" under rubbish) stays inside the part.
    if (current && part === current) {
      lines.push(line.trimEnd());
      continue;
    }
    flush();
    current = part;
  }
  flush();
  return out;
}

export interface ManualInputs {
  /** Hostaway's "housemanual" custom field (API). */
  customManual: string | null;
  /** The dashboard's house manual, filled by Claude. */
  dashboardManual: string | null;
  /** Hostaway's special instruction, which some properties use for the manual (API). */
  specialInstruction: string | null;
  /** Hostaway's "parking" custom field, often a video link (API). */
  parkingField: string | null;
  /** Airbnb settings, filled by Claude. */
  airbnbCheckIn: string | null;
  airbnbCheckoutTasks: string[] | null;
}

export interface ManualValue {
  value: string | null;
  /** Where the text came from, shown under the value. */
  from: string;
}

const FROM_MANUAL = 'Sync Hostaway';

export function manualValues(i: ManualInputs): Record<ManualPart, ManualValue> {
  // The first manual that has a part wins, part by part.
  const manuals = [i.customManual, i.dashboardManual, i.specialInstruction].map(splitManual);
  const pick = (part: ManualPart) => manuals.find((m) => m[part])?.[part] ?? null;

  const checkIn = pick('manualCheckIn');
  const checkOut = pick('manualCheckOut');
  const parkingText = pick('manualParking');
  const tasks = (i.airbnbCheckoutTasks ?? []).filter(Boolean);

  const link = i.parkingField?.trim() || null;
  const parking = parkingText && link && !parkingText.includes(link) ? `${parkingText}\n\n${link}` : (parkingText ?? link);

  return {
    manualCheckIn: checkIn
      ? { value: checkIn, from: FROM_MANUAL }
      : { value: i.airbnbCheckIn?.trim() || null, from: "Airbnb's check-in instructions" },
    manualCheckOut: checkOut
      ? { value: checkOut, from: FROM_MANUAL }
      : { value: tasks.length ? tasks.map((t) => `• ${t}`).join('\n') : null, from: "Airbnb's checkout tasks" },
    manualRubbish: { value: pick('manualRubbish'), from: FROM_MANUAL },
    manualParking: { value: parking, from: FROM_MANUAL },
  };
}

/** Dashboard fields the manual parts read; the Claude fill keeps them up to date. */
export const MANUAL_DASHBOARD_KEYS = ['houseManual', 'airbnbCheckinInstructions', 'airbnbCheckoutTasks'] as const;
