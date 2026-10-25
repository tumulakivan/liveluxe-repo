import { CUSTOM_FIELD_NAMES } from '@repo/shared';
import type { HostawayListing } from './hostaway.ts';

// Hostaway listing → this app's field values, for every field whose source is 'hostaway'.

export interface Lookups {
  propertyTypes: Map<number, string>;
  cancellationPolicies: Map<number, string>;
}

type L = HostawayListing;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const bool = (v: unknown): boolean | null => (v === 1 || v === true ? true : v === 0 || v === false ? false : null);
/** Hostaway stores markups as multipliers: 1.31 → 31. */
const markup = (v: unknown): number | null => (typeof v === 'number' ? Math.round((v - 1) * 1000) / 10 : null);

const ROOM_TYPES: Record<string, string> = {
  entire_home: 'Entire home',
  private_room: 'Private room',
  shared_room: 'Shared room',
};

const CANCELLATION_FALLBACK: Record<string, string> = { flexible: 'Flexible', moderate: 'Moderate', strict: 'Strict' };

const LANGUAGES: Record<string, string> = { en: 'English' };

const policy = (lk: Lookups, id: unknown): string | null => {
  const n = num(id);
  if (n === null) return null;
  return lk.cancellationPolicies.get(n) ?? `Policy #${n}`;
};

export function images(l: L): { url: string; sortOrder: number }[] {
  const list = Array.isArray(l.listingImages) ? (l.listingImages as { url?: string; sortOrder?: number }[]) : [];
  return list
    .filter((i): i is { url: string; sortOrder?: number } => typeof i.url === 'string')
    .map((i) => ({ url: i.url, sortOrder: i.sortOrder ?? 0 }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function tagNames(l: L): string[] {
  const list = Array.isArray(l.listingTags) ? (l.listingTags as { name?: string }[]) : [];
  return list.map((t) => t.name).filter((n): n is string => !!n);
}

function customField(l: L, name: string): string | null {
  const list = Array.isArray(l.customFieldValues)
    ? (l.customFieldValues as { value?: unknown; customField?: { name?: string } }[])
    : [];
  return str(list.find((c) => c.customField?.name === name)?.value);
}

export function hostawayValues(l: L, lk: Lookups): Record<string, unknown> {
  const v: Record<string, unknown> = {
    internalName: str(l.internalListingName) ?? str(l.name),
    externalName: str(l.externalListingName),
    tags: tagNames(l),
    description: str(l.description),
    propertyType: num(l.propertyTypeId) !== null ? (lk.propertyTypes.get(l.propertyTypeId as number) ?? null) : null,
    roomType: ROOM_TYPES[String(l.roomType)] ?? str(l.roomType),
    personCapacity: num(l.personCapacity),
    maxChildren: num(l.maxChildrenAllowed),
    bedrooms: num(l.bedroomsNumber),
    beds: num(l.bedsNumber),
    bathrooms: num(l.bathroomsNumber),
    bathroomType: str(l.bathroomType)?.replace(/^./, (c) => c.toUpperCase()) ?? null,
    guestBathrooms: num(l.guestBathroomsNumber),

    address: str(l.address),
    publicAddress: str(l.publicAddress),
    street: str(l.street),
    city: str(l.city),
    state: str(l.state),
    zipcode: str(l.zipcode),
    country: str(l.country),
    timeZone: str(l.timeZoneName),
    coordinates: num(l.lat) !== null && num(l.lng) !== null ? `${l.lat}, ${l.lng}` : null,

    photoCount: images(l).length,

    markupAirbnb: markup(l.airbnbOfficialListingMarkup),
    markupVrbo: markup(l.homeawayApiMarkup),
    markupMarriott: markup(l.marriottListingMarkup),
    markupBookingEngine: markup(l.bookingEngineMarkup),
    markupPartners: markup(l.partnersListingMarkup),

    houseRules: str(l.houseRules),
    keyPickup: str(l.keyPickup),
    specialInstruction: str(l.specialInstruction),
    doorCode: str(l.doorSecurityCode),
    wifiUsername: str(l.wifiUsername),
    wifiPassword: str(l.wifiPassword),
    checkInStart: num(l.checkInTimeStart),
    checkInEnd: num(l.checkInTimeEnd),
    checkOut: num(l.checkOutTime),
    instantBookable: bool(l.instantBookable),
    allowSameDayBooking: bool(l.allowSameDayBooking),
    airbnbAdvanceNotice: num(l.airbnbBookingLeadTime),
    airbnbAllowRequests: bool(l.airbnbBookingLeadTimeAllowRequestToBook),
    vrboLeadTime: num(l.instantBookableLeadTime),
    bookingEngineLeadTime: num(l.bookingEngineLeadTime),
    squareMeters: num(l.squareMeters),
    language: LANGUAGES[String(l.language)] ?? str(l.language),
    cleanlinessStatus: num(l.cleannessStatus) !== null ? String(l.cleannessStatus) : null,
    cleaningInstruction: str(l.cleaningInstruction),
    cancellationDirect:
      policy(lk, l.cancellationPolicyId) ?? CANCELLATION_FALLBACK[String(l.cancellationPolicy)] ?? null,
    cancellationAirbnb: policy(lk, l.airbnbCancellationPolicyId),
    cancellationVrbo: policy(lk, l.vrboCancellationPolicyId),
    cancellationBookingcom: policy(lk, l.bookingCancellationPolicyId),
    cancellationMarriott: policy(lk, l.marriottCancellationPolicyId),

    minNights: num(l.minNights),
    maxNights: num(l.maxNights),

    airbnbName: str(l.airbnbName),
    airbnbSummary: str(l.airbnbSummary),
    airbnbSpace: str(l.airbnbSpace),
    airbnbAccess: str(l.airbnbAccess),
    airbnbInteraction: str(l.airbnbInteraction),
    airbnbNeighborhood: str(l.airbnbNeighborhoodOverview),
    airbnbTransit: str(l.airbnbTransit),
    airbnbNotes: str(l.airbnbNotes),

    vrboName: str(l.homeawayPropertyName),
    vrboHeadline: str(l.homeawayPropertyHeadline),
    vrboDescription: str(l.homeawayPropertyDescription),

    bookingcomName: str(l.bookingcomPropertyName),
    bookingcomRoomName: str(l.bookingcomPropertyRoomName),
    bookingcomDescription: str(l.bookingcomPropertyDescription),

    marriottName: str(l.marriottListingName),
  };
  for (const [key, name] of Object.entries(CUSTOM_FIELD_NAMES)) v[key] = customField(l, name);
  return v;
}

/** Listed status and listing link per Hostaway platform key. */
export function hostawayPlatforms(l: L): Record<string, { listed: boolean; url: string | null }> {
  return {
    airbnb: { listed: l.airbnbExportStatus === 'exported', url: str(l.airbnbListingUrl) },
    bookingcom: { listed: l.bookingcomExportStatus === 'exported', url: null },
    vrbo: { listed: l.vrboExportStatus === 'exported', url: str(l.vrboListingUrl) },
  };
}
