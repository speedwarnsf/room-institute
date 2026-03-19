# ZenSpace Architecture

## Overview

ZenSpace is a React-based AI room analysis application that uses Google's Gemini Vision API to analyze interior spaces and provide design recommendations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript |
| State | React Context (ThemeContext) |
| Styling | CSS Modules, CSS Variables |
| AI | Google Gemini 2.0 Flash |
| Build | Vite |
| Testing | Vitest, React Testing Library |

## Project Structure

```
zenspace/
├── components/           # React components
│   ├── AnalysisDisplay.tsx    # Displays AI analysis results
│   ├── ChatInterface.tsx      # Multi-turn conversation UI
│   ├── ComparisonSlider.tsx   # Before/after comparison
│   ├── LazyImage.tsx          # Lazy loading images
│   ├── SessionManager.tsx     # Save/load sessions
│   ├── ShareButton.tsx        # Social sharing
│   ├── ThemeToggle.tsx        # Dark mode toggle
│   └── UploadZone.tsx         # Drag & drop upload
├── contexts/
│   └── ThemeContext.tsx       # Theme state management
├── services/
│   ├── geminiService.ts       # Gemini API integration
│   ├── imageCompression.ts    # Client-side image compression
│   ├── rateLimiter.ts         # Token bucket rate limiting
│   └── sessionStorage.ts      # Local session persistence
├── test/                 # Test files
│   ├── components/       # Component tests
│   ├── services/         # Service tests
│   └── setup.ts          # Test configuration
├── App.tsx               # Main application
└── index.tsx             # Entry point
```

## Component Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ UploadZone  │──│ geminiService│──│ AnalysisDisplay │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│        │                                     │              │
│        ▼                                     ▼              │
│  ┌─────────────┐                    ┌───────────────┐      │
│  │ Compression │                    │ ChatInterface │      │
│  └─────────────┘                    └───────────────┘      │
│                                                             │
│  ┌─────────────────┐  ┌─────────────┐  ┌──────────┐        │
│  │ SessionManager  │  │ ShareButton │  │ ThemeCtx │        │
│  └─────────────────┘  └─────────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### UploadZone
- Handles drag & drop and file input
- Validates file types (images only)
- Shows upload preview
- Keyboard accessible

#### AnalysisDisplay
- Renders AI analysis results
- Supports comparison view with ComparisonSlider
- Displays product recommendations
- Lazy loads visualization images

#### ChatInterface
- Multi-turn conversation with Gemini
- Maintains conversation history
- Streaming response support (future)

#### SessionManager
- Save/load analysis sessions
- Local storage persistence
- Session search and organization
- Export/import functionality

## Services

### geminiService

```typescript
interface GeminiService {
  analyzeRoom(image: string): Promise<RoomAnalysis>;
  chat(history: Message[], query: string): Promise<ChatResponse>;
  generateVisualization(room: RoomAnalysis): Promise<string>;
}
```

Key features:
- Error classification (rate limit, auth, network)
- Automatic retry with backoff
- Response validation
- Image preprocessing

### imageCompression

```typescript
interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}
```

Features:
- Target size optimization
- Quality adjustment
- Canvas-based compression
- Fallback for unsupported browsers

### rateLimiter

Token bucket implementation:
- Per-operation rate limits
- State persistence
- Refill over time
- User-friendly notifications

### sessionStorage

```typescript
interface Session {
  id: string;
  name: string;
  thumbnail: string;
  analysis: RoomAnalysis;
  history: Message[];
  createdAt: string;
  updatedAt: string;
}
```

## Theme System

Uses CSS variables for theming:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  /* ... */
}

[data-theme="dark"] {
  --bg-primary: #121212;
  --text-primary: #ffffff;
  /* ... */
}
```

ThemeContext provides:
- Current theme state
- Toggle function
- System preference detection
- Persistence to localStorage

## Testing Strategy

| Test Type | Coverage |
|-----------|----------|
| Unit | Services, utilities |
| Component | React components |
| Integration | Full flows |
| E2E | Playwright (3 browsers) |

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
```

## Performance Considerations

1. **Image Compression**: Reduce upload size before API call
2. **Lazy Loading**: Images load on demand
3. **Rate Limiting**: Prevent API quota exhaustion
4. **Session Caching**: Avoid redundant API calls

## Security

- API keys in environment variables only
- No sensitive data in localStorage
- Input sanitization for user text
- CORS-compliant API calls

## Deployment

Deployed on Vercel:
- Automatic deploys from main branch
- Environment variable management
- Edge function optimization

## Future Improvements

1. **WebSocket Support**: Real-time streaming responses
2. **Multiple Rooms**: Compare different spaces
3. **AR Preview**: View recommendations in-situ
4. **Voice Input**: Hands-free interaction
