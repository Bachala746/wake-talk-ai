## Body Wake-Up Challenges — Implementation Plan

Add a proper "Body Wake-Up" category with four dedicated challenges, honoring the app-wide global rules (5 levels × 3–30 rounds × 30 s timer × fail-restarts-round × success animation).

### 1. New challenge types

Extend `ChallengeType` in `src/lib/alarmSettings.ts`:

- `jump` — Jump Challenge — reps per level: **5 / 10 / 15 / 20 / 25**
- `squat` — Squat Challenge — reps per level: **5 / 10 / 15 / 20 / 25**
- `pushup` — Push-Up Challenge — reps per level: **3 / 6 / 10 / 15 / 20**
- `walk` — Walking Challenge — steps per level: **20 / 40 / 60 / 80 / 100**

`walk` supersedes the ad-hoc `steps` type for the Body category (kept for back-compat). Register each in `challengeTypes`, add to `body` category, add `MindChallengeLevelInfo[]` copy with the per-level reps, and add per-type `MindChallengeConfig` slots (`jumpSettings`, `squatSettings`, `pushupSettings`, `walkSettings`) with `defaultMindChallengeConfig`.

### 2. Detection strategy (client-only, no ML server)

All four use `DeviceMotionEvent` accelerometer where available; graceful "Tap to count" fallback when sensors are unavailable / permission denied (desktop preview, iOS without motion permission).

Shared low-pass filter + peak detector in a new hook `src/hooks/useMotionRepCounter.ts`:

- Reads `event.accelerationIncludingGravity` at ~30 Hz.
- Computes magnitude minus gravity, applies EMA smoothing.
- Detects a rep when magnitude crosses an **up-threshold**, then falls back below a **down-threshold** with a minimum interval (debounce). One rep = one full up/down cycle.

Per-challenge tuning (thresholds + min interval):

| Type   | up g | down g | min ms | notes |
|--------|------|--------|--------|-------|
| jump   | 1.6  | 0.4    | 350    | high peak, fast landing |
| squat  | 0.55 | 0.15   | 700    | slow vertical cadence |
| pushup | 0.45 | 0.10   | 900    | phone on floor / arm; low-magnitude cadence |
| walk   | 1.15 | 0.6    | 300    | standard step detection |

Ranges chosen conservatively; each is exposed as a const so it's tunable without touching the hook. Squat/push-up detection is genuinely noisy on a phone accelerometer alone (no camera-pose model shipped in-browser), so each challenge shows a "Tap when you complete a rep" fallback button that's always available — the user's request stresses "resistant to false counts", which means we'd rather under-count than fabricate reps.

### 3. UI — `src/components/BodyRepChallenge.tsx` (new)

Single component parametrized by `{ kind: 'jump' | 'squat' | 'pushup' | 'walk', targetReps, onComplete, onFail }`:

- Big animated rep counter `count / target`.
- Circular progress ring + linear progress bar + % complete.
- Pulses / flashes on each detected rep, optional `navigator.vibrate(60)`.
- "Tap rep" fallback button (always visible, smaller).
- Emits `onComplete` when `count >= target`, `onFail` on 30 s timeout (handled by `MultiRoundChallenge` — the component itself is stateless about timing).

### 4. Level-Details pre-screen — `src/components/BodyChallengeIntro.tsx` (new)

Shown for **every** body challenge before Round 1 starts. Renders the full 5-level table for the selected challenge with the user's current level highlighted, plus a "Start" button. Dismissible once per alarm run (state kept in `MultiRoundChallenge`).

### 5. Wire into the runner

- `src/components/WakeUpChallenge.tsx`: add render branches for `jump | squat | pushup | walk` that mount `BodyRepChallenge` with the per-level rep target derived from `difficulty` (via `levelToDifficulty` reverse mapping — we pass the raw level down through a new prop or read from `mathSettings.level`-style config; simpler: read the config directly in `ChallengeHost` and pass `targetReps` as a new prop on `WakeUpChallenge`).
- `src/components/MultiRoundChallenge.tsx`: extend `ROUND_RUNNER_TYPES` set and `CHALLENGE_LABEL` map; render `BodyChallengeIntro` before the first round if not yet dismissed.
- `src/components/ChallengeHost.tsx`: add the four new types to `ROUND_RUNNER_TYPES` and `pickConfig`.

### 6. Alarm editor — `src/components/AlarmClock.tsx`

- Add state hooks `jumpSettings / squatSettings / pushupSettings / walkSettings`.
- Reuse `MindChallengeConfigPanel` (level 1–5 + rounds 3–30 slider) for each — same pattern already used for existing challenges.
- Save/load/reset wiring identical to existing per-challenge configs.

### 7. Success flow

No change — `ChallengeHost` already shows `ChallengeSuccessOverlay` (motivational message + animation) when `onComplete` fires after all rounds. XP / streak / history hooks already wired for other challenges apply automatically.

### 8. Verification

- `tsgo --noEmit` clean build.
- Manual smoke: pick each of the 4 challenges in the alarm editor, set level 2 / 3 rounds, trigger alarm — confirm intro screen, 30 s timer, tap-fallback increments counter, completion triggers success overlay.

### Files touched

New:
- `src/hooks/useMotionRepCounter.ts`
- `src/components/BodyRepChallenge.tsx`
- `src/components/BodyChallengeIntro.tsx`

Edited:
- `src/lib/alarmSettings.ts` (types, defaults, level info, category)
- `src/components/WakeUpChallenge.tsx` (render branches)
- `src/components/MultiRoundChallenge.tsx` (intro screen, new types)
- `src/components/ChallengeHost.tsx` (config routing)
- `src/components/AlarmClock.tsx` (config panels + persistence)

### Note on honesty

Real form-checked squat / push-up detection needs a camera + pose model (MediaPipe / TF.js), which is a much larger change (200+ MB of ML, camera permission flow, on-device inference perf). This plan ships accelerometer-based rep counting with a manual tap fallback — accurate enough for jumping and walking, best-effort with fallback for squats / push-ups. If you want camera-based pose detection, that's a separate follow-up I'd scope on its own.

Confirm and I'll build it.