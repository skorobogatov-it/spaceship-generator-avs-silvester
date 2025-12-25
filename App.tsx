
import React, { useState, useEffect } from 'react';
import { GeneratorState, ShipFraction, ShipPurpose } from './types';
import { generateShipImage } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import ShipPreview from './components/ShipPreview';
import { MILITARY_CLASSES, CIVILIAN_CLASSES } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<GeneratorState>({
    name: 'ЛЕВИАФАН-IX',
    sizeIndex: 0, 
    fraction: ShipFraction.EMPIRE,
    purpose: ShipPurpose.MILITARY,
    originPlanet: 'Гербера',
    isRandom: false,
    turretCount: 2
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.isRandom) return;

    let updates: Partial<GeneratorState> = {};

    // Horde and War Orphans: Only military
    if ((state.fraction === ShipFraction.HORDE || state.fraction === ShipFraction.WAR_ORPHANS) && state.purpose !== ShipPurpose.MILITARY) {
      updates.purpose = ShipPurpose.MILITARY;
    }

    // Construction Cartel and PJSC Empire: Only civilian
    if ((state.fraction === ShipFraction.CONSTRUCTION_CARTEL || state.fraction === ShipFraction.PJSC_EMPIRE) && state.purpose !== ShipPurpose.CIVILIAN) {
      updates.purpose = ShipPurpose.CIVILIAN;
    }

    // Planet of Origin logic
    if (state.fraction === ShipFraction.EMPIRE && state.originPlanet === 'Корусант') updates.originPlanet = 'Гербера';
    if (state.fraction === ShipFraction.CONSTRUCTION_CARTEL) updates.originPlanet = 'Помпада';
    if (state.fraction === ShipFraction.KOVARL) updates.originPlanet = 'Коварол';
    if (state.fraction === ShipFraction.FREE_FLEET) updates.originPlanet = 'Гуль';
    if (state.fraction === ShipFraction.PJSC_EMPIRE) updates.originPlanet = 'Земля';

    // Size limits logic
    if (state.fraction === ShipFraction.KOVARL && state.sizeIndex > 4) updates.sizeIndex = 4;
    if (state.fraction === ShipFraction.FREE_FLEET && state.sizeIndex > 7) updates.sizeIndex = 7;
    if (state.fraction === ShipFraction.WAR_ORPHANS && state.sizeIndex > 5) updates.sizeIndex = 5;
    if (state.fraction === ShipFraction.CAVERNA && state.sizeIndex > 2) updates.sizeIndex = 2;
    if (state.fraction === ShipFraction.PJSC_EMPIRE && state.sizeIndex > 2) updates.sizeIndex = 2;
    
    if (state.fraction === ShipFraction.CONSTRUCTION_CARTEL) {
      if (state.sizeIndex < 2) updates.sizeIndex = 2;
      if (state.sizeIndex > 9) updates.sizeIndex = 9;
    }

    if (Object.keys(updates).length > 0) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, [state.fraction, state.purpose, state.sizeIndex, state.isRandom]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    let activeState = { ...state };

    if (state.isRandom) {
      const fractions = Object.values(ShipFraction);
      const randomFraction = fractions[Math.floor(Math.random() * fractions.length)];
      const randomPurpose = Math.random() > 0.5 ? ShipPurpose.MILITARY : ShipPurpose.CIVILIAN;
      const randomSize = Math.floor(Math.random() * 11); // 0 to 10 index
      
      activeState = {
        ...state,
        name: `X-${Math.random().toString(36).substring(7).toUpperCase()}`,
        fraction: randomFraction,
        purpose: randomPurpose,
        sizeIndex: randomSize,
        originPlanet: '' // Empty for random as requested
      };
      
      // Update state so UI reflects the "Random" result
      setState(activeState);
    }

    try {
      const url = await generateShipImage(activeState);
      setImageUrl(url);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при генерации изображения.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-black">
      <div className="scanline"></div>
      
      <aside className="w-full md:w-[400px] border-r border-white/10 p-6 flex flex-col gap-8 bg-[#0a0a0a] z-20 overflow-y-auto max-h-screen">
        <header>
          <h1 className="text-3xl font-orbitron font-black text-white flex items-center gap-3">
            <i className="fa-solid fa-rocket text-cyan-400"></i>
            SHIP GEN
          </h1>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">Orbital Shipyard Interface v2.9</p>
        </header>

        <ControlPanel 
          state={state} 
          setState={setState} 
          onGenerate={handleGenerate} 
          isGenerating={isGenerating} 
        />

        <div className="mt-auto pt-6 border-t border-white/5 text-[10px] text-white/30 italic">
          Спроектировано для нужд межзвездной экспансии.
          <br />
          По мотивам цикла "Трон галактики будет моим!"
        </div>
      </aside>

      <main className="flex-1 bg-black overflow-hidden flex items-center justify-center p-4 relative">
        {error && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-red-900/80 border border-red-500 text-white px-6 py-3 rounded-md animate-bounce">
            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
            {error}
          </div>
        )}

        <ShipPreview 
          imageUrl={imageUrl} 
          state={state} 
          isGenerating={isGenerating} 
        />
        
        <div className="absolute top-4 right-4 pointer-events-none text-right">
          <div className="text-[10px] text-cyan-500/50 uppercase tracking-tighter">Status: {isGenerating ? 'GENERATE_ACTIVE' : 'IDLE'}</div>
          <div className="text-[10px] text-cyan-500/50 uppercase tracking-tighter">Coord: 45.2N 12.8W</div>
        </div>
      </main>
    </div>
  );
};

export default App;
