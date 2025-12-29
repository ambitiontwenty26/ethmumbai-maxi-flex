import { useState, useEffect } from "react";
import { Twitter, Loader2, RefreshCw, Heart, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Tweet {
  text: string;
  likes: number;
  retweets: number;
  createdAt: string;
}

interface TwitterData {
  user: {
    id: string;
    name: string;
    username: string;
    description: string;
    profileImageUrl: string;
    followers: number;
    following: number;
    tweetCount: number;
  };
  blockchain: {
    score: number;
    keywords: string[];
    matchingTweets: number;
    totalAnalyzed: number;
  };
  tweets: Tweet[];
}

interface TwitterAnalysisProps {
  walletData: {
    ethArchetype: string;
    mumbaiMode: string;
    wallet: string;
  };
  xHandle: string;
}

export function TwitterAnalysis({ xHandle }: TwitterAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [twitterData, setTwitterData] = useState<TwitterData | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const fetchTwitterData = async () => {
    if (!xHandle) {
      toast.error("No X handle provided");
      return;
    }

    setIsLoading(true);
    setHasAttempted(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-twitter", {
        body: { username: xHandle }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setTwitterData(data);
      toast.success("Twitter data analyzed!");
    } catch (error) {
      console.error("Twitter fetch error:", error);
      toast.error("Failed to fetch Twitter data. The account may be private or rate limited.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount if xHandle is provided
  useEffect(() => {
    if (xHandle && !hasAttempted) {
      fetchTwitterData();
    }
  }, [xHandle]);

  if (!xHandle) {
    return null;
  }

  return (
    <div className="mt-8 p-6 rounded-2xl bg-card/10 border border-foreground/10 animate-fade-in">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Twitter className="h-5 w-5" />
        Twitter Analysis
      </h3>
      
      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground/50" />
          <p className="text-foreground/70">Scraping @{xHandle} tweets...</p>
        </div>
      ) : !twitterData ? (
        <div className="text-center py-6">
          <p className="text-foreground/70 mb-4">
            {hasAttempted 
              ? "Could not fetch Twitter data. Try again?"
              : `Ready to analyze @${xHandle}`}
          </p>
          <Button
            onClick={fetchTwitterData}
            className="bg-foreground/10 hover:bg-foreground/20 text-foreground border border-foreground/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {hasAttempted ? "Retry" : "Analyze"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Twitter Profile Summary */}
          <div className="flex items-center gap-4">
            {twitterData.user.profileImageUrl && (
              <img
                src={twitterData.user.profileImageUrl}
                alt={twitterData.user.name}
                className="w-16 h-16 rounded-full border-2 border-foreground/20"
              />
            )}
            <div className="flex-1">
              <p className="font-bold text-foreground">{twitterData.user.name}</p>
              <p className="text-foreground/60">@{twitterData.user.username}</p>
              <p className="text-sm text-foreground/50 mt-1">
                {twitterData.user.followers.toLocaleString()} followers
              </p>
            </div>
            <Button
              onClick={fetchTwitterData}
              variant="ghost"
              size="sm"
              className="text-foreground/50 hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Blockchain Score */}
          <div className="bg-foreground/5 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-foreground/70">Blockchain Tweet Score</span>
              <span className="text-2xl font-bold text-foreground">
                {twitterData.blockchain.score}%
              </span>
            </div>
            <div className="w-full h-3 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-1000"
                style={{ width: `${twitterData.blockchain.score}%` }}
              />
            </div>
            <p className="text-sm text-foreground/50 mt-2">
              {twitterData.blockchain.matchingTweets} of {twitterData.blockchain.totalAnalyzed} tweets mention blockchain topics
            </p>
          </div>

          {/* Keywords */}
          {twitterData.blockchain.keywords.length > 0 && (
            <div>
              <p className="text-sm text-foreground/60 mb-2">Top Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {twitterData.blockchain.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1 bg-foreground/10 rounded-full text-sm text-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Tweets */}
          {twitterData.tweets && twitterData.tweets.length > 0 && (
            <div>
              <p className="text-sm text-foreground/60 mb-3">Recent Tweets ({twitterData.tweets.length}):</p>
              <ScrollArea className="h-64 rounded-lg border border-foreground/10">
                <div className="space-y-3 p-3">
                  {twitterData.tweets.map((tweet, index) => (
                    <div
                      key={index}
                      className="p-3 bg-foreground/5 rounded-lg text-sm"
                    >
                      <p className="text-foreground/90 whitespace-pre-wrap break-words">
                        {tweet.text}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-foreground/50 text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {tweet.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Repeat2 className="h-3 w-3" />
                          {tweet.retweets}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
