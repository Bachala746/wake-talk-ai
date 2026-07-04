import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMotionRepCounter, RepKind } from "@/hooks/useMotionRepCounter";
import { BODY_CHALLENGE_UNIT } from "@/lib/alarmSettings";

interface Props {
  kind: RepKind;
  target: number;
  onComplete: () => void;
}

const ICON: Record<RepKind, string> = {
  jump: "🤸",
  squat: "🏋️",
  pushup: "💪",
  walk: "🚶",
};

const CUE: Record<RepKind, string> = {
  jump: "Hold the phone and jump — each landing counts.",
  squat: "Hold the phone at your chest. Squat fully, then stand.",
  pushup: "Place the phone under your chest, screen up. Full push-ups only.",
  walk: "Walk normally. Steps count automatically.",
};

/**
 * Renders one rep-counting round for a Body Wake-Up challenge. The parent
 * (MultiRoundChallenge) owns the 30-second timer and calls this component
 * fresh each round via `key` remount.
 */
export const BodyRepChallenge = ({ kind, target, onComplete }: Props) => {
  const [pulse, setPulse] = useState(false);
  const { count, motionAvailable, motionActive, tap, requestMotionPermission } = useMotionRepCounter({
    kind,
    target,
    active: true,
    onRep: () => {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 180);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.(40); } catch { /* ignore */ }
      }
    },
    onComplete,
  });

  const [needsPermission, setNeedsPermission] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const DME: any = (window as any).DeviceMotionEvent;
    return !!DME && typeof DME.requestPermission === "function";
  });

  useEffect(() => {
    if (motionActive) setNeedsPermission(false);
  }, [motionActive]);

  const pct = Math.min(100, Math.round((count / Math.max(target, 1)) * 100));
  const unit = BODY_CHALLENGE_UNIT[kind];

  return (
    <div className="w-full space-y-4 p-4 rounded-2xl bg-card/60 border border-border">
      <div className="flex flex-col items-center text-center gap-1">
        <div className={`text-6xl transition-transform duration-150 ${pulse ? "scale-125" : "scale-100"}`}>
          {ICON[kind]}
        </div>
        <p className="text-xs text-muted-foreground">{CUE[kind]}</p>
      </div>

      <div className="text-center">
        <div className="text-5xl font-black tabular-nums leading-none">
          <span className="text-primary">{count}</span>
          <span className="text-muted-foreground/60"> / {target}</span>
        </div>
        <p className="text-xs font-semibold mt-2 tracking-wide text-muted-foreground uppercase">
          {unit}
        </p>
      </div>

      <div>
        <Progress value={pct} className="h-3" />
        <p className="text-[11px] text-muted-foreground text-center mt-1 tabular-nums">
          {pct}% complete · {Math.max(target - count, 0)} {unit.toLowerCase()} left
        </p>
      </div>

      {needsPermission && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={async () => {
            const ok = await requestMotionPermission();
            if (!ok) setNeedsPermission(false);
          }}
        >
          Enable motion sensor
        </Button>
      )}

      <div className="pt-1">
        <Button
          type="button"
          variant={motionAvailable && motionActive ? "outline" : "default"}
          className="w-full h-14 text-base font-bold"
          onClick={tap}
        >
          {motionAvailable && motionActive
            ? `Tap fallback · +1 ${unit.slice(0, -1)}`
            : `Tap for each ${unit.slice(0, -1).toLowerCase()}`}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {motionAvailable && motionActive
            ? "Motion sensor active. Use tap if a rep isn't detected."
            : "Motion sensor unavailable — use the tap button."}
        </p>
      </div>
    </div>
  );
};
