
import React from 'react';
import { GeneratorState, ShipFraction, ShipPurpose } from '../types';
import { FRACTION_DETAILS, MILITARY_CLASSES, CIVILIAN_CLASSES } from '../constants';

interface ControlPanelProps {
  state: GeneratorState;
  setState: React.Dispatch<React.SetStateAction<GeneratorState>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ state, setState, onGenerate, isGenerating }) => {
  const currentSizeList = state.purpose === ShipPurpose.MILITARY ? MILITARY_CLASSES : CIVILIAN_CLASSES;
  
  const isHorde = state.fraction === ShipFraction.HORDE;
  const isOrphans = state.fraction === ShipFraction.WAR_ORPHANS;
  const isCartel = state.fraction === ShipFraction.CONSTRUCTION_CARTEL;
  const isCaverna = state.fraction === ShipFraction.CAVERNA;
  const isPJSC = state.fraction === ShipFraction.PJSC_EMPIRE;
  const isMilitary = state.purpose === ShipPurpose.MILITARY;

  // Size limit calculation
  let minIdx = 0;
  let maxIdx = currentSizeList.length - 1;
  if (state.fraction === ShipFraction.KOVARL) maxIdx = 4;
  if (state.fraction === ShipFraction.FREE_FLEET) maxIdx = 7;
  if (isOrphans) maxIdx = 5;
  if (isCaverna || isPJSC) maxIdx = 2;
  if (isCartel) { minIdx = 2; maxIdx = 9; }

  const safeSizeIndex = Math.min(Math.max(state.sizeIndex, minIdx), maxIdx);
  const currentSize = currentSizeList[safeSizeIndex];

  // Turret range logic
  const getTurretRange = (idx: number) => {
    if (idx <= 1) return { min: 0, max: 3 };
    if (idx === 2) return { min: 1, max: 5 };
    if (idx === 3) return { min: 1, max: 6 };
    if (idx === 4) return { min: 2, max: 8 };
    if (idx === 5) return { min: 2, max: 10 };
    if (idx === 6) return { min: 2, max: 12 };
    return { min: 2, max: 16 };
  };
  const turretRange = getTurretRange(safeSizeIndex);

  // Planet Input Logic
  const canEditPlanet = state.fraction === ShipFraction.EMPIRE || isCartel;
  const shouldShowPlanetInput = state.fraction !== ShipFraction.HORDE && !isOrphans && !isCaverna && !state.isRandom;

  // Fractions ordering and coloring
  const fractionGroups = [
    { 
      members: [ShipFraction.EMPIRE, ShipFraction.WAR_ORPHANS, ShipFraction.KOVARL, ShipFraction.CAVERNA],
      textColor: 'text-white'
    },
    {
      members: [ShipFraction.FREE_FLEET, ShipFraction.CONSTRUCTION_CARTEL],
      textColor: 'text-yellow-200'
    },
    {
      members: [ShipFraction.PJSC_EMPIRE],
      textColor: 'text-cyan-200'
    },
    {
      members: [ShipFraction.HORDE],
      textColor: 'text-red-500 font-black'
    }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex justify-between">
          Название корабля
          <span className="text-[10px] text-cyan-500">ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
        </label>
        <input 
          type="text" 
          maxLength={30}
          value={state.name}
          disabled={state.isRandom}
          onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded p-3 text-white outline-none focus:border-cyan-500 transition-colors font-mono disabled:opacity-50"
          placeholder="Введите название..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="isRandom"
          checked={state.isRandom}
          onChange={(e) => setState(prev => ({ ...prev, isRandom: e.target.checked }))}
          className="w-4 h-4 accent-cyan-500 rounded border-white/10 bg-white/5"
        />
        <label htmlFor="isRandom" className="text-xs font-bold text-white uppercase tracking-widest cursor-pointer hover:text-cyan-400 transition-colors">
          Случайный корабль
        </label>
      </div>

      {shouldShowPlanetInput && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
          <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Планета приписки</label>
          <input 
            type="text" 
            maxLength={30}
            disabled={!canEditPlanet}
            value={state.originPlanet}
            onChange={(e) => setState(prev => ({ ...prev, originPlanet: e.target.value }))}
            className={`bg-white/5 border border-white/10 rounded p-2 text-sm text-white outline-none transition-colors font-mono ${!canEditPlanet ? 'opacity-50 cursor-not-allowed' : 'focus:border-cyan-500'}`}
            placeholder="Локация..."
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Назначение</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(ShipPurpose).map((p) => {
            let disabled = state.isRandom;
            let subText = "";
            if (!state.isRandom) {
              if (isHorde && p === ShipPurpose.CIVILIAN) { disabled = true; subText = "Орда не строит гражданские суда"; }
              if (isOrphans && p === ShipPurpose.CIVILIAN) { disabled = true; subText = "Сироты Войны не закупают гражданские суда"; }
              if (isCartel && p === ShipPurpose.MILITARY) { disabled = true; subText = "Картель строит только гражданские суда"; }
              if (isPJSC && p === ShipPurpose.MILITARY) { disabled = true; subText = "ПАО Империя строит только гражданские суда"; }
            }

            return (
              <div key={p} className="flex flex-col gap-1">
                <button
                  disabled={disabled}
                  onClick={() => setState(prev => ({ ...prev, purpose: p }))}
                  className={`py-2 rounded text-xs transition-all border font-bold ${
                    state.purpose === p 
                      ? 'bg-red-500/20 border-red-500 text-red-400' 
                      : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
                {disabled && !state.isRandom && (
                   <div className="text-[8px] text-red-500 font-bold uppercase tracking-tight text-center leading-none">{subText}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`flex flex-col gap-2 transition-opacity ${state.isRandom ? 'opacity-30 pointer-events-none' : ''}`}>
        <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Фракция</label>
        <div className="grid grid-cols-2 gap-1.5 overflow-hidden">
          {fractionGroups.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {group.members.map((f) => (
                <button
                  key={f}
                  onClick={() => setState(prev => ({ ...prev, fraction: f }))}
                  className={`text-left px-3 py-2 rounded transition-all border ${
                    state.fraction === f 
                      ? 'bg-cyan-500/10 border-cyan-500' 
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className={`text-[10px] font-bold leading-none truncate ${state.fraction === f ? 'text-cyan-400' : group.textColor}`}>{f}</div>
                  <div className="text-[7px] opacity-40 mt-1 leading-tight line-clamp-1">
                    {FRACTION_DETAILS[f].description}
                  </div>
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className={`flex flex-col gap-2 transition-opacity ${state.isRandom ? 'opacity-30 pointer-events-none' : ''}`}>
        <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex justify-between">
          Класс размерности
          <span className="text-cyan-400 font-bold">{safeSizeIndex + 1}</span>
        </label>
        <input 
          type="range" 
          min={minIdx} 
          max={maxIdx} 
          step="1"
          value={safeSizeIndex}
          onChange={(e) => setState(prev => ({ ...prev, sizeIndex: parseInt(e.target.value) }))}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="bg-white/5 p-3 rounded border border-white/5">
          <div className="text-sm font-bold text-white uppercase tracking-tight">{currentSize.label}</div>
          <div className="text-[10px] text-white/40 mt-1">{currentSize.description}</div>
          <div className="mt-2 text-[9px] text-cyan-500/80">
            Габариты: ~{currentSize.maxLength}м
          </div>
        </div>
      </div>

      {isMilitary && !isHorde && (
        <div className="flex flex-col gap-2 animate-in slide-in-from-right-2">
          <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex justify-between">
            Число основных турелей
            <span className="text-red-400 font-bold">{state.turretCount}</span>
          </label>
          <input 
            type="range" 
            min={turretRange.min} 
            max={turretRange.max} 
            step="1"
            value={Math.min(Math.max(state.turretCount, turretRange.min), turretRange.max)}
            onChange={(e) => setState(prev => ({ ...prev, turretCount: parseInt(e.target.value) }))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isGenerating || (!state.name && !state.isRandom)}
        className={`w-full py-4 mt-1 font-orbitron font-bold rounded flex items-center justify-center gap-3 transition-all relative overflow-hidden group ${
          isGenerating 
            ? 'bg-white/10 text-white/40 cursor-not-allowed' 
            : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'
        }`}
      >
        {isGenerating ? (
          <><i className="fa-solid fa-circle-notch animate-spin"></i>СИНТЕЗ...</>
        ) : (
          <><i className="fa-solid fa-microchip"></i>ГЕНЕРИРОВАТЬ</>
        )}
      </button>
    </div>
  );
};

export default ControlPanel;
