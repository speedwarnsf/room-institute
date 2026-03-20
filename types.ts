/**
 * Product suggestion from AI analysis
 */
export interface ProductSuggestion {
  /** Display name for the product */
  name: string;
  /** Amazon search query for finding this product */
  searchTerm: string;
  /** Explanation of why this product helps with organization */
  reason: string;
}

/**
 * Product categories for shopping lists
 */
export type ProductCategory = 'furniture' | 'lighting' | 'textiles' | 'decor' | 'plants' | 'storage';

/**
 * Enhanced product for shopping lists with affiliate tracking
 */
export interface ShoppingProduct {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceEstimate: { low: number; high: number };
  affiliateUrl: string;
  searchTerm: string;
  quantity: number;
  designTheoryJustification: string;
  designDirection: string;
  purchased: boolean;
}

/**
 * A complete shopping list for a design direction
 */
export interface ShoppingListData {
  designName: string;
  designDescription: string;
  items: ShoppingProduct[];
  sessionId: string;
  createdAt: number;
}

/**
 * Complete analysis result from the AI
 */
export interface AnalysisResult {
  /** Markdown-formatted analysis with organization recommendations */
  rawText: string;
  /** AI prompt for generating the visualization */
  visualizationPrompt: string;
  /** List of recommended products */
  products: ProductSuggestion[];
}

/**
 * A single message in the chat interface
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Who sent the message */
  role: 'user' | 'model';
  /** Message content (may contain markdown) */
  text: string;
  /** Unix timestamp of when the message was sent */
  timestamp: number;
  /** Whether this message represents an error */
  isError?: boolean;
}

/**
 * A design theory framework referenced in analysis
 */
export type DesignFramework =
  | 'Aesthetic Order'
  | 'Human-Centric'
  | 'Universal Design'
  | 'Biophilic'
  | 'Phenomenological';

/**
 * A specific real product recommendation for a design direction
 */
export interface ProductRecommendation {
  /** Actual product name, e.g. "Noguchi Coffee Table" */
  name: string;
  /** Brand name, e.g. "Herman Miller" */
  brand: string;
  /** Product category */
  category: 'furniture' | 'lighting' | 'textiles' | 'decor' | 'rugs' | 'hardware';
  /** Estimated price range, e.g. "$800-1,200" */
  priceRange: string;
  /** One line — why this piece works in this design */
  description: string;
  /** Pre-built search query for affiliate linking later */
  searchQuery: string;
}

/**
 * One of three design directions generated after room analysis
 */
export interface DesignOption {
  /** Short, evocative name (e.g. "Biophilic Warmth") */
  name: string;
  /** 1-2 sentence mood / vibe description */
  mood: string;
  /** Which theory frameworks primarily inform this direction */
  frameworks: DesignFramework[];
  /** How each framework specifically shaped decisions in this design */
  frameworkRationale?: string;
  /** 5 hex colour strings representing the palette */
  palette: string[];
  /** Bullet-point key changes (3-5 items) */
  keyChanges: string[];
  /** Full design plan markdown (shown on expand) */
  fullPlan: string;
  /** Visualization prompt to generate an AI image for this option */
  visualizationPrompt: string;
  /** Base64 image data once generated */
  visualizationImage?: string;
  visualizationThumb?: string; // Small JPEG thumbnail for room gallery persistence
  /** Curated product recommendations for this design */
  products?: ProductRecommendation[];
}

/**
 * Extended analysis that includes design theory + 3 options
 */
export interface DesignAnalysis {
  /** High-level room reading through the 5 frameworks */
  roomReading: string;
  /** The three distinct design directions */
  options: [DesignOption, DesignOption, DesignOption];
}

/**
 * Application state machine states
 */
export type TypeMood = 'warm-editorial' | 'stark-minimal' | 'bold-expressive' | 'classic-refined' | 'raw-industrial';

export type DesignRating = 'never' | 'not-now' | 'like' | 'good' | 'the-one';

export interface LookbookEntry {
  id: string;
  option: DesignOption;
  rating: DesignRating | null;
  generatedAt: number;
  batchIndex: number;
  /** If this entry was iterated from another design, the parent entry id */
  iteratedFrom?: string;
}

export type FlowMode = 'redesign';

/**
 * A saved room with its design history
 */
export interface Room {
  id: string;
  name: string;
  sourceImage?: string;
  sourceImageThumb?: string;
  designs: LookbookEntry[];
  selectedDesignId?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * A house containing multiple rooms
 */
export interface House {
  id: string;
  name: string;
  rooms: Room[];
  createdAt: number;
}

/**
 * A project grouping multiple rooms for coordinated design
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  roomIds: string[];
  /** Style guide for consistency across rooms */
  styleGuide?: ProjectStyleGuide;
  notes: string;
  budget: ProjectBudget;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectStyleGuide {
  /** Summary of the shared style direction */
  description: string;
  /** Shared palette across rooms */
  palette: string[];
  /** Material/finish keywords for consistency */
  materials: string[];
  /** Reference design names from existing rooms */
  referenceDesignNames: string[];
}

export interface ProjectBudget {
  total: number;
  spent: number;
  currency: string;
  items: ProjectBudgetItem[];
}

export interface ProjectBudgetItem {
  id: string;
  roomId?: string;
  description: string;
  amount: number;
  purchased: boolean;
}

export enum AppState {
  /** Initial state - waiting for image upload */
  HOME = 'HOME',
  /** Image is being analyzed by AI */
  ANALYZING = 'ANALYZING',
  /** User chooses between Clean and Redesign flows */
  MODE_SELECT = 'MODE_SELECT',
  /** Structure detection and user choices */
  STRUCTURE_ASSESSMENT = 'STRUCTURE_ASSESSMENT',
  /** Show 3 design options after analysis */
  DESIGN_OPTIONS = 'DESIGN_OPTIONS',
  /** Lookbook view with drag-to-rate cards */
  LOOKBOOK = 'LOOKBOOK',
  /** Room management view */
  ROOMS = 'ROOMS',
  /** Analysis complete, showing results */
  RESULTS = 'RESULTS',
  /** Deep-dive editorial view for a single design */
  DESIGN_STUDIO = 'DESIGN_STUDIO',
  /** Project overview */
  PROJECTS = 'PROJECTS',
  /** Discover — design inspiration feed */
  DISCOVER = 'DISCOVER',
  /** An error occurred */
  ERROR = 'ERROR'
}

/**
 * Error information for display in the UI
 */
export interface AppError {
  /** Short heading for the error */
  title?: string;
  /** User-friendly error message */
  message: string;
  /** Actionable suggestion for the user */
  suggestion?: string;
  /** Error code for debugging/handling */
  code: string;
  /** Whether the user can retry the action */
  isRetryable: boolean;
}

/**
 * Image upload state
 */
export interface UploadedImage {
  /** Full data URL (data:image/...;base64,...) */
  dataUrl: string;
  /** Just the base64 portion */
  base64: string;
  /** MIME type (e.g., 'image/jpeg') */
  mimeType: string;
  /** Original file name */
  fileName: string;
}

/**
 * A detected structural element in a room
 */
export interface StructureElement {
  /** Unique identifier for this element */
  id: string;
  /** Display name for the element */
  name: string;
  /** Category of the element */
  category: 'structural' | 'fixture' | 'moveable';
  /** Whether this element was detected by AI */
  detected: boolean;
  /** Whether to keep this element by default */
  keepByDefault: boolean;
}

/**
 * Result from structure detection analysis
 */
export interface StructureDetectionResult {
  /** List of detected elements */
  elements: StructureElement[];
}

/**
 * How to handle a structural element in design generation
 */
export type KeepMode = 'change' | 'keep' | 'keep-in-place';

/**
 * User's choices about which elements to keep vs change
 */
export interface StructureChoices {
  /** Map of element ID to how it should be handled */
  keepChoices: Record<string, KeepMode>;
  /** Elements that should remain unchanged in exact position */
  elementsToKeepInPlace: StructureElement[];
  /** Elements to include but can be repositioned */
  elementsToKeepFlexible: StructureElement[];
  /** Elements that can be changed */
  elementsToChange: StructureElement[];
}

/**
 * Real Estate Listing Types
 */

export interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  heroImage: string;
  sourceUrl?: string;
  agent: {
    name: string;
    brokerage: string;
    photo?: string;
    logo?: string;
  };
  rooms: ListingRoom[];
  createdAt: number;
}

export interface ListingRoom {
  id: string;
  label: string;
  originalPhoto: string;
  thumbnail: string;
  designs: ListingDesign[];
}

export interface ListingDesign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  frameworks: string[];
  palette?: string[];
  products?: Array<{ name: string; brand: string; category: string; price_range: string; description: string; search_query?: string; }>;
}

/**
 * Agent Profile for Real Estate Agent Onboarding
 */
export interface AgentProfile {
  name: string;
  email: string;
  phone: string;
  license: string;
  brokerage: string;
  customBrokerage?: string;
  photoUrl?: string;
  enhancedPhotoUrl?: string;
  portraitStyle?: "original" | "studio" | "environmental" | "editorial";
  createdAt: number;
}
