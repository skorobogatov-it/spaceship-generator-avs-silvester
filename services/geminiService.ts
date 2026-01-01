import { GoogleGenAI } from "@google/genai";
import { GeneratorState, ShipFraction, ShipPurpose } from "../types";
import { FRACTION_DETAILS, MILITARY_CLASSES, CIVILIAN_CLASSES } from "../constants";

// Кэш для хранения сгенерированных изображений (чтобы не превысить лимиты)
const imageCache = new Map<string, { image: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа

// Очередь запросов для соблюдения rate limits
const requestQueue: Array<() => Promise<string>> = [];
let isProcessing = false;
const MIN_REQUEST_INTERVAL = 4100; // 4.1 секунды между запросами (15/мин)

// Модель по умолчанию - используем flash, так как flash-image требует биллинга
const DEFAULT_MODEL = "gemini-1.5-flash";

class GeminiQueue {
  private lastRequestTime = 0;

  async add(request: () => Promise<string>): Promise<string> {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          // Соблюдаем интервал между запросами
          const now = Date.now();
          const timeSinceLast = now - this.lastRequestTime;
          
          if (timeSinceLast < MIN_REQUEST_INTERVAL) {
            await this.delay(MIN_REQUEST_INTERVAL - timeSinceLast);
          }
          
          this.lastRequestTime = Date.now();
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      requestQueue.push(wrappedRequest);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (isProcessing || requestQueue.length === 0) return;
    
    isProcessing = true;
    const request = requestQueue.shift();
    
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error("Request failed:", error);
      }
    }
    
    isProcessing = false;
    setTimeout(() => this.processQueue(), 100);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const queue = new GeminiQueue();

// Функция для создания кэш-ключа
function getCacheKey(state: GeneratorState): string {
  return `${state.name}-${state.fraction}-${state.purpose}-${state.sizeIndex}-${state.originPlanet}`;
}

// Функция для получения fallback изображения
function getFallbackImage(state: GeneratorState): string {
  const fallbackImages = {
    [ShipFraction.EMPIRE]: [
      'https://placehold.co/600x400/0a0a0a/00ffff?text=EMPIRE+SHIP',
      'https://placehold.co/600x400/0a0a0a/ff6600?text=IMPERIAL+CLASS',
    ],
    [ShipFraction.HORDE]: [
      'https://placehold.co/600x400/330000/ff3300?text=HORDE+WARSHIP',
      'https://placehold.co/600x400/440000/ff5500?text=ORCISH+VESSEL',
    ],
    [ShipFraction.FREE_FLEET]: [
      'https://placehold.co/600x400/003333/00ffcc?text=FREE+FLEET',
      'https://placehold.co/600x400/002222/00ccaa?text=MERCENARY+SHIP',
    ],
    [ShipFraction.KOVARL]: [
      'https://placehold.co/600x400/223322/88ff88?text=KOVARL+SCOUT',
      'https://placehold.co/600x400/112211/55ff55?text=FOREST+SHIP',
    ],
    [ShipFraction.CAVERNA]: [
      'https://placehold.co/600x400/ffffff/000000?text=CAVERNA+WHITE',
      'https://placehold.co/600x400/eeeeee/333333?text=SNOW+SHIP',
    ],
    [ShipFraction.WAR_ORPHANS]: [
      'https://placehold.co/600x400/222233/aaaaff?text=WAR+ORPHAN',
      'https://placehold.co/600x400/111122/8888ff?text=ORPHAN+FLEET',
    ],
    [ShipFraction.CONSTRUCTION_CARTEL]: [
      'https://placehold.co/600x400/553300/ffaa00?text=CONSTRUCTION',
      'https://placehold.co/600x400/664411/ffbb44?text=INDUSTRIAL+SHIP',
    ],
    [ShipFraction.PJSC_EMPIRE]: [
      'https://placehold.co/600x400/000055/0088ff?text=PJSC+EARTH',
      'https://placehold.co/600x400/000066/0099ff?text=EARTH+STATION',
    ],
  };

  const images = fallbackImages[state.fraction] || [
    'https://placehold.co/600x400/0a0a0a/00ffff?text=STARSHIP+' + encodeURIComponent(state.name)
  ];
  
  return images[Math.floor(Math.random() * images.length)];
}

// Основная функция генерации изображения
export const generateShipImage = async (state: GeneratorState): Promise<string> => {
  const cacheKey = getCacheKey(state);
  
  // Проверяем кэш
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("Returning cached image");
    return cached.image;
  }

  // Проверяем наличие API ключа
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn("Gemini API key not found, using fallback image");
    const fallback = getFallbackImage(state);
    imageCache.set(cacheKey, { image: fallback, timestamp: Date.now() });
    return fallback;
  }

  // Проверяем, не превышены ли лимиты
  let quotaExceeded = false;
  if (typeof window !== 'undefined' && window.localStorage) {
    quotaExceeded = localStorage.getItem('gemini_quota_exceeded') !== null;
  }
  
  if (quotaExceeded) {
    console.warn("Daily quota exceeded, using fallback");
    const fallback = getFallbackImage(state);
    imageCache.set(cacheKey, { image: fallback, timestamp: Date.now() });
    return fallback;
  }

  try {
    // Используем очередь для соблюдения rate limits
    return await queue.add(async () => {
      const ai = new GoogleGenAI({ apiKey });
      
      const fractionInfo = FRACTION_DETAILS[state.fraction];
      const sizeClass = state.purpose === ShipPurpose.MILITARY 
        ? MILITARY_CLASSES[state.sizeIndex] 
        : CIVILIAN_CLASSES[state.sizeIndex];

      // Specific background for PJSC Empire
      const backgroundRequirement = state.fraction === ShipFraction.PJSC_EMPIRE 
        ? "The background MUST be Earth, specifically showing the Eastern Hemisphere from high orbit, with dark blue oceans and glowing city lights on the night side."
        : "The background MUST be deep dark space with a faint, beautiful nebula, distant galaxies, and stars.";

      // Weapons logic
      const weaponsRequirement = (state.purpose === ShipPurpose.MILITARY && state.fraction !== ShipFraction.HORDE)
        ? `The ship MUST have ${state.turretCount} clearly visible, prominent main turrets or heavy gun batteries protruding from the hull. 
           These cannons should be detailed and integrated into the design, matching the ${state.fraction} aesthetic.`
        : state.fraction === ShipFraction.HORDE
        ? "The ship features biological protrusions, bone-like spikes, and organic weapon pods, but no mechanical turrets."
        : "No visible weapons systems.";

      // Purpose-based design rules
      const designRules = state.purpose === ShipPurpose.MILITARY
        ? `The ship is a WARSHIP. It MUST feature visible tactical lighting and armor plating. 
           The shape must be aggressive, aerodynamic, or wedge-shaped (star destroyer style).
           ${weaponsRequirement}`
        : `The ship is a CIVILIAN vessel. It MUST have a peaceful, non-aggressive silhouette. 
           The shapes should be rectangular, square, or oval/spherical. 
           Focus on habitation modules, storage containers, large viewports, or industrial machinery. ${weaponsRequirement}`;
      
      const prompt = `
        Create a professional cinematic concept art of a single starship or orbital structure shown from a profile (side) view. 
        ${backgroundRequirement}
        The object itself should be the main focal point, highly detailed, shown as a clear side projection.
        
        Style: ${fractionInfo.style}.
        Purpose: ${state.purpose === ShipPurpose.MILITARY ? 'Military/Combat/Warship' : 'Civilian/Transport/Scientific/Orbital Station'}.
        Ship Class: ${sizeClass.label}.
        Size context: Approximately ${sizeClass.maxLength} meters in length.
        Fraction: ${state.fraction}.
        
        Design constraints:
        ${designRules}
        
        Special Instructions:
        ${state.fraction === ShipFraction.CAVERNA ? "- The ship must be pristine, snow-white, and have very smooth aerodynamic curves with high-tech glowing accents." : ""}
        ${state.fraction === ShipFraction.PJSC_EMPIRE ? "- The ship should look like a realistic early space-age station (like ISS), with modular white segments, solar panels, and golden thermal foil." : ""}
        
        Ensure it looks like high-end science fiction concept art.
        Absolutely NO text labels or UI elements inside the generated image. 
        Only the vessel in its environment.
        
        Respond with a detailed text description of the image that I can use for stable diffusion or other image generation.
      `;

      try {
        // Используем модель, доступную в бесплатном тарифе
        const response = await ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        });

        const description = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Поскольку бесплатный Gemini не генерирует изображения, возвращаем fallback
        console.log("Generated description:", description);
        
        const fallback = getFallbackImage(state);
        imageCache.set(cacheKey, { 
          image: fallback, 
          timestamp: Date.now() 
        });
        
        return fallback;
      } catch (error: any) {
        console.error("Gemini API error:", error);
        
        // Проверяем, не ошибка ли 429 (quota exceeded)
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('gemini_quota_exceeded', 'true');
            // Сбросить через 24 часа
            setTimeout(() => {
              if (window.localStorage) {
                localStorage.removeItem('gemini_quota_exceeded');
              }
            }, 24 * 60 * 60 * 1000);
          }
        }
        
        // Используем fallback в случае ошибки
        const fallback = getFallbackImage(state);
        imageCache.set(cacheKey, { image: fallback, timestamp: Date.now() });
        return fallback;
      }
    });
  } catch (error) {
    console.error("Queue error:", error);
    const fallback = getFallbackImage(state);
    imageCache.set(cacheKey, { image: fallback, timestamp: Date.now() });
    return fallback;
  }
};

// Функция для очистки старого кэша
export const clearOldCache = (): void => {
  const now = Date.now();
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      imageCache.delete(key);
    }
  }
};

// Запускаем очистку кэша каждые 30 минут только в браузере
if (typeof window !== 'undefined') {
  setInterval(clearOldCache, 30 * 60 * 1000);
}
