import { useEffect, useState } from "react";
import { getCheatPenalties, CheatPenalties, clearCheatPenalties } from "@/lib/antiCheat";
import { ShieldAlert, X } from "lucide-react";

export function CheatPenaltyIndicator() {
  const [penalties, setPenalties] = useState<CheatPenalties | null>(null);

  useEffect(() => {
    setPenalties(getCheatPenalties());
  }, []);

  if (!penalties) return null;

  const penaltyDate = new Date(penalties.lastPenaltyDate);
  const daysSince = Math.floor((Date.now() - penaltyDate.getTime()) / 86400000);

  const handleDismiss = () => {
    clearCheatPenalties();
    setPenalties(null);
  };

  return (
    <div className="mx-4 mb-3 rounded-xl border border-destructive/30 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent p-3.5 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-destructive/15 p-1.5">
          <ShieldAlert className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-destructive tracking-tight">
              ⚠ Anti-Cheat Penalties Active
            </p>
            {daysSince >= 3 && (
              <button
                onClick={handleDismiss}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Dismiss penalties"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {penalties.streakReset && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-destructive/60" />
                Streak was reset
              </li>
            )}
            {penalties.difficultyBoost > 0 && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-destructive/60" />
                Difficulty increased by +{penalties.difficultyBoost} level{penalties.difficultyBoost > 1 ? "s" : ""}
              </li>
            )}
            {penalties.forcedHarderChallenge && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-destructive/60" />
                Next alarm forced to hard difficulty
              </li>
            )}
          </ul>
          <p className="mt-1.5 text-[11px] text-muted-foreground/60 italic">
            Last violation: {daysSince === 0 ? "today" : `${daysSince} day${daysSince !== 1 ? "s" : ""} ago`}
          </p>
        </div>
      </div>
    </div>
  );
}
