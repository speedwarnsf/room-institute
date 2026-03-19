# i18n Full Coverage — Build Spec

## CONTEXT
ZenSpace has 6 languages (en, fr, de, es, zh, pt) with 280 translation keys each.
The `t()` function and `useI18n()` hook are wired into most components.
BUT several critical gaps mean the site only partially translates.

## CRITICAL FIXES NEEDED

### 1. Spread API: Locale-aware caching (api/designs/spread.ts)

**Problem:** `spread_data` is cached without locale. Once generated in English, all languages get English content.

**Fix:** Cache spread data PER LOCALE in the database.

Option A (simpler): Store spread_data as `{ en: {...}, fr: {...} }` keyed by locale.
- Change cache check: `if (design.spread_data?.[locale])` → return `design.spread_data[locale]`
- After generating: merge into existing `spread_data[locale] = newData`, save

Option B: Add a `spread_data_locale` column or use a separate table.

**Go with Option A** — least schema change.

In `api/designs/spread.ts`:
```
// BEFORE:
if (design.spread_data) {
    return res.status(200).json({ spread: design.spread_data, cached: true });
}
// Save:
await supabase.from('listing_designs').update({ spread_data: spreadData }).eq('id', designId);

// AFTER:
const existingData = design.spread_data || {};
if (existingData[locale]) {
    return res.status(200).json({ spread: existingData[locale], cached: true });
}
// Save:
const updatedData = { ...existingData, [locale]: spreadData };
await supabase.from('listing_designs').update({ spread_data: updatedData }).eq('id', designId);
```

Also in DesignSpread.tsx, the component already passes `locale` and refetches on locale change (line 146). This should work automatically once the API is fixed.

### 2. Add LanguageSwitcher to ALL buyer-facing pages

Currently only in:
- ListingExperience.tsx (line 515)
- RoomPage.tsx (line 166)

**Add to:**
- `components/DesignSpread.tsx` — in the sticky header bar
- `App.tsx` — somewhere accessible on the homepage
- `components/ListingPage.tsx` (classic listing view)
- `components/SharePage.tsx`

Import: `import { LanguageSwitcher } from './LanguageSwitcher';` (or from '../components/LanguageSwitcher' for App.tsx)

Place it in the top nav/header area of each page, typically next to the back button.

### 3. Fix hardcoded "Start really designing." tagline

In `components/DesignSpread.tsx` line 431 and `components/RoomPage.tsx` line 303:
```jsx
{t('ad.tagline').includes('Start') && t('ad.tagline').split('Start')[1] && <>Start <em>really</em> designing.</>}
```

This only works in English. Replace with:
```jsx
<span dangerouslySetInnerHTML={{ __html: t('ad.taglineHtml') }} />
```

And add a new key `ad.taglineHtml` with the italicized version per language:
- en: `Done day-dreaming? Start <em>really</em> designing.`
- fr: `Fini de rêver ? Commencez <em>vraiment</em> à concevoir.`
- etc.

Or simpler — just use the existing `ad.dreaming` + `ad.startDesigning` keys without the italic hack:
```jsx
<>{t('ad.dreaming')} {t('ad.startDesigning')}</>
```

### 4. Material callout names — translate or keep?

Material names like "Stained Oak", "Charcoal Gray Paint" come from Gemini (spread_data).
These get translated automatically when the spread is regenerated in the target language (fix #1).

### 5. Shopping links / product shelf

Product names from affiliate links should stay in original language (brand names).
Product DESCRIPTIONS should be translated — these also come from Gemini spread_data.

If `ProductShelf.tsx` or `ShoppingList.tsx` have hardcoded labels, wire them to `t()`.

Check: `grep -n ">[A-Z]" components/ProductShelf.tsx components/ShoppingList.tsx`

### 6. Verify all t() keys have translations in ALL 6 languages

Run a script to compare en keys vs each language. The earlier analysis showed all 280 keys present in each language, but verify the VALUES are actually translated (not English placeholders).

Check a few non-en values:
```bash
grep "'spread.spatialFlow'" i18n/translations.ts
```
Should show different text for each language.

## FILES TO MODIFY

1. `api/designs/spread.ts` — locale-aware caching
2. `components/DesignSpread.tsx` — add LanguageSwitcher, fix tagline
3. `components/RoomPage.tsx` — fix tagline
4. `components/ListingPage.tsx` — add LanguageSwitcher
5. `components/SharePage.tsx` — add LanguageSwitcher
6. `App.tsx` — add LanguageSwitcher
7. `i18n/translations.ts` — add taglineHtml key if needed, verify all translations
8. `components/ProductShelf.tsx` — check for hardcoded strings
9. `components/ShoppingList.tsx` — check for hardcoded strings

## DO NOT MODIFY
- No changes to lib/typeset.ts or GlobalTypeset.tsx
- No changes to the compositor
- No changes to Nudio/ebaix
- No changes to agent onboarding portrait generation

## BUILD REQUIREMENTS
- `npm run build` must pass clean
- Test by appending `?lang=fr` to listing URL — all visible text should be French
- Section labels, editorial content, product descriptions, navigation — everything

## TESTING CHECKLIST
- [ ] Homepage with ?lang=fr shows French
- [ ] Listing page with ?lang=fr shows French UI + French content
- [ ] DesignSpread with ?lang=fr shows French editorial content (may need new generation)
- [ ] LanguageSwitcher visible on all buyer pages
- [ ] Product names stay in original language
- [ ] Ad copy (MODTAGE) translated
- [ ] "San Francisco" stays together (nbsp) in all languages
- [ ] Navigation (Back, Close) translated
- [ ] npm run build clean
