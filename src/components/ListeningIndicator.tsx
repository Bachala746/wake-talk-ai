import { Mic } from "lucide-react";

interface ListeningIndicatorProps {
  active: boolean;
  isDark?: boolean;
  label?: string;
}

/**
 * Big, instantly-visible "I am listening" indicator:
 *  - Pulsing mic icon with two expanding halo rings
 *  - Five animated sound bars below
 * Renders the moment `active` flips to true so the user has zero
 * ambiguity about when to start speaking.
 */
export const ListeningIndicator = ({
  active,
  isDark = false,
  label = "Listening… speak now",
}: ListeningIndicatorProps) => {
  if (!active) return null;

  const ringColor = isDark ? "bg-blue-400/30" : "bg-blue-500/30";
  const coreColor = isDark
    ? "bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)]"
    : "bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]";
  const barColor = isDark ? "bg-blue-400" : "bg-blue-500";
  const labelColor = isDark ? "text-blue-300" : "text-blue-600";

  return (
    <div className="flex flex-col items-center gap-3 py-2 animate-fade-in">
      {/* Mic with halo rings */}
      <div className="relative flex items-center justify-center w-20 h-20">
        {/* Outer ring */}
        <span
          className={`absolute inset-0 rounded-full ${ringColor} animate-ping`}
          style={{ animationDuration: "1.6s" }}
        />
        {/* Inner ring (offset for layered effect) */}
        <span
          className={`absolute inset-2 rounded-full ${ringColor} animate-ping`}
          style={{ animationDuration: "1.6s", animationDelay: "0.4s" }}
        />
        {/* Solid core with mic */}
        <div
          className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full ${coreColor} animate-pulse`}
        >
          <Mic className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Animated sound bars */}
      <div className="flex items-end gap-1 h-6" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full ${barColor}`}
            style={{
              animation: "listening-bar 0.9s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
              transformOrigin: "bottom",
            }}
          />
        ))}
      </div>

      <p className={`text-xs font-semibold ${labelColor}`}>{label}</p>

      {/* Keyframes scoped to this component */}
      <style>{`
        @keyframes listening-bar {
          0%, 100% { height: 6px; opacity: 0.55; }
          50%      { height: 22px; opacity: 1; }
        }
      `}</style>
    </div>
  );
};
