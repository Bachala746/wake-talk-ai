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
  const [statusMessage, setStatusMessage] = useState<string>(''); // visible UI feedback
  const [errorMessage, setErrorMessage] = useState<string>('');   // visible UI error
  const [isSupported] = useState<boolean>(() => getSpeechRecognition() !== null || (typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia));
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStoppedManuallyRef = useRef(false);
  const isStartingRef = useRef(false); // prevents double-start race

  const {
    onPartialTranscript,
    onFinalTranscript,
    onError,
    onStart,
    onEnd,
    autoSubmitAfterSilence = 1500,
  } = options;

  // Stabilize callbacks via refs so the hook's exported functions never change identity
  const cbRef = useRef({ onPartialTranscript, onFinalTranscript, onError, onStart, onEnd });
  useEffect(() => {
    cbRef.current = { onPartialTranscript, onFinalTranscript, onError, onStart, onEnd };
  }, [onPartialTranscript, onFinalTranscript, onError, onStart, onEnd]);

  const autoSubmitMsRef = useRef(autoSubmitAfterSilence);
  useEffect(() => { autoSubmitMsRef.current = autoSubmitAfterSilence; }, [autoSubmitAfterSilence]);

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

      cbRef.current.onError?.(error);
      return false;
    }
  }, []);

  // Stop Web Speech API fallback
  const stopWebSpeechFallback = useCallback(() => {
    isStoppedManuallyRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
  }, []);

  // Stop recording and cleanup. Idempotent — safe to call any number of times.
  const stopListening = useCallback(() => {
    // No-op if nothing is active. Prevents the "Stopping listening..." spam in logs.
    if (
      !recognitionRef.current &&
      !wsRef.current &&
      !processorRef.current &&
      !audioContextRef.current &&
      !silenceTimerRef.current &&
      !isStartingRef.current
    ) {
      return '';
    }

    console.log('Stopping listening...');
    isStoppedManuallyRef.current = true;
    isStartingRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    stopWebSpeechFallback();

    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsListening(false);
    setStatusMessage('');

    const transcript = accumulatedTranscriptRef.current || finalTranscriptRef.current;
    cbRef.current.onEnd?.();

    return transcript;
  }, [stopWebSpeechFallback]);

  // Mirror finalTranscript into a ref so stopListening (stable) can read latest value
  const finalTranscriptRef = useRef('');
  useEffect(() => { finalTranscriptRef.current = finalTranscript; }, [finalTranscript]);

  // Start Web Speech API fallback (stable identity — reads callbacks via cbRef)
  const startWebSpeechFallback = useCallback((): boolean => {
    const SpeechRecognitionClass = getSpeechRecognition();

    if (!SpeechRecognitionClass) {
      console.error('Web Speech API not supported in this browser');
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return false;
    }

    // Already running — don't double-start
    if (recognitionRef.current) {
      console.log('[Mic] Recognition already running, skipping start');
      return true;
    }

    console.log('Starting Web Speech API fallback...');
    setUsingFallback(true);
    isStoppedManuallyRef.current = false;

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
        console.log('[Mic] Web Speech recognition started');
        isStartingRef.current = false;
        setIsConnected(true);
        setIsListening(true);
        setStatusMessage('🎤 Listening...');
        setErrorMessage('');
        cbRef.current.onStart?.();
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
          setStatusMessage('🎤 Listening...');
          cbRef.current.onPartialTranscript?.(interim);
        }

        if (final) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + final.trim();
          setFinalTranscript(accumulatedTranscriptRef.current);
          setPartialTranscript('');
          setStatusMessage('✓ Got it');
          cbRef.current.onFinalTranscript?.(accumulatedTranscriptRef.current);

          silenceTimerRef.current = window.setTimeout(() => {
            console.log('[Mic] Auto-submitting after silence (Web Speech)...');
            stopListening();
          }, autoSubmitMsRef.current);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('[Mic] Web Speech recognition error:', event.error);
        isStartingRef.current = false;

        // Aborted is benign (we called .abort() ourselves) — just clean up state.
        if (event.error === 'aborted') {
          return;
        }
        if (event.error === 'no-speech') {
          setErrorMessage("We didn't hear anything. Try again.");
          setStatusMessage('');
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          const msg = 'Microphone blocked. Click the lock icon in the address bar and allow the microphone.';
          setErrorMessage(msg);
          toast.error(msg);
          cbRef.current.onError?.(new Error('Microphone permission denied'));
        } else if (event.error === 'network') {
          const msg = "Speech service can't reach the network. Open the app in a new tab (not the in-app preview).";
          setErrorMessage(msg);
          toast.error(msg);
          cbRef.current.onError?.(new Error('Speech recognition network error'));
        } else if (event.error === 'audio-capture') {
          const msg = 'No microphone detected, or it is in use by another app.';
          setErrorMessage(msg);
          toast.error(msg);
          cbRef.current.onError?.(new Error('Audio capture failed'));
        } else {
          const msg = `Speech recognition error: ${event.error}`;
          setErrorMessage(msg);
          toast.error(msg);
          cbRef.current.onError?.(new Error(event.error));
        }

        setIsListening(false);
        setIsConnected(false);
        setStatusMessage('');
      };

      recognition.onend = () => {
        console.log('[Mic] Web Speech recognition ended (manual:', isStoppedManuallyRef.current, ')');
        recognitionRef.current = null;
        isStartingRef.current = false;

        // No auto-restart: parent decides when to listen again. Auto-restart was
        // causing infinite loops where stop() and restart() raced each other.

        setIsConnected(false);
        setIsListening(false);
        setStatusMessage('');

        cbRef.current.onEnd?.();
      };

      isStartingRef.current = true;
      recognition.start();
      return true;
    } catch (error: any) {
      console.error('Failed to start Web Speech:', error);
      isStartingRef.current = false;
      recognitionRef.current = null;

      if (error.message?.includes('already started')) {
        return true;
      }

      toast.error('Could not start speech recognition. Try tapping the mic again.');
      cbRef.current.onError?.(error);
      return false;
    }
  }, [stopListening]);

  // Start listening - prefer Web Speech API (instant, reliable in Chrome).
  // CRITICAL: For Web Speech API we must call recognition.start() SYNCHRONOUSLY
  // inside the user-gesture callback chain — no awaits before .start().
  const startListening = useCallback(async (): Promise<boolean> => {
    console.log('[Scribe] startListening() called');

    // Guard: already listening or starting — ignore duplicate calls
    if (recognitionRef.current || wsRef.current || isStartingRef.current) {
      console.log('[Scribe] Already listening/starting, ignoring duplicate start');
      return true;
    }

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      toast.error('Microphone requires HTTPS. Please use a secure connection.');
      cbRef.current.onError?.(new Error('Insecure context'));
      return false;
    }

    isStoppedManuallyRef.current = false;
    setErrorMessage('');
    setStatusMessage('Starting microphone...');

    const SpeechRecognitionClass = getSpeechRecognition();
    if (SpeechRecognitionClass) {
      console.log('[Scribe] Using Web Speech API (preferred, sync start)');
      const ok = startWebSpeechFallback();
      if (!ok) {
        setStatusMessage('');
        setErrorMessage('Could not start the microphone. Please try again.');
      }
      if (navigator.permissions) {
        navigator.permissions
          .query({ name: 'microphone' as PermissionName })
          .then((status) => {
            console.log('[Scribe] Microphone permission state:', status.state);
            setPermissionGranted(status.state === 'granted');
            if (status.state === 'denied') {
              const msg = 'Microphone is blocked. Click the lock icon in the address bar to allow it.';
              setErrorMessage(msg);
              toast.error(msg);
            }
          })
          .catch(() => {});
      }
      return ok;
    }

    console.log('[Scribe] Web Speech unavailable, falling back to ElevenLabs Scribe...');
    isStartingRef.current = true;
    if (!mediaStreamRef.current) {
      const hasPermission = await requestPermission();
      if (!hasPermission) { isStartingRef.current = false; return false; }
    }

    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');

      if (error || !data?.token) {
        console.error('[Scribe] No Scribe token available:', error);
        toast.error('Speech recognition unavailable in this browser. Try Chrome.');
        cbRef.current.onError?.(new Error('No speech recognition available'));
        isStartingRef.current = false;
        return false;
      }

      console.log('[Scribe] Scribe token received, connecting WebSocket...');
      setPartialTranscript('');
      setFinalTranscript('');
      accumulatedTranscriptRef.current = '';
      setUsingFallback(false);

      const wsUrl = `wss://api.elevenlabs.io/v1/scribe/realtime?token=${data.token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('[Scribe] WebSocket connection timeout');
          ws.close();
          isStartingRef.current = false;
          toast.error('Could not connect to speech service. Please try again.');
          resolve(false);
        }, 3000);

        ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[Scribe] WebSocket connected');
          isStartingRef.current = false;
          setIsConnected(true);
          setIsListening(true);
          cbRef.current.onStart?.();
          ws.send(JSON.stringify({
            type: 'config',
            model_id: 'scribe_v2_realtime',
            language_code: 'en',
            commit_strategy: 'vad',
          }));
          startAudioStream(ws);
          resolve(true);
        };

        ws.onmessage = (event) => {
          try {
            handleScribeMessage(JSON.parse(event.data));
          } catch (e) {
            console.error('[Scribe] Failed to parse message:', e);
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          console.error('[Scribe] WebSocket error');
          isStartingRef.current = false;
          toast.error('Speech service error. Please try again.');
          resolve(false);
        };

        ws.onclose = (event) => {
          console.log('[Scribe] WebSocket closed:', event.code);
          isStartingRef.current = false;
          setIsConnected(false);
          setIsListening(false);
        };
      });
    } catch (error: any) {
      console.error('[Scribe] startListening failed:', error);
      isStartingRef.current = false;
      toast.error('Could not start speech recognition.');
      cbRef.current.onError?.(error);
      return false;
    }
  }, [requestPermission, startWebSpeechFallback]);

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
        cbRef.current.onPartialTranscript?.(partial);
        break;

      case 'committed_transcript':
      case 'committed_transcript_with_timestamps':
        const final = message.text || '';
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + final;
        setFinalTranscript(accumulatedTranscriptRef.current);
        setPartialTranscript('');
        cbRef.current.onFinalTranscript?.(accumulatedTranscriptRef.current);

        silenceTimerRef.current = window.setTimeout(() => {
          console.log('Auto-submitting after silence...');
          stopListening();
        }, autoSubmitMsRef.current);
        break;

      case 'session_started':
        console.log('Scribe session started');
        break;

      case 'error':
        console.error('Scribe error:', message);
        cbRef.current.onError?.(new Error(message.message || 'Scribe error'));
        break;
    }
  }, [stopListening]);

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
    isSupported,
    statusMessage,
    errorMessage,
    startListening,
    stopListening,
    requestPermission,
    transcript: finalTranscript || partialTranscript,
  };
}
