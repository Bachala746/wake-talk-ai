import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

interface MicrophoneTestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TestState = "idle" | "requesting" | "listening" | "stopped" | "error";

export const MicrophoneTest = ({ open, onOpenChange }: MicrophoneTestProps) => {
  const { isDark } = useTheme();
  const [state, setState] = useState<TestState>("idle");
  const [permission, setPermission] = useState<string>("unknown");
  const [volume, setVolume] = useState(0);
  const [peakVolume, setPeakVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [speechDetected, setSpeechDetected] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check permission status on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        if (navigator.permissions) {
          const res = await navigator.permissions.query({ name: "microphone" as PermissionName });
          setPermission(res.state);
          res.onchange = () => setPermission(res.state);
        }
      } catch {
        setPermission("unknown");
      }
    })();
  }, [open]);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      cleanup();
      setState("idle");
      setVolume(0);
      setPeakVolume(0);
      setTranscript("");
      setErrorMsg("");
      setSpeechDetected(false);
    }
    return () => cleanup();
  }, [open]);

  const monitorVolume = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const normalized = Math.min(100, (avg / 128) * 100);
    setVolume(normalized);
    setPeakVolume((prev) => Math.max(prev, normalized));
    if (normalized > 15) setSpeechDetected(true);
    rafRef.current = requestAnimationFrame(monitorVolume);
  };

  const startTest = async () => {
    console.log("[MicTest] Starting microphone test...");
    setState("requesting");
    setErrorMsg("");
    setTranscript("");
    setSpeechDetected(false);
    setPeakVolume(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      console.log("[MicTest] Mic stream acquired");

      // Setup audio analysis
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Try Web Speech API
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const recognition = new SR();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";
          recognition.onresult = (e: any) => {
            let text = "";
            for (let i = 0; i < e.results.length; i++) {
              text += e.results[i][0].transcript;
            }
            setTranscript(text);
            console.log("[MicTest] Transcript:", text);
          };
          recognition.onerror = (e: any) => {
            console.warn("[MicTest] Recognition error:", e.error);
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn("[MicTest] Web Speech not available:", err);
        }
      }

      setState("listening");
      monitorVolume();
      toast.success("Microphone is active. Speak now!");
    } catch (err: any) {
      console.error("[MicTest] Failed:", err);
      cleanup();
      setState("error");
      const msg = err?.name === "NotAllowedError"
        ? "Microphone permission denied. Please enable it in browser settings."
        : err?.name === "NotFoundError"
        ? "No microphone detected on this device."
        : err?.message || "Failed to access microphone.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const stopTest = () => {
    console.log("[MicTest] Stopping test. Speech detected:", speechDetected, "Peak:", peakVolume);
    cleanup();
    setState("stopped");
    if (speechDetected || peakVolume > 15) {
      toast.success("✅ Microphone is working correctly!");
    } else {
      toast.warning("No audio detected. Check your mic and try again.");
    }
  };

  const permissionColor = permission === "granted" ? "text-green-500" : permission === "denied" ? "text-destructive" : "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-2 w-[calc(100%-1rem)] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Microphone Test
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Permission status */}
          <div className={`flex items-center justify-between rounded-xl p-3 border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-muted/40 border-border'}`}>
            <span className="text-xs sm:text-sm text-muted-foreground">Browser Permission</span>
            <span className={`text-xs sm:text-sm font-semibold capitalize ${permissionColor}`}>
              {permission}
            </span>
          </div>

          {/* Volume meter */}
          <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-muted/40 border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium">Audio Level</span>
              <span className="text-xs text-muted-foreground tabular-nums">{Math.round(volume)}%</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden bg-muted">
              <div
                className="h-full transition-all duration-75 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                style={{ width: `${volume}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] sm:text-xs text-muted-foreground">
              <span>Peak: {Math.round(peakVolume)}%</span>
              <span className={speechDetected ? "text-green-500 font-semibold" : ""}>
                {speechDetected ? "✓ Voice detected" : "Awaiting voice..."}
              </span>
            </div>
          </div>

          {/* Transcript preview */}
          {(state === "listening" || transcript) && (
            <div className={`rounded-xl p-3 border min-h-[60px] ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-muted/40 border-border'}`}>
              <div className="text-xs text-muted-foreground mb-1">Live Transcript</div>
              <div className="text-sm">
                {transcript || <span className="text-muted-foreground italic">Say something...</span>}
              </div>
            </div>
          )}

          {/* Status messages */}
          {state === "listening" && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>🎤 Listening... speak into your mic</span>
            </div>
          )}

          {state === "stopped" && (
            <div className={`flex items-center gap-2 text-sm ${speechDetected ? "text-green-500" : "text-yellow-500"}`}>
              {speechDetected ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>
                {speechDetected
                  ? "Microphone is working correctly!"
                  : "No clear voice detected. Check mic and try again."}
              </span>
            </div>
          )}

          {state === "error" && errorMsg && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          {state !== "listening" ? (
            <Button
              onClick={startTest}
              disabled={state === "requesting"}
              className="flex-1 bg-gradient-warm hover:opacity-90 text-white"
            >
              {state === "requesting" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Requesting...</>
              ) : (
                <><Mic className="h-4 w-4 mr-2" /> {state === "stopped" || state === "error" ? "Test Again" : "Start Test"}</>
              )}
            </Button>
          ) : (
            <Button onClick={stopTest} variant="destructive" className="flex-1">
              <MicOff className="h-4 w-4 mr-2" /> Stop Test
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
