import { useEffect, useRef } from 'react';
import type { LookbookEntry } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface ShareableCardProps {
  entry: LookbookEntry;
  onReady?: (element: HTMLDivElement) => void;
}

export function ShareableCard({ entry, onReady }: ShareableCardProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const { option } = entry;

  useEffect(() => {
    if (ref.current && onReady) {
      onReady(ref.current);
    }
  }, [onReady]);

  const gradientBg = option.palette.length >= 2
    ? `linear-gradient(135deg, ${option.palette[0]}, ${option.palette[1]}, ${option.palette[option.palette.length - 1]})`
    : '#292524';

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        minHeight: 1080,
        backgroundColor: '#1c1917',
        color: '#ffffff',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Visualization Image */}
      <div
        style={{
          width: 1080,
          height: 720,
          overflow: 'hidden',
          position: 'relative',
          background: '#1c1917',
        }}
      >
        {option.visualizationImage ? (
          <img
            src={`data:image/png;base64,${option.visualizationImage}`}
            alt={option.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: gradientBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              opacity: 0.6,
              letterSpacing: 8,
            }}
          >
            ROOM
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '48px 56px', flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Name */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: 1,
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {option.name}
        </div>

        {/* Mood */}
        <div
          style={{
            fontSize: 22,
            fontStyle: 'italic',
            color: '#d6d3d1',
            lineHeight: 1.6,
          }}
        >
          &ldquo;{option.mood}&rdquo;
        </div>

        {/* Palette */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {option.palette.map((color, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '3px solid rgba(255,255,255,0.15)',
                }}
              />
              <span style={{ fontSize: 13, color: '#a8a29e', fontFamily: 'monospace' }}>
                {color}
              </span>
            </div>
          ))}
        </div>

        {/* Frameworks */}
        {option.frameworks.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            {option.frameworks.map((fw, i) => (
              <span
                key={i}
                style={{
                  padding: '6px 18px',
                  borderRadius: 999,
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#6ee7b7',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {fw}
              </span>
            ))}
          </div>
        )}

        {/* Key Changes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {option.keyChanges.map((change, i) => (
            <div
              key={i}
              style={{
                fontSize: 18,
                color: '#e7e5e4',
                fontFamily: 'system-ui, sans-serif',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: '#10b981', flexShrink: 0 }}>•</span>
              {change}
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 2,
              color: '#a8a29e',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            room.institute
          </span>
          <span style={{ fontSize: 16, color: '#44403c' }}>{t('share.createdWith').replace('Created with Room — ', '')}</span>
        </div>
      </div>
    </div>
  );
}

export default ShareableCard;
