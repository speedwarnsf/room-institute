# ZenSpace V2 — Feature Spec

## Vision
Transform ZenSpace from a room organizer into a theory-grounded interior design platform with monetization.

## New Features

### 1. Design Theory Integration
Update all Gemini prompts to analyze rooms through 5 academic frameworks:
- **Aesthetic Order & Simplicity** (Wharton & Codman) — proportion, harmony, visual logic
- **Human-Centric/Ergonomic** — anthropometry, proxemics, clearance zones
- **Universal & Inclusive Design** — 7 principles (equitable use, perceptible info, etc.)
- **Biophilic & Regenerative** — natural light, organic forms, prospect/refuge
- **Phenomenological** — genius loci, multi-sensory experience

Each analysis should reference which frameworks inform the suggestions.

### 2. "Show Me 3 Designs" Flow
After uploading a photo:
1. AI analyzes the space (genius loci, proportions, light, existing character)
2. Generates 3 DISTINCT design directions, e.g.:
   - **Biophilic Warmth** — natural materials, plants, organic curves, warm lighting
   - **Modern Minimalist** — clean lines, neutral palette, essential pieces only
   - **Eclectic Contemporary** — curated mix, bold accents, personality-driven
3. Each design shown as a card with: name, mood description, key principles used, color palette, AI visualization
4. User picks one → expands into full design plan

### 3. Shopping Lists Per Design
Once user chooses a design:
- Itemized shopping list with specific products
- Categories: furniture, lighting, textiles, decor, plants, storage
- Each item: name, description, price range, why it fits the design theory
- Amazon affiliate links (existing Product interface)
- Total estimated budget
- "Buy All" or individual purchase buttons
- Save shopping list to session

### 4. Room Saving (Enhanced)
Sessions already exist. Enhance:
- "My Rooms" gallery view
- Each room can have multiple saved designs
- Track which design was chosen
- Progress tracking (purchased items checked off)

### 5. Monetization Architecture
- Amazon Associates affiliate links on all products
- Track click-throughs per product/design
- Analytics: which designs generate most purchases
- Future: curated brand partnerships, premium design packages

## Technical Approach
- Update geminiService.ts prompts with theory frameworks
- New component: DesignOptionsView (3-card layout)
- New component: ShoppingList (itemized, with affiliate links)
- Enhance SessionManager for multi-design per room
- New service: affiliateTracking.ts (click analytics)
- Reference DESIGN-THEORY.md for prompt engineering

## Design Language
Keep existing dark/light theme system. New elements:
- Design option cards with color palette swatches
- Theory principle badges/tags on suggestions
- Shopping list with product images and price badges
