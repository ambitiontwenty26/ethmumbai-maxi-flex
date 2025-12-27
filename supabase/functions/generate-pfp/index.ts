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
    const { blockchainScore, keywords, ethArchetype, mumbaiMode, xHandle } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create a Mumbai-styled avatar prompt
    const keywordStr = keywords?.length > 0 ? keywords.slice(0, 3).join(', ') : 'ethereum, web3';
    
    const prompt = `Create a stylized digital avatar portrait in a vibrant Mumbai street style aesthetic.

Style: Bold pop art meets Indian street art, inspired by Mumbai's colorful chaos
- Bright, saturated colors with Mumbai vibes (marigold orange, rickshaw yellow, saffron, deep red)
- Urban Mumbai backdrop elements subtly visible (Gateway of India silhouette, local train patterns, street art motifs)
- Bollywood poster meets crypto punk aesthetic
- Dynamic composition with decorative Indian patterns

Character traits:
- ${ethArchetype || 'Crypto Builder'} energy - confident, forward-looking pose
- ${mumbaiMode || 'Local'} Mumbai vibe
- ${xHandle ? `Personality hint: @${xHandle}` : ''}
- Interests: ${keywordStr}

Technical requirements:
- Square format, centered face/upper body portrait
- High contrast, bold outlines
- Mumbai street art texture overlay
- Ethereum/blockchain subtle elements woven into design (diamond shapes, node connections)
- NO text, NO words, NO letters - pure visual art

Make it look like a premium NFT avatar that celebrates Mumbai's spirit with blockchain culture.`;

    console.log("Generating Mumbai-styled PFP for:", xHandle || "anonymous");

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
    console.log("AI response received successfully");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(JSON.stringify({ 
      imageUrl,
      message: "Mumbai-styled avatar generated!"
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
