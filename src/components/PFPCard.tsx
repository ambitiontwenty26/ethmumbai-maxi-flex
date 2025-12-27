import { useState, useRef } from "react";
import { ArrowLeft, Download, Share2, Coins, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PFPCardProps {
  imageUrl: string;
  twitterData: {
    user: {
      username: string;
      name: string;
    };
    blockchain: {
      score: number;
    };
  } | null;
  walletData: {
    ethArchetype: string;
    mumbaiMode: string;
    wallet: string;
  };
  onBack: () => void;
}

export function PFPCard({ imageUrl, twitterData, walletData, onBack }: PFPCardProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ethmumbai-pfp.png";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PFP downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleShare = () => {
    const text = `🎨 Just generated my ETHMumbai Pixel Art PFP!

🧬 ${walletData.ethArchetype} | ${walletData.mumbaiMode}
${twitterData ? `📊 ${twitterData.blockchain.score}% blockchain tweets` : ""}

Built on ETH. Survived Mumbai.

#ETHMumbai #NFT #PixelArt`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, "_blank");
  };

  const mintNFT = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("Please install MetaMask to mint");
      return;
    }

    setIsMinting(true);
    
    try {
      // Request account access
      const accounts = await window.ethereum.request<string[]>({
        method: "eth_requestAccounts",
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No account connected");
      }

      // Check if on Sepolia
      const chainId = await window.ethereum.request<string>({
        method: "eth_chainId",
      });
      
      if (chainId !== "0xaa36a7") {
        // Switch to Sepolia
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
          });
        } catch (switchError: unknown) {
          const err = switchError as { code?: number };
          if (err.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"]
              }],
            });
          }
        }
      }

      // Simple NFT mint - we'll create a minimal contract interaction
      // For hackathon purposes, we'll simulate creating a transaction
      // In production, you'd interact with an actual NFT contract
      
      const metadata = {
        name: `ETHMumbai Maxi PFP - ${walletData.ethArchetype}`,
        description: `Generated pixel art PFP for ETHMumbai. Archetype: ${walletData.ethArchetype}, Mode: ${walletData.mumbaiMode}`,
        image: imageUrl,
        attributes: [
          { trait_type: "Archetype", value: walletData.ethArchetype },
          { trait_type: "Mumbai Mode", value: walletData.mumbaiMode },
          { trait_type: "Blockchain Score", value: twitterData?.blockchain.score || 0 }
        ]
      };

      // For demo: Create a simple transaction to demonstrate minting
      // This sends a small amount of ETH to yourself as a "mint" simulation
      const txParams = {
        from: accounts[0],
        to: accounts[0],
        value: "0x0", // 0 ETH
        data: "0x" + Buffer.from(JSON.stringify(metadata).slice(0, 100)).toString("hex"),
      };

      const txHash = await window.ethereum.request<string>({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      setMintTxHash(txHash);
      toast.success("NFT minting transaction sent!");
      
    } catch (error: unknown) {
      console.error("Mint error:", error);
      const err = error as { code?: number; message?: string };
      if (err.code === 4001) {
        toast.error("Transaction cancelled");
      } else {
        toast.error(err.message || "Failed to mint NFT");
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="animate-scale-in">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div ref={cardRef} className="relative rounded-3xl overflow-hidden bg-card shadow-2xl">
        {/* PFP Image */}
        <div className="aspect-square relative">
          <img
            src={imageUrl}
            alt="Generated PFP"
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card to-transparent p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-card-foreground font-bold text-lg">
                  {walletData.ethArchetype}
                </p>
                <p className="text-card-foreground/70 text-sm">
                  {walletData.mumbaiMode}
                </p>
              </div>
              {twitterData && (
                <div className="text-right">
                  <p className="text-card-foreground/70 text-sm">Blockchain Score</p>
                  <p className="text-card-foreground font-bold text-xl">
                    {twitterData.blockchain.score}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-card-foreground/60 font-mono">
              {walletData.wallet.slice(0, 6)}...{walletData.wallet.slice(-4)}
            </span>
            {twitterData && (
              <span className="text-card-foreground/60">
                @{twitterData.user.username}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {!mintTxHash ? (
          <Button
            onClick={mintNFT}
            disabled={isMinting}
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg py-6 rounded-2xl"
          >
            {isMinting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Minting on Sepolia...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-5 w-5" />
                Mint as NFT on Sepolia
              </>
            )}
          </Button>
        ) : (
          <a
            href={`https://sepolia.etherscan.io/tx/${mintTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-accent/20 text-foreground font-bold text-lg py-4 rounded-2xl border border-accent/30 hover:bg-accent/30 transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            View on Etherscan
          </a>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleShare}
            size="lg"
            className="flex-1 bg-card text-card-foreground hover:bg-card/90 font-bold rounded-2xl"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Share
          </Button>
          <Button
            onClick={handleDownload}
            size="lg"
            variant="outline"
            className="flex-1 border-2 border-foreground/30 text-foreground hover:bg-foreground/10 font-bold rounded-2xl"
          >
            <Download className="mr-2 h-5 w-5" />
            Download
          </Button>
        </div>
      </div>

      <p className="text-center text-foreground/50 text-sm mt-6 font-mono">
        Built for ETHMumbai • Sepolia Testnet
      </p>
    </div>
  );
}