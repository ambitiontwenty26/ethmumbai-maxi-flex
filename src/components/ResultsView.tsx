import { ArrowLeft } from "lucide-react";
import { MaxiCard } from "./MaxiCard";
import { TwitterAnalysis } from "./TwitterAnalysis";
import { Button } from "@/components/ui/button";

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
        />

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
