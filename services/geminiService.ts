
import { GoogleGenAI } from "@google/genai";
import { GeneratorState, ShipFraction, ShipPurpose } from "../types";
import { FRACTION_DETAILS, MILITARY_CLASSES, CIVILIAN_CLASSES } from "../constants";

export const generateShipImage = async (state: GeneratorState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image part found in response");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};
