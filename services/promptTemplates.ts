/**
 * Enhanced AI Prompts for Room
 * Optimized prompts for better room analysis and visualization
 */

export interface PromptContext {
  roomType?: string;
  style?: string;
  budget?: 'low' | 'medium' | 'high';
  timeframe?: 'quick' | 'weekend' | 'extended';
  livingSpace?: 'small' | 'medium' | 'large';
  residents?: 'single' | 'couple' | 'family' | 'roommates';
}

/**
 * Main analysis prompt template
 */
export function createAnalysisPrompt(context: PromptContext = {}): string {
  const {
    roomType = 'room',
    style = 'modern',
    budget = 'medium',
    timeframe = 'weekend',
    livingSpace = 'medium',
    residents = 'single'
  } = context;

  return `You are Room AI, an expert professional organizer and interior designer. Analyze this ${roomType} image and provide practical, confidence-building guidance.

**CONTEXT TO USE:**
- Living situation: ${residents}
- Space size: ${livingSpace}
- Preferred style: ${style}
- Budget range: ${budget}
- Time available: ${timeframe}

**RESPONSE FORMAT (STRICT JSON ONLY, NO MARKDOWN FENCES):**
{
  "analysis_markdown": "A Markdown string with the sections below, using '##' headings and concise bullets.",
  "visualization_prompt": "A strict, imperative command list to transform the room. MUST specify: furniture LAYOUT (where pieces go, what faces what), focal point, traffic flow. Keep room shell (walls/windows/doors) but REARRANGE furniture completely.",
  "products": [
    {
      "name": "Under-bed storage bin",
      "reason": "Maximizes unused space beneath the bed for seasonal items"
    }
  ]
}

**PRODUCTS RULES:**
- Exactly 3-5 product objects
- name: 2-5 words, generic product type (no brands)
- reason: One sentence max

**ANALYSIS MARKDOWN SECTIONS (IN THIS ORDER):**
## Key Issues
- 3-4 bullets describing main clutter sources and impact.

## Quick Wins (15 min)
- 3 actionable tasks that can be done quickly.

## Storage Solutions
- 3-5 specific storage ideas with placement hints.

## Step-by-Step Plan
1. Numbered, clear steps (5-7 total), each with a time estimate.

## Aesthetic Tip
- One design tip for a calm, zen feel.

If the room already appears organized, say so and focus on maintenance and micro-optimizations.

**QUALITY STANDARDS:**
- Be concrete and room-specific (avoid vague advice).
- Suggest realistic timelines and achievable actions.
- Prioritize safety and clear pathways.
- Avoid brand names; recommend product types only.

Return ONLY the JSON object with the fields above.`;
}

/**
 * Design-theory-grounded room analysis that produces 3 distinct design directions.
 * References: DESIGN-THEORY.md (5 academic frameworks)
 */
// Design seeds grounded in interior design PRINCIPLES, not cultural geography
interface DesignSeed {
  principle: string;   // The core design idea driving this direction
  approach: string;    // How to apply it
  thinkers: string;    // Designers/theorists who embody this thinking
  rug: string;         // Specific textile anchor
}

const DESIGN_SEEDS: DesignSeed[] = [
  // --- SPATIAL & STRUCTURAL ---
  { principle: 'Compression and release — manipulate ceiling height, narrowness, and openness to create emotional rhythm through a room',
    approach: 'Use color, lighting, and furniture scale to make parts of the room feel intimate and others expansive',
    thinkers: 'Frank Lloyd Wright (prairie compression), Luis Barragán (color volumes), Peter Zumthor (atmospheric density)',
    rug: 'deep-pile wool runner that defines the "release" zone, pulling the eye toward openness' },
  { principle: 'Asymmetric balance — reject mirror symmetry for dynamic visual tension that still feels resolved',
    approach: 'Off-center focal points, unequal but balanced masses, deliberate visual weight distribution',
    thinkers: 'Eileen Gray (asymmetric screens), Charlotte Perriand (sculptural arrangement), Isamu Noguchi (balanced tension)',
    rug: 'asymmetrically patterned hand-knotted wool — one side dense, the other sparse, creating visual pull' },
  { principle: 'Scale disruption — use one dramatically oversized or undersized element to reframe everything else',
    approach: 'A monumental light fixture, a tiny chair, an enormous mirror — break expected proportions to create wonder',
    thinkers: 'Gaetano Pesce (oversized resin), Faye Toogood (chunky sculptural scale), Claes Oldenburg (the power of wrong scale)',
    rug: 'an unexpectedly massive rug that climbs 6 inches up the walls, blurring floor and wall boundaries' },

  // --- MATERIAL & TEXTURE ---
  { principle: 'Material honesty meets material contrast — celebrate what things are made of by placing opposites together',
    approach: 'Raw against refined, soft against hard, matte against gloss — every surface tells a story through juxtaposition',
    thinkers: 'Vincenzo De Cotiis (oxidized metal + marble), Axel Vervoordt (raw plaster + aged wood), John Pawson (stone purity)',
    rug: 'hand-felted wool with visible fiber structure, undyed, next to polished concrete or stone floor' },
  { principle: 'Patina as design — age, wear, and imperfection as deliberate aesthetic choices, not flaws to hide',
    approach: 'Specify materials that develop character over time — unlacquered brass, saddle leather, limewash, living finishes',
    thinkers: 'Wabi-sabi philosophy, Axel Vervoordt, Bijoy Jain / Studio Mumbai (handcraft + time)',
    rug: 'antique hand-repaired textile — visible mending as design feature, silk-wool blend with natural patina' },
  { principle: 'Textile architecture — fabric and fiber as structural, spatial elements, not just soft accessories',
    approach: 'Draped canopies, fabric room dividers, upholstered walls, woven screens — textiles that define space',
    thinkers: 'Anni Albers (textile as art), Christo (wrapped environments), Ilse Crawford (sensory richness)',
    rug: 'hand-tufted sculptural rug with 3 different pile heights creating a topographic landscape underfoot' },

  // --- LIGHT & COLOR ---
  { principle: 'Light as the primary material — design the room around how light enters, bounces, pools, and retreats',
    approach: 'Layer natural and artificial light deliberately — washing, spotlighting, backlighting, candlelight as architecture',
    thinkers: 'James Turrell (light as medium), Tadao Ando (light cuts), Olafur Eliasson (color-spectrum light)',
    rug: 'light-reflective silk-cotton blend in pale champagne — designed to catch and amplify ambient light' },
  { principle: 'Chromatic boldness — use saturated, unexpected color as the primary design move, not an accent',
    approach: 'Full-wall color drenching, tonal rooms (all one hue at different saturations), color blocking as spatial definition',
    thinkers: 'India Mahdavi (joyful color), Luis Barragán (emotional color planes), Pierre Yovanovitch (moody palettes)',
    rug: 'saturated solid-color hand-tufted wool — one bold hue that anchors the entire room\'s palette' },
  { principle: 'Tonal restraint — a single color family explored in maximum depth, creating richness through subtlety',
    approach: 'Monochromatic or near-monochromatic, with variety through texture, sheen, and material rather than hue shifts',
    thinkers: 'Joseph Dirand (tonal Paris), Vincent Van Duysen (Belgian warmth), John Pawson (monastic minimalism)',
    rug: 'tone-on-tone hand-loomed wool in three closely related values — visible only up close, felt from across the room' },

  // --- SENSORY & EXPERIENTIAL ---
  { principle: 'Multi-sensory design — design for touch, smell, sound, and temperature, not just sight',
    approach: 'Acoustic textures, scented materials (cedar, leather, beeswax), thermal variety (cool stone near warm textiles)',
    thinkers: 'Ilse Crawford (humanistic design), Peter Zumthor (thermal baths as architecture), Juhani Pallasmaa (eyes of the skin)',
    rug: 'deep hand-knotted Moroccan wool — thick enough to muffle footsteps, warm enough to sit on' },
  { principle: 'Prospect and refuge — create spaces that balance openness (seeing out) with enclosure (feeling protected)',
    approach: 'Reading nooks within open plans, canopy beds, high-backed settees, rooms within rooms',
    thinkers: 'Christopher Alexander (pattern language), Frank Lloyd Wright (inglenook), Ilse Crawford (nesting instinct)',
    rug: 'round hand-woven rug defining a "refuge" zone — like a campfire circle within the larger room' },
  { principle: 'Biophilic immersion — not just "add a plant" but fundamentally connect the room to living systems and natural pattern',
    approach: 'Fractal patterns, water features, living walls, natural materials at every touch point, views framed as landscape',
    thinkers: 'Kengo Kuma (organic structure), Bijoy Jain (earth + craft), Stephen Kellert (biophilic theory)',
    rug: 'hand-woven jute and seagrass with irregular organic edge — no straight lines, mimicking natural growth patterns' },

  // --- CONCEPTUAL & PROVOCATIVE ---
  { principle: 'Narrative space — design the room as if it tells a story or belongs to a fictional character',
    approach: 'Every object implies a life lived — collected, curated, eccentric. The room as autobiography, not catalog',
    thinkers: 'Kelly Wearstler (fearless curation), Jacques Garcia (theatrical), Tony Duquette (fantasy environments)',
    rug: 'vintage overdyed Persian — a rug with history, possibly mismatched with everything else, but that\'s the point' },
  { principle: 'Anti-decoration — strip away everything decorative and find beauty in pure function, structure, and void',
    approach: 'Remove, reduce, reveal. Expose structure, eliminate ornament, let negative space do the heavy lifting',
    thinkers: 'Donald Judd (Marfa minimalism), Tadao Ando (concrete poetry), Pawson (less is enough)',
    rug: 'a single sheepskin on raw concrete — the refusal to fill space IS the design statement' },
  { principle: 'Playful subversion — break the "rules" of good taste deliberately, with confidence and humor',
    approach: 'Clashing patterns that work, furniture in wrong rooms, high-low mixing (plastic chairs + marble table), irreverence as style',
    thinkers: 'Memphis Group / Sottsass (design as provocation), Gaetano Pesce (anti-perfection), India Mahdavi (serious play)',
    rug: 'a deliberately "ugly" bold-patterned rug that somehow becomes the most magnetic thing in the room' },
];

// Group seeds by design axis to guarantee diversity within each batch
const SEED_BUCKETS: Record<string, number[]> = {
  spatial_structural:       [0, 1, 2],    // compression/release, asymmetric balance, scale disruption
  material_texture:         [3, 4, 5],    // material contrast, patina, textile architecture
  light_color:              [6, 7, 8],    // light as material, chromatic boldness, tonal restraint
  sensory_experiential:     [9, 10, 11],  // multi-sensory, prospect/refuge, biophilic immersion
  conceptual_provocative:   [12, 13, 14], // narrative space, anti-decoration, playful subversion
};

function getDesignSeed(): DesignSeed[] {
  const bucketKeys = Object.keys(SEED_BUCKETS).sort(() => Math.random() - 0.5);
  const pickedBuckets = bucketKeys.slice(0, 3);
  return pickedBuckets.map(key => {
    const indices = SEED_BUCKETS[key]!;
    const idx = indices[Math.floor(Math.random() * indices.length)]!;
    return DESIGN_SEEDS[idx]!;
  });
}

export interface StructureConstraints {
  fixed?: string[];        // keep-in-place items
  flexible?: string[];     // keep items that can move
}

export function createDesignAnalysisPrompt(context: PromptContext & { previousDesigns?: string[]; structuralConstraints?: StructureConstraints } = {}): string {
  const { roomType = 'room', previousDesigns = [], style, structuralConstraints } = context;
  const seeds = getDesignSeed() as [DesignSeed, DesignSeed, DesignSeed];

  // Build constraints section
  const hasFixedConstraints = structuralConstraints?.fixed && structuralConstraints.fixed.length > 0;
  const hasFlexibleConstraints = structuralConstraints?.flexible && structuralConstraints.flexible.length > 0;

  let constraintsSection = '';
  if (hasFixedConstraints || hasFlexibleConstraints) {
    constraintsSection = '\n\nNON-NEGOTIABLE CONSTRAINTS:\n';

    // Tier 1: Structural elements (always present via detection)
    constraintsSection += 'TIER 1 — ARCHITECTURAL SHELL (ALWAYS PRESERVED):\n';
    constraintsSection += 'This room has existing walls, windows, doors, ceiling, and floor material. Preserve ALL architectural elements exactly. Do NOT add or remove any windows, doors, or walls. Keep the same room geometry and camera perspective.\n';

    // Tier 2: User-selected keep-in-place items
    if (hasFixedConstraints) {
      constraintsSection += `\nTIER 2 — FIXED POSITION ITEMS:\nKEEP THESE EXACT ITEMS IN THEIR EXACT POSITIONS: ${structuralConstraints.fixed!.join(', ')}. Do not move, replace, or alter them in any way.\n`;
    }

    // Tier 3: User-selected keep-flexible items
    if (hasFlexibleConstraints) {
      constraintsSection += `\nTIER 3 — FLEXIBLE ITEMS:\nINCLUDE THESE ITEMS in the redesign but you may reposition them: ${structuralConstraints.flexible!.join(', ')}.\n`;
    }

    // Adjust creative freedom based on constraints
    if (hasFixedConstraints && structuralConstraints.fixed!.length > 2) {
      constraintsSection += '\nNOTE: With multiple fixed elements, focus on thoughtful refinement rather than dramatic transformation. Be intentional, not extreme.\n';
    }
  }

  return `You are a sharp, opinionated interior design critic. You write like Dwell meets Rolling Stone — precise, physical, zero filler.

FRAMEWORKS (use 2-3 per design, by exact name):
- "Aesthetic Order" — proportion, rhythm, architectural integrity
- "Human-Centric" — ergonomics, how the body moves through space
- "Universal Design" — inclusive without feeling clinical
- "Biophilic" — nature, organic forms, living materials, light
- "Phenomenological" — multi-sensory experience, emotional resonance

NEVER mention designer names, style labels, or movement names. No "wabi-sabi," no "Scandinavian," no "Parisian salon." Describe what the room LOOKS, FEELS, and SMELLS like.

ROOM CONTEXT:
- Room type: ${roomType}${style ? `\n- USER-REQUESTED STYLE DIRECTION: "${style}" — All 3 design options should interpret this style in different ways. Do NOT just copy-paste the style name. Use it as a starting point and explore 3 genuinely different interpretations that all respect this aesthetic family. Include furniture and fixtures appropriate for a ${roomType}.` : ''}${constraintsSection}

STEP 1 — ROOM READING
Analyze this ${roomType} honestly. What works, what doesn't. Be specific about what you see. 2-3 short paragraphs.

STEP 2 — 3 DESIGN DIRECTIONS
Each driven by a different principle:
1. ${seeds[0].principle} — ${seeds[0].approach}
2. ${seeds[1].principle} — ${seeds[1].approach}
3. ${seeds[2].principle} — ${seeds[2].approach}

DIVERSITY RULES (CRITICAL — THIS IS THE MOST IMPORTANT RULE):

LAYOUT DIVERSITY (most important — users see through color swaps):
- Each option MUST have a fundamentally different SPATIAL ARRANGEMENT. Not just different furniture in the same spots — different LAYOUTS entirely.
- Option 1: e.g., seating centered on a focal wall, symmetrical
- Option 2: e.g., seating arranged for conversation (facing each other), asymmetric, angled to windows
- Option 3: e.g., zones — reading nook by window, separate lounging area, unconventional flow
- Different focal points: one oriented to a wall/fireplace, one to the window/view, one creating an interior island
- Different sofa configurations: L-shape, two facing sofas, single sofa + multiple chairs, daybed, sectional in different orientations
- The visualization_prompt MUST explicitly describe WHERE each piece goes in the room (e.g., "sofa along the north wall facing the window" vs "two loveseats facing each other in the center")

FURNITURE & MATERIAL DIVERSITY:
- The 3 options MUST use completely different furniture pieces. NO shared coffee tables, chairs, sofas, or lighting between options. If option 1 suggests a Noguchi table, options 2 and 3 CANNOT use any Noguchi table.
- Different color temperatures: one warm, one cool, one wild/unexpected.
- Different densities: one maximal/layered, one minimal/spare, one mid.
- Different material families: one textile-dominant, one hard-surface-dominant, one organic/natural.
- Different eras/sensibilities: one contemporary, one vintage-influenced, one future-forward.
- One option should be genuinely radical — something the user would never think of but might love.
- The visualization_prompt for each option MUST describe SPECIFIC, DIFFERENT furniture pieces AND their spatial positions. Never reuse the same item description or layout across options.

WRITING RULES:
- Short sentences. Punchy. One adjective per noun max.
- Lead bullets with the MOVE: "Rip out the overhead light. Three mismatched pendants at different heights."
- Name materials and finishes specifically: "limewashed plaster, chalky to the touch"
- Banned words: embracing, evoking, channeling, curated, sophisticated, elevating, creating a sense of, a nod to, steeped in, imbued with, pays homage to
- Never repeat a phrase within the response
- Mood: 2-3 sentences. What it feels like to stand in the room, one unforgettable sensory detail, and why it works for this space.

Each design MUST include a specific high-end rug (material, weave, pattern — not just "add a rug").

NAMING RULES (CRITICAL):
- Names must be exactly 2-3 words. No more.
- Concrete and evocative. Think magazine headline, not poetry.
- No repeating ANY word across the 3 option names.
- GOOD names: "Brass & Shadow", "Velvet Archive", "Raw Linen", "Smoked Oak", "Salt & Iron", "Warm Void", "Tangerine Dusk"
- BAD names (DO NOT do this): "Cocooned Horizon Slumber", "Ethereal Woven Sanctuary", "Luminous Organic Retreat", "Serene Botanical Haven", "Tranquil Whisper Abode"
- No abstract filler words: sanctuary, haven, retreat, embrace, whisper, harmony, essence, serenity, oasis, cocoon, ethereal, luminous

PER OPTION: name (2-3 punchy words — see rules above), mood (2-3 sentences), frameworks (2-3), palette (5 hex), key_changes (3-5 bullets — specific enough to act on, with material/finish details), full_plan (markdown with ### headings, bullet lists, 250-400 words), visualization_prompt (detailed, keep room geometry), products (5-8 REAL product recommendations).

PRODUCT RECOMMENDATIONS (per option):
- 5-8 SPECIFIC, REAL products that have been featured in major design publications (Architectural Digest, Dwell, Dezeen, Wallpaper*, Elle Decor, T Magazine, Monocle) within the last 1-2 years.
- Think editorial, not retail. These are the pieces a design editor would name-drop. The kind of furniture you see in a Milanese apartment spread or a Tokyo concept hotel feature.
- Brands: Cassina, B&B Italia, Molteni&C, Poliform, Minotti, Vitra, Fritz Hansen, &Tradition, Gubi, Menu/Audo, HAY, Muuto, Flos, Artemide, Louis Poulsen, Roll & Hill, Apparatus, Lindsey Adelman, Workstead, De Padova, Edra, Moroso, Knoll, Herman Miller, DWR, RH, 1stDibs, The Invisible Collection, Galerie Kreo, Carpenters Workshop Gallery
- LUXURY TIER ONLY. Every product must be from the highest tier of design: Cassina, B&B Italia, Molteni&C, Poliform, Minotti, Edra, De Padova, Moroso, Baxter, Flexform, Meridiani, De La Espada, Holly Hunt, Donghia, Christian Liaigre, Pierre Yovanovitch, India Mahdavi, Vincenzo De Cotiis (furniture). Flos, Artemide, Louis Poulsen, Roll & Hill, Apparatus, Lindsey Adelman, Workstead, Bocci, Moooi, Foscarini (lighting). Dedar, Pierre Frey, Rubelli, Fortuny, de Le Cuona, Holland & Sherry (textiles). Fort Street Studio, CC-Tapis, Jan Kath, Tai Ping (rugs). 1stDibs, The Invisible Collection, Galerie Kreo, Carpenters Workshop Gallery (collectible/gallery pieces).
- Price ranges should reflect reality: $5,000-80,000+ for furniture, $2,000-30,000 for lighting, $1,000-15,000 for textiles/rugs.
- Each product: { name, brand, category (furniture|lighting|textiles|decor|rugs|hardware), price_range ("$X-Y"), description (one editorial line — why this piece is significant and why it belongs HERE), search_query (exact product + brand for search) }
- Products must feel like they belong in an AD 100 designer's portfolio. The kind of specification sheet you'd see from a Peter Marino or Kelly Wearstler project.

Full plan structure: ### Design Thesis (2-3 sentences) → ### Interventions (bullet list) → ### Materials (bullet list) → ### Rug (2-3 sentences). No prose paragraphs longer than 3 sentences.
${previousDesigns.length > 0 ? `\nALREADY SEEN (avoid these): ${previousDesigns.map(d => `"${d}"`).join(', ')}` : ''}

VISUALIZATION PROMPT RULES:
Each design's visualization_prompt MUST include:
- Specific furniture placement and layout description
- Material and finish specifications
- Lighting and atmosphere details
- The specific rug description from your design
- MANDATORY: "Remove all logos, watermarks, and text overlays from the image. No brokerage branding."${hasFixedConstraints ? `\n- Explicit instruction to preserve fixed items: ${structuralConstraints?.fixed!.join(', ')}` : ''}

Return ONLY valid JSON: { "room_reading": "...", "options": [{name, mood, frameworks, palette, key_changes, full_plan, visualization_prompt, products}, ...] }`;
}

/**
 * Visualization prompt for generating "after" images
 */
export function createVisualizationPrompt(
  analysisContent: string, 
  context: PromptContext = {}
): string {
  const { style = 'modern', livingSpace = 'medium' } = context;
  
  return `Create a photorealistic "after" visualization of this organized room based on the analysis recommendations.

**SOURCE ANALYSIS:**
${analysisContent}

**VISUALIZATION REQUIREMENTS:**

1. **Maintain Room Structure:**
   - Keep architectural elements (windows, doors, layout)
   - Preserve room proportions and lighting
   - Maintain flooring and wall colors unless specified

2. **Apply Organization Solutions:**
   - Show recommended storage solutions in place
   - Remove/reduce clutter as suggested
   - Implement the step-by-step organization plan
   - Add suggested organizational systems

3. **Style Guidelines:**
   - ${style} aesthetic approach
   - Color palette: calm, cohesive tones
   - Natural lighting when possible
   - Clean lines and minimal visual noise

4. **Realistic Details:**
   - Proper scale and proportions
   - Believable product placement
   - Natural shadows and lighting
   - Lived-in feel (not showroom perfect)

5. **Storage Integration:**
   - Show how recommended storage solutions look installed
   - Display organized items in their new homes
   - Demonstrate improved flow and functionality

**STYLE PREFERENCES:**
- Overall aesthetic: ${style}
- Space size consideration: ${livingSpace}
- Focus on achievable, maintainable organization
- Emphasize calm, zen-like atmosphere

**TECHNICAL SPECS:**
- High resolution, photorealistic quality
- Good lighting that shows organization clearly
- Wide angle that captures the full transformation
- Colors that promote calm and focus

Generate an image that shows how this space would look after implementing the organization recommendations, making it feel peaceful, functional, and achievable.`;
}

/**
 * Chat context prompt for follow-up conversations
 */
export function createChatContextPrompt(analysisContent: string): string {
  return `You are Room AI, continuing a conversation about organizing this specific room. 

**PREVIOUS ANALYSIS:**
${analysisContent}

**CONVERSATION GUIDELINES:**
- Reference the specific analysis and recommendations already provided
- Answer follow-up questions about implementation details
- Suggest modifications based on user constraints or preferences  
- Provide additional product recommendations when asked
- Help troubleshoot organizational challenges
- Offer motivation and realistic expectations

**RESPONSE STYLE:**
- Conversational and supportive
- Reference specific recommendations from the analysis
- Provide actionable, specific advice
- Ask clarifying questions when helpful
- Keep responses focused and practical

You're continuing to help organize this specific room. Answer questions about implementation, provide additional suggestions, or help modify the plan based on the user's needs.`;
}

/**
 * Product recommendation enhancement
 */
export function enhanceProductRecommendations(storageItems: any[]): any[] {
  return storageItems.map(item => ({
    ...item,
    // Add enhanced product metadata
    searchTerms: generateSearchTerms(item),
    alternatives: suggestAlternatives(item),
    diyOptions: suggestDIYAlternatives(item),
    priceRange: refinePriceEstimate(item),
  }));
}

function generateSearchTerms(item: any): string[] {
  const baseTerms = [item.solution.toLowerCase()];
  
  // Add contextual search terms
  const contextualTerms = {
    'storage bin': ['storage container', 'organization bin', 'plastic storage'],
    'shelf': ['bookshelf', 'storage shelf', 'display shelf'],
    'basket': ['wicker basket', 'storage basket', 'organization basket'],
    'drawer organizer': ['drawer divider', 'drawer insert', 'desk organizer'],
    'hook': ['wall hook', 'adhesive hook', 'command hook'],
    'cabinet': ['storage cabinet', 'organization cabinet'],
  };
  
  Object.entries(contextualTerms).forEach(([key, terms]) => {
    if (item.solution.toLowerCase().includes(key)) {
      baseTerms.push(...terms);
    }
  });
  
  return [...new Set(baseTerms)].slice(0, 5); // Unique terms, max 5
}

function suggestAlternatives(item: any): string[] {
  const alternatives: Record<string, string[]> = {
    'plastic bins': ['fabric storage cubes', 'wicker baskets', 'cardboard boxes'],
    'bookshelf': ['floating shelves', 'ladder shelf', 'cube organizer'],
    'drawer organizer': ['small boxes', 'ice cube trays', 'repurposed containers'],
    'wall hooks': ['adhesive hooks', 'magnetic hooks', 'over-door hooks'],
  };
  
  const solution = item.solution.toLowerCase();
  
  for (const [key, alts] of Object.entries(alternatives)) {
    if (solution.includes(key)) {
      return alts;
    }
  }
  
  return [];
}

function suggestDIYAlternatives(item: any): string[] {
  const diyOptions: Record<string, string[]> = {
    'storage bin': ['repurpose cardboard boxes', 'use mason jars', 'create from milk jugs'],
    'shelf': ['stack books for makeshift shelf', 'use wooden crates', 'repurpose old drawers'],
    'drawer organizer': ['use small boxes or containers', 'create with cardboard dividers'],
    'hook': ['use adhesive strips', 'repurpose command strips', 'magnetic solutions'],
  };
  
  const solution = item.solution.toLowerCase();
  
  for (const [key, options] of Object.entries(diyOptions)) {
    if (solution.includes(key)) {
      return options;
    }
  }
  
  return [];
}

function refinePriceEstimate(item: any): { min: number; max: number; currency: string } {
  const costString = item.estimatedCost || '$10-$30';
  const matches = costString.match(/\$(\d+)-\$(\d+)/);
  
  if (matches) {
    return {
      min: parseInt(matches[1]),
      max: parseInt(matches[2]),
      currency: 'USD'
    };
  }
  
  // Default fallback
  return { min: 10, max: 50, currency: 'USD' };
}

/**
 * Error-specific prompts for different failure scenarios
 */
export const errorRecoveryPrompts = {
  networkError: `I'm having trouble connecting to analyze your image right now. This usually happens due to network issues. 

While we wait for the connection to restore, here are some general organization principles you can start with:

1. **Start with decluttering** - Remove items you don't need
2. **Group similar items** - Keep like things together  
3. **Use vertical space** - Don't forget walls and doors
4. **Create designated homes** - Every item should have a place

Would you like to try uploading your image again?`,

  analysisFailure: `I encountered an issue analyzing your image. Let me try to help anyway!

Could you describe your room briefly? For example:
- What type of room is it? (bedroom, living room, office, etc.)
- What's your main organization challenge?
- How much time do you have to work on it?

I can provide targeted advice based on your description while we work on the technical issue.`,

  imageProcessingError: `I'm having trouble processing your image. Here are a few things to try:

1. **Check image format** - JPG, PNG, or WebP work best
2. **Reduce file size** - Try compressing large images
3. **Ensure good lighting** - Make sure the room is well-lit
4. **Include the full room** - Show as much of the space as possible

In the meantime, I'm happy to answer any organization questions you have!`,
};

/**
 * Prompt validation and optimization
 */
export function validatePromptResponse(response: string): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  try {
    const parsed = JSON.parse(response);
    
    // Required fields validation
    const requiredFields = ['overview', 'keyIssues', 'quickWins', 'storageSupgraded', 'stepByStep', 'zenTip'];
    
    for (const field of requiredFields) {
      if (!parsed[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Array length validation
    if (parsed.keyIssues && parsed.keyIssues.length < 2) {
      suggestions.push('Include at least 2-3 key issues');
    }
    
    if (parsed.quickWins && parsed.quickWins.length < 3) {
      suggestions.push('Provide at least 3 quick wins');
    }
    
    if (parsed.stepByStep && parsed.stepByStep.length < 5) {
      suggestions.push('Include at least 5 detailed steps');
    }
    
    // Content quality checks
    if (parsed.overview && parsed.overview.length < 50) {
      suggestions.push('Overview should be more detailed (50+ characters)');
    }
    
  } catch (e) {
    errors.push('Response is not valid JSON');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  };
}

/**
 * A/B testing prompts for optimization
 */
export const promptVariants = {
  concise: {
    name: 'Concise',
    modifier: 'Keep responses brief and action-oriented. Focus on the top 3 priorities.'
  },
  detailed: {
    name: 'Detailed', 
    modifier: 'Provide comprehensive explanations and multiple options for each recommendation.'
  },
  budget: {
    name: 'Budget-Focused',
    modifier: 'Emphasize low-cost and DIY solutions. Include free alternatives where possible.'
  },
  aesthetic: {
    name: 'Design-Focused',
    modifier: 'Balance function with beautiful design. Include style and visual appeal considerations.'
  }
};

/**
 * Iteration prompt — evolve an existing design based on user feedback
 */
export function createIterationPrompt(
  currentDesign: import('../types').DesignOption,
  iterationRequest: string
): string {
  const keyChangeSummary = currentDesign.keyChanges.slice(0, 3).join('; ');
  return `You are evolving an existing interior design direction — not starting from scratch.

CURRENT DESIGN: "${currentDesign.name}"
MOOD: ${currentDesign.mood}
KEY MOVES: ${keyChangeSummary}
PALETTE: ${currentDesign.palette.join(', ')}

THE USER WANTS THIS VARIATION: "${iterationRequest}"

Keep the core identity of "${currentDesign.name}" but modify it according to the request. This is an evolution, not a revolution.

RULES:
- Return ONE complete design option (same schema as before)
- Name: 2-3 words. Evolve from "${currentDesign.name}" — keep some DNA but reflect the change. No filler words (sanctuary, haven, retreat, essence, ethereal).
- Mood: 2-3 sentences reflecting the updated direction
- Palette: 5 hex colors — shift them to match the variation request
- Key changes: 3-5 specific, actionable bullets with material/finish details
- Full plan: markdown with ### headings, 250-400 words
- Visualization prompt: detailed, keep room geometry, describe the EVOLVED room
- Products: 5-8 luxury-tier products (Cassina, B&B Italia, Minotti, Flos, Apparatus, 1stDibs, The Invisible Collection, Holly Hunt, Donghia). Think AD 100 designer spec sheet, not retail.
- Frameworks: 2-3 from [Aesthetic Order, Human-Centric, Universal Design, Biophilic, Phenomenological]

WRITING RULES: Short sentences. Punchy. One adjective per noun max. No banned words (embracing, evoking, channeling, curated, sophisticated, elevating).

Return ONLY valid JSON: { "name": "...", "mood": "...", "frameworks": [...], "palette": [...], "key_changes": [...], "full_plan": "...", "visualization_prompt": "...", "products": [{ "name", "brand", "category", "price_range", "description", "search_query" }, ...] }`;
}

/**
 * Build a style consistency clause for project-level generation.
 * When generating a new room in a project, reference existing room styles
 * so the AI keeps material, palette, and mood coherent.
 */
export function buildProjectStyleContext(styleGuide: {
  description: string;
  palette: string[];
  materials: string[];
  referenceDesignNames: string[];
}): string {
  const parts: string[] = [];
  parts.push(`PROJECT STYLE GUIDE — this room is part of a multi-room project. Maintain visual consistency.`);
  parts.push(`Style direction: ${styleGuide.description}`);
  if (styleGuide.palette.length > 0) {
    parts.push(`Shared palette: ${styleGuide.palette.join(', ')} — use these as anchors, allow room-specific accents.`);
  }
  if (styleGuide.materials.length > 0) {
    parts.push(`Shared materials/finishes: ${styleGuide.materials.join(', ')}`);
  }
  if (styleGuide.referenceDesignNames.length > 0) {
    parts.push(`Sibling room designs: ${styleGuide.referenceDesignNames.map(n => `"${n}"`).join(', ')} — complement these, don't repeat them.`);
  }
  return parts.join('\n');
}

/**
 * Structure detection prompt for identifying permanent vs moveable elements
 */
export function createStructureDetectionPrompt(languageInstruction?: string): string {
  return `You are a structure detection AI for interior design. ${languageInstruction ? languageInstruction + ' Name all elements in that language.' : ''} Analyze this room photo and identify all visible elements, categorizing them as structural (permanent), fixture (semi-permanent), or moveable.

**RESPOND WITH STRICT JSON ONLY:**
{
  "elements": [
    {
      "id": "walls",
      "name": "Walls",
      "category": "structural",
      "detected": true,
      "keepByDefault": true
    }
  ]
}

**CATEGORIES:**

**STRUCTURAL** (keepByDefault: true) - Permanent architectural elements:
- Walls, layout, room shape
- Windows and doors
- Ceiling and flooring
- Built-in architectural features

**FIXTURE** (keepByDefault: true, but user can choose) - Semi-permanent installations:
- Built-in cabinets, countertops
- Sinks, toilets, built-in appliances
- Fireplace, built-in shelving
- Permanent lighting fixtures
- Built-in seating/banquettes

**MOVEABLE** (keepByDefault: false) - Items that can be easily changed:
- Furniture (sofas, chairs, tables, beds)
- Portable lighting (lamps, floor lights)
- Textiles (rugs, curtains, pillows, throws)
- Decor items (artwork, plants, accessories)
- Paint color and wallpaper
- Electronics and personal items

**RULES:**
- Only list elements you can clearly see in the photo
- Use descriptive but concise names (e.g. "Kitchen Island" not just "Island")  
- Include all major furniture pieces individually
- Group small decor items (e.g. "Wall art and frames")
- Be specific about fixtures (e.g. "Pendant lights over island" vs "Ceiling fan")
- Paint color is always moveable
- Built-in elements are fixtures, free-standing are moveable

Generate 8-15 elements total. Focus on the most significant design elements.`;
}

export default {
  createAnalysisPrompt,
  createVisualizationPrompt,
  createChatContextPrompt,
  enhanceProductRecommendations,
  errorRecoveryPrompts,
  validatePromptResponse,
  promptVariants,
  buildProjectStyleContext,
  createStructureDetectionPrompt,
};
