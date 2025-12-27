import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Bearer Token using OAuth 2.0 Client Credentials
async function getBearerToken(): Promise<string> {
  const clientId = Deno.env.get("TWITTER_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("TWITTER_CLIENT_SECRET")?.trim();
  
  if (!clientId || !clientSecret) {
    throw new Error("Twitter OAuth 2.0 credentials not configured");
  }
  
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch("https://api.twitter.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Bearer token error:", response.status, errorText);
    throw new Error(`Failed to get bearer token: ${response.status}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Fetch user by username
async function getUserByUsername(username: string, bearerToken: string) {
  const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,description,public_metrics`;
  
  console.log("Fetching user:", url);
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${bearerToken}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("User fetch error:", response.status, errorText);
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  
  return response.json();
}

// Fetch user tweets
async function getUserTweets(userId: string, bearerToken: string) {
  const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=text,created_at`;
  
  console.log("Fetching tweets for user:", userId);
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${bearerToken}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Tweets fetch error:", response.status, errorText);
    // Return empty array instead of throwing - tweets may be protected
    return { data: [] };
  }
  
  return response.json();
}

function analyzeBlockchainContent(tweets: { text: string }[]): { score: number; keywords: string[]; tweetCount: number } {
  const blockchainKeywords = [
    'ethereum', 'eth', 'bitcoin', 'btc', 'blockchain', 'crypto', 'web3', 
    'defi', 'nft', 'dao', 'smart contract', 'solidity', 'dapp', 'layer2',
    'l2', 'rollup', 'zk', 'proof', 'mainnet', 'testnet', 'sepolia', 'goerli',
    'metamask', 'wallet', 'gas', 'gwei', 'wei', 'token', 'erc20', 'erc721',
    'mint', 'airdrop', 'stake', 'yield', 'liquidity', 'swap', 'uniswap',
    'ens', 'vitalik', 'polygon', 'arbitrum', 'optimism', 'base', 'solana',
    'cosmos', 'avalanche', 'gmgn', 'wagmi', 'ngmi', 'hodl', 'ape', 'fren',
    'ethmumbai', 'hackathon', 'buidl', 'gm', 'ser', 'anon', 'devcon'
  ];
  
  const foundKeywords = new Set<string>();
  let matchingTweets = 0;
  
  for (const tweet of tweets) {
    const text = tweet.text.toLowerCase();
    let hasMatch = false;
    
    for (const keyword of blockchainKeywords) {
      if (text.includes(keyword)) {
        foundKeywords.add(keyword);
        hasMatch = true;
      }
    }
    
    if (hasMatch) matchingTweets++;
  }
  
  const score = tweets.length > 0 ? Math.round((matchingTweets / tweets.length) * 100) : 0;
  
  return {
    score,
    keywords: Array.from(foundKeywords).slice(0, 10),
    tweetCount: matchingTweets
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    
    if (!username) {
      return new Response(JSON.stringify({ error: "Username required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Clean the username
    const cleanUsername = username.replace('@', '').trim();
    
    console.log("Fetching Twitter data for:", cleanUsername);
    
    // Get bearer token
    const bearerToken = await getBearerToken();
    console.log("Got bearer token");
    
    // Fetch user data
    const userData = await getUserByUsername(cleanUsername, bearerToken);
    console.log("User data:", JSON.stringify(userData));
    
    if (userData.errors) {
      throw new Error(userData.errors[0]?.message || "User not found");
    }
    
    if (!userData.data) {
      throw new Error("User not found");
    }
    
    const user = userData.data;
    
    // Fetch tweets
    const tweetsData = await getUserTweets(user.id, bearerToken);
    const tweets = tweetsData.data || [];
    console.log("Fetched", tweets.length, "tweets");
    
    const analysis = analyzeBlockchainContent(tweets);
    
    return new Response(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        description: user.description || "",
        profileImageUrl: user.profile_image_url?.replace('_normal', '_400x400'),
        followers: user.public_metrics?.followers_count || 0,
        following: user.public_metrics?.following_count || 0,
        tweetCount: user.public_metrics?.tweet_count || 0
      },
      blockchain: {
        score: analysis.score,
        keywords: analysis.keywords,
        matchingTweets: analysis.tweetCount,
        totalAnalyzed: tweets.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Twitter API Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to fetch Twitter data" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});