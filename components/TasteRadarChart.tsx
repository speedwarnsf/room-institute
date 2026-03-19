/**
 * TasteRadarChart — SVG radar chart showing aesthetic preferences.
 * Pure SVG, no dependencies. Animated with Framer Motion.
 * Accessible: keyboard navigable, screen reader descriptions, ARIA labels.
 */

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TasteProfile, TasteDimension } from '../services/tasteProfile';
import { DIMENSION_LABELS, getTasteSummary } from '../services/tasteProfile';
import { useI18n } from '../i18n/I18nContext';

interface TasteRadarChartProps {
  profile: TasteProfile;
  size?: number;
  className?: string;
}

const DIMENSIONS: TasteDimension[] = ['warmth', 'boldness', 'nature', 'texture', 'minimalism', 'symmetry'];

// Softer emerald gradient colors
const FILL_COLOR = 'rgba(16, 185, 129, 0.12)';
const FILL_COLOR_HOVER = 'rgba(16, 185, 129, 0.22)';
const STROKE_COLOR = 'rgb(16, 185, 129)';
const POINT_COLOR = 'rgb(16, 185, 129)';
const POINT_ACTIVE_COLOR = 'rgb(52, 211, 153)';

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function formatDimensionValue(val: number): string {
  if (val > 0.3) return 'strong';
  if (val > 0.1) return 'moderate';
  if (val > -0.1) return 'neutral';
  if (val > -0.3) return 'moderate';
  return 'strong';
}

export function TasteRadarChart({ profile, size = 280, className = '' }: TasteRadarChartProps) {
  const { t } = useI18n();
  const [hoveredDim, setHoveredDim] = useState<TasteDimension | null>(null);
  const [focusedDim, setFocusedDim] = useState<TasteDimension | null>(null);
  const activeDim = hoveredDim || focusedDim;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const labelR = size * 0.46;
  const angleStep = 360 / DIMENSIONS.length;

  // Build polygon path from profile dimensions (map -1..1 to 0..maxR)
  const points = useMemo(() => {
    return DIMENSIONS.map((dim, i) => {
      const val = (profile.dimensions[dim] + 1) / 2; // 0..1
      const r = Math.max(0.08, val) * maxR;
      const angle = i * angleStep;
      return { ...polarToXY(cx, cy, r, angle), dim, val: profile.dimensions[dim] };
    });
  }, [profile, cx, cy, maxR, angleStep]);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const summary = useMemo(() => getTasteSummary(profile), [profile]);

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Build screen reader description
  const srDescription = useMemo(() => {
    const parts = DIMENSIONS.map(dim => {
      const val = profile.dimensions[dim];
      const { low, high, label } = DIMENSION_LABELS[dim];
      const direction = val > 0.1 ? high : val < -0.1 ? low : `neutral ${label}`;
      const strength = formatDimensionValue(val);
      return `${label}: ${strength} ${direction}`;
    });
    return `Taste profile radar chart with ${profile.totalRatings} ratings. ${parts.join('. ')}.`;
  }, [profile]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, dim: TasteDimension) => {
    const currentIdx = DIMENSIONS.indexOf(dim);
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (currentIdx + 1) % DIMENSIONS.length;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (currentIdx - 1 + DIMENSIONS.length) % DIMENSIONS.length;
      e.preventDefault();
    }
    if (nextIdx !== null) {
      setFocusedDim(DIMENSIONS[nextIdx]!);
      // Focus the next element
      const el = document.getElementById(`taste-dim-${DIMENSIONS[nextIdx]}`);
      el?.focus();
    }
  }, []);

  return (
    <div className={`space-y-4 ${className}`} role="region" aria-label={t('taste.profile')}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          Your Taste Profile
        </h3>
        <span className="text-[10px] text-stone-400 dark:text-stone-500" aria-live="polite">
          {profile.totalRatings} rating{profile.totalRatings !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          role="img"
          aria-label={srDescription}
        >
          <title>Taste Profile Radar Chart</title>
          <desc>{srDescription}</desc>

          {/* Grid rings */}
          {rings.map((r) => (
            <polygon
              key={r}
              points={DIMENSIONS.map((_, i) => {
                const pt = polarToXY(cx, cy, r * maxR, i * angleStep);
                return `${pt.x},${pt.y}`;
              }).join(' ')}
              fill="none"
              stroke="currentColor"
              className="text-stone-200 dark:text-stone-700"
              strokeWidth={r === 0.5 ? 1 : 0.5}
              opacity={r === 0.5 ? 0.6 : 0.3}
            />
          ))}

          {/* Axis lines */}
          {DIMENSIONS.map((dim, i) => {
            const pt = polarToXY(cx, cy, maxR, i * angleStep);
            const isActive = activeDim === dim;
            return (
              <line
                key={i}
                x1={cx} y1={cy} x2={pt.x} y2={pt.y}
                stroke="currentColor"
                className={isActive ? 'text-stone-400 dark:text-stone-500' : 'text-stone-200 dark:text-stone-700'}
                strokeWidth={isActive ? 1 : 0.5}
                opacity={isActive ? 0.8 : 0.4}
                style={{ transition: 'all 0.2s ease' }}
              />
            );
          })}

          {/* Data polygon */}
          <motion.path
            d={pathD}
            fill={activeDim ? FILL_COLOR_HOVER : FILL_COLOR}
            stroke={STROKE_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ transformOrigin: `${cx}px ${cy}px`, transition: 'fill 0.2s ease' }}
          />

          {/* Data points with hover targets */}
          {points.map((pt, i) => {
            const dim = DIMENSIONS[i]!;
            const isActive = activeDim === dim;
            const { low, high, label } = DIMENSION_LABELS[dim];
            const val = profile.dimensions[dim];
            const displayLabel = val > 0.15 ? high : val < -0.15 ? low : label;

            return (
              <g key={dim}>
                {/* Invisible larger hit target for hover/focus */}
                <circle
                  id={`taste-dim-${dim}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`${label}: ${formatDimensionValue(val)} toward ${displayLabel} (${Math.round((val + 1) * 50)}%)`}
                  onMouseEnter={() => setHoveredDim(dim)}
                  onMouseLeave={() => setHoveredDim(null)}
                  onFocus={() => setFocusedDim(dim)}
                  onBlur={() => setFocusedDim(null)}
                  onKeyDown={(e) => handleKeyDown(e, dim)}
                />
                {/* Visible point */}
                <motion.circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 5 : 3.5}
                  fill={isActive ? POINT_ACTIVE_COLOR : POINT_COLOR}
                  stroke="white"
                  strokeWidth={isActive ? 2 : 1.5}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                  style={{ transition: 'r 0.15s ease, fill 0.15s ease' }}
                  pointerEvents="none"
                />
              </g>
            );
          })}

          {/* Labels */}
          {DIMENSIONS.map((dim, i) => {
            const pt = polarToXY(cx, cy, labelR, i * angleStep);
            const val = profile.dimensions[dim];
            const { low, high, label } = DIMENSION_LABELS[dim];
            const displayLabel = val > 0.15 ? high : val < -0.15 ? low : label;
            const isActive = activeDim === dim;

            return (
              <text
                key={dim}
                x={pt.x}
                y={pt.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={isActive ? 'fill-stone-700 dark:fill-stone-200' : 'fill-stone-500 dark:fill-stone-400'}
                fontSize={isActive ? 11 : 10}
                fontWeight={isActive ? 700 : Math.abs(val) > 0.3 ? 600 : 400}
                style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
              >
                {displayLabel}
              </text>
            );
          })}

          {/* Tooltip for active dimension */}
          {activeDim && (() => {
            const idx = DIMENSIONS.indexOf(activeDim);
            const pt = points[idx]!;
            const val = profile.dimensions[activeDim];
            const pct = Math.round((val + 1) * 50);
            const { label } = DIMENSION_LABELS[activeDim];

            // Position tooltip above the point
            const tooltipY = pt.y - 28;
            const tooltipX = pt.x;

            return (
              <g>
                <rect
                  x={tooltipX - 36}
                  y={tooltipY - 12}
                  width={72}
                  height={24}
                  rx={6}
                  fill="rgb(38, 38, 38)"
                  opacity={0.9}
                />
                <text
                  x={tooltipX}
                  y={tooltipY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={10}
                  fontWeight={600}
                >
                  {label} {pct}%
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Text summary */}
      <AnimatePresence>
        {(summary.tendencies.length > 0 || summary.avoidances.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 text-xs text-stone-500 dark:text-stone-400"
            role="status"
            aria-live="polite"
          >
            {summary.tendencies.length > 0 && (
              <p>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">You lean toward:</span>{' '}
                {summary.tendencies.join(', ')}
              </p>
            )}
            {summary.avoidances.length > 0 && (
              <p>
                <span className="text-red-500 dark:text-red-400 font-medium">You tend to avoid:</span>{' '}
                {summary.avoidances.join(', ')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TasteRadarChart;
