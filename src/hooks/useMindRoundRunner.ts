import { useCallback, useEffect, useRef, useState } from "react";

export type RoundFeedback = 'correct' | 'wrong' | 'timeout' | null;

export interface UseMindRoundRunnerOptions<T> {
  level: 1 | 2 | 3 | 4 | 5;
  totalRounds: number;
  timePerRound: number;
  generate: (level: 1 | 2 | 3 | 4 | 5, used: Set<string>) => T;
  onAllComplete: () => void;
  onWrong?: (kind: 'wrong' | 'timeout') => void;
  active?: boolean;
  correctDelayMs?: number;
  wrongDelayMs?: number;
}

export interface MindRoundRunner<T> {
  level: 1 | 2 | 3 | 4 | 5;
  round: number;          // 0-indexed current round
  totalRounds: number;
  payload: T;
  feedback: RoundFeedback;
  timeLeft: number;
  timePerRound: number;
  completed: boolean;
  progressPct: number;
  markCorrect: () => void;
  markWrong: (kind?: 'wrong' | 'timeout') => void;
}

/**
 * Reusable round-runner for Mind Wake-Up challenges.
 * - 30s (configurable) per round
 * - Wrong/timeout regenerates a fresh round of the same level WITHOUT advancing
 * - All `totalRounds` correct → fires onAllComplete
 * - Used-set prevents repeats within a session
 */
export function useMindRoundRunner<T>({
  level,
  totalRounds,
  timePerRound,
  generate,
  onAllComplete,
  onWrong,
  active = true,
  correctDelayMs = 650,
  wrongDelayMs = 1100,
}: UseMindRoundRunnerOptions<T>): MindRoundRunner<T> {
  const usedRef = useRef<Set<string>>(new Set());
  const generateRef = useRef(generate);
  generateRef.current = generate;

  const [round, setRound] = useState(0);
  const [payload, setPayload] = useState<T>(() => generateRef.current(level, usedRef.current));
  const [feedback, setFeedback] = useState<RoundFeedback>(null);
  const [timeLeft, setTimeLeft] = useState(timePerRound);
  const [completed, setCompleted] = useState(false);

  const newRound = useCallback(() => {
    setPayload(generateRef.current(level, usedRef.current));
    setTimeLeft(timePerRound);
    setFeedback(null);
  }, [level, timePerRound]);

  const markCorrect = useCallback(() => {
    setFeedback((cur) => {
      if (cur !== null) return cur;
      const isLast = round + 1 >= totalRounds;
      window.setTimeout(() => {
        if (isLast) {
          setCompleted(true);
          onAllComplete();
        } else {
          setRound((r) => r + 1);
          newRound();
        }
      }, correctDelayMs);
      return 'correct';
    });
  }, [round, totalRounds, onAllComplete, newRound, correctDelayMs]);

  const markWrong = useCallback(
    (kind: 'wrong' | 'timeout' = 'wrong') => {
      setFeedback((cur) => {
        if (cur !== null) return cur;
        onWrong?.(kind);
        window.setTimeout(() => newRound(), wrongDelayMs);
        return kind;
      });
    },
    [onWrong, newRound, wrongDelayMs]
  );

  // Countdown timer
  useEffect(() => {
    if (!active || completed || feedback !== null) return;
    if (timeLeft <= 0) {
      markWrong('timeout');
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [active, completed, feedback, timeLeft, markWrong]);

  return {
    level,
    round,
    totalRounds,
    payload,
    feedback,
    timeLeft,
    timePerRound,
    completed,
    progressPct: Math.min(100, Math.round((round / Math.max(totalRounds, 1)) * 100)),
    markCorrect,
    markWrong,
  };
}
