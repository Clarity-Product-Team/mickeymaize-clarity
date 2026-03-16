# Clarity Brand Guidelines

*Source of truth for all Clarity branding. Last updated: 2026-02-11*

---

## Logo

### Official Logo Files
- **White version (dark bg):** `https://cdn.prod.website-files.com/68ca65f64a04c90f13846d37/68ca65f64a04c90f13846e27_Clarity%20Logo%20white.svg`
- **Dark version (light bg):** `https://cdn.prod.website-files.com/68ca65f64a04c90f13846d37/68ca65f64a04c90f13846dfe_Clarity%20Logo.svg`
- **Local copies:** `shared/brand/clarity-logo.svg`, `shared/brand/clarity-logo-white.svg`

### Logo Anatomy
The Clarity logo consists of:
1. **Icon:** Four-pointed star/sparkle shape (arrows pointing outward)
2. **Wordmark:** "Clarity" text

### Logo Variations
| Variant | Icon Color | Text Color | Use Case | File |
|---------|------------|------------|----------|------|
| White | White | White | Dark backgrounds, nav bar | `clarity-logo-white.svg` |
| Dark (default) | Dark | Dark | Light backgrounds, print | `clarity-logo.svg` |
| Green+White | Green | White | Hero sections on dark | `clarity-logo-green-white.svg` |

### ⚠️ ALWAYS USE OFFICIAL LOGO FILES
- **NEVER create your own SVG approximation** of the logo
- **NEVER use a simple star shape** as a substitute
- **Always reference files from `shared/brand/`**
- The logo has a specific 4-arrow design — generic stars are NOT acceptable

---

## Colors

### Primary Palette
| Name | Hex | Usage |
|------|-----|-------|
| **Clarity Green** | `#61F393` | Primary accent, CTAs, icon |
| **Navy** | `#0a1628` | Primary text, dark backgrounds |
| **White** | `#FFFFFF` | Backgrounds, text on dark |

### Extended Palette
| Name | Hex | Usage |
|------|-----|-------|
| **Light Background** | `#F0F4F8` | Page backgrounds (light theme) |
| **Card Background** | `#FFFFFF` | Cards, panels |
| **Secondary Text** | `#64748B` | Muted text, labels |
| **Accent Muted** | `#E8FFF0` | Light green tints |
| **Danger** | `#EF4444` | Alerts, errors |
| **Danger Muted** | `#FEE2E2` | Light red tints |
| **Border** | `#E2E8F0` | Subtle borders |

### ⚠️ DO NOT USE
| Wrong Color | Hex | Why |
|-------------|-----|-----|
| Teal | `#00d4aa` | Often confused with Clarity green |
| Teal gradient | `#00d4aa → #00b892` | Clarity uses flat colors, no gradients |

---

## Typography

### Font Family
**Primary:** Manrope (weights: 400, 500, 600, 700, 800)

### Font Import
```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### ⚠️ DO NOT USE
- Inter (commonly mistaken substitute)
- System fonts without fallback

---

## Buttons

### Primary CTA
- Background: `#61F393` (Clarity Green)
- Text: Dark (`#0a1628`)
- Border radius: 8px
- Arrow icon suffix optional (→)

### Secondary Button
- Background: Transparent
- Border: 1px solid white or green
- Text: White or green

---

## Design Principles

### Navigation
- **Every page must link back to the homepage** — logo in nav should always be an `<a href="index.html">` link

### DO ✓
- Light theme preferred (soft blue-gray backgrounds)
- Clean, minimalistic layouts
- Flat colors (no gradients on brand elements)
- Geometric accents (brand logo shapes as subtle elements)
- Subtle shadows and borders
- Professional, enterprise-grade aesthetic
- Rounded corners (8px cards, 16px larger elements, 20px buttons)
- Use inline SVGs for company logos
- Maintain high contrast (white text on navy)
- Keep plenty of whitespace

### DON'T ✗
- **NO emojis in presentations** — diminishes maturity
- **NO generic icons** — use custom or none
- **NO gradients** on brand green
- No dark theme unless specifically appropriate
- No busy or cluttered layouts
- No text-only logo placeholders
- **NEVER invent fake SVG logos** — fetch the real one or use "LOGO NEEDED" placeholder

---

## Presentation Style

### Structure
Always: **WHY → WHAT → HOW**
- Story-first approach
- Clean intros before details
- Spotlight one thing at a time

### Slides
- One key message per slide
- Visual hierarchy matters
- Show comparisons visually (~~$240K~~ → $4.99M)
- Always cite sources for statistics

### Screenshots & Mockups
- Pixel-perfect realistic
- Match actual UI of platforms
- Proper fonts, spacing, colors
- Rounded corners for polish

---

## Logo Sourcing Checklist
When adding a company logo:
1. **ALWAYS fetch from official source** — `curl` the company's website
2. **Use CDN URLs** when available
3. **Never invent SVG paths**
4. **Verify before committing** — check it renders
5. **Match existing usage** — consistency matters

---

## Visual Elements (Instead of Emojis)

| Instead of | Use |
|------------|-----|
| 🔍 | Accent-colored dot, number, or nothing |
| 📄 | Styled container with number |
| ✅ / ❌ | Green/red accent bars or dots |

---

## Taglines

- **Primary:** "Never Hire a Bad-Actor"
- **Secondary:** "Protecting your organization from hiring fraudsters"
- **CTA:** "Get Clarity" / "Request a Demo"

---

## Quick Reference

```css
/* Clarity Brand Colors */
--clarity-green: #61F393;
--clarity-navy: #0a1628;
--clarity-white: #FFFFFF;
--clarity-bg: #F0F4F8;

/* Typography */
--font-primary: 'Manrope', sans-serif;
```

---

## Resources

- **Website:** https://getclarity.ai
- **Assets CDN:** cdn.prod.website-files.com/68ca65f64a04c90f13846d37/
- **Local assets:** `shared/brand/`
- **Live brand page:** `brand.html`
