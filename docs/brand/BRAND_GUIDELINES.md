# Clarity Brand Guidelines

*Last Updated: February 10, 2026*

---

## Brand Identity

### Mission
Clarity protects organizations from hiring fraud through AI-powered identity verification across the entire employee lifecycle.

### Brand Personality
- **Professional** — Enterprise-grade, trustworthy
- **Intelligent** — AI-powered, cutting-edge
- **Protective** — Security-focused, vigilant
- **Clear** — Simple, transparent, no-nonsense

---

## Logo

### Primary Logo
The Clarity logo consists of two elements:
1. **Star Icon** — A distinctive 4-pointed star (compass rose shape)
2. **Wordmark** — "Clarity" in clean sans-serif

### Logo Files
| File | Use Case |
|------|----------|
| `clarity-logo.svg` | Dark text on light backgrounds |
| `clarity-logo-white.svg` | White on dark backgrounds |
| `clarity-logo-website.svg` | Web optimized |

### Logo Usage

#### ✅ DO
- Use the full logo (star + wordmark) when space allows
- Use the star icon alone for favicons, app icons, subtle branding
- Maintain clear space around the logo (minimum: height of the star)
- Use white logo on dark backgrounds
- Use dark logo on light backgrounds

#### ❌ DON'T
- Rotate or distort the logo
- Change logo colors outside brand palette
- Add effects (shadows, gradients, outlines) to the logo
- Place logo on busy/cluttered backgrounds
- Stretch or compress the logo

---

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Navy** | `#0a1628` | Primary text, headers, dark backgrounds |
| **Green** | `#61F393` | Accent, CTAs, success states, highlights |
| **White** | `#FFFFFF` | Backgrounds, text on dark |

### Secondary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Light Gray** | `#F0F4F8` | Light backgrounds, cards |
| **Red/Danger** | `#EF4444` | Alerts, warnings, threats |
| **Muted Text** | `rgba(255,255,255,0.7)` | Secondary text on dark |

### Color Usage

#### ✅ DO
- Use Navy as the primary text color
- Use Green sparingly for emphasis and CTAs
- Prefer light backgrounds (#F0F4F8 or white) for presentations
- Use Red only for danger/threat indicators

#### ❌ DON'T
- Overuse the green accent — it loses impact
- Use red for non-danger elements
- Create dark/navy theme presentations (light preferred)
- Use colors outside the brand palette

---

## Typography

### Primary Font
**Manrope** — A modern, geometric sans-serif

### Font Weights
- **700 (Bold)** — Headlines, emphasis
- **600 (SemiBold)** — Subheadings, labels
- **400 (Regular)** — Body text

### Type Scale
- Hero headlines: 2.5-3rem
- Section headers: 1.5-2rem
- Body text: 1rem
- Captions/labels: 0.75-0.85rem

---

## Presentation Guidelines

### Structure: WHY → WHAT → HOW
1. **WHY** — Start with the problem/motivation
2. **WHAT** — Show the solution/outcome (with visuals)
3. **HOW** — Explain the technical details

### Visual Hierarchy

#### ✅ DO
- Use the star shape as subtle background accents
- Spotlight one element at a time — dim others
- Include real screenshots and mockups
- Use geometric shapes (circles, lines) for flow/connections
- Keep slides clean with breathing room
- Use numbered circles for steps (not generic icons)

#### ❌ DON'T
- Use emojis in presentations
- Use generic stock icons
- Overcrowd slides with text
- Use multiple competing focal points
- Include unpolished mockups

### Slide Types

**Hero Slides**
- Large headline, minimal text
- Subtle geometric background accents
- Green accent on key words

**Content Slides**
- Clear hierarchy
- Cards/boxes for grouping
- Icons should be custom SVG, not stock

**Data/Stats Slides**
- Large numbers with context
- Citations for credibility
- Comparisons: ~~old~~ → new format

---

## Imagery & Mockups

### Style
- **Photorealistic mockups** — Enterprise software should look real
- **Clean UI** — No clutter, clear hierarchy
- **Consistent lighting** — Subtle shadows, depth

### Screenshots

#### ✅ DO
- Use pixel-perfect mockups
- Show realistic data (not "Lorem ipsum")
- Include subtle UI details (status bars, proper spacing)
- Match the Clarity color palette

#### ❌ DON'T
- Use obviously fake/placeholder content
- Show buggy or incomplete UI
- Mix different design systems
- Invent company logos — fetch real ones or use placeholders

---

## Animation Guidelines

### Principles
- **Subtle** — Animations should enhance, not distract
- **Purposeful** — Every animation should communicate something
- **Smooth** — Use ease-in-out timing, 2-3s durations

### Recommended Animations
- Scanning/sweep effects for detection features
- Gentle pulse for active/live indicators
- Flow animations for data/process diagrams
- Fade transitions between states

### Timing
- Subtle loops: 2-3 seconds
- Transitions: 0.3-0.5 seconds
- Delays for sequencing: 0.1-0.2 seconds stagger

---

## Voice & Tone

### Writing Style
- **Direct** — Get to the point
- **Confident** — We know our stuff
- **Clear** — No jargon without explanation
- **Professional** — Enterprise audience

### Headlines
- Action-oriented
- Benefit-focused
- Concise (5-8 words ideal)

#### Examples
✅ "Catch deepfakes before they catch you"
✅ "One platform. Complete protection."
❌ "Our AI-Powered Solution for Identity Verification"
❌ "Welcome to Clarity's Amazing Platform!"

---

## Assets Library

### Logos
```
clarity-demo/assets/branding/
├── clarity-logo.svg          # Dark version
├── clarity-logo-white.svg    # White version
├── clarity-logo-website.svg  # Web optimized
└── our-saved-logo.png        # PNG export
```

### Presentation
```
clarity-demo/
├── presentation.html         # Main presentation
├── index.html               # Entry point
└── audio/narration/         # Voice narration files
```

### Demo Materials
```
clarity-demo/assets/
├── marcus-chen/             # Fake candidate materials
├── vero/                    # Fake company materials
└── screenshots/             # UI mockups
```

---

## Quick Reference

### Brand Colors (Copy-Paste)
```css
--navy: #0a1628;
--green: #61F393;
--danger: #EF4444;
--light-bg: #F0F4F8;
--white: #FFFFFF;
```

### Logo SVG (Star Icon)
```html
<svg viewBox="0 0 56 56" fill="none">
  <path d="M39.48 16.28L32.35 0L27.81 10.48L33.1 22.71L45.23 28.05L55.63 23.47L39.48 16.28Z" fill="currentColor"/>
  <path d="M39.48 39.81L55.62 32.62L45.24 28.05L33.11 33.38L27.81 45.62L32.35 56.1L39.48 39.81Z" fill="currentColor"/>
  <path d="M16.15 39.82L23.28 56.1L27.82 45.62L22.53 33.39L10.4 28.05L0 32.62L16.15 39.82Z" fill="currentColor"/>
  <path d="M16.15 16.28L0 23.48L10.39 28.05L22.52 22.71L27.81 10.48L23.28 0L16.15 16.28Z" fill="currentColor"/>
</svg>
```

---

## Contact

For brand questions or asset requests:
- Michael Matias — michael@getclarity.ai

---

*This document is a living guide. Update as the brand evolves.*
