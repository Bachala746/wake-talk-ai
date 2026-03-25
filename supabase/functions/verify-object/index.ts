import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referenceImage, capturedImage, objectLabel } = await req.json();

    if (!referenceImage || !capturedImage) {
      return new Response(
        JSON.stringify({ error: "Both referenceImage and capturedImage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Strip data URL prefix if present
    const stripPrefix = (img: string) => img.replace(/^data:image\/[^;]+;base64,/, '');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an object verification system. Compare two images to determine if they show the same real-world object. The reference object is labeled "${objectLabel || 'unknown'}". Be tolerant of different lighting, angles, and distances, but the core object must match. You must call the verify_match function with your result.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Compare these two images. The first is the reference photo of "${objectLabel || 'an object'}". The second is a live camera capture. Do they show the same object? Consider lighting differences, angle changes, and partial visibility.` },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${stripPrefix(referenceImage)}` } },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${stripPrefix(capturedImage)}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_match",
              description: "Report whether the two images show the same object",
              parameters: {
                type: "object",
                properties: {
                  isMatch: { type: "boolean", description: "Whether both images show the same object" },
                  confidence: { type: "number", description: "Confidence score from 0 to 100" },
                  reasoning: { type: "string", description: "Brief explanation of the comparison" },
                },
                required: ["isMatch", "confidence", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "verify_match" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again in a moment" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI verification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ isMatch: false, confidence: 0, reasoning: "Could not process comparison" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-object error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
