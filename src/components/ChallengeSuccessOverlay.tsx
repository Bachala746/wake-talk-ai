import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { ChallengeCategoryId } from "@/lib/alarmSettings";

/* ---------------- Content pools per category ---------------- */

const MESSAGES: Record<ChallengeCategoryId, string[]> = {
  mind: [
    "Sharp mind. Sharper day ahead.",
    "Neurons firing, focus locked in.",
    "You out-thought the snooze button.",
    "Brain online — let's build something great.",
  ],
  body: [
    "Body activated. Blood pumping. Let's move.",
    "You earned this morning with your muscles 💪",
    "Strong start. Stronger day.",
    "Every rep is a vote for the person you're becoming.",
  ],
  reality: [
    "Out of bed. Into the day.",
    "You showed up in the real world — that's the whole battle.",
    "The world came into focus. So did you.",
    "One scan, one step, one strong morning.",
  ],
  interaction: [
    "Your voice is awake. So are you.",
    "You spoke it into existence — now go live it.",
    "Words out, energy up. Let's go.",
    "Clear voice, clear head, clear day.",
  ],
  focus: [
    "Discipline compounded — one more win.",
    "Focus first. Everything else follows.",
    "You chose control. That changes today.",
    "Calm mind, sharp aim.",
  ],
};

const HEADLINES: Record<ChallengeCategoryId, string[]> = {
  mind: ["Brilliant!", "Mind Awake!", "Nailed it!"],
  body: ["Powerful!", "Body Ready!", "Crushed it!"],
  reality: ["You did it!", "You're Up!", "Locked In!"],
  interaction: ["Loud & Clear!", "Awesome!", "You're On!"],
  focus: ["Steady!", "Focused!", "In the Zone!"],
};

/* ---------------- Visual variants ---------------- */

interface Variant {
  /** Chibi + accents */
  bodyStart: string;
  bodyEnd: string;
  cheek: string;
  heartFrom: string;
  heartTo: string;
  glowLight: string;
  glowDark: string;
  bgLight: string;
  bgDark: string;
  /** Burst items — the more items, the harder the level felt */
  primarySymbol: string;
  secondarySymbol: string;
  /** Text gradient */
  textGradient: string;
  /** Small accessory rendered near the companion (SVG string, viewBox 200x200 coords). */
  accessory: "spark" | "flex" | "check" | "wave" | "target";
}

const CATEGORY_VARIANT: Record<ChallengeCategoryId, Variant> = {
  mind: {
    bodyStart: "#e0e7ff", bodyEnd: "#a5b4fc",
    cheek: "#818cf8",
    heartFrom: "#818cf8", heartTo: "#a855f7",
    glowLight: "bg-indigo-300/40", glowDark: "bg-indigo-500/25",
    bgLight: "from-indigo-50/95 via-violet-50/95 to-sky-50/95",
    bgDark: "from-slate-900/95 via-indigo-950/95 to-slate-900/95",
    primarySymbol: "✦", secondarySymbol: "✨",
    textGradient: "linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#06b6d4 100%)",
    accessory: "spark",
  },
  body: {
    bodyStart: "#fed7aa", bodyEnd: "#fb923c",
    cheek: "#f97316",
    heartFrom: "#f97316", heartTo: "#ef4444",
    glowLight: "bg-orange-300/45", glowDark: "bg-orange-500/25",
    bgLight: "from-amber-50/95 via-orange-50/95 to-rose-50/95",
    bgDark: "from-slate-900/95 via-orange-950/95 to-slate-900/95",
    primarySymbol: "🔥", secondarySymbol: "⚡",
    textGradient: "linear-gradient(135deg,#f97316 0%,#ef4444 50%,#f59e0b 100%)",
    accessory: "flex",
  },
  reality: {
    bodyStart: "#d1fae5", bodyEnd: "#6ee7b7",
    cheek: "#10b981",
    heartFrom: "#10b981", heartTo: "#14b8a6",
    glowLight: "bg-emerald-300/45", glowDark: "bg-emerald-500/25",
    bgLight: "from-emerald-50/95 via-teal-50/95 to-sky-50/95",
    bgDark: "from-slate-900/95 via-emerald-950/95 to-slate-900/95",
    primarySymbol: "✓", secondarySymbol: "★",
    textGradient: "linear-gradient(135deg,#10b981 0%,#14b8a6 50%,#0ea5e9 100%)",
    accessory: "check",
  },
  interaction: {
    bodyStart: "#fce7f3", bodyEnd: "#f9a8d4",
    cheek: "#fb7185",
    heartFrom: "#f472b6", heartTo: "#a855f7",
    glowLight: "bg-rose-300/45", glowDark: "bg-fuchsia-500/25",
    bgLight: "from-rose-50/95 via-fuchsia-50/95 to-cyan-50/95",
    bgDark: "from-slate-900/95 via-fuchsia-950/95 to-slate-900/95",
    primarySymbol: "❤", secondarySymbol: "★",
    textGradient: "linear-gradient(135deg,#ec4899 0%,#a855f7 50%,#06b6d4 100%)",
    accessory: "wave",
  },
  focus: {
    bodyStart: "#fef3c7", bodyEnd: "#fcd34d",
    cheek: "#f59e0b",
    heartFrom: "#f59e0b", heartTo: "#eab308",
    glowLight: "bg-amber-300/45", glowDark: "bg-amber-500/25",
    bgLight: "from-amber-50/95 via-yellow-50/95 to-orange-50/95",
    bgDark: "from-slate-900/95 via-amber-950/95 to-slate-900/95",
    primarySymbol: "★", secondarySymbol: "✦",
    textGradient: "linear-gradient(135deg,#eab308 0%,#f59e0b 50%,#f97316 100%)",
    accessory: "target",
  },
};

/* Level tunes intensity: particle count, ring rings, duration, glow, headline size. */
function intensityFor(level: number) {
  const l = Math.max(1, Math.min(5, level));
  return {
    particles: [10, 14, 20, 26, 34][l - 1],
    rings: l >= 4 ? 2 : l >= 3 ? 1 : 0,
    durationMs: [4200, 4600, 5000, 5400, 5800][l - 1],
    headlineClass: l >= 4 ? "text-4xl" : "text-3xl",
    burstDist: 80 + l * 20,
    scale: 1 + (l - 1) * 0.04,
    confettiRain: l >= 5,
    badge: ["Level 1 · Warm-up", "Level 2 · Steady", "Level 3 · Solid", "Level 4 · Strong", "Level 5 · Legendary"][l - 1],
  };
}

/* ---------------- Component ---------------- */

interface Props {
  onDone: () => void;
  /** Optional. When omitted, defaults to a neutral pink/purple companion. */
  category?: ChallengeCategoryId;
  /** 1..5 — scales celebration intensity. */
  level?: number;
  /** Override total duration. */
  durationMs?: number;
}

export const ChallengeSuccessOverlay = ({
  onDone,
  category = "interaction",
  level = 1,
  durationMs,
}: Props) => {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(true);

  const variant = CATEGORY_VARIANT[category] ?? CATEGORY_VARIANT.interaction;
  const intensity = intensityFor(level);
  const total = durationMs ?? intensity.durationMs;

  const message = useMemo(() => {
    const pool = MESSAGES[category] ?? MESSAGES.interaction;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [category]);
  const headline = useMemo(() => {
    const pool = HEADLINES[category] ?? HEADLINES.interaction;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [category]);

  useEffect(() => {
    // Category-tuned completion chime + optional haptic feedback.
    playSuccessChime(category, level);
    triggerHaptic(category, level);

    const fadeAt = Math.max(0, total - 350);
    const fadeId = window.setTimeout(() => setVisible(false), fadeAt);
    const doneId = window.setTimeout(() => onDone(), total);
    return () => {
      window.clearTimeout(fadeId);
      window.clearTimeout(doneId);
    };
  }, [total, onDone, category, level]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } bg-gradient-to-br ${isDark ? variant.bgDark : variant.bgLight} backdrop-blur-xl`}
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes chibi-pop {
          0%   { transform: translateY(40px) scale(0.4); opacity: 0; }
          55%  { transform: translateY(-10px) scale(${1.08 * intensity.scale}); opacity: 1; }
          75%  { transform: translateY(4px) scale(${0.96 * intensity.scale}); }
          100% { transform: translateY(0) scale(${intensity.scale}); opacity: 1; }
        }
        @keyframes chibi-breathe {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-3px) scale(1.02); }
        }
        @keyframes chibi-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95%           { transform: scaleY(0.1); }
        }
        @keyframes wave-arm {
          0%, 100% { transform: rotate(-8deg); }
          50%      { transform: rotate(22deg); }
        }
        @keyframes extend-arm {
          0%   { transform: rotate(-8deg) translateX(0); }
          100% { transform: rotate(28deg) translateX(6px); }
        }
        @keyframes heart-form {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; filter: blur(6px); }
          40%  { transform: translate(-50%, -50%) scale(1.15); opacity: 1; filter: blur(0); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes heart-send {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          70%  { transform: translate(-50%, -220%) scale(1.6); opacity: 1; }
          100% { transform: translate(-50%, -260%) scale(2.2); opacity: 0; }
        }
        @keyframes burst-particle {
          0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); opacity: 0; }
        }
        @keyframes sparkle-float {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateY(-40px) scale(1); opacity: 0; }
        }
        @keyframes text-rise {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse-soft {
          0%,100% { opacity: 0.55; transform: scale(1); }
          50%     { opacity: 0.9;  transform: scale(1.15); }
        }
        @keyframes ring-expand {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(-40px) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0.9; }
        }
        .anim-pop      { animation: chibi-pop 700ms cubic-bezier(.22,1.2,.36,1) both; }
        .anim-breathe  { animation: chibi-breathe 2.4s ease-in-out infinite; animation-delay: 3.6s; animation-fill-mode: both; }
        .anim-blink    { transform-origin: center; animation: chibi-blink 3.2s ease-in-out infinite; animation-delay: 700ms; }
        .anim-wave     { transform-origin: 50% 0%; animation: wave-arm 380ms ease-in-out 3, extend-arm 700ms ease-out 1.8s forwards; }
        .anim-heart-form { animation: heart-form 900ms cubic-bezier(.22,1.2,.36,1) 1.7s both; }
        .anim-heart-send { animation: heart-send 900ms cubic-bezier(.55,.05,.68,.95) 2.8s forwards; }
        .anim-burst      { animation: burst-particle 900ms ease-out 3.5s forwards; }
        .anim-sparkle    { animation: sparkle-float 1.4s ease-out infinite; }
        .anim-text       { animation: text-rise 500ms ease-out 3.8s both; }
        .anim-text-sub   { animation: text-rise 500ms ease-out 4.05s both; }
        .anim-glow       { animation: glow-pulse-soft 2s ease-in-out infinite; }
        .anim-ring       { animation: ring-expand 1.4s ease-out 3.4s forwards; }
        .anim-confetti   { animation: confetti-fall 3.8s linear 3.2s forwards; }
      `}</style>

      {/* Ambient glow (category-tinted) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-3xl anim-glow ${
            isDark ? variant.glowDark : variant.glowLight
          }`}
        />
      </div>

      {/* Confetti rain (level 5) */}
      {intensity.confettiRain && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="absolute anim-confetti text-lg"
              style={{
                left: `${(i * 4.7) % 100}%`,
                top: "-40px",
                color: i % 3 === 0 ? variant.heartFrom : i % 3 === 1 ? variant.heartTo : variant.cheek,
                animationDelay: `${(i % 8) * 120}ms`,
              }}
              aria-hidden="true"
            >
              {i % 2 === 0 ? variant.primarySymbol : variant.secondarySymbol}
            </span>
          ))}
        </div>
      )}

      {/* Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 max-w-sm w-full">
        {/* Level badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide anim-text-sub ${
            isDark ? "bg-white/10 text-white/85" : "bg-black/5 text-slate-700"
          }`}
        >
          {intensity.badge}
        </div>

        {/* Chibi companion + effects */}
        <div className="relative anim-pop">
          {/* Expanding rings behind the companion — count scales with level */}
          {Array.from({ length: intensity.rings }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 anim-ring rounded-full"
              style={{
                width: 160,
                height: 160,
                border: `3px solid ${variant.heartTo}`,
                animationDelay: `${3.4 + i * 0.25}s`,
                opacity: 0.6,
              }}
              aria-hidden="true"
            />
          ))}

          <div className="anim-breathe">
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id={`bodyGrad-${category}`} cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor={variant.bodyStart} />
                  <stop offset="100%" stopColor={variant.bodyEnd} />
                </radialGradient>
                <radialGradient id={`cheek-${category}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={variant.cheek} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={variant.cheek} stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`heartGrad-${category}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={variant.heartFrom} />
                  <stop offset="100%" stopColor={variant.heartTo} />
                </linearGradient>
              </defs>

              {/* Ears */}
              <ellipse cx="65" cy="55" rx="14" ry="20" fill={`url(#bodyGrad-${category})`} transform="rotate(-18 65 55)" />
              <ellipse cx="135" cy="55" rx="14" ry="20" fill={`url(#bodyGrad-${category})`} transform="rotate(18 135 55)" />
              <ellipse cx="65" cy="60" rx="6" ry="10" fill={variant.cheek} opacity="0.55" transform="rotate(-18 65 60)" />
              <ellipse cx="135" cy="60" rx="6" ry="10" fill={variant.cheek} opacity="0.55" transform="rotate(18 135 60)" />

              {/* Body */}
              <ellipse cx="100" cy="150" rx="42" ry="30" fill={`url(#bodyGrad-${category})`} />

              {/* Head */}
              <circle cx="100" cy="95" r="55" fill={`url(#bodyGrad-${category})`} />

              {/* Cheeks */}
              <circle cx="72" cy="108" r="10" fill={`url(#cheek-${category})`} />
              <circle cx="128" cy="108" r="10" fill={`url(#cheek-${category})`} />

              {/* Eyes */}
              <g className="anim-blink" style={{ transformOrigin: "85px 95px" }}>
                <ellipse cx="85" cy="95" rx="7" ry="9" fill="#1f2937" />
                <circle cx="87" cy="92" r="2.5" fill="#fff" />
              </g>
              <g className="anim-blink" style={{ transformOrigin: "115px 95px" }}>
                <ellipse cx="115" cy="95" rx="7" ry="9" fill="#1f2937" />
                <circle cx="117" cy="92" r="2.5" fill="#fff" />
              </g>

              {/* Smile */}
              <path d="M88 118 Q100 128 112 118" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" fill="none" />

              {/* Left arm */}
              <ellipse cx="72" cy="150" rx="10" ry="14" fill={`url(#bodyGrad-${category})`} transform="rotate(-30 72 150)" />

              {/* Right arm waves then extends */}
              <g className="anim-wave" style={{ transformOrigin: "132px 138px" }}>
                <ellipse cx="140" cy="150" rx="9" ry="16" fill={`url(#bodyGrad-${category})`} />
                <circle cx="142" cy="164" r="7" fill={`url(#bodyGrad-${category})`} />
              </g>

              {/* Category accessory */}
              {variant.accessory === "flex" && (
                <path
                  d="M62 148 Q60 132 76 130 Q80 138 74 148"
                  fill={variant.heartTo}
                  opacity="0.85"
                />
              )}
              {variant.accessory === "check" && (
                <g transform="translate(150 62)">
                  <circle r="16" fill={variant.heartTo} />
                  <path d="M-7 0 L-2 6 L8 -6" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {variant.accessory === "spark" && (
                <g transform="translate(150 55)" fill={variant.heartTo}>
                  <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" />
                </g>
              )}
              {variant.accessory === "wave" && (
                <g transform="translate(148 60)" stroke={variant.heartTo} strokeWidth="3" fill="none" strokeLinecap="round">
                  <path d="M0 0 Q6 -8 12 0 T24 0" />
                </g>
              )}
              {variant.accessory === "target" && (
                <g transform="translate(150 60)" fill="none" stroke={variant.heartTo} strokeWidth="2.5">
                  <circle r="12" />
                  <circle r="6" />
                  <circle r="2" fill={variant.heartTo} />
                </g>
              )}
            </svg>
          </div>

          {/* Floating sparkles */}
          {[
            { left: "-14px", top: "20px", delay: "600ms" },
            { left: "190px", top: "40px", delay: "800ms" },
            { left: "10px", top: "170px", delay: "1000ms" },
            { left: "180px", top: "160px", delay: "1200ms" },
            { left: "100px", top: "-10px", delay: "1400ms" },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute anim-sparkle text-lg"
              style={{
                left: s.left,
                top: s.top,
                animationDelay: s.delay,
                color: variant.heartTo,
              }}
              aria-hidden="true"
            >
              {variant.secondarySymbol}
            </span>
          ))}

          {/* Heart forming then sent to viewer */}
          <div className="pointer-events-none absolute" style={{ left: "170px", top: "150px", width: 0, height: 0 }}>
            <div className="absolute anim-heart-form" style={{ left: 0, top: 0 }}>
              <div className="relative anim-heart-send">
                <div
                  className="absolute -inset-6 rounded-full blur-2xl"
                  style={{ background: `radial-gradient(circle, ${variant.heartFrom}cc, transparent 70%)` }}
                />
                <svg width="56" height="52" viewBox="0 0 56 52" aria-hidden="true">
                  <path
                    d="M28 48 C 6 34, 2 18, 14 10 C 22 5, 28 12, 28 16 C 28 12, 34 5, 42 10 C 54 18, 50 34, 28 48 Z"
                    fill={`url(#heartGrad-${category})`}
                    stroke="#fff"
                    strokeOpacity="0.6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            {/* Burst particles — count scales with level */}
            {Array.from({ length: intensity.particles }).map((_, i) => {
              const angle = (i / intensity.particles) * Math.PI * 2;
              const dist = intensity.burstDist + (i % 3) * 20;
              const dx = Math.cos(angle) * dist;
              const dy = Math.sin(angle) * dist - 120;
              const primary = i % 2 === 0;
              return (
                <span
                  key={i}
                  className="absolute anim-burst"
                  style={{
                    left: 0,
                    top: 0,
                    // @ts-expect-error CSS custom properties
                    "--dx": `${dx}px`,
                    "--dy": `${dy}px`,
                    color: primary ? variant.heartFrom : variant.heartTo,
                    fontSize: primary ? 18 : 14,
                    animationDelay: `${3.5 + (i % 4) * 0.05}s`,
                  }}
                  aria-hidden="true"
                >
                  {primary ? variant.primarySymbol : variant.secondarySymbol}
                </span>
              );
            })}
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5 px-4">
          <h2
            className={`anim-text ${intensity.headlineClass} font-extrabold tracking-tight`}
            style={{
              backgroundImage: variant.textGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {headline}
          </h2>
          <p
            className={`anim-text-sub text-base font-medium leading-relaxed ${
              isDark ? "text-slate-200" : "text-slate-700"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
