## Goal
Match the Light Theme's typographic richness, depth, and "premium glow" in Dark Mode for `WakeUpSuccessScreen`, without changing the established dark navy/indigo/violet color palette, backgrounds, gradients, or layout.

## Scope
Only `src/components/WakeUpSuccessScreen.tsx`. No changes to layout, spacing, components, icons, or color tokens. All enhancements use the existing indigo/blue/violet dark palette.

## Changes

### 1. "You're Awake!" heading
- Add a layered text-glow using `text-shadow` (soft indigo + tight white-ish core) so the gradient text feels luminous like the orange glow in light mode.
- Slightly increase font weight emphasis via `drop-shadow` on the gradient span.
- Brighten gradient stops (within current blue→indigo→violet palette) for more punch.

### 2. Wake-up time ("10:49")
- Add multi-layer glow: outer indigo halo + inner white core via `text-shadow`.
- Add a subtle radial highlight behind the number (absolutely-positioned blurred indigo orb inside the card) to mirror the warm radial bloom under the light-mode time.
- Strengthen the gradient (white → light indigo) and add `drop-shadow` for depth.
- Make the "WOKE UP AT" label brighter/bolder with tighter letter-spacing emphasis and a faint glow.

### 3. Streak card ("1 day")
- Add glow to the number ("1 day") and a soft inner highlight band at the top of the card (white/5 gradient sheen) for depth parity with light mode.
- Add a subtle drop-shadow to the Flame/Trophy icon in indigo.
- Brighten the supporting label text.

### 4. Quote card
- Add a faint inner highlight (top gradient) and slight glow on the opening quote mark area.
- Brighten italic quote text contrast and add subtle text-shadow.
- Author name gets a tiny indigo glow for emphasis.

### 5. Card depth
- Add an inner top highlight (1px gradient line / inset shadow) and a stronger outer shadow stack using indigo tones for more pronounced layering, matching the light card's warm shadow depth.

### Technical notes
- All glows use `hsl(...)` within existing dark palette (indigo 220–260 range), implemented via inline `style={{ textShadow: ... }}` and Tailwind utilities (`drop-shadow-[...]`).
- No new dependencies. No changes to `index.css` or `tailwind.config.ts`.
- Light Mode branches untouched.

## Out of scope
Background, gradients, orbs, aurora, sparkles, button styles, layout, typography sizes/weights structure, and any other component.
