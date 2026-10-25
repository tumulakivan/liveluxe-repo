// The field registry: every property field the app knows, in display order.
// The API (sync, storage, editing) and the web app (panel, reports) both read it.
// Source of the list: the vault note "Listing Repo/Field Map".

export type PlatformKey = 'airbnb' | 'bookingcom' | 'vrbo' | 'marriott';

/**
 * Where a value comes from.
 * - hostaway: the Hostaway public API. Set by Sync Hostaway, read-only for admins on imported properties.
 * - dashboard: only visible in Hostaway's dashboard. Filled by Claude or an admin.
 * - app: exists only in this app. Filled by an admin.
 */
export type FieldSource = 'hostaway' | 'dashboard' | 'app';

export type FieldType =
  | 'text'
  | 'longtext'
  | 'number'
  | 'boolean'
  | 'hour' // hour of the day, 0-23
  | 'hours' // a duration in hours
  | 'percent'
  | 'list';

export type SectionKey =
  | 'basic'
  | 'address'
  | 'media'
  | 'markups'
  | 'additional'
  | 'booking'
  | 'channel'
  | 'custom';

export interface SectionDef {
  key: SectionKey;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  section: SectionKey;
  /** Sub-heading inside a section. */
  group?: string;
  source: FieldSource;
  type: FieldType;
  /** Shown only when the property is listed on this platform. */
  platform?: PlatformKey;
  /** Kept in storage but not shown, e.g. fields of platforms on hold. */
  hidden?: boolean;
}

export const SECTIONS: SectionDef[] = [
  { key: 'basic', label: 'Basic info' },
  { key: 'address', label: 'Address' },
  { key: 'media', label: 'Media' },
  { key: 'markups', label: 'Markups' },
  { key: 'additional', label: 'Additional info & policies' },
  { key: 'booking', label: 'Booking settings' },
  { key: 'channel', label: 'Channel specific' },
  { key: 'custom', label: 'Custom fields' },
];

const f = (
  key: string,
  label: string,
  section: SectionKey,
  source: FieldSource,
  type: FieldType,
  extra: Partial<Pick<FieldDef, 'group' | 'platform' | 'hidden'>> = {},
): FieldDef => ({ key, label, section, source, type, ...extra });

export const FIELDS: FieldDef[] = [
  // Basic info
  f('internalName', 'Internal listing name', 'basic', 'hostaway', 'text'),
  f('externalName', 'External listing name', 'basic', 'hostaway', 'text'),
  f('tags', 'Tags', 'basic', 'hostaway', 'list'),
  f('description', 'Description', 'basic', 'hostaway', 'longtext'),
  f('propertyType', 'Property type', 'basic', 'hostaway', 'text'),
  f('roomType', 'Room type', 'basic', 'hostaway', 'text'),
  f('personCapacity', 'Person capacity', 'basic', 'hostaway', 'number'),
  f('maxChildren', 'Maximum children', 'basic', 'hostaway', 'number'),
  f('bedrooms', 'Bedrooms', 'basic', 'hostaway', 'number'),
  f('beds', 'Beds', 'basic', 'hostaway', 'number'),
  f('bathrooms', 'Bathrooms', 'basic', 'hostaway', 'number'),
  f('bathroomType', 'Bathroom type', 'basic', 'hostaway', 'text'),
  f('guestBathrooms', 'Guest bathrooms', 'basic', 'hostaway', 'number'),
  f('totalFloors', 'Total floor count', 'basic', 'dashboard', 'number'),
  f('floorNumber', 'Floor number', 'basic', 'dashboard', 'number'),

  // Address
  f('address', 'Address', 'address', 'hostaway', 'text'),
  f('publicAddress', 'Public address', 'address', 'hostaway', 'text'),
  f('street', 'Street', 'address', 'hostaway', 'text'),
  f('city', 'City', 'address', 'hostaway', 'text'),
  f('state', 'State', 'address', 'hostaway', 'text'),
  f('zipcode', 'Postcode', 'address', 'hostaway', 'text'),
  f('country', 'Country', 'address', 'hostaway', 'text'),
  f('timeZone', 'Timezone', 'address', 'hostaway', 'text'),
  f('coordinates', 'Coordinates', 'address', 'hostaway', 'text'),
  f('showExactLocation', 'Show exact location to guests', 'address', 'dashboard', 'boolean'),

  // Media
  f('photoCount', 'Photos', 'media', 'hostaway', 'number'),

  // Markups
  f('markupAirbnb', 'Airbnb', 'markups', 'hostaway', 'percent', { platform: 'airbnb' }),
  f('markupBookingcom', 'Booking.com (per rate plan)', 'markups', 'dashboard', 'text', { platform: 'bookingcom' }),
  f('markupVrbo', 'Vrbo', 'markups', 'hostaway', 'percent', { platform: 'vrbo' }),
  f('markupMarriott', 'Marriott', 'markups', 'hostaway', 'percent', { platform: 'marriott', hidden: true }),
  f('markupBookingEngine', 'Booking engine', 'markups', 'hostaway', 'percent', { group: 'Direct' }),
  f('markupPartners', 'Partners', 'markups', 'hostaway', 'percent', { group: 'Direct' }),

  // Additional info & policies
  f('houseRules', 'House rules', 'additional', 'hostaway', 'longtext', { group: 'Guest information' }),
  f('houseManual', 'House manual', 'additional', 'dashboard', 'longtext', { group: 'Guest information' }),
  f('airbnbCheckinInstructions', 'Airbnb check-in instructions', 'additional', 'dashboard', 'longtext', { group: 'Guest information' }),
  f('keyPickup', 'Key pickup', 'additional', 'hostaway', 'longtext', { group: 'Guest information' }),
  f('specialInstruction', 'Special instruction', 'additional', 'hostaway', 'longtext', { group: 'Guest information' }),
  f('doorCode', 'Door code', 'additional', 'hostaway', 'text', { group: 'Access' }),
  f('autoDoorCode', 'Automatically generate a door code', 'additional', 'dashboard', 'boolean', { group: 'Access' }),
  f('phoneNumberCode', 'Phone number-based code', 'additional', 'dashboard', 'boolean', { group: 'Access' }),
  f('wifiUsername', 'Wi-Fi username', 'additional', 'hostaway', 'text', { group: 'Access' }),
  f('wifiPassword', 'Wi-Fi password', 'additional', 'hostaway', 'text', { group: 'Access' }),
  f('checkInStart', 'Check-in from', 'additional', 'hostaway', 'hour', { group: 'Times' }),
  f('checkInEnd', 'Check-in until', 'additional', 'hostaway', 'hour', { group: 'Times' }),
  // Hostaway's checkOutTime is the latest check-out; the dashboard adds an earliest one (checkOutTimeStart).
  f('checkOutStart', 'Check-out from', 'additional', 'dashboard', 'hour', { group: 'Times' }),
  f('checkOut', 'Check-out by', 'additional', 'hostaway', 'hour', { group: 'Times' }),
  f('instantBookable', 'Instant bookable', 'additional', 'hostaway', 'boolean', { group: 'Booking rules' }),
  f('allowSameDayBooking', "Booking.com same-day booking", 'additional', 'hostaway', 'boolean', { group: 'Booking rules' }),
  f('airbnbAdvanceNotice', 'Airbnb advance notice', 'additional', 'hostaway', 'hours', { group: 'Booking rules' }),
  f('airbnbAllowRequests', 'Airbnb requests without advance notice', 'additional', 'hostaway', 'boolean', { group: 'Booking rules' }),
  f('bookingcomLeadTime', 'Booking.com lead time', 'additional', 'dashboard', 'text', { group: 'Booking rules' }),
  f('vrboLeadTime', 'Vrbo booking lead time', 'additional', 'hostaway', 'hours', { group: 'Booking rules' }),
  f('bookingEngineLeadTime', 'Booking engine lead time', 'additional', 'hostaway', 'hours', { group: 'Booking rules' }),
  f('squareMeters', 'Square metres', 'additional', 'hostaway', 'number', { group: 'Property' }),
  f('language', 'Language', 'additional', 'hostaway', 'text', { group: 'Property' }),
  f('languagesSpoken', 'Languages spoken', 'additional', 'dashboard', 'list', { group: 'Property' }),
  f('cleanlinessStatus', 'Cleanliness status', 'additional', 'hostaway', 'text', { group: 'Property' }),
  f('cleaningInstruction', 'Cleaning instruction', 'additional', 'hostaway', 'longtext', { group: 'Property' }),
  f('cancellationDirect', 'Direct channels', 'additional', 'hostaway', 'text', { group: 'Cancellation policy' }),
  f('cancellationAirbnb', 'Airbnb', 'additional', 'hostaway', 'text', { group: 'Cancellation policy', platform: 'airbnb' }),
  f('cancellationAirbnbLongTerm', 'Airbnb long-term', 'additional', 'dashboard', 'text', { group: 'Cancellation policy', platform: 'airbnb' }),
  f('cancellationVrbo', 'Vrbo', 'additional', 'hostaway', 'text', { group: 'Cancellation policy', platform: 'vrbo' }),
  f('cancellationBookingcom', 'Booking.com', 'additional', 'hostaway', 'text', { group: 'Cancellation policy', platform: 'bookingcom' }),
  f('cancellationBookingcomRatePlans', 'Booking.com per rate plan', 'additional', 'dashboard', 'longtext', { group: 'Cancellation policy', platform: 'bookingcom' }),
  f('nonRefundableDiscount', 'Non-refundable discount offered', 'additional', 'dashboard', 'boolean', { group: 'Cancellation policy', platform: 'airbnb' }),
  f('cancellationMarriott', 'Marriott', 'additional', 'hostaway', 'text', { group: 'Cancellation policy', platform: 'marriott', hidden: true }),
  f('smokingAllowed', 'Smoking allowed', 'additional', 'dashboard', 'boolean', { group: 'Property policy', platform: 'bookingcom' }),
  f('partiesAllowed', 'Parties allowed', 'additional', 'dashboard', 'boolean', { group: 'Property policy', platform: 'bookingcom' }),
  f('quietHours', 'Quiet hours', 'additional', 'dashboard', 'text', { group: 'Property policy', platform: 'bookingcom' }),
  f('petsAllowed', 'Pets allowed', 'additional', 'dashboard', 'boolean', { group: 'Property policy', platform: 'bookingcom' }),
  f('minimumCheckInAge', 'Minimum check-in age', 'additional', 'dashboard', 'text', { group: 'House policies', platform: 'bookingcom' }),
  f('linenRented', 'Bed linen & towels rented at the property', 'additional', 'dashboard', 'boolean', { group: 'House policies', platform: 'bookingcom' }),
  f('requireBookerAddress', "Require the booker's address", 'additional', 'dashboard', 'boolean', { group: 'Booking policies', platform: 'bookingcom' }),
  f('requireBookerPhone', "Require the booker's phone number", 'additional', 'dashboard', 'boolean', { group: 'Booking policies', platform: 'bookingcom' }),
  f('cardDetailsOnExtranet', "Property can view guest's card on Extranet", 'additional', 'dashboard', 'boolean', { group: 'Payment preferences', platform: 'bookingcom' }),
  f('acceptedPaymentTypes', 'Accepted payment types', 'additional', 'dashboard', 'list', { group: 'Payment preferences', platform: 'bookingcom' }),
  f('freeCancelBeforeCheckIn', 'Free cancellation before check-in', 'additional', 'dashboard', 'boolean', { group: 'Cancellation exceptions', platform: 'bookingcom' }),
  f('gracePeriodCancel', 'Grace period to cancel after booking', 'additional', 'dashboard', 'boolean', { group: 'Cancellation exceptions', platform: 'bookingcom' }),

  // Booking settings
  f('minNights', 'Minimum nights', 'booking', 'hostaway', 'number'),
  f('maxNights', 'Maximum nights', 'booking', 'hostaway', 'number'),
  f('gapNights', 'Reservations for gap nights', 'booking', 'dashboard', 'boolean'),

  // Channel specific: Airbnb
  f('airbnbName', 'Listing name', 'channel', 'hostaway', 'text', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbSummary', 'Summary', 'channel', 'hostaway', 'longtext', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbSpace', 'The space', 'channel', 'hostaway', 'longtext', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbAccess', 'Guest access', 'channel', 'hostaway', 'longtext', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbInteraction', 'Interaction', 'channel', 'hostaway', 'longtext', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbNeighborhood', 'Neighbourhood overview', 'channel', 'hostaway', 'longtext', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbTransit', 'Transit', 'channel', 'hostaway', 'longtext', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbNotes', 'Notes', 'channel', 'hostaway', 'longtext', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbPreparationTime', 'Preparation time', 'channel', 'dashboard', 'text', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbInstantBookCategories', 'Instant booking allowed categories', 'channel', 'dashboard', 'text', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbInstantBookMessage', 'Instant book welcome message', 'channel', 'dashboard', 'longtext', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbLastMinuteDiscounts', 'Last-minute discounts', 'channel', 'dashboard', 'text', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbEarlyBirdDiscounts', 'Early-bird discounts', 'channel', 'dashboard', 'text', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbMobileDiscount', 'Mobile-only discount', 'channel', 'dashboard', 'boolean', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbTopRatedDiscount', 'Top-rated guests discount', 'channel', 'dashboard', 'boolean', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbExpectations', 'Listing expectations', 'channel', 'dashboard', 'list', { group: 'Airbnb', platform: 'airbnb' }),
  f('airbnbCheckoutTasks', 'Checkout tasks', 'channel', 'dashboard', 'list', { group: 'Airbnb', platform: 'airbnb' }),

  // Channel specific: Vrbo
  f('vrboName', 'Property name', 'channel', 'hostaway', 'text', { group: 'Vrbo', platform: 'vrbo' }),
  f('vrboHeadline', 'Property headline', 'channel', 'hostaway', 'text', { group: 'Vrbo', platform: 'vrbo' }),
  f('vrboDescription', 'Property description', 'channel', 'hostaway', 'longtext', { group: 'Vrbo', platform: 'vrbo' }),
  f('vrboPaymentByInvoice', 'Handle payment by invoice or at location', 'channel', 'dashboard', 'boolean', { group: 'Vrbo', platform: 'vrbo' }),
  f('vrboDiscounts', 'Vrbo discounts', 'channel', 'dashboard', 'text', { group: 'Vrbo', platform: 'vrbo' }),

  // Channel specific: Booking.com
  f('bookingcomName', 'Property name', 'channel', 'hostaway', 'text', { group: 'Booking.com', platform: 'bookingcom' }),
  f('bookingcomRoomName', 'Room type', 'channel', 'hostaway', 'text', { group: 'Booking.com', platform: 'bookingcom' }),
  f('bookingcomDescription', 'Property description', 'channel', 'hostaway', 'longtext', { group: 'Booking.com', platform: 'bookingcom' }),
  f('bookingcomWelcome', 'Welcome message', 'channel', 'dashboard', 'longtext', { group: 'Booking.com', platform: 'bookingcom' }),
  f('bookingcomCheckinMethod', 'Check-in method', 'channel', 'dashboard', 'text', { group: 'Booking.com', platform: 'bookingcom' }),
  f('bookingcomRatePlans', 'Rate plans', 'channel', 'dashboard', 'list', { group: 'Booking.com', platform: 'bookingcom' }),

  // Channel specific: Marriott (platform on hold)
  f('marriottName', 'Marriott listing name', 'channel', 'hostaway', 'text', { group: 'Marriott', platform: 'marriott', hidden: true }),

  // Custom fields (Hostaway custom field names in CUSTOM_FIELD_NAMES)
  f('cfDropOffCode', 'Drop-off code', 'custom', 'hostaway', 'text'),
  f('cfHostelRoom', 'Hostel room', 'custom', 'hostaway', 'text'),
  f('cfHouseManual', 'House manual (custom field)', 'custom', 'hostaway', 'longtext'),
  f('cfLevelAndUnit', 'Level and unit', 'custom', 'hostaway', 'text'),
  f('cfParking', 'Parking', 'custom', 'hostaway', 'longtext'),
  f('cfReusableCode', 'Reusable code', 'custom', 'hostaway', 'text'),
  f('cfStore', 'Key store', 'custom', 'hostaway', 'longtext'),
];

/** Field key → Hostaway custom field name. */
export const CUSTOM_FIELD_NAMES: Record<string, string> = {
  cfDropOffCode: 'drop of code',
  cfHostelRoom: 'Hostel Room',
  cfHouseManual: 'housemanual',
  cfLevelAndUnit: 'levelandunit',
  cfParking: 'parking',
  cfReusableCode: 'reusablecode',
  cfStore: 'store',
};

export const FIELD_BY_KEY: ReadonlyMap<string, FieldDef> = new Map(FIELDS.map((d) => [d.key, d]));
