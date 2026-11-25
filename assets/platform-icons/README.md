# Platform icons

Drop one icon per platform here. These are shown in the round "listing status" bubbles on each property.

- **Format:** SVG preferred; PNG or WebP at least 128 × 128 px also work.
- **Shape:** square. The bubble crops it to a circle, so keep the mark centred with some padding.
- **Name:** the platform name in lowercase with hyphens, e.g. `airbnb.svg`, `booking-com.svg`, `vrbo.svg`, `blueground.svg`, `silverdoor.svg`.

Platforms without an icon show a bubble with their initials.

**In use:** copies of `airbnb.svg`, `vrbo.png` and the blue Booking.com `.jpg` (saved as `bookingcom.jpg`) are served from `apps/web/public/platform-icons/`, named by platform key. The key → file map is `BUILT_IN_ICONS` in `apps/api/src/properties.ts`. To add a logo: copy it there under the platform's key and add a line to that map. (`bookingdotcom.svg` is unused: it has no colour set, so it draws black.)
