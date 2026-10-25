import type { FieldDef } from './fields.ts';

// Display text for values and times, shared by the web app, the CSV and the PDF.

const dateTime = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Australia/Melbourne',
});

export const formatWhen = (iso: string) => dateTime.format(new Date(iso));

const hour = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:00`;

function hours(h: number): string {
  if (h === 0) return 'Same day';
  if (h % 24 === 0) {
    const d = h / 24;
    return `${d} day${d === 1 ? '' : 's'}`;
  }
  return `${h} hours`;
}

/** Display text for a value, or null when there's nothing to show. */
export function formatValue(def: FieldDef, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  switch (def.type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'hour':
      return typeof value === 'number' ? hour(value) : String(value);
    case 'hours':
      return typeof value === 'number' ? hours(value) : String(value);
    case 'percent':
      return typeof value === 'number' ? `${value}%` : String(value);
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('en-AU') : String(value);
    case 'list':
      return Array.isArray(value) ? (value.length ? value.join(', ') : null) : String(value);
    default:
      return String(value);
  }
}
