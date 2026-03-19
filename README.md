# ZenSpace Organizer

AI-powered room organization assistant. Upload a photo of any messy space and get:

- **Detailed analysis** of clutter and organization issues
- **Step-by-step plan** to declutter and organize
- **AI visualization** of your room after organization
- **Product recommendations** with Amazon affiliate links
- **Chat interface** for follow-up questions

## 🌐 Live Demo

**Production:** https://dustyork.com/zenspace

> **Note:** Requires `GEMINI_API_KEY` environment variable to be configured in Vercel for full functionality.

The app is proxied from `dustyork.com/zenspace` via Vercel rewrites to `zenspace-two.vercel.app`.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript (strict mode), Vite
- **Styling:** Tailwind CSS (CDN)
- **AI:** Google Gemini API (`gemini-2.0-flash`)
- **Hosting:** Vercel
- **Testing:** Vitest, Testing Library

## 🚀 Development

### Prerequisites

- Node.js 18+
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Quick Start

```bash
# Clone the repository
git clone https://github.com/speedwarnsf/ZenSpace.git
cd ZenSpace

# Install dependencies
npm install

# Create environment file with your API key
echo "GEMINI_API_KEY=your-api-key-here" > .env.local

# Start development server
npm run dev
```

Open http://localhost:3000

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | Run TypeScript type checking |

### Build for Production

```bash
npm run build
npm run preview
```

## 🧪 Testing

The project uses [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/) for component testing.

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Test Structure

**251+ tests passing** across 13 test files:

```
test/
├── setup.ts                          # Test setup and global mocks
├── App.test.tsx                      # Main app tests
├── sessionStorage.test.ts            # Session persistence tests
├── components/
│   ├── ChatInterface.test.tsx        # Chat component tests
│   ├── ComparisonSlider.test.tsx     # Before/after slider tests
│   ├── LazyImage.test.tsx            # Lazy loading image tests
│   ├── SessionManager.test.tsx       # Session UI tests
│   ├── ShareButton.test.tsx          # Social sharing tests
│   ├── ThemeContext.test.tsx         # Theme state tests
│   ├── ThemeToggle.test.tsx          # Theme toggle tests
│   └── UploadZone.test.tsx           # Upload component tests
└── services/
    ├── geminiService.test.ts         # AI service tests
    ├── imageCompression.test.ts      # Image compression tests
    └── rateLimiter.test.ts           # Rate limiting tests
```

## ☁️ Deployment (Vercel)

### Automatic Deployment

1. Push to GitHub
2. Import project to Vercel
3. Add environment variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your Google Gemini API key
4. Deploy

The app auto-deploys on every push to `main`.

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📖 Features

### Image Analysis

Upload a photo of a messy room. The AI analyzes:

- **Key Issues** - Main sources of clutter identified
- **Quick Wins** - 3 immediate actions (under 15 minutes each)
- **Storage Solutions** - Specific suggestions for containers/furniture
- **Step-by-Step Plan** - Numbered list to organize the space
- **Aesthetic Tip** - Design recommendation for a "Zen" look

### Room Visualization

Generate an AI-rendered preview showing your room after following the organization plan. Uses Gemini's image generation capabilities to create photorealistic "after" images.

### Chat Assistant

Ask follow-up questions about:

- Where to put specific items
- Storage container recommendations
- Color schemes and aesthetics
- Organization strategies
- Budget-friendly alternatives

### Product Recommendations

Get specific product suggestions with Amazon affiliate links based on AI analysis of your space.

## 📁 Project Structure

```
zenspace/
├── App.tsx                  # Main application component
├── index.tsx               # React entry point
├── index.html              # HTML template with Tailwind CDN
├── types.ts                # TypeScript interfaces & types
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest test configuration
├── tsconfig.json           # TypeScript configuration (strict mode)
├── components/
│   ├── UploadZone.tsx      # Drag-drop image upload with camera lens UI
│   ├── AnalysisDisplay.tsx # Analysis results, visualization, products
│   └── ChatInterface.tsx   # Chat component for follow-up questions
├── services/
│   └── geminiService.ts    # Gemini API integration with error handling
└── test/                   # Test files
```

## 🔌 API Integration

### Gemini Service (`services/geminiService.ts`)

The service handles all AI interactions:

```typescript
// Check if API is configured
isApiConfigured(): boolean

// Get human-readable config error
getApiConfigError(): string

// Analyze a room image
analyzeImage(base64Image: string, mimeType: string): Promise<AnalysisResult>

// Generate organized room visualization
generateRoomVisualization(prompt: string, base64: string, mimeType: string): Promise<string>

// Create a chat session for follow-up questions
createChatSession(context: string): Chat
```

### Error Handling

The service uses a custom `GeminiApiError` class:

```typescript
class GeminiApiError extends Error {
  code: string;        // Error code (e.g., 'API_KEY_MISSING', 'RATE_LIMIT')
  isRetryable: boolean; // Whether the error can be retried
}
```

Error codes:
- `API_KEY_MISSING` - No API key configured
- `INVALID_API_KEY` - API key is invalid
- `RATE_LIMIT` - API rate limit exceeded
- `NETWORK_ERROR` - Network connectivity issue
- `EMPTY_RESPONSE` - AI returned empty response
- `PARSE_ERROR` - Failed to parse AI response
- `VISUALIZATION_FAILED` - Image generation failed

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

For local development, create a `.env.local` file:

```env
GEMINI_API_KEY=your-api-key-here
```

## ♿ Accessibility

The app includes:

- Semantic HTML structure with ARIA labels
- Keyboard navigation support
- Screen reader announcements for loading states
- Focus management for interactive elements
- High contrast text and visual indicators
- Mobile-friendly touch targets

## 📱 Mobile Responsiveness

- Fluid layout that adapts to screen size
- Touch-friendly upload zone
- Responsive chat interface
- Optimized image viewing on small screens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT

---

Built with ❤️ using React, TypeScript, and Google Gemini AI.
