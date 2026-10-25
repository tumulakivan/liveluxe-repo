---
name: Listing Repo
description: Live Luxe's own portfolio index, set in the house voice of liveluxe.au.
colors:
  ground: "#f2eee6"
  paper: "#f8f5ef"
  stone: "#e8e2d6"
  ink: "#0a0a0c"
  ink-soft: "#2e2d31"
  muted: "#5e574e"
  bronze: "#7c5e26"
  bronze-deep: "#5f4719"
  gold: "rgb(211 172 96 / 0.9)"
  gold-wash: "rgb(211 172 96 / 0.18)"
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
  index-gap: "24px"
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
    backgroundColor: "{colors.gold-wash}"
  index-item:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    padding: "6px 0"
  index-item-active:
    textColor: "{colors.ink}"
  index-row-label:
    textColor: "{colors.bronze}"
    typography: "{typography.label-sm}"
    width: "80px"
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

The browse surface is Live Luxe's own portfolio index, set in the same voice as liveluxe.au: limestone ground, ink type, bronze for whatever is active, and gold hairlines ruling the page like a printed register. It deliberately refuses the grey SaaS admin grid with a blue accent and a filter sidebar. Filters are not a sidebar of checkboxes; they are the brand site's precinct index turned into rows of tracked capitals with counts, underlined in bronze when chosen.

Two voices carry everything. Cormorant Garamond at 600 names things: the page heading, every property name, the panel's section headings. Jost does the work: controls, values, metadata, counts. The density is that of an office reference tool used mid-task by about five people: cards three across at 1440px, a field dossier that reads as one long scroll, nothing decorative that slows a look-up.

Palette, fonts and the LL monogram are brand provenance taken from liveluxe.au, not invented here. The monogram is used as an inline SVG in the top bar (`currentColor`) and as the favicon (gold monogram on an ink square).

**Key Characteristics:**
- Limestone ground, paper raised surfaces, stone image wells.
- Gold 1px hairlines are the only dividers; bronze marks state; solid ink is the only filled control.
- Cormorant Garamond 600 for names and headings, Jost for operation, tracked Jost capitals for metadata.
- Square corners everywhere except the round platform seals.
- Flat at rest; only the floating panel and popover cast a shadow.

## Colors

A warm, low-chroma stone palette with one metal (bronze) for state and a gold that exists only as line.

### Primary
- **Bronze** (`colors.bronze`): the active-state colour. Bronze underline on chosen index items, the focus ring, the text caret, link and quiet-action text ("Clear search and filters", "Show all"), index row labels, field-group labels, Listing IDs in card metadata, provenance lines under field values, and the live count beside "Properties". Passes AA as text on ground (5.2:1) and paper (5.5:1).
- **Bronze Deep** (`colors.bronze-deep`): hover state of solid ink buttons only.

### Neutral
- **Limestone Ground** (`colors.ground`): the page. Also the `theme-color` meta.
- **Paper** (`colors.paper`): raised surfaces: the dossier panel, the tag popover, error box, card hover fill, tags and platform seals.
- **Stone** (`colors.stone`): image wells, the "No photo" placeholder, and the shimmer base.
- **Ink** (`colors.ink`): headings and property names, primary values, and the fill of every solid control (primary button, current page, active view, tooltip, panel scrim at 25%).
- **Ink Soft** (`colors.ink-soft`): default body text colour, tag text, seal initials, secondary table cells.
- **Muted Earth** (`colors.muted`): the lightest text colour allowed: unselected index items, field labels, summaries, placeholders, empty values. 6.2:1 on ground, 5.5:1 on stone.
- **Gold Hairline** (`colors.gold`): borders and dividers only, at 1px.
- **Gold Wash** (`colors.gold-wash`): hover and focus fill for quiet controls (secondary button, select, view-switch option, page step, popover rows).

### Status
- **Danger Red** (`colors.danger`): errors and destructive actions only. Error notices (`Notice`), the outlined danger button ("Remove account") that fills red on hover, and the "Removed from the repo" flag in the admin panel. About 7:1 on paper and ground. Never decorative, and never used for a resting state that isn't a problem.

### Named Rules
**The Gold Hairline Rule.** Every divider and every control border is a 1px gold line. Inner rules use the same gold at reduced strength (60% inside the popover, 55% on card edges, 45% between rows, 35% between dossier fields). Gold never fills a surface and is never text.

**The Gold Carries Nothing Rule.** Gold sits at about 1.7:1 against the ground, so it frames but never signals. Any state a person must perceive is carried by bronze, ink, or text, never by gold alone.

**The Bronze Means Here Rule.** Bronze marks where you are and what is chosen: active underline, focus ring, caret, current section in the dossier index. Do not spend it on decoration.

## Typography

**Display Font:** Cormorant Garamond 600 (with 'Times New Roman', serif)
**Body Font:** Jost 400 / 500 (with 'Helvetica Neue', Arial, sans-serif)

Both are self-hosted through Fontsource.

**Character:** A high-contrast house serif that names properties as if in a printed register, against a geometric sans that does the operating quietly.

### Hierarchy
- **Display** (`typography.display`): "Properties" only. 2.75rem below 640px, 3.5rem above; leading 1; tracking -0.015em.
- **Headline** (`typography.headline`): the property name at the top of the dossier panel. Empty-state and error headings use the same serif at 1.875rem and 1.5rem.
- **Headline Section** (`typography.headline-section`): dossier section headings, ruled beneath with a gold hairline and followed by a tracked "N of M filled" count.
- **Title** (`typography.title`): property names on cards (1.3rem), tiles (1.35rem), phone list rows (1.15rem) and table rows (1.1rem); clamped to two lines on cards and tiles.
- **Body** (`typography.body`): summaries, help copy, table cells. Long prose caps at 68ch (field text), 60ch, or 48ch (empty-state copy).
- **Body Value** (`typography.body-value`): dossier field values; field labels sit beside them at 0.8125rem in muted.
- **Label** (`typography.label`): tracked capitals, uppercase, Jost 500 at 0.2em. The default size for the top bar and index items.
- **Label Small** (`typography.label-sm`): the same capitals at 0.625rem for index row labels, card metadata, tooltips, view-switch options, table headers and quiet actions.
- **Data** (`typography.data`): every count, ID, page number and figure uses tabular lining numerals.

### Named Rules
**The Two Voices Rule.** Cormorant names things; Jost operates them. Never set a control, a count or a piece of metadata in the serif, and never set a property name in the sans.

*Exception, cited:* the dashboard Overview figures set their counts in Cormorant 600 at 3.5rem, after liveluxe.au's own "90 apartments hosted" figure block. The caption under each count stays Jost tracked capitals. This applies to the Overview figures only.

**The Tracked Capitals Rule.** Metadata is Jost 500 uppercase at 0.2em tracking, with counts in parentheses beside the label ("AIRBNB (82)"). Numbers are always tabular. Label Small (0.625rem) is the smallest sanctioned step.

## Layout

A single centred column, max 1440px, with side gutters of 20px, 32px from 640px, and 48px from 1024px. Top padding 40px (56px from 1024px), bottom 80px. Major blocks stack 32px apart.

Order on the browse page: the 64px top bar ruled beneath in gold; the display heading with its live count, and the search field (up to 576px) aligned to its baseline at the right from 1024px; the index block ruled above and below in gold with 20px vertical padding; a results bar (clear action at left, Include archived, Sort and the view switch at right); the results; pagination ruled above in gold.

Index rows: an 80px bronze row label, then items 24px apart that wrap from 640px; on phones a row scrolls sideways with a right-edge fade mask (82% to transparent) instead of wrapping.

Results grids use a 20px gap. Card view: one column, two from 1024px, three from 1280px; each card splits 38% photo, remainder text, minimum height 208px from 640px. Tile view: auto-fill squares, minimum 17rem. List view: a table from 768px (minimum 56rem, scrolls sideways inside its rule); below 768px, stacked rows instead of a sideways-scrolled table.

The dossier panel is up to 52rem wide from the right edge. Its header is a 13rem photo beside the name; below, an 11rem sticky section index at the left from 640px (a horizontally scrolling strip pinned to the top on phones), and fields as a 13rem label column beside the value.

## Elevation & Depth

Flat at rest. Depth on the page comes from tone (ground, paper, stone) and gold rules, never from shadow. Only two things float over content, and only they cast shadows.

### Shadow Vocabulary
- **Panel** (`box-shadow: -24px 0 48px -24px rgb(10 10 12 / 0.28)`): the dossier panel, cast leftward over a 25% ink scrim.
- **Popover** (`box-shadow: 0 12px 32px -12px rgb(10 10 12 / 0.25)`): the tag picker.

### Named Rules
**The Resting Flat Rule.** Cards, tiles, rows, inputs and buttons have no shadow at rest or on hover. Hover answers with a bronze border and a paper fill, not with lift.

## Shapes

Square corners throughout: cards, tiles, buttons, inputs, selects, tags, the panel, the popover, the tooltip, the close button, the focus ring.

The one circle is the platform seal: listing status renders as round seals, one per platform, like marks stamped on a register entry. Borders are 1px gold; the search field is a single gold underline rather than a box. Active state is a 1px bronze underline (index items) or a 1px bronze left rule (dossier section index from 640px).

**The Square Rule.** Nothing is rounded except the platform seal.

## Components

### Buttons
Quiet and typographic, always in tracked capitals.
- **Primary:** solid ink with paper text, 10px by 16px padding, square. Hover turns bronze-deep. Used for "Try again" and the empty state's main action.
- **Secondary:** transparent with a 1px gold border, ink text; hover fills with gold wash.
- **Text action:** Label Small in bronze, underlined ("Clear search and filters", "Clear tags", "Show all"); hover to ink.
- **Icon close:** 40px paper square in the panel corner, ink X; hover inverts to ink with paper.

### Index Rows (signature)
The brand site's precinct index turned into filters. Each row has a bronze Label Small row label and a list of tracked-capital items with counts in parentheses. Unselected items are muted with a transparent 1px underline; hover shows the gold underline and ink text; active shows a bronze underline, ink text and a bronze count. Colour transitions take 200ms. Platform, Area and Tags rows; "All" is an item, and "Not listed yet" is a peer of the platforms. The tag row opens a picker (a paper popover with a gold border and a find field); chosen tags appear as removable chips with a 60% bronze border.

### Search and Selects
- **Search:** 48px high, a gold underline only, search icon at left, clear X at right; the underline turns bronze on focus. Debounced 200ms.
- **Selects (Sort, Per page):** 36px, 1px gold border, transparent fill, chevron at right; gold wash on hover. A muted Label Small sits beside each as its visible label.

### View Switch
A segmented radio group inside one gold border: Card, Tile, List, each 36px high with a 14px icon and Label Small text. Active option is solid ink with paper text; others are muted, gold wash on hover.

### Property Cards, Tiles and Rows
- **Shell:** 1px gold edge at 55%, ground showing through a 40% paper tint; hover and keyboard focus turn the edge bronze and the fill full paper over 300ms. The whole card is clickable through the property name's button, whose focus ring is drawn around the card.
- **Card:** photo well left (stone, image cover), then name (Title), metadata line, platform seals, up to 3 tags, and a two-line muted summary pinned to the bottom.
- **Tile:** square, no photo; name, metadata, seals, up to 2 tags, and a summary set off by a 45% gold rule and clamped to three lines.
- **List:** table with bronze Label Small headers and 45% gold row rules, paper fill on hover; phones get stacked rows.
- **Metadata line:** Label Small in tabular figures: Listing ID in bronze, area in ink-soft, "Archived" in muted. Items are told apart by colour and spacing, not separators, so a wrap never strands a dot.

### Platform Bubbles
Round seals: 28px (36px medium), 1px gold border, paper fill, ink-soft initials in Jost 500 (0.08em tracking for two letters, tighter for three). A platform icon, when supplied, fills the circle. A seal with a listing URL is a link and inverts to ink with paper text and a bronze border on hover. Every seal has a tooltip (ink, paper Label Small, square, small arrow) and an accessible label. A property listed nowhere shows "Not listed yet" in muted Label Small instead.

### Tags
Ordinary small labels: 1px gold border at 70%, 60% paper fill, ink-soft text at 0.75rem, 2px by 8px padding, square. Overflow collapses to a muted "+N more" whose title lists the rest.

### Pagination
Ruled above in gold. "Showing 1–24 of 121" at left in muted with ink figures; at right a Per page select and a list of 36px square steps: ends, the current page and its neighbours, gaps as an ellipsis. The current page is solid ink with paper; others gold wash on hover; previous and next arrows go muted when disabled.

### Dossier Panel
The side panel is a dossier: one scroll, every field grouped by section. It slides in from the right over an ink scrim. Header: photo well beside the serif name and a bronze tracked line (Listing ID, synced time, archived). The sticky section index marks the current section with a bronze rule and ink text. Each section heading is ruled in gold with an "N of M filled" count; groups get bronze Label Small headings; fields are a definition list divided by 35% gold. Values are ink with a copy button revealed on hover or focus; empty values read "Not filled yet" or "Empty" in muted; provenance (Hostaway, Claude or Admin, and when) sits beneath in bronze. Long text clamps to six lines with "Show all".

### Admin Dashboard
Built inside the same world as the browse surface: no new colours besides Danger Red, no shadows, no rounded corners.
- **Rail:** the dossier's section index scaled up. Tracked Jost capitals with a lucide icon, a bronze left rule and ink text on the current page, gold/50 rules otherwise. On phones it becomes a sideways strip with the 82% edge fade, followed by the username and "Sign out".
- **Page heading:** the browse "Properties" heading (Cormorant 600, 3.5rem, 2.75rem on phones), ruled underneath in gold, with the page's primary action at the right.
- **Overview figures:** a grid of gold-ruled cells, each a serif count, a tracked-capitals caption and a muted note, linking to the property list filtered to match. Hover turns the count and caption bronze. The Sync Hostaway block below is ruled in gold, with a primary ink button.
- **Admin lists (properties, platforms, accounts):** tables with bronze Label Small headers and 45% gold row rules from 768px up. **Below 768px they become stacked rows**, never a table scrolled sideways. Status reads as muted tracked capitals. Row actions are quiet bronze underlined buttons.
- **Removal notice:** after a property is removed from the list, a paper strip ruled in gold announces it (`role="status"`) and offers Restore, which receives focus.
- **Manage block (admin panel):** a ground-tinted band under the dossier header holding remove or restore, "Listed on" rows (Hostaway rows read-only, others a checkbox, an optional link and Save), and the photo picker for hand-added properties. Thumbnails mark the chosen photo with a 2px bronze border.
- **Field editing:** a 32px pencil button beside each editable value opens an inline editor (input, textarea, or Yes / No / Not set toggles), with Save (primary) and Cancel (secondary). Closing returns focus to the pencil. Hostaway-sourced fields on imported properties show a muted lock beside the label instead.
- **Auth pages:** the serif heading and intro on the left, the form in a gold-ruled column on the right; errors appear in Danger Red.
- **Reports page:**
  - Gold-ruled blocks with a 13rem label column (serif heading at 1.3rem, muted hint), after the dossier.
  - Each platform rule is a View Switch-style segmented control (Any, Listed, Not listed). When two or more are Listed, an "All of them / Any of them" control appears.
  - Toggles are index items. Area, Tags and Empty fields use the tag popover with removable chips.
  - The column picker is a `details` panel on paper with a lucide chevron (no native marker) and the house square checks.
  - The preview has a bronze tabular count. The filters show as separate pieces spaced apart, never joined with dots. The table has tabular numerals and a paper fill on hover; below 768px each property becomes a block with the name as a heading over a label/value list.
  - Downloads: CSV is the primary ink button and PDF the gold-bordered secondary. An unavailable download stays a focusable link with its reason attached.
- **Report PDF:**
  - A4 landscape: monogram and tracked bronze masthead, gold hairline, Cormorant title, bronze count, the filters separated by semicolons.
  - The table has bronze tracked headers repeated on each page and gold row rules. The property name is in Cormorant 600; everything else is Jost.
  - "Page x of y" in the footer.

### Empty, Loading and Error States
- **Empty:** ruled above and below in gold, centred serif heading "No properties match", one line saying why (including that archived listings are hidden), then a primary and a secondary action.
- **Loading:** shimmer blocks in the shape of the current view (six cards or tiles, ten list rows); the panel shows shimmer blocks for photo, name and fields. Placeholder data during a refetch dims results to 60%.
- **Error:** a paper box with a gold border, serif heading, muted explanation and a primary "Try again".

### Motion
- **Panel entrance:** 420ms, translateX(32px) and fade, on `cubic-bezier(0.16, 1, 0.3, 1)`; the scrim fades over 300ms; tooltips fade in over 120ms.
- **Hover zoom:** card photos scale to 1.035 over 700ms on the same expo-out ease.
- **Shimmer:** a slow light passing over stone, 1.6s linear, infinite.
- **State changes:** colour and border transitions at 200 to 300ms.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, all animations and transitions collapse to 0.01ms.

### Browser Surfaces
- **Selection:** gold at 40% with ink text.
- **Focus ring:** 2px solid bronze, offset 2px, square, on every interactive element (`:focus-visible`).
- **Caret:** bronze in inputs and textareas.
- **Scrollbar:** thin, thumb bronze at 45%, transparent track.
- **Links:** underline offset 0.22em, 1px thick.

### Accessibility
WCAG 2.2 AA throughout: full keyboard use including the panel (a Radix dialog), pagination and the view radio group; screen-reader labels on every seal, icon button and filter list; live regions on the result count and the "Showing" line.

**The Muted Floor Rule.** Muted Earth at full strength is the lightest text colour in the system. Never lighten text below it with opacity or a paler tone; the only exception is a disabled control.

## Do's and Don'ts

### Do:
- **Do** rule sections, rows and controls with 1px gold hairlines, using reduced-strength gold for inner rules.
- **Do** mark active and chosen state with bronze (underline, left rule, focus ring) and filled selection with solid ink and paper text.
- **Do** set property names and headings in Cormorant Garamond 600, and everything operational in Jost.
- **Do** set metadata in tracked Jost capitals at 0.2em with tabular counts in parentheses.
- **Do** keep every corner square; reserve the circle for platform seals.
- **Do** keep text at Muted Earth or darker, and keep Label Small (0.625rem) as the smallest step.
- **Do** honour `prefers-reduced-motion` and give every motion the expo-out curve or a linear shimmer.

### Don't:
- **Don't** build the grey SaaS admin grid with a blue accent and a filter sidebar; filters live in the index rows.
- **Don't** use gold as text, as a fill, or as the only signal of a state.
- **Don't** put shadows on cards, tiles, rows, inputs or buttons; only the dossier panel and the tag popover float.
- **Don't** round corners on anything but the platform seal.
- **Don't** fade muted text with opacity to make it quieter.
- **Don't** separate wrapping metadata with dots; tell the items apart by colour.
