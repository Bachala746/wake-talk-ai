import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Volume2, CheckCircle2, XCircle, AlertTriangle, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import {
  checkPermission,
  requestPermission,
  getRequiredPermissions,
  PermissionStatus,
} from "@/lib/permissions";
import { AlarmSettings } from "@/lib/alarmSettings";
import { playCorrectTapSound } from "@/lib/soundEffects";

type CheckState = "pending" | "running" | "ok" | "fail";

interface PreAlarmCheckProps {
  alarmTime: string;
  alarmLabel: string;
  settings: AlarmSettings;
  open: boolean;
  onClose: () => void;
}

/**
 * Runs ~2 minutes before each active alarm to confirm:
 *  - Microphone permission + capture works (level > 0)
 *  - Audio output works (user confirms they heard the test tone)
 *  - Notification permission is granted
 * Guides the user through fixes if anything fails.
 */
export const PreAlarmCheck = ({
  alarmTime,
  alarmLabel,
  settings,
  open,
  onClose,
}: PreAlarmCheckProps) => {
  const [micState, setMicState] = useState<CheckState>("pending");
  const [micLevel, setMicLevel] = useState(0);
  const [audioState, setAudioState] = useState<CheckState>("pending");
  const [notifState, setNotifState] = useState<CheckState>("pending");
  const [notifStatus, setNotifStatus] = useState<PermissionStatus>("prompt");
  const [running, setRunning] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setMicState("pending");
      setMicLevel(0);
      setAudioState("pending");
      setNotifState("pending");
      // Pre-read notification status
      checkPermission("notifications").then((s) => {
        setNotifStatus(s);
        setNotifState(s === "granted" ? "ok" : s === "denied" ? "fail" : "pending");
      });
    } else {
      cleanup();
    }
  }, [open, cleanup]);

  // Microphone check: request permission + measure live level for 2.5s
  const runMicCheck = useCallback(async () => {
    setMicState("running");
    setMicLevel(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const start = performance.now();
      let peak = 0;

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        // RMS-style peak deviation from 128
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(1, rms * 3);
        setMicLevel(level);
        if (level > peak) peak = level;

        const elapsed = performance.now() - start;
        if (elapsed < 2500) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // Decide pass/fail: any meaningful audio captured
          if (peak > 0.04) {
            setMicState("ok");
          } else {
            setMicState("fail");
            toast.warning("We couldn't detect your voice. Try speaking louder or check your mic.");
          }
          // Release stream
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          ctx.close().catch(() => {});
          audioCtxRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      console.error("[PreAlarmCheck] Mic error:", err);
      setMicState("fail");
      if (err?.name === "NotAllowedError") {
        toast.error("Microphone blocked. Allow it from the browser address bar.");
      } else if (err?.name === "NotFoundError") {
        toast.error("No microphone found. Connect one and try again.");
      } else if (err?.name === "NotReadableError") {
        toast.error("Microphone is in use by another app.");
      } else {
        toast.error("Could not access microphone.");
      }
    }
  }, []);

  // Audio output check: play a short beep, ask user to confirm
  const runAudioCheck = useCallback(async () => {
    setAudioState("running");
    try {
      playCorrectTapSound();
      // Wait for user confirmation via buttons
    } catch (err) {
      console.error("[PreAlarmCheck] Audio error:", err);
      setAudioState("fail");
      toast.error("Could not play test sound. Check your speakers/volume.");
    }
  }, []);

  const confirmAudioHeard = (heard: boolean) => {
    setAudioState(heard ? "ok" : "fail");
    if (!heard) {
      toast.warning("Turn your volume up and try the test again.");
    }
  };

  // Notification permission request
  const runNotifCheck = useCallback(async () => {
    setNotifState("running");
    const result = await requestPermission("notifications");
    setNotifStatus(result);
    setNotifState(result === "granted" ? "ok" : "fail");
    if (result !== "granted") {
      toast.warning("Notifications blocked — alarm may not show when the tab is in background.");
    }
  }, []);

  // Run all required checks in sequence
  const runAll = useCallback(async () => {
    setRunning(true);
    const required = getRequiredPermissions(settings.challengeType, settings.interactionMode);

    if (required.includes("notifications") && notifState !== "ok") {
      await runNotifCheck();
    }
    if (required.includes("microphone")) {
      await runMicCheck();
      // Wait for mic check to finish (~2.6s)
      await new Promise((r) => setTimeout(r, 2700));
    }
    await runAudioCheck();
    setRunning(false);
  }, [settings, notifState, runNotifCheck, runMicCheck, runAudioCheck]);

  const required = getRequiredPermissions(settings.challengeType, settings.interactionMode);
  const needsMic = required.includes("microphone");
  const needsNotif = required.includes("notifications");

  const allOk =
    (!needsMic || micState === "ok") &&
    (!needsNotif || notifState === "ok") &&
    audioState === "ok";

  const renderRow = (
    icon: React.ReactNode,
    label: string,
    state: CheckState,
    detail?: React.ReactNode,
    action?: React.ReactNode,
  ) => (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {state === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {state === "fail" && <XCircle className="h-4 w-4 text-red-500" />}
          {state === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { cleanup(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Pre-Alarm Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
            <p className="text-sm font-semibold text-foreground">
              Your alarm "{alarmLabel}" is coming up at {alarmTime}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Let's make sure your microphone, speakers, and notifications work so the wake-up call goes smoothly.
            </p>
          </div>

          {needsNotif && renderRow(
            <Bell className="h-5 w-5 text-primary" />,
            "Notifications",
            notifState,
            notifState === "fail"
              ? "Blocked. Click the lock icon in the address bar → allow notifications."
              : notifState === "ok"
                ? "Allowed"
                : "Needed so the alarm appears even if the tab is in background.",
            notifState !== "ok" && (
              <Button size="sm" variant="outline" onClick={runNotifCheck} disabled={notifState === "running"}>
                Allow notifications
              </Button>
            ),
          )}

          {needsMic && renderRow(
            <Mic className="h-5 w-5 text-primary" />,
            "Microphone",
            micState,
            micState === "running" ? (
              <div className="space-y-1">
                <p>Speak now — we're measuring your voice level…</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${Math.round(micLevel * 100)}%` }}
                  />
                </div>
              </div>
            ) : micState === "ok" ? (
              "Voice detected — you're all set."
            ) : micState === "fail" ? (
              "No voice detected, or permission was denied. Check your mic and try again."
            ) : (
              "We'll record briefly to confirm capture works."
            ),
            micState !== "running" && micState !== "ok" && (
              <Button size="sm" variant="outline" onClick={runMicCheck}>
                {micState === "fail" ? "Retry mic test" : "Test microphone"}
              </Button>
            ),
          )}

          {renderRow(
            <Volume2 className="h-5 w-5 text-primary" />,
            "Audio output",
            audioState,
            audioState === "running"
              ? "Did you hear the beep?"
              : audioState === "ok"
                ? "Audio works."
                : audioState === "fail"
                  ? "No sound detected. Turn up volume and retry."
                  : "We'll play a short beep to confirm your speakers work.",
            audioState === "running" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => confirmAudioHeard(true)}>
                  Yes, I heard it
                </Button>
                <Button size="sm" variant="outline" onClick={() => confirmAudioHeard(false)}>
                  No
                </Button>
              </div>
            ) : audioState !== "ok" && (
              <Button size="sm" variant="outline" onClick={runAudioCheck}>
                {audioState === "fail" ? "Retry audio test" : "Play test sound"}
              </Button>
            ),
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {!allOk && (
            <Button onClick={runAll} disabled={running} className="w-full sm:w-auto">
              {running ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running checks…</>
              ) : (
                "Run all checks"
              )}
            </Button>
          )}
          <Button
            variant={allOk ? "default" : "ghost"}
            onClick={() => { cleanup(); onClose(); }}
            className="w-full sm:w-auto"
          >
            {allOk ? "All set 🎉" : "Skip for now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
