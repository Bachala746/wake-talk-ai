// Per-level generators for the Mind Wake-Up Challenges.
// Each generator returns a unique payload not present in the supplied used-set.

type Level = 1 | 2 | 3 | 4 | 5;

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ─── TYPING ──────────────────────────────────────────────────────────────────
const TYPING_BY_LEVEL: Record<Level, string[]> = {
  1: [
    "Today will be a great day",
    "Wake up and stay focused",
    "Rise and shine right now",
    "You can do amazing things",
    "Make today truly count well",
    "Believe in yourself every morning",
  ],
  2: [
    "Start your day with a smile",
    "Small steps lead to big change",
    "Energy follows your morning intention",
    "Discipline carries you when motivation fades",
    "Choose progress instead of perfection today",
    "Your mind is sharpest right now",
  ],
  3: [
    "Every morning is a fresh chance to begin again",
    "Hard work today builds the life you really want",
    "Move your body and your mind will follow",
    "Quiet mornings often produce the loudest results later",
    "Stay curious and the world will keep teaching you",
    "Discipline is choosing what you want most over now",
  ],
  4: [
    "The first hour of your day shapes the entire mood ahead",
    "Consistent small habits compound into extraordinary lifetime results",
    "Wake up with purpose and the day will gladly cooperate",
    "Stay hungry stay humble and keep working when nobody watches",
    "Discipline beats motivation because discipline shows up on hard days",
    "Be grateful for this morning because not everyone got one today",
  ],
  5: [
    "The way you begin your morning quietly determines how confidently you will close the day",
    "Discipline practiced daily without applause becomes the foundation of every meaningful long term achievement",
    "Wake up early do the work and let the results speak louder than your loudest excuses",
    "Gratitude in the morning rewires your mind to spot opportunities you would otherwise miss completely",
    "Champions are not born ready they are forged in quiet mornings nobody clapped for them",
    "Your future self is built one early honest disciplined morning at a time so begin",
  ],
};

export function generateTyping(level: Level, used: Set<string>): { sentence: string } {
  const pool = TYPING_BY_LEVEL[level];
  for (let i = 0; i < 40; i++) {
    const s = pool[randInt(0, pool.length - 1)];
    const key = `t:${level}:${s}`;
    if (!used.has(key)) {
      used.add(key);
      return { sentence: s };
    }
  }
  return { sentence: pool[0] };
}

// ─── MEMORY ──────────────────────────────────────────────────────────────────
const MEMORY_LEN: Record<Level, [number, number]> = {
  1: [5, 6],
  2: [7, 8],
  3: [9, 10],
  4: [11, 12],
  5: [13, 16],
};
// Per-digit display speed (ms) — faster at higher levels
export const MEMORY_DISPLAY_MS: Record<Level, number> = {
  1: 850,
  2: 750,
  3: 650,
  4: 550,
  5: 450,
};

export function generateMemory(level: Level, used: Set<string>): { digits: number[] } {
  const [lo, hi] = MEMORY_LEN[level];
  for (let i = 0; i < 40; i++) {
    const len = randInt(lo, hi);
    const digits: number[] = [];
    for (let k = 0; k < len; k++) digits.push(randInt(0, 9));
    const key = `m:${level}:${digits.join("")}`;
    if (!used.has(key)) {
      used.add(key);
      return { digits };
    }
  }
  const digits = Array.from({ length: lo }, () => randInt(0, 9));
  return { digits };
}

// ─── PATTERN ─────────────────────────────────────────────────────────────────
const PATTERN_LEN: Record<Level, [number, number]> = {
  1: [4, 5],
  2: [6, 7],
  3: [8, 9],
  4: [10, 12],
  5: [13, 16],
};
export const PATTERN_DISPLAY_MS: Record<Level, number> = {
  1: 650,
  2: 550,
  3: 480,
  4: 400,
  5: 330,
};
// 4x4 grid for all levels — cells can repeat
export const PATTERN_GRID_SIZE = 4;

export function generatePattern(level: Level, used: Set<string>): { pattern: number[]; gridSize: number } {
  const [lo, hi] = PATTERN_LEN[level];
  for (let i = 0; i < 40; i++) {
    const len = randInt(lo, hi);
    const pattern: number[] = [];
    let last = -1;
    for (let k = 0; k < len; k++) {
      let cell = randInt(0, PATTERN_GRID_SIZE * PATTERN_GRID_SIZE - 1);
      // avoid immediate repeats so playback is readable
      if (cell === last) cell = (cell + 1) % (PATTERN_GRID_SIZE * PATTERN_GRID_SIZE);
      pattern.push(cell);
      last = cell;
    }
    const key = `p:${level}:${pattern.join(",")}`;
    if (!used.has(key)) {
      used.add(key);
      return { pattern, gridSize: PATTERN_GRID_SIZE };
    }
  }
  return { pattern: [0, 1, 2, 3], gridSize: PATTERN_GRID_SIZE };
}

// ─── SLIDER ──────────────────────────────────────────────────────────────────
const SLIDER_COUNT: Record<Level, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
export const SLIDER_TOLERANCE: Record<Level, number> = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };

export function generateSlider(level: Level, used: Set<string>): { targets: number[]; tolerance: number } {
  const count = SLIDER_COUNT[level];
  for (let i = 0; i < 40; i++) {
    const targets: number[] = [];
    for (let k = 0; k < count; k++) targets.push(randInt(10, 90));
    const key = `s:${level}:${targets.join(",")}`;
    if (!used.has(key)) {
      used.add(key);
      return { targets, tolerance: SLIDER_TOLERANCE[level] };
    }
  }
  return {
    targets: Array.from({ length: count }, () => randInt(10, 90)),
    tolerance: SLIDER_TOLERANCE[level],
  };
}

// ─── CAPTCHA ─────────────────────────────────────────────────────────────────
const CAPTCHA_BY_LEVEL: Record<Level, string[]> = {
  1: ["wake", "rise", "dawn", "sun", "day", "now", "live", "joy", "calm", "go"],
  2: ["morning", "sunrise", "awaken", "bright", "energy", "spark", "vivid", "focus"],
  3: ["daybreak", "champion", "thrived", "kindness", "majesty", "vibrant", "harmony"],
  4: ["incredible", "brilliantly", "extraordinary", "perseverance", "exceptional", "magnificent"],
  5: [
    "unstoppable",
    "indomitable",
    "phenomenally",
    "indescribable",
    "transformative",
    "extraordinarily",
    "irreplaceable",
    "uncompromising",
  ],
};

export interface CaptchaPayload {
  word: string;
  skewDeg: number;
  rotDeg: number;
  letterShifts: number[]; // per-letter rotation
  noise: number;          // 0..5
}

export function generateCaptcha(level: Level, used: Set<string>): CaptchaPayload {
  const pool = CAPTCHA_BY_LEVEL[level];
  for (let i = 0; i < 40; i++) {
    const word = pool[randInt(0, pool.length - 1)].toUpperCase();
    const key = `c:${level}:${word}`;
    if (used.has(key)) continue;
    used.add(key);
    const distortion = level; // 1..5
    return {
      word,
      skewDeg: (Math.random() * 4 - 2) * distortion,
      rotDeg: (Math.random() * 2 - 1) * distortion,
      letterShifts: word.split("").map(() => (Math.random() * 4 - 2) * distortion),
      noise: distortion,
    };
  }
  const word = pool[0].toUpperCase();
  return { word, skewDeg: 0, rotDeg: 0, letterShifts: word.split("").map(() => 0), noise: level };
}
