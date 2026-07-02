import { useCallback, useEffect, useRef, useState } from "react";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { MindRoundHeader } from "./MindRoundHeader";
import {
  ChallengeType,
  MindChallengeConfig,
  MindLevel,
  defaultMindChallengeConfig,
  levelToDifficulty,
  SpeakMatchSettings,
  ObjectVerifySettings,
  MathChallengeSettings,
} from "@/lib/alarmSettings";

/**
 * Global challenge round-runner for Body / Reality / Interaction challenges
 * (shake, steps, qrcode, barcode, speakMatch, objectVerify).
 *
 * Enforces the app-wide global rules:
 *   • 5 progressive difficulty levels (1–5) mapped from config.level.
 *   • User-selected round count (3–30).
 *   • 30-second timer per round — timeout = failed round, regenerate.
 *   • Wrong answers do NOT count as completed rounds.
 *   • Randomized fresh round every attempt (via React `key` remount).
 *   • Alarm only dismisses after all rounds are cleared.
 */
interface Props {
  challengeType: ChallengeType;
  config: MindChallengeConfig;
  onComplete: () => void;
  onFail?: () => void;
  onEscalate?: (level: number) => void;
  // pass-throughs
  speakMatchSettings?: SpeakMatchSettings;
  registeredQrCode?: string;
  objectVerifySettings?: ObjectVerifySettings;
  mathSettings?: MathChallengeSettings;
  isAlarmActive?: boolean;
}

const CHALLENGE_LABEL: Partial<Record<ChallengeType, string>> = {
  shake: "Shake Phone",
  steps: "Walk Steps",
  qrcode: "Scan QR Code",
  barcode: "Scan Barcode",
  speakMatch: "Speak & Match",
  objectVerify: "Object Verify",
};

export const MultiRoundChallenge = ({
  challengeType,
  config,
  onComplete,
  onFail,
  onEscalate,
  speakMatchSettings,
  registeredQrCode,
  objectVerifySettings,
  mathSettings,
  isAlarmActive = true,
}: Props) => {
  const cfg = config || defaultMindChallengeConfig;
  const level = (cfg.level || 1) as MindLevel;
  const totalRounds = Math.max(1, cfg.rounds || 5);
  const timePerRound = Math.max(5, cfg.timePerRound || 30);

  const [round, setRound] = useState(0);
  const [roundKey, setRoundKey] = useState(0); // bump to remount inner challenge
  const [timeLeft, setTimeLeft] = useState(timePerRound);
  const [feedback, setFeedback] = useState<"correct" | "timeout" | "wrong" | null>(null);
  const [failures, setFailures] = useState(0);
  const finalizedRef = useRef(false);

  const resetTimer = useCallback(() => setTimeLeft(timePerRound), [timePerRound]);

  // Countdown
  useEffect(() => {
    if (feedback !== null) return;
    if (timeLeft <= 0) {
      // Timeout = failed round
      setFeedback("timeout");
      setFailures((f) => f + 1);
      onFail?.();
      const nextFailures = failures + 1;
      if (nextFailures === 3) onEscalate?.(1);
      window.setTimeout(() => {
        setRoundKey((k) => k + 1);
        resetTimer();
        setFeedback(null);
      }, 900);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timeLeft, feedback, failures, onFail, onEscalate, resetTimer]);

  const handleInnerComplete = useCallback(() => {
    if (finalizedRef.current || feedback !== null) return;
    setFeedback("correct");
    window.setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= totalRounds) {
        finalizedRef.current = true;
        onComplete();
      } else {
        setRound(nextRound);
        setRoundKey((k) => k + 1);
        resetTimer();
        setFeedback(null);
      }
    }, 600);
  }, [round, totalRounds, onComplete, feedback, resetTimer]);

  const handleInnerFail = useCallback(() => {
    if (feedback !== null) return;
    setFeedback("wrong");
    setFailures((f) => f + 1);
    onFail?.();
    const nextFailures = failures + 1;
    if (nextFailures === 3) onEscalate?.(1);
    window.setTimeout(() => {
      setRoundKey((k) => k + 1);
      resetTimer();
      setFeedback(null);
    }, 900);
  }, [feedback, failures, onFail, onEscalate, resetTimer]);

  const difficulty = levelToDifficulty(level);
  const label = CHALLENGE_LABEL[challengeType] || "Challenge";

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <MindRoundHeader
        title={label}
        level={level}
        round={round}
        totalRounds={totalRounds}
        timeLeft={timeLeft}
        timePerRound={timePerRound}
        feedback={feedback}
      />
      <WakeUpChallenge
        key={roundKey}
        challengeType={challengeType}
        difficulty={difficulty}
        onComplete={handleInnerComplete}
        onFail={handleInnerFail}
        onEscalate={onEscalate}
        speakMatchSettings={speakMatchSettings}
        registeredQrCode={registeredQrCode}
        objectVerifySettings={objectVerifySettings}
        mathSettings={mathSettings}
        isAlarmActive={isAlarmActive}
      />
    </div>
  );
};
