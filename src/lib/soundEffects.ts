// Sound effects using Web Audio API for instant feedback

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Play a simple beep sound
const playTone = (frequency: number, duration: number, volume: number = 0.3, type: OscillatorType = 'sine') => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Sound effect failed:', e);
  }
};

// Step count sound - short, light tap
export const playStepSound = () => {
  playTone(800, 0.08, 0.15, 'sine');
};

// Challenge complete - triumphant ascending notes
export const playChallengeCompleteSound = () => {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteDuration = 0.12;
    
    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = ctx.currentTime + index * noteDuration;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  } catch (e) {
    console.warn('Sound effect failed:', e);
  }
};

// Wrong answer - descending buzz
export const playWrongSound = () => {
  playTone(200, 0.3, 0.2, 'sawtooth');
};

// Correct intermediate step (like correct digit in memory)
export const playCorrectTapSound = () => {
  playTone(600, 0.1, 0.2, 'sine');
};

// Shake detected
export const playShakeSound = () => {
  playTone(400, 0.05, 0.1, 'triangle');
};

// Scan success
export const playScanSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    const frequencies = [880, 1108.73]; // A5, C#6
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = ctx.currentTime + index * 0.1;
      gainNode.gain.setValueAtTime(0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  } catch (e) {
    console.warn('Sound effect failed:', e);
  }
};

// Pressure tick sound - for time running out
export const playPressureTickSound = () => {
  playTone(1200, 0.06, 0.25, 'square');
};

// Milestone sound (e.g., every 10 steps)
export const playMilestoneSound = () => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.15);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn('Sound effect failed:', e);
  }
};

// Escalation alarm - aggressive buzzing that gets louder with level (1-3)
export const playEscalationAlarm = (level: number = 1) => {
  try {
    const ctx = getAudioContext();
    const volume = Math.min(0.15 + level * 0.15, 0.6);
    const duration = 0.4 + level * 0.2;
    
    // Low aggressive buzz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 100 + level * 30;
    osc1.type = 'sawtooth';
    gain1.gain.setValueAtTime(volume, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + duration);
    
    // High piercing tone layered on top
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 800 + level * 200;
    osc2.type = 'square';
    gain2.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Sound effect failed:', e);
  }
};

// Aggressive AI voice messages for QR code escalation
const escalationMessages = [
  "Get up NOW! Find your QR code!",
  "You're still in bed? Get moving! Scan that code!",
  "This alarm won't stop! Get up and find the QR code NOW!",
  "Time is running out! Get on your feet and scan the code!",
  "WAKE UP! Your QR code is waiting! Move it!",
  "Every second you waste, this gets louder! Find the code!",
  "No more excuses! Get up, walk over, and scan it!",
  "I will NOT let you sleep! Find that QR code RIGHT NOW!",
];

export const playAggressiveVoiceMessage = (attemptCount: number): void => {
  try {
    const messageIndex = Math.min(attemptCount - 3, escalationMessages.length - 1);
    const message = escalationMessages[Math.max(0, messageIndex)];
    
    // Use browser Speech Synthesis for instant aggressive voice
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.2 + Math.min((attemptCount - 3) * 0.1, 0.5); // Gets faster
      utterance.pitch = 0.7; // Lower pitch = more aggressive
      utterance.volume = Math.min(0.8 + (attemptCount - 3) * 0.05, 1.0); // Gets louder
      
      // Try to pick a deep/strong voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google UK English Male')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('Aggressive voice message failed:', e);
  }
};
