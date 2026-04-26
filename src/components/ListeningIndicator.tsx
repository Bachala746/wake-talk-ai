import { Mic } from "lucide-react";

interface ListeningIndicatorProps {
  active: boolean;
  isDark?: boolean;
  label?: string;
  /** Live mic volume 0..1. When provided, sound bars react to real audio. */
  volumeLevel?: number;
}

const BAR_COUNT = 5;
// Per-bar weights — middle bars react more strongly than outer ones,
// so the visualizer feels organic instead of flat.
const BAR_WEIGHTS = [0.55, 0.8, 1.0, 0.8, 0.55];
const MIN_BAR = 4;   // px — idle height
const MAX_BAR = 26;  // px — peak height

/**
 * Big "I am listening" indicator:
 *  - Pulsing mic icon with two expanding halo rings (intensifies with volume)
 *  - Five sound bars whose heights track the live mic volume in real time
 */
export const ListeningIndicator = ({
  active,
  isDark = false,
  label = "Listening… speak now",
  volumeLevel = 0,
}: ListeningIndicatorProps) => {
  if (!active) return null;

  // Clamp + apply small floor so bars always show subtle motion even on silence
  const v = Math.max(0, Math.min(1, volumeLevel));
  const reactive = volumeLevel !== undefined; // caller wired live audio?

  const ringColor = isDark ? "bg-blue-400/30" : "bg-blue-500/30";
  const coreColor = isDark
    ? "bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)]"
    : "bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]";
  const barColor = isDark ? "bg-blue-400" : "bg-blue-500";
  const labelColor = isDark ? "text-blue-300" : "text-blue-600";

  // Halo intensity scales with volume so the mic visibly "lights up" when speaking
  const haloScale = 1 + v * 0.25;
  const haloOpacity = 0.4 + v * 0.6;

  return (
    <div className="flex flex-col items-center gap-3 py-2 animate-fade-in">
      {/* Mic with halo rings */}
      <div className="relative flex items-center justify-center w-20 h-20">
        <span
          className={`absolute inset-0 rounded-full ${ringColor} animate-ping`}
          style={{
            animationDuration: "1.6s",
            transform: `scale(${haloScale})`,
            opacity: haloOpacity,
          }}
        />
        <span
          className={`absolute inset-2 rounded-full ${ringColor} animate-ping`}
          style={{
            animationDuration: "1.6s",
            animationDelay: "0.4s",
            transform: `scale(${haloScale})`,
            opacity: haloOpacity,
          }}
        />
        <div
          className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full ${coreColor} transition-transform duration-100`}
          style={{ transform: `scale(${1 + v * 0.12})` }}
        >
          <Mic className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Volume-reactive sound bars */}
      <div className="flex items-end gap-1 h-7" aria-hidden="true">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          if (reactive) {
            // Real-time height = floor + (volume * weight * range)
            const h = MIN_BAR + v * BAR_WEIGHTS[i] * (MAX_BAR - MIN_BAR);
            return (
              <span
                key={i}
                className={`w-1.5 rounded-full ${barColor} transition-[height,opacity] duration-75 ease-out`}
                style={{
                  height: `${h}px`,
                  opacity: 0.6 + v * 0.4,
                }}
              />
            );
          }
          // Fallback: synthetic pulse if no volume prop wired
          return (
            <span
              key={i}
              className={`w-1.5 rounded-full ${barColor}`}
              style={{
                animation: "listening-bar 0.9s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
                transformOrigin: "bottom",
              }}
            />
          );
        })}
      </div>

      <p className={`text-xs font-semibold ${labelColor}`}>{label}</p>

      <style>{`
        @keyframes listening-bar {
          0%, 100% { height: 6px; opacity: 0.55; }
          50%      { height: 22px; opacity: 1; }
        }
      `}</style>
    </div>
  );
};
