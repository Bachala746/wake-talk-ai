import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, conversationHistory, theme } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const themePrompts: Record<string, string> = {
      fitness: "Focus on exercise, health, physical energy, and getting the body moving.",
      career: "Focus on professional success, productivity, achieving goals, and career growth.",
      gratitude: "Focus on appreciation, thankfulness, recognizing blessings, and positive mindset.",
      mindfulness: "Focus on calm, presence, breathing, inner peace, and gentle awareness.",
      humor: "Be playful, include light jokes, and use humor to brighten the mood.",
    };

    const themeContext = themePrompts[theme] || themePrompts.gratitude;

    const systemPrompt = `You are a warm, caring AI morning companion helping someone wake up. Your role is to have a genuine conversation to help them feel motivated to start their day.

PERSONALITY:
- Warm, empathetic, and encouraging
- Listen to what they say and respond appropriately
- Keep responses concise (2-3 sentences max)
- Be conversational, not preachy

THEME FOCUS: ${themeContext}

CONVERSATION FLOW:
1. If they say they slept well: Celebrate and build on their positive energy
2. If they say they slept poorly or are tired: Be understanding, then gently motivate
3. If they're reluctant to get up: Acknowledge but encourage with small steps
4. If they ask questions: Answer briefly and steer back to motivation
5. After 3-4 exchanges: Start wrapping up with an encouraging send-off

IMPORTANT:
- Never be pushy or dismissive of their feelings
- Use their responses to personalize your encouragement
- Keep it natural and human-like`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // Fastest model for quick responses
        messages,
        max_tokens: 100, // Reduced for faster generation
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Good morning! I'm here to help you start your day.";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Conversation AI error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      response: "I'm having a little trouble right now. Let's just take a deep breath and get ready for an amazing day!"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
