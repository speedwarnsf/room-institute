import { Listing } from '../types';

export const SEED_LISTINGS: Listing[] = [{
  status: "ready",
  id: "1177-california-1210",
  address: "1177 California\u00A0Street, Unit\u00A01210",
  city: "San Francisco",
  state: "CA",
  zip: "94108",
  price: 1750000,
  beds: 2,
  baths: 2,
  sqft: 1660,
  description: "Perched high above Nob Hill in the iconic Gramercy Towers, this luxurious 2\u2011bedroom, 2\u2011bath sanctuary on the 12th floor offers sweeping views of Grace Cathedral, Huntington Park, and the Fairmont\u00A0Hotel.",
  heroImage: "/showcase/original.jpg",
  agent: {
    name: "John Macon",
    brokerage: "Compass",
  },
  rooms: [
    {
      id: "living-room",
      label: "Living Room",
      originalPhoto: "/showcase/original.jpg",
      thumbnail: "/showcase/original.jpg",
      designs: [
        {
          id: "d1",
          name: "Dramatic & Masculine",
          description: "Deep charcoal palette with bold contrast. The architectural bones of the space — coffered ceiling, marble floors, bar — anchored by dark, confident furnishings.",
          imageUrl: "/showcase/direction-charcoal.jpg",
          thumbnailUrl: "/showcase/direction-charcoal.jpg",
          frameworks: ["Aesthetic Order & Simplicity", "Genius Loci"],
        },
        {
          id: "d2",
          name: "Warm Contemporary",
          description: "Cream and natural wood tones soften the marble formality. Approachable, livable, immediately inviting — a space that says move in tomorrow.",
          imageUrl: "/showcase/direction-contemporary.jpg",
          thumbnailUrl: "/showcase/direction-contemporary.jpg",
          frameworks: ["Human-Centric & Functional", "Aesthetic Order"],
        },

        {
          id: "d4",
          name: "Bold Maximalist",
          description: "Full conviction. Hot pink against marble, geometric patterns, personality-driven design that turns a luxury condo into a statement.",
          imageUrl: "/showcase/direction-pink.jpg",
          thumbnailUrl: "/showcase/direction-pink.jpg",
          frameworks: ["Phenomenological", "Aesthetic Order"],
        },
        {
          id: "d5",
          name: "Navy Monochrome",
          description: "Committed tonal depth. Navy blue saturates walls, upholstery, and textiles against warm marble — a cohesive, enveloping atmosphere.",
          imageUrl: "/showcase/direction-navy.jpg",
          thumbnailUrl: "/showcase/direction-navy.jpg",
          frameworks: ["Genius Loci", "Biophilic"],
        },
      ],
    },
  ],
  createdAt: Date.now(),
}];
