import { useEffect, useRef, useState, useCallback } from "react";
import { speakWithElevenLabs, cancelSpeech } from "@/lib/elevenLabsAudio";
import { supabase } from "@/integrations/supabase/client";

interface Options {
  enabled: boolean;
  challengeType: string;
  difficulty?: string;
  /** Seconds between motivational lines (default 22s — keeps voice present without overwhelming). */
  intervalSeconds?: number;
}

const FALLBACK_LINES = [
  "You're doing amazing — keep that focus, your morning is yours to command.",
  "Every breath, every answer, every step is waking you up. Stay with me, you've got this.",
  "Look at you go. The world is just starting and you're already winning.",
  "Don't stop now. Your future self is cheering for you right this second.",
  "Push through — this little effort is exactly what makes today extraordinary.",
  "Beautiful work. Take a breath, lift your chin, and finish strong.",
  "You are stronger than the snooze button. Keep going, one moment at a time.",
  "Almost there — your energy is rising, I can feel it. Stay with it.",
  "Notice how alert you're becoming. That's you choosing greatness today.",
  "Keep going, champion. This is the moment your whole day pivots on.",
];

/**
 * Optional AI voice motivation companion for the wake-up challenge.
 * When enabled, speaks dynamic encouraging prompts on a loop so the user
 * has someone "talking with them" while they complete tasks.
 */
export function useVoiceMotivation({
  enabled,
  challengeType,
  difficulty,
  intervalSeconds = 22,
}: Options) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const usedRef = useRef<Set<string>>(new Set());
  const historyRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const timerRef = useRef<number | null>(null);
  const speakingRef = useRef(false);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const pickFallback = useCallback(() => {
    const fresh = FALLBACK_LINES.filter((l) => !usedRef.current.has(l));
    const pool = fresh.length ? fresh : (usedRef.current.clear(), FALLBACK_LINES);
    const line = pool[Math.floor(Math.random() * pool.length)];
    usedRef.current.add(line);
    return line;
  }, []);

  const fetchDynamicLine = useCallback(async (): Promise<string> => {
    try {
      const userMessage = `I'm in the middle of my wake-up "${challengeType}" challenge (${difficulty || "normal"} difficulty). Give me ONE short, fresh, vivid sentence of encouragement (max 22 words). No greetings, no repetition, no questions — just pure motivation to keep going right now.`;
      const { data, error } = await supabase.functions.invoke("conversation-ai", {
        body: {
          userMessage,
          conversationHistory: historyRef.current.slice(-6),
          theme: "gratitude",
        },
      });
      if (error || !data?.response) throw new Error("no response");
      const line = String(data.response).trim().replace(/^["']|["']$/g, "");
      historyRef.current.push({ role: "user", content: userMessage });
      historyRef.current.push({ role: "assistant", content: line });
      return line || pickFallback();
    } catch {
      return pickFallback();
    }
  }, [challengeType, difficulty, pickFallback]);

  const speakOnce = useCallback(async () => {
    if (!enabledRef.current || speakingRef.current) return;
    speakingRef.current = true;
    setIsSpeaking(true);
    const line = await fetchDynamicLine();
    if (!enabledRef.current) {
      speakingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    await new Promise<void>((resolve) => {
      speakWithElevenLabs(
        line,
        "gentle",
        undefined,
        () => resolve(),
        () => resolve(),
      );
    });
    speakingRef.current = false;
    setIsSpeaking(false);
  }, [fetchDynamicLine]);

  // Main loop
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      cancelSpeech();
      speakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    // Greet immediately
    speakOnce();

    timerRef.current = window.setInterval(() => {
      if (!speakingRef.current) speakOnce();
    }, Math.max(8, intervalSeconds) * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      cancelSpeech();
      speakingRef.current = false;
    };
  }, [enabled, intervalSeconds, speakOnce]);

  return { isSpeaking };
}
