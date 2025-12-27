import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

function validateEnvironmentVariables() {
  if (!API_KEY) throw new Error("Missing TWITTER_CONSUMER_KEY");
  if (!API_SECRET) throw new Error("Missing TWITTER_CONSUMER_SECRET");
  if (!ACCESS_TOKEN) throw new Error("Missing TWITTER_ACCESS_TOKEN");
  if (!ACCESS_TOKEN_SECRET) throw new Error("Missing TWITTER_ACCESS_TOKEN_SECRET");
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN!,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, API_SECRET!, ACCESS_TOKEN_SECRET!);
  const signedOAuthParams = { ...oauthParams, oauth_signature: signature };

  const entries = Object.entries(signedOAuthParams).sort((a, b) => a[0].localeCompare(b[0]));
  return "OAuth " + entries.map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(", ");
}

const BASE_URL = "https://api.x.com/2";

async function getUser() {
  const url = `${BASE_URL}/users/me?user.fields=profile_image_url,description,public_metrics`;
  const method = "GET";
  const baseUrl = `${BASE_URL}/users/me`;
  const oauthHeader = generateOAuthHeader(method, baseUrl);
  
  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
  });
  
  return response.json();
}

async function getUserTweets(userId: string) {
  const baseUrl = `${BASE_URL}/users/${userId}/tweets`;
  const url = `${baseUrl}?max_results=100&tweet.fields=text,created_at`;
  const method = "GET";
  const oauthHeader = generateOAuthHeader(method, baseUrl);
  
  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
  });
  
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
    'cosmos', 'avalanche', 'gmgn', 'wagmi', 'ngmi', 'hodl', 'ape', 'fren'
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
    validateEnvironmentVariables();
    
    console.log("Fetching Twitter user data...");
    const userData = await getUser();
    console.log("User data:", JSON.stringify(userData));
    
    if (userData.errors) {
      throw new Error(userData.errors[0]?.message || "Failed to fetch user");
    }
    
    const user = userData.data;
    
    console.log("Fetching user tweets...");
    const tweetsData = await getUserTweets(user.id);
    console.log("Tweets response status:", tweetsData.meta?.result_count || 0, "tweets");
    
    const tweets = tweetsData.data || [];
    const analysis = analyzeBlockchainContent(tweets);
    
    return new Response(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        description: user.description,
        profileImageUrl: user.profile_image_url?.replace('_normal', '_400x400'),
        followers: user.public_metrics?.followers_count,
        following: user.public_metrics?.following_count,
        tweetCount: user.public_metrics?.tweet_count
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