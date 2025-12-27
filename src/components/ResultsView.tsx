import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
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

interface ResultsViewProps {
  data: WalletData;
  onReset: () => void;
}

export function ResultsView({ data, onReset }: ResultsViewProps) {
  const [generatedPfp, setGeneratedPfp] = useState<string | null>(null);
  const [isGeneratingPfp, setIsGeneratingPfp] = useState(true);

  // Auto-generate Mumbai-styled PFP on mount
  useEffect(() => {
    const generatePfp = async () => {
      try {
        const { data: response, error } = await supabase.functions.invoke("generate-pfp", {
          body: {
            ethArchetype: data.ethArchetype,
            mumbaiMode: data.mumbaiMode,
            blockchainScore: data.score,
            xHandle: data.flavor?.replace("@", "") || "",
            keywords: ["ethereum", "web3", "mumbai"]
          }
        });

        if (error) throw error;
        if (response.error) throw new Error(response.error);

        setGeneratedPfp(response.imageUrl);
        toast.success("Mumbai-styled avatar generated!");
      } catch (error) {
        console.error("PFP generation error:", error);
        toast.error("Could not generate avatar");
      } finally {
        setIsGeneratingPfp(false);
      }
    };

    generatePfp();
  }, [data]);

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
          generatedPfp={generatedPfp}
          isLoadingPfp={isGeneratingPfp}
        />

        {/* PFP Generation Status */}
        {isGeneratingPfp && (
          <div className="mt-6 flex items-center justify-center gap-3 text-foreground/70">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating your Mumbai-styled avatar...</span>
          </div>
        )}

        {/* Twitter Analysis Section */}
        <TwitterAnalysis
          walletData={{
            ethArchetype: data.ethArchetype,
            mumbaiMode: data.mumbaiMode,
            wallet: data.wallet
          }}
          xHandle={data.flavor?.replace("@", "") || ""}
        />
      </div>
    </div>
  );
}
