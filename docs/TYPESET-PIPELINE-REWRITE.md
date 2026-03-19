# Typeset Pipeline Rewrite — ZenSpace Only

## Context

ZenSpace currently uses an exact copy of typeset.us's `lib/typeset.ts` and `components/GlobalTypeset.tsx`. This rewrite modifies ONLY the ZenSpace copies. typeset.us is untouched. If this works beautifully, we may later port changes to typeset.us.

## The Problem

Multiple passes mutate the same paragraph with different definitions of what it is:
- `typesetAll` treats it as raw flowing text
- `fixRealOrphans` treats the browser's current layout as truth
- `optimizeBreaks` tries to choose better breakpoints
- `shapeRag` assumes it gets the final say and freezes the result
- MutationObserver can hand frozen paragraphs back to typesetAll as raw input

No single authority over line breaks. The result: intermittent bad breaks, stranded sentence-start words, justified-looking runs, and destroyed rag shaping.

## The Fix — Pipeline Architecture

The new pipeline has ONE flow, ONE owner, and paragraphs are processed exactly ONCE:

```
raw text → store canonical → wait for fonts → normalize (nbsp bindings) → 
optimize breaks (with orphan prevention) → shape rag (active sculpting) → 
freeze → mark done → NEVER reparse
```

## Implementation Requirements

### 1. Canonical Raw Text (WeakMap)

```typescript
const canonicalText = new WeakMap<HTMLElement, string>();
```

- Before ANY processing, store the element's original `textContent` in the WeakMap
- If the element needs reprocessing (e.g., resize), read from WeakMap — NEVER from mutated DOM
- This prevents the flatten-and-destroy cycle

### 2. Wait for Fonts Before Measurement

```typescript
await document.fonts.ready;
```

- No measurement passes (fixRealOrphans, optimizeBreaks, shapeRag) should run until fonts are loaded
- Pre-render binding (typesetText nbsp insertion) can run before fonts since it doesn't measure
- Use `document.fonts.ready` promise, not arbitrary timeouts

### 3. Single Pipeline Pass (Replace the Timeout Chain)

OLD (remove this):
```
100ms: typesetAll
600ms: typesetAll
1600ms: typesetAll → fixRealOrphans → optimizeBreaks → shapeRag
```

NEW:
```
Phase 1 (immediate, no measurement needed):
  - typesetAll: pre-render nbsp bindings on all paragraphs
  - typesetHeading: heading bindings

Phase 2 (after document.fonts.ready + requestAnimationFrame):
  - For each eligible paragraph:
    1. Store canonical text in WeakMap (if not already stored)
    2. optimizeBreaks (with orphan prevention BUILT IN — no separate fixRealOrphans)
    3. shapeRag (active rag sculpting — coastline, not fence)
    4. Mark element with data-typeset-done
  - Skip elements with data-typeset-done, data-no-typeset, data-no-smooth
  - Skip elements inside [data-no-smooth], pre, code, .demo, [role="tabpanel"]
```

### 4. Remove fixRealOrphans as Separate Pass

- Move orphan prevention INTO optimizeBreaks as a penalty/constraint
- A one-word last line should receive a huge demerits penalty in the Knuth-Plass DP
- This way orphan fixing can't be undone by a later pass — it's part of the same optimization

### 5. Ignore Own DOM Mutations

```typescript
let isInternalWrite = false;

const observer = new MutationObserver(() => {
  if (isInternalWrite) return;
  // Only process genuinely NEW content (not our own writes)
  handleNewContent();
});

// Wrap all DOM writes:
function safeWrite(fn: () => void) {
  isInternalWrite = true;
  fn();
  requestAnimationFrame(() => { isInternalWrite = false; });
}
```

- MutationObserver should NEVER react to DOM writes created by the typesetting pipeline
- Use an internal flag that's set before writes and cleared after DOM settles
- Elements with `data-typeset-done` are always skipped

### 6. Mark Finalized Paragraphs

- After Phase 2 completes on a paragraph, set `data-typeset-done` attribute
- `typesetAll` skips elements with this attribute
- MutationObserver skips elements with this attribute
- Only a ResizeObserver width change should clear it and allow reprocessing (reading from WeakMap)

### 7. Active Rag Sculpting (THE KEY DIFFERENTIATOR)

This is where we DISAGREE with the ChatGPT diagnosis. shapeRag should do MORE, not less.

**The Coastline Principle:**
Good rag looks like a coastline — organic variation in line lengths. Bad rag looks like a fence — consecutive lines at similar widths creating a justified appearance.

**Detection:**
After measuring all line widths, check for "flat runs" — sequences of 2+ consecutive non-last lines where fill percentages are within ~5% of each other.

**Active Reshaping:**
When flat runs are detected, actively adjust word-spacing to CREATE variation:
- In a flat run of 3 lines at 88%, 90%, 89% fill:
  - Tighten line 1 (pull to ~82%)
  - Leave line 2 (or expand slightly to ~92%)
  - Tighten line 3 (pull to ~84%)
- The goal is a flowing wave pattern, not uniformity

**Constraints:**
- Word-spacing adjustments must remain invisible — if a reader can SEE the spacing change, it's too much
- Maximum per-gap adjustment: scale with line-height (wider line-height = more room for adjustment)
- Never make a line shorter than ~60% fill (creates rivers of whitespace)
- Never make a non-last line longer than ~95% fill (crowds the margin)
- Last line is exempt from sculpting (it ends where it ends)

**Anti-Justification (Enhanced):**
- Current: detect >92% fill within 4% range → scale back 50%
- New: detect ANY consecutive lines within 5% of each other → actively reshape
- This is offensive, not defensive — we CREATE the coastline, we don't just avoid the fence

### 8. Narrow Column Handling

For columns narrower than ~24ch (measured via `measureCh`):
- Reduce pre-render bindings: only orphan prevention + number binding
- Skip or heavily reduce shapeRag word-spacing (invisible at these widths)
- Let the browser handle most line breaking — it knows the constraints better than we do at this scale
- The existing tiered thresholds from typeset.us (45ch, 50ch, 55ch, 65ch) should be reviewed but the principle is right: fewer constraints at narrow widths

### 9. ResizeObserver for Width Changes

- Replace the triple-timeout reprocessing with a ResizeObserver
- When container width changes:
  1. Clear `data-typeset-done` on affected elements
  2. Read canonical text from WeakMap
  3. Re-run Phase 2 pipeline
- This replaces the need for running typesetAll three times "just in case"

## Files to Modify

1. **`/Users/macster/ZenSpace/lib/typeset.ts`** — Engine changes:
   - Add WeakMap for canonical text
   - Merge orphan prevention into optimizeBreaks
   - Enhance shapeRag with active coastline sculpting
   - Add `safeWrite` wrapper for DOM mutations
   - Export new functions for the updated pipeline

2. **`/Users/macster/ZenSpace/components/GlobalTypeset.tsx`** — Wrapper changes:
   - Replace timeout chain with fonts.ready + rAF pipeline
   - Single Phase 1 (bindings) → Phase 2 (measure + optimize + shape + freeze)
   - MutationObserver ignores internal writes
   - ResizeObserver for width-change reprocessing
   - Skip `data-typeset-done` elements everywhere

## Files NOT to Modify

- `/Users/macster/web-typography/src/lib/typeset.ts` — DO NOT TOUCH
- `/Users/macster/web-typography/src/components/GlobalTypeset.tsx` — DO NOT TOUCH
- Any other ZenSpace files (components, CSS, etc.) — this is engine/wrapper only

## Testing

- `npm run build` must pass clean
- The engine should handle:
  - Short paragraphs (< 80 chars) — skip rag shaping
  - Long editorial paragraphs — full pipeline with coastline rag
  - Centered text (text-align: center) — skip rag shaping (auto-detected)
  - Narrow containers (< 24ch) — reduced bindings, minimal shaping
  - Dynamic content (Supabase data loading after initial render) — MutationObserver catches new content, processes once
  - Font loading delays — measurement only happens after fonts.ready
  - Window resize — ResizeObserver clears and reprocesses

## Success Criteria

1. No more stranded sentence-start words at line ends
2. No justified-looking runs of consecutive similar-width lines
3. No flickering/jumping text (DOM fight loop eliminated)
4. Orphans consistently prevented (built into optimizer, can't be undone)
5. San Francisco (and other nbsp-bound pairs) never split
6. Text looks BETTER than browser default — that's the whole point
7. Build passes clean
8. No changes to typeset.us source

## Documentation

After implementation, update this file with:
- What was changed and why
- Performance notes
- Known limitations
- Porting notes for potential typeset.us adoption later
