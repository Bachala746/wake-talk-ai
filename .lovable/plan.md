## Remove rotating ray spokes and ring glow from sun icon

In `src/components/WakeUpSuccessScreen.tsx`, simplify the animated sun (lines ~146–197) by removing two decorative layers:

1. **Rotating ray spokes** — the `<svg>` block (lines 156–178) that renders 12 rotating lines around the sun.
2. **Inner rotating ring** — the bordered `<span>` (lines 180–185) that spins in reverse.

Keep:
- The outer blurred glow halo (`pulse-glow`)
- The central gradient sun disc with the `Sun` lucide icon and `gentle-bounce` animation

Result: a cleaner sun icon with just the soft glow + bouncing disc — no rotating spokes or ring outline.

No other files affected. The `spin-slow` keyframe stays (still used elsewhere, e.g. `TwoWayVoiceCall`).