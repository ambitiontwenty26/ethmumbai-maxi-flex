import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Scraper } from "https://esm.sh/@the-convocation/twitter-scraper@0.9.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Blockchain-related keywords for analysis
const BLOCKCHAIN_KEYWORDS = [
  'eth', 'ethereum', 'bitcoin', 'btc', 'crypto', 'blockchain', 'web3',
  'nft', 'defi', 'dao', 'dapp', 'solidity', 'smart contract', 'token',
  'wallet', 'metamask', 'polygon', 'arbitrum', 'optimism', 'layer2',
  'airdrop', 'mint', 'gas', 'gwei', 'ens', 'opensea', 'uniswap',
  'hodl', 'degen', 'gm', 'wagmi', 'ngmi', 'lfg', 'fud', 'ape',
  'vitalik', 'satoshi', 'ledger', 'staking', 'yield', 'liquidity'
];

function analyzeBlockchainContent(tweets: { text: string }[]): { score: number; keywords: string[]; matchingTweets: number } {
  if (tweets.length === 0) {
    return { score: 0, keywords: [], matchingTweets: 0 };
  }

  const keywordCounts: Record<string, number> = {};
  let matchingTweets = 0;

  for (const tweet of tweets) {
    const text = tweet.text.toLowerCase();
    let tweetMatches = false;

    for (const keyword of BLOCKCHAIN_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        tweetMatches = true;
      }
    }

    if (tweetMatches) matchingTweets++;
  }

  const score = Math.round((matchingTweets / tweets.length) * 100);
  const sortedKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([keyword]) => keyword);

  return { score, keywords: sortedKeywords, matchingTweets };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    
    if (!username) {
      return new Response(
        JSON.stringify({ error: "Username is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the username
    const cleanUsername = username.replace('@', '').trim();
    console.log(`Scraping Twitter data for: ${cleanUsername}`);

    const scraper = new Scraper();
    
    // Fetch user profile
    const profile = await scraper.getProfile(cleanUsername);
    
    if (!profile) {
      return new Response(
        JSON.stringify({ error: "User not found or account is private" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found profile: ${profile.name} (@${profile.username})`);

    // Fetch recent tweets (up to 25)
    const tweets: { text: string; id: string; createdAt: string; likes: number; retweets: number }[] = [];
    
    try {
      const tweetIterator = scraper.getTweets(cleanUsername, 25);
      
      for await (const tweet of tweetIterator) {
        if (tweet && tweet.text) {
          tweets.push({
            text: tweet.text,
            id: tweet.id || '',
            createdAt: tweet.timeParsed?.toISOString() || '',
            likes: tweet.likes || 0,
            retweets: tweet.retweets || 0,
          });
        }
        if (tweets.length >= 25) break;
      }
    } catch (tweetError) {
      console.warn("Could not fetch tweets, continuing with profile data:", tweetError);
    }

    console.log(`Fetched ${tweets.length} tweets`);

    // Analyze blockchain content
    const blockchainAnalysis = analyzeBlockchainContent(tweets);

    const response = {
      user: {
        id: profile.userId || '',
        name: profile.name || cleanUsername,
        username: profile.username || cleanUsername,
        description: profile.biography || '',
        profileImageUrl: profile.avatar || '',
        followers: profile.followersCount || 0,
        following: profile.followingCount || 0,
        tweetCount: profile.tweetsCount || 0,
      },
      blockchain: {
        score: blockchainAnalysis.score,
        keywords: blockchainAnalysis.keywords,
        matchingTweets: blockchainAnalysis.matchingTweets,
        totalAnalyzed: tweets.length,
      },
      tweets: tweets.slice(0, 25).map(t => ({
        text: t.text,
        likes: t.likes,
        retweets: t.retweets,
        createdAt: t.createdAt,
      })),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Twitter scraping error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch Twitter data" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
