import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type declarations for Web Speech API (not included in all TypeScript configs)
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface ScribeOptions {
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  autoSubmitAfterSilence?: number; // ms of silence before auto-submit
}

// Web Speech API fallback for when ElevenLabs isn't available
const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export function useElevenLabsScribe(options: ScribeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStoppedManuallyRef = useRef(false);
  
  const {
    onPartialTranscript,
    onFinalTranscript,
    onError,
    onStart,
    onEnd,
    autoSubmitAfterSilence = 1500,
  } = options;

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      mediaStreamRef.current = stream;
      setPermissionGranted(true);
      console.log('Microphone permission granted');
      return true;
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      setPermissionGranted(false);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please enable it in browser settings.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone.');
      } else {
        toast.error('Could not access microphone.');
      }
      
      onError?.(error);
      return false;
    }
  }, [onError]);

  // Stop Web Speech API fallback
  const stopWebSpeechFallback = useCallback(() => {
    isStoppedManuallyRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
  }, []);

  // Stop recording and cleanup
  const stopListening = useCallback(() => {
    console.log('Stopping listening...');
    isStoppedManuallyRef.current = true;
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Stop Web Speech fallback if active
    stopWebSpeechFallback();
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsListening(false);
    
    // Return accumulated transcript
    const transcript = accumulatedTranscriptRef.current || finalTranscript;
    onEnd?.();
    
    return transcript;
  }, [finalTranscript, onEnd, stopWebSpeechFallback]);

  // Start Web Speech API fallback
  const startWebSpeechFallback = useCallback((): boolean => {
    const SpeechRecognitionClass = getSpeechRecognition();
    
    if (!SpeechRecognitionClass) {
      console.error('Web Speech API not supported in this browser');
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return false;
    }
    
    console.log('Starting Web Speech API fallback...');
    setUsingFallback(true);
    isStoppedManuallyRef.current = false;
    
    // Reset state
    setPartialTranscript('');
    setFinalTranscript('');
    accumulatedTranscriptRef.current = '';
    
    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('Web Speech recognition started');
        setIsConnected(true);
        setIsListening(true);
        onStart?.();
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        
        if (interim) {
          setPartialTranscript(interim);
          onPartialTranscript?.(interim);
        }
        
        if (final) {
          // Clear any existing silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          
          accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + final.trim();
          setFinalTranscript(accumulatedTranscriptRef.current);
          setPartialTranscript('');
          onFinalTranscript?.(accumulatedTranscriptRef.current);
          
          // Set auto-submit timer after receiving final transcript
          silenceTimerRef.current = window.setTimeout(() => {
            console.log('Auto-submitting after silence (Web Speech)...');
            stopListening();
          }, autoSubmitAfterSilence);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Web Speech recognition error:', event.error, event.message);
        
        // Don't show error toast for aborted/no-speech (these are normal)
        if (event.error === 'aborted' || event.error === 'no-speech') {
          if (!isStoppedManuallyRef.current) {
            // Try to restart if it was an unexpected stop
            console.log('Attempting to restart recognition...');
            setTimeout(() => {
              if (!isStoppedManuallyRef.current && recognitionRef.current === null) {
                startWebSpeechFallback();
              }
            }, 100);
          }
          return;
        }
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in browser settings.');
          onError?.(new Error('Microphone permission denied'));
        } else if (event.error === 'network') {
          toast.error('Network error. Please check your connection.');
          onError?.(new Error('Network error'));
        } else {
          // For other errors, show generic message but don't block retry
          console.warn('Speech recognition error:', event.error);
        }
        
        setIsListening(false);
        setIsConnected(false);
      };
      
      recognition.onend = () => {
        console.log('Web Speech recognition ended, stopped manually:', isStoppedManuallyRef.current);
        
        // If we didn't manually stop, try to restart (Chrome sometimes stops unexpectedly)
        if (!isStoppedManuallyRef.current && recognitionRef.current) {
          console.log('Recognition ended unexpectedly, restarting...');
          try {
            recognition.start();
            return;
          } catch (e) {
            console.log('Could not restart recognition:', e);
          }
        }
        
        setIsConnected(false);
        setIsListening(false);
        
        // Only call onEnd if we have content or it was manually stopped
        if (accumulatedTranscriptRef.current || isStoppedManuallyRef.current) {
          onEnd?.();
        }
      };
      
      recognition.start();
      return true;
    } catch (error: any) {
      console.error('Failed to start Web Speech:', error);
      
      if (error.message?.includes('already started')) {
        // Already running, that's fine
        return true;
      }
      
      toast.error('Could not start speech recognition. Try tapping the mic again.');
      onError?.(error);
      return false;
    }
  }, [onStart, onEnd, onPartialTranscript, onFinalTranscript, onError, autoSubmitAfterSilence, stopListening]);

  // Start listening - try ElevenLabs first, fallback to Web Speech
  const startListening = useCallback(async (): Promise<boolean> => {
    console.log('Starting speech recognition...');
    isStoppedManuallyRef.current = false;
    
    // First ensure we have microphone permission
    if (!mediaStreamRef.current) {
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;
    }
    
    // Try ElevenLabs Scribe first
    try {
      console.log('Attempting ElevenLabs Scribe...');
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
      
      if (!error && data?.token) {
        console.log('Scribe token received, connecting...');
        
        // Reset state
        setPartialTranscript('');
        setFinalTranscript('');
        accumulatedTranscriptRef.current = '';
        setUsingFallback(false);
        
        // Connect to ElevenLabs Scribe WebSocket
        const wsUrl = `wss://api.elevenlabs.io/v1/scribe/realtime?token=${data.token}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('Scribe connection timeout, falling back to Web Speech');
            ws.close();
            resolve(startWebSpeechFallback());
          }, 5000);
          
          ws.onopen = () => {
            clearTimeout(timeout);
            console.log('Scribe WebSocket connected');
            setIsConnected(true);
            setIsListening(true);
            onStart?.();
            
            // Send configuration
            ws.send(JSON.stringify({
              type: 'config',
              model_id: 'scribe_v2_realtime',
              language_code: 'en',
              commit_strategy: 'vad',
            }));
            
            // Start sending audio
            startAudioStream(ws);
            resolve(true);
          };
          
          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              handleScribeMessage(message);
            } catch (e) {
              console.error('Failed to parse Scribe message:', e);
            }
          };
          
          ws.onerror = (event) => {
            clearTimeout(timeout);
            console.error('Scribe WebSocket error, falling back to Web Speech');
            resolve(startWebSpeechFallback());
          };
          
          ws.onclose = (event) => {
            console.log('Scribe WebSocket closed:', event.code, event.reason);
            setIsConnected(false);
            setIsListening(false);
          };
        });
      } else {
        console.log('No Scribe token, using Web Speech fallback');
        return startWebSpeechFallback();
      }
    } catch (error: any) {
      console.log('ElevenLabs Scribe failed, using Web Speech fallback:', error);
      return startWebSpeechFallback();
    }
  }, [requestPermission, onStart, startWebSpeechFallback]);

  // Handle Scribe messages
  const handleScribeMessage = useCallback((message: any) => {
    console.log('Scribe message:', message.type, message);
    
    // Reset silence timer on any transcript
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    switch (message.type) {
      case 'partial_transcript':
        const partial = message.text || '';
        setPartialTranscript(partial);
        onPartialTranscript?.(partial);
        break;
        
      case 'committed_transcript':
      case 'committed_transcript_with_timestamps':
        const final = message.text || '';
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + final;
        setFinalTranscript(accumulatedTranscriptRef.current);
        setPartialTranscript('');
        onFinalTranscript?.(accumulatedTranscriptRef.current);
        
        // Set auto-submit timer after receiving final transcript
        silenceTimerRef.current = window.setTimeout(() => {
          console.log('Auto-submitting after silence...');
          stopListening();
        }, autoSubmitAfterSilence);
        break;
        
      case 'session_started':
        console.log('Scribe session started');
        break;
        
      case 'error':
        console.error('Scribe error:', message);
        onError?.(new Error(message.message || 'Scribe error'));
        break;
    }
  }, [onPartialTranscript, onFinalTranscript, onError, autoSubmitAfterSilence, stopListening]);

  // Start sending audio to WebSocket
  const startAudioStream = useCallback((ws: WebSocket) => {
    if (!mediaStreamRef.current) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const bytes = new Uint8Array(int16Data.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);
        
        // Send audio chunk
        ws.send(JSON.stringify({
          type: 'audio',
          audio: base64Audio,
        }));
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('Audio stream started');
    } catch (error) {
      console.error('Failed to start audio stream:', error);
      onError?.(error as Error);
    }
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppedManuallyRef.current = true;
      stopListening();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopListening]);

  return {
    isConnected,
    isListening,
    partialTranscript,
    finalTranscript,
    permissionGranted,
    usingFallback,
    startListening,
    stopListening,
    requestPermission,
    transcript: finalTranscript || partialTranscript,
  };
}
