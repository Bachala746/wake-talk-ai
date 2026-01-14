import { supabase } from "@/integrations/supabase/client";

interface TTSResponse {
  useBrowserTTS: boolean;
  audioContent?: string;
  text?: string;
  voiceStyle?: string;
  error?: string;
}

export const speakWithElevenLabs = async (
  text: string,
  voiceStyle: string = 'gentle',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
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

    // Use ElevenLabs audio if available
    if (!data.useBrowserTTS && data.audioContent) {
      console.log('Playing ElevenLabs audio');
      
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          onEnd?.();
          resolve(audio);
        };
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          onEnd?.();
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch((e) => {
          console.error('Audio play failed:', e);
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
