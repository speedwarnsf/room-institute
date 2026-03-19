# Complete i18n Implementation Guide for Remaining Components

## Summary
AgentDashboard.tsx has been FULLY translated with useI18n imported and all hardcoded strings replaced with t() calls.

## Status by Component
1. ✅ AgentDashboard.tsx - **COMPLETE**
2. ⚠️  ListingManage.tsx - **useI18n imported, needs string replacements**
3. ❌ PortraitCrop.tsx - **Needs useI18n import + translations**
4. ❌ ListingPage.tsx - **Needs useI18n import + translations**
5. ❌ PricingPage.tsx - **Needs useI18n import + translations**
6. ❌ DiscoverPage.tsx - **Needs useI18n import + translations**
7. ❌ AgencyInterface.tsx - **Needs useI18n import + translations**
8. ❌ NotFound.tsx - **Needs useI18n import + translations**
9. ❌ UpgradePrompt.tsx - **Needs useI18n import + translations**
10. ❌ AuthGate.tsx - **Needs useI18n import + translations**
11. ❌ translations.ts - **Needs ALL new keys added for all 6 locales**

## Complete Translation Keys to Add to translations.ts

Add these keys to the `en` object in translations.ts (after line 194, before the closing brace):

```typescript
    // Dashboard (AgentDashboard.tsx)
    'dashboard.loadingDashboard': 'Loading dashboard...',
    'dashboard.agentDashboard': 'Agent Dashboard',
    'dashboard.newListing': 'New Listing',
    'dashboard.listings': 'Listings',
    'dashboard.qrCodes': 'QR Codes',
    'dashboard.analytics': 'Analytics',
    'dashboard.branding': 'Branding',
    'dashboard.totalListings': 'Total Listings',
    'dashboard.live': 'Live',
    'dashboard.inReview': 'In Review',
    'dashboard.totalDesigns': 'Total Designs',
    'dashboard.noListingsYet': 'No listings yet',
    'dashboard.pasteListingURL': 'Paste a listing URL to create your first ZenSpace experience.',
    'dashboard.createListing': 'Create Listing',
    'dashboard.bed': 'bed',
    'dashboard.bath': 'bath',
    'dashboard.sqft': 'sqft',
    'dashboard.rooms': 'rooms',
    'dashboard.designs': 'designs',
    'dashboard.manage': 'Manage',
    'dashboard.preview': 'Preview',
    'dashboard.qrCodeCenter': 'QR Code Center',
    'dashboard.qrCodeInstructions': 'Download QR codes for open house signage and Moo postcards. House QR goes on the front door and postcards. Room QRs go by each light switch.',
    'dashboard.noActiveListings': 'No active listings. Create a listing first to generate QR codes.',
    'dashboard.generating': 'Generating...',
    'dashboard.generateQRCodes': 'Generate QR Codes',
    'dashboard.qrCodeStorageNote': 'QR codes will be generated as SVG files stored in Supabase. Download them for print-ready signage.',
    'dashboard.totalQRScans': 'Total QR Scans',
    'dashboard.designsGenerated': 'Designs Generated',
    'dashboard.liveListings': 'Live Listings',
    'dashboard.analyticsComingSoon': 'Detailed analytics coming soon. Per-listing scan tracking, room popularity, and buyer engagement data.',
    'dashboard.agentBranding': 'Agent Branding',
    'dashboard.profilePreview': 'Profile Preview',
    'dashboard.yourName': 'Your Name',
    'dashboard.yourBrokerage': 'Your Brokerage',
    'dashboard.brandingNote': 'This is how your branding appears on listing pages.',
    'dashboard.designPartner': 'Design Partner',
    'dashboard.designPartnerDescription': 'Premium interior design partner displayed on your listing pages.',
    'dashboard.designPartnerPrompt': 'Buyers who scan QR codes and explore designs see a prompt to connect with your design partner for professional implementation.',
    'dashboard.updateProfile': 'Update Profile',
    'dashboard.editProfileGeneratePortrait': 'Edit Profile / Generate New Portrait',

    // Listing Management (ListingManage.tsx)
    'manage.loadingListing': 'Loading listing...',
    'manage.listingNotFound': 'Listing Not Found',
    'manage.listingNotLocated': 'This listing could not be located.',
    'manage.backToListing': 'Back to Listing',
    'manage.manageListing': 'Manage Listing',
    'manage.agentBranding': 'Agent Branding',
    'manage.heroImage': 'Hero Image',
    'manage.starDesignToSetHero': 'Star a design to set as hero image',
    'manage.rooms': 'Rooms',
    'manage.original': 'Original',
    'manage.designs': 'designs',
    'manage.approved': 'approved',
    'manage.collapse': 'Collapse',
    'manage.expand': 'Expand',
    'manage.regenerateAllDesigns': 'Regenerate all designs',
    'manage.removeRoom': 'Remove room',
    'manage.approve': 'Approve',
    'manage.approved': 'Approved',
    'manage.setAsHeroImage': 'Set as hero image',
    'manage.generateQRCodes': 'Generate QR Codes',
    'manage.generatingQRCodes': 'Generating QR Codes...',
    'manage.pushLive': 'Push Live',
    'manage.publishing': 'Publishing...',
    'manage.qrCodesReady': 'QR Codes Ready',
    'manage.fullListing': 'Full Listing',
    'manage.downloadSVG': 'Download SVG',
    'manage.printQRCodes': 'Print these QR codes for open house signage. Each room code links directly to its design gallery.',

    // Portrait Crop (PortraitCrop.tsx)
    'portrait.positionYourPortrait': 'Position Your Portrait',
    'portrait.dragToReposition': 'Drag to reposition.',
    'portrait.pinchToZoom': 'Pinch to zoom.',
    'portrait.scrollToZoom': 'Scroll to zoom.',
    'portrait.confirm': 'Confirm',
    'portrait.back': 'Back',

    // Listing Page (ListingPage.tsx)
    'listingPage.loadingListing': 'Loading listing...',
    'listingPage.listingNotFound': 'Listing Not Found',
    'listingPage.propertyNotLocated': 'This property could not be located.',
    'listingPage.listingNotPublished': 'Listing Not Yet Published',
    'listingPage.listingBeingPrepared': 'This listing is still being prepared and is not yet available for public viewing.',
    'listingPage.goToManagementPage': 'Go to Management Page',
    'listingPage.poweredByZenSpace': 'Powered by ZenSpace',
    'listingPage.exploreDesignPossibilities': 'Explore Design Possibilities',
    'listingPage.designDirection': 'design direction',
    'listingPage.designDirections': 'design directions',
    'listingPage.seeItYourWay': 'See it your way',
    'listingPage.photographAnyRoom': 'Photograph any room from your own angle and generate personalized design directions',
    'listingPage.openZenSpaceCamera': 'Open ZenSpace Camera',
    'listingPage.doneDaydreaming': 'Done day-dreaming?',
    'listingPage.startReallyDesigning': 'Start really designing.',
    'listingPage.showLess': 'Show less',
    'listingPage.readMore': 'Read more',
    'listingPage.bed': 'bed',
    'listingPage.bath': 'bath',
    'listingPage.sqft': 'sqft',

    // Pricing Page (PricingPage.tsx)
    'pricing.zenspacePro': 'ZenSpace Pro',
    'pricing.transformEveryRoom': 'Transform every room in your home',
    'pricing.unlimitedDesignExploration': 'Unlimited design exploration, professional-grade tools, and the full power of AI-driven interior design',
    'pricing.monthly': 'Monthly',
    'pricing.annual': 'Annual',
    'pricing.perfectForSingleProject': 'Perfect for a single project',
    'pricing.forDesignEnthusiasts': 'For design enthusiasts',
    'pricing.perMonth': '/mo',
    'pricing.perYear': '/yr',
    'pricing.savePercent': 'Save 33%',
    'pricing.bestValue': 'Best Value',
    'pricing.getMonthly': 'Get Monthly',
    'pricing.getAnnual': 'Get Annual',
    'pricing.freeTierIncludes': 'Free tier includes',
    'pricing.lifetimeGenerations': '3 lifetime design generations',
    'pricing.savedRoom': '1 saved room',
    'pricing.noDesignStudioAccess': 'No Design Studio access',
    'pricing.noPDFExport': 'No PDF export',
    'pricing.whatProUsersSaying': 'What Pro users are saying',
    'pricing.beforeAfterTransformations': 'Before and after — real transformations',
    'pricing.before': 'Before',
    'pricing.after': 'After',
    'pricing.frequentlyAskedQuestions': 'Frequently asked questions',
    'pricing.continueFreeTier': 'Continue with free tier -- 3 designs included',
    'pricing.cancelAnytime': 'Cancel anytime. Pro includes 50 generations/mo, 100 iterations/mo, 10 saved rooms. Free tier: 3 lifetime generations, 1 room.',
    'pricing.designGenerationsPerMonth': '50 design generations per month',
    'pricing.designIterationsPerMonth': '100 design iterations per month',
    'pricing.designStudioAccess': 'Design Studio — refine any concept',
    'pricing.saveUpToRooms': 'Save up to 10 rooms',
    'pricing.pdfExportHighRes': 'PDF export and high-res downloads',
    'pricing.productRecommendations': 'Product recommendations with shopping lists',
    'pricing.getProPerMonth': 'Get Pro — $6.67/mo',

    // Discover Page (DiscoverPage.tsx)
    'discover.title': 'Discover',
    'discover.subtitle': 'Curated interior design inspiration',
    'discover.allStyles': 'All Styles',
    'discover.savedToMoodBoard': 'Saved to mood board',
    'discover.removeFromMoodBoard': 'Remove from mood board',
    'discover.saveToMoodBoard': 'Save to mood board',
    'discover.proRequired': 'Pro',
    'discover.designPrinciples': 'Design Principles',
    'discover.foundationalConcepts': 'Foundational concepts that professionals use to create cohesive, intentional spaces.',

    // Agency Interface (AgencyInterface.tsx)
    'agency.forRealEstateBrokerages': 'For Real Estate Brokerages',
    'agency.everyListingBecomesExperience': 'Every listing becomes an experience',
    'agency.transformOpenHouses': 'ZenSpace transforms open houses from walk-throughs into design explorations. Buyers engage longer, imagine deeper, and remember your listings.',
    'agency.seeHowItWorks': 'See How It Works',
    'agency.viewEngagementData': 'View Engagement Data',
    'agency.whatChanges': 'What Changes',
    'agency.longerVisits': 'Longer visits',
    'agency.longerVisitsDescription': 'Buyers scanning room-by-room QR codes spend measurably more time at open houses. They explore design possibilities instead of glancing and leaving.',
    'agency.deeperEngagement': 'Deeper engagement',
    'agency.deeperEngagementDescription': 'Every design direction is a conversation starter. Buyers see what the space could become, not just what it is. They come back to the listing page after the visit.',
    'agency.yourBrandElevated': 'Your brand, elevated',
    'agency.yourBrandDescription': 'Every listing page links to your brokerage. Every design spread credits your agent. Premium QR cards on every light switch carry your identity. This is your tool.',
    'agency.forYourAgents': 'For Your Agents',
    'agency.threeStepsUnderFiveMinutes': 'Three steps. Under five minutes.',
    'agency.agentsNoSkillsNeeded': 'Your agents do not need design skills, technical knowledge, or training. The tool does the work.',
    'agency.step1': '1',
    'agency.pasteListingURL': 'Paste the listing URL',
    'agency.pasteListingURLDescription': 'Agent pastes their listing URL from any brokerage site. ZenSpace scrapes the photos, identifies rooms, and generates AI design directions automatically.',
    'agency.step2': '2',
    'agency.reviewAndPublish': 'Review and publish',
    'agency.reviewAndPublishDescription': 'Agent reviews the generated designs, curates the best ones, and publishes the listing with one click. The public listing page is live instantly.',
    'agency.step3': '3',
    'agency.orderQRCards': 'Order QR cards',
    'agency.orderQRCardsDescription': 'One card for the front door, one for each room. Premium 32pt square cards shipped directly. Place them by light switches at the open house.',
    'agency.physicalProduct': 'Physical Product',
    'agency.cardsThatFeelLikeListing': 'Cards that feel like the listing',
    'agency.cardsDescription': '32-point Luxe stock. 600gsm. Four layers of Mohawk Superfine paper. A colored seam that catches the eye. Each card carries a unique QR code linking to a specific room\'s design directions.',
    'agency.cardsFullDescription': 'One set per listing: a house card for the front door and individual room cards for each light switch. Buyers scan while standing in the room and see three design possibilities for the exact space they are looking at.',
    'agency.measuredImpact': 'Measured Impact',
    'agency.numberseBehindExperience': 'The numbers behind the experience',
    'agency.privacyRespecting': 'Anonymous, privacy-respecting engagement data from live deployments. No personal information is ever collected.',
    'agency.avgTimeAtOpenHouse': 'Avg. time at open house',
    'agency.qrScansPerListing': 'QR scans per listing',
    'agency.goDeeperRate': 'Go Deeper rate',
    'agency.returnVisits': 'Return visits',
    'agency.dataCollecting': 'Data collecting',
    'agency.metricsDescription': 'These metrics are populated from live ZenSpace deployments. As listings go live and open house visitors engage, the data builds. Every scan, every design explored, every minute spent is captured anonymously and aggregated here.',
    'agency.metricsProof': 'Your brokerage gets the engagement. We track how well it works. Together, we prove that design-forward open houses perform better.',
    'agency.integration': 'Integration',
    'agency.everythingLinksBackToYou': 'Everything links back to you',
    'agency.listingPagesFeatureAgent': 'Listing pages feature your agent',
    'agency.listingPagesDescription': 'Every ZenSpace listing page shows your agent\'s portrait, name, and brokerage prominently. The buyer sees your brand throughout the entire design exploration.',
    'agency.linksToBrokerageListing': 'Links to your brokerage listing',
    'agency.linksToBrokerageDescription': 'The original listing URL is always linked. Buyers go from design inspiration straight to your brokerage page with pricing, scheduling, and contact information.',
    'agency.qrCardsCarryIdentity': 'QR cards carry your identity',
    'agency.qrCardsIdentityDescription': 'Premium cards printed with your agency logo and agent name. The physical product is an extension of your brand, not a third-party intrusion.',
    'agency.designPartnerEndorsement': 'Design partner endorsement',
    'agency.designPartnerEndorsementDescription': 'An award-winning local design firm is featured alongside your listings. This elevates the perception of your brokerage as design-aware and forward-thinking.',
    'agency.readyToSeeInMarket': 'Ready to see it in your market?',
    'agency.deployPerMarket': 'We deploy ZenSpace per market with a dedicated design partner. Limited availability — one brokerage per territory.',
    'agency.startConversation': 'Start a Conversation',
    'agency.aiDesignVisualization': 'ZenSpace — AI-assisted design visualization for real estate',

    // 404 Page (NotFound.tsx)
    'notFound.404': '404',
    'notFound.pageNotFound': 'Page Not Found',
    'notFound.pageDoesNotExist': 'The page you\'re looking for doesn\'t exist or has been moved.',
    'notFound.goBack': 'Go Back',
    'notFound.home': 'Home',

    // Upgrade Prompt (UpgradePrompt.tsx)
    'upgrade.unlockFullExperience': 'Unlock the full experience',
    'upgrade.proIncludes': 'Pro includes',
    'upgrade.designsPerMonth': '50 designs / month',
    'upgrade.iterationsPerMonth': '100 iterations / month',
    'upgrade.designStudioAccess': 'Design Studio access',
    'upgrade.savedRooms': '10 saved rooms',
    'upgrade.pdfExportHighRes': 'PDF export and high-res downloads',
    'upgrade.viewPlans': 'View Plans',
    'upgrade.alreadyHaveAccount': 'Already have an account? Sign in',
    'upgrade.maybeLater': 'Maybe later',
    'upgrade.perMonth': '/ month',
    'upgrade.perYear': '/ year (save 33%)',

    // Auth Gate (AuthGate.tsx)
    'auth.signInToSaveDesigns': 'Sign in to save your designs',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.continueWithApple': 'Continue with Apple',
    'auth.signInWithEmailPassword': 'Sign in with email & password',
    'auth.or': 'or',
    'auth.sendMagicLink': 'Send magic link',
    'auth.sending': 'Sending...',
    'auth.checkYourEmail': 'Check your email',
    'auth.sentMagicLinkTo': 'We sent a magic link to',
    'auth.continueFree': 'Continue free',
    'auth.signingIn': 'Signing in...',
    'auth.signIn': 'Sign in',
    'auth.enterValidEmail': 'Please enter a valid email',
    'auth.failedToSendMagicLink': 'Failed to send magic link',
    'auth.loginFailed': 'Login failed',
    'auth.password': 'Password',
    'auth.yourEmail': 'your@email.com',
    'auth.back': 'Back',
```

Then replicate ALL these keys in French, German, Spanish, Chinese, and Portuguese sections with proper translations.

## Implementation Steps Remaining

1. Complete ListingManage.tsx string replacements (useI18n already imported)
2. Add useI18n import + translate all strings in remaining 8 components
3. Add all translation keys above to translations.ts for all 6 locales
4. Test that all pages render without errors
5. Verify no hardcoded English strings remain

## Key Translation Notes
- 'bed'/'bath'/'sqft' should become 'ch'/'sdb'/'m²' in French/metric locales
- Brand names (ZenSpace, MODTAGE) stay in English
- Keep numeric formats locale-appropriate
- Maintain professional real estate/design industry tone
