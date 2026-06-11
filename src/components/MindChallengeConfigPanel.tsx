import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  MindChallengeConfig,
  MindChallengeKey,
  MindLevel,
  mindLevelInfo,
  MIND_MIN_ROUNDS,
  MIND_MAX_ROUNDS,
} from "@/lib/alarmSettings";

const TITLES: Record<MindChallengeKey, { icon: string; title: string; tail: string }> = {
  typing: { icon: "⌨️", title: "Typing Challenge Setup", tail: "Type each sentence exactly to advance." },
  memory: { icon: "🧠", title: "Memory Challenge Setup", tail: "Recall the digit sequence in order." },
  pattern: { icon: "🧩", title: "Pattern Challenge Setup", tail: "Tap cells in the exact order shown." },
  slider: { icon: "🎚️", title: "Slider Challenge Setup", tail: "Drag every slider onto its target value." },
  captcha: { icon: "🔤", title: "Captcha Challenge Setup", tail: "Read the distorted word and type it." },
};

interface Props {
  challengeKey: MindChallengeKey;
  value: MindChallengeConfig;
  onChange: (next: MindChallengeConfig) => void;
}

export const MindChallengeConfigPanel = ({ challengeKey, value, onChange }: Props) => {
  const info = mindLevelInfo[challengeKey];
  const meta = TITLES[challengeKey];
  const setLevel = (level: MindLevel) => onChange({ ...value, level });
  const setRounds = (rounds: number) => onChange({ ...value, rounds });

  return (
    <div className="space-y-4 p-3 sm:p-4 rounded-xl border border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <span className="text-lg">{meta.icon}</span>
        <p className="text-sm font-semibold">{meta.title}</p>
      </div>

      <div>
        <Label className="text-xs font-medium mb-2 block text-muted-foreground">
          DIFFICULTY LEVEL
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {info.map((i) => (
            <Button
              key={i.level}
              type="button"
              variant={value.level === i.level ? "default" : "outline"}
              size="sm"
              className="px-0"
              onClick={() => setLevel(i.level)}
            >
              {i.level}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {info.find((l) => l.level === value.level)?.description}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-medium text-muted-foreground">NUMBER OF ROUNDS</Label>
          <span className="text-sm font-bold tabular-nums text-primary">{value.rounds}</span>
        </div>
        <Slider
          value={[value.rounds]}
          onValueChange={(v) => setRounds(v[0])}
          min={MIND_MIN_ROUNDS}
          max={MIND_MAX_ROUNDS}
          step={1}
          className="py-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
          <span>{MIND_MIN_ROUNDS}</span>
          <span>~{Math.ceil((value.rounds * (value.timePerRound || 30)) / 60)} min max</span>
          <span>{MIND_MAX_ROUNDS}</span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {value.timePerRound || 30}s per round. Wrong answers and timeouts regenerate a fresh round at the same level — finish all {value.rounds} to dismiss the alarm. {meta.tail}
      </p>
    </div>
  );
};
