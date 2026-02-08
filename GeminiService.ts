
import { GoogleGenAI, Type } from "@google/genai";
import { UserConfig, ContentSet } from "../types";

export class GeminiService {
  // Fresh GoogleGenAI instances are created per request to ensure correct API key lifecycle management

  async performNicheResearch(config: UserConfig): Promise<string> {
    const prompt = `
      Act as an elite content strategist. 
      Research the top 100 creators in the niche: "${config.brand.primaryNiche}".
      Target Audience: ${config.brand.targetAudience}.
      
      Identify:
      1. Top 5 creators by engagement rate.
      2. Dominant content formats.
      3. Highest performing hook patterns in this niche.
      4. Common CTAs and storytelling structures.
      
      Create a "Niche Performance Blueprint" summarizing these patterns.
    `;

    try {
      // Create a fresh instance right before making an API call to ensure latest API key is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      // Accessing the generated text via the .text property
      let result = response.text || 'FAILED TO GENERATE BLUEPRINT';

      // Always extract and display grounding URLs when using googleSearch tool as per guidelines
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        const sources = chunks
          .filter(chunk => chunk.web && chunk.web.uri)
          .map(chunk => `\n- [${chunk.web?.title || 'Source'}](${chunk.web?.uri})`);
        
        if (sources.length > 0) {
          result += `\n\n### Research Sources:\n${sources.join('')}`;
        }
      }

      return result;
    } catch (error) {
      console.error("Research Error:", error);
      return "ERROR DURING RESEARCH PHASE";
    }
  }

  async generateContentSets(config: UserConfig, blueprint: string): Promise<ContentSet[]> {
    // FIX: Corrected config property access for constraints (was incorrectly config.brand.constraints)
    const prompt = `
      Based on this Niche Performance Blueprint:
      "${blueprint}"
      
      And the user's brand profile:
      Niche: ${config.brand.primaryNiche}
      Sub-niches: ${config.brand.subNiches.join(', ')}
      Tone: ${config.brand.tone}
      
      Generate 10 unique content sets. 
      Avoid topics like: ${config.constraints.topicsToAvoid.join(', ')}.
      
      Each set must be structurally inspired but semantically original.
      Return exactly 10 sets in JSON format.
    `;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          postText: { type: Type.STRING },
          carousel: { type: Type.ARRAY, items: { type: Type.STRING } },
          reelScript: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    instruction: { type: Type.STRING },
                    text: { type: Type.STRING }
                  }
                }
              },
              narration: { type: Type.STRING }
            }
          },
          storyFrames: { type: Type.ARRAY, items: { type: Type.STRING } },
          caption: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          score: { type: Type.NUMBER, description: "Predictive engagement score 0-100" }
        },
        required: ["id", "topic", "postText", "carousel", "reelScript", "caption", "hashtags", "score"],
        propertyOrdering: ["id", "topic", "postText", "carousel", "reelScript", "storyFrames", "caption", "hashtags", "score"]
      }
    };

    try {
      // Create a fresh instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      
      // Accessing the generated text via the .text property
      const content = JSON.parse(response.text || '[]');
      return content;
    } catch (error) {
      console.error("Generation Error:", error);
      return [];
    }
  }

  async getPerformanceInsights(selectedContent: ContentSet): Promise<string> {
    const prompt = `Analyze the potential of this content: "${selectedContent.topic}". Why was it selected as the top choice today? Provide logical reasoning based on current social media trends.`;
    
    try {
      // Create a fresh instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      // Accessing the generated text via the .text property
      return response.text || 'No insights available.';
    } catch (error) {
      console.error("Insights Error:", error);
      return "No insights available due to processing error.";
    }
  }
}
