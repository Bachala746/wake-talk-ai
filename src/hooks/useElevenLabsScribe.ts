import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScribeOptions {
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  autoSubmitAfterSilence?: number; // ms of silence before auto-submit
}

export function useElevenLabsScribe(options: ScribeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef('');
  
  const {
    onPartialTranscript,
    onFinalTranscript,
    onError,
    onStart,
    onEnd,
    autoSubmitAfterSilence = 1200, // Reduced from 2000ms to 1200ms for faster response
  } = options;

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Requesting microphone permission for Scribe...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
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

  // Stop recording and cleanup
  const stopListening = useCallback(() => {
    console.log('Stopping Scribe listening...');
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Don't stop the media stream yet - we might want to reuse it
    
    setIsConnected(false);
    setIsListening(false);
    
    // Return accumulated transcript
    const transcript = accumulatedTranscriptRef.current || finalTranscript;
    onEnd?.();
    
    return transcript;
  }, [finalTranscript, onEnd]);

  // Start listening with ElevenLabs Scribe
  const startListening = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Starting ElevenLabs Scribe...');
      
      // Ensure we have microphone permission
      if (!mediaStreamRef.current) {
        const hasPermission = await requestPermission();
        if (!hasPermission) return false;
      }
      
      // Get Scribe token from edge function
      console.log('Fetching Scribe token...');
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
      
      if (error || !data?.token) {
        console.error('Failed to get Scribe token:', error);
        toast.error('Failed to connect to speech recognition. Using fallback.');
        onError?.(new Error('Failed to get Scribe token'));
        return false;
      }
      
      console.log('Scribe token received, connecting...');
      
      // Reset state
      setPartialTranscript('');
      setFinalTranscript('');
      accumulatedTranscriptRef.current = '';
      
      // Connect to ElevenLabs Scribe WebSocket
      const wsUrl = `wss://api.elevenlabs.io/v1/scribe/realtime?token=${data.token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Scribe WebSocket connected');
        setIsConnected(true);
        setIsListening(true);
        onStart?.();
        toast.success('🎤 Listening with AI speech recognition...', { duration: 2000 });
        
        // Send configuration
        ws.send(JSON.stringify({
          type: 'config',
          model_id: 'scribe_v2_realtime',
          language_code: 'en',
          commit_strategy: 'vad',
        }));
        
        // Start sending audio
        startAudioStream(ws);
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
        console.error('Scribe WebSocket error:', event);
        onError?.(new Error('WebSocket error'));
      };
      
      ws.onclose = (event) => {
        console.log('Scribe WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsListening(false);
      };
      
      return true;
    } catch (error: any) {
      console.error('Failed to start Scribe:', error);
      onError?.(error);
      return false;
    }
  }, [requestPermission, onStart, onError]);

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
    startListening,
    stopListening,
    requestPermission,
    transcript: finalTranscript || partialTranscript,
  };
}
