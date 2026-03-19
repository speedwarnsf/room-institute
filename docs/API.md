# ZenSpace API Documentation

## Overview

ZenSpace uses Google's Gemini 2.0 Flash Vision API for room analysis. This document describes the service layer interfaces.

## Gemini Service

### analyzeRoom

Analyzes a room image and returns design insights.

```typescript
async function analyzeRoom(imageBase64: string): Promise<RoomAnalysis>
```

**Parameters:**
- `imageBase64`: Base64-encoded image data (with or without data URL prefix)

**Returns:**
```typescript
interface RoomAnalysis {
  style: string;              // Detected design style
  colors: ColorPalette;       // Color analysis
  furniture: FurnitureItem[]; // Detected furniture
  suggestions: Suggestion[];  // Design recommendations
  products: Product[];        // Shopping recommendations
  confidence: number;         // Analysis confidence (0-1)
}

interface ColorPalette {
  primary: string;      // Hex color
  secondary: string;    // Hex color
  accent: string;       // Hex color
  mood: string;         // e.g., "warm", "cool", "neutral"
}

interface FurnitureItem {
  name: string;
  category: string;
  style: string;
  condition?: 'excellent' | 'good' | 'fair' | 'needs-update';
}

interface Suggestion {
  area: string;         // Which part of room
  issue: string;        // Current problem
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  estimatedCost?: string;
}

interface Product {
  name: string;
  category: string;
  priceRange: string;
  link?: string;
  imageUrl?: string;
  reason: string;       // Why this product was recommended
}
```

**Errors:**
```typescript
class GeminiError extends Error {
  code: 'RATE_LIMIT' | 'AUTH' | 'NETWORK' | 'INVALID_IMAGE' | 'API_ERROR';
  retryAfter?: number;  // For rate limit errors
}
```

### chat

Continues a conversation about the analyzed room.

```typescript
async function chat(
  history: Message[],
  query: string,
  context?: RoomAnalysis
): Promise<ChatResponse>
```

**Parameters:**
- `history`: Previous messages in conversation
- `query`: User's new message
- `context`: Optional room analysis for context

**Returns:**
```typescript
interface ChatResponse {
  text: string;
  suggestions?: string[];  // Follow-up question suggestions
  products?: Product[];    // If asking about products
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### generateVisualization

Generates a visualization of suggested changes.

```typescript
async function generateVisualization(
  analysis: RoomAnalysis,
  suggestions: Suggestion[]
): Promise<string>
```

**Returns:** Base64-encoded image of the visualization

---

## Rate Limiter Service

### checkLimit

Checks if an operation can proceed.

```typescript
function checkLimit(operation: OperationType): LimitResult

type OperationType = 'analyze' | 'visualize' | 'chat';

interface LimitResult {
  allowed: boolean;
  tokensRemaining: number;
  resetIn?: number;       // Seconds until refill
  message?: string;       // User-friendly message
}
```

### consume

Consumes a token for an operation.

```typescript
function consume(operation: OperationType): boolean
```

### getRateLimitState

Gets current rate limit state.

```typescript
function getRateLimitState(): RateLimitState

interface RateLimitState {
  analyze: { tokens: number; max: number; refillRate: number };
  visualize: { tokens: number; max: number; refillRate: number };
  chat: { tokens: number; max: number; refillRate: number };
  lastRefill: string;
}
```

---

## Image Compression Service

### compressImage

Compresses an image to reduce API payload size.

```typescript
async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult>

interface CompressionOptions {
  maxWidth?: number;      // Default: 1920
  maxHeight?: number;     // Default: 1080
  quality?: number;       // 0-1, default: 0.85
  targetSize?: number;    // Target bytes
  format?: 'jpeg' | 'webp';
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  ratio: number;          // compressedSize / originalSize
  dimensions: { width: number; height: number };
}
```

---

## Session Storage Service

### saveSession

Saves an analysis session.

```typescript
async function saveSession(session: SessionData): Promise<Session>

interface SessionData {
  name?: string;
  analysis: RoomAnalysis;
  originalImage: string;  // Base64
  visualization?: string; // Base64
  chatHistory: Message[];
}
```

### loadSession

Loads a saved session.

```typescript
async function loadSession(id: string): Promise<Session | null>
```

### listSessions

Lists all saved sessions.

```typescript
async function listSessions(options?: ListOptions): Promise<SessionList>

interface ListOptions {
  search?: string;        // Search in names
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface SessionList {
  sessions: SessionSummary[];
  total: number;
  hasMore: boolean;
}

interface SessionSummary {
  id: string;
  name: string;
  thumbnail: string;      // Small preview image
  createdAt: string;
  updatedAt: string;
}
```

### deleteSession

Deletes a saved session.

```typescript
async function deleteSession(id: string): Promise<boolean>
```

### exportSessions

Exports sessions for backup.

```typescript
async function exportSessions(ids?: string[]): Promise<ExportData>

interface ExportData {
  version: string;
  exportedAt: string;
  sessions: Session[];
}
```

### importSessions

Imports sessions from backup.

```typescript
async function importSessions(data: ExportData): Promise<ImportResult>

interface ImportResult {
  imported: number;
  skipped: number;       // Already exists
  failed: number;
  errors?: string[];
}
```

### getStorageUsage

Gets storage usage information.

```typescript
function getStorageUsage(): StorageUsage

interface StorageUsage {
  used: number;          // Bytes
  available: number;     // Bytes (estimated)
  sessions: number;      // Count
  percentage: number;    // 0-100
}
```

---

## Error Handling

All services use consistent error handling:

```typescript
// Service errors
class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Common error codes
const ErrorCodes = {
  RATE_LIMITED: 'RATE_LIMITED',
  AUTH_FAILED: 'AUTH_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  STORAGE_FULL: 'STORAGE_FULL',
  NOT_FOUND: 'NOT_FOUND',
  API_ERROR: 'API_ERROR',
} as const;
```

---

## Usage Examples

### Analyze a Room

```typescript
import { analyzeRoom } from './services/geminiService';
import { compressImage } from './services/imageCompression';
import { checkLimit, consume } from './services/rateLimiter';

async function analyzeUploadedImage(file: File) {
  // Check rate limit
  const limit = checkLimit('analyze');
  if (!limit.allowed) {
    throw new Error(limit.message);
  }

  // Compress image
  const compressed = await compressImage(file, {
    targetSize: 2 * 1024 * 1024, // 2MB
  });

  // Convert to base64
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(compressed.file);
  });

  // Consume rate limit token
  consume('analyze');

  // Analyze
  const analysis = await analyzeRoom(base64);
  return analysis;
}
```

### Save and Load Session

```typescript
import { saveSession, loadSession } from './services/sessionStorage';

// Save
const session = await saveSession({
  name: 'Living Room Makeover',
  analysis: roomAnalysis,
  originalImage: base64Image,
  chatHistory: messages,
});

// Load later
const loaded = await loadSession(session.id);
if (loaded) {
  setAnalysis(loaded.analysis);
  setMessages(loaded.chatHistory);
}
```
