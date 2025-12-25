
import React, { useMemo, useCallback } from 'react';
import { GeneratorState, ShipPurpose, ShipFraction } from '../types';
import { MILITARY_CLASSES, CIVILIAN_CLASSES } from '../constants';

interface ShipPreviewProps {
  imageUrl: string | null;
  state: GeneratorState;
  isGenerating: boolean;
}

// Silhouette image sources - Raster monochrome gray with transparency
const SILHOUETTE_SOURCES = {
  VITRUVIAN: 'https://img.icons8.com/ios-filled/500/666666/vitruvian-man.png',
  WHALE: 'https://img.icons8.com/ios-filled/500/666666/whale.png'
};

const ShipPreview: React.FC<ShipPreviewProps> = ({ imageUrl, state, isGenerating }) => {
  const currentSizeList = state.purpose === ShipPurpose.MILITARY ? MILITARY_CLASSES : CIVILIAN_CLASSES;
  const currentSize = currentSizeList[state.sizeIndex];
  const displayClass = state.sizeIndex + 1;
  const isPJSC = state.fraction === ShipFraction.PJSC_EMPIRE;
  const isMilitary = state.purpose === ShipPurpose.MILITARY;
  const isHorde = state.fraction === ShipFraction.HORDE;

  // Real-world sizes for comparison
  const scaleData = useMemo(() => {
    // 1-4: Vitruvian Man (Diameter 1.5m)
    // 5-11: Blue Whale (Length 30m)
    if (displayClass <= 4) {
      return { 
        realSize: 1.5, 
        src: SILHOUETTE_SOURCES.VITRUVIAN, 
        label: 'Человек (1.5м)',
        type: 'diameter' 
      };
    }
    return { 
      realSize: 30, 
      src: SILHOUETTE_SOURCES.WHALE, 
      label: 'Синий Кит (30м)',
      type: 'length'
    };
  }, [displayClass]);

  // Calculate percentage of the ship's length the silhouette should occupy.
  const scalePercent = useMemo(() => {
    const shipLength = currentSize.maxLength;
    return (scaleData.realSize / shipLength) * 100;
  }, [currentSize.maxLength, scaleData.realSize]);

  const shouldShowOrigin = state.fraction !== ShipFraction.HORDE && state.fraction !== ShipFraction.WAR_ORPHANS && state.fraction !== ShipFraction.CAVERNA && state.originPlanet;

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${state.name || 'ship'}_${state.fraction}_class${displayClass}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl, state.name, state.fraction, displayClass]);

  return (
    <div className="w-full max-w-6xl aspect-video relative rounded-lg overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center group bg-[#020408]">
      
      {/* Dynamic Background Overlay */}
      <div className={`absolute inset-0 opacity-40 pointer-events-none transition-all duration-1000 ${isPJSC ? 'scale-110' : ''}`}>
        {isPJSC ? (
          <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1200px-The_Earth_seen_from_Apollo_17.jpg')] bg-cover bg-center opacity-30 mix-blend-screen grayscale-[0.5] contrast-[1.2]"></div>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          </>
        )}
      </div>

      {!imageUrl && !isGenerating && (
        <div className="z-10 text-center">
          <div className="text-cyan-500/10 text-9xl mb-4">
            <i className={`fa-solid ${isPJSC ? 'fa-satellite' : 'fa-shuttle-space'}`}></i>
          </div>
          <p className="text-white/20 font-orbitron tracking-[0.4em] uppercase text-sm">
            {isPJSC ? 'ORBITAL_STATION_SYNC_REQUIRED' : 'Waiting_for_Orbital_Link'}
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="z-20 text-center flex flex-col items-center gap-4">
          <div className="relative w-20 h-20 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="font-orbitron text-cyan-400 text-xs tracking-[0.5em] animate-pulse">
            {isPJSC ? 'CALCULATING_TRAJECTORY' : 'COMPILING_STRUCTURE'}
          </div>
        </div>
      )}

      {imageUrl && !isGenerating && (
        <div className="relative w-full h-full flex items-center justify-center p-8 animate-in fade-in zoom-in duration-1000">
          
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt="Generated Starship" 
              className="max-w-[85%] max-h-[75%] object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.2)]"
            />
          </div>

          <div className="absolute top-0 left-0 w-full p-8 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start pointer-events-none z-20">
            <div>
              <h2 className="text-4xl font-orbitron font-black text-white uppercase tracking-tighter drop-shadow-md">
                {state.name}
              </h2>
              <div className="flex gap-2 items-center mt-1">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${isMilitary ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                  {state.purpose.toUpperCase()}
                </span>
                <div className="text-cyan-400/80 text-xs font-bold tracking-[0.2em]">
                   {currentSize.label}, {state.fraction}
                </div>
                {isMilitary && !isHorde && (
                  <span className="bg-red-900/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-[9px] font-bold rounded flex items-center gap-1">
                    <i className="fa-solid fa-burst text-[7px]"></i> {state.turretCount} ТУР.
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-3 pointer-events-auto">
              <div>
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Класс размерности</div>
                <div className="text-2xl font-orbitron text-white">{displayClass}<span className="text-cyan-500">.α</span></div>
              </div>
              <button 
                onClick={handleDownload}
                className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/50 px-3 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-2"
                title="Сохранить как JPG"
              >
                <i className="fa-solid fa-download"></i>
                JPG
              </button>
            </div>
          </div>

          {/* Dimension Line and Silhouette */}
          <div className="absolute bottom-16 left-[10%] right-[10%] flex flex-col items-center z-20 pointer-events-none">
            <div 
              className="relative mb-2 flex items-end justify-center transition-all duration-500"
              style={{ width: `${Math.max(2, scalePercent)}%`, height: '60px' }}
            >
              <img 
                src={scaleData.src} 
                alt={scaleData.label}
                className="w-full h-full object-contain grayscale opacity-60 brightness-75 drop-shadow-sm"
              />
              <div className="absolute -top-4 whitespace-nowrap text-[8px] text-white/20 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {scaleData.label}
              </div>
            </div>

            <div className="w-full h-6 flex items-center">
              <div className="h-full w-[1px] bg-cyan-500/50"></div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent flex items-center justify-center">
                <div className="bg-black/40 backdrop-blur-sm border border-cyan-500/30 px-6 py-0.5 rounded-full">
                  <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest uppercase">
                    Ориентировочные размеры: {currentSize.maxLength} M
                  </span>
                </div>
              </div>
              <div className="h-full w-[1px] bg-cyan-500/50"></div>
            </div>
          </div>

          {shouldShowOrigin && (
            <div className="absolute bottom-10 left-10 pointer-events-none z-20 animate-in fade-in slide-in-from-left-2">
               <div className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Планета приписки</div>
               <div className="text-sm font-orbitron text-cyan-500/80 uppercase tracking-widest">{state.originPlanet}</div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] flex justify-between items-center pointer-events-none z-30 px-4 opacity-40">
             <div className="text-[8px] text-white/50 font-mono tracking-widest uppercase">
                По мотивам цикла "Трон галактики будет моим!"
             </div>
             <div className="text-[8px] text-white/30 font-mono tracking-widest uppercase">
                PROJECT_OMEGA_SYNC
             </div>
             <div className="text-[8px] text-white/50 font-mono tracking-widest uppercase text-right">
                По мотивам цикла "Трон галактики будет моим!"
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ShipPreview;
