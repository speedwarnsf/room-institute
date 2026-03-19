/**
 * TreatmentPreview — Visual demo of all 5 layout treatments.
 *
 * Shows each treatment applied to sample design data so you can
 * compare typography, color, and layout side by side.
 */

import { TREATMENTS, detectTreatment, type LayoutTreatment } from '../services/layoutTreatments';
import type { DesignOption } from '../types';

// ─── Sample data for each treatment ────────────────────────────

const SAMPLE_OPTIONS: DesignOption[] = [
  {
    name: 'Brass & Shadow',
    mood: 'Dark, moody, dramatic interplay of aged metallics and deep shadow.',
    frameworks: ['Phenomenological', 'Aesthetic Order'],
    palette: ['#1a1a1a', '#2d2a26', '#8b7355', '#d4af37', '#0d0d0d'],
    keyChanges: ['Black steel shelving', 'Brass accent lighting', 'Charcoal linen drapes'],
    fullPlan: 'A deep, atmospheric room anchored by dark surfaces and punctuated with warm brass fixtures.',
    visualizationPrompt: '',
  },
  {
    name: 'Raw Linen',
    mood: 'Bright, airy, and effortlessly clean — sunlight on white cotton.',
    frameworks: ['Human-Centric', 'Universal Design'],
    palette: ['#fafaf8', '#e8e4dc', '#c9bfae', '#a89f91', '#f0ece4'],
    keyChanges: ['Sheer curtains', 'White oak floors', 'Linen upholstery'],
    fullPlan: 'Light-filled space with natural textiles and a serene, uncomplicated palette.',
    visualizationPrompt: '',
  },
  {
    name: 'Terracotta Grove',
    mood: 'Warm, earthy, and organic — clay pots and trailing vines.',
    frameworks: ['Biophilic', 'Human-Centric'],
    palette: ['#c2703e', '#8b5e3c', '#d4a574', '#5a7247', '#f2e6d9'],
    keyChanges: ['Terracotta planters', 'Woven jute rug', 'Live-edge shelf'],
    fullPlan: 'An indoor garden feel with earthy tones and abundant natural materials.',
    visualizationPrompt: '',
  },
  {
    name: 'Pop Bazaar',
    mood: 'Eclectic, playful, and vibrant — a maximalist collision of pattern and color.',
    frameworks: ['Phenomenological', 'Human-Centric'],
    palette: ['#e76f51', '#264653', '#e9c46a', '#2a9d8f', '#f4a261'],
    keyChanges: ['Patterned accent wall', 'Mixed vintage seating', 'Neon sign'],
    fullPlan: 'A joyful mashup of global influences, bold color, and layered textures.',
    visualizationPrompt: '',
  },
  {
    name: 'Still Line',
    mood: 'Minimal, refined, and quietly precise — every object considered.',
    frameworks: ['Aesthetic Order', 'Universal Design'],
    palette: ['#ffffff', '#e5e5e5', '#b0b0b0', '#666666', '#1a1a1a'],
    keyChanges: ['Floating shelves', 'Recessed lighting', 'Monochrome art'],
    fullPlan: 'A study in restraint: clean lines, neutral tones, and maximum breathing room.',
    visualizationPrompt: '',
  },
];

const BODY_SAMPLE =
  'The room unfolds with deliberate intention. Each surface, each shadow, each sliver of light has been considered — not arranged, but allowed to settle into its natural order. This is a space that doesn\'t demand attention; it earns it through quiet conviction.';

// ─── Sub-components ────────────────────────────────────────────

function TreatmentCard({ treatment, sample }: { treatment: LayoutTreatment; sample: DesignOption }) {
  const dropCapLetter = BODY_SAMPLE[0];
  const bodyRest = BODY_SAMPLE.slice(1);

  return (
    <div
      style={{
        background: treatment.bgColor,
        color: treatment.textColor,
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hero zone */}
      <div
        style={{
          height: '180px',
          background: `linear-gradient(135deg, ${sample.palette[0]} 0%, ${sample.palette[3] || sample.palette[1]} 100%)`,
          display: 'flex',
          alignItems: treatment.headerStyle === 'overlay' ? 'flex-end' : 'center',
          justifyContent: treatment.headerStyle === 'split' ? 'flex-start' : 'center',
          padding: '1.5rem',
          position: 'relative',
        }}
      >
        {treatment.headerStyle === 'overlay' && (
          <h2
            style={{
              fontFamily: treatment.titleFont,
              fontWeight: treatment.titleWeight,
              textTransform: treatment.titleCase,
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: '#fff',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {sample.name}
          </h2>
        )}
      </div>

      {/* Content zone */}
      <div style={{ padding: '1.5rem 2rem', flex: 1 }}>
        {/* Category label */}
        <div
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: treatment.accentColor,
            marginBottom: '0.5rem',
          }}
        >
          {treatment.name}
        </div>

        {treatment.headerStyle !== 'overlay' && (
          <h2
            style={{
              fontFamily: treatment.titleFont,
              fontWeight: treatment.titleWeight,
              textTransform: treatment.titleCase,
              fontSize: 'clamp(1.2rem, 3vw, 2rem)',
              margin: '0 0 0.5rem',
              lineHeight: 1.15,
            }}
          >
            {sample.name}
          </h2>
        )}

        {/* Mood line */}
        <p
          style={{
            fontStyle: 'italic',
            opacity: 0.7,
            fontSize: '0.85rem',
            margin: '0 0 1rem',
            lineHeight: 1.5,
          }}
        >
          {sample.mood}
        </p>

        {/* Rule */}
        <hr
          style={{
            border: 'none',
            borderTop: `1px solid ${treatment.accentColor}`,
            opacity: 0.3,
            margin: '0.75rem 0',
          }}
        />

        {/* Body text */}
        <div
          style={{
            fontFamily: treatment.bodyFont,
            fontSize: '0.8rem',
            lineHeight: 1.85,
            columnCount: treatment.useTwoColumn ? 2 : 1,
            columnGap: '1.5rem',
          }}
        >
          {treatment.useDropCap ? (
            <>
              <span
                style={{
                  float: 'left',
                  fontSize: '3.2em',
                  lineHeight: 0.8,
                  fontFamily: treatment.titleFont,
                  fontWeight: treatment.titleWeight,
                  color: treatment.accentColor,
                  marginRight: '0.08em',
                  marginTop: '0.05em',
                }}
              >
                {dropCapLetter}
              </span>
              {bodyRest}
            </>
          ) : (
            BODY_SAMPLE
          )}
        </div>

        {/* Palette strip */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '1rem' }}>
          {sample.palette.map((c, i) => (
            <div
              key={i}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: c,
                border: `1px solid ${treatment.textColor}22`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Preview ──────────────────────────────────────────────

export function TreatmentPreview() {
  return (
    <div style={{ padding: '2rem', background: '#111', minHeight: '100vh' }}>
      <h1
        style={{
          color: '#f5f5f5',
          fontFamily: 'Georgia, serif',
          fontWeight: 400,
          fontSize: '2rem',
          marginBottom: '0.5rem',
        }}
      >
        Layout Treatments
      </h1>
      <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Each design option is automatically matched to a treatment based on palette, mood, and frameworks.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {SAMPLE_OPTIONS.map((sample, i) => {
          const treatment = detectTreatment(sample);
          return <TreatmentCard key={treatment.id} treatment={treatment} sample={sample} />;
        })}
      </div>
    </div>
  );
}

export default TreatmentPreview;
