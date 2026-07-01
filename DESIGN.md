---
name: WIP
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#494737'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#7a7865'
  outline-variant: '#cbc7b1'
  surface-tint: '#666000'
  primary: '#666000'
  on-primary: '#ffffff'
  primary-container: '#f2e974'
  on-primary-container: '#6e6800'
  inverse-primary: '#d2ca59'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#006972'
  on-tertiary: '#ffffff'
  tertiary-container: '#9ef3ff'
  on-tertiary-container: '#00717c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#efe672'
  primary-fixed-dim: '#d2ca59'
  on-primary-fixed: '#1e1c00'
  on-primary-fixed-variant: '#4d4800'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#9bf0fc'
  tertiary-fixed-dim: '#7fd4df'
  on-tertiary-fixed: '#001f23'
  on-tertiary-fixed-variant: '#004f56'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  section-gap: 80px
  stack-gap: 16px
---

## Brand & Style
The design system for WIP is anchored in a high-utility, developer-centric aesthetic. It balances the urgency of a "Work in Progress" with the precision of a finished professional tool. The personality is industrious, transparent, and efficient. 

The visual style is **Minimalist-Industrial**. It rejects decorative flourishes, gradients, and blurs in favor of structural clarity, solid surfaces, and high-contrast accents. It aims to evoke a sense of focus and technical reliability, making the user feel like they are working within a well-organized terminal or a high-end physical workspace. The interface should feel "built," not just "rendered."

## Colors
The palette is dominated by a strict monochromatic foundation, punctuated by a singular, vibrant yellow. 

- **Primary (#F2E974):** A high-visibility yellow used exclusively for primary actions, status indicators of "active" work, and critical brand moments. It is never used for backgrounds of large containers.
- **Secondary/Neutral Black (#121212):** Used for primary text and high-contrast UI elements like buttons or headers to ensure maximum legibility.
- **Surface Tones:** A range of ultra-light grays (White to #F5F5F5) provide the background for the "natural" scroll feel.
- **Borders:** A consistent #E2E2E2 is used for all structural divisions, maintaining a "technical drawing" appearance.

## Typography
Typography is the primary vehicle for the WIP brand. By pairing **Geist** for headings and UI labels with **Inter** for long-form body text, the system achieves a "technical-yet-readable" balance.

- **Headlines:** Use Geist with tight letter-spacing for a compact, engineered look.
- **Body:** Inter is used for its exceptional legibility at small sizes. Line heights are intentionally generous (1.5x - 1.6x) to facilitate the "natural" scroll feel and reduce cognitive load during long sessions.
- **Mono-intent:** Geist’s natural geometric rhythm should be leveraged for numerical data and status labels to maintain the developer-focused aesthetic.

## Layout & Spacing
This design system employs a **Fixed Grid** philosophy for desktop to maintain a controlled, professional density, and a fluid model for mobile.

- **Rhythm:** An 8px base unit governs all dimensions.
- **Verticality:** To achieve the "natural" scroll, section gaps are intentionally large (80px+), allowing content to breathe and preventing the UI from feeling "cramped" or "over-engineered."
- **Grid:** A 12-column layout on desktop with wide 24px gutters. On mobile, margins reduce to 16px to maximize real estate while maintaining the structural border-driven look.

## Elevation & Depth
Depth is signaled through **Tonal Layering** and **Subtle Outlines** rather than shadows. 

- **Flat Stack:** Objects do not "float" with shadows. Instead, they sit on top of one another using slight shifts in background color (e.g., a white card on a #F5F5F5 background).
- **Outlines:** Every interactive container or distinct section uses a 1px solid border (#E2E2E2).
- **Active State:** The only "depth" comes from the Primary Yellow background being applied to an element, "lifting" it through color intensity rather than physical simulation.

## Shapes
The shape language is **Soft-Industrial**. 

- **Radius:** A consistent 0.25rem (4px) radius is applied to buttons, inputs, and cards. This is just enough to take the "edge" off the brutalist origins without making the system feel "bubbly" or consumer-grade.
- **Consistency:** Use the same radius for both internal elements (like chips) and external containers (like cards) to create a rhythmic, systematic appearance.

## Components
- **Buttons:** 
  - *Primary:* Solid Primary Yellow with Black text. No shadow.
  - *Secondary:* Solid Black with White text.
  - *Tertiary:* Transparent background with a 1px #E2E2E2 border.
- **Input Fields:** White background, 1px #E2E2E2 border. On focus, the border becomes Black and thickens to 2px. No glow.
- **Cards:** White background, 1px solid #E2E2E2 border. For "Natural Scroll" layouts, cards should span the full width of their column container with generous internal padding (32px).
- **Chips/Badges:** Small, Geist-font labels with a light-gray fill (#EEEEEE) and no border, used for metadata or tags.
- **Lists:** Separated by 1px horizontal rules that extend to the container edges, mimicking a ledger or technical spec sheet.
- **Status Indicators:** Use the Primary Yellow for "In Progress" and high-contrast Black for "Completed."