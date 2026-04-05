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
    <div className="mx-4 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
      <div className="flex items-start gap-2">
        <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-destructive">
              Anti-Cheat Penalties Active
            </p>
            {daysSince >= 3 && (
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Dismiss penalties"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {penalties.streakReset && (
              <li>• Streak was reset</li>
            )}
            {penalties.difficultyBoost > 0 && (
              <li>• Difficulty increased by +{penalties.difficultyBoost} level{penalties.difficultyBoost > 1 ? "s" : ""}</li>
            )}
            {penalties.forcedHarderChallenge && (
              <li>• Next alarm forced to hard difficulty</li>
            )}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Last violation: {daysSince === 0 ? "today" : `${daysSince} day${daysSince !== 1 ? "s" : ""} ago`}
          </p>
        </div>
      </div>
    </div>
  );
}
