// Interaction modes
export type InteractionMode = 'one-way' | 'two-way';

export const interactionModes: { value: InteractionMode; label: string; description: string; icon: string }[] = [
  { 
    value: 'one-way', 
    label: 'One-Way Motivation', 
    description: 'AI speaks motivational messages, you listen',
    icon: '📢'
  },
  { 
    value: 'two-way', 
    label: 'Two-Way Conversation', 
    description: 'Have a real voice conversation with AI',
    icon: '💬'
  },
];

// Voice styles with different personalities
export type VoiceStyle = 'calm' | 'energetic' | 'gentle' | 'powerful' | 'roger' | 'alice' | 'daniel' | 'jessica';

export const voiceStyles: { value: VoiceStyle; label: string; description: string; voiceId: string; settings: { stability: number; similarity_boost: number; style: number } }[] = [
  { 
    value: 'calm', 
    label: 'Calm (Lily)', 
    description: 'Soothing and peaceful wake-up',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    settings: { stability: 0.8, similarity_boost: 0.6, style: 0.3 }
  },
  { 
    value: 'energetic', 
    label: 'Energetic (Liam)', 
    description: 'High energy and exciting',
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
    settings: { stability: 0.3, similarity_boost: 0.8, style: 0.7 }
  },
  { 
    value: 'gentle', 
    label: 'Gentle (Sarah)', 
    description: 'Warm and encouraging',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    settings: { stability: 0.7, similarity_boost: 0.7, style: 0.4 }
  },
  { 
    value: 'powerful', 
    label: 'Powerful (Brian)', 
    description: 'Bold and motivating',
    voiceId: 'nPczCjzI2devNBz1zQrb',
    settings: { stability: 0.4, similarity_boost: 0.85, style: 0.8 }
  },
  { 
    value: 'roger', 
    label: 'Roger', 
    description: 'Deep and authoritative',
    voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
    settings: { stability: 0.6, similarity_boost: 0.75, style: 0.5 }
  },
  { 
    value: 'alice', 
    label: 'Alice', 
    description: 'Warm and friendly',
    voiceId: 'Xb7hH8MSUJpSbSDYk0k2',
    settings: { stability: 0.65, similarity_boost: 0.7, style: 0.45 }
  },
  { 
    value: 'daniel', 
    label: 'Daniel', 
    description: 'Smooth and confident',
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
    settings: { stability: 0.55, similarity_boost: 0.8, style: 0.6 }
  },
  { 
    value: 'jessica', 
    label: 'Jessica', 
    description: 'Bright and uplifting',
    voiceId: 'cgSgspJ2msm6clMCkdW9',
    settings: { stability: 0.5, similarity_boost: 0.75, style: 0.55 }
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
export type RingtoneStyle = 'gentle' | 'energetic' | 'nature' | 'classic' | 'urgent' | 'digital' | 'retro' | 'military';

export const ringtoneStyles: { value: RingtoneStyle; label: string; description: string; frequency: number; type: OscillatorType; volume: number }[] = [
  { value: 'gentle', label: 'Gentle Chimes', description: 'Soft and soothing', frequency: 440, type: 'sine', volume: 0.4 },
  { value: 'energetic', label: 'Energetic Beats', description: 'Upbeat and lively', frequency: 880, type: 'square', volume: 0.6 },
  { value: 'nature', label: 'Nature Sounds', description: 'Calm and natural', frequency: 392, type: 'triangle', volume: 0.5 },
  { value: 'classic', label: 'Classic Alarm', description: 'Traditional alarm tone', frequency: 1000, type: 'sawtooth', volume: 0.7 },
  { value: 'urgent', label: 'Urgent Alert', description: 'High-pitched emergency', frequency: 1500, type: 'square', volume: 0.8 },
  { value: 'digital', label: 'Digital Beep', description: 'Modern electronic tone', frequency: 1200, type: 'sine', volume: 0.7 },
  { value: 'retro', label: 'Retro Buzzer', description: '80s arcade style', frequency: 660, type: 'sawtooth', volume: 0.65 },
  { value: 'military', label: 'Military Reveille', description: 'Loud and commanding', frequency: 1800, type: 'square', volume: 0.9 },
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
export type ChallengeType = 'none' | 'math' | 'shake' | 'typing' | 'memory' | 'pattern' | 'slider' | 'captcha' | 'barcode' | 'qrcode' | 'steps' | 'speakMatch' | 'objectVerify';

export const challengeTypes: { value: ChallengeType; label: string; description: string; icon: string }[] = [
  { value: 'none', label: 'None', description: 'No challenge required', icon: '😴' },
  { value: 'math', label: 'Math Problem', description: 'Solve arithmetic to dismiss', icon: '🧮' },
  { value: 'shake', label: 'Shake Phone', description: 'Shake your phone vigorously', icon: '📱' },
  { value: 'typing', label: 'Type Word', description: 'Type a word correctly', icon: '⌨️' },
  { value: 'memory', label: 'Memory Game', description: 'Remember a number sequence', icon: '🧠' },
  { value: 'pattern', label: 'Pattern Match', description: 'Repeat a visual pattern', icon: '🧩' },
  { value: 'slider', label: 'Slider Puzzle', description: 'Drag sliders to target values', icon: '🎚️' },
  { value: 'captcha', label: 'Word Captcha', description: 'Read and type distorted text', icon: '🔤' },
  { value: 'barcode', label: 'Scan Barcode', description: 'Scan any barcode to dismiss', icon: '📊' },
  { value: 'qrcode', label: 'Scan QR Code', description: 'Scan your registered QR code', icon: '📷' },
  { value: 'steps', label: 'Walk Steps', description: 'Walk required steps to dismiss', icon: '🚶' },
  { value: 'speakMatch', label: 'Speak & Match', description: 'Read text aloud to dismiss', icon: '🗣️' },
  { value: 'objectVerify', label: 'Object Verify', description: 'Scan real-world objects', icon: '🔍' },
];

// Speak & Match challenge settings
export type SpeakMatchParagraphLength = 'short' | 'medium' | 'long';
export type SpeakMatchAccuracy = 'relaxed' | 'standard' | 'strict';
export type SpeakMatchParagraphType = 'motivational' | 'funny' | 'tongueTwister' | 'knowledge' | 'custom';

export const speakMatchParagraphLengths: { value: SpeakMatchParagraphLength; label: string; description: string }[] = [
  { value: 'short', label: 'Short', description: '2–3 lines' },
  { value: 'medium', label: 'Medium', description: '5–6 lines' },
  { value: 'long', label: 'Long', description: '8–12 lines' },
];

export const speakMatchAccuracyLevels: { value: SpeakMatchAccuracy; label: string; threshold: number }[] = [
  { value: 'relaxed', label: 'Relaxed (70%)', threshold: 70 },
  { value: 'standard', label: 'Standard (85%)', threshold: 85 },
  { value: 'strict', label: 'Strict (95%)', threshold: 95 },
];

export const speakMatchTimeLimits = [30, 60, 90, 120];

export const speakMatchRetryLimits: { value: number; label: string }[] = [
  { value: 1, label: '1 attempt' },
  { value: 3, label: '3 attempts' },
  { value: 0, label: 'Unlimited' },
];

export const speakMatchParagraphTypes: { value: SpeakMatchParagraphType; label: string; icon: string }[] = [
  { value: 'motivational', label: 'Motivational', icon: '💪' },
  { value: 'funny', label: 'Funny', icon: '😂' },
  { value: 'tongueTwister', label: 'Tongue Twister', icon: '👅' },
  { value: 'knowledge', label: 'Random Knowledge', icon: '📚' },
  { value: 'custom', label: 'Custom Text', icon: '✏️' },
];

export const speakMatchParagraphs: Record<SpeakMatchParagraphType, Record<SpeakMatchParagraphLength, string[]>> = {
  motivational: {
    short: [
      "Every morning is a fresh start. Rise up, show up, and never give up.",
      "You are stronger than you think. Today is your day to prove it.",
      "Success begins the moment you decide to try. Make today count.",
    ],
    medium: [
      "The sun rises every day without hesitation, and so should you. Every challenge you face is an opportunity to grow stronger. Believe in your potential and take that first step forward. The world is waiting for the amazing things only you can create.",
      "Champions are not made in the gym. They are made from something deep inside them. A desire, a dream, a vision. They have to have the skill and the will. But the will must be stronger than the skill. Rise and conquer this beautiful day.",
    ],
    long: [
      "Every great achievement started as a simple thought in someone's mind. That person chose to believe in themselves when nobody else would. They woke up every single morning with purpose and determination. They faced setbacks and failures but refused to quit. They understood that the path to success is never straight. It winds and turns through valleys of doubt and mountains of challenge. But with each step forward, they grew stronger and more resilient. Today, you have that same power within you. Rise up, embrace the challenge, and make this day extraordinary. The world needs your unique gifts and talents.",
    ],
  },
  funny: {
    short: [
      "My bed and I have a special relationship. We are perfect for each other. But my alarm clock keeps trying to break us apart.",
      "I told my pillow about my dreams. It said stop sleeping on the job.",
    ],
    medium: [
      "Scientists have discovered that mornings would be much better if they started later in the afternoon. Unfortunately, this research has been rejected by every boss in history. The snooze button was invented by a genius who understood the human condition perfectly. But here we are, awake and ready to pretend we enjoy it.",
      "Coffee was discovered by a goat herder who noticed his goats dancing after eating coffee berries. So basically, we owe our entire morning productivity to some dancing goats from centuries ago. Let that sink in while you contemplate your existence this fine morning.",
    ],
    long: [
      "Welcome to another episode of being awake when you would rather not be. Today on the program, we will discuss the fundamental question that has plagued humanity since the invention of the alarm clock. Why do we set alarms when we know we will hate them in the morning? Experts suggest it has something to do with responsibility and adult obligations. But I think it is because we are all secretly optimistic the night before. We think tomorrow morning me will be a different person. Someone who leaps out of bed with energy and enthusiasm. Spoiler alert, tomorrow morning me is always the same grumpy person. But hey, at least you are reading this, which means you are awake. And that is half the battle won right there.",
    ],
  },
  tongueTwister: {
    short: [
      "She sells seashells by the seashore. The shells she sells are seashells for sure.",
      "Peter Piper picked a peck of pickled peppers. How many pickled peppers did Peter Piper pick?",
    ],
    medium: [
      "How much wood would a woodchuck chuck if a woodchuck could chuck wood? He would chuck as much wood as a woodchuck would if a woodchuck could chuck wood. A proper copper coffee pot is a proper copper coffee pot indeed.",
      "Betty Botter bought some butter but she said the butter is bitter. If I put it in my batter it will make my batter bitter. But a bit of better butter will make my batter better. So Betty Botter bought a bit of better butter.",
    ],
    long: [
      "The sixth sick sheik's sixth sheep is sick. I wish to wish the wish you wish to wish, but if you wish the wish the witch wishes, I will not wish the wish you wish to wish. Whether the weather be fine, or whether the weather be not. Whether the weather be cold, or whether the weather be hot. We will weather the weather, whatever the weather, whether we like it or not. A skunk sat on a stump and thunk the stump stunk, but the stump thunk the skunk stunk. If two witches were watching two watches, which witch would watch which watch?",
    ],
  },
  knowledge: {
    short: [
      "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over three thousand years old.",
      "Octopuses have three hearts, nine brains, and blue blood. They are truly remarkable creatures of the deep sea.",
    ],
    medium: [
      "The human brain uses approximately twenty percent of the body's total energy despite being only about two percent of total body weight. It processes information at remarkable speeds and can store roughly two point five petabytes of data. That is equivalent to about three million hours of television shows. Your brain is literally more powerful than any computer ever built.",
      "A day on Venus is longer than a year on Venus. It takes Venus two hundred forty three Earth days to rotate once on its axis but only two hundred twenty five Earth days to orbit the Sun. This means the planet completes an entire trip around the Sun before it finishes a single rotation.",
    ],
    long: [
      "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief. This myth has been debunked by multiple astronauts including Chinese astronaut Yang Liwei. The wall is quite narrow relative to its length, making it impossible to see from orbit without aid. However, it remains one of the most impressive architectural achievements in human history. Stretching over thirteen thousand miles across northern China, it was built over many centuries by various Chinese dynasties. The wall served as a defensive fortification against invasions from the north. Today it stands as a testament to human determination and engineering skill. Millions of tourists visit the Great Wall every year, making it one of the most popular tourist destinations in the world.",
    ],
  },
  custom: {
    short: [""],
    medium: [""],
    long: [""],
  },
};

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export const challengeDifficulties: { value: ChallengeDifficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: 'Simple challenges' },
  { value: 'medium', label: 'Medium', description: 'Moderate difficulty' },
  { value: 'hard', label: 'Hard', description: 'For heavy sleepers' },
];

// Speak & Match settings interface
export interface SpeakMatchSettings {
  paragraphLength: SpeakMatchParagraphLength;
  accuracy: SpeakMatchAccuracy;
  timeLimit: number;
  retryLimit: number; // 0 = unlimited
  paragraphType: SpeakMatchParagraphType;
  customText: string;
}

export const defaultSpeakMatchSettings: SpeakMatchSettings = {
  paragraphLength: 'short',
  accuracy: 'standard',
  timeLimit: 60,
  retryLimit: 3,
  paragraphType: 'motivational',
  customText: '',
};

// Object Verification types
export interface StoredObject {
  id: string;
  label: string;
  imageBase64: string; // compressed JPEG base64
  createdAt: number;
}

export interface ObjectVerifySettings {
  requiredCount: number; // how many objects to verify
  selectedObjectIds: string[]; // which specific objects
  strictMatch: boolean; // higher confidence threshold
  sequential: boolean; // must verify in order
  confidenceThreshold: number; // 0-100
}

export const defaultObjectVerifySettings: ObjectVerifySettings = {
  requiredCount: 1,
  selectedObjectIds: [],
  strictMatch: false,
  sequential: false,
  confidenceThreshold: 85,
};

// Complete alarm settings interface
export interface AlarmSettings {
  interactionMode: InteractionMode;
  voiceStyle: VoiceStyle;
  greetingStyle: GreetingStyle;
  userName: string;
  messageTheme: MessageTheme;
  ringtoneStyle: RingtoneStyle;
  snoozeLevel: SnoozeLevel;
  gradualVolume: boolean;
  challengeType: ChallengeType;
  challengeDifficulty: ChallengeDifficulty;
  // ElevenLabs Agent ID for real-time conversation
  elevenLabsAgentId?: string;
  // Speak & Match settings
  speakMatchSettings?: SpeakMatchSettings;
  // Registered QR code for QR challenge
  registeredQrCode?: string;
  // Object verification settings
  objectVerifySettings?: ObjectVerifySettings;
}

export const defaultAlarmSettings: AlarmSettings = {
  interactionMode: 'one-way',
  voiceStyle: 'gentle',
  greetingStyle: 'casual',
  userName: '',
  messageTheme: 'gratitude',
  ringtoneStyle: 'gentle',
  snoozeLevel: 'moderate',
  gradualVolume: true,
  challengeType: 'none',
  challengeDifficulty: 'easy',
  elevenLabsAgentId: '',
  speakMatchSettings: defaultSpeakMatchSettings,
};
