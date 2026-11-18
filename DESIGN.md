---
name: Listing Repo
description: Live Luxe's own portfolio index, set in the house voice of liveluxe.au.
colors:
  ground: "#eef0f2"
  paper: "#f8f9fa"
  stone: "#e1e4e8"
  ink: "#0a0a0c"
  ink-soft: "#2e2d31"
  muted: "#555a62"
  bronze: "#7c5e26"
  bronze-deep: "#5f4719"
  hairline: "rgb(168 175 186 / 0.75)"
  hover-wash: "rgb(140 152 168 / 0.14)"
  edge: "#7f8690"
  danger: "#8a2c1f"
typography:
  display:
    fontFamily: "'Cormorant Garamond', 'Times New Roman', serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.015em"
  display-sm:
    fontFamily: "'Cormorant Garamond', 'Times New Roman', serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "'Cormorant Garamond', 'Times New Roman', serif"
    fontSize: "1.9rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.005em"
  headline-section:
    fontFamily: "'Cormorant Garamond', 'Times New Roman', serif"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "'Cormorant Garamond', 'Times New Roman', serif"
    fontSize: "1.3rem"
    fontWeight: 600
    lineHeight: 1.15
  title-sm:
    fontFamily: "'Cormorant Garamond', 'Times New Roman', serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  body-value:
    fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.2em"
  label-sm:
    fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    letterSpacing: "0.2em"
  data:
    fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "'tnum' 1, 'lnum' 1"
rounded:
  none: "0px"
  seal: "9999px"
spacing:
  gutter-sm: "20px"
  gutter-md: "32px"
  gutter-lg: "48px"
  stack: "32px"
  grid-gap: "20px"
  card-pad: "20px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.bronze-deep}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.hover-wash}"
  filter-dropdown:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "0 10px 0 12px"
  filter-dropdown-active:
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  text-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "44px"
    padding: "0 12px"
  search-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "48px"
  select:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "36px"
    padding: "0 32px 0 12px"
  view-switch-option:
    textColor: "{colors.muted}"
    typography: "{typography.label-sm}"
    height: "36px"
    padding: "0 12px"
  view-switch-option-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  page-step:
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "36px"
  page-step-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  tag:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  platform-bubble:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.seal}"
    size: "28px"
  platform-bubble-md:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.seal}"
    size: "36px"
  platform-bubble-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  property-card:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "{spacing.card-pad}"
  property-card-hover:
    backgroundColor: "{colors.paper}"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label-sm}"
    padding: "6px 10px"
  dossier-panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
    width: "52rem"
---

# Design System: Listing Repo

## Overview

**Creative North Star: "The House Index"**

The browse surface is Live Luxe's own portfolio index, set in the voice of liveluxe.au: a cool mist ground, ink type, bronze for whatever is active, and fine silver hairlines ruling the page like a printed register. It refuses the generic SaaS admin grid with a blue accent and a filter sidebar. The greys are quiet so the house elements carry the identity: the serif names, the tracked capitals, the bronze state and the round platform seals.

Two voices carry everything. Cormorant Garamond at 600 names things: the page heading, every property name, the panel's section headings. Jost does the work: controls, values, metadata, counts. The density is that of an office reference tool used mid-task by about five people: cards three across at 1440px, a property dossier that reads as one long scroll, nothing decorative that slows a look-up.

The fonts, the bronze and the LL monogram come from liveluxe.au. The cool grey ground replaced the brand site's warm limestone on 2026-11-18 at the client's request, for a calmer, less warm screen; bronze and ink were kept as the brand colours. The monogram sits in the top bar as an image (it renders black), and the favicon keeps the brand's own gold monogram on an ink square.

**Key Characteristics:**
- Mist ground, paper raised surfaces, pale slate image wells.
- Silver 1px hairlines divide; a darker steel edge outlines every control; bronze marks state; solid ink is the only filled control.
- Cormorant Garamond 600 for names and headings, Jost for operation, tracked Jost capitals for metadata.
- Square corners everywhere except the round platform seals.
- Flat at rest; only the floating panel and the dropdown popovers cast a shadow.

## Colors

A cool, near-neutral grey palette with one warm metal, bronze, for state.

### Primary
- **Bronze** (`colors.bronze`): the active-state colour. The focus ring, the text caret, the border of a filter dropdown with something chosen, link and quiet-action text ("Clear search and filters", "Show all"), filter labels inside the dropdowns, field-group labels, Listing IDs in card metadata, provenance lines under field values, and the live count beside "Properties". 5.3:1 as text on ground, 5.7:1 on paper.
- **Bronze Deep** (`colors.bronze-deep`): hover state of solid ink buttons only.

### Neutral
- **Mist Ground** (`colors.ground`): the page. Also the `theme-color` meta.
- **Paper** (`colors.paper`): raised surfaces: the dossier panel, dropdown popovers and their triggers, inputs, the error box, card hover fill, tags, chips and platform seals.
- **Pale Slate** (`colors.stone`): image wells, the "No photo" placeholder and the shimmer base.
- **Ink** (`colors.ink`): headings and property names, primary values, and the fill of every solid control (primary button, current page, active view, tooltip, panel scrim at 25%).
- **Ink Soft** (`colors.ink-soft`): default body text, tag text, seal initials, secondary table cells.
- **Slate Muted** (`colors.muted`): the lightest text colour allowed: field labels, summaries, placeholders, empty values, unchosen dropdown values. 6.1:1 on ground, 5.5:1 on pale slate.
- **Silver Hairline** (`colors.hairline`): dividers and rules only, at 1px: page rules, card edges, row rules, the popover and panel borders, tags and seals.
- **Silver Wash** (`colors.hover-wash`): hover and focus fill for quiet controls (secondary button, selects, dropdown triggers, view-switch options, page steps, popover rows).
- **Steel Edge** (`colors.edge`): the border of every control a person types into or opens: text inputs, textareas, selects, filter dropdown triggers, the view switch and the search field's underline. 3.2:1 on ground and 3.3:1 on paper, so controls meet WCAG's 3:1 rule for non-text contrast.

### Status
- **Danger Red** (`colors.danger`): errors and destructive actions only. Error notices, the outlined danger button ("Remove account") that fills red on hover, the "Removed from the repo" flag in the admin panel, and the "Couldn't copy" line. About 8:1 on paper and 7.5:1 on ground. Never decorative.

### Named Rules
**The Hairline Rule.** Dividers and rules are a 1px Silver Hairline. Inner rules use it at reduced strength (60% inside the popover, 55% on card edges, 45% between rows, 35% between dossier fields). The hairline never fills a surface and is never text.

**The Edge Rule.** Anything a person types into or opens gets a Steel Edge border, never the hairline. The hairline sits at about 1.6:1 on the ground and is too faint to mark a control.

**The Hairline Carries Nothing Rule.** Any state a person must perceive is carried by bronze, ink or text, never by the hairline or the wash alone.

**The Bronze Means Here Rule.** Bronze marks where you are and what is chosen: a filter dropdown's border once something is picked, the focus ring, the caret, the current section in the dossier index. It is the only warm colour on the page; don't spend it on decoration.

## Typography

**Display Font:** Cormorant Garamond 600 (with 'Times New Roman', serif)
**Body Font:** Jost 400 / 500 (with 'Helvetica Neue', Arial, sans-serif)

Both are self-hosted through Fontsource.

**Character:** A high-contrast house serif that names properties as if in a printed register, against a geometric sans that does the operating quietly.

### Hierarchy
- **Display** (`typography.display`): "Properties" only. 2.75rem below 640px, 3.5rem above; leading 1; tracking -0.015em.
- **Headline** (`typography.headline`): the property name at the top of the dossier panel. Empty-state and error headings use the same serif at 1.875rem and 1.5rem.
- **Headline Section** (`typography.headline-section`): dossier section headings, ruled beneath with a hairline and followed by a tracked "N of M filled" count.
- **Title** (`typography.title`): property names on cards (1.3rem), tiles (1.3rem), phone list rows and table rows (1.1rem); clamped to two lines on cards and tiles. Long unbroken names wrap rather than overflow.
- **Body** (`typography.body`): summaries, help copy, table cells, dropdown values and options. Long prose caps at 68ch (field text), 52ch (panel messages) or 48ch (empty-state copy).
- **Body Value** (`typography.body-value`): dossier field values; field labels sit beside them at 0.8125rem in Slate Muted.
- **Label** (`typography.label`): tracked capitals, uppercase, Jost 500 at 0.2em. The default size for the top bar and button text.
- **Label Small** (`typography.label-sm`): the same capitals at 0.625rem for filter labels in the dropdowns, card metadata, tooltips, view-switch options, table headers, the footer link and quiet actions.
- **Data** (`typography.data`): every count, ID, page number and figure uses tabular lining numerals.

### Named Rules
**The Two Voices Rule.** Cormorant names things; Jost operates them. Never set a control, a count or a piece of metadata in the serif, and never set a property name in the sans.

*Exception, cited:* the dashboard Overview figures set their counts in Cormorant 600 at 3.5rem, after liveluxe.au's own "90 apartments hosted" figure block. The caption under each count stays Jost tracked capitals. This applies to the Overview figures only.

**The Tracked Capitals Rule.** Metadata and control labels are Jost 500 uppercase at 0.2em tracking. Numbers are always tabular. Label Small (0.625rem) is the smallest sanctioned step.

## Layout

A single centred column, max 1440px, with side gutters of 20px, 32px from 640px, and 48px from 1024px. Top padding 40px (56px from 1024px), bottom 80px. Major blocks stack 32px apart. The page is a full-height column so the footer sits at the bottom even when results are short.

Order on the browse page: the 64px top bar ruled beneath in hairline; the display heading with its live count, and the search field (up to 576px) aligned to its baseline at the right from 1024px; the filter block ruled above and below with 20px vertical padding; a results bar (clear action at left; Include archived, Sort and the view switch at right); the results; pagination ruled above; and, for visitors who aren't signed in, a quiet footer ruled above at 60% holding "Admin sign-in" at the right.

Filter block: three dropdowns (Platform, Area, Tags) in a row, 12px apart, each at least 176px wide from 640px; chosen values follow underneath as a row of removable chips 8px apart. On phones the three dropdowns sit in one row of equal columns, 8px apart, 48px tall, with each label stacked above its value.

Results grids use a 20px gap. Card view: one column, two from 1024px, three from 1280px; each card splits 38% photo, remainder text, minimum height 208px from 640px. Tile view: auto-fill squares, minimum 17rem. List view: a table from 768px (minimum 56rem, scrolls sideways inside its rule); below 768px, stacked rows instead.

The dossier panel is up to 52rem wide from the right edge. Its header is a 13rem photo beside the name; below, an 11rem sticky section index at the left from 640px (a horizontally scrolling strip pinned to the top on phones, with a right-edge fade from 82%), and fields as a 13rem label column beside the value.

## Elevation & Depth

Flat at rest. Depth on the page comes from tone (ground, paper, pale slate) and hairline rules, never from shadow. Only things that float over content cast shadows.

### Shadow Vocabulary
- **Panel** (`box-shadow: -24px 0 48px -24px rgb(10 10 12 / 0.28)`): the dossier panel, cast leftward over a 25% ink scrim.
- **Popover** (`box-shadow: 0 12px 32px -12px rgb(10 10 12 / 0.25)`): the filter dropdowns and the Reports page pickers.

### Named Rules
**The Resting Flat Rule.** Cards, tiles, rows, inputs and buttons have no shadow at rest or on hover. Hover answers with a bronze border and a paper fill, not with lift.

## Shapes

Square corners throughout: cards, tiles, buttons, inputs, selects, dropdowns, chips, tags, the panel, the popover, the tooltip, the close button, the focus ring.

The one circle is the platform seal: listing status renders as round seals, one per platform, like marks stamped on a register entry. Rules are 1px hairlines; control borders are 1px Steel Edge; the search field is a single Steel Edge underline rather than a box. Active state is a bronze border (chosen filter dropdowns) or a 1px bronze left rule (the dossier section index from 640px).

**The Square Rule.** Nothing is rounded except the platform seal.

## Components

### Buttons
Quiet and typographic, always in tracked capitals.
- **Primary:** solid ink with paper text, 10px by 16px padding, square. Hover turns Bronze Deep. Used for "Try again", "Back to properties" and the empty state's main action.
- **Secondary:** transparent with a 1px hairline border, ink text; hover fills with Silver Wash.
- **Text action:** Label Small in bronze, underlined ("Clear search and filters", "Show all"); hover to ink.
- **Icon close:** 40px paper square in the panel corner, ink X; hover inverts to ink with paper.

### Filter Dropdowns (signature)
The browse filters: Platform, Area and Tags, each a multi-select dropdown. The trigger is a paper box with a Steel Edge border: a bronze Label Small label, then the current choice in Body ("All", one name, or "3 selected") in Slate Muted, turning ink once something is chosen, then a chevron. A chosen filter's border turns bronze; an open one's border is bronze too. Hover fills with Silver Wash.

The popover is a 288px paper panel with a hairline border and the Popover shadow, named for screen readers after its filter. It holds an optional find field (always for Tags, for Area once it has more than 8 options), a checklist of 40px rows (a square check that fills bronze when chosen, the name, and a tabular count in Slate Muted), and a "Show all" text action at the foot while anything is chosen. "Not listed yet" is an option in Platform, a peer of the platforms. If the choices fail to load, the list says so instead of looking empty.

The same checklist and chip drive the Reports page pickers, with an underlined Label trigger instead of a box.

### Chips
Chosen filter values, shown under the dropdowns: paper, a 1px bronze border at 60% (full bronze on hover), ink text at 0.75rem, 4px by 8px padding, at least 24px tall, with a small X. Clicking removes the value. Screen readers hear "Remove filter Airbnb".

### Inputs and Selects
- **Text input:** 44px, paper fill, 1px Steel Edge border; the border turns bronze on focus and Danger Red when invalid. Textareas and the field editor's inputs match.
- **Search:** 48px high, a Steel Edge underline only, search icon at left, clear X at right; the underline turns bronze on focus. Debounced 200ms.
- **Selects (Sort, Per page):** 36px, 1px Steel Edge border, transparent fill, chevron at right; Silver Wash on hover. A Slate Muted Label Small sits beside each as its visible label.

### View Switch
A segmented radio group inside one Steel Edge border: Card, Tile, List, each 36px high with a 14px icon and Label Small text. The active option is solid ink with paper text; others are Slate Muted, Silver Wash on hover.

### Property Cards, Tiles and Rows
- **Shell:** a 1px hairline edge at 55%, ground showing through a 40% paper tint; hover and keyboard focus turn the edge bronze and the fill full paper over 300ms. The whole card is clickable through the property name's button, whose focus ring is drawn around the card.
- **Card:** photo well left (pale slate, image cover), then name (Title), metadata line, platform seals, up to 3 tags, and a two-line muted summary pinned to the bottom.
- **Tile:** square, no photo; name, metadata, seals, up to 2 tags, and a summary set off by a 45% hairline and clamped to three lines.
- **List:** table with bronze Label Small headers and 45% hairline row rules, paper fill on hover; phones get stacked rows.
- **Metadata line:** Label Small in tabular figures: Listing ID in bronze, area in ink soft, "Archived" in muted. Items are told apart by colour and spacing, not separators, so a wrap never strands a dot.

### Platform Bubbles
Round seals: 28px (36px medium), 1px hairline border, paper fill, ink-soft initials in Jost 500 (0.08em tracking for two letters, tighter for three). A platform icon, when supplied, fills the circle. A seal with a listing URL is a link and inverts to ink with paper text and a bronze border on hover. Every seal has a tooltip (ink, paper Label Small, square, small arrow) and an accessible label. A property listed nowhere shows "Not listed yet" in muted Label Small instead.

### Tags
Ordinary small labels: 1px hairline border at 70%, 60% paper fill, ink-soft text at 0.75rem, 2px by 8px padding, square. A long tag is cut short with an ellipsis and shows its full name on hover. Overflow collapses to a muted "+N more" whose title lists the rest.

### Pagination
Ruled above. "Showing 1–24 of 121" at left in muted with ink figures; at right a Per page select and a list of 36px square steps: ends, the current page and its neighbours, gaps as an ellipsis. The current page is solid ink with paper; others Silver Wash on hover; previous and next arrows go muted when disabled.

### Top Bar and Footer
- **Top bar:** 64px, ruled beneath. The monogram and "Live Luxe · Listing Repo" in bronze Label at the left. At the right, only for signed-in admins or inside the dashboard: "Dashboard", "Browse properties" or "Back to properties" in muted Label, bronze on hover.
- **Footer:** for visitors who aren't signed in, a quiet strip ruled above at 60% with "Admin sign-in" in Label Small at the right. Hidden in the dashboard and for signed-in admins.

### Dossier Panel
The side panel is a dossier: one scroll, every field grouped by section. It slides in from the right over an ink scrim. Header: photo well beside the serif name and a bronze tracked line (Listing ID, area, photo count, synced time, archived). The sticky section index marks the current section with a bronze rule and ink text. Each section heading is ruled with an "N of M filled" count; groups get bronze Label Small headings; fields are a definition list divided by 35% hairline. Values are ink and select in one click; text values have a copy button, shown on hover or focus with a mouse and always shown on touch screens. If the browser blocks copying, a Danger Red line says so. Empty values read "Not filled yet" or "Empty" in muted; provenance (Hostaway, Claude or Admin, and when) sits beneath in bronze. Long text clamps to six lines with "Show all".

### Admin Dashboard
Built inside the same world as the browse surface: no new colours besides Danger Red and Steel Edge, no shadows, no rounded corners.
- **Rail:** the dossier's section index scaled up. Tracked Jost capitals with a lucide icon, a bronze left rule and ink text on the current page, hairline at 50% otherwise. On phones it becomes a sideways strip with the 82% edge fade, followed by the username and "Sign out".
- **Page heading:** the browse "Properties" heading (Cormorant 600, 3.5rem, 2.75rem on phones), ruled underneath, with the page's primary action at the right.
- **Overview figures:** a grid of hairline-ruled cells, each a serif count, a tracked-capitals caption and a muted note, linking to the property list filtered to match. Hover turns the count and caption bronze. The Sync Hostaway block below is ruled, with a primary ink button.
- **Admin lists (properties, platforms, accounts):** tables with bronze Label Small headers and 45% hairline row rules from 768px up. **Below 768px they become stacked rows**, never a table scrolled sideways. Status reads as muted tracked capitals. Row actions are quiet bronze underlined buttons.
- **Removal notice:** after a property is removed from the list, a paper strip ruled above and below announces it (`role="status"`) and offers Restore, which receives focus.
- **Manage block (admin panel):** a ground-tinted band under the dossier header holding remove or restore, "Listed on" rows (Hostaway rows read-only, others a checkbox, an optional link and Save), and the photo picker for hand-added properties. Thumbnails mark the chosen photo with a 2px bronze border.
- **Field editing:** a 32px pencil button beside each editable value opens an inline editor (input, textarea, or Yes / No / Not set toggles), with Save (primary) and Cancel (secondary). Closing returns focus to the pencil. Hostaway-sourced fields on imported properties show a muted lock beside the label instead.
- **API token:** a new token shows once in a paper strip with Copy and Done; if the browser blocks copying, a Danger Red notice asks for a manual copy, and the token selects in one click.
- **Auth pages:** the serif heading and intro on the left, the form in a ruled column on the right; errors appear in Danger Red.
- **Reports page:**
  - Ruled blocks with a 13rem label column (serif heading at 1.3rem, muted hint), after the dossier.
  - Each platform rule is a View Switch-style segmented control (Any, Listed, Not listed). When two or more are Listed, an "All of them / Any of them" control appears.
  - Area, Tags and Empty fields use the shared checklist popover with removable chips.
  - The column picker is a `details` panel on paper with a lucide chevron (no native marker) and the house square checks.
  - The preview has a bronze tabular count. The filters show as separate pieces spaced apart, never joined with dots. The table has tabular numerals and a paper fill on hover; below 768px each property becomes a block with the name as a heading over a label/value list.
  - Downloads: CSV is the primary ink button and PDF the bordered secondary. An unavailable download stays a focusable link with its reason attached.
- **Report PDF:**
  - A4 landscape: monogram and tracked bronze masthead, a hairline, Cormorant title, bronze count, the filters separated by semicolons.
  - The table has bronze tracked headers repeated on each page and hairline row rules. The property name is in Cormorant 600; everything else is Jost.
  - "Page x of y" in the footer.

### Empty, Loading and Error States
- **Empty:** ruled above and below, centred serif heading "No properties match", one line saying why (including that archived listings are hidden), then a primary and a secondary action.
- **Loading:** shimmer blocks in the shape of the current view (six cards or tiles, ten list rows); the panel shows shimmer blocks for photo, name and fields. Placeholder data during a refetch dims results to 60%.
- **Error:** a paper box with a hairline border, serif heading, a plain-language explanation in muted ("Can't reach the server. Check your connection, then try again.") and a primary "Try again". Messages name the problem and the recovery; never a bare status code.
- **Not found:** a property link that no longer matches opens the panel with "This property isn't in the repo", a line explaining why, and a primary "Back to properties".

### Motion
- **Panel entrance:** 420ms, translateX(32px) and fade, on `cubic-bezier(0.16, 1, 0.3, 1)`; the scrim fades over 300ms; tooltips fade in over 120ms.
- **Hover zoom:** card photos scale to 1.035 over 700ms on the same expo-out ease.
- **Shimmer:** a slow light passing over pale slate, 1.6s linear, infinite.
- **State changes:** colour and border transitions at 200 to 300ms.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, nothing travels or loops: the panel only fades, the shimmer stops, photos don't zoom, and jumps to a page or section scroll instantly. Fades and colour changes stay, so state changes still read.

### Browser Surfaces
- **Selection:** Steel Edge at 32% with ink text.
- **Focus ring:** 2px solid bronze, offset 2px, square, on every interactive element (`:focus-visible`).
- **Caret:** bronze in inputs and textareas.
- **Scrollbar:** thin, thumb Slate Muted at 40%, transparent track.
- **Links:** underline offset 0.22em, 1px thick.

### Accessibility
WCAG 2.2 AA throughout: full keyboard use including the panel (a Radix dialog), the filter popovers, pagination and the view radio group; screen-reader labels on every seal, icon button, popover and chip; live regions on the result count, the "Showing" line and the copy result. Interactive targets are at least 24px.

**The Muted Floor Rule.** Slate Muted at full strength is the lightest text colour in the system. Never lighten text below it with opacity or a paler tone; the only exception is a disabled control.

## Do's and Don'ts

### Do:
- **Do** rule sections and rows with 1px Silver Hairlines, using reduced strength for inner rules.
- **Do** outline every input, select, dropdown trigger and segmented control in Steel Edge.
- **Do** mark active and chosen state with bronze (border, left rule, focus ring) and filled selection with solid ink and paper text.
- **Do** set property names and headings in Cormorant Garamond 600, and everything operational in Jost.
- **Do** set metadata in tracked Jost capitals at 0.2em with tabular figures.
- **Do** keep every corner square; reserve the circle for platform seals.
- **Do** keep text at Slate Muted or darker, and keep Label Small (0.625rem) as the smallest step.
- **Do** write errors as a sentence that names the problem and the way out.
- **Do** honour `prefers-reduced-motion` by removing travel and loops while keeping fades.

### Don't:
- **Don't** build the generic SaaS admin grid with a blue accent and a filter sidebar; filters stay in the dropdown row above the results.
- **Don't** use the hairline or the wash as text, as a control border, or as the only signal of a state.
- **Don't** add a second warm accent; bronze is the only warm colour.
- **Don't** put shadows on cards, tiles, rows, inputs or buttons; only the dossier panel and the popovers float.
- **Don't** round corners on anything but the platform seal.
- **Don't** fade muted text with opacity to make it quieter.
- **Don't** separate wrapping metadata with dots; tell the items apart by colour.
- **Don't** hide an action behind hover alone; on touch screens it must stay visible.
