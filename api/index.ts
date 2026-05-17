import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";
import Busboy from "busboy";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// Polyfill for DOMMatrix and other globals needed by pdf.js in Node.js
if (typeof global.DOMMatrix === 'undefined') {
  const DOMMatrixPolyfill = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(init?: any) {
      if (typeof init === 'string') return;
      if (Array.isArray(init)) {
        this.a = init[0]; this.b = init[1]; this.c = init[2]; this.d = init[3]; this.e = init[4]; this.f = init[5];
      }
    }
  };
  (global as any).DOMMatrix = DOMMatrixPolyfill;
}

// Ensure ImageData is also defined as it's sometimes checked by pdf.js versions
if (typeof global.ImageData === 'undefined') {
  (global as any).ImageData = class ImageData {
    width: number; height: number; data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width; this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}

async function startServer() {
  console.log("[SYSTEM] Initializing server sequence...");
  const app = express();
  const PORT = process.env.PORT || 3000;

  const geminiKeys = Object.keys(process.env)
    .filter(k => k.startsWith('GEMINI_API_KEY'))
    .map(k => process.env[k])
    .filter(Boolean) as string[];

  const clientGroqKey = process.env.GROQ_API_KEY;

  if (geminiKeys.length === 0) {
    console.warn("No GEMINI_API_KEY found in environment. AI features will be limited.");
    geminiKeys.push("DUMMY_KEY");
  }

  const aiInstances = geminiKeys.map(key => new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }));

  const groq = clientGroqKey ? new Groq({ apiKey: clientGroqKey }) : null;

  async function callLLM(options: { 
    geminiPrompt: string, 
    groqPrompt: string, 
    jsonSchema?: any 
  }, retryCount = 0) {
    const MAX_RETRIES = 2;
    const modelName = "gemini-1.5-flash"; 

    let lastGeminiError: any = null;
    let isGeminiQuota = false;

    for (let i = 0; i < aiInstances.length; i++) {
      const ai = aiInstances[i];
      try {
        console.log(`[LLM] Attempting Gemini Pool Instance ${i + 1}/${aiInstances.length} (${modelName}, Try ${retryCount + 1})...`);
        const genConfig: any = {};
        if (options.jsonSchema) {
          genConfig.responseMimeType = "application/json";
          genConfig.responseSchema = options.jsonSchema;
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.geminiPrompt,
          config: genConfig
        });
        return { source: 'gemini', text: response.text };
      } catch (geminiError: any) {
        lastGeminiError = geminiError;
        
        isGeminiQuota = 
          geminiError?.message?.includes("429") || 
          geminiError?.status === 429 || 
          geminiError?.message?.includes("RESOURCE_EXHAUSTED") ||
          geminiError?.message?.includes("API key not valid"); // Skip invalid keys seamlessly

        if (isGeminiQuota) {
          console.warn(`[LLM] Gemini Instance ${i + 1} hit quota or invalid key. Routing to next available instance...`);
          continue; // Try next instance
        } else {
          console.error(`[LLM] Gemini Instance ${i + 1} failed with non-quota error:`, geminiError.message);
          break; // Stop trying other Gemini keys if it's a generic error (e.g. malformed prompt)
        }
      }
    }

    console.error("[LLM] All Gemini instances in the pool failed or hit limits.");

    // Attempt Groq fallback IMMEDIATELY if Gemini is rate limited or fails
    if (groq) {
        try {
          console.log("[LLM] Attempting Groq fallback layer...");
          const params: any = {
            messages: [{ role: "user", content: options.groqPrompt }],
            model: "llama-3.3-70b-versatile",
          };
          
          if (options.jsonSchema) {
            params.response_format = { type: "json_object" };
            params.messages[0].content += `\n\nCRITICAL: Return a valid JSON object matching this exact schema: ${JSON.stringify(options.jsonSchema)}. Do not include any other text besides the JSON.`;
          }

          const completion = await groq.chat.completions.create(params);
          return { 
            source: 'groq', 
            text: completion.choices[0]?.message?.content || "{}" 
          };
        } catch (groqError: any) {
          console.error("[LLM] Groq fallback also failed:", groqError);
          
          const isGroqQuota = groqError?.status === 429 || groqError?.message?.includes("rate_limit_exceeded");

          if (retryCount < MAX_RETRIES && (isGeminiQuota || isGroqQuota)) {
             const delay = (retryCount + 1) * 5000;
             console.log(`[LLM] Multi-link collision. Retrying full sequence in ${delay}ms...`);
             await new Promise(r => setTimeout(r, delay));
             return callLLM(options, retryCount + 1);
          }

          throw new Error("Neural Compute Overloaded: Both AI processing layers are currently at capacity. Please wait 60 seconds and retry extraction.");
        }
      }
      
      // If no Groq, but Gemini hit quota, retry sequence with backoff
      if (isGeminiQuota && retryCount < MAX_RETRIES) {
         const delay = (retryCount + 1) * 5000;
         console.log(`[LLM] Global Gemini pool quota reached. Backing off for ${delay}ms...`);
         await new Promise(r => setTimeout(r, delay));
         return callLLM(options, retryCount + 1);
      }

      throw lastGeminiError || new Error("Unknown Neural Compute Failure.");
  }

  app.post("/api/upload", (req, res) => {
    console.log("[STORAGE] Upload request received.");
    
    const responseTimeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error("[STORAGE] Upload request timed out (30s).");
        res.status(504).json({ error: "The document extraction is taking too long. Please try a smaller file." });
      }
    }, 28000);

    const busboy = Busboy({ headers: req.headers });
    let extractedText = "";
    let fileName = "";
    let errorOccurred = false;
    let errorMessage = "";
    const processingPromises: Promise<any>[] = [];

    busboy.on("file", (fieldname, file, info) => {
      fileName = info.filename;
      console.log(`[STORAGE] Receiving file: ${fileName}, mime: ${info.mimeType}`);
      const chunks: Buffer[] = [];
      file.on("data", (chunk) => {
        chunks.push(chunk);
      });
      
      const promise = new Promise((resolve) => {
        file.on("end", async () => {
          const buffer = Buffer.concat(chunks);
          console.log(`[STORAGE] File ${fileName} fully received. Size: ${buffer.length} bytes`);
          try {
            if (info.mimeType === "application/pdf") {
              console.log("[NEURAL] Starting PDF parsing sequence...");
              try {
                if (typeof pdf !== 'function') {
                   throw new Error("PDF_MODULE_MISMATCH: extraction engine structure invalid.");
                }

                const result = await pdf(buffer);
                
                if (result && result.text) {
                  extractedText = result.text;
                  console.log(`[NEURAL] PDF parsed successfully.`);
                } else {
                  throw new Error("EMPTY_EXTRACTION: No text found.");
                }
              } catch (pdfErr: any) {
                console.error("[NEURAL] PDF Parsing failed internally:", pdfErr);
                throw new Error(`PDF_PARSING_FAILED: ${pdfErr.message}`);
              }
            } else {
              extractedText = buffer.toString("utf-8");
            }
            resolve(true);
          } catch (err: any) {
            console.error("[STORAGE] Worker process failed:", err);
            errorOccurred = true;
            errorMessage = err.message || "Unknown error during document parsing.";
            resolve(false);
          }
        });
        file.on("error", (err) => {
          console.error("[STREAM] File Stream Error:", err);
          errorOccurred = true;
          errorMessage = "Stream interruption during file transfer.";
          resolve(false);
        });
      });
      processingPromises.push(promise);
    });

    busboy.on("finish", async () => {
      clearTimeout(responseTimeout);
      try {
        await Promise.all(processingPromises);
        if (errorOccurred) {
          return res.status(500).json({ error: errorMessage });
        }
        if (!extractedText) {
          return res.status(400).json({ error: "No content extracted." });
        }
        res.json({ text: extractedText, fileName });
      } catch (finalErr: any) {
        console.error("[STORAGE] Finalization crash:", finalErr);
        if (!res.headersSent) {
          res.status(500).json({ error: "Systems failure during final assembly." });
        }
      }
    });

    busboy.on("error", (err) => {
      clearTimeout(responseTimeout);
      console.error("[STORAGE] Busboy Global Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Communication link failure." });
      }
    });

    req.on("error", (err) => {
      clearTimeout(responseTimeout);
      console.error("[STORAGE] Request Stream Error:", err);
      if (!res.headersSent) {
        res.status(400).json({ error: "Upload interrupted or exceeded platform limits." });
      }
    });

    req.pipe(busboy);
  });

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/generate-quiz", async (req, res) => {
    const { content, count, difficulty, style = "mixed" } = req.body;
    if (!content) return res.status(400).json({ error: "Content empty" });

    try {
      const prompt = `Generate a high-quality MCQ quiz based ONLY on the provided source content. Return JSON.
      
      CONTEXT: ${content.substring(0, 30000)}
      PARAMS: Count ${count}, Difficulty ${difficulty}, Style ${style}`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt,
        jsonSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  difficulty: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation", "difficulty"]
              }
            }
          },
          required: ["questions"]
        }
      });

      res.json(JSON.parse(result.text || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/generate-summary", async (req, res) => {
    const { content, type = "detailed" } = req.body;
    if (!content) return res.status(400).json({ error: "Content empty" });

    try {
      const prompt = `Synthesize the source document into a ${type} summary.
      SOURCE: ${content.substring(0, 40000)}`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt
      });

      res.json({ summary: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New API Route: Generate Flashcards
  app.post("/api/generate-flashcards", async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    try {
      const prompt = `Generate a set of 8-12 high-yield flashcards (Anki-style) based on the provided text.
Each flashcard must have a 'front' (question or term) and a 'back' (answer or definition).
Focus on core concepts, definitions, and causal relationships.

SOURCE CONTENT:
${content.substring(0, 30000)}`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt,
        jsonSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["front", "back"]
              }
            }
          },
          required: ["flashcards"]
        }
      });

      res.json(JSON.parse(result.text || '{"flashcards": []}'));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New API Route: Extract Insights
  app.post("/api/extract-insights", async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    try {
      const prompt = `Analyze the following technical document and extract "Hidden Connections" and "Critical Vulnerabilities" in the logic or findings.
Provide a list of "Deep Insights" that aren't immediately obvious but are supported by the data.

FORMAT: Use Markdown with distinct sections.

SOURCE CONTENT:
${content.substring(0, 30000)}`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt
      });

      res.json({ insights: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New API Route: Topic Analysis
  app.post("/api/topic-analysis", async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    try {
      const prompt = `Analyze the provided source text and identify the top 5-7 most important academic or technical topics.
For each topic, provide a 'relevance' score from 1-100 and a 1-sentence 'description' of how it is addressed in the text.

SOURCE CONTENT:
${content.substring(0, 30000)}`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt,
        jsonSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  relevance: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                },
                required: ["name", "relevance", "description"]
              }
            }
          },
          required: ["topics"]
        }
      });

      res.json(JSON.parse(result.text || '{"topics": []}'));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New API Route: Semantic Chat
  app.post("/api/chat", async (req, res) => {
    const { message, history, content } = req.body;
    if (!content) return res.status(400).json({ error: "Context is required" });

    try {
      const prompt = `Respond to the query based on the document.
      DOC: ${content.substring(0, 40000)}
      HISTORY: ${JSON.stringify(history)}
      QUERY: ${message}`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt
      });

      res.json({ response: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New API Route: Knowledge Graph
  app.post("/api/knowledge-graph", async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    try {
      const prompt = `You are a Semantic Cartographer. Analyze the provided document and construct a high-fidelity Knowledge Graph.
Extract key technical entities, concepts, dates, and figures as nodes.
Define explicit relationships between these entities as links.

SOURCE CONTENT:
${content.substring(0, 30000)}`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt,
        jsonSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  group: { type: Type.NUMBER },
                  val: { type: Type.NUMBER }
                },
                required: ["id", "group", "val"]
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                },
                required: ["source", "target", "value"]
              }
            }
          },
          required: ["nodes", "links"]
        }
      });

      const parsed = JSON.parse(result.text || '{"nodes":[], "links":[]}');
      res.json(parsed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New API Route: Predictive Assessment
  app.post("/api/predictive-assessment", async (req, res) => {
    const { results, content } = req.body;
    if (!content || !results) return res.status(400).json({ error: "Context and results are required" });

    try {
      const prompt = `Analyze the user's quiz results and predict areas of future difficulty based on the source document.
      DOC: ${content.substring(0, 30000)}
      RESULTS: ${JSON.stringify(results)}`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt
      });

      res.json({ assessment: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New API Route: Multimodal Fact Check
  app.post("/api/fact-check", async (req, res) => {
    const { claims, content } = req.body;
    if (!content) return res.status(400).json({ error: "Context is required" });

    try {
      const prompt = `Cross-reference claims with the source text and external research.
      DOC: ${content.substring(0, 5000)}
      CLAIMS: ${claims}`;

      // For fact-check, just use the first available instance since tools aren't passed dynamically
      const response = await aiInstances[0].models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      res.json({ 
        analysis: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((g: any) => g.web?.uri).filter(Boolean) || []
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Handle other endpoints similarly or redirect to frontend
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`[SYSTEM] Server listening on port ${PORT}`);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Important: for Vercel, this might not be reached due to rewrites, but good for local production tests
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[CRITICAL]", err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: err.message,
        type: err.name
      });
    }
  });

  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error("[BOOT ERROR]", err);
    if (!res.headersSent) {
      res.status(500).send(`Neural Engine Boot Failure: ${err.message}`);
    }
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
