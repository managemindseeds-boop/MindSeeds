# Design System Specification: Editorial Intelligence

## 1. Overview & Creative North Star
**The Creative North Star: "The Curated Canvas"**
This design system rejects the "utility-first" clutter of traditional admin panels in favor of a high-end editorial experience. We are moving away from the rigid, boxed-in look of standard SaaS. Instead, we treat the dashboard as a sophisticated workspace where data "breathes." 

By utilizing intentional asymmetry, deep tonal layering, and high-contrast typography scales (Inter vs. Manrope), we create an environment that feels more like a premium publication than a database. The goal is to make the admin feel like a curator, not a clerk.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, authoritative purple (`primary: #46195c`), supported by a spectrum of soft, atmospheric lavenders and greys.

### The Palette (Material Tokens)
- **Primary/Action:** `primary` (#46195c) for high-importance interactions; `primary_container` (#5e3174) for brand-heavy components.
- **Surfaces:** 
    - `surface`: #f8f9fb (Main Page Background)
    - `surface_container_low`: #f3f4f6 (Sectional areas)
    - `surface_container_lowest`: #ffffff (High-priority cards)
- **Status (Semantic):**
    - **Active/Present:** Emerald (`#10b981`)
    - **Absent:** Red (`#ba1a1a`)
    - **Checked-in:** Green (`#22c55e`)

### The "No-Line" Rule
**Borders are a failure of layout.** To achieve a high-end feel, designers are prohibited from using 1px solid borders to define sections. Instead:
- Use **background color shifts**: Place a `surface_container_lowest` card on a `surface_container_low` background. 
- Use **Vertical Space**: Use the `spacing.12` or `spacing.16` tokens to create clear mental models of separation.

### The Glass & Gradient Rule
For floating elements (modals, dropdowns, or mobile navigation), use **Glassmorphism**. Apply a semi-transparent `surface_container_lowest` with a `backdrop-blur: 12px`. 
- **Signature CTA Texture:** Buttons should use a subtle linear gradient from `primary` to `primary_container` (135deg) to provide depth that flat colors lack.

---

## 3. Typography: The Editorial Contrast
We use a dual-font strategy to balance authority with readability.

- **Display & Headlines (Manrope):** Used for "The News." Large, bold, and airy. `display-lg` (3.5rem) and `headline-md` (1.75rem) should be used to make the data feel important.
- **Body & Labels (Inter):** Used for "The Facts." Clean, neutral, and highly legible at small sizes.

**Hierarchy Note:** Always pair a `headline-sm` (Manrope) with a `label-md` (Inter) in `on_surface_variant` (#4c444e) for metadata to create a sophisticated, layered information architecture.

---

## 4. Elevation & Depth: Tonal Layering
Avoid the "stuck on" look of heavy shadows. We convey hierarchy through physical stacking.

1.  **The Layering Principle:** 
    - Base Level: `surface` (#f8f9fb)
    - Sub-Section Level: `surface_container_low` (#f3f4f6)
    - Interactive/Content Level: `surface_container_lowest` (#ffffff)
2.  **Ambient Shadows:** If a card must "float" (e.g., a KPI card), use an extra-diffused shadow: `box-shadow: 0 10px 30px rgba(94, 49, 116, 0.05)`. The tint is a 5% opacity version of our primary purple, making the shadow feel like a natural light reflection.
3.  **The Ghost Border Fallback:** If accessibility requires a border (e.g., input fields), use `outline_variant` at 20% opacity. Never use 100% opaque lines.

---

## 5. Components & UI Patterns

### KPI Cards (The "Signature" Component)
Instead of a simple box, KPI cards should use **asymmetric padding**.
- **Background:** `surface_container_lowest` (White).
- **Icon:** Housed in a `secondary_container` (#f5d9fc) box with `rounded-md`.
- **Value:** `display-sm` (Manrope) in `on_primary_fixed` (#310148).
- **Layout:** Icon top-left, Number bottom-right. No divider lines.

### Data Tables
Tables are often the messiest part of an admin panel. We treat them as editorial lists.
- **Header:** `thead` should use `surface_container_low` with `label-md` uppercase typography.
- **Rows:** No horizontal borders. Use `surface_container_lowest` and a hover state of `surface_container_high`.
- **Separation:** Use `spacing.4` between rows to create a "card-list" hybrid look.

### Input Fields
- **Resting:** Background `surface_container_low` with a 2px bottom-only border in `outline_variant`.
- **Focus:** Transition to a full "Glass" effect with a subtle `primary` glow.
- **Shape:** `rounded-md`.

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `rounded-lg`, white text.
- **Secondary:** Transparent background, `primary` text, and a `Ghost Border` (20% opacity `primary`).

---

## 6. Do’s and Don’ts

### Do:
- **Use "White Space" as a tool:** If in doubt, add more padding (`spacing.8` or `spacing.10`).
- **Nesting:** Always place lighter containers inside darker surfaces to create "lift."
- **Mobile-First Flow:** Stack KPI cards vertically on mobile, but use horizontal scrolling for "Status" chips to save vertical real estate.

### Don't:
- **Don't use 1px Dividers:** Use tonal shifts in the background color instead.
- **Don't use pure black:** Use `on_surface` (#191c1e) for text to maintain the soft, premium feel.
- **Don't crowd the edges:** Maintain a minimum page margin of `spacing.6` (1.5rem) on mobile and `spacing.12` (3rem) on desktop.
- **Don't use "Standard" Shadows:** Avoid the default CSS `box-shadow: 0 2px 4px`. It looks cheap. Use our Ambient Shadow formula.