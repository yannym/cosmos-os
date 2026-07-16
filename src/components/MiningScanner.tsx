import React, { useState, useEffect, useRef, useMemo } from "react";
import { AudioEngine } from "../audio";
import { 
  Zap, 
  X, 
  Compass, 
  Radio, 
  Activity, 
  Target,
  Layers,
  Database
} from "lucide-react";

interface MiningScannerProps {
  onClose: () => void;
  onSelectDeposit: (yieldAmount: number, name: string) => void;
  miningSiteType: "asteroid_field" | "planetary_core";
  scannerQuality: number; // 0 to 1
  themeColor: "green" | "amber" | "cyan";
}

interface MiningDeposit {
  id: string;
  name: string;
  angle: number;
  distance: number;
  yield: number;
  difficulty: "Low" | "Medium" | "High" | "Legendary";
  intensity: number;
  frequency: number; // target frequency for pinpointing
  analyzed: number;
  isMotherlode: boolean;
}

export const MiningScanner: React.FC<MiningScannerProps> = ({
  onClose,
  onSelectDeposit,
  miningSiteType,
  scannerQuality,
  themeColor
}) => {
  const themeText = themeColor === "green" ? "text-green-400" : themeColor === "amber" ? "text-amber-500" : "text-cyan-400";
  const themeBorder = themeColor === "green" ? "border-green-500" : themeColor === "amber" ? "border-amber-500" : "border-cyan-400";
  const themeBg = themeColor === "green" ? "bg-green-500" : themeColor === "amber" ? "bg-amber-500" : "bg-cyan-400";

  const [sweepAngle, setSweepAngle] = useState(0);
  const [antennaAngle, setAntennaAngle] = useState(180);
  const [tunedFreq, setTunedFreq] = useState(250);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate deposits based on site type
  const deposits = useMemo(() => {
    const deps: MiningDeposit[] = [];
    const count = miningSiteType === "asteroid_field" ? 8 : 5;
    
    for (let i = 0; i < count; i++) {
      const isMotherlode = Math.random() < 0.05;
      let angle, distance;
      
      if (miningSiteType === "asteroid_field") {
        // Asteroids: points all around the ship
        angle = Math.floor(Math.random() * 360);
        distance = 30 + Math.random() * 70; // 30% to 100% radius
      } else {
        // Planetary: points concentrated on one side (the planet)
        // Let's say the planet is at angle 0 +/- 45 degrees
        angle = (Math.random() * 90 - 45 + 360) % 360;
        distance = 60 + Math.random() * 30; // Concentrated further out
      }

      const difficultyRoll = Math.random();
      const difficulty: MiningDeposit["difficulty"] = isMotherlode ? "Legendary" : difficultyRoll < 0.3 ? "High" : difficultyRoll < 0.7 ? "Medium" : "Low";
      
      const baseYield = isMotherlode ? 350 : difficulty === "High" ? 80 : difficulty === "Medium" ? 60 : 40;
      const yieldAmount = Math.floor(baseYield + Math.random() * 20);

      deps.push({
        id: `dep-${i}`,
        name: isMotherlode ? "MOTHERLODE CORE" : `${miningSiteType === "asteroid_field" ? "Asteroid" : "Crust"} Pocket ${String.fromCharCode(65 + i)}`,
        angle,
        distance,
        yield: yieldAmount,
        difficulty,
        intensity: isMotherlode ? 1.0 : 0.4 + Math.random() * 0.5,
        frequency: 100 + Math.random() * 300,
        analyzed: 0,
        isMotherlode
      });
    }
    return deps;
  }, [miningSiteType]);

  // Radar sweep animation
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setSweepAngle(prev => (prev + 4) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Sweep audio feedback effect
  useEffect(() => {
    deposits.forEach(d => {
      if (Math.abs(sweepAngle - d.angle) < 4) {
        AudioEngine.playBeep(400 + (d.yield / 2), 0.03, "sine");
      }
    });
  }, [sweepAngle, deposits]);

  // Waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }

      // Signal calculation
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      
      const activeDep = deposits.find(d => Math.abs(antennaAngle - d.angle) < 20);
      
      for (let x = 0; x < canvas.width; x++) {
        let y = canvas.height / 2;
        
        // Base noise
        y += (Math.random() - 0.5) * 5;

        // Signal peaks
        if (activeDep) {
          const angularDist = Math.abs(antennaAngle - activeDep.angle);
          const angleFactor = Math.max(0, 1 - angularDist / 20);
          
          const freqDist = Math.abs(x - activeDep.frequency);
          if (freqDist < 40) {
            const curve = Math.exp(-Math.pow(freqDist / 15, 2));
            y -= activeDep.intensity * 60 * angleFactor * curve;
          }
        }

        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = themeBg === "bg-green-500" ? "#22c55e" : themeBg === "bg-amber-500" ? "#f59e0b" : "#22d3ee";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Target line
      ctx.strokeStyle = "#eab308";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(tunedFreq, 0);
      ctx.lineTo(tunedFreq, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [antennaAngle, deposits, themeBg, tunedFreq]);

  const alignedDeposit = deposits.find(d => 
    Math.abs(antennaAngle - d.angle) < 5 && 
    Math.abs(tunedFreq - d.frequency) < 10
  );

  const startAnalysis = () => {
    if (!alignedDeposit) {
      AudioEngine.playUIError();
      return;
    }
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    AudioEngine.playBeep(880, 0.1);
  };

  // Analysis progress ticker
  useEffect(() => {
    if (!isAnalyzing || !alignedDeposit) return;
    
    const interval = setInterval(() => {
      setAnalysisProgress(p => {
        if (p >= 100) return 100;
        const next = Math.min(100, p + 5);
        if (next < 100) {
          AudioEngine.playBeep(400 + next * 5, 0.05);
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isAnalyzing, alignedDeposit]);

  // Completion effect
  useEffect(() => {
    if (analysisProgress >= 100 && isAnalyzing && alignedDeposit) {
      setIsAnalyzing(false);
      // Use a small timeout to ensure the state update happens outside the effect tick if needed, 
      // though inside useEffect is generally safe for parent updates as long as it's not during render.
      onSelectDeposit(alignedDeposit.yield, alignedDeposit.name);
    }
  }, [analysisProgress, isAnalyzing, alignedDeposit, onSelectDeposit]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 font-mono">
      <div className={`w-full max-w-4xl bg-neutral-950 border-2 ${themeBorder} rounded-lg flex flex-col shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <Radio className={`animate-pulse ${themeText}`} />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tighter">
                Manual Mineral Scan Matrix v4.2
              </h2>
              <p className="text-[10px] opacity-60">Pinpoint localized high-density mineral deposits within current sector.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition text-neutral-400">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Radar Column */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full max-w-[300px] mx-auto border border-white/10 rounded-full bg-black flex items-center justify-center overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="w-full h-[1px] bg-white" />
                <div className="h-full w-[1px] bg-white absolute" />
                <div className="w-[70%] h-[70%] border border-white rounded-full absolute" />
                <div className="w-[40%] h-[40%] border border-white rounded-full absolute" />
              </div>

              {/* Sweep */}
              <div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-current/20 origin-center"
                style={{ transform: `rotate(${sweepAngle}deg)`, color: themeBg.replace('bg-', '') }}
              />

              {/* Player */}
              <div className="w-2 h-2 bg-yellow-400 rounded-full z-10 shadow-[0_0_10px_#facc15]" />

              {/* Deposits */}
              {deposits.map(d => {
                const rad = (d.angle * Math.PI) / 180;
                const x = 50 + Math.sin(rad) * (d.distance / 2);
                const y = 50 - Math.cos(rad) * (d.distance / 2);
                const isSelected = selectedDepositId === d.id;
                
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDepositId(d.id);
                      setAntennaAngle(d.angle);
                      AudioEngine.playBeep(600, 0.05);
                    }}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full transition-all ${
                      isSelected ? "bg-white scale-125 z-20 shadow-[0_0_15px_white]" : "bg-red-500/40 animate-pulse"
                    }`}
                  />
                );
              })}

              {/* Antenna Aim */}
              <div 
                className="absolute inset-0 border-r border-yellow-400/30 pointer-events-none origin-center"
                style={{ transform: `rotate(${antennaAngle - 90}deg)` }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold">
                <span className="opacity-60">Antenna Azimuth</span>
                <span className="text-yellow-400">{antennaAngle}°</span>
              </div>
              <input 
                type="range" min="0" max="359" value={antennaAngle}
                onChange={e => setAntennaAngle(parseInt(e.target.value))}
                className="w-full accent-yellow-400"
              />
            </div>
          </div>

          {/* Analysis Column */}
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-white/10 pb-2">
                <Activity size={14} className={themeText} /> Spectral Feed
              </div>
              <div className="bg-black border border-white/10 rounded p-2 h-32">
                <canvas ref={canvasRef} width="400" height="120" className="w-full h-full" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold">
                <span className="opacity-60">Wavelength Fine-Tune</span>
                <span className="text-yellow-400">{tunedFreq} NM</span>
              </div>
              <input 
                type="range" min="0" max="400" value={tunedFreq}
                onChange={e => setTunedFreq(parseInt(e.target.value))}
                className="w-full accent-yellow-400"
              />
            </div>

            <div className="flex-grow flex flex-col justify-end gap-4">
              <div className="bg-black/40 border border-white/5 rounded p-3 text-[10px] space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-60 uppercase">Targeting Status:</span>
                  <span className={alignedDeposit ? "text-emerald-400 font-bold" : "text-red-400"}>
                    {alignedDeposit ? "LOCK ACQUIRED" : "NO SIGNAL LOCK"}
                  </span>
                </div>
                {alignedDeposit && (
                  <div className="animate-fade-in space-y-1">
                    <div className="flex justify-between">
                      <span className="opacity-60">DEPOSIT:</span>
                      <span className="text-white font-bold">{alignedDeposit.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">ESTIMATED YIELD:</span>
                      <span className="text-emerald-400 font-bold">~{alignedDeposit.yield}% RETRIEVAL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">DIFFICULTY:</span>
                      <span className={alignedDeposit.difficulty === "Low" ? "text-green-400" : alignedDeposit.difficulty === "Medium" ? "text-yellow-400" : "text-red-400"}>
                        {alignedDeposit.difficulty}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                disabled={!alignedDeposit || isAnalyzing}
                onClick={startAnalysis}
                className={`w-full py-3 rounded border-2 font-bold uppercase text-xs tracking-widest transition-all ${
                  alignedDeposit && !isAnalyzing
                    ? `${themeBorder} ${themeText} hover:bg-current/10 animate-pulse`
                    : "border-white/5 text-white/20 cursor-not-allowed"
                }`}
              >
                {isAnalyzing ? `Analyzing... ${analysisProgress}%` : "Initiate Targeted Scan"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[10px] uppercase">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><Layers size={12} className="text-cyan-400" /> Sensor Quality: {(scannerQuality * 100).toFixed(0)}%</span>
            <span className="flex items-center gap-1.5"><Database size={12} className="text-amber-400" /> Site Type: {miningSiteType.replace('_', ' ')}</span>
          </div>
          <span className="opacity-40">Scan Mode: PINPOINT EXTRACTION</span>
        </div>
      </div>
    </div>
  );
};
