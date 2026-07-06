import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import companionVideo from "@/assets/success-companion.mp4.asset.json";

const MOTIVATIONAL_MESSAGES = [
  "Awesome! You're getting stronger every day ❤️",
  "Challenge complete! Your mind is awake and ready.",
  "You showed up when it was hardest. That's real strength.",
  "Every round crushed — that's champion energy.",
  "Discipline beats snooze. You just proved it.",
  "Focused, sharp, and unstoppable. Go own the day!",
  "That's how winners start the morning. Keep going ❤️",
  "Fully awake, fully alive. Today is yours.",
  "Small wins, big life. You're building something great.",
  "Brain online. Heart open. Let's go!",
];

interface Props {
  onDone: () => void;
  /** Total ms the overlay stays visible before firing onDone. */
  durationMs?: number;
}

/**
 * Full-screen success animation shown when ALL rounds of any challenge
 * category (Mind / Body / Reality / Interaction) are completed successfully.
 *
 * Design: a warm "companion celebrating with you" moment — the character
 * plays a short 5s reward animation, a heart floats toward the user, and a
 * motivational message fades in. Feels rewarding, emotional, and consistent
 * across every challenge category.
 */
export const ChallengeSuccessOverlay = ({ onDone, durationMs = 5200 }: Props) => {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(true);
  const [showText, setShowText] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const message = useMemo(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
    []
  );

  useEffect(() => {
    // Text fades in after the character has landed and started celebrating.
    const textId = window.setTimeout(() => setShowText(true), 1400);
    const fadeAt = durationMs - 320;
    const fadeId = window.setTimeout(() => setVisible(false), fadeAt);
    const doneId = window.setTimeout(() => onDone(), durationMs);
    return () => {
      window.clearTimeout(textId);
      window.clearTimeout(fadeId);
      window.clearTimeout(doneId);
    };
  }, [durationMs, onDone]);

  useEffect(() => {
    // Ensure autoplay actually starts on mobile browsers.
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {
        /* ignore — muted+playsInline should allow autoplay */
      });
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 transition-opacity duration-300 ${
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
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-50 animate-pulse ${
            isDark ? "bg-indigo-500/25" : "bg-pink-300/40"
          }`}
        />
        <div
          className={`absolute -bottom-28 left-1/2 -translate-x-1/2 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-40 animate-pulse ${
            isDark ? "bg-fuchsia-500/20" : "bg-orange-300/40"
          }`}
          style={{ animationDelay: "500ms" }}
        />
      </div>

      {/* Companion video */}
      <div className="relative z-10 animate-scale-in">
        <div
          className={`absolute inset-0 rounded-full blur-2xl ${
            isDark ? "bg-fuchsia-500/25" : "bg-pink-300/50"
          }`}
          aria-hidden="true"
        />
        <video
          ref={videoRef}
          src={companionVideo.url}
          className="relative w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-2xl"
          autoPlay
          muted
          playsInline
          preload="auto"
        />
      </div>

      {/* Message card */}
      <Card
        className={`relative z-10 mt-4 w-full max-w-md p-6 text-center border shadow-2xl rounded-3xl transition-all duration-500 ${
          showText
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        } ${
          isDark
            ? "bg-slate-800/80 border-fuchsia-400/25"
            : "bg-white/90 border-pink-200/70"
        }`}
      >
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">
          Challenge Complete!
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground font-medium">
          {message}
        </p>
        <div className="flex items-center justify-center gap-1.5 pt-3">
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
