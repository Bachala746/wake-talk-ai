import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Clock, TrendingUp, Trophy, Zap, BarChart3 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  getAlarmHistory,
  clearAlarmHistory,
  getBestWakeUpTime,
  getMostEffectiveChallenge,
  getWakeUpTrends,
  getAverageSnoozes,
  getChallengeStats,
} from "@/lib/alarmHistory";
import { challengeTypes } from "@/lib/alarmSettings";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const formatTimeValue = (val: number) => {
  const h = Math.floor(val);
  const m = Math.round((val - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const getChallengeLabel = (type: string) =>
  challengeTypes.find((c) => c.value === type)?.label ?? type;

const History = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [history, setHistory] = useState(() => getAlarmHistory());

  const trends = useMemo(() => getWakeUpTrends(history, 14), [history]);
  const bestTime = useMemo(() => getBestWakeUpTime(history), [history]);
  const bestChallenge = useMemo(() => getMostEffectiveChallenge(history), [history]);
  const avgSnoozes = useMemo(() => getAverageSnoozes(history), [history]);
  const challengeData = useMemo(() => getChallengeStats(history), [history]);

  const chartColors = {
    line: isDark ? "hsl(25, 100%, 60%)" : "hsl(25, 100%, 55%)",
    bar: isDark ? "hsl(200, 100%, 65%)" : "hsl(200, 100%, 50%)",
    barSuccess: isDark ? "hsl(142, 60%, 55%)" : "hsl(142, 70%, 40%)",
    barFail: isDark ? "hsl(0, 70%, 60%)" : "hsl(0, 70%, 50%)",
    grid: isDark ? "hsl(240, 10%, 25%)" : "hsl(25, 20%, 88%)",
    text: isDark ? "hsl(240, 10%, 65%)" : "hsl(240, 10%, 45%)",
  };

  const handleClear = () => {
    if (window.confirm("Clear all alarm history? This cannot be undone.")) {
      clearAlarmHistory();
      setHistory([]);
    }
  };

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 ${
        isDark
          ? "bg-gradient-to-br from-[hsl(240,20%,10%)] via-[hsl(260,15%,15%)] to-[hsl(240,20%,10%)]"
          : "bg-[var(--gradient-morning)]"
      }`}
    >
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Alarm History
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={history.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {history.length === 0 ? (
          <Card className="p-8 text-center bg-card/80 backdrop-blur-lg border-border/50">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No alarm history yet. Dismiss an alarm to start tracking!
            </p>
          </Card>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`p-4 text-center ${
                  isDark ? "bg-card/70 border-border/40" : "bg-card/90 border-border/50"
                }`}
              >
                <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">{bestTime ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Best Wake-Up Hour</p>
              </Card>
              <Card
                className={`p-4 text-center ${
                  isDark ? "bg-card/70 border-border/40" : "bg-card/90 border-border/50"
                }`}
              >
                <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">{avgSnoozes.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Snoozes</p>
              </Card>
              <Card
                className={`p-4 text-center ${
                  isDark ? "bg-card/70 border-border/40" : "bg-card/90 border-border/50"
                }`}
              >
                <Trophy className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">
                  {bestChallenge ? getChallengeLabel(bestChallenge.type) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Best Challenge</p>
              </Card>
              <Card
                className={`p-4 text-center ${
                  isDark ? "bg-card/70 border-border/40" : "bg-card/90 border-border/50"
                }`}
              >
                <Zap className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">{history.length}</p>
                <p className="text-xs text-muted-foreground">Total Alarms</p>
              </Card>
            </div>

            {/* Wake-up time trend chart */}
            {trends.length > 1 && (
              <Card
                className={`p-4 ${
                  isDark ? "bg-card/70 border-border/40" : "bg-card/90 border-border/50"
                }`}
              >
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  Wake-Up Time Trend (14 days)
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: chartColors.text }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatTimeValue}
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 10, fill: chartColors.text }}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatTimeValue(val), "Wake-up"]}
                      contentStyle={{
                        backgroundColor: isDark ? "hsl(240,15%,18%)" : "hsl(0,0%,100%)",
                        borderColor: isDark ? "hsl(240,10%,30%)" : "hsl(25,20%,88%)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="time"
                      stroke={chartColors.line}
                      strokeWidth={2}
                      dot={{ r: 3, fill: chartColors.line }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Snooze trend */}
            {trends.length > 1 && (
              <Card
                className={`p-4 ${
                  isDark ? "bg-card/70 border-border/40" : "bg-card/90 border-border/50"
                }`}
              >
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  Snoozes per Alarm
                </h2>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: chartColors.text }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: chartColors.text }}
                      tickLine={false}
                      width={25}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "hsl(240,15%,18%)" : "hsl(0,0%,100%)",
                        borderColor: isDark ? "hsl(240,10%,30%)" : "hsl(25,20%,88%)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="snoozes" radius={[4, 4, 0, 0]}>
                      {trends.map((_, i) => (
                        <Cell key={i} fill={chartColors.bar} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Challenge effectiveness */}
            {challengeData.length > 0 && (
              <Card
                className={`p-4 ${
                  isDark ? "bg-card/70 border-border/40" : "bg-card/90 border-border/50"
                }`}
              >
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  Challenge Performance
                </h2>
                <div className="space-y-3">
                  {challengeData.map((c) => {
                    const total = c.succeeded + c.failed;
                    const rate = total > 0 ? Math.round((c.succeeded / total) * 100) : 0;
                    return (
                      <div key={c.type} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground font-medium">
                            {getChallengeLabel(c.type)}
                          </span>
                          <span className="text-muted-foreground">
                            {rate}% ({c.succeeded}/{total})
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${rate}%`,
                              backgroundColor: rate >= 70 ? chartColors.barSuccess : chartColors.barFail,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Recent history list */}
            <Card
              className={`p-4 ${
                isDark ? "bg-card/70 border-border/40" : "bg-card/90 border-border/50"
              }`}
            >
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Recent Alarms
              </h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.slice(0, 20).map((e) => (
                  <div
                    key={e.id}
                    className={`flex justify-between items-center text-xs p-2 rounded-lg ${
                      isDark ? "bg-muted/30" : "bg-muted/50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {new Date(e.date).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        Woke at {e.wakeUpTime}
                      </p>
                      <p className="text-muted-foreground">
                        {e.snoozeCount > 0 ? `${e.snoozeCount} snooze${e.snoozeCount > 1 ? "s" : ""}` : "No snoozes"}
                        {e.challengeType !== "none" &&
                          ` · ${getChallengeLabel(e.challengeType)} ${e.challengeSucceeded ? "✓" : "✗"}`}
                      </p>
                    </div>
                    <span className="text-muted-foreground">⏰ {e.alarmTime}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default History;
