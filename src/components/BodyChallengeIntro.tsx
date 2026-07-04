import { Button } from "@/components/ui/button";
import { BODY_CHALLENGE_UNIT, BODY_REP_TARGETS, MindLevel } from "@/lib/alarmSettings";
import { RepKind } from "@/hooks/useMotionRepCounter";

interface Props {
  kind: RepKind;
  level: MindLevel;
  rounds: number;
  onStart: () => void;
}

const TITLE: Record<RepKind, string> = {
  jump: "Jump Challenge",
  squat: "Squat Challenge",
  pushup: "Push-Up Challenge",
  walk: "Walking Challenge",
};

const ICON: Record<RepKind, string> = {
  jump: "🤸",
  squat: "🏋️",
  pushup: "💪",
  walk: "🚶",
};

/**
 * Level-Details pre-screen shown before Round 1 of any Body challenge, so
 * the user sees exactly what's expected at each of the 5 levels and which
 * one they'll play now.
 */
export const BodyChallengeIntro = ({ kind, level, rounds, onStart }: Props) => {
  const levels: MindLevel[] = [1, 2, 3, 4, 5];
  const targets = BODY_REP_TARGETS[kind];
  const unit = BODY_CHALLENGE_UNIT[kind];

  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-5 rounded-2xl bg-card/70 border border-border animate-fade-in">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="text-5xl">{ICON[kind]}</div>
        <h2 className="text-xl font-black">{TITLE[kind]}</h2>
        <p className="text-xs text-muted-foreground">
          Complete <span className="font-bold text-foreground tabular-nums">{targets[level]}</span> {unit.toLowerCase()} × <span className="font-bold text-foreground tabular-nums">{rounds}</span> round{rounds === 1 ? "" : "s"} · 30s per round
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-2 bg-muted/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Level</span>
          <span className="text-right">Target</span>
        </div>
        {levels.map((l) => {
          const active = l === level;
          return (
            <div
              key={l}
              className={`grid grid-cols-2 px-3 py-2.5 text-sm border-t border-border ${
                active ? "bg-primary/10 text-primary font-bold" : ""
              }`}
            >
              <span className="tabular-nums">Level {l}{active ? " · your level" : ""}</span>
              <span className="text-right tabular-nums">
                {targets[l]} {unit}
              </span>
            </div>
          );
        })}
      </div>

      <ul className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
        <li>• Every round has a 30-second timer.</li>
        <li>• Incomplete rounds restart — progress only advances on success.</li>
        <li>• Alarm dismisses only after all {rounds} round{rounds === 1 ? "" : "s"} pass.</li>
      </ul>

      <Button type="button" className="w-full h-12 text-base font-bold" onClick={onStart}>
        Start Round 1
      </Button>
    </div>
  );
};
