import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blockchainScore, keywords, ethArchetype, mumbaiMode } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create a prompt for pixel art PFP based on blockchain activity
    const keywordStr = keywords?.length > 0 ? keywords.slice(0, 5).join(', ') : 'ethereum, web3';
    
    const prompt = `Create a pixel art avatar for an Ethereum enthusiast. Style: retro 16-bit gaming aesthetic, vibrant colors. 
Character traits based on blockchain score ${blockchainScore || 50}%:
- Archetype: ${ethArchetype || 'Builder'}
- Vibe: ${mumbaiMode || 'Local'}
- Interests: ${keywordStr}

The avatar should be:
- Square format, centered character
- Bold pixel art style like classic game characters
- Include subtle crypto/blockchain elements (ethereum diamond, nodes, chains)
- Background should be dynamic with animated-looking patterns
- Colors: predominantly red and orange tones with accent colors
- Character should look confident and tech-savvy
- NO text, NO words, just the pixel art character`;

    console.log("Generating PFP with prompt:", prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Please add credits to generate images." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(JSON.stringify({ 
      imageUrl,
      message: "Pixel art PFP generated successfully!"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("PFP Generation Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate PFP" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});