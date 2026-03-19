# ZenSpace — AI Interior Design

## What This Is
AI-powered interior design tool. Upload room photo → get redesigned versions in different styles. Uses Gemini API for generation.

## Stack
- Next.js + TypeScript + Tailwind
- Supabase (auth + storage)
- Gemini API (server-side proxy — NEVER expose key to client)
- 276 tests

## Key Features
- Style picker (Minimalist, Traditional, etc.)
- Room function selector (Dining Room, Living Room, etc.)
- Same image generates different designs each time (discovery feature)
- Code splitting, lazy loading, reduced motion support

## Shares Supabase with Dashboard
Same project vqkoxfenyjomillmxawh — password changes affect BOTH sites.

## Design
- No rounded corners (sharp edges universally)
- No emojis
- Premium, minimal aesthetic — "Design is everything with this site"
- Consistency, simple color palette
