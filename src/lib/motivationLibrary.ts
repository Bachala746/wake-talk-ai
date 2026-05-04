import { MessageTheme, SnoozeLevel } from "./alarmSettings";

// Time-of-day buckets used to vary the energy and content of messages
export type TimeOfDay = "earlyMorning" | "morning" | "lateMorning" | "afternoon" | "evening" | "night";

export const getTimeOfDay = (date: Date = new Date()): TimeOfDay => {
  const h = date.getHours();
  if (h >= 4 && h < 7) return "earlyMorning";
  if (h >= 7 && h < 10) return "morning";
  if (h >= 10 && h < 12) return "lateMorning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
};

// Intensity is mapped from the user's snooze-aggressiveness preference,
// so a single setting steers both anti-snooze copy and core motivation tone.
export type Intensity = SnoozeLevel; // 'gentle' | 'moderate' | 'aggressive'

type Bucket = Partial<Record<TimeOfDay, string[]>>;
type ThemeBucket = {
  greetings: Bucket;
  messages: Record<Intensity, Bucket>;
};

// Helper for shared/default fallbacks
const any = (arr: string[]): Bucket => ({
  earlyMorning: arr,
  morning: arr,
  lateMorning: arr,
  afternoon: arr,
  evening: arr,
  night: arr,
});

export const motivationLibrary: Record<MessageTheme, ThemeBucket> = {
  fitness: {
    greetings: {
      earlyMorning: [
        "It's the quiet hour before the world wakes — and you're already moving. That's a champion's edge.",
        "The sun isn't up yet, but you are. That's how legends are built — one early rep at a time.",
      ],
      morning: [
        "Good morning, athlete. Your body is primed and your goals are calling. Let's move.",
        "Rise and grind! Every muscle is ready for what you give it today.",
      ],
      lateMorning: [
        "The day's already rolling — now it's time to add fuel. Stand up, stretch tall, and let's go.",
        "You've eased in. Now flip the switch — energy mode, on.",
      ],
      afternoon: [
        "Afternoon slump? Not today. Move your body and the energy follows.",
        "A short burst right now beats a long nap. Let's get the blood flowing.",
      ],
      evening: [
        "Evening sessions build the strongest minds. Show up — your future self is watching.",
        "Wind down by powering up. One focused movement at a time.",
      ],
      night: [
        "Late, but not lazy. Even a few mindful reps tonight count.",
        "Calm hands, steady breath, strong body. Move gently and well.",
      ],
    },
    messages: {
      gentle: {
        earlyMorning: any([
          "Start with one easy stretch. That's the whole goal — just begin.",
          "Your body has been still for hours. A little movement is a gift to it.",
        ]).earlyMorning,
        morning: [
          "One small movement is all I'm asking for. Your body will take it from there.",
          "Tiny steps, taken daily, build extraordinary strength.",
          "You don't need to crush it. You just need to show up.",
        ],
        afternoon: [
          "A quick walk now is enough. Movement compounds.",
          "Loosen the shoulders, breathe deep, and you've already won this round.",
        ],
        evening: [
          "Slow, mindful movement still counts. Your body is grateful for any of it.",
        ],
      },
      moderate: {
        earlyMorning: [
          "The early hour is yours. Make it count with intention and a strong first move.",
          "Discipline is doing what needs doing when no one's watching. Get up.",
        ],
        morning: [
          "Your goals don't care how you feel — they care if you show up. So show up.",
          "Sweat now, smile later. Today's effort is tomorrow's strength.",
          "Champions don't negotiate with the snooze button. Up. Now.",
        ],
        lateMorning: [
          "You've had your warm-up. Time to actually start.",
          "Stop drifting — pick a movement and commit to it for ten minutes.",
        ],
        afternoon: [
          "The slump is a lie your brain tells. Move, and watch it disappear.",
          "Ten focused minutes will reset your entire day. Go.",
        ],
        evening: [
          "Every night you train is a vote for the person you're becoming.",
          "Tired is fine. Quitting is not. Move.",
        ],
      },
      aggressive: {
        earlyMorning: [
          "GET UP. The strongest version of you is built before the sun comes up. MOVE.",
          "No excuses. No snooze. Feet on the floor, body in motion, NOW.",
        ],
        morning: [
          "STAND UP. Your goals are not going to chase themselves. ATTACK THIS DAY.",
          "Comfort is the enemy. Discomfort is the path. Get UP and GO.",
          "You promised yourself something. Honor it. NO HESITATION.",
        ],
        afternoon: [
          "Snap out of it. Stand up RIGHT NOW and move for five minutes. NO DEBATE.",
          "The slump dies the moment you decide it does. DECIDE.",
        ],
        evening: [
          "Tired is not a reason. It's a test. PASS IT.",
          "Show up tonight or pay tomorrow. CHOOSE WISELY.",
        ],
      },
    },
  },

  career: {
    greetings: {
      earlyMorning: [
        "While the world sleeps, builders build. Welcome to your edge.",
        "The early desk is the quiet kingdom. Your kingdom.",
      ],
      morning: [
        "Good morning. Today is a fresh page in a story you're authoring.",
        "Your career is a series of mornings like this one. Spend it well.",
      ],
      lateMorning: [
        "The morning's prime hours are still on the table. Let's protect them.",
        "Plenty of day left to do meaningful work. Pick one and start.",
      ],
      afternoon: [
        "The afternoon is where good days become great ones. Refocus.",
        "One important task before sundown. That's the move.",
      ],
      evening: [
        "Evening reflection compounds into morning clarity. Take stock.",
        "Wrap with intention. Tomorrow starts now.",
      ],
      night: [
        "Set tomorrow up tonight. One sentence about your top priority.",
      ],
    },
    messages: {
      gentle: {
        morning: [
          "Choose one small task that moves the needle. Start there.",
          "Progress, not perfection. Pick the next small thing.",
        ],
        afternoon: [
          "Take a breath. Then take one decisive action.",
          "Clear ten minutes. Do the thing you've been avoiding.",
        ],
        evening: [
          "Note one win from today. Build on it tomorrow.",
        ],
      },
      moderate: {
        earlyMorning: [
          "The first hour of the day decides the next ten. Spend it on your top priority.",
          "Define done. Then go do it.",
        ],
        morning: [
          "Identify the one task that, if completed, makes today a win. Do that first.",
          "Inputs become outputs. Choose your inputs deliberately.",
          "Speed compounds. Don't perfect — ship.",
        ],
        afternoon: [
          "The afternoon is yours to claim. Block 45 minutes and execute.",
          "What would the sharpest version of you do in the next hour? Go do it.",
        ],
        evening: [
          "Review, reset, and protect tomorrow's first hour.",
        ],
      },
      aggressive: {
        earlyMorning: [
          "STOP scrolling. Open your most important document. WORK.",
          "Your competition is up. Match them or lose ground. CHOOSE.",
        ],
        morning: [
          "EXECUTE. Your goals are dying of neglect. Go.",
          "No more 'later'. Later is where dreams go to die. NOW.",
        ],
        afternoon: [
          "Cut the noise. ONE task. ONE hour. NO interruptions. GO.",
        ],
        evening: [
          "Don't drift to bed. Decide tomorrow's first move TONIGHT.",
        ],
      },
    },
  },

  gratitude: {
    greetings: {
      earlyMorning: [
        "The world is hushed and the day is brand new. What a gift.",
        "Before anything else — thank you. For breath, for sight, for this moment.",
      ],
      morning: [
        "Good morning, beautiful soul. A new sunrise, a new chance.",
        "Take a breath. That alone is a miracle. Now greet the day.",
      ],
      afternoon: [
        "Pause for one moment of thanks. The day is generous.",
      ],
      evening: [
        "Notice three small things that went right today. Hold them close.",
      ],
      night: [
        "Lay the day down with gratitude, not grievance.",
      ],
    },
    messages: {
      gentle: {
        morning: [
          "Inhale gratitude. Exhale tension. Repeat as needed.",
          "You woke up. Someone, somewhere, would trade everything for that.",
          "Notice the warmth, the light, the breath. They are all gifts.",
        ],
        afternoon: [
          "Even mid-day grind has hidden blessings. Look for one.",
        ],
        evening: [
          "Thank one person — even silently — for being in your life today.",
        ],
      },
      moderate: {
        morning: [
          "Gratitude is a discipline. Practice it before the day's noise begins.",
          "Name three things you're thankful for. Now act like you mean it.",
        ],
        afternoon: [
          "Reset with thanks. The complaining mind shrinks; the grateful mind grows.",
        ],
      },
      aggressive: {
        morning: [
          "Stop complaining. Start counting. THREE things. NOW. Out loud.",
          "You have more than you think. ACT LIKE IT.",
        ],
      },
    },
  },

  mindfulness: {
    greetings: {
      earlyMorning: [
        "Before the world stirs, listen. There is peace in this quiet.",
        "Breathe in. Breathe out. You're already home.",
      ],
      morning: [
        "Good morning. Your only task right now is to be here.",
        "Soft eyes. Steady breath. Open day.",
      ],
      afternoon: [
        "Pause. The day is here, and so are you.",
      ],
      evening: [
        "Soften the shoulders. The day is winding down.",
      ],
      night: [
        "Let the day settle. You don't need to carry it into sleep.",
      ],
    },
    messages: {
      gentle: {
        morning: [
          "Feel your feet. Feel your breath. Welcome to now.",
          "There is nothing to chase in this moment. Just rest in it.",
          "Notice five sounds around you. Let them be.",
        ],
        afternoon: [
          "Three slow breaths. That's the whole practice.",
        ],
        evening: [
          "Release what isn't yours to hold tonight.",
        ],
      },
      moderate: {
        morning: [
          "Your attention is your life. Where will you place it today?",
          "Be present, not perfect.",
        ],
        afternoon: [
          "Stop. Breathe. Begin again.",
        ],
      },
      aggressive: {
        morning: [
          "Put the phone down. Close your eyes. Breathe. NO exceptions.",
        ],
      },
    },
  },

  humor: {
    greetings: {
      earlyMorning: [
        "It's so early even the birds are still buffering.",
        "Congratulations — you've out-woken the sun. Achievement unlocked.",
      ],
      morning: [
        "Wakey wakey, eggs and bakey. Your bed will survive without you.",
        "Good morning! Your dreams have left the chat. Time to start a new one.",
      ],
      afternoon: [
        "Afternoon you here. Morning you made some bold promises. Let's negotiate.",
      ],
      evening: [
        "Evening check-in: did you do the thing? No judgment. Mostly.",
      ],
      night: [
        "It's late. Your phone called — it wants a break too.",
      ],
    },
    messages: {
      gentle: {
        morning: [
          "Your bed is a trap baited with comfort. Escape, hero.",
          "Coffee is a hug in a mug. Go claim yours.",
          "Mornings are just plot twists for sleepy people. Embrace the twist.",
        ],
        afternoon: [
          "If 'standing up' was an Olympic sport, today's your gold medal moment.",
        ],
      },
      moderate: {
        morning: [
          "Your blanket has been clinging to you. That's emotionally manipulative. Walk away.",
          "Plot twist: you're the main character. Start acting like it.",
        ],
      },
      aggressive: {
        morning: [
          "GET UP, you magnificent disaster. The world won't roast itself today.",
          "BED PRIVILEGES REVOKED. Stand up immediately.",
        ],
      },
    },
  },
};

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const flatten = (b: Bucket): string[] =>
  Object.values(b).flat().filter(Boolean) as string[];

/**
 * Returns a greeting for the given theme + time-of-day.
 * Falls back across time buckets so it always returns something.
 */
export const getMotivationalGreeting = (
  theme: MessageTheme,
  date: Date = new Date()
): string => {
  const tod = getTimeOfDay(date);
  const bucket = motivationLibrary[theme]?.greetings ?? {};
  const list = bucket[tod] ?? flatten(bucket);
  if (list.length === 0) return "Good morning! Let's make today a great one.";
  return pickRandom(list);
};

/**
 * Returns a non-repeating motivational message based on theme, intensity (snoozeLevel),
 * and time-of-day. `usedKeys` is a Set the caller maintains across the session
 * to avoid repeating the same message.
 */
export const getMotivationalMessage = (
  theme: MessageTheme,
  intensity: Intensity,
  usedKeys: Set<string>,
  date: Date = new Date()
): string => {
  const tod = getTimeOfDay(date);
  const themeBucket = motivationLibrary[theme]?.messages ?? ({} as Record<Intensity, Bucket>);
  const intensityBucket = themeBucket[intensity] ?? {};

  // Build candidate pool: time-of-day first, then any time in this intensity,
  // then any time in any intensity for this theme.
  const todList = intensityBucket[tod] ?? [];
  const anyTimeSameIntensity = flatten(intensityBucket);
  const anyMessageInTheme = (Object.values(themeBucket) as Bucket[])
    .flatMap(flatten);

  const tiers = [todList, anyTimeSameIntensity, anyMessageInTheme].filter(
    (t) => t.length > 0
  );

  for (const tier of tiers) {
    const fresh = tier.filter((m) => !usedKeys.has(m));
    if (fresh.length > 0) {
      const choice = pickRandom(fresh);
      usedKeys.add(choice);
      return choice;
    }
  }

  // All used — clear and try again from the broadest tier
  usedKeys.clear();
  const fallback = anyMessageInTheme.length > 0 ? anyMessageInTheme : ["Keep going. You've got this."];
  const choice = pickRandom(fallback);
  usedKeys.add(choice);
  return choice;
};
