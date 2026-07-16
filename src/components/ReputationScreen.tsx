import React from "react";
import { FactionDetails } from "../types";
import { Shield, Sparkles, X, Swords, DollarSign, EyeOff } from "lucide-react";
import { AudioEngine } from "../audio";

interface ReputationScreenProps {
  reputation: Record<string, number>;
  factions: Record<string, FactionDetails>;
  onClose: () => void;
}

export const ReputationScreen: React.FC<ReputationScreenProps> = ({
  reputation,
  factions,
  onClose,
}) => {
  // Static description map for faction lore
  const FACTION_LORE: Record<string, { desc: string; motive: string; icon: React.ReactNode }> = {
    hegemony: {
      desc: "Iron-fisted galactic military regime enforcing strict order through naval force.",
      motive: "Total sectoral security & absolute compliance.",
      icon: <Shield size={14} className="text-red-400" />
    },
    syndicate: {
      desc: "Loose network of smugglers, frontier outlaws, and opportunistic space privateers.",
      motive: "Unregulated trading & evasion of empire taxes.",
      icon: <Swords size={14} className="text-amber-400" />
    },
    cult: {
      desc: "Shadowy, fanatical cult obsessed with unstable quantum anomalies and void singularity cores.",
      motive: "Communion with deep-space void entities.",
      icon: <Sparkles size={14} className="text-purple-400 animate-pulse" />
    },
    consortium: {
      desc: "Omni-sector corporate syndicate monopolizing trade lanes, refineries, and mining portals.",
      motive: "Maximizing credits, ore extractions, & market supply chains.",
      icon: <DollarSign size={14} className="text-cyan-400" />
    }
  };

  const getRepStatus = (val: number) => {
    if (val < 30) return { label: "Hostile (Shoot on Sight)", bg: "bg-red-950/80 text-red-400 border-red-500/40", barColor: "bg-red-500" };
    if (val < 50) return { label: "Neutral / Registered", bg: "bg-neutral-900 text-neutral-400 border-neutral-700/30", barColor: "bg-neutral-500" };
    if (val < 75) return { label: "Friendly / Commercial Partner", bg: "bg-cyan-950/80 text-cyan-400 border-cyan-500/40", barColor: "bg-cyan-400" };
    return { label: "Allied Champion", bg: "bg-emerald-950/90 text-emerald-300 border-emerald-500/50 animate-pulse", barColor: "bg-emerald-400" };
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 w-full max-w-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] relative flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        
        {/* Header bar */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
              <Shield size={16} className="text-yellow-500" />
              GALACTIC FACTION REPUTATION INDEX
            </h2>
            <p className="text-[9px] text-neutral-500 uppercase">
              Current diplomatic standings and faction core alignment matrices
            </p>
          </div>
          <button 
            onClick={() => {
              AudioEngine.playBeep(250, 0.08, "triangle");
              onClose();
            }}
            className="p-1 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 rounded text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Factions list */}
        <div className="space-y-4 flex-grow my-2">
          {Object.entries(factions).map(([key, value]) => {
            const details = value as FactionDetails;
            if (!details.repName) return null; // skip Unclaimed Fringe / Neutral since it has no standing state

            const repValue = reputation[key] ?? 0;
            const status = getRepStatus(repValue);
            const lore = FACTION_LORE[key];

            return (
              <div 
                key={key} 
                className="p-3 border border-neutral-900 bg-neutral-900/20 rounded-md hover:border-neutral-800 transition-colors space-y-2.5"
              >
                {/* Name, standing percentage and badge */}
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    {lore?.icon}
                    <span className={`font-bold text-xs uppercase tracking-wide ${details.color}`}>
                      {details.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${status.bg}`}>
                      {status.label}
                    </span>
                    <span className="text-white font-bold text-xs">{repValue}%</span>
                  </div>
                </div>

                {/* Lore descriptions */}
                {lore && (
                  <div className="text-[10px] leading-relaxed text-neutral-400 space-y-0.5 bg-black/30 p-2 rounded border border-neutral-950">
                    <p>{lore.desc}</p>
                    <p className="text-[9px] text-neutral-500">
                      Motive: <span className="text-neutral-300 italic">{lore.motive}</span>
                    </p>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${status.barColor}`}
                      style={{ width: `${Math.max(2, repValue)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-neutral-600 font-bold uppercase">
                    <span>Hostile</span>
                    <span>Neutral</span>
                    <span>Allied</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote */}
        <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-between items-center flex-wrap gap-2 text-[9px] text-neutral-500">
          <span className="flex items-center gap-1">
            <Shield size={11} className="text-yellow-500 animate-pulse" />
            Diplomatic standings affect bartering rates and ship aggression levels.
          </span>
          <button 
            onClick={() => {
              AudioEngine.playBeep(350, 0.1, "sine");
              onClose();
            }}
            className="px-5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            Acknowledge Standing
          </button>
        </div>
      </div>
    </div>
  );
};

