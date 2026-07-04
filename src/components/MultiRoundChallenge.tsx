import { useCallback, useEffect, useRef, useState } from "react";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { MindRoundHeader } from "./MindRoundHeader";
import { BodyRepChallenge } from "./BodyRepChallenge";
import { BodyChallengeIntro } from "./BodyChallengeIntro";
import {
  BODY_REP_TARGETS,
  ChallengeType,
  MindChallengeConfig,
  MindLevel,
  defaultMindChallengeConfig,
  levelToDifficulty,
  SpeakMatchSettings,
  ObjectVerifySettings,
  MathChallengeSettings,
} from "@/lib/alarmSettings";
import { RepKind } from "@/hooks/useMotionRepCounter";

/**
 * Global challenge round-runner for Body / Reality / Interaction challenges.
 *
 * Enforces the app-wide rules:
 *   • 5 progressive difficulty levels (1–5).
 *   • User-selected round count (3–30).
 *   • 30-second timer per round — timeout = failed round, regenerate.
 *   • Wrong answers do NOT count as completed rounds.
 *   • Randomized fresh round every attempt (via React `key` remount).
 *   • Alarm only dismisses after all rounds are cleared.
 *
 * Body challenges (jump/squat/pushup/walk) also show a Level-Details intro
 * screen once per alarm run before Round 1 starts.
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

const BODY_REP_TYPES: ReadonlySet<ChallengeType> = new Set<ChallengeType>([
  "jump", "squat", "pushup", "walk",
]);

const CHALLENGE_LABEL: Partial<Record<ChallengeType, string>> = {
  shake: "Shake Phone",
  steps: "Walk Steps",
  qrcode: "Scan QR Code",
  barcode: "Scan Barcode",
  speakMatch: "Speak & Match",
  objectVerify: "Object Verify",
  jump: "Jump Challenge",
  squat: "Squat Challenge",
  pushup: "Push-Up Challenge",
  walk: "Walking Challenge",
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
  const isBodyRep = BODY_REP_TYPES.has(challengeType);

  const [introDismissed, setIntroDismissed] = useState(!isBodyRep);
  const [round, setRound] = useState(0);
  const [roundKey, setRoundKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerRound);
  const [feedback, setFeedback] = useState<"correct" | "timeout" | "wrong" | null>(null);
  const [failures, setFailures] = useState(0);
  const finalizedRef = useRef(false);

  const resetTimer = useCallback(() => setTimeLeft(timePerRound), [timePerRound]);

  useEffect(() => {
    if (!introDismissed) return;
    if (feedback !== null) return;
    if (timeLeft <= 0) {
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
  }, [timeLeft, feedback, failures, onFail, onEscalate, resetTimer, introDismissed]);

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

  if (isBodyRep && !introDismissed) {
    return (
      <BodyChallengeIntro
        kind={challengeType as RepKind}
        level={level}
        rounds={totalRounds}
        onStart={() => {
          resetTimer();
          setIntroDismissed(true);
        }}
      />
    );
  }

  const difficulty = levelToDifficulty(level);
  const label = CHALLENGE_LABEL[challengeType] || "Challenge";

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <MindRoundHeader
        level={level}
        round={round}
        totalRounds={totalRounds}
        timeLeft={timeLeft}
        timePerRound={timePerRound}
        completedLabel={`${label} · Round ${Math.min(round + 1, totalRounds)} of ${totalRounds}`}
      />
      {isBodyRep ? (
        <BodyRepChallenge
          key={roundKey}
          kind={challengeType as RepKind}
          target={BODY_REP_TARGETS[challengeType as RepKind][level]}
          onComplete={handleInnerComplete}
        />
      ) : (
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
      )}
    </div>
  );
};
