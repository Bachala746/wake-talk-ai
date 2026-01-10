import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voiceStyle = 'gentle' } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    // Use browser speech synthesis - return text for client-side synthesis
    // ElevenLabs free tier is rate-limited, so we'll use browser TTS
    console.log(`Returning text for browser speech synthesis: ${text.substring(0, 50)}...`)
    
    return new Response(
      JSON.stringify({ 
        useBrowserTTS: true,
        text: text,
        voiceStyle: voiceStyle
      }),
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
