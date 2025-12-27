import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { MaxiCard } from "./MaxiCard";
import { TwitterAnalysis } from "./TwitterAnalysis";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WalletData {
  wallet: string;
  score: number;
  ethArchetype: string;
  mumbaiMode: string;
  gasStyle: string;
  ogEnergy: string;
  flavor: string | null;
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
}

interface ResultsViewProps {
  data: WalletData;
  onReset: () => void;
}

export function ResultsView({ data, onReset }: ResultsViewProps) {
  const [twitterData, setTwitterData] = useState<TwitterData | null>(null);
  const [isLoadingTwitter, setIsLoadingTwitter] = useState(true);

  // Auto-fetch Twitter data on mount using the X handle from flavor
  useEffect(() => {
    const fetchTwitter = async () => {
      if (!data.flavor) {
        setIsLoadingTwitter(false);
        return;
      }

      try {
        const username = data.flavor.replace("@", "");
        const { data: response, error } = await supabase.functions.invoke("fetch-twitter", {
          body: { username }
        });

        if (error) throw error;
        if (response.error) throw new Error(response.error);

        setTwitterData(response);
        toast.success("Twitter data loaded!");
      } catch (error) {
        console.error("Twitter fetch error:", error);
        toast.error("Could not load Twitter data");
      } finally {
        setIsLoadingTwitter(false);
      }
    };

    fetchTwitter();
  }, [data.flavor]);

  return (
    <div className="min-h-screen p-6 py-12">
      <div className="max-w-lg mx-auto">
        <Button
          onClick={onReset}
          variant="ghost"
          className="mb-8 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Check another wallet
        </Button>

        <MaxiCard
          wallet={data.wallet}
          ethArchetype={data.ethArchetype}
          mumbaiMode={data.mumbaiMode}
          gasStyle={data.gasStyle}
          ogEnergy={data.ogEnergy}
          flavor={data.flavor}
          twitterPfp={twitterData?.user.profileImageUrl}
          isLoadingPfp={isLoadingTwitter}
        />

        {/* Twitter Analysis Section */}
        <TwitterAnalysis
          walletData={{
            ethArchetype: data.ethArchetype,
            mumbaiMode: data.mumbaiMode,
            wallet: data.wallet
          }}
          xHandle={data.flavor?.replace("@", "") || ""}
          preloadedData={twitterData}
        />
      </div>
    </div>
  );
}