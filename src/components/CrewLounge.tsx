/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RecruitCandidate } from "../types";
import { Users, UserPlus, Info } from "lucide-react";
import { AudioEngine } from "../audio";

interface CrewLoungeProps {
  candidates: RecruitCandidate[];
  onHire: (index: number) => void;
  onClose: () => void;
  credits: number;
  crewCapacity: number;
  currentCrewCount: number;
  themeColor: "green" | "amber" | "cyan";
}

export const CrewLounge: React.FC<CrewLoungeProps> = ({
  candidates,
  onHire,
  onClose,
  credits,
  crewCapacity,
  currentCrewCount,
  themeColor
}) => {
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "Pilot": return "bg-blue-950 text-blue-400 border border-blue-500/30";
      case "Weapons Specialist": return "bg-red-950 text-red-400 border border-red-500/30";
      case "Science Director": return "bg-cyan-950 text-cyan-400 border border-cyan-500/30";
      case "Miner": return "bg-yellow-950 text-yellow-500 border border-yellow-500/30";
      case "Cargo Manager": return "bg-emerald-950 text-emerald-400 border border-emerald-500/30";
      case "Spy": return "bg-purple-950 text-purple-400 border border-purple-500/30";
      default: return "bg-neutral-900 text-neutral-400 border border-neutral-700/30";
    }
  };

  const handleHireClick = (index: number, cost: number) => {
    if (credits < cost) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }
    if (currentCrewCount >= crewCapacity) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }
    AudioEngine.playBeep(1100, 0.25, "sine");
    onHire(index);
  };

  const themeTextClass =
    themeColor === "green"
      ? "text-green-400"
      : themeColor === "amber"
      ? "text-amber-500"
      : "text-cyan-400";

  return (
    <div id="crew-lounge-overlay" className="fixed inset-0 bg-black/95 backdrop-blur z-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-2xl w-full border-2 border-current p-6 rounded bg-black relative flex flex-col justify-between shadow-2xl font-mono min-h-[480px]">
        <div>
          <h3 className={`text-lg font-bold border-b border-current pb-2 mb-4 tracking-wider text-center uppercase flex items-center justify-center ${themeTextClass}`}>
            <Users size={20} className="mr-2" /> SPACEPORT RECRUITMENT LOUNGE
          </h3>
          <p className="text-xs mb-4 opacity-80 text-center leading-normal">
            Enlist seasoned deepspace specialists to command secondary systems, increasing evasion ratings, cargo holds, laser mining yields, and weapon parameters.
          </p>

          <div id="recruits-deck" className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
            {candidates.length > 0 ? (
              candidates.map((recruit, index) => {
                const canAfford = credits >= recruit.cost;
                const hasBerth = currentCrewCount < crewCapacity;

                return (
                  <div
                    key={`${recruit.name}-${index}`}
                    id={`recruit-card-${index}`}
                    className="p-3 border border-current/30 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/60 hover:bg-current/5 transition"
                  >
                    <div className="space-y-1 w-full sm:w-2/3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{recruit.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono ${getRoleBadgeClass(recruit.role)}`}>
                          {recruit.role}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-75 text-current leading-relaxed italic">
                        <Info size={10} className="inline mr-1" /> Perk: {recruit.perk}
                      </p>
                    </div>

                    <button
                      id={`hire-btn-${index}`}
                      onClick={() => handleHireClick(index, recruit.cost)}
                      disabled={!canAfford || !hasBerth}
                      className={`w-full sm:w-auto px-4 py-2 border font-bold text-xs font-mono rounded transition flex items-center justify-center gap-1.5 ${
                        !canAfford
                          ? "border-red-500/40 text-red-500/60 bg-red-950/10 cursor-not-allowed"
                          : !hasBerth
                          ? "border-amber-600/40 text-amber-500/60 bg-amber-950/10 cursor-not-allowed"
                          : "border-current bg-current/10 hover:bg-current hover:text-black cursor-pointer"
                      }`}
                    >
                      <UserPlus size={12} /> HIRE [{recruit.cost} CR]
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs italic opacity-60">
                No specialists are currently visiting this lounge berth. Board other high-tech starbases.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-dashed border-current/30 flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
          <div className="flex gap-4 font-mono text-[11px]">
            <div>AVAILABLE CREDITS: <span className="font-bold text-yellow-500">{credits.toLocaleString()} CR</span></div>
            <div>STATION BERTHS: <span className="font-bold text-white">{currentCrewCount} / {crewCapacity} Crew</span></div>
          </div>
          <button
            onClick={() => {
              AudioEngine.playBeep(450, 0.05);
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 border border-current bg-current/10 hover:bg-current hover:text-black font-bold rounded cursor-pointer text-center uppercase tracking-wider"
          >
            [ Exit Lounge ]
          </button>
        </div>
      </div>
    </div>
  );
};
