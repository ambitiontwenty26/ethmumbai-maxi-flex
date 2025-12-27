import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function scoreToPersona(score: number) {
  if (score <= 25) return { archetype: "Explorer", mumbai: "Tourist" };
  if (score <= 45) return { archetype: "Curious", mumbai: "Share Auto" };
  if (score <= 65) return { archetype: "Builder", mumbai: "Fast Local" };
  if (score <= 85) return { archetype: "OG", mumbai: "First-Class Local" };
  return { archetype: "Maxi", mumbai: "City Never Sleeps" };
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

function getGasStyle(score: number): string {
  if (score <= 25) return "Casual";
  if (score <= 45) return "Hustler";
  if (score <= 65) return "Ninja";
  if (score <= 85) return "Wizard";
  return "Gas God";
}

async function fetchWalletData(address: string) {
  const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY');
  const rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

  const body = (method: string, params: unknown[]) => ({
    jsonrpc: "2.0",
    id: 1,
    method,
    params
  });

  console.log(`Fetching wallet data for: ${address}`);

  const [balanceRes, txCountRes] = await Promise.all([
    fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body("eth_getBalance", [address, "latest"]))
    }),
    fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body("eth_getTransactionCount", [address, "latest"]))
    })
  ]);

  const balanceJson = await balanceRes.json();
  const txCountJson = await txCountRes.json();

  console.log("Balance response:", balanceJson);
  console.log("Tx count response:", txCountJson);

  const balanceEth = parseInt(balanceJson.result, 16) / 1e18;
  const txCount = parseInt(txCountJson.result, 16);

  return { balanceEth, txCount };
}

function calculateScore({ balanceEth, txCount }: { balanceEth: number; txCount: number }): number {
  let score = 0;

  // Wallet activity (max 30 points)
  score += Math.min(txCount / 5, 30);

  // ETH balance signal (max 45 points)
  if (balanceEth > 0.01) score += 10;
  if (balanceEth > 0.1) score += 15;
  if (balanceEth > 1) score += 20;

  // Bonus for high activity + balance combo
  if (txCount > 100 && balanceEth > 0.5) score += 15;
  if (txCount > 500) score += 10;

  return clamp(Math.round(score), 0, 100);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, xHandle } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: "Wallet address required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing wallet: ${walletAddress}`);

    const walletData = await fetchWalletData(walletAddress);
    const score = calculateScore(walletData);
    const persona = scoreToPersona(score);

    const response = {
      wallet: walletAddress,
      score,
      ethArchetype: persona.archetype,
      mumbaiMode: persona.mumbai,
      gasStyle: getGasStyle(score),
      ogEnergy: `${score}%`,
      flavor: xHandle ? `@${xHandle}` : null
    };

    console.log("Analysis complete:", response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error("Error analyzing wallet:", err);
    return new Response(
      JSON.stringify({ error: "Failed to analyze wallet" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});