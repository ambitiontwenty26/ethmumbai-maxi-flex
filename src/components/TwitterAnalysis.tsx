import { useState, useEffect } from "react";
import { Twitter, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PFPCard } from "./PFPCard";

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
}

interface TwitterAnalysisProps {
  walletData: {
    ethArchetype: string;
    mumbaiMode: string;
    wallet: string;
  };
  xHandle: string;
  preloadedData?: TwitterData | null;
}

export function TwitterAnalysis({ walletData, xHandle, preloadedData }: TwitterAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [twitterData, setTwitterData] = useState<TwitterData | null>(preloadedData || null);
  const [generatedPfp, setGeneratedPfp] = useState<string | null>(null);
  const [isGeneratingPfp, setIsGeneratingPfp] = useState(false);
  const [showPfpCard, setShowPfpCard] = useState(false);

  // Update state when preloaded data comes in
  useEffect(() => {
    if (preloadedData) {
      setTwitterData(preloadedData);
    }
  }, [preloadedData]);

  const fetchTwitterData = async () => {
    if (!xHandle) {
      toast.error("No X handle provided");
      return;
    }

    setIsLoading(true);
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
      toast.error("Failed to fetch Twitter data. The account may be private.");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePfp = async () => {
    setIsGeneratingPfp(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pfp", {
        body: {
          blockchainScore: twitterData?.blockchain.score || 50,
          keywords: twitterData?.blockchain.keywords || [],
          ethArchetype: walletData.ethArchetype,
          mumbaiMode: walletData.mumbaiMode
        }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setGeneratedPfp(data.imageUrl);
      setShowPfpCard(true);
      toast.success("Pixel art PFP generated!");
    } catch (error) {
      console.error("PFP generation error:", error);
      toast.error("Failed to generate PFP. Please try again.");
    } finally {
      setIsGeneratingPfp(false);
    }
  };

  if (showPfpCard && generatedPfp) {
    return (
      <PFPCard
        imageUrl={generatedPfp}
        twitterData={twitterData}
        walletData={walletData}
        onBack={() => setShowPfpCard(false)}
      />
    );
  }

  return (
    <div className="mt-8 p-6 rounded-2xl bg-card/10 border border-foreground/10 animate-fade-in">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Twitter className="h-5 w-5" />
        Twitter Blockchain Analysis
      </h3>
      
      {!twitterData ? (
        <div className="text-center py-6">
          <p className="text-foreground/70 mb-4">
            Analyzing @{xHandle} for blockchain activity...
          </p>
          <Button
            onClick={fetchTwitterData}
            disabled={isLoading}
            className="bg-foreground/10 hover:bg-foreground/20 text-foreground border border-foreground/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing tweets...
              </>
            ) : (
              <>
                <Twitter className="mr-2 h-4 w-4" />
                Retry Fetch
              </>
            )}
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
            <div>
              <p className="font-bold text-foreground">{twitterData.user.name}</p>
              <p className="text-foreground/60">@{twitterData.user.username}</p>
            </div>
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

          {/* Generate PFP */}
          <div className="pt-4 border-t border-foreground/10">
            {!generatedPfp ? (
              <Button
                onClick={generatePfp}
                disabled={isGeneratingPfp}
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
              >
                {isGeneratingPfp ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Pixel Art PFP...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate My Pixel Art PFP
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setShowPfpCard(true)}
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
              >
                View & Mint PFP
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}