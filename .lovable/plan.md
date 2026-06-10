# Mind Wake-Up Challenge System — 5 Levels × 3–30 Rounds

Extend the existing challenge engine so **all six mind challenges** (Math, Typing, Memory, Pattern, Slider, Captcha) share the same level + rounds framework. Non-mind challenges (shake, steps, QR, barcode, speakMatch, objectVerify) stay as-is.

## 1. Settings model (`src/lib/alarmSettings.ts`)

Introduce a single shared interface used by every mind challenge:

```ts
interface MindChallengeConfig {
  level: 1 | 2 | 3 | 4 | 5;
  rounds: number;          // 3–30
  timePerRound: number;    // default 30
}
```

Add per-challenge entries inside `AlarmSettings`:
- `mathSettings` (already exists — migrate to new shape, keep `totalQuestions` → `rounds` with a back-compat read)
- `typingSettings`
- `memorySettings`
- `patternSettings`
- `sliderSettings`
- `captchaSettings`

Each defaults to `{ level: 1, rounds: 5, timePerRound: 30 }`. Add `mindLevelInfo` metadata for UI labels.

## 2. Round engine (`src/components/WakeUpChallenge.tsx`)

Replace each mind challenge's ad-hoc state with a shared "round runner" pattern:

```text
state per challenge:
  currentRound (0..rounds-1)
  timeLeft (30 → 0)
  feedback: 'correct' | 'wrong' | 'timeout' | null
  usedSet (prevent repeats this session)
  completed boolean
```

Behavior (same for all six):
- 30s countdown per round; timeout ⇒ treat as wrong.
- Wrong/timeout ⇒ show feedback ~900 ms, generate a new round at same level, **do not advance** `currentRound`.
- Correct ⇒ advance `currentRound`; when `currentRound === rounds`, fire success animation then `onComplete()`.
- Top header shows: `Level X/5 · Round Y/Z · 00:NN · NN%`.
- Progress bar driven by `currentRound / rounds`.

## 3. Per-challenge level generators

All generators take `(level, usedSet)` and return a fresh, unique payload.

- **Math** — already has 5 levels; keep logic, drop "questions per level" auto-advance.
- **Typing** — sentence pools per level (5–6 / 7–8 / 9–10 / 11–13 / 14–18 words). Compare with case-insensitive trim, require 100 % match.
- **Memory** — digit-count per level (5–6 / 7–8 / 9–10 / 11–12 / 13–16). Display time scales down (L5 fastest). Hide → numeric input.
- **Pattern** — sequence length per level (4–5 / 6–7 / 8–9 / 10–12 / 13–16) on a 4×4 grid; playback speed faster at higher levels.
- **Slider** — slider count per level (1 / 2 / 3 / 4 / 5+) with tightening tolerance (±5 / ±4 / ±3 / ±2 / ±1).
- **Captcha** — word length per level (3–4 / 5–6 / 7–8 / 9–10 / 10–14) with progressively heavier CSS-distortion (skew, rotation, noise overlay) at higher levels.

## 4. Configuration UI (`src/components/AlarmClock.tsx`)

When a mind challenge type is selected, render a shared config block:
- 5 level buttons (1–5) with short label per challenge.
- Slider for rounds (3–30) with live numeric readout.
- Persist via existing save/load/reset flow.

Math already has its panel — refactor to use the shared component so all six look identical.

## 5. Completion screen

Reuse the existing math completion UI (bouncing check + XP) for all mind challenges; show `rounds completed`, level, and a motivational line.

## 6. Plumbing

- Pass the new settings objects through `VoiceCall.tsx`, `TwoWayVoiceCall.tsx`, `RealtimeTwoWayCall.tsx`, and `SequentialChallengeRunner` exactly like `mathSettings` is passed today.
- No backend changes. No new dependencies.

## Out of scope

- Achievement badges / streaks beyond what already exists.
- Changes to shake, steps, barcode, QR, speakMatch, objectVerify.
- Voice motivation hook (already wired).

## Technical notes

- All level metadata lives in one place: `mindLevelInfo[challengeType][level]` returning `{ label, hint }` for UI.
- Generators are pure and live at the top of `WakeUpChallenge.tsx` next to the existing `generateMathQuestion`.
- Used-set is a `useRef<Set<string>>` per challenge so a session never repeats prompts.
- Timer uses a single `useEffect` keyed on `(currentRound, feedback)` to avoid leaks.
