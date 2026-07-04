import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Accelerometer-based rep counter for Body Wake-Up challenges.
 *
 * Reads DeviceMotionEvent.accelerationIncludingGravity, removes gravity via a
 * long-window low-pass filter, then runs a hysteresis peak detector: a rep
 * fires when linear-acceleration magnitude crosses `upThreshold`, then falls
 * back below `downThreshold`, respecting `minIntervalMs` as a debounce.
 *
 * Also exposes `tap()` for the manual tap-to-count fallback (always available
 * because in-browser accelerometer detection is unreliable on desktop and on
 * iOS without an explicit motion permission grant).
 */
export type RepKind = "jump" | "squat" | "pushup" | "walk";

interface Tuning {
  upThreshold: number;   // m/s² above baseline to arm
  downThreshold: number; // m/s² below to disarm and count
  minIntervalMs: number; // minimum ms between reps
}

const TUNING: Record<RepKind, Tuning> = {
  jump:   { upThreshold: 16, downThreshold: 4, minIntervalMs: 350 },
  squat:  { upThreshold: 5.5, downThreshold: 1.5, minIntervalMs: 700 },
  pushup: { upThreshold: 4.5, downThreshold: 1.0, minIntervalMs: 900 },
  walk:   { upThreshold: 11, downThreshold: 6, minIntervalMs: 300 },
};

export interface UseMotionRepCounterOptions {
  kind: RepKind;
  target: number;
  active?: boolean;
  onRep?: (count: number) => void;
  onComplete?: () => void;
}

export interface MotionRepCounter {
  count: number;
  motionAvailable: boolean;
  motionActive: boolean;
  tap: () => void;
  reset: () => void;
  requestMotionPermission: () => Promise<boolean>;
}

export function useMotionRepCounter({
  kind,
  target,
  active = true,
  onRep,
  onComplete,
}: UseMotionRepCounterOptions): MotionRepCounter {
  const tuning = TUNING[kind];
  const [count, setCount] = useState(0);
  const [motionActive, setMotionActive] = useState(false);
  const [motionAvailable, setMotionAvailable] = useState<boolean>(() =>
    typeof window !== "undefined" && typeof (window as any).DeviceMotionEvent !== "undefined"
  );

  const countRef = useRef(0);
  const armedRef = useRef(false);
  const lastRepRef = useRef(0);
  const gravityRef = useRef({ x: 0, y: 0, z: 0 });
  const completedRef = useRef(false);

  const onRepRef = useRef(onRep);
  onRepRef.current = onRep;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const bumpCount = useCallback(() => {
    if (completedRef.current) return;
    countRef.current += 1;
    const c = countRef.current;
    setCount(c);
    onRepRef.current?.(c);
    if (c >= target) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [target]);

  const handleMotion = useCallback(
    (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
      // Low-pass gravity estimate (EMA, α ≈ 0.9 keeps only slow component).
      const g = gravityRef.current;
      const alpha = 0.9;
      g.x = alpha * g.x + (1 - alpha) * acc.x;
      g.y = alpha * g.y + (1 - alpha) * acc.y;
      g.z = alpha * g.z + (1 - alpha) * acc.z;
      const lx = acc.x - g.x;
      const ly = acc.y - g.y;
      const lz = acc.z - g.z;
      const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);
      const now = performance.now();
      if (!armedRef.current) {
        if (mag > tuning.upThreshold && now - lastRepRef.current > tuning.minIntervalMs) {
          armedRef.current = true;
        }
      } else if (mag < tuning.downThreshold) {
        armedRef.current = false;
        lastRepRef.current = now;
        bumpCount();
      }
    },
    [tuning, bumpCount]
  );

  const attach = useCallback(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("devicemotion", handleMotion);
    setMotionActive(true);
  }, [handleMotion]);

  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    const DME: any = (window as any).DeviceMotionEvent;
    if (!DME) {
      setMotionAvailable(false);
      return false;
    }
    if (typeof DME.requestPermission === "function") {
      try {
        const res = await DME.requestPermission();
        if (res === "granted") {
          attach();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
    attach();
    return true;
  }, [attach]);

  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    const DME: any = (window as any).DeviceMotionEvent;
    if (!DME) {
      setMotionAvailable(false);
      return;
    }
    // If the platform doesn't gate motion behind an explicit permission
    // (Android / desktop), attach immediately. iOS Safari requires a user
    // gesture — the intro-screen "Start" button is where we'll call
    // requestMotionPermission().
    if (typeof DME.requestPermission !== "function") {
      attach();
      return () => {
        window.removeEventListener("devicemotion", handleMotion);
        setMotionActive(false);
      };
    }
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      setMotionActive(false);
    };
  }, [active, attach, handleMotion]);

  const tap = useCallback(() => {
    bumpCount();
  }, [bumpCount]);

  const reset = useCallback(() => {
    countRef.current = 0;
    lastRepRef.current = 0;
    armedRef.current = false;
    completedRef.current = false;
    gravityRef.current = { x: 0, y: 0, z: 0 };
    setCount(0);
  }, []);

  return { count, motionAvailable, motionActive, tap, reset, requestMotionPermission };
}
