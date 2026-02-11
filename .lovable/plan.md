
# Dark Mode / Nighttime Theme

## Overview
Add a dark mode toggle that transforms the warm sunrise aesthetic into a cool moonlight/nighttime theme. The toggle will persist in `localStorage` and be accessible from the main screen.

## What Changes

### 1. Theme Toggle Button
- A Moon/Sun icon toggle in the top-right corner of the main screen
- Clicking toggles between light (sunrise) and dark (moonlight) mode
- Preference saved to `localStorage` so it persists between sessions

### 2. Dark Theme Color Palette
Update the existing `.dark` CSS variables in `index.css` with a moonlight-inspired palette:
- Deep navy/indigo backgrounds instead of amber/warm tones
- Cool blue/purple accents instead of orange
- Moonlight-silver text tones
- Updated gradients: dawn gradients become night-sky gradients
- Updated glassmorphism: warm glass becomes cool frosted glass
- Updated glow animations: orange glows become blue/purple glows

### 3. Component Updates
The hardcoded gradient classes (e.g., `from-amber-100 via-orange-200`) throughout components need to become theme-aware using conditional classes based on dark mode state:

- **AlarmClock.tsx** -- Hero background, feature cards, buttons, and content section gradients
- **VoiceCall.tsx / TwoWayVoiceCall.tsx / RealtimeTwoWayCall.tsx** -- Call screen backgrounds
- **WakeUpChallenge.tsx** -- Challenge card accent colors
- **ElevenLabsQuotaPanel.tsx** -- Panel styling

### 4. New Hook: `useTheme`
A simple custom hook (`src/hooks/useTheme.ts`) that:
- Reads initial theme from `localStorage` (defaults to light)
- Toggles the `dark` class on the `<html>` element
- Returns `{ isDark, toggleTheme }`

## Technical Details

### Files to Create
- `src/hooks/useTheme.ts` -- Theme state management hook

### Files to Modify
- `src/index.css` -- Update `.dark` variables with moonlight palette, add dark-mode gradient variables, add dark variants for glow keyframes
- `src/components/AlarmClock.tsx` -- Add theme toggle button, use conditional classes for gradients
- `src/components/VoiceCall.tsx` -- Dark-aware background
- `src/components/TwoWayVoiceCall.tsx` -- Dark-aware background
- `src/components/RealtimeTwoWayCall.tsx` -- Dark-aware background
- `src/components/WakeUpChallenge.tsx` -- Dark-aware accent colors
- `src/components/ElevenLabsQuotaPanel.tsx` -- Dark-aware panel styling

### Approach
- Use Tailwind's `dark:` prefix where possible for simple overrides
- For complex hardcoded gradients, use the `isDark` boolean from the hook to swap class names
- The `.dark` class on `<html>` enables Tailwind's dark mode (already configured as `darkMode: ["class"]` in `tailwind.config.ts`)
