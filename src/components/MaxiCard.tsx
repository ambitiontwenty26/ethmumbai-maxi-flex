import { useRef } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MaxiCardProps {
  wallet: string;
  ethArchetype: string;
  mumbaiMode: string;
  gasStyle: string;
  ogEnergy: string;
  flavor: string | null;
}

export function MaxiCard({
  wallet,
  ethArchetype,
  mumbaiMode,
  gasStyle,
  ogEnergy,
  flavor,
}: MaxiCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const shortenWallet = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleShare = async () => {
    const text = `🧬 My ETHMumbai DNA

🎭 ${ethArchetype}
🚃 ${mumbaiMode}
⛽ ${gasStyle}
⚡ ${ogEnergy} OG Energy
${flavor ? `\n🐦 ${flavor}` : ""}

Built on ETH. Survived Mumbai.

Check yours at ${window.location.origin}`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, "_blank");
  };

  const handleDownload = async () => {
    try {
      const { default: html2canvas } = await import("html2canvas");
      if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: 2,
        });
        const link = document.createElement("a");
        link.download = "ethmumbai-dna.png";
        link.href = canvas.toDataURL();
        link.click();
        toast.success("Card downloaded!");
      }
    } catch {
      toast.error("Failed to download card");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 animate-scale-in">
      <div
        ref={cardRef}
        className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden p-8 flex flex-col justify-between"
        style={{
          background: "linear-gradient(135deg, hsl(0 85% 50%) 0%, hsl(0 90% 35%) 100%)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 rounded-full border-4 border-foreground" />
          <div className="absolute bottom-20 left-5 w-24 h-24 rounded-full border-4 border-foreground" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border-2 border-foreground" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="text-foreground/80 font-mono text-sm tracking-wider mb-2">
            ETHMUMBAI
          </div>
          <h2 className="text-foreground text-4xl font-bold tracking-tight">
            DNA 🧬
          </h2>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-foreground/20 pb-3">
              <span className="text-foreground/70 font-medium">Wallet</span>
              <span className="text-foreground font-mono font-bold">
                {shortenWallet(wallet)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-foreground/20 pb-3">
              <span className="text-foreground/70 font-medium">ETH Archetype</span>
              <span className="text-foreground font-bold text-lg">
                {ethArchetype}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-foreground/20 pb-3">
              <span className="text-foreground/70 font-medium">Mumbai Mode</span>
              <span className="text-foreground font-bold text-lg">
                {mumbaiMode}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-foreground/20 pb-3">
              <span className="text-foreground/70 font-medium">Gas Style</span>
              <span className="text-foreground font-bold">{gasStyle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 font-medium">OG Energy</span>
              <span className="text-foreground font-bold text-2xl">
                {ogEnergy}
              </span>
            </div>
          </div>

          {flavor && (
            <div className="text-center text-foreground/60 font-mono text-sm">
              {flavor}
            </div>
          )}
        </div>

        <div className="relative z-10 text-center">
          <p className="text-foreground/60 text-sm font-medium tracking-wide">
            Built on ETH. Survived Mumbai.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleShare}
          size="lg"
          className="bg-card text-card-foreground hover:bg-card/90 font-bold text-lg px-8 py-6 rounded-2xl shadow-lg transition-all hover:scale-105"
        >
          <Share2 className="mr-2 h-5 w-5" />
          Share on X
        </Button>
        <Button
          onClick={handleDownload}
          size="lg"
          variant="outline"
          className="border-2 border-foreground/30 text-foreground hover:bg-foreground/10 font-bold text-lg px-8 py-6 rounded-2xl transition-all hover:scale-105"
        >
          <Download className="mr-2 h-5 w-5" />
          Download
        </Button>
      </div>
    </div>
  );
}