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
export type MessageTheme =
  | 'fitness'
  | 'career'
  | 'gratitude'
  | 'mindfulness'
  | 'humor'
  | 'education'
  | 'study'
  | 'life'
  | 'exam';

export const messageThemes: { value: MessageTheme; label: string; description: string; icon: string }[] = [
  { value: 'fitness', label: 'Fitness', description: 'Get pumped for exercise', icon: '💪' },
  { value: 'gratitude', label: 'Gratitude', description: 'Start with thankfulness', icon: '🙏' },
  { value: 'mindfulness', label: 'Mindfulness', description: 'Calm and centered start', icon: '🧘' },
  { value: 'humor', label: 'Humor', description: 'Start with a smile', icon: '😄' },
  { value: 'education', label: 'Education', description: 'Lifelong learner energy', icon: '📚' },
  { value: 'study', label: 'Study', description: 'Deep-focus session fuel', icon: '✏️' },
  { value: 'life', label: 'Life', description: 'Daily life wisdom', icon: '🌱' },
  { value: 'exam', label: 'Exam', description: 'Test-day confidence boost', icon: '🎯' },
  { value: 'career', label: 'Career', description: 'Professional success mindset', icon: '📈' },
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
  },
  education: {
    greeting: "Good morning, lifelong learner! Today is another page in the book you're writing of yourself.",
    messages: [
      "Every chapter you read today plants a seed for tomorrow's wisdom. Open the book.",
      "Curiosity is a muscle. Stretch it early, and it carries you all day.",
      "The mind grows when fed. What new idea will you feed it today?",
      "One concept understood deeply beats ten skimmed. Go deep.",
      "Knowledge compounds quietly. Show up for it daily.",
      "You are one good question away from a breakthrough. Ask it.",
    ]
  },
  study: {
    greeting: "Good morning, scholar. Your desk is waiting and your focus is fresh — let's use it.",
    messages: [
      "First 25 minutes, no phone. Just you and the material. Begin.",
      "Active recall beats passive reading every single time. Quiz yourself.",
      "Hard now, easy on test day. Lean into the difficulty.",
      "One topic, one focused block. Stack the blocks, build the win.",
      "You don't need motivation. You need to start. The motivation follows.",
      "Sleepy minds remember less. Stand up, breathe, then dive back in.",
    ]
  },
  life: {
    greeting: "Good morning. Life is short, and today is one of its precious pages. Live it on purpose.",
    messages: [
      "You won't remember the scrolling. You'll remember the doing. Choose doing.",
      "Be the kind of person you'd want to wake up next to. Start with kindness — to yourself.",
      "Small habits, lived daily, become the life you didn't know you were building.",
      "Don't postpone joy. Find a small one in the next hour.",
      "The best response to a hard morning is one honest, thoughtful action.",
      "Life rewards presence. Be where your feet are.",
    ]
  },
  exam: {
    greeting: "Good morning. Exam day energy: calm body, clear mind, prepared heart. You've got this.",
    messages: [
      "You've put in the work. Today, just trust it and execute.",
      "Breathe in for four, out for six. Calm is your sharpest weapon.",
      "Read each question twice. Then answer the one in front of you — only that one.",
      "You don't need a perfect score. You need a present mind. Stay present.",
      "Confidence is doing the next right thing, even when nervous. Do that.",
      "Remember: this exam measures preparation, not your worth. You are already enough.",
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

// Motivation intensity (also reused as snooze aggressiveness level)
export type MotivationIntensity = 'gentle' | 'moderate' | 'aggressive';
export type SnoozeLevel = MotivationIntensity;

export const motivationIntensities: { value: MotivationIntensity; label: string; description: string }[] = [
  { value: 'gentle', label: 'Gentle', description: 'Soft, kind encouragement' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced, supportive push' },
  { value: 'aggressive', label: 'Aggressive', description: 'Bold, no-nonsense drive' },
];

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

// ============================================================
// Challenge Categories — group challenges by purpose
// ============================================================
export type ChallengeCategoryId = 'mind' | 'body' | 'reality' | 'interaction' | 'focus';

export interface ChallengeCategory {
  id: ChallengeCategoryId;
  label: string;
  icon: string;
  tagline: string;
  purpose: string;
  challenges: ChallengeType[];
}

export const challengeCategories: ChallengeCategory[] = [
  {
    id: 'mind',
    label: 'Mind Wake-Up',
    icon: '🧠',
    tagline: 'Activate your brain',
    purpose: 'Boost alertness through reasoning, memory, and word puzzles',
    challenges: ['math', 'memory', 'typing', 'pattern', 'captcha', 'slider'],
  },
  {
    id: 'body',
    label: 'Body Wake-Up',
    icon: '🏃',
    tagline: 'Get your body moving',
    purpose: 'Physically wake up with movement and motion detection',
    challenges: ['shake', 'steps'],
  },
  {
    id: 'reality',
    label: 'Reality Wake-Up',
    icon: '📸',
    tagline: 'Leave the bed',
    purpose: 'Force you out of bed via real-world scanning',
    challenges: ['qrcode', 'barcode', 'objectVerify'],
  },
  {
    id: 'interaction',
    label: 'Interaction',
    icon: '🗣️',
    tagline: 'Speak to wake up',
    purpose: 'Engage your voice and cognition',
    challenges: ['speakMatch'],
  },
  {
    id: 'focus',
    label: 'Focus & Discipline',
    icon: '⏱️',
    tagline: 'Build awareness',
    purpose: 'Train control and focus with timed exercises',
    challenges: [],
  },
];

export function getCategoryForChallenge(type: ChallengeType): ChallengeCategory | undefined {
  return challengeCategories.find(cat => cat.challenges.includes(type));
}

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

// Sequential challenge configuration
export type FailureRetryBehavior = 'continue' | 'restart';

export const failureRetryBehaviors: { value: FailureRetryBehavior; label: string; description: string }[] = [
  { value: 'continue', label: 'Retry Same', description: 'Retry the failed challenge' },
  { value: 'restart', label: 'Restart All', description: 'Restart from challenge 1' },
];

export interface ChallengeSequenceItem {
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  // Per-challenge settings (optional, uses alarm defaults if not set)
  speakMatchSettings?: SpeakMatchSettings;
  registeredQrCode?: string;
  objectVerifySettings?: ObjectVerifySettings;
}

export interface SequentialChallengeSettings {
  enabled: boolean; // true = multi-challenge mode
  challenges: ChallengeSequenceItem[];
  failureRetryBehavior: FailureRetryBehavior;
  dynamicDifficulty: boolean; // auto-increase difficulty for later challenges
  maxExtraChallenges: number; // extra challenges added on repeated failures (0-3)
  voiceEncouragementEnabled: boolean; // AI voice encouragement between challenges
}

export const defaultSequentialChallengeSettings: SequentialChallengeSettings = {
  enabled: false,
  challenges: [],
  failureRetryBehavior: 'continue',
  dynamicDifficulty: false,
  maxExtraChallenges: 1,
  voiceEncouragementEnabled: true, // Enabled by default
};

export const MAX_CHALLENGES_PER_ALARM = 7;

// Math challenge settings — user picks level (1-5) and total questions (3-30)
export type MathLevel = 1 | 2 | 3 | 4 | 5;

export interface MathChallengeSettings {
  level: MathLevel;
  totalQuestions: number; // 3-30
  timePerQuestion: number; // seconds (default 30)
}

export const defaultMathChallengeSettings: MathChallengeSettings = {
  level: 1,
  totalQuestions: 5,
  timePerQuestion: 30,
};

export const mathLevelInfo: { level: MathLevel; label: string; description: string }[] = [
  { level: 1, label: 'Level 1', description: 'Addition (1–20)' },
  { level: 2, label: 'Level 2', description: 'Add & Subtract (1–50)' },
  { level: 3, label: 'Level 3', description: '+ Multiplication (1–100)' },
  { level: 4, label: 'Level 4', description: 'All four operations' },
  { level: 5, label: 'Level 5', description: 'Multi-step & order of ops' },
];

export const MATH_MIN_QUESTIONS = 3;
export const MATH_MAX_QUESTIONS = 30;

// Complete alarm settings interface
export interface AlarmSettings {
  interactionMode: InteractionMode;
  voiceStyle: VoiceStyle;
  greetingStyle: GreetingStyle;
  userName: string;
  messageTheme: MessageTheme;
  ringtoneStyle: RingtoneStyle;
  snoozeLevel: SnoozeLevel;
  motivationIntensity: MotivationIntensity;
  gradualVolume: boolean;
  challengeType: ChallengeType;
  challengeDifficulty: ChallengeDifficulty;
  // ElevenLabs Agent ID for real-time conversation
  elevenLabsAgentId?: string;
  // Speak & Match settings
  speakMatchSettings?: SpeakMatchSettings;
  // Math challenge settings
  mathSettings?: MathChallengeSettings;
  // Registered QR code for QR challenge
  registeredQrCode?: string;
  // Object verification settings
  objectVerifySettings?: ObjectVerifySettings;
  // Sequential multi-challenge settings
  sequentialChallengeSettings?: SequentialChallengeSettings;
}

export const defaultAlarmSettings: AlarmSettings = {
  interactionMode: 'one-way',
  voiceStyle: 'gentle',
  greetingStyle: 'casual',
  userName: '',
  messageTheme: 'gratitude',
  ringtoneStyle: 'gentle',
  snoozeLevel: 'moderate',
  motivationIntensity: 'moderate',
  gradualVolume: true,
  challengeType: 'none',
  challengeDifficulty: 'easy',
  elevenLabsAgentId: '',
  speakMatchSettings: defaultSpeakMatchSettings,
  mathSettings: defaultMathChallengeSettings,
};

