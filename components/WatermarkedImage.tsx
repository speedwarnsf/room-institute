/**
 * WatermarkedImage — Renders an image with Room watermark overlay.
 * Uses CSS positioning (no Canvas, no Sharp, guaranteed to work everywhere).
 * 
 * Lower right: "room" logo text
 * Lower left: "room.institute — AI visualization" on dark bar
 */

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function WatermarkedImage({ src, alt, className = '' }: Props) {
  return (
    <div className="relative overflow-hidden">
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
      />
      {/* Lower right: Room logo */}
      <span
        className="absolute text-white/80 font-bold select-none pointer-events-none"
        style={{
          bottom: 24,
          right: 24,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '16px',
          letterSpacing: '1px',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        room
      </span>
      {/* Lower left: Disclaimer bar */}
      <span
        className="absolute select-none pointer-events-none"
        style={{
          bottom: 24,
          left: 24,
          background: 'rgba(0,0,0,0.75)',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '9px',
          letterSpacing: '0.5px',
          padding: '4px 8px',
          lineHeight: '1',
        }}
      >
        room.institute — AI visualization
      </span>
    </div>
  );
}
