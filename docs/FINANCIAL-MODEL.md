# ZenSpace Financial Model — Path to Millions

*Built March 15, 2026. Updated quarterly.*

---

## The Business in One Sentence

ZenSpace turns every real estate listing into an interactive design experience, monetized through affiliate commerce, data-as-a-service, premium agent tools, and design partner referrals.

---

## Revenue Streams (4 engines)

### 1. Affiliate Commerce (Skimlinks) — PASSIVE, SCALABLE
**How:** Every design includes 5-8 real products from real brands. Buyers browse → click → buy.
**Revenue:** 5-15% commission per sale via Skimlinks (75% of commission to us).
**Average furniture purchase from design inspiration:** $2,000-$8,000
**Our cut per conversion:** $75-$450

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| Monthly listing visitors | 10,000 | 50,000 | 250,000 |
| Click-through to products | 8% | 10% | 12% |
| Conversion rate | 2% | 3% | 4% |
| Avg order value | $2,000 | $3,500 | $5,000 |
| Commission rate (net) | 3.75% | 5% | 7.5% |
| **Monthly revenue** | **$6,000** | **$26,250** | **$450,000** |
| **Annual revenue** | **$72,000** | **$315,000** | **$5,400,000** |

**Key insight:** We don't need to sell subscriptions to make money. Every visitor to every listing is a potential affiliate customer. Volume is everything.

### 2. Agent Subscriptions — RECURRING
**How:** Agents pay monthly for premium features: unlimited listings, AI portraits, QR cards, analytics dashboard.

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 1 listing, 3 designs/room, basic QR |
| Pro | $29/mo | Unlimited listings, 5 designs/room, analytics, portrait |
| Agency | $199/mo | 10 agent seats, bulk tools, white-label option, API access |
| Enterprise | $499/mo | Unlimited seats, custom branding, dedicated support |

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Free agents | 5,000 | 25,000 | 100,000 |
| Pro agents (5% convert) | 250 | 1,250 | 5,000 |
| Pro MRR | $7,250 | $36,250 | $145,000 |
| Agency accounts | 10 | 50 | 200 |
| Agency MRR | $1,990 | $9,950 | $39,800 |
| **Total subscription MRR** | **$9,240** | **$46,200** | **$184,800** |
| **Annual subscription** | **$110,880** | **$554,400** | **$2,217,600** |

### 3. Design Partner Referrals (MODTAGE model) — HIGH MARGIN
**How:** Interior designers/firms pay for premium placement as the "Advertisement" at the bottom of every listing in their market. Like a sponsored result.

| Tier | Price | Coverage |
|------|-------|----------|
| Local | $500/mo | One city/neighborhood |
| Regional | $2,000/mo | Metro area |
| National | $10,000/mo | Country-wide |

**Target:** 50 design partners across top 20 markets = $25,000-$100,000/mo

### 4. Data & Insights (Pitch Portfolios) — B2B
**How:** Aggregated engagement data sold to agencies, developers, and design firms.
- Which designs get the most engagement?
- Which products convert best?
- What styles are trending by market?
- Open house QR scan analytics

**Pricing:** $500-$5,000/report, or $2,000-$10,000/mo subscription for real-time dashboards.

---

## Cost Structure

### API Costs (Gemini)

| Operation | Model | Cost per call | Calls per listing |
|-----------|-------|---------------|-------------------|
| Room labeling | gemini-2.0-flash | $0.001 | 10-30 photos |
| Design generation (analysis) | gemini-2.0-flash | $0.005 | 3 per room × 3-5 rooms |
| Design visualization | gemini-2.5-flash-image | $0.02 | 3 per room × 3-5 rooms |
| Editorial spread | gemini-2.0-flash | $0.005 | On-demand per design |
| Portrait generation | gemini-2.5-flash-image | $0.02 | 3 per agent |
| Generate More | gemini-2.5-flash-image | $0.02 | On-demand |

**Cost per listing intake (full pipeline):**
- 20 photos labeled: $0.02
- 4 rooms × 3 designs (analysis): $0.06
- 4 rooms × 3 designs (visualization): $0.24
- **Total: ~$0.32 per listing**

**Cost per spread (on-demand):** $0.005
**Cost per "Generate More":** $0.025

**At scale:**
| Listings/month | API cost/month | Cost per visitor (amortized) |
|----------------|---------------|------------------------------|
| 100 | $32 | negligible |
| 1,000 | $320 | $0.003 |
| 10,000 | $3,200 | $0.0003 |
| 100,000 | $32,000 | $0.00003 |

### Storage Costs (Supabase)

| Tier | Storage | Cost | Listings supported |
|------|---------|------|--------------------|
| Free | 1 GB | $0 | ~200 listings |
| Pro | 100 GB | $25/mo | ~20,000 listings |
| Team | 500 GB | $599/mo | ~100,000 listings |

**Per listing storage:** ~5 MB (3-5 rooms × 3 design images × ~300KB each + metadata)

### Vercel Hosting

| Tier | Cost | Included |
|------|------|----------|
| Pro (current) | $20/mo | 1TB bandwidth, serverless |
| Enterprise | $400/mo | 10TB bandwidth, edge, priority |

### Total Monthly Costs at Scale

| Scale | API | Storage | Hosting | Total |
|-------|-----|---------|---------|-------|
| 1K listings | $320 | $25 | $20 | $365 |
| 10K listings | $3,200 | $25 | $20 | $3,245 |
| 100K listings | $32,000 | $599 | $400 | $32,999 |

---

## The Free-vs-Paid Question

### Recommendation: **FREEMIUM with generous free tier**

**Free forever:**
- Unlimited listing views for homebuyers (this is where affiliate revenue comes from)
- 1 listing per agent
- 3 designs per room
- Basic QR codes
- "Powered by ZenSpace" branding

**Why free for buyers?** Every buyer visit = affiliate revenue opportunity. A paywall on the buyer side kills the goose that lays golden eggs. The buyer experience must be free, beautiful, and shareable.

**Why free tier for agents?** Market saturation. If 100,000 agents use the free tier, that's 100,000 listings generating affiliate revenue. The free agents ARE the product — they create the inventory that generates commerce.

**Paid agents get:** More designs, analytics, portraits, remove ZenSpace branding, QR cards.

---

## Path to $1M ARR

| Milestone | Timeline | Revenue mix |
|-----------|----------|-------------|
| $10K MRR | Month 6 | 60% affiliate, 30% subscriptions, 10% partners |
| $50K MRR | Month 12 | 50% affiliate, 30% subscriptions, 20% partners |
| $83K MRR ($1M ARR) | Month 18 | 45% affiliate, 30% subscriptions, 25% partners |

**What it takes for $1M ARR:**
- 50,000 monthly listing visitors (across all agent listings)
- 500 Pro agents ($29/mo)
- 20 design partners ($2,000/mo average)
- 3% product click-through, 2.5% conversion, $3,000 AOV

---

## Path to $10M ARR

| Driver | Monthly revenue |
|--------|----------------|
| Affiliate (250K visitors, 10% CTR, 3% CVR, $3,500 AOV, 5% commission) | $131,250 |
| Agent subscriptions (5,000 Pro + 200 Agency) | $184,800/12 = $15,400/mo... wait, annual |

Let me recalculate:
| Driver | Annual revenue |
|--------|----------------|
| Affiliate commerce | $1,575,000 |
| Pro agents (5,000 × $29/mo) | $1,740,000 |
| Agency accounts (200 × $199/mo) | $477,600 |
| Enterprise (20 × $499/mo) | $119,760 |
| Design partners (100 × $2,000/mo) | $2,400,000 |
| Data/insights | $500,000 |
| QR card physical sales | $200,000 |
| **Total** | **$7,012,360** |

Add international expansion (2x multiplier on affiliate + subscriptions): **$10M+ ARR**

---

## Competitive Moat

1. **AI design quality** — Gemini generates actual room visualizations, not mood boards
2. **Affiliate integration** — No competitor monetizes the design → commerce pipeline
3. **Multi-platform scraping** — Works with ANY listing URL globally (80+ platforms)
4. **Agent network effects** — More agents = more listings = more buyer traffic = more affiliate revenue
5. **Data monopoly** — First to aggregate design engagement data at scale
6. **i18n from day one** — 6 languages, global reach
7. **Design partner marketplace** — MODTAGE model scales to every market

---

## Immediate Action Items (This Week)

1. [ ] Apply for Skimlinks account (Dustin)
2. [ ] Deploy i18n + multi-platform scraping
3. [ ] Invite 5 SF agents to test (get first real listings)
4. [ ] Contact MODTAGE about formalized partnership
5. [ ] Set up Google Analytics for conversion tracking
6. [ ] Create agent referral program (free → Pro for every 3 agents referred)
7. [ ] Build landing page for agents (zenspace.design — currently the main app)
8. [ ] Submit to Product Hunt

## 90-Day Sprint

**Month 1: Foundation**
- Skimlinks live, tracking revenue
- 50 agents onboarded (SF market)
- 200 listings live
- Product Hunt launch

**Month 2: Growth**
- Expand to LA, NYC, Miami, London
- Partner with 3 design firms
- Launch agency tier
- PR: tech press coverage

**Month 3: Scale**
- 1,000 agents, 5,000 listings
- International expansion (UK, Australia, Germany)
- First $10K MRR month
- Seed funding conversations if desired

---

*"The money is in the volume. Make the tool free, beautiful, and everywhere. Monetize the commerce and the data."*
