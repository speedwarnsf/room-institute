# Mobile Paragraph Compositor V2 — Build Specification

## CONTEXT

ZenSpace uses `lib/typeset.ts` and `components/GlobalTypeset.tsx` for typography.
The current system guides the browser with nbsp bindings and then freezes whatever the browser decided.
This causes forced bad breaks on mobile (words stranded alone on lines, over-constrained reflow).

This spec replaces the current optimizeBreaks + shapeRag with a true paragraph compositor.
**Only modify files in /Users/macster/ZenSpace.** Do NOT touch /Users/macster/web-typography.

## FILES TO MODIFY

1. **`lib/typeset.ts`** — Replace optimizeBreaks + shapeRag with compositor. Keep typesetText/typesetHeading but lighten bindings.
2. **`components/GlobalTypeset.tsx`** — Update pipeline to use new compositor + renderFrozenLines.
3. **`components/ListingExperience.tsx`** — Fix "As Listed" black box issue (see ADDITIONAL FIXES below).
4. **`i18n/translations.ts`** — Fix "San Francisco" with nbsp in all centered ad copy instances.

## WHAT TO KEEP (these are correct)

- Single pipeline architecture
- WeakMap canonical text storage
- `document.fonts.ready` gating before measurement
- Own-mutation guard (`safeWrite` + `shouldIgnoreMutation`)
- `data-typeset-done` freeze guard
- ResizeObserver for width-change reprocessing
- Centered-text skip (auto-detect `text-align: center`)
- MutationObserver for dynamic content (ignoring own writes)
- The 100ms initial delay for hydration

## THE GOAL

Build a true mobile paragraph compositor that:
- Composes the paragraph as a whole
- Chooses exact line membership via beam search
- Polishes spacing within fixed line membership
- Validates before rendering
- Renders exact lines as block spans (no pre-line + \n)

NOT: insert nbsp and hope the browser lands somewhere good.

## NON-NEGOTIABLE DESIGN RULES

1. Exactly one final owner of line membership
2. optimizeBreaks must NOT insert a blanket nbsp layer
3. shapeRag may adjust spacing only — may NOT change which words belong to which line
4. Final frozen lines must be validated before render
5. Narrow columns use penalties, not hard no-break rules
6. Render exact chosen lines, not browser-guided approximation

## IMPLEMENTATION

### 1. TOKEN CLASSES

Replace plain whitespace-split word arrays with typed tokens:

```typescript
type TokenKind = "word" | "space" | "openPunct" | "closePunct" | "dash" | "compound" | "longSlug";

type Token = {
  text: string;
  kind: TokenKind;
  width: number;
  stickyPrev?: boolean;   // must stay with previous token
  stickyNext?: boolean;   // must stay with next token  
  weakEnd?: boolean;      // penalized at line end (not forbidden)
  protectedCompound?: boolean;  // e.g., "human-centric" — don't split
  emergencyBreakParts?: string[];  // for long slugs like ThePaperLanternStore
};
```

Sets:
```typescript
const WEAK_END_WORDS = new Set(["a","an","the","of","to","in","on","at","by","for","and","or","but","nor","so","as"]);
const OPEN_PUNCT = new Set(["(", "[", "{", "\u201C", "\u2018"]);  // opening quotes/brackets
const CLOSE_PUNCT = new Set([")", "]", "}", ".", ",", ";", ":", "!", "?", "\u201D", "\u2019", "%"]);
const DASHES = new Set(["\u2014", "\u2013"]);  // em-dash, en-dash
```

Rules:
- Open punctuation: `stickyNext = true` (cannot end a line)
- Close punctuation: `stickyPrev = true` (cannot start a line)
- Dash: `stickyPrev = true` (cannot start a line)
- Compound words (contain internal hyphen, ≤20 chars): `protectedCompound = true`
- Long slugs (>16 chars, no spaces): detect camelCase/underscore/slash break points as `emergencyBreakParts`
- WEAK_END_WORDS: `weakEnd = true` (penalized at line end, NOT hard-forbidden)

### 2. LIGHTEN PHASE 1 BINDING

Phase 1 (`typesetText`) should ONLY preserve truly inseparable relationships:
- Opening quotes/brackets attach to next token
- Closing punctuation attaches to previous token  
- Percent signs attach to previous token
- Currency symbols attach to following token
- One-letter article/pronoun protection (a, I) ONLY when measure >= 45ch

Do NOT hard-bind the full weak-word list. For narrow columns, weak-word handling becomes penalties in the compositor.

### 3. COMPOSITOR (replaces optimizeBreaks)

```typescript
function composeParagraph(
  tokens: Token[],
  measurePx: number,
  measureCh: number
): FrozenLine[] | null
```

Uses beam search (BEAM = 24) over exact break candidates:
- Generate all legal line candidates from each start position
- Score each line for fill quality, forbidden patterns, weak-word endings
- Score transitions between lines for coastline quality (no flat shelves, no huge snaps)
- Validate final composition before returning
- Return `null` if no valid composition exists (fall back to browser default)

#### Narrow-measure profiles:

```typescript
function profileForMeasure(measureCh: number) {
  if (measureCh < 18) return {
    mainTarget: 0.90, lastTarget: 0.62,
    weakEndPenalty: 3800, orphanPenalty: 1e9,
    flatShelfPenalty: 240, snapPenalty: 180,
    maxWordSpacing: 0.018,
  };
  if (measureCh < 24) return {
    mainTarget: 0.87, lastTarget: 0.58,
    weakEndPenalty: 3200, orphanPenalty: 1e9,
    flatShelfPenalty: 200, snapPenalty: 140,
    maxWordSpacing: 0.025,
  };
  return {
    mainTarget: 0.84, lastTarget: 0.52,
    weakEndPenalty: 2600, orphanPenalty: 1e9,
    flatShelfPenalty: 160, snapPenalty: 100,
    maxWordSpacing: 0.035,
  };
}
```

#### Line scoring:
- Fill deviation from target: `900 * (fill - target)^2`
- Short line (<58% fill, non-last): +1200
- Overfull (>98% fill, non-last): +800
- One-word last line: +orphanPenalty (1e9)
- Forbidden punctuation start/end: +1e9
- Broken protected compound: +7000
- Weak-word line ending (non-last): +weakEndPenalty

#### Transition scoring (coastline):
- Large jump between adjacent lines (>22% fill difference): snapPenalty × jump × 10
- Flat shelf (3 consecutive lines within 5% fill): flatShelfPenalty

### 4. SHAPE EXACT LINES (replaces shapeRag)

```typescript
function shapeExactLines(lines: FrozenLine[], measureCh: number): FrozenLine[] | null
```

- Receives fixed line membership — may NOT change which words are on which line
- Adjusts word-spacing only, within strict thresholds:
  - measureCh < 18: max ±0.018em
  - measureCh < 24: max ±0.025em  
  - wider: max ±0.035em
- If any line needs more spacing than the threshold allows, return `null` (composition was wrong)
- Last line: no spacing adjustment (ends where it ends)

### 5. FINAL VALIDATOR

```typescript
function finalValidate(lines: FrozenLine[], measureCh: number): boolean
```

Hard fail (return false) if:
- One-word last line
- Any line starts with dash or closing punctuation
- Any line ends with opening punctuation
- Split inside a protected compound
- Spacing adjustment exceeds threshold

### 6. RENDER EXACT LINES AS BLOCK SPANS

```typescript
function renderFrozenLines(p: HTMLElement, lines: FrozenLine[]): void {
  safeWrite(() => {
    p.innerHTML = "";
    p.dataset.typesetDone = "1";
    p.setAttribute("role", "text");
    for (const line of lines) {
      const span = document.createElement("span");
      span.className = "ts-line";
      span.style.display = "block";
      span.style.whiteSpace = "pre";
      if (Math.abs(line.wordSpacingEm) > 0.0005) {
        span.style.wordSpacing = `${line.wordSpacingEm}em`;
      }
      span.textContent = line.text;
      p.appendChild(span);
    }
  });
}
```

NO more `white-space: pre-line` + `\n` joins. Each line is an exact block span.

### 7. LONG-SLUG FALLBACK

For tokens > 16 chars with no spaces (ThePaperLanternStore, long URLs, etc.):
- Split at camelCase boundaries: `/(?<=[a-z])(?=[A-Z])/`
- Split at underscores, slashes
- Store as `emergencyBreakParts` on the token
- Compositor can use these parts when scoring line candidates
- Insert discretionary break opportunities (zero-width space `\u200B`) at split points

### 8. GRACEFUL DEGRADATION

If `composeParagraph` returns `null` (no valid composition):
- Still run Phase 1 light bindings
- Let the browser handle line breaking
- Mark `data-typeset-done` so we don't retry
- This is better than rendering a broken composition

### 9. PIPELINE IN GlobalTypeset.tsx

```
Phase 1 (immediate): Light tokenizer/normalizer on text nodes
  - Only truly inseparable bindings (punctuation stickiness, currency, etc.)
  - Skip centered text entirely

Phase 2 (after fonts.ready + rAF): For each eligible paragraph:
  1. Read canonical text from WeakMap
  2. Tokenize into Token[]  
  3. Measure token widths using hidden measurer span
  4. composeParagraph() — beam search for exact lines
  5. If composition found: shapeExactLines() → finalValidate() → renderFrozenLines()
  6. If null: leave browser default, mark done
  7. Set data-typeset-done
```

### 10. WHAT TO REMOVE / DEPRECATE

- Remove blanket nbsp insertion from optimizeBreaks (or remove optimizeBreaks entirely if compositor replaces it)
- Remove all `white-space: pre-line` + `\n` join patterns
- Remove `smoothRag` (dead code, not called in current pipeline)
- Remove `fixRealOrphans` as separate function (orphan prevention is in compositor scoring)
- Keep `typesetText` but lighten it significantly (only truly inseparable bindings)
- Keep `typesetHeading` as-is (headings aren't composed paragraphs)

## ADDITIONAL FIXES

### Fix 1: "As Listed" Black Box

In `components/ListingExperience.tsx`, the "As Listed" label overlay on the original photo card.
The code currently has inline styles for the label at bottom-3 left-3 with semi-transparent background.

The black box issue appears when:
- The label's parent `div` expands beyond the tiny pill shape
- Or CSS conflicts cause the overlay to cover the image

Ensure:
- The "As Listed" label is a small pill: `display: inline-block`, `maxWidth: fit-content`
- No wrapping div that could expand
- Verify the label renders as a tiny semi-transparent pill at bottom-left of the original photo
- Same fix in `components/RoomPage.tsx` if applicable

### Fix 2: "San Francisco" Splitting in Centered Copy

In `i18n/translations.ts`, ALL instances of "San Francisco" in ad copy need non-breaking space:
- Replace `San Francisco` with `San\u00A0Francisco` in ALL translation strings where it appears
- This is approximately 32 instances across 6 languages (en, fr, de, es, zh, pt)
- Both `ad.description` and `listingPage.modtageDescription` keys

Additionally, Phase 1 should NOT run typesetText on centered text blocks at all.
In GlobalTypeset.tsx Phase 1, skip elements where `text-align: center`.

## ACCEPTANCE TESTS

The following outputs should be IMPOSSIBLE unless literally no legal alternative exists.
Add these as validation checks:

1. `acts as a` / `natural anchor` — "a" should not end a line
2. `rug, a` / `West Elm` — "a" should not end a line  
3. `deliberate and` / `intentional.` — weak word + orphan last line
4. `materials` / `—reduces` — dash should not start a line
5. `human-` / `centric` — protected compound should not split
6. `ThePaperLanternStore` as unhandled slug ruining the paragraph

## BUILD REQUIREMENTS

- `npm run build` must pass clean (zero errors)
- No changes to `/Users/macster/web-typography/` 
- All existing functionality preserved (design spreads, listing experience, room pages, QR cards, etc.)
- Centered text completely untouched by compositor
- Short paragraphs (<80 chars) skipped by compositor
- Paragraphs inside `[data-no-typeset]`, `[data-no-smooth]`, `pre`, `code` skipped

## TESTING

After building, verify:
1. `npm run build` passes
2. The compositor functions are exported and called in the pipeline
3. `renderFrozenLines` produces `<span class="ts-line" style="display:block;white-space:pre">` per line
4. No `pre-line` + `\n` patterns remain in the active pipeline
5. San Francisco has nbsp in all 32 translation instances
6. "As Listed" label is inline-block with maxWidth: fit-content
