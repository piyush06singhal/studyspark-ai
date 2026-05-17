import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

async function test() {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "dummy"
    });
    console.log("ai instance created");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Hello world",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            msg: { type: Type.STRING }
          }
        }
      }
    });
    console.log("Response text:", response.text);
  } catch (e: any) {
    console.error("Error generating content:", e.message);
  }
}

test();
