# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Chosen with the client, 2026-10-25:

- pnpm workspaces monorepo: `apps/web`, `apps/api`, `packages/shared`.
- Web: React + TypeScript, Vite, Tailwind CSS, React Router 7, TanStack Query and TanStack Table, shadcn/ui + Radix + lucide. Extra component references from 21st.dev, restyled to fit this project's design.
- API: Node 24 + Hono, Zod schemas shared with the web app, SQLite on a Railway volume with Drizzle ORM.
- Reports (admins only): CSV (hand-written writer with formula guarding) and PDF (`pdfkit`, since the API runs TypeScript on Node without a JSX build), both generated on the server from one report builder.
- Hosting: one Railway service on Ivan's account, serving the API and the built web app.

## Users

- **Live Luxe staff (primary, no account).** The internal operations team of Live Luxe AU, a short- and mid-term rental operator in Melbourne with about 130 listings. They open the main app to look up a property's details while doing a task: answering a guest, briefing a cleaner, checking which platforms a unit is on, or pulling a report. They browse read-only, without signing in. The link isn't shared outside the company.
- **Admins (accounts created by hand).** A few people who maintain the repo: they run Sync Hostaway, add properties that aren't in Hostaway yet, edit the fields this app owns, manage platforms, and manage other admin accounts.

There are no other account types.

## Product Purpose

A single, fast reference for every Live Luxe property and its details, built from Hostaway data. It replaces digging through the Hostaway listing editor, whose fields are spread across many tabs. It also produces CSV and PDF reports from filters such as "listed on platform X" or "not listed on platform Y".

Success means a staff member can find a property and the detail they need in seconds, and a report can be pulled without asking anyone.

## Positioning

It holds Live Luxe's own view of the portfolio. That includes Hostaway's API fields, the fields only visible in Hostaway's dashboard, and the facts Hostaway doesn't hold at all: manual platforms such as SilverDoor, new listings not yet in Hostaway, and notes.

## Operating Context

- Used mostly on desktop in the office. Phones must still work for quick look-ups on site.
- Hostaway (account 71167) is the source of truth for listing data. This app never writes to Hostaway.
- Property data arrives three ways:
  - **Sync Hostaway:** an admin-only dashboard button that fetches the fields the public API returns.
  - **Claude fill:** Claude reads dashboard-only fields with Claude in Chrome and writes them through this app's API with an admin-issued token.
  - **Admins:** manual entry in the dashboard.
- Pricing comes from PriceLabs. Hostaway base prices are placeholders, so prices are not a field here.

## Capabilities and Constraints

- **Two surfaces, like the office booking app:** the main app (browse) and an admin dashboard at `/admin`.
  - The main app has a small "Admin sign-in" link. Visitors who aren't signed in have no other route to the dashboard.
  - The server enforces every admin-only action.
  - Nothing (accounts, sessions, permission code) is shared with the office booking app.
- **Properties:**
  - Every existing Hostaway listing is imported first, then admins add new ones by hand. A manual property can later be linked to its Hostaway listing.
  - Removing a property hides it in this app only, and a sync never brings it back.
  - Archived listings are hidden by default, with an "include archived" toggle.
- **Fields:**
  - Every field in the field map is included: Basic info, Address, Media, Markup % per channel, Additional info & Policies, Booking settings, Channel specific, Custom fields. The full list is in the client's vault note "Listing Repo/Field Map".
  - Everyone sees the same fields, signed in or not. That includes door codes and Wi-Fi details, by the client's choice.
  - **Media is a photo count plus one display photo.** The display photo appears in Card view and in the side panel. No property shows a gallery.
  - **Hostaway properties:** the display photo is Hostaway's first photo, linked from Hostaway rather than stored.
  - **Properties added by hand:** the upload field takes several photos at once, and the admin picks the display photo. Only that photo is stored (resized) on the Railway volume; the rest only set the photo count.
  - **After linking to Hostaway:** the uploaded photo stays as the display photo. The photo count then comes from Sync Hostaway.
  - Channel-specific fields appear only for platforms the property is on.
- **Editing:**
  - Fields from the Hostaway API are read-only on imported properties; they're fixed in Hostaway, then synced.
  - Dashboard-only fields and app-only fields are editable by admins.
  - Manual properties are fully editable until linked.
  - Every field records who last set it (Sync, Claude or an admin) and when.
- **Platforms:**
  - Starting platforms: Airbnb, Booking.com, Vrbo, Blueground, SilverDoor.
  - Admins add more. Each is either a Hostaway platform (status from sync) or a manual one (ticked per property).
  - A manual platform can later be mapped to a Hostaway channel.
  - Platforms are retired, never deleted.
  - Each property stores its listing URL or ID per platform.
  - Marriott, Google and Expedia are on hold.
- **Browsing:**
  - Three views of all properties: **Tile** (square), **Card** (a rectangular tile with the property's first photo) and a simple **List**.
  - Tile and Card show the property name as the title, then the Listing ID (when it has one), listing status, tags, and a short description if it fits.
  - **Listing status** is a row of round bubbles, one per platform the property is listed on, each showing that platform's icon. A property listed nowhere shows the text "Not listed yet" instead.
    - Icons come from `assets/platform-icons/`, supplied by the client. Linking each file to its platform is still to be built.
    - A platform without an icon shows its initials in the bubble. That's the default.
  - **Tags** are shown as ordinary tags: small labels with the Hostaway tag names.
  - Clicking a property opens a panel from the right with all its fields, grouped. Guests read; admins edit.
  - Proper pagination.
- **Reports (admins only, on the dashboard Reports page):**
  - One report builder drives the preview, the CSV and the PDF, so they always match.
  - Filters: each platform Any / Listed / Not listed (all of or any of), not listed anywhere, area, tags, Active tag, added by hand, archived (leave out / include / only), and fields that are still empty.
  - Columns: Summary or Everything presets, or any fields, remembered per browser. PDFs fit up to 10 columns; CSVs have no limit.
- **Dashboard:**
  - Sync Hostaway, with a short summary of what changed.
  - Admin accounts, platforms, an API token for Claude, and a "Missing fields" view.
  - The Claude fill has a batch write with a dry run.
- **Undecided:**
  - Whether Marriott-only fields are stored and hidden now or skipped.
  - The rest of the UI brief: the admin dashboard and reports.

## Brand Commitments

- Live Luxe AU's brand as shown on https://liveluxe.au/projects-page. The client gave it as a reference.
- Other references from the client, in `claude-ref/`:
  - `ref-2.png`: compact order cards with a status badge, chips and a footer action.
  - `ref-3.png`: a property detail layout with the photo on one side and details beside it.
  - `ref-4.png`: real-estate app cards, filter chips and a list with thumbnails.
- Name: "Listing Repo" is a working name.

## Evidence on Hand

- Real listing data through the Hostaway API (about 130 listings, 117 active). The example listings used are 317097 and 398565.
- No logo files in the repo yet. The Live Luxe monogram is visible on liveluxe.au.
- Don't fabricate properties, reviews or figures. Demo data must be clearly marked and removable.

## Product Principles

1. **Finding a fact beats browsing.** Every view gets a person to one property's details as fast as possible.
2. **Say where each value came from.** A field shows whether Hostaway, Claude or an admin set it, and when.
3. **Hostaway stays the source of truth.** The app adds to Hostaway and never overwrites or writes back to it.
4. **One filter, every output.** The screen, the CSV and the PDF never disagree.
5. **Small and sturdy.** Built for about five people at once: one process, no extra services.

## Accessibility & Inclusion

WCAG 2.2 AA: readable contrast, full keyboard use (including the side panel and pagination), and screen-reader labels.
