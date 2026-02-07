import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuotaInfo {
  characterCount: number;
  characterLimit: number;
  percentUsed: number;
}

interface TTSResponse {
  useBrowserTTS: boolean;
  audioContent?: string;
  text?: string;
  voiceStyle?: string;
  error?: string;
  quotaExceeded?: boolean;
  quotaInfo?: QuotaInfo;
}

// Track if we already showed a quota warning this session to avoid spam
let quotaWarningShownAt: number | null = null;
const QUOTA_WARNING_COOLDOWN = 5 * 60 * 1000; // 5 minutes

// Store active audio analyzer for volume monitoring
let activeAudioContext: AudioContext | null = null;
let activeAnalyser: AnalyserNode | null = null;
let volumeCallbackInterval: number | null = null;

export const getAudioVolumeLevel = (): number => {
  if (!activeAnalyser) return 0;
  
  const dataArray = new Uint8Array(activeAnalyser.frequencyBinCount);
  activeAnalyser.getByteFrequencyData(dataArray);
  
  // Calculate average volume from frequency data
  const sum = dataArray.reduce((acc, val) => acc + val, 0);
  const average = sum / dataArray.length;
  
  // Normalize to 0-1 range
  return Math.min(average / 128, 1);
};

const cleanupAudioAnalyzer = () => {
  if (volumeCallbackInterval) {
    clearInterval(volumeCallbackInterval);
    volumeCallbackInterval = null;
  }
  if (activeAudioContext && activeAudioContext.state !== 'closed') {
    try {
      activeAudioContext.close();
    } catch (e) {
      console.log('Error closing audio context:', e);
    }
  }
  activeAudioContext = null;
  activeAnalyser = null;
};
const handleQuotaWarning = (data: TTSResponse) => {
  const now = Date.now();
  const shouldShow = !quotaWarningShownAt || (now - quotaWarningShownAt > QUOTA_WARNING_COOLDOWN);

  if (data.quotaExceeded) {
    if (shouldShow) {
      quotaWarningShownAt = now;
      toast.error("⚠️ ElevenLabs credits exhausted! Using browser voice as fallback. Top up your ElevenLabs account for premium voice.", {
        duration: 10000,
      });
    }
    return;
  }

  if (data.quotaInfo && shouldShow) {
    const { percentUsed, characterCount, characterLimit } = data.quotaInfo;
    const remaining = characterLimit - characterCount;

    if (percentUsed >= 95) {
      quotaWarningShownAt = now;
      toast.error(`🔴 ElevenLabs credits critically low! Only ${remaining.toLocaleString()} characters remaining (${100 - percentUsed}% left).`, {
        duration: 8000,
      });
    } else if (percentUsed >= 80) {
      quotaWarningShownAt = now;
      toast.warning(`🟡 ElevenLabs credits running low — ${remaining.toLocaleString()} characters remaining (${100 - percentUsed}% left).`, {
        duration: 6000,
      });
    }
  }
};

export const speakWithElevenLabs = async (
  text: string,
  voiceStyle: string = 'gentle',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void,
  onVolumeChange?: (volume: number) => void
): Promise<HTMLAudioElement | null> => {
  try {
    onStart?.();
    
    const { data, error } = await supabase.functions.invoke<TTSResponse>('text-to-speech', {
      body: { text, voiceStyle }
    });

    if (error) {
      console.error('TTS function error:', error);
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No response from TTS function');
    }

    // Show quota warnings
    handleQuotaWarning(data);

    // Use ElevenLabs audio if available
    if (!data.useBrowserTTS && data.audioContent) {
      console.log('Playing ElevenLabs audio');
      
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      
      // Set up Web Audio API for volume analysis
      if (onVolumeChange) {
        try {
          cleanupAudioAnalyzer();
          activeAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = activeAudioContext.createMediaElementSource(audio);
          activeAnalyser = activeAudioContext.createAnalyser();
          activeAnalyser.fftSize = 256;
          activeAnalyser.smoothingTimeConstant = 0.8;
          
          source.connect(activeAnalyser);
          activeAnalyser.connect(activeAudioContext.destination);
          
          // Start volume monitoring
          volumeCallbackInterval = window.setInterval(() => {
            const volume = getAudioVolumeLevel();
            onVolumeChange(volume);
          }, 50);
        } catch (e) {
          console.log('Could not set up audio analyzer:', e);
        }
      }
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          cleanupAudioAnalyzer();
          onVolumeChange?.(0);
          onEnd?.();
          resolve(audio);
        };
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          cleanupAudioAnalyzer();
          onVolumeChange?.(0);
          onEnd?.();
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch((e) => {
          console.error('Audio play failed:', e);
          cleanupAudioAnalyzer();
          // Fallback to browser TTS
          fallbackToBrowserTTS(text, voiceStyle, onEnd);
          resolve(null);
        });
      });
    }
    
    // Fallback to browser TTS
    console.log('Using browser TTS fallback');
    await fallbackToBrowserTTS(data.text || text, voiceStyle, onEnd);
    return null;
    
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    cleanupAudioAnalyzer();
    onError?.(error as Error);
    
    // Fallback to browser TTS
    await fallbackToBrowserTTS(text, voiceStyle, onEnd);
    return null;
  }
};

const fallbackToBrowserTTS = (
  text: string,
  voiceStyle: string,
  onEnd?: () => void
): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.log('Browser TTS not available');
      onEnd?.();
      setTimeout(resolve, 100);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Select voice based on style
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      if (englishVoices.length > 0) {
        const preferredVoice = englishVoices.find(v => 
          v.name.includes('Google') || 
          v.name.includes('Premium') || 
          v.name.includes('Enhanced')
        ) || englishVoices[0];
        utterance.voice = preferredVoice;
      }
    }

    utterance.onend = () => {
      onEnd?.();
      resolve();
    };

    utterance.onerror = () => {
      onEnd?.();
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
};

export const cancelSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
