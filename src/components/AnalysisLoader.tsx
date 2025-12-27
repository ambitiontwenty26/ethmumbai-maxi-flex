import { Loader2 } from "lucide-react";

export function AnalysisLoader() {
  const messages = [
    "Reading your on-chain DNA...",
    "Calculating ETH vibes...",
    "Checking Mumbai energy...",
    "Analyzing gas patterns...",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping">
          <div className="w-24 h-24 rounded-full bg-foreground/20" />
        </div>
        <Loader2 className="w-24 h-24 text-foreground animate-spin relative z-10" />
      </div>
      
      <div className="mt-8 space-y-2">
        {messages.map((msg, i) => (
          <p
            key={msg}
            className="text-foreground/80 text-lg font-medium animate-pulse"
            style={{ animationDelay: `${i * 0.5}s` }}
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}