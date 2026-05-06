import { useMemo } from "react";

interface SunriseAmbienceProps {
  /** Render as fixed full-viewport layer (default). When false, fills nearest relative parent. */
  fixed?: boolean;
  /** Density of twinkling sparkles (default 14). */
  sparkleCount?: number;
  /** zIndex for the layer. Defaults to 0 (sits behind content with z-10). */
  zIndex?: number;
}

/**
 * Reusable sunrise ambience background:
 *  - Radial sunrise/twilight sky (theme-aware)
 *  - Slowly rotating aurora sweep
 *  - Floating sunrise blur orbs
 *  - Twinkling sparkles
 *
 * Mount once near the top of any screen. Make sure the page's primary
 * content sits in a `relative z-10` (or higher) wrapper so it stays above.
 */
export const SunriseAmbience = ({
  fixed = true,
  sparkleCount = 14,
  zIndex = 0,
}: SunriseAmbienceProps) => {
  const sparkles = useMemo(
    () =>
      Array.from({ length: sparkleCount }).map((_, i) => ({
        id: i,
        top: Math.random() * 92 + 2,
        left: Math.random() * 95 + 2,
        size: Math.random() * 6 + 4,
        delay: Math.random() * 3,
        dur: 2.4 + Math.random() * 2.6,
      })),
    [sparkleCount]
  );

  const positionClass = fixed ? "fixed inset-0" : "absolute inset-0";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${positionClass} overflow-hidden`}
      style={{ zIndex }}
    >
      {/* Radial sunrise sky */}
      <div className="sunrise-sky absolute inset-0" />

      {/* Aurora sweep */}
      <div
        className="sunrise-aurora absolute inset-0 opacity-60 mix-blend-screen"
        style={{ animation: "sa-aurora-spin 28s linear infinite" }}
      />

      {/* Ambient sunrise orbs */}
      <div
        className="sunrise-orb-one absolute -top-24 -left-24 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-50"
        style={{ animation: "sa-float 8s ease-in-out infinite" }}
      />
      <div
        className="sunrise-orb-two absolute -bottom-28 -right-20 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-40"
        style={{ animation: "sa-float 10s ease-in-out infinite reverse" }}
      />
      <div
        className="sunrise-orb-three absolute top-1/3 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-30"
        style={{ animation: "sa-float 12s ease-in-out infinite" }}
      />

      {/* Twinkling sparkles */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sunrise-sparkle absolute rounded-full"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animation: `sa-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes sa-aurora-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes sa-float {
          0%, 100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,-16px) scale(1.06); }
        }
        @keyframes sa-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50%      { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};
