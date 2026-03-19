# Design Studio — Vision Doc

## The Concept
When a user pins a design as "THE ONE" or "This Is Good," they enter a **Design Studio** — a full-screen, immersive editorial experience that feels like a magazine feature spread from Architectural Digest.

The key insight: **the spread's visual design mirrors the room's design direction.** Typography, color, spacing, and layout all adapt to complement the aesthetic. A warm maximalist room gets luxe serifs and rich amber tones. A brutalist minimal room gets stark grotesques and raw whitespace. Each design feels like its own brand.

## The Arc
**Discover → Refine → Commit → Act**

- Discover = Lookbook (exists)
- Refine = Design Studio (this feature)
- Commit = Save/Export/Share
- Act = Shop This Look + Contractor Handoff

## Design Studio Components

### 1. Hero Section (Full-bleed)
- Visualization fills viewport edge-to-edge
- Design name overlaid in a typeface that matches the room's mood
- Subtle parallax or fade-on-scroll
- Swipeable if multiple finalists

### 2. Editorial Typography System
Each design direction generates a "type palette" alongside its color palette:
- **Heading font** — chosen to match the mood (warm serif, clean sans, display slab, etc.)
- **Accent color** — pulled from the room's palette
- **Layout density** — maximalist designs get denser layouts, minimal designs get more whitespace
- **Pull quotes** — the mood description rendered large and beautiful

Possible approach: AI generates a `typography` object alongside each design:
```json
{
  "type_mood": "warm-editorial",  // warm-editorial | stark-minimal | bold-expressive | classic-refined | raw-industrial
  "heading_style": "luxe serif, tight tracking, all-caps for section heads",
  "accent_color": "#A0522D",
  "pull_quote": "Ancient warmth pervades."
}
```

We map `type_mood` to actual font pairings:
- `warm-editorial` → Playfair Display + Source Serif Pro
- `stark-minimal` → Inter + Space Grotesk  
- `bold-expressive` → Bebas Neue + DM Sans
- `classic-refined` → Cormorant Garamond + Lato
- `raw-industrial` → Space Mono + IBM Plex Sans

### 3. Design Brief (Scrollable Editorial)
- **Design Thesis** — large pull-quote treatment
- **The Interventions** — each as its own "card" with icon + description
- **Materials Palette** — visual grid: color swatch + material name + tactile description
- **Rug/Textile Feature** — hero image treatment if we can generate one
- **Color Story** — palette shown as full-width gradient bar or large swatches

### 4. Iteration Controls
"This direction, but..."
- Warmer / Cooler
- More minimal / More layered  
- Keep the rug, change everything else
- Show me this at night / golden hour / rainy day
- Bolder color / More restrained
- Different era

Each generates a NEW visualization that branches from this direction. History is kept — you can see the evolution.

### 5. Shop This Look
- AI generates specific product categories from the design plan
- "This design calls for an unlacquered brass floor lamp — here are options"
- Eventually: affiliate links, price ranges
- For now: product type + description + where to look

### 6. Save & Share
- Export as polished PDF (contractor handoff)
- Share as image (the editorial hero shot + brief)
- Save to property (multi-room management)

## Technical Approach

### Font Loading
- Use Google Fonts API to load font pairs dynamically based on `type_mood`
- Preload the 5 font pairs as optional (not blocking)
- Fallback to system fonts gracefully

### New Components
- `DesignStudio.tsx` — main container, routes from Lookbook "Go Deeper"
- `StudioHero.tsx` — full-bleed visualization with overlaid typography
- `StudioBrief.tsx` — editorial layout for the design plan
- `StudioIterate.tsx` — iteration controls + branch history
- `StudioShop.tsx` — product suggestions
- `StudioShare.tsx` — export/share controls

### New Prompt Addition
Add to design analysis response:
```
"type_mood": "warm-editorial | stark-minimal | bold-expressive | classic-refined | raw-industrial"
```

### State
- `selectedStudioEntry: LookbookEntry | null`
- `studioIterations: LookbookEntry[]` — branch history
- `AppState.DESIGN_STUDIO`

## The Wow Factor
The moment a user taps "Go Deeper" on their favorite design, the screen transitions into a bespoke editorial world built around THEIR room. The typography matches the mood. The colors bleed through the layout. It feels like their room just got its own magazine feature. That's the screenshot moment. That's what gets shared.

---
*Created: 2026-02-10*
