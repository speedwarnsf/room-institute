# ZenSpace Lookbook — Product Vision

*"A taste discovery engine disguised as a room design tool."*

---

## Core Insight

Most people can't articulate their design taste. They only know it when they see it. ZenSpace doesn't just redesign rooms — it **teaches you your own aesthetic**.

---

## The Three Phases

### Phase 1: Generate & Explore
Upload a room. Get 3 bold design directions. Hit "Generate More" to keep going. Each batch draws from different design thinkers and movements — Vervoordt's wabi-sabi stillness, Wearstler's maximalist drama, Mahdavi's joyful color play, Memphis Group provocation.

The goal: **flood the canvas with possibilities** so your taste can emerge through reaction.

### Phase 2: Curate & Arrange
The Lookbook is a spatial canvas, not a list. You arrange it.

**Five-tier rating system:**
| Rating | Gesture | Visual Feedback | Behavior |
|--------|---------|-----------------|----------|
| 🚫 Never Again | Flick hard left / toss off-screen | Card crumples, red flash, whoosh | Trains anti-taste. Moves to Hidden. |
| 🤷 Not Now | Gentle drag left | Card dims slightly | Archived. Available for future rooms. |
| 👍 I Like This | Tap once | Normal display | Saved to lookbook. |
| 🔥 This Is Good | Tap twice / drag right | Gold border glow | Pinned. Ready for iteration. |
| ⭐ THE ONE | Double-tap / fling right | Gold burst, star particles | Enters deep exploration mode. |

**Spatial memory matters.** Cards don't auto-sort. You place them. Drag a card next to another because they share a vibe. Stack related concepts. The layout itself becomes your design language — like a physical mood board.

**Physics:** Every interaction has spring physics (Framer Motion). Cards have weight. They bounce, settle, resist. Flicking feels satisfying. Placing feels intentional. The UI should feel like handling real cards on a table.

### Phase 3: Iterate & Refine
When you find "THE ONE" (or any 🔥-rated design), you enter **Iteration Mode**.

This is NOT "generate more of the same." It's a directed exploration:

**Iteration Branches:**
- 🎨 "Same palette, different layout"
- 🌡️ "Dial up the warmth / coolness"
- 🪵 "Same mood, bolder materials"
- 💡 "Change the lighting dramatically"
- 🔊 "Make it more dramatic"
- 🤫 "Make it more subtle"
- 🌿 "Add more nature / biophilic elements"
- 🏗️ "More architectural / structural"

Each branch generates 3 variations. They appear as children of the parent design in the lookbook — visually linked, like a family tree of taste.

This mirrors how a real design director iterates with a client: not "do you like it?" but "what specifically pulls you in?"

---

## The Taste Profile

### What It Tracks
Every rating is a data point. Over time, ZenSpace builds a **Taste Map**:

**Positive signals (from 🔥 and ⭐ ratings):**
- Color temperature preferences (warm vs cool)
- Material affinities (wood, metal, textile, stone, glass)
- Lighting style (moody/pools vs bright/even)
- Layout preference (symmetric vs asymmetric)
- Density (minimalist vs maximalist)
- Design movement alignment (which thinkers resonate)

**Negative signals (from 🚫 ratings):**
- Active rejections are stronger signals than passive likes
- "Never Again" items define the boundaries of taste

### How It's Used
- **First generation for a new room** is already personalized
- **Taste Map visualization** shows users their own aesthetic profile
  - Radar chart: Warmth, Boldness, Nature, Texture, Minimalism, Symmetry
  - "You tend toward: moody lighting, natural materials, asymmetric layouts"
  - "You consistently reject: bright/clinical, heavy pattern, farmhouse"
- **Evolves over time** — taste changes, and the profile adapts

### Transparency
The taste profile is **visible and editable**. Users should be fascinated by their own taste, not creeped out by hidden algorithms. Show the work.

---

## Interaction Design Principles

### 1. Physical Metaphor
Everything should feel like handling real objects. Cards have mass. The canvas has friction. Gestures have momentum. This isn't a web form — it's a design table.

### 2. Progressive Disclosure
- First visit: simple 3-card view with rating buttons
- Return visit: full lookbook canvas unlocks
- Power user: spatial arrangement, taste map, iteration trees

### 3. Delight in Destruction
Trashing a design should feel as good as saving one. The "Never Again" gesture should be cathartic — a satisfying crumple, a whoosh, a flash of red. Bad taste is just as informative as good taste.

### 4. No Dead Ends
Every state has a next action. Rated everything? "Generate More." Found the one? "Go Deeper." Built a full lookbook? "See Your Taste Profile." Finished a room? "Try Another Room" (with taste already loaded).

---

## Technical Architecture

### Data Model
```typescript
interface LookbookEntry {
  id: string;
  option: DesignOption;
  rating: DesignRating | null;
  generatedAt: number;
  batchIndex: number;
  position?: { x: number; y: number }; // spatial placement
  parentId?: string; // for iteration children
  iterationBranch?: string; // "warmer" | "bolder" | etc.
}

interface TasteProfile {
  dimensions: {
    warmth: number;      // -1 (cool) to 1 (warm)
    boldness: number;    // -1 (subtle) to 1 (dramatic)
    nature: number;      // -1 (industrial) to 1 (biophilic)
    texture: number;     // -1 (smooth/clean) to 1 (rich/layered)
    minimalism: number;  // -1 (maximalist) to 1 (minimalist)
    symmetry: number;    // -1 (asymmetric) to 1 (symmetric)
  };
  affinities: string[];    // design movements/thinkers that resonate
  rejections: string[];    // design movements/thinkers rejected
  totalRatings: number;
  lastUpdated: number;
}

type DesignRating = 'never' | 'not-now' | 'like' | 'good' | 'the-one';
```

### Storage
- **LocalStorage/IndexedDB** for lookbook entries and taste profile (MVP)
- **Supabase** for persistence across devices (future)
- Images stored as base64 in entries (compressed)

### Performance
- Framer Motion `layout` animations with `layoutId` for smooth reflow
- Virtualize the grid if >30 cards (react-virtual)
- Lazy-load visualizations (generate on demand, not on batch)
- Debounce position saves during drag

### AI Integration
- Each `generateDesignOptions` call: ~$0.01-0.02 (Gemini Flash text)
- Each visualization: ~$0.05-0.10 (Gemini Flash Image)
- Iteration prompts include taste profile context
- "Never Again" items are summarized and included as negative examples in future prompts

---

## Design Thinkers Reference Library

The AI draws from these unconventional voices (already in prompt):

| Thinker | Philosophy | Signature |
|---------|-----------|-----------|
| Axel Vervoordt | Wabi-sabi minimalism | Aged materials, emotional emptiness |
| Kelly Wearstler | Fearless maximalism | Marble + brass + velvet clashes |
| Ilse Crawford | Humanistic design | Spaces for how life happens |
| India Mahdavi | Joyful geometry | Candy-bright sophistication |
| Vincenzo De Cotiis | Brutalist elegance | Oxidized metals, industrial decay |
| Bijoy Jain | Radical locality | Raw earth, stone, slow ritual |
| Gaetano Pesce | Anti-perfection | Resin and color as rebellion |
| Faye Toogood | Sculptural tactility | Chunky forms, touchable materials |
| Memphis Group | Postmodern provocation | Clashing geometry, irreverent color |

---

## Roadmap

### v1 (Current Build)
- [x] 3-card design options with bold prompts
- [x] Clean/Redesign mode split
- [ ] Lookbook grid with framer-motion physics
- [ ] 5-tier rating system (button + drag)
- [ ] "Generate More" button
- [ ] Filter tabs (All / Good+ / Hidden)

### v2
- [ ] Spatial arrangement (free-form card placement)
- [ ] Iteration mode ("Go Deeper" with directed branches)
- [ ] Iteration tree visualization (parent → children)
- [ ] Taste profile calculation from ratings

### v3
- [ ] Taste Map visualization (radar chart)
- [ ] Taste-aware first generation (personalized prompts)
- [ ] Cross-room taste persistence
- [ ] "Never Again" negative examples in prompts
- [ ] Share lookbook / export as PDF mood board

### v4
- [ ] Collaborative lookbooks (share with partner/roommate)
- [ ] Professional handoff (export specs for contractors)
- [ ] AR preview integration
- [ ] Shopping list tied to specific design choices

---

*This document is the north star. Build toward it incrementally. Every feature should make the taste discovery loop tighter and more delightful.*
