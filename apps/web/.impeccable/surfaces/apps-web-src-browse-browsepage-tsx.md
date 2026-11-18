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

THESIS: Live Luxe's own portfolio index, set in the house's voice, refusing the generic SaaS admin grid with a blue accent and a filter sidebar.

OWN-WORLD: Fonts, bronze and monogram from liveluxe.au; cool greys by the client's choice (2026-11-18, replacing the brand's warm limestone and gold). Mist ground #EEF0F2, paper #F8F9FA, ink #0A0A0C, bronze #7C5E26 for active state and links, silver hairlines rgb(168 175 186 / .75) as dividers, Steel Edge #7F8690 around every control, Cormorant Garamond 600 for property names and headings, Jost for everything operational, tracked Jost capitals for metadata. Square corners, no shadows on resting cards. DESIGN.md is normative for values.

STORY: Staff see the whole portfolio, narrow it by platform or area in one click, open a property and read the exact field they came for.

FIRST VIEWPORT: Hairline-ruled top bar (monogram, "Listing Repo"; Dashboard at right for signed-in admins only). Serif "Properties" with live count, search field, then the filter block: Platform, Area and Tags dropdowns in a row (one row of three on phones) with chosen values as removable chips beneath. Below it, a results bar: "Clear search and filters" at left when anything is active; Include archived, sort and the view switch at right. Card grid below, three across at 1440. "Admin sign-in" lives in a quiet footer for visitors who aren't signed in (client's choice, 2026-11-18).

FORM: Signature move: house-styled filter dropdowns (client's choice, 2026-11-18, replacing the original precinct-index rows): square paper triggers with a bronze tracked-capital label, a checklist popover with tabular counts, "Not listed yet" as a peer of the platforms, and a bronze border once something is chosen. Position 1 of 1 (client-specified composition; surface roll recorded after the build). seed:0d2371575f057e4e (surface roll recorded after the build; the client-pinned composition governs)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
