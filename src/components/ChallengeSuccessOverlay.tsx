import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

const MOTIVATIONAL_MESSAGES = [
  "You're getting stronger every day ❤️",
  "Every round crushed. Momentum is yours.",
  "Fully awake, fully alive. Go own today.",
  "Discipline beats snooze — you just proved it.",
  "Champions win the morning. You just won yours.",
  "Focused, sharp, and unstoppable. Let's go!",
  "That's how winners start the day.",
  "You showed up when it was hardest.",
  "Brain online. Body ready. Nothing can stop you.",
  "Sunrise mindset activated ✨",
];

const HEADLINES = ["Awesome!", "Challenge Complete!", "You did it!"];

interface Props {
  onDone: () => void;
  /** Total ms the overlay stays visible before firing onDone. */
  durationMs?: number;
}

/**
 * Chibi-companion success animation shown after all rounds of any challenge
 * category complete. A cute mascot pops in, forms a glowing heart, sends it
 * to the user, and celebrates — then fires onDone to dismiss the alarm.
 */
export const ChallengeSuccessOverlay = ({ onDone, durationMs = 5000 }: Props) => {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(true);
  const message = useMemo(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
    []
  );
  const headline = useMemo(
    () => HEADLINES[Math.floor(Math.random() * HEADLINES.length)],
    []
  );

  useEffect(() => {
    const fadeAt = Math.max(0, durationMs - 350);
    const fadeId = window.setTimeout(() => setVisible(false), fadeAt);
    const doneId = window.setTimeout(() => onDone(), durationMs);
    return () => {
      window.clearTimeout(fadeId);
      window.clearTimeout(doneId);
    };
  }, [durationMs, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } ${
        isDark
          ? "bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-slate-900/95"
          : "bg-gradient-to-br from-rose-50/95 via-amber-50/95 to-violet-50/95"
      } backdrop-blur-xl`}
      role="status"
      aria-live="polite"
    >
      {/* Scoped keyframes for the chibi companion sequence */}
      <style>{`
        @keyframes chibi-pop {
          0%   { transform: translateY(40px) scale(0.4); opacity: 0; }
          55%  { transform: translateY(-10px) scale(1.08); opacity: 1; }
          75%  { transform: translateY(4px) scale(0.96); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
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
          70%  { transform: translate(-50%, -50%) scale(1); }
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
      `}</style>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-3xl anim-glow ${
            isDark ? "bg-fuchsia-500/20" : "bg-rose-300/40"
          }`}
        />
      </div>

      {/* Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 max-w-sm w-full">
        {/* Chibi companion */}
        <div className="relative anim-pop">
          <div className="anim-breathe">
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="drop-shadow-[0_12px_24px_rgba(236,72,153,0.35)]"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor={isDark ? "#fce7f3" : "#fff5f7"} />
                  <stop offset="100%" stopColor={isDark ? "#f9a8d4" : "#fbcfe8"} />
                </radialGradient>
                <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <radialGradient id="heartGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ears */}
              <ellipse cx="65" cy="55" rx="14" ry="20" fill="url(#bodyGrad)" transform="rotate(-18 65 55)" />
              <ellipse cx="135" cy="55" rx="14" ry="20" fill="url(#bodyGrad)" transform="rotate(18 135 55)" />
              <ellipse cx="65" cy="60" rx="6" ry="10" fill="#fb7185" opacity="0.55" transform="rotate(-18 65 60)" />
              <ellipse cx="135" cy="60" rx="6" ry="10" fill="#fb7185" opacity="0.55" transform="rotate(18 135 60)" />

              {/* Body (little belly under head, tucked behind arms) */}
              <ellipse cx="100" cy="150" rx="42" ry="30" fill="url(#bodyGrad)" />

              {/* Head */}
              <circle cx="100" cy="95" r="55" fill="url(#bodyGrad)" />

              {/* Cheeks */}
              <circle cx="72" cy="108" r="10" fill="url(#cheek)" />
              <circle cx="128" cy="108" r="10" fill="url(#cheek)" />

              {/* Eyes (with blink) */}
              <g className="anim-blink" style={{ transformOrigin: "85px 95px" }}>
                <ellipse cx="85" cy="95" rx="7" ry="9" fill="#1f2937" />
                <circle cx="87" cy="92" r="2.5" fill="#fff" />
              </g>
              <g className="anim-blink" style={{ transformOrigin: "115px 95px" }}>
                <ellipse cx="115" cy="95" rx="7" ry="9" fill="#1f2937" />
                <circle cx="117" cy="92" r="2.5" fill="#fff" />
              </g>

              {/* Smile */}
              <path
                d="M88 118 Q100 128 112 118"
                stroke="#1f2937"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />

              {/* Left arm — hand on chest */}
              <g>
                <ellipse cx="72" cy="150" rx="10" ry="14" fill="url(#bodyGrad)" transform="rotate(-30 72 150)" />
              </g>

              {/* Right arm — waves then extends */}
              <g className="anim-wave" style={{ transformOrigin: "132px 138px" }}>
                <ellipse cx="140" cy="150" rx="9" ry="16" fill="url(#bodyGrad)" />
                <circle cx="142" cy="164" r="7" fill="url(#bodyGrad)" />
              </g>
            </svg>
          </div>

          {/* Floating sparkles around companion */}
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
                color: isDark ? "#fde68a" : "#f59e0b",
              }}
              aria-hidden="true"
            >
              ✦
            </span>
          ))}

          {/* Heart forming above the extended palm, then sent to the viewer */}
          <div
            className="pointer-events-none absolute"
            style={{ left: "170px", top: "150px", width: 0, height: 0 }}
          >
            {/* Heart with glow */}
            <div
              className="absolute anim-heart-form"
              style={{ left: 0, top: 0 }}
            >
              <div className="relative anim-heart-send">
                <div
                  className="absolute -inset-6 rounded-full blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(240,171,252,0.9), transparent 70%)" }}
                />
                <svg width="56" height="52" viewBox="0 0 56 52" aria-hidden="true">
                  <path
                    d="M28 48 C 6 34, 2 18, 14 10 C 22 5, 28 12, 28 16 C 28 12, 34 5, 42 10 C 54 18, 50 34, 28 48 Z"
                    fill="url(#heartGrad)"
                    stroke="#fff"
                    strokeOpacity="0.6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            {/* Burst particles after the heart reaches the viewer */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const dist = 90 + (i % 3) * 20;
              const dx = Math.cos(angle) * dist;
              const dy = Math.sin(angle) * dist - 120;
              const isHeart = i % 2 === 0;
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
                    color: isHeart ? "#ec4899" : "#fbbf24",
                    fontSize: isHeart ? 18 : 14,
                    animationDelay: `${3.5 + (i % 4) * 0.05}s`,
                  }}
                  aria-hidden="true"
                >
                  {isHeart ? "❤" : "★"}
                </span>
              );
            })}
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5 px-4">
          <h2
            className="anim-text text-3xl font-extrabold tracking-tight"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f59e0b 100%)",
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
