import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Voice presets for different styles
const voicePresets: Record<string, { voiceId: string; settings: { stability: number; similarity_boost: number; style: number } }> = {
  calm: {
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily
    settings: { stability: 0.8, similarity_boost: 0.6, style: 0.3 }
  },
  energetic: {
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ', // Liam
    settings: { stability: 0.3, similarity_boost: 0.8, style: 0.7 }
  },
  gentle: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    settings: { stability: 0.7, similarity_boost: 0.7, style: 0.4 }
  },
  powerful: {
    voiceId: 'nPczCjzI2devNBz1zQrb', // Brian
    settings: { stability: 0.4, similarity_boost: 0.85, style: 0.8 }
  },
}

// Convert ArrayBuffer to base64 in chunks to avoid stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voiceStyle = 'gentle', voiceId: customVoiceId } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured')
    }

    // Get voice preset or use custom voiceId
    const preset = voicePresets[voiceStyle] || voicePresets.gentle
    const voiceId = customVoiceId || preset.voiceId
    const voiceSettings = preset.settings

    console.log(`Generating speech with voice style: ${voiceStyle}, voiceId: ${voiceId}`)
    console.log(`Text: ${text.substring(0, 50)}...`)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            style: voiceSettings.style,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = arrayBufferToBase64(arrayBuffer)

    console.log('Speech generated successfully')

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
