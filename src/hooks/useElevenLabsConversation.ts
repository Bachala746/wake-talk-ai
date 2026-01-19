import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConversationOptions {
  agentId: string;
  onMessage?: (message: { role: 'user' | 'assistant'; content: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onModeSwitch?: (mode: 'speaking' | 'listening') => void;
}

export function useElevenLabsConversation(options: ConversationOptions) {
  const { agentId, onMessage, onConnect, onDisconnect, onError, onModeSwitch } = options;
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastAgentMessage, setLastAgentMessage] = useState('');
  const hasConnectedRef = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('ElevenLabs Conversation connected');
      hasConnectedRef.current = true;
      onConnect?.();
    },
    onDisconnect: () => {
      console.log('ElevenLabs Conversation disconnected');
      hasConnectedRef.current = false;
      onDisconnect?.();
    },
    onMessage: (message: any) => {
      console.log('Conversation message:', message.type, message);
      
      switch (message.type) {
        case 'user_transcript':
          const userText = message.user_transcription_event?.user_transcript || '';
          if (userText) {
            setCurrentTranscript(userText);
            onMessage?.({ role: 'user', content: userText });
          }
          break;
          
        case 'agent_response':
          const agentText = message.agent_response_event?.agent_response || '';
          if (agentText) {
            setLastAgentMessage(agentText);
            onMessage?.({ role: 'assistant', content: agentText });
          }
          break;
          
        case 'agent_response_correction':
          // Agent was interrupted
          const correctedText = message.agent_response_correction_event?.corrected_agent_response || '';
          if (correctedText) {
            setLastAgentMessage(correctedText);
          }
          break;
      }
    },
    onError: (error: any) => {
      console.error('ElevenLabs Conversation error:', error);
      onError?.(new Error(error?.message || 'Conversation error'));
    },
  });

  // Track speaking state changes
  useEffect(() => {
    if (conversation.isSpeaking) {
      onModeSwitch?.('speaking');
    } else if (conversation.status === 'connected') {
      onModeSwitch?.('listening');
    }
  }, [conversation.isSpeaking, conversation.status, onModeSwitch]);

  const startConversation = useCallback(async (): Promise<boolean> => {
    if (isConnecting || conversation.status === 'connected') {
      return false;
    }

    setIsConnecting(true);
    
    try {
      // Request microphone permission
      console.log('Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get signed URL from edge function
      console.log('Getting conversation signed URL...');
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
        body: { agentId }
      });

      if (error || !data?.signed_url) {
        console.error('Failed to get signed URL:', error);
        throw new Error('Failed to get conversation token');
      }

      console.log('Starting conversation with signed URL...');
      
      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

      toast.success('🎤 Real-time conversation started!', { duration: 2000 });
      return true;
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please enable it in browser settings.');
      } else {
        toast.error('Failed to start conversation. Please try again.');
      }
      
      onError?.(error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, conversation, isConnecting, onError]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }, [conversation]);

  const sendTextMessage = useCallback((text: string) => {
    if (conversation.status === 'connected') {
      conversation.sendUserMessage(text);
    }
  }, [conversation]);

  return {
    isConnecting,
    isConnected: conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    currentTranscript,
    lastAgentMessage,
    startConversation,
    endConversation,
    sendTextMessage,
    // Audio visualization helpers
    getInputVolume: conversation.getInputVolume,
    getOutputVolume: conversation.getOutputVolume,
  };
}
