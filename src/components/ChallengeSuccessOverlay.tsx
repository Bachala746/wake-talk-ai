import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Sparkles, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";

const MOTIVATIONAL_MESSAGES = [
  "You did it! Your mind is awake and ready to own the day.",
  "Every round crushed. That's the kind of energy that changes lives.",
  "Fully awake, fully alive. Go make today unforgettable.",
  "Discipline beats snooze — you just proved it. Have an amazing day!",
  "Champions win the morning. You just won yours.",
  "Brain online. Body ready. Nothing can stop you now.",
  "That's how winners start the day. Momentum is yours.",
  "You showed up when it was hardest. The rest of today is easy.",
  "Focused, sharp, and unstoppable. Let's go!",
  "Sunrise mindset activated. Own every moment ahead.",
];

interface Props {
  onDone: () => void;
  /** Total ms the overlay stays visible before firing onDone. */
  durationMs?: number;
}

/**
 * Full-screen success animation shown when ALL rounds of any challenge
 * category (Mind / Body / Reality / Interaction) are completed successfully.
 * Fires onDone after the animation finishes so the alarm can dismiss.
 */
export const ChallengeSuccessOverlay = ({ onDone, durationMs = 2600 }: Props) => {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(true);
  const message = useMemo(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
    []
  );

  useEffect(() => {
    const fadeAt = durationMs - 300;
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
          : "bg-gradient-to-br from-amber-50/95 via-orange-100/95 to-amber-50/95"
      } backdrop-blur-xl`}
      role="status"
      aria-live="polite"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-40 animate-pulse ${
            isDark ? "bg-indigo-500/30" : "bg-amber-300/40"
          }`}
        />
        <div
          className={`absolute -bottom-24 -right-16 w-96 h-96 rounded-full blur-3xl opacity-40 animate-pulse ${
            isDark ? "bg-purple-500/30" : "bg-orange-300/40"
          }`}
          style={{ animationDelay: "400ms" }}
        />
      </div>

      {/* Sparkle burst */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (i / 14) * Math.PI * 2;
          const dist = 140 + (i % 3) * 30;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          return (
            <Sparkles
              key={i}
              className={`absolute top-1/2 left-1/2 h-4 w-4 animate-fade-in ${
                isDark ? "text-amber-300" : "text-orange-500"
              }`}
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                animationDelay: `${i * 60}ms`,
                animationDuration: "800ms",
              }}
            />
          );
        })}
      </div>

      <Card
        className={`relative z-10 w-full max-w-md p-8 text-center space-y-5 border shadow-2xl rounded-3xl animate-scale-in ${
          isDark
            ? "bg-slate-800/80 border-indigo-400/30"
            : "bg-white/90 border-amber-200/70"
        }`}
      >
        <div className="flex justify-center">
          <div
            className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full ${
              isDark ? "bg-emerald-500/20" : "bg-emerald-100"
            }`}
          >
            <div
              className={`absolute inset-0 rounded-full animate-ping ${
                isDark ? "bg-emerald-400/30" : "bg-emerald-400/40"
              }`}
            />
            <CheckCircle2
              className="relative h-14 w-14 text-emerald-500 animate-scale-in"
              strokeWidth={2.2}
            />
          </div>
        </div>

        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <Sun
              className={`h-5 w-5 ${isDark ? "text-amber-300" : "text-orange-500"}`}
            />
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              All Rounds Complete!
            </h2>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground font-medium">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span
            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: "120ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: "240ms" }}
          />
        </div>
      </Card>
    </div>
  );
};
