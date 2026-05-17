import { GoogleGenAI } from "@google/genai";

try {
  const ai = new GoogleGenAI({
    apiKey: "DUMMY",
    httpOptions: {
      headers: { 'User-Agent': 'test' }
    }
  } as any);
  console.log("Success");
} catch (e: any) {
  console.log("Error:", e.message);
}
