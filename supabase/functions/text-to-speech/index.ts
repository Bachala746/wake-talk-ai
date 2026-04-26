import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Voice mapping for different styles
const voiceMap: Record<string, string> = {
  gentle: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm and gentle
  energetic: 'IKne3meq5aSn9XLyUdCD', // Charlie - energetic
  calm: 'JBFqnCBsd6RMkjVDRZzb', // George - calm and steady
  cheerful: 'FGY2WhTYpPnrIDTdsKH5', // Laura - cheerful
  professional: 'onwK4e9ZLuTAKqWW03F9', // Daniel - professional
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voiceStyle = 'gentle', checkQuotaOnly = false } = await req.json()

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVENLABS_API_KEY_1')

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ useBrowserTTS: true, text, voiceStyle, error: 'No API key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Quota-only check: just return subscription info without generating audio
    if (checkQuotaOnly) {
      let quotaInfo = null
      try {
        const subResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
          headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        })
        if (subResponse.ok) {
          const subData = await subResponse.json()
          const used = subData.character_count || 0
          const limit = subData.character_limit || 1
          quotaInfo = { characterCount: used, characterLimit: limit, percentUsed: Math.round((used / limit) * 100) }
        }
      } catch (e) {
        console.log('Could not fetch subscription info:', e)
      }
      return new Response(
        JSON.stringify({ quotaInfo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!text) {
      throw new Error('Text is required')
    }

    // Check subscription usage for quota warnings
    let quotaInfo: { characterCount: number; characterLimit: number; percentUsed: number } | null = null
    try {
      const subResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      })
      if (subResponse.ok) {
        const subData = await subResponse.json()
        const used = subData.character_count || 0
        const limit = subData.character_limit || 1
        const percentUsed = Math.round((used / limit) * 100)
        quotaInfo = { characterCount: used, characterLimit: limit, percentUsed }
        console.log(`ElevenLabs quota: ${used}/${limit} characters (${percentUsed}% used)`)
      }
    } catch (e) {
      console.log('Could not fetch subscription info:', e)
    }

    const voiceId = voiceMap[voiceStyle] || voiceMap.gentle
    console.log(`Generating ElevenLabs TTS for: "${text.substring(0, 50)}..." with voice: ${voiceStyle}`)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32&optimize_streaming_latency=4`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: false,
            speed: 1.05,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      
      // Check if it's a quota error
      let isQuotaError = false
      try {
        const errorJson = JSON.parse(errorText)
        isQuotaError = errorJson?.detail?.status === 'quota_exceeded' || 
                       errorText.includes('quota_exceeded')
      } catch {}
      
      if (isQuotaError) {
        return new Response(
          JSON.stringify({ 
            useBrowserTTS: true,
            text: text,
            voiceStyle: voiceStyle,
            quotaExceeded: true,
            quotaInfo,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = base64Encode(audioBuffer)

    console.log('ElevenLabs TTS generated successfully')
    
    return new Response(
      JSON.stringify({ 
        useBrowserTTS: false,
        audioContent: base64Audio,
        quotaInfo,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    
    // Fallback to browser TTS on any error
    return new Response(
      JSON.stringify({ 
        useBrowserTTS: true,
        text: '',
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
