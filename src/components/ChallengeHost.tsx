import { useCallback, useState } from "react";
import { WakeUpChallenge } from "./WakeUpChallenge";
import { MultiRoundChallenge } from "./MultiRoundChallenge";
import { ChallengeSuccessOverlay } from "./ChallengeSuccessOverlay";
import {
  AlarmSettings,
  ChallengeType,
  MindChallengeConfig,
  defaultMindChallengeConfig,
  getCategoryForChallenge,
  difficultyToLevel,
} from "@/lib/alarmSettings";

interface Props {
  settings: AlarmSettings;
  onComplete: () => void;
  onFail?: () => void;
  onEscalate?: (level: number) => void;
  isAlarmActive?: boolean;
}

/** Which challenges use the external MultiRoundChallenge runner (Body / Reality / Interaction). */
const ROUND_RUNNER_TYPES: ReadonlySet<ChallengeType> = new Set<ChallengeType>([
  "shake",
  "steps",
  "qrcode",
  "barcode",
  "speakMatch",
  "objectVerify",
  "jump",
  "squat",
  "pushup",
  "walk",
]);

function pickConfig(settings: AlarmSettings, type: ChallengeType): MindChallengeConfig {
  switch (type) {
    case "shake": return settings.shakeSettings || defaultMindChallengeConfig;
    case "steps": return settings.stepsSettings || defaultMindChallengeConfig;
    case "qrcode": return settings.qrcodeSettings || defaultMindChallengeConfig;
    case "barcode": return settings.barcodeSettings || defaultMindChallengeConfig;
    case "speakMatch": return settings.speakMatchRoundsSettings || defaultMindChallengeConfig;
    case "objectVerify": return settings.objectVerifyRoundsSettings || defaultMindChallengeConfig;
    case "jump": return settings.jumpSettings || defaultMindChallengeConfig;
    case "squat": return settings.squatSettings || defaultMindChallengeConfig;
    case "pushup": return settings.pushupSettings || defaultMindChallengeConfig;
    case "walk": return settings.walkSettings || defaultMindChallengeConfig;
    default: return defaultMindChallengeConfig;
  }
}

/**
 * ChallengeHost — the single entry point for running any challenge.
 * Applies the global rules (5 levels × 3-30 rounds × 30s timer) to every
 * category, and shows a unified success animation + motivational message
 * once ALL rounds are cleared, before dismissing the alarm.
 */
export const ChallengeHost = ({
  settings,
  onComplete,
  onFail,
  onEscalate,
  isAlarmActive = true,
}: Props) => {
  const type = settings.challengeType;
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAllRoundsComplete = useCallback(() => {
    setShowSuccess(true);
  }, []);

  const handleOverlayDone = useCallback(() => {
    setShowSuccess(false);
    onComplete();
  }, [onComplete]);

  const inner = ROUND_RUNNER_TYPES.has(type) ? (
    <MultiRoundChallenge
      challengeType={type}
      config={pickConfig(settings, type)}
      onComplete={handleAllRoundsComplete}
      onFail={onFail}
      onEscalate={onEscalate}
      speakMatchSettings={settings.speakMatchSettings}
      registeredQrCode={settings.registeredQrCode}
      objectVerifySettings={settings.objectVerifySettings}
      mathSettings={settings.mathSettings}
      isAlarmActive={isAlarmActive}
    />
  ) : (
    <WakeUpChallenge
      challengeType={type}
      difficulty={settings.challengeDifficulty}
      onComplete={handleAllRoundsComplete}
      onFail={onFail}
      onEscalate={onEscalate}
      speakMatchSettings={settings.speakMatchSettings}
      mathSettings={settings.mathSettings}
      typingSettings={settings.typingSettings}
      memorySettings={settings.memorySettings}
      patternSettings={settings.patternSettings}
      sliderSettings={settings.sliderSettings}
      captchaSettings={settings.captchaSettings}
      registeredQrCode={settings.registeredQrCode}
      objectVerifySettings={settings.objectVerifySettings}
      isAlarmActive={isAlarmActive}
    />
  );

  return (
    <>
      {inner}
      {showSuccess && <ChallengeSuccessOverlay onDone={handleOverlayDone} />}
    </>
  );
};
