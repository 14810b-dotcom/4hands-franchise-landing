---
name: "4hands Franchise CIS Landing"
colors:
  primary: "#7C3FAE"
  primary-light: "#A06DD4"
  primary-deep: "#5A2A82"
  accent-fuchsia: "#ED2CEE"
  accent-fuchsia-light: "#F478F5"
  ink: "#1A1A1A"
  ink-soft: "#3D3D3D"
  graphite: "#6B6B76"
  bg: "#FFFFFF"
  bg-soft: "#F8F5FF"
  cream: "#EEE8FF"
  success: "#2F7D5A"
  error: "#B5453A"
---

# Design System: 4hands Franchise CIS

## 1. Visual Theme & Atmosphere

The 4hands franchise landing is a premium beauty-business hybrid — it sells entrepreneurship the way a luxury brand sells confidence. The palette is built on a deep violet-to-fuchsia gradient that pulses with energy: dark, almost jewel-toned purples anchor the brand, while electric fuchsia (#ED2CEE) fires as the primary action accent. The white-to-lavender background (#F8F5FF) is barely there — a whisper of colour that keeps the overall impression light and clean without losing warmth. The contrast between the heavy, display-weight headings and the open, airy body copy creates a confident, editorial rhythm.

Whitespace is generous throughout: 64–128px between sections on desktop, 32px+ internal padding on cards. The surface hierarchy uses three levels — pure white (interactive surfaces), soft lavender (#F8F5FF, subtle section backgrounds), and near-black ink (#1A1A1A, dark cards and hero stages). Every corner is softened (24–32px radius on cards, fully round on buttons), which pairs the premium aesthetic with approachability — the brand is powerful but not intimidating.

## 2. Color Palette & Roles

### Primary Foundation
- **Pure White** `#FFFFFF` — base background, card surfaces, form backgrounds
- **Lavender Whisper** `#F8F5FF` — alternating section backgrounds, subtle depth
- **Pale Lavender Cream** `#EEE8FF` — card glossy gradient endpoint, highlight tints
- **Near-Black Ink** `#1A1A1A` — dark card gradient start, footer background

### Accent & Interactive
- **Brand Purple** `#7C3FAE` — primary brand colour, CTA gradient midpoint, borders, icon strokes
- **Violet Light** `#A06DD4` — hover states, CTA gradient start, tinted overlays
- **Violet Deep** `#5A2A82` — pressed states, section background gradients
- **Electric Fuchsia** `#ED2CEE` — CTA gradient endpoint, animated rings, hot accents
- **Fuchsia Soft** `#F478F5` — decorative glows, light fills
- **CTA Gradient** `linear-gradient(135deg, #A06DD4 → #7C3FAE → #ED2CEE)` — all primary action buttons
- **Hero Gradient** `linear-gradient(135deg, #7C3FAE → #A855C8 → #ED2CEE)` — hero background orbs

### Typography & Text Hierarchy
- **Deep Ink** `#1A1A1A` — H1, H2, H3, high-contrast body
- **Ink Soft** `#3D3D3D` — secondary headings, label text
- **Graphite** `#6B6B76` — lead copy, muted descriptions, labels
- **Graphite Soft** `#A0A0AB` — tertiary info, placeholders, disabled states
- **Ivory / Cream** `#F8F5FF` — text on dark cards, inverted contexts

### Functional States
- **Success Green** `#2F7D5A` — success toasts, confirmation states
- **Error Red** `#B5453A` — form validation errors
- **Purple Glow** `rgba(124,63,174,0.18)` — shadow tint, focus rings
- **Fuchsia Glow** `rgba(237,44,238,0.22)` — decorative glow overlays

## 3. Typography Rules

### Hierarchy & Weights

**Display Font:** Wix Madefor Display (bold weight) — geometric, clean, slightly rounded sans-serif. Conveys modernity and confidence without coldness. Used for all headings.

**Body Font:** Wix Madefor Display (regular/medium) — same family, lighter weight. Ensures visual harmony across the full scale.

| Level | Size (fluid) | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| **H1** | clamp(22px, 2.6vw, 40px) | 800 | -0.02em | 1.08 |
| **H2** | clamp(26px, 3.2vw, 46px) | 800 | -0.02em | 1.08 |
| **H3** | clamp(18px, 2vw, 26px) | 700 | -0.01em | 1.20 |
| **Eyebrow** | 12px | 500 | +0.18em (uppercase) | — |
| **Lead / Intro** | clamp(16px, 1.5vw, 19px) | 400 | — | 1.55 |
| **Body** | 16px | 400 | — | 1.55 |
| **Button** | 15–16px | 600 | — | 1.2 |
| **Small/Label** | 12–14px | 500–600 | 0.03–0.12em | — |

### Spacing Principles
- Negative letter-spacing (-0.02em) on display headings creates density and authority
- Wide positive tracking (+0.18em) on eyebrows creates breathing room and signals hierarchy
- Lead copy capped at 56ch for readability
- Body line-height 1.55 — generous, editorial cadence

## 4. Component Stylings

### Buttons
- **Shape:** Fully pill-rounded (border-radius: 999px) — friendly, modern, distinctive
- **Primary:** CTA gradient (#A06DD4 → #7C3FAE → #ED2CEE), white text, purple shadow (0 8px 24px -8px rgba(124,63,174,0.45)), glass-shine pseudo-element
- **Ghost:** Transparent + purple-tinted border, backdrop-blur, ink text — minimal, content-adjacent
- **Dark:** Near-black gradient (ink), ivory text — navigation CTA, contrast placement
- **Hover:** translateY(-2px) lift + deeper shadow — tactile, responsive feel
- **Arrow icon:** 16×16px, translates +4px on hover (directional reinforcement)
- **Sizing:** 54px min-height (60px desktop), 44px for small variant

### Cards & Containers

**Standard Card** (`card`):
- White background, 24–28px radius, 28–36px padding, `shadow-card` (subtle)
- Purple-tinted hairline border (rgba(124,63,174,0.10))

**Glossy Card** (`card-glossy`):
- White-to-lavender cream gradient, 28–32px radius, 32–44px padding
- Fuchsia radial ghost overlay at top-right (rgba(237,44,238,0.08))
- Used for form surfaces and hero cards

**Dark Card** (`card-dark`):
- Near-black gradient, ivory text, minimal white border (rgba(255,255,255,0.06))
- Used for premium pricing/format highlight blocks

**Bento Grid Tiles** (`bento-tile`):
- White, 24px radius, 24px padding, shadow-card
- Dark variant (`.dark`): ink gradient with radial warm highlight
- min-height: 0 on desktop (content-driven); 4–6 column grid, auto rows 200px

### Navigation
- Fixed/sticky bar: white with backdrop-blur(16px), purple-tinted bottom border
- Logo: inline-flex, Wix Madefor Display 800, dot accent mark (8×8 purple circle)
- Nav links: 14px, 500 weight, graphite by default — purple on hover
- CTA button: dark variant (btn-dark) right-aligned
- WhatsApp link: purple accent, no underline

### Inputs & Forms
- Border: 1px solid var(--c-line) (purple-tinted hairline)
- Focus: border-color transitions to --c-purple, subtle shadow
- Radius: 16px (softer than cards — approachable)
- Touch targets: min-height 48–54px
- Consent checkboxes: small, inline with linked legal copy

### Market Stat Cards (`market-stat`)
- White, 20px radius, 22×20px padding, shadow-card
- Number: large fluid (26–34px), 700 weight, CTA gradient as text-fill (–webkit-background-clip)
- Label: 15px, 600 weight, ink
- Description: 13px, graphite

### FAQ Accordion (`faq-item`)
- `<details>` + `<summary>` pattern
- No border by default; bottom hairline separator between items
- Animated chevron (+/×) via CSS transition
- Summary: 17–18px, 600 weight, ink text; expands body at 14–16px graphite

## 5. Layout Principles

### Grid & Structure
- Max content width: 1200px (`min(1200px, 100% - 40px)`)
- Wide variant: 1400px (marquee, full-bleed sections)
- Section padding: 64px (mobile) → 96px (768px+) → 128px (1024px+)
- Hero grid: 2-column (text + image) on 768px+; single column mobile
- Bento grid: 6-column, 200px auto-rows on 700px+
- Formats grid: 2-column cards
- Compare grid: 2-column (bad vs good)

### Whitespace Strategy
- Base unit: 8px grid, multiples of 4/8 throughout
- Card padding: 28–44px (generous interior breathing room)
- Section gaps: 48–64px between major sub-sections
- Text margins: 12–24px between eyebrow→H2→lead
- Element gap: 14–20px within flex rows/grids

### Alignment & Visual Balance
- Headings: left-aligned in sections (not centered — authoritative editorial feel)
- Hero: 50/50 text-image split, left text weight
- Metric counters: left-aligned under labels
- CTAs: left-inline in hero, centered in capture section
- Trust bar (avatars + text): horizontal flex, left-anchored

### Responsive Behavior & Touch
- Mobile-first breakpoints: 600px, 700px, 768px, 1000px, 1024px, 1280px
- Touch targets: minimum 44×44px on all interactive elements
- Buttons: full-width on mobile, inline on 768px+
- Bento: single column → 2-column → 4-column progression
- Path section: mobile stacked cards → desktop GSAP scroll-scrub animation

## 6. Design System Notes for Stitch Generation

### Language to Use
- "Premium beauty-business landing, airy white surfaces, deep purple-to-fuchsia gradient accents"
- "Editorial confidence: large bold headings, generous whitespace, fully rounded pill buttons"
- "Dark ink sections for contrast moments, lavender soft backgrounds for alternating rhythm"
- "Glass-morphic elements with backdrop-blur, subtle purple-tinted borders"
- "Photos with dark gradient overlay, number stats with gradient text-fill"

### Color References
- Brand Purple: #7C3FAE — primary, borders, accents
- Fuchsia: #ED2CEE — CTA gradient end, hot accent
- Violet: #A06DD4 — gradient start, hover tints
- Ink: #1A1A1A — dark surfaces, headings
- Lavender BG: #F8F5FF — soft backgrounds
- CTA Gradient: 135deg from #A06DD4 via #7C3FAE to #ED2CEE

### Component Prompts
- "Pill-shaped gradient CTA button (purple to fuchsia), white label, arrow icon, hover lift shadow"
- "Stat card: gradient number large bold, dark label 15px semibold, short description graphite, white rounded card shadow"
- "Dark comparison card: near-black background, ivory text, checkmark list in purple, premium franchise offer"
- "4-column market insight grid: each card has large gradient number, bold label, compact description"
- "FAQ accordion: clean details/summary pattern, + icon toggles to ×, graphite body text reveals on open"

### Incremental Iteration
- Keep pill buttons (border-radius: 999px) — crucial brand identifier
- Gradient fills should always flow 135deg (top-left warm violet to bottom-right hot fuchsia)
- Dark cards should use near-black (#1A1A1A), not pure black — warmer and more premium
- Lavender (#F8F5FF) section backgrounds should alternate with white — never stack same surface
- Eyebrow labels always uppercase, letter-spacing 0.18em, graphite colour — don't bold them
