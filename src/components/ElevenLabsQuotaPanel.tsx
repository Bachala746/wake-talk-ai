import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuotaData {
  characterCount: number;
  characterLimit: number;
  percentUsed: number;
}

export const ElevenLabsQuotaPanel = () => {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("text-to-speech", {
        body: { text: "", voiceStyle: "gentle", checkQuotaOnly: true },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.quotaInfo) { setQuota(data.quotaInfo); } else { setError("Could not retrieve quota info"); }
    } catch (e) {
      console.error("Quota fetch error:", e);
      setError("Failed to check credits");
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchQuota(); }, [fetchQuota]);

  const remaining = quota ? quota.characterLimit - quota.characterCount : 0;
  const percentRemaining = quota ? 100 - quota.percentUsed : 0;

  const getStatusColor = () => {
    if (!quota) return "text-muted-foreground";
    if (quota.percentUsed >= 95) return "text-red-600";
    if (quota.percentUsed >= 80) return "text-amber-600";
    return "text-emerald-600";
  };

  const getProgressColor = () => {
    if (!quota) return "";
    if (quota.percentUsed >= 95) return "[&>div]:bg-red-500";
    if (quota.percentUsed >= 80) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-emerald-500";
  };

  const getStatusIcon = () => {
    if (!quota) return null;
    if (quota.percentUsed >= 80) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <Card className="p-4 sm:p-5 backdrop-blur-sm border shadow-md bg-white/80 border-white/50 dark:bg-slate-800/80 dark:border-slate-700/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2 rounded-xl shadow-md">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">ElevenLabs Credits</h3>
              <p className="text-xs text-muted-foreground">Voice synthesis usage</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchQuota} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {error ? (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button variant="link" size="sm" onClick={fetchQuota} className="text-xs mt-1">Try again</Button>
          </div>
        ) : quota ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Used</span>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon()}
                  <span className={`font-semibold ${getStatusColor()}`}>{percentRemaining}% remaining</span>
                </div>
              </div>
              <Progress value={quota.percentUsed} className={`h-2.5 bg-muted/50 ${getProgressColor()}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">{remaining.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Characters left</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">{quota.characterLimit.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total quota</p>
              </div>
            </div>

            {quota.percentUsed >= 80 && (
              <div className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                quota.percentUsed >= 95 
                  ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/30"
                  : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/30"
              }`}>
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {quota.percentUsed >= 95
                    ? "Credits almost depleted! The app will fall back to browser voice when exhausted."
                    : "Credits running low. Consider topping up your ElevenLabs account soon."}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground ml-2">Loading...</span>
          </div>
        )}
      </div>
    </Card>
  );
};
