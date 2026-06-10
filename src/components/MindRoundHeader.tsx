import { Progress } from "@/components/ui/progress";
import { Timer } from "lucide-react";

interface MindRoundHeaderProps {
  level: 1 | 2 | 3 | 4 | 5;
  round: number;        // 0-indexed
  totalRounds: number;
  timeLeft: number;
  timePerRound: number;
  completedLabel?: string;
}

/**
 * Shared progress header for all Mind Wake-Up challenges.
 * Shows Level X/5, Round Y/Z, completion %, and the per-round countdown bar.
 */
export const MindRoundHeader = ({
  level,
  round,
  totalRounds,
  timeLeft,
  timePerRound,
  completedLabel,
}: MindRoundHeaderProps) => {
  const pct = Math.min(100, Math.round((round / Math.max(totalRounds, 1)) * 100));
  const danger = timeLeft <= 5;
  return (
    <div className="space-y-2 mb-3 sm:mb-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
          Level {level} / 5
        </span>
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground tabular-nums">
          {completedLabel ?? `Round ${Math.min(round + 1, totalRounds)} of ${totalRounds}`} · {pct}%
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Timer
            className={`h-3.5 w-3.5 ${danger ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}
          />
          <span
            className={`text-xs font-bold tabular-nums ${danger ? "text-red-500" : "text-muted-foreground"}`}
          >
            {timeLeft}s
          </span>
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
          {totalRounds - round} left
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            danger ? "bg-red-500" : "bg-gradient-to-r from-orange-400 to-amber-500"
          }`}
          style={{ width: `${(timeLeft / Math.max(timePerRound, 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};
