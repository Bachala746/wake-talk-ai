import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";

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
  const { isDark } = useTheme();

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
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(ellipse_at_top,hsl(260,50%,18%)_0%,hsl(240,40%,10%)_55%,hsl(20,40%,12%)_100%)]"
            : "bg-[radial-gradient(ellipse_at_top,hsl(45,100%,90%)_0%,hsl(20,100%,82%)_45%,hsl(340,90%,86%)_100%)]"
        }`}
      />

      {/* Aurora sweep */}
      <div
        className={`absolute inset-0 opacity-60 mix-blend-screen ${
          isDark
            ? "bg-[conic-gradient(from_180deg_at_50%_120%,transparent,hsl(260,80%,40%)/0.4,transparent_40%,hsl(20,90%,50%)/0.4,transparent)]"
            : "bg-[conic-gradient(from_180deg_at_50%_120%,transparent,hsl(45,100%,75%)/0.5,transparent_40%,hsl(340,90%,80%)/0.5,transparent)]"
        }`}
        style={{ animation: "sa-aurora-spin 28s linear infinite" }}
      />

      {/* Ambient sunrise orbs */}
      <div
        className={`absolute -top-24 -left-24 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-50 ${
          isDark ? "bg-orange-500/30" : "bg-amber-300/60"
        }`}
        style={{ animation: "sa-float 8s ease-in-out infinite" }}
      />
      <div
        className={`absolute -bottom-28 -right-20 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-40 ${
          isDark ? "bg-pink-500/25" : "bg-rose-300/55"
        }`}
        style={{ animation: "sa-float 10s ease-in-out infinite reverse" }}
      />
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-30 ${
          isDark ? "bg-indigo-500/20" : "bg-yellow-200/60"
        }`}
        style={{ animation: "sa-float 12s ease-in-out infinite" }}
      />

      {/* Twinkling sparkles */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className={`absolute rounded-full ${isDark ? "bg-amber-200/80" : "bg-white"}`}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            boxShadow: isDark
              ? "0 0 12px hsl(45,100%,70%)"
              : "0 0 10px hsl(40,100%,75%)",
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
