---
version: 1
slug: "apps-web-src-browse-browsepage-tsx"
primary_target: "apps/web/src/browse/BrowsePage.tsx"
related_targets: []
---

# Surface: Browse (main app)

Mode: Operate. Live Luxe staff, no account, mostly desktop in the office, look up one property's detail mid-task; ~130 properties. Admins later edit from the same panel.

Confirmed with the client (2026-10-25): search + filters (platform, tag, area) above the views; Card view default, 24 per page; Tile, Card, List; listing status = platform bubbles or "Not listed yet"; ordinary tags; right panel = one scroll with a sticky section index; proper pagination.

## Direction contract

THESIS: Live Luxe's own portfolio index, set in the house's voice, refusing the grey SaaS admin grid with a blue accent and a filter sidebar.

OWN-WORLD: Brand-pinned from liveluxe.au: limestone ground #F2EEE6, ink #0A0A0C, bronze #7C5E26 for active state and links, gold hairlines rgba(211,172,96,.9) as the only dividers, Cormorant Garamond 600 for property names and headings, Jost for everything operational, tracked Jost capitals for metadata. Square corners, no shadows on resting cards.

STORY: Staff see the whole portfolio, narrow it by platform or area in one click, open a property and read the exact field they came for.

FIRST VIEWPORT: Hairline-ruled top bar (monogram, "Listing Repo", Admin sign-in at right). Serif "Properties" with live count, search field, then the signature index row. Below the index block, a results bar: "Clear search and filters" at left when anything is active; Include archived, sort and the view switch at right. They moved out of the index block in the finish round so the signature index rows get the full width. Card grid below, three across at 1440.

FORM: Signature move: the precinct index from the brand site turned into the filter row: tracked capitals with counts, "AIRBNB (82) · BOOKING.COM (89) · NOT LISTED YET (12)", bronze underline when active. Position 1 of 1 (client-specified composition; surface roll recorded after the build). seed:0d2371575f057e4e (surface roll recorded after the build; the client-pinned composition governs)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
