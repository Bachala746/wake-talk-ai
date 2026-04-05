import { ChallengeType } from './alarmSettings';

const ALARM_STATE_KEY = 'anti_cheat_alarm_state';
const CHEAT_PENALTIES_KEY = 'anti_cheat_penalties';
const HEARTBEAT_KEY = 'anti_cheat_heartbeat';
const FORCE_CLOSE_KEY = 'anti_cheat_force_closes';

export interface ActiveAlarmState {
  alarmActive: boolean;
  alarmCompleted: boolean;
  startTime: number; // Date.now()
  alarmTime: string;
  talkDuration: number;
  challengeType: ChallengeType;
  difficulty: 'easy' | 'medium' | 'hard';
  settingsJson: string; // serialized AlarmSettings
  isTestCall: boolean;
  lastHeartbeat: number;
  forceCloseCount: number;
  cheatingDetected: boolean;
  difficultyEscalations: number;
}

export interface CheatPenalties {
  streakReset: boolean;
  difficultyBoost: number; // 0-3, added escalation levels
  forcedHarderChallenge: boolean;
  lastPenaltyDate: string;
}

// Save active alarm state
export function saveAlarmState(state: ActiveAlarmState): void {
  localStorage.setItem(ALARM_STATE_KEY, JSON.stringify(state));
}

// Get active alarm state
export function getAlarmState(): ActiveAlarmState | null {
  try {
    const raw = localStorage.getItem(ALARM_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveAlarmState;
  } catch {
    return null;
  }
}

// Clear alarm state (alarm completed successfully)
export function clearAlarmState(): void {
  localStorage.removeItem(ALARM_STATE_KEY);
  localStorage.removeItem(FORCE_CLOSE_KEY);
}

// Mark alarm as completed
export function markAlarmCompleted(): void {
  const state = getAlarmState();
  if (state) {
    state.alarmCompleted = true;
    state.alarmActive = false;
    saveAlarmState(state);
  }
  // Clear after a short delay so we can read it if needed
  setTimeout(() => clearAlarmState(), 2000);
}

// Heartbeat: update timestamp periodically while alarm is active
export function updateHeartbeat(): void {
  const now = Date.now();
  localStorage.setItem(HEARTBEAT_KEY, now.toString());
  const state = getAlarmState();
  if (state && state.alarmActive) {
    state.lastHeartbeat = now;
    saveAlarmState(state);
  }
}

// Detect time manipulation: compare stored heartbeat with current time
export function detectTimeManipulation(): { manipulated: boolean; jumpSeconds: number } {
  const lastHeartbeat = localStorage.getItem(HEARTBEAT_KEY);
  if (!lastHeartbeat) return { manipulated: false, jumpSeconds: 0 };

  const lastTime = parseInt(lastHeartbeat, 10);
  const now = Date.now();
  const diff = now - lastTime;

  // If time jumped backwards or forward by more than 5 minutes unexpectedly
  // (heartbeat should be updated every 10 seconds, so >5min gap while alarm was active = suspicious)
  if (diff < -5000) {
    // Time went backwards — definite manipulation
    return { manipulated: true, jumpSeconds: Math.abs(diff / 1000) };
  }

  const state = getAlarmState();
  if (state?.alarmActive && diff > 300_000) {
    // More than 5 minutes since last heartbeat while alarm was active
    // Could be force close + time change
    return { manipulated: true, jumpSeconds: diff / 1000 };
  }

  return { manipulated: false, jumpSeconds: 0 };
}

// Track force close count
export function incrementForceCloseCount(): number {
  const state = getAlarmState();
  if (state) {
    state.forceCloseCount = (state.forceCloseCount || 0) + 1;
    saveAlarmState(state);
    return state.forceCloseCount;
  }
  return 0;
}

// Get escalated difficulty based on cheat attempts
export function getEscalatedDifficulty(
  baseDifficulty: 'easy' | 'medium' | 'hard',
  escalations: number
): 'easy' | 'medium' | 'hard' {
  const levels: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  const baseIndex = levels.indexOf(baseDifficulty);
  const newIndex = Math.min(baseIndex + escalations, 2);
  return levels[newIndex];
}

// Apply penalties for cheating
export function applyCheatPenalty(reason: string): CheatPenalties {
  const existing = getCheatPenalties();
  const penalties: CheatPenalties = {
    streakReset: true,
    difficultyBoost: Math.min((existing?.difficultyBoost || 0) + 1, 3),
    forcedHarderChallenge: true,
    lastPenaltyDate: new Date().toISOString(),
  };
  localStorage.setItem(CHEAT_PENALTIES_KEY, JSON.stringify(penalties));
  console.warn(`[Anti-Cheat] Penalty applied: ${reason}`);
  return penalties;
}

// Get current penalties
export function getCheatPenalties(): CheatPenalties | null {
  try {
    const raw = localStorage.getItem(CHEAT_PENALTIES_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheatPenalties;
  } catch {
    return null;
  }
}

// Clear penalties (e.g., after successful streak rebuilding)
export function clearCheatPenalties(): void {
  localStorage.removeItem(CHEAT_PENALTIES_KEY);
}

// Check on app open: was there an active uncompleted alarm?
export function checkForUncompletedAlarm(): {
  hasUncompletedAlarm: boolean;
  state: ActiveAlarmState | null;
  wasForceClose: boolean;
  wasTimeManipulated: boolean;
  forceCloseCount: number;
} {
  const state = getAlarmState();

  if (!state || state.alarmCompleted || !state.alarmActive) {
    return {
      hasUncompletedAlarm: false,
      state: null,
      wasForceClose: false,
      wasTimeManipulated: false,
      forceCloseCount: 0,
    };
  }

  // Alarm was active but not completed — user closed app / restarted phone
  const timeCheck = detectTimeManipulation();
  const forceCloseCount = incrementForceCloseCount();

  if (timeCheck.manipulated) {
    state.cheatingDetected = true;
    state.difficultyEscalations = (state.difficultyEscalations || 0) + 1;
    saveAlarmState(state);
    applyCheatPenalty('time_manipulation');
  }

  if (forceCloseCount >= 3) {
    state.cheatingDetected = true;
    state.difficultyEscalations = (state.difficultyEscalations || 0) + 1;
    saveAlarmState(state);
    applyCheatPenalty('repeated_force_close');
  }

  return {
    hasUncompletedAlarm: true,
    state,
    wasForceClose: true,
    wasTimeManipulated: timeCheck.manipulated,
    forceCloseCount,
  };
}

// Start heartbeat interval (call when alarm becomes active)
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat(): void {
  stopHeartbeat();
  updateHeartbeat();
  heartbeatInterval = setInterval(updateHeartbeat, 10_000); // every 10s
}

export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
