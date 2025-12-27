import { useState } from "react";
import { Wallet, Twitter, Loader2, Sparkles, Zap, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import mumbaiSkyline from "@/assets/mumbai-skyline.gif";

interface LandingHeroProps {
  onAnalyze: (walletAddress: string, xHandle: string) => void;
  isLoading: boolean;
}

export function LandingHero({ onAnalyze, isLoading }: LandingHeroProps) {
  const [xHandle, setXHandle] = useState("");

  const connectWallet = async () => {
    if (!xHandle.trim()) {
      toast.error("Please enter your X handle first");
      return;
    }

    if (typeof window.ethereum === "undefined") {
      toast.error("Please install MetaMask to connect your wallet");
      return;
    }

    try {
      const accounts = await window.ethereum.request<string[]>({
        method: "eth_requestAccounts",
      });
      
      if (accounts && accounts.length > 0) {
        onAnalyze(accounts[0], xHandle.trim());
      }
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 4001) {
        toast.error("Please connect your wallet to continue");
      } else {
        toast.error("Failed to connect wallet");
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 text-center overflow-hidden">
      {/* Mumbai Skyline Background GIF - covering full page with red overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${mumbaiSkyline})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25
          }}
        />
        {/* Red overlay to ensure the red theme dominates */}
        <div className="absolute inset-0 bg-background/50" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-4 border-foreground/10 animate-float" />
        <div className="absolute top-40 right-20 w-20 h-20 rounded-full border-4 border-foreground/10 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-32 left-1/4 w-16 h-16 rounded-full border-4 border-foreground/10 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 right-1/4 w-24 h-24 rounded-full border-4 border-foreground/10 animate-float" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-3xl animate-slide-up">
        <div className="mb-6">
          <span className="text-foreground/70 font-mono text-sm tracking-widest uppercase">
            ETHMUMBAI 2025
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4 tracking-tight">
          Maxi Checker
        </h1>

        <p className="text-xl md:text-2xl text-foreground/80 mb-6 font-medium">
          Check your ETHMumbai DNA 🧬
        </p>

        {/* App Description */}
        <div className="mb-10 max-w-xl mx-auto">
          <p className="text-foreground/70 text-base md:text-lg mb-6">
            Discover how deep your ETH roots go! Connect your wallet to reveal your on-chain persona, 
            analyze your Twitter for blockchain vibes, and mint a unique AI-generated pixel art PFP as an NFT.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-foreground/10 rounded-full text-sm text-foreground/80">
              <Zap className="h-4 w-4" />
              On-chain Analysis
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-foreground/10 rounded-full text-sm text-foreground/80">
              <Twitter className="h-4 w-4" />
              Twitter Blockchain Score
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-foreground/10 rounded-full text-sm text-foreground/80">
              <Image className="h-4 w-4" />
              AI Pixel Art PFP
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-foreground/10 rounded-full text-sm text-foreground/80">
              <Sparkles className="h-4 w-4" />
              Mint NFT on Sepolia
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* X Handle Input - Now Required */}
          <div className="w-full max-w-xs mb-2">
            <label className="text-foreground/80 text-sm font-medium mb-2 flex items-center justify-center gap-2">
              <Twitter className="h-4 w-4" />
              Your X Handle <span className="text-accent">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50 font-medium">
                @
              </span>
              <Input
                type="text"
                placeholder="yourhandle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value.replace("@", "").trim())}
                className="pl-9 bg-foreground/10 border-foreground/20 text-foreground placeholder:text-foreground/40 rounded-xl text-center text-lg py-6"
              />
            </div>
          </div>

          <Button
            onClick={connectWallet}
            disabled={isLoading || !xHandle.trim()}
            size="lg"
            className="bg-card text-card-foreground hover:bg-card/90 font-bold text-xl px-10 py-7 rounded-2xl shadow-xl transition-all hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wallet className="mr-3 h-6 w-6" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-foreground/50 text-sm font-mono z-10">
        Built for ETHMumbai • No database • Just vibes
      </div>
    </div>
  );
}