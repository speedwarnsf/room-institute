/**
 * Generate a shopping list from a design option using the Gemini API,
 * or from a basic analysis result as a fallback.
 */
import { ShoppingProduct, ShoppingListData, ProductCategory, ProductSuggestion } from '../types';

const PROXY_URL = '/api/gemini';

interface RawShoppingItem {
  name: string;
  description: string;
  category: string;
  price_low: number;
  price_high: number;
  quantity: number;
  design_theory_justification: string;
  search_term: string;
}

const VALID_CATEGORIES: ProductCategory[] = ['furniture', 'lighting', 'textiles', 'decor', 'plants', 'storage'];

function normalizeCategory(raw: string): ProductCategory {
  const lower = raw?.toLowerCase().trim() || '';
  if (VALID_CATEGORIES.includes(lower as ProductCategory)) return lower as ProductCategory;
  if (lower.includes('light') || lower.includes('lamp')) return 'lighting';
  if (lower.includes('plant') || lower.includes('green')) return 'plants';
  if (lower.includes('textile') || lower.includes('fabric') || lower.includes('rug') || lower.includes('curtain') || lower.includes('pillow')) return 'textiles';
  if (lower.includes('furniture') || lower.includes('chair') || lower.includes('table') || lower.includes('sofa') || lower.includes('desk') || lower.includes('shelf')) return 'furniture';
  if (lower.includes('storage') || lower.includes('bin') || lower.includes('basket') || lower.includes('organiz')) return 'storage';
  return 'decor';
}

/**
 * Generate a shopping list for a specific design direction via Gemini
 */
export async function generateShoppingList(
  designName: string,
  designDescription: string,
  fullPlan: string,
  roomReading: string,
  sessionId: string,
  languageInstruction?: string
): Promise<ShoppingListData> {
  const prompt = `${languageInstruction ? languageInstruction + '\n\n' : ''}You are the shopping editor for a high-end interior design magazine — think AD, Dwell, Dezeen. You curate product selections the way a design editor would for a feature spread.

DESIGN DIRECTION: "${designName}"
DESCRIPTION: ${designDescription}
ROOM ANALYSIS: ${roomReading}
FULL DESIGN PLAN: ${fullPlan}

Curate 8-15 specific, editorial-grade products across these categories: furniture, lighting, textiles, decor, plants, storage.

SOURCE FROM: Cassina, B&B Italia, Molteni&C, Poliform, Minotti, Vitra, Fritz Hansen, &Tradition, Gubi, Menu/Audo, HAY, Muuto, Flos, Artemide, Louis Poulsen, Roll & Hill, Apparatus, Lindsey Adelman, Knoll, Herman Miller, RH, 1stDibs, The Invisible Collection. For textiles: Dedar, Pierre Frey, Maharam, Kvadrat, de Le Cuona. For rugs: Fort Street Studio, CC-Tapis, Nanimarquina.

Mix high and attainable: 3-4 investment pieces from top houses alongside 4-5 accessible designer pieces (CB2, Article, Rejuvenation, Schoolhouse, Lulu & Georgia, Serena & Lily, McGee & Co). This is how real designers work — splurge on anchor pieces, save on accessories. Each product must be a specific, named piece.

RESPONSE FORMAT (STRICT JSON, NO MARKDOWN FENCES):
{
  "items": [
    {
      "name": "Rattan Floor Lamp",
      "description": "Warm-toned woven rattan lamp with diffused light, 60 inches tall",
      "category": "lighting",
      "price_low": 80,
      "price_high": 150,
      "quantity": 1,
      "design_theory_justification": "Biophilic design: natural materials and warm, varied lighting reduce stress (light pools vs uniform flat lighting)",
      "search_term": "rattan floor lamp warm light"
    }
  ]
}

RULES:
- 8-15 items total, spread across at least 4 categories
- price_low and price_high in USD (realistic retail prices)
- search_term: 3-6 word search query that would find this product on a retailer site
- design_theory_justification: reference specific framework principles
- Be room-specific based on the analysis

Return ONLY the JSON object.`;

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generateContent',
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.text?.trim() || data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Extract JSON
    let jsonStr = text;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) jsonStr = fenced[1];
    else if (!jsonStr.startsWith('{')) {
      const first = jsonStr.indexOf('{');
      const last = jsonStr.lastIndexOf('}');
      if (first !== -1 && last > first) jsonStr = jsonStr.slice(first, last + 1);
    }

    const parsed = JSON.parse(jsonStr);
    const rawItems: RawShoppingItem[] = Array.isArray(parsed.items) ? parsed.items : [];

    const items: ShoppingProduct[] = rawItems
      .filter(i => i.name && i.description)
      .map((item, idx) => ({
        id: `${sessionId}-${idx}-${Date.now()}`,
        name: item.name.slice(0, 100),
        description: item.description.slice(0, 300),
        category: normalizeCategory(item.category),
        priceEstimate: {
          low: Math.max(1, Math.round(item.price_low || 10)),
          high: Math.max(2, Math.round(item.price_high || 50)),
        },
        affiliateUrl: `https://www.google.com/search?q=${encodeURIComponent(item.search_term || item.name)}&tbm=shop`,
        searchTerm: (item.search_term || item.name).slice(0, 60),
        quantity: Math.max(1, Math.min(10, item.quantity || 1)),
        designTheoryJustification: (item.design_theory_justification || 'Supports the overall design direction').slice(0, 300),
        designDirection: designName,
        purchased: false,
      }));

    return {
      designName,
      designDescription,
      items,
      sessionId,
      createdAt: Date.now(),
    };
  } catch (err) {
    console.error('Shopping list generation failed, using fallback:', err);
    return createFallbackShoppingList(designName, designDescription, sessionId);
  }
}

/**
 * Create a shopping list from basic ProductSuggestion[] (for non-design-option flow)
 */
export function shoppingListFromProducts(
  products: ProductSuggestion[],
  sessionId: string
): ShoppingListData {
  const items: ShoppingProduct[] = products.map((p, idx) => ({
    id: `${sessionId}-basic-${idx}`,
    name: p.name,
    description: p.reason,
    category: normalizeCategory(p.name),
    priceEstimate: { low: 15, high: 50 },
    affiliateUrl: `https://www.google.com/search?q=${encodeURIComponent(p.searchTerm)}`,
    searchTerm: p.searchTerm,
    quantity: 1,
    designTheoryJustification: p.reason,
    designDirection: 'Organization Plan',
    purchased: false,
  }));

  return {
    designName: 'Organization Plan',
    designDescription: 'AI-recommended products for your space',
    items,
    sessionId,
    createdAt: Date.now(),
  };
}

function createFallbackShoppingList(
  designName: string,
  designDescription: string,
  sessionId: string
): ShoppingListData {
  const fallbackItems: ShoppingProduct[] = [
    {
      id: `${sessionId}-fb-0`,
      name: 'Accent Throw Pillow Set',
      description: 'Set of 2-3 coordinated throw pillows in design palette colors',
      category: 'textiles',
      priceEstimate: { low: 25, high: 45 },
      affiliateUrl: 'https://www.google.com/search?q=decorative+throw+pillow+set',
      searchTerm: 'decorative throw pillow set',
      quantity: 1,
      designTheoryJustification: 'Adds tactile warmth and color cohesion (Phenomenological: multi-sensory experience)',
      designDirection: designName,
      purchased: false,
    },
    {
      id: `${sessionId}-fb-1`,
      name: 'Indoor Potted Plant',
      description: 'Low-maintenance green plant in a ceramic pot',
      category: 'plants',
      priceEstimate: { low: 15, high: 35 },
      affiliateUrl: 'https://www.google.com/search?q=indoor+potted+plant+ceramic',
      searchTerm: 'indoor potted plant ceramic',
      quantity: 2,
      designTheoryJustification: 'Biophilic design: living greenery reduces stress and improves air quality',
      designDirection: designName,
      purchased: false,
    },
    {
      id: `${sessionId}-fb-2`,
      name: 'Warm LED Table Lamp',
      description: 'Dimmable table lamp with warm white light (2700K)',
      category: 'lighting',
      priceEstimate: { low: 30, high: 60 },
      affiliateUrl: 'https://www.google.com/search?q=warm+led+table+lamp+dimmable',
      searchTerm: 'warm led table lamp dimmable',
      quantity: 1,
      designTheoryJustification: 'Biophilic: varied lighting with warm pools instead of uniform flat lighting',
      designDirection: designName,
      purchased: false,
    },
  ];

  return {
    designName,
    designDescription,
    items: fallbackItems,
    sessionId,
    createdAt: Date.now(),
  };
}
