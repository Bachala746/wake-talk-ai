import { WakeUpChallenge } from "./WakeUpChallenge";
import { MultiRoundChallenge } from "./MultiRoundChallenge";
import {
  AlarmSettings,
  ChallengeType,
  MindChallengeConfig,
  defaultMindChallengeConfig,
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
]);

function pickConfig(settings: AlarmSettings, type: ChallengeType): MindChallengeConfig {
  switch (type) {
    case "shake": return settings.shakeSettings || defaultMindChallengeConfig;
    case "steps": return settings.stepsSettings || defaultMindChallengeConfig;
    case "qrcode": return settings.qrcodeSettings || defaultMindChallengeConfig;
    case "barcode": return settings.barcodeSettings || defaultMindChallengeConfig;
    case "speakMatch": return settings.speakMatchRoundsSettings || defaultMindChallengeConfig;
    case "objectVerify": return settings.objectVerifyRoundsSettings || defaultMindChallengeConfig;
    default: return defaultMindChallengeConfig;
  }
}

/**
 * ChallengeHost — the single entry point for running any challenge.
 * Automatically applies the global rules (5 levels × 3-30 rounds × 30s timer)
 * to Body / Reality / Interaction challenges via MultiRoundChallenge,
 * and passes Mind challenges through to WakeUpChallenge (which already
 * implements the same rules internally).
 */
export const ChallengeHost = ({
  settings,
  onComplete,
  onFail,
  onEscalate,
  isAlarmActive = true,
}: Props) => {
  const type = settings.challengeType;

  if (ROUND_RUNNER_TYPES.has(type)) {
    return (
      <MultiRoundChallenge
        challengeType={type}
        config={pickConfig(settings, type)}
        onComplete={onComplete}
        onFail={onFail}
        onEscalate={onEscalate}
        speakMatchSettings={settings.speakMatchSettings}
        registeredQrCode={settings.registeredQrCode}
        objectVerifySettings={settings.objectVerifySettings}
        mathSettings={settings.mathSettings}
        isAlarmActive={isAlarmActive}
      />
    );
  }

  return (
    <WakeUpChallenge
      challengeType={type}
      difficulty={settings.challengeDifficulty}
      onComplete={onComplete}
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
};
