import { GoogleGenAI } from "@google/genai";
import { GeneratorState, ShipFraction, ShipPurpose } from "../types";
import { FRACTION_DETAILS, MILITARY_CLASSES, CIVILIAN_CLASSES } from "../constants";

// Кэш для хранения сгенерированных изображений
const imageCache = new Map<string, { image: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа

// Очередь запросов для соблюдения rate limits
const requestQueue: Array<() => Promise<string>> = [];
let isProcessing = false;
const MIN_REQUEST_INTERVAL = 4100; // 4.1 секунды между запросами (15/мин)

// Модель для генерации изображений (требует биллинга)
const IMAGE_MODEL = "gemini-2.5-flash-preview-image"; // Или "gemini-2.5-flash-preview-image" если доступна

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
  return `${state.name}-${state.fraction}-${state.purpose}-${state.sizeIndex}-${state.originPlanet}-${state.turretCount}`;
}

// Функция для получения fallback изображения (если Gemini не работает)
function getFallbackImage(state: GeneratorState): string {
  // Статические URL изображений космических кораблей
  const shipImages = [
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  ];
  
  // Выбираем изображение на основе хэша от параметров для консистентности
  const hash = [...JSON.stringify(state)].reduce((acc, char) => 
    acc + char.charCodeAt(0), 0);
  
  return shipImages[hash % shipImages.length];
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

  // Проверяем, не превышены ли лимиты (только в браузере)
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

      // Specific background for PJSC Empire (из исходного файла)
      const backgroundRequirement = state.fraction === ShipFraction.PJSC_EMPIRE 
        ? "The background MUST be Earth, specifically showing the Eastern Hemisphere from high orbit, with dark blue oceans and glowing city lights on the night side."
        : "The background MUST be deep dark space with a faint, beautiful nebula, distant galaxies, and stars.";

      // Weapons logic (из исходного файла)
      const weaponsRequirement = (state.purpose === ShipPurpose.MILITARY && state.fraction !== ShipFraction.HORDE)
        ? `The ship MUST have ${state.turretCount} clearly visible, prominent main turrets or heavy gun batteries protruding from the hull. 
           These cannons should be detailed and integrated into the design, matching the ${state.fraction} aesthetic.`
        : state.fraction === ShipFraction.HORDE
        ? "The ship features biological protrusions, bone-like spikes, and organic weapon pods, but no mechanical turrets."
        : "No visible weapons systems.";

      // Purpose-based design rules (из исходного файла)
      const designRules = state.purpose === ShipPurpose.MILITARY
        ? `The ship is a WARSHIP. It MUST feature visible tactical lighting and armor plating. 
           The shape must be aggressive, aerodynamic, or wedge-shaped (star destroyer style).
           ${weaponsRequirement}`
        : `The ship is a CIVILIAN vessel. It MUST have a peaceful, non-aggressive silhouette. 
           The shapes should be rectangular, square, or oval/spherical. 
           Focus on habitation modules, storage containers, large viewports, or industrial machinery. ${weaponsRequirement}`;
      
      // Промпт для генерации изображения (оптимизированный)
      const prompt = `
        Generate a SINGLE, highly detailed science fiction starship or orbital station in profile (side) view.
        
        CRITICAL REQUIREMENTS:
        - ${backgroundRequirement}
        - ${designRules}
        - Style: ${fractionInfo.style}
        - Ship Class: ${sizeClass.label} (approximately ${sizeClass.maxLength} meters)
        - Faction: ${state.fraction}
        - Purpose: ${state.purpose === ShipPurpose.MILITARY ? 'Military Warship' : 'Civilian Vessel'}
        
        ADDITIONAL INSTRUCTIONS:
        ${state.fraction === ShipFraction.CAVERNA ? "- Ship must be pristine white with smooth aerodynamic curves and glowing blue accents." : ""}
        ${state.fraction === ShipFraction.PJSC_EMPIRE ? "- Realistic space station: white modules, solar panels, gold thermal foil (like ISS)." : ""}
        
        VISUAL STYLE:
        - Cinematic concept art quality
        - High detail, professional lighting
        - No text, no labels, no UI elements
        - Only the ship/station in space
        - Aspect ratio: 16:9
        
        IMPORTANT: Generate ONLY the starship/station image. No multiple ships, no text descriptions.
      `;

      try {
        console.log("Sending request to Gemini with model:", IMAGE_MODEL);
        
        // Используем модель для генерации изображений
        const response = await ai.models.generateContent({
          model: IMAGE_MODEL,
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        console.log("Gemini response received:", response);

        // Обрабатываем ответ и извлекаем изображение
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            
            // Сохраняем в кэш
            imageCache.set(cacheKey, { 
              image: imageData, 
              timestamp: Date.now() 
            });
            
            return imageData;
          }
        }
        
        // Если изображение не найдено в ответе, используем fallback
        console.warn("No image data in Gemini response");
        const fallback = getFallbackImage(state);
        imageCache.set(cacheKey, { image: fallback, timestamp: Date.now() });
        return fallback;
        
      } catch (error: any) {
        console.error("Gemini API error:", error);
        
        // Проверяем тип ошибки
        if (error.message?.includes('429') || 
            error.message?.includes('quota') || 
            error.message?.includes('RESOURCE_EXHAUSTED') ||
            error.message?.includes('billing')) {
          
          console.warn("Gemini quota/billing issue detected");
          
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('gemini_quota_exceeded', 'true');
            // Сбросить через 24 часа
            setTimeout(() => {
              if (window.localStorage) {
                localStorage.removeItem('gemini_quota_exceeded');
              }
            }, 24 * 60 * 60 * 1000);
          }
        } else if (error.message?.includes('model') || 
                   error.message?.includes('not found') ||
                   error.message?.includes('permission')) {
          console.warn("Model may not be available, trying alternative...");
          
          // Пробуем текстовую модель как fallback
          try {
            const textModelResponse = await ai.models.generateContent({
              model: "gemini-1.5-flash",
              contents: {
                parts: [{ text: `Describe a ${state.fraction} starship named ${state.name}` }]
              }
            });
            
            console.log("Text description generated:", textModelResponse.candidates?.[0]?.content?.parts?.[0]?.text);
          } catch (textError) {
            console.error("Text model also failed:", textError);
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

// Экспортируем функцию для принудительной очистки кэша
export const clearImageCache = (): void => {
  imageCache.clear();
};
