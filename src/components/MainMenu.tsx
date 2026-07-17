import React, { useMemo } from "react";
import { Sparkles, RefreshCw, Radio } from "lucide-react";

interface MainMenuProps {
  onInitiateStart: () => void;
  onQuickLoad?: () => void;
  hasSave?: boolean;
  onLoadAddon: (addon: any, name: string) => void;
  loadedAddons: string[];
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onInitiateStart,
  onQuickLoad,
  hasSave,
  onLoadAddon,
  loadedAddons,
}) => {
  // Generate deterministic stars for the menu background
  const stars = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      top: `${(i * 17) % 100}%`,
      left: `${(i * 23) % 100}%`,
      size: `${((i * 3) % 3) + 1}px`,
      opacity: ((i % 5) + 3) / 10,
    }));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onLoadAddon(json, file.name);
      } catch (err) {
        alert("Invalid JSON format. Please upload a valid game addon JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950 p-4 font-mono text-neutral-200 overflow-hidden select-none">
      {/* Immersive Deep Space Starry Backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star, idx) => (
          <div
            key={idx}
            className="absolute bg-white rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
        {/* Futuristic glowing solar core backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-950/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-950/10 blur-[90px] pointer-events-none" />
      </div>

      {/* Retro CRT Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />

      {/* Core Terminal Chassis */}
      <div className="relative max-w-lg w-full border border-cyan-500/30 rounded-lg p-8 shadow-[0_0_80px_rgba(6,182,212,0.15)] bg-black/90 backdrop-blur-md overflow-hidden space-y-6">
        
        {/* Tech decorative corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
        
        {/* Scanning telemetry line */}
        <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent top-0 animate-[bounce_6s_infinite_linear] pointer-events-none" />

        {/* Header Telemetry */}
        <div className="flex justify-between text-[8px] text-cyan-500/60 uppercase border-b border-neutral-900 pb-2">
          <span>SYS_BOOT: OK // DEV_REV: 9.0</span>
          <span>STARDATE: {new Date().getFullYear()}.{(new Date().getMonth() + 1).toString().padStart(2, '0')}.{new Date().getDate().toString().padStart(2, '0')}</span>
        </div>

        {/* Branding Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-cyan-500/25 bg-cyan-950/30 text-cyan-400 rounded text-[9px] uppercase tracking-widest font-bold">
            <Radio size={10} className="animate-pulse" /> Galactic Terminal Protocol
          </div>
          <h1 className="text-4xl font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            COSMOS-OS v9.0
          </h1>
          <p className="text-[11px] text-neutral-400 tracking-[0.3em] uppercase font-bold">
            WARP-DRIVE NAVIGATOR v9.0
          </p>
        </div>

        {/* Decors Systems diagnostics */}
        <div className="border border-neutral-900 bg-black/60 p-3 rounded flex justify-between items-center text-[9px] text-neutral-400">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              SYSTEM CORE ONLINE
            </div>
            <span>HYPERPROPULSION CORE READY</span>
          </div>
          <div className="text-right space-y-0.5">
            <div>SCANNER MATRIX: <span className="text-cyan-400 font-bold">CALIBRATED</span></div>
            <div>SHIELDS DISH: <span className="text-cyan-400 font-bold">GRID SYNCED</span></div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-4">
          {hasSave && onQuickLoad && (
            <button
              onClick={onQuickLoad}
              className="w-full flex items-center justify-center gap-3 py-3.5 border border-cyan-500/80 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-500 hover:text-black font-extrabold uppercase tracking-widest transition-all duration-200 rounded cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <RefreshCw size={15} className="animate-spin" style={{ animationDuration: "6s" }} />
              RESUME PRIOR VOYAGE
            </button>
          )}

          <button
            onClick={onInitiateStart}
            className="w-full flex items-center justify-center gap-3 py-4 border border-emerald-500 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-500 hover:text-black font-extrabold uppercase tracking-widest transition-all duration-200 rounded cursor-pointer hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <Sparkles size={16} className="text-emerald-400 hover:text-black" />
            {hasSave ? "INITIALIZE NEW FLIGHT" : "INITIALIZE FLIGHT SYSTEMS"}
          </button>

          {/* Dynamic Custom Addon Injector Box */}
          <div className="border border-cyan-500/20 bg-cyan-950/10 p-4 rounded space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 tracking-wider">
              <span>DYNAMICAL JSON ADD-ONS</span>
              <span className="text-[8px] text-neutral-400 px-1 py-0.5 border border-cyan-500/20 rounded bg-cyan-950/40">HOT LOAD</span>
            </div>
            <p className="text-[9px] text-neutral-400 leading-relaxed">
              Inject custom quests, items, and ships on-the-fly into the active database.
            </p>
            
            <div className="flex items-center gap-2">
              <label className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/30 text-cyan-400 font-bold uppercase text-[9px] tracking-wider transition-all duration-200 rounded cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                LOAD ADDON FILE (.JSON)
              </label>
            </div>

            {loadedAddons.length > 0 && (
              <div className="space-y-1 text-[9px] pt-1 border-t border-cyan-500/10">
                <div className="text-neutral-500 uppercase tracking-widest font-bold text-[8px]">ACTIVE MODS / ADDONS:</div>
                <div className="grid grid-cols-1 gap-1">
                  {loadedAddons.map((name, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="py-2.5 border border-neutral-900 bg-neutral-950/40 text-neutral-400 hover:text-white rounded transition text-[10px] font-bold uppercase tracking-wider">
              PILOT REGISTER v9
            </div>
            <div className="py-2.5 border border-neutral-900 bg-neutral-950/40 text-neutral-400 hover:text-white rounded transition text-[10px] font-bold uppercase tracking-wider">
              SYSTEM LOG v9
            </div>
          </div>
        </div>

        {/* Footer telemetry */}
        <div className="text-center text-[9px] text-neutral-600 border-t border-neutral-900 pt-3">
          SECURITY PROTOCOL ENABLED // ENCRYPTED SUB-CORE LINKED
        </div>
      </div>
    </div>
  );
};
