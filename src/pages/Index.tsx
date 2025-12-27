import { useState } from "react";
import { LandingHero } from "@/components/LandingHero";
import { ResultsView } from "@/components/ResultsView";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WalletData {
  wallet: string;
  score: number;
  ethArchetype: string;
  mumbaiMode: string;
  gasStyle: string;
  ogEnergy: string;
  flavor: string | null;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);

  const handleAnalyze = async (walletAddress: string, xHandle?: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("check-wallet", {
        body: {
          walletAddress,
          xHandle,
        },
      });

      if (error) {
        throw error;
      }

      setWalletData(data);
      toast.success("Your ETHMumbai DNA revealed!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWalletData(null);
  };

  if (walletData) {
    return <ResultsView data={walletData} onReset={handleReset} />;
  }

  return <LandingHero onAnalyze={handleAnalyze} isLoading={isLoading} />;
};

export default Index;