// Voice styles with different personalities
export type VoiceStyle = 'calm' | 'energetic' | 'gentle' | 'powerful';

export const voiceStyles: { value: VoiceStyle; label: string; description: string; voiceId: string; settings: { stability: number; similarity_boost: number; style: number } }[] = [
  { 
    value: 'calm', 
    label: 'Calm', 
    description: 'Soothing and peaceful wake-up',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily
    settings: { stability: 0.8, similarity_boost: 0.6, style: 0.3 }
  },
  { 
    value: 'energetic', 
    label: 'Energetic', 
    description: 'High energy and exciting',
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ', // Liam
    settings: { stability: 0.3, similarity_boost: 0.8, style: 0.7 }
  },
  { 
    value: 'gentle', 
    label: 'Gentle', 
    description: 'Warm and encouraging',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    settings: { stability: 0.7, similarity_boost: 0.7, style: 0.4 }
  },
  { 
    value: 'powerful', 
    label: 'Powerful', 
    description: 'Bold and motivating',
    voiceId: 'nPczCjzI2devNBz1zQrb', // Brian
    settings: { stability: 0.4, similarity_boost: 0.85, style: 0.8 }
  },
];

// Greeting styles
export type GreetingStyle = 'casual' | 'formal' | 'personalized';

export const greetingStyles: { value: GreetingStyle; label: string; description: string }[] = [
  { value: 'casual', label: 'Casual', description: 'Hey there, sleepyhead!' },
  { value: 'formal', label: 'Formal', description: 'Good morning, have a great day' },
  { value: 'personalized', label: 'Personalized', description: 'Uses your name' },
];

// Message themes with their own sets of motivational messages
export type MessageTheme = 'fitness' | 'career' | 'gratitude' | 'mindfulness' | 'humor';

export const messageThemes: { value: MessageTheme; label: string; description: string; icon: string }[] = [
  { value: 'fitness', label: 'Fitness', description: 'Get pumped for exercise', icon: '💪' },
  { value: 'career', label: 'Career', description: 'Professional success mindset', icon: '📈' },
  { value: 'gratitude', label: 'Gratitude', description: 'Start with thankfulness', icon: '🙏' },
  { value: 'mindfulness', label: 'Mindfulness', description: 'Calm and centered start', icon: '🧘' },
  { value: 'humor', label: 'Humor', description: 'Start with a smile', icon: '😄' },
];

export const themeMessages: Record<MessageTheme, { greeting: string; messages: string[] }> = {
  fitness: {
    greeting: "Good morning, champion! Time to wake up and get those muscles moving! Your body is ready for an amazing workout today!",
    messages: [
      "Every rep you do today is an investment in a stronger, healthier you. Let's crush those fitness goals!",
      "Your muscles are waiting to be challenged. Get up and show them what you're made of!",
      "Today's workout is tomorrow's strength. Rise up and make every movement count!",
      "The only bad workout is the one that didn't happen. Let's make today count!",
      "Your future self will thank you for the sweat you put in today. Get moving!",
      "Champions don't hit snooze. They hit the gym. Let's go!",
    ]
  },
  career: {
    greeting: "Good morning, future leader! Today is another opportunity to build your empire and achieve greatness!",
    messages: [
      "Success is built one productive morning at a time. Make today's count toward your bigger goals!",
      "Every successful person started exactly where you are now. Today is your chance to level up!",
      "Your career goals are waiting for you to take action. What will you accomplish today?",
      "The difference between ordinary and extraordinary is that little extra. Push for it today!",
      "Great opportunities come to those who are prepared. Start your day with purpose and intention!",
      "Your professional dreams are valid. Take one more step toward them today!",
    ]
  },
  gratitude: {
    greeting: "Good morning, beautiful soul! Take a moment to appreciate the gift of this new day and all its possibilities!",
    messages: [
      "You woke up today. That alone is something to be grateful for. Make this day meaningful!",
      "Think of three things you're thankful for. Let that gratitude fuel your entire day!",
      "Every morning is a fresh canvas. Paint it with appreciation and watch beauty unfold!",
      "Gratitude turns what we have into enough. You already have so much to be thankful for!",
      "Start with thank you, and the rest of the day will follow with abundance!",
      "Your life is full of blessings, big and small. Recognize them and let them fill you with joy!",
    ]
  },
  mindfulness: {
    greeting: "Good morning, peaceful one. Take a deep breath in... and slowly release. You are exactly where you need to be.",
    messages: [
      "This moment, right now, is all that exists. Be present with it and feel its peace.",
      "Breathe in calm, breathe out tension. Your day begins with this gentle awareness.",
      "You don't have to rush. Take this moment to center yourself before the day unfolds.",
      "Notice your breath. Notice your body. You are alive, aware, and capable of peace.",
      "Today, practice being fully present in each moment. That's where life truly happens.",
      "Let go of yesterday's worries and tomorrow's anxieties. Right now, you are at peace.",
    ]
  },
  humor: {
    greeting: "Wakey wakey, eggs and bakey! Time to rise and shine like the fabulous human you are!",
    messages: [
      "Coffee hasn't kicked in yet? No worries, neither has my sense of timing. But hey, we're awake!",
      "Breaking news: Your bed isn't going anywhere. It'll be there when you get back. Promise!",
      "You know what they say - early bird gets the worm. But you're not a bird, so maybe just get coffee instead!",
      "Today's forecast: 100% chance of you being awesome with scattered moments of greatness!",
      "Fun fact: Getting up is the hardest part. After that, it's just... well, everything else. You got this!",
      "Roses are red, mornings are tough, but you're getting up, and that's pretty enough!",
    ]
  }
};

// Ringtone styles
export type RingtoneStyle = 'gentle' | 'energetic' | 'nature' | 'classic';

export const ringtoneStyles: { value: RingtoneStyle; label: string; description: string; frequency: number; type: OscillatorType }[] = [
  { value: 'gentle', label: 'Gentle Chimes', description: 'Soft and soothing', frequency: 400, type: 'sine' },
  { value: 'energetic', label: 'Energetic Beats', description: 'Upbeat and lively', frequency: 800, type: 'square' },
  { value: 'nature', label: 'Nature Sounds', description: 'Calm and natural', frequency: 350, type: 'triangle' },
  { value: 'classic', label: 'Classic Alarm', description: 'Traditional alarm tone', frequency: 1000, type: 'sawtooth' },
];

// Snooze aggressiveness levels
export type SnoozeLevel = 'gentle' | 'moderate' | 'aggressive';

export const snoozeLevels: { value: SnoozeLevel; label: string; description: string }[] = [
  { value: 'gentle', label: 'Gentle', description: 'Kind reminders to get up' },
  { value: 'moderate', label: 'Moderate', description: 'Firm but friendly' },
  { value: 'aggressive', label: 'Aggressive', description: 'No mercy, get up now!' },
];

export const snoozeMessages: Record<SnoozeLevel, string[]> = {
  gentle: [
    "I know it's cozy, but the world is waiting for your wonderful energy today!",
    "Just a gentle nudge - your dreams are out there, not under the covers.",
    "Take your time, but remember - every moment is a gift waiting to be opened!",
  ],
  moderate: [
    "Come on now, that snooze button won't help you achieve your goals!",
    "Your future self is counting on you to get up. Don't let them down!",
    "The snooze button is a trap! You're stronger than this - get moving!",
  ],
  aggressive: [
    "NO SNOOZING! Champions don't hit snooze! GET UP RIGHT NOW!",
    "ABSOLUTELY NOT! That bed is stealing your potential! RISE AND CONQUER!",
    "SNOOZE IS FOR LOSERS! You're a WINNER! Now prove it and GET UP!",
    "ENOUGH! Every second you waste is a second you'll never get back! MOVE IT!",
  ]
};

// Wake-up challenge types
export type ChallengeType = 'none' | 'math' | 'shake' | 'typing' | 'memory' | 'pattern';

export const challengeTypes: { value: ChallengeType; label: string; description: string; icon: string }[] = [
  { value: 'none', label: 'None', description: 'No challenge required', icon: '😴' },
  { value: 'math', label: 'Math Problem', description: 'Solve arithmetic to dismiss', icon: '🧮' },
  { value: 'shake', label: 'Shake Phone', description: 'Shake your phone vigorously', icon: '📱' },
  { value: 'typing', label: 'Type Word', description: 'Type a word correctly', icon: '⌨️' },
  { value: 'memory', label: 'Memory Game', description: 'Remember a number sequence', icon: '🧠' },
  { value: 'pattern', label: 'Pattern Match', description: 'Repeat a visual pattern', icon: '🧩' },
];

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export const challengeDifficulties: { value: ChallengeDifficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: 'Simple challenges' },
  { value: 'medium', label: 'Medium', description: 'Moderate difficulty' },
  { value: 'hard', label: 'Hard', description: 'For heavy sleepers' },
];

// Complete alarm settings interface
export interface AlarmSettings {
  voiceStyle: VoiceStyle;
  greetingStyle: GreetingStyle;
  userName: string;
  messageTheme: MessageTheme;
  ringtoneStyle: RingtoneStyle;
  snoozeLevel: SnoozeLevel;
  gradualVolume: boolean;
  challengeType: ChallengeType;
  challengeDifficulty: ChallengeDifficulty;
}

export const defaultAlarmSettings: AlarmSettings = {
  voiceStyle: 'gentle',
  greetingStyle: 'casual',
  userName: '',
  messageTheme: 'gratitude',
  ringtoneStyle: 'gentle',
  snoozeLevel: 'moderate',
  gradualVolume: true,
  challengeType: 'none',
  challengeDifficulty: 'easy',
};
