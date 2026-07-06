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
  /** Whether soft sound effects should play in sync with animation beats. */
  soundEnabled?: boolean;
  /** Whether haptic vibration should fire in sync with animation beats. */
  hapticsEnabled?: boolean;
}

/** Subtle vibration helper — safely no-ops when unsupported. */
const vibrate = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
};

/**
 * Tiny Web Audio helper for beat-synced UI sounds.
 * Each note is intentionally short and soft so it feels like a chime,
 * not an alarm.
 */
const playNote = (
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
) => {
  const t0 = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
};

/**
 * Full-screen success animation shown when ALL rounds of any challenge
 * category (Mind / Body / Reality / Interaction) are completed successfully.
 *
 * Design: a warm "companion celebrating with you" moment — the character
 * plays a short 5s reward animation, a heart floats toward the user, and a
 * motivational message fades in. Feels rewarding, emotional, and consistent
 * across every challenge category.
 *
 * Beat map (aligned to the 4–5s video):
 *   0.0s  — character pops in            (soft pop + light tap)
 *   0.5s  — wave / smile                 (soft tick)
 *   1.5s  — heart forms in palm          (warm rising chime)
 *   2.8s  — heart bursts toward viewer   (sparkle chime + pattern buzz)
 *   3.8s  — wink + thumbs-up             (triumph arpeggio + light tap)
 */
export const ChallengeSuccessOverlay = ({
  onDone,
  durationMs = 5200,
  soundEnabled = true,
  hapticsEnabled = true,
}: Props) => {
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

  // Beat-synced haptics + sound. Fires once when the overlay mounts.
  useEffect(() => {
    const timers: number[] = [];
    let ctx: AudioContext | null = null;

    if (soundEnabled) {
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctx = new AC();
      } catch {
        ctx = null;
      }
    }

    // Beat 1 — pop in (0.0s)
    if (hapticsEnabled) vibrate(18);
    if (ctx) {
      playNote(ctx, 520, 0, 0.18, 0.18, "sine");
      playNote(ctx, 780, 0.05, 0.14, 0.12, "sine");
    }

    // Beat 2 — wave / smile (0.5s)
    timers.push(
      window.setTimeout(() => {
        if (hapticsEnabled) vibrate(10);
        if (ctx) playNote(ctx, 880, 0, 0.12, 0.1, "sine");
      }, 500)
    );

    // Beat 3 — heart forms (1.5s) — warm rising chime
    timers.push(
      window.setTimeout(() => {
        if (hapticsEnabled) vibrate(22);
        if (ctx) {
          playNote(ctx, 587.33, 0, 0.35, 0.14, "sine"); // D5
          playNote(ctx, 880, 0.12, 0.3, 0.11, "sine"); // A5
        }
      }, 1500)
    );

    // Beat 4 — heart bursts (2.8s) — sparkle
    timers.push(
      window.setTimeout(() => {
        if (hapticsEnabled) vibrate([25, 40, 20]);
        if (ctx) {
          playNote(ctx, 1046.5, 0, 0.18, 0.14, "triangle"); // C6
          playNote(ctx, 1318.51, 0.08, 0.2, 0.12, "triangle"); // E6
          playNote(ctx, 1567.98, 0.16, 0.22, 0.1, "triangle"); // G6
        }
      }, 2800)
    );

    // Beat 5 — wink + thumbs-up (3.8s) — triumph arpeggio
    timers.push(
      window.setTimeout(() => {
        if (hapticsEnabled) vibrate(15);
        if (ctx) {
          playNote(ctx, 783.99, 0, 0.16, 0.14, "sine"); // G5
          playNote(ctx, 1046.5, 0.1, 0.16, 0.14, "sine"); // C6
          playNote(ctx, 1318.51, 0.2, 0.25, 0.14, "sine"); // E6
        }
      }, 3800)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      if (ctx) {
        try {
          ctx.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, [soundEnabled, hapticsEnabled]);

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
