import { ChallengeType } from "./alarmSettings";

export interface AlarmHistoryEntry {
  id: string;
  date: string; // ISO date string
  wakeUpTime: string; // HH:MM
  alarmTime: string; // HH:MM scheduled
  snoozeCount: number;
  challengeType: ChallengeType;
  challengeSucceeded: boolean;
  challengeFailures: number;
  durationSeconds: number; // time from alarm trigger to dismissal
}

const HISTORY_KEY = "alarm-history";
const MAX_ENTRIES = 200;

export function getAlarmHistory(): AlarmHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AlarmHistoryEntry[];
  } catch {
    return [];
  }
}

export function addAlarmHistoryEntry(entry: Omit<AlarmHistoryEntry, "id">): void {
  const history = getAlarmHistory();
  history.unshift({ ...entry, id: crypto.randomUUID() });
  // Keep only latest entries
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearAlarmHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// Analytics helpers
export function getBestWakeUpTime(history: AlarmHistoryEntry[]): string | null {
  if (history.length === 0) return null;
  const timeCounts: Record<string, number> = {};
  history.forEach(e => {
    const hour = e.wakeUpTime.split(":")[0];
    const bucket = `${hour}:00`;
    timeCounts[bucket] = (timeCounts[bucket] || 0) + 1;
  });
  return Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function getMostEffectiveChallenge(history: AlarmHistoryEntry[]): { type: ChallengeType; successRate: number } | null {
  const challenges = history.filter(e => e.challengeType !== 'none');
  if (challenges.length === 0) return null;
  
  const stats: Record<string, { success: number; total: number }> = {};
  challenges.forEach(e => {
    if (!stats[e.challengeType]) stats[e.challengeType] = { success: 0, total: 0 };
    stats[e.challengeType].total++;
    if (e.challengeSucceeded) stats[e.challengeType].success++;
  });

  let best: { type: ChallengeType; successRate: number } | null = null;
  Object.entries(stats).forEach(([type, s]) => {
    const rate = s.total > 0 ? s.success / s.total : 0;
    if (!best || rate > best.successRate || (rate === best.successRate && s.total > stats[best.type]?.total)) {
      best = { type: type as ChallengeType, successRate: rate };
    }
  });
  return best;
}

export function getWakeUpTrends(history: AlarmHistoryEntry[], days: number = 14): { date: string; time: number; snoozes: number }[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return history
    .filter(e => new Date(e.date) >= cutoff)
    .map(e => {
      const [h, m] = e.wakeUpTime.split(":").map(Number);
      return {
        date: new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        time: h + m / 60,
        snoozes: e.snoozeCount,
      };
    })
    .reverse();
}

export function getAverageSnoozes(history: AlarmHistoryEntry[]): number {
  if (history.length === 0) return 0;
  return history.reduce((sum, e) => sum + e.snoozeCount, 0) / history.length;
}

export function getChallengeStats(history: AlarmHistoryEntry[]): { type: string; succeeded: number; failed: number }[] {
  const stats: Record<string, { succeeded: number; failed: number }> = {};
  history.filter(e => e.challengeType !== 'none').forEach(e => {
    if (!stats[e.challengeType]) stats[e.challengeType] = { succeeded: 0, failed: 0 };
    if (e.challengeSucceeded) stats[e.challengeType].succeeded++;
    else stats[e.challengeType].failed++;
  });
  return Object.entries(stats).map(([type, s]) => ({ type, ...s }));
}
