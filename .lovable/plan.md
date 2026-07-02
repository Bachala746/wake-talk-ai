## Global Challenge Rules — Unify Every Category

Extend the existing Mind Wake-Up framework (5 levels × 3–30 rounds × 30s timer × randomized, non-repeating rounds) to **every** challenge category: Body, Reality, and Interaction. Today only Mind challenges (Math, Typing, Memory, Pattern, Slider, Captcha) fully honor these rules. Others (Speak & Match, QR, Object Verify, physical challenges, etc.) use ad-hoc configs.

### 1. Data model — `src/lib/alarmSettings.ts`
- Introduce a shared `ChallengeConfig { level: 1–5, rounds: 3–30, timePerRound: 30 }`.
- Add per-challenge configs to `AlarmSettings` for the missing types:
  - Body: `jumpingJacksSettings`, `squatsSettings`, `pushupsSettings`, `stretchSettings` (whichever exist in `challengeTypes`).
  - Reality: `qrSettings`, `objectVerifySettings` (extend existing), `photoSettings`.
  - Interaction: `speakMatchSettings` (extend), `voiceResponseSettings`, `conversationSettings`.
- Keep existing type-specific fields (e.g. `requiredPhrase`, `targetObject`) and just add `level` + `rounds` to each.
- Update `defaultAlarmSettings` and migration/load logic to backfill.

### 2. Generators — `src/lib/challengeGenerators.ts` (new) + extend `mindChallengeGenerators.ts`
- For each non-Mind challenge, add a `generate(level, used)` producing a fresh round per attempt:
  - Body: rep counts, tempo, hold time scaling by level.
  - Reality: object list rotation, QR variance, verification strictness by level.
  - Interaction: phrase difficulty, response length, tone strictness by level.

### 3. Runner reuse — `src/hooks/useMindRoundRunner.ts`
- Rename mental model to `useChallengeRoundRunner` (keep old export as alias) — already generic. Use it verbatim for all new categories.
- Confirms: 30s timer, no-repeat set, wrong/timeout regenerates without advancing, `onAllComplete` fires only after N rounds.

### 4. UI — `src/components/WakeUpChallenge.tsx`
- Convert the remaining challenge render blocks (Speak & Match, QR, Object Verify, Body challenges, etc.) to the runner + `MindRoundHeader` (rename header component to `ChallengeRoundHeader`, keep alias).
- Preserve category-specific UI (camera, mic waveform, rep counter) inside the round body.
- Wire progress bar, level dots, streak, and completion summary identically to Mind.

### 5. Alarm editor — `src/components/AlarmClock.tsx`
- Reuse `MindChallengeConfigPanel` (rename to `ChallengeConfigPanel`) for every challenge type in the alarm editor: category → challenge → level 1–5 → rounds 3–30 slider with time estimate.
- Save/load/reset each config to `AlarmSettings`.

### 6. Plumbing
- Forward all new configs through `VoiceCall`, `TwoWayVoiceCall`, `RealtimeTwoWayCall`, and `SequentialChallengeRunner` (mirroring the existing typing/memory/pattern/slider/captcha props).
- `SequentialChallengeRunner` already threads Mind configs; extend it to thread Body/Reality/Interaction configs too, and use `challenge.config ?? global<Type>Settings ?? default`.

### 7. Rewards & analytics
- On `onAllComplete`, keep existing success flow: XP, streak increment, achievement check, history entry. Ensure history logs `{category, challenge, level, rounds, failures, duration}` for every category (extend `alarmHistory.ts` schema).

### 8. Verification
- Type-check the project.
- Manually walk through one challenge per category via the alarm editor → confirm config UI, live preview of round count / time estimate, and that runner enforces N rounds with 30s timeout.

### Technical notes
- Backwards compat: on load, if a challenge's config lacks `level`/`rounds`, inject defaults (`level: 1`, `rounds: 5`, `timePerRound: 30`).
- Keep existing anti-cheat / escalation hooks — they fire on `onFail` from the runner unchanged.
- No backend changes required; all state is client-side per alarm.

### Scope check
This is a large refactor touching ~10 files and introducing new configs, generators, and UI panels for ~8 additional challenges. Confirm before I proceed, or tell me to narrow the first pass (e.g. "Body only first", or "just wire the config UI and defer new generators").