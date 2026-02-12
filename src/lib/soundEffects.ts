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
