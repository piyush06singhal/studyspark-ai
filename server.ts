import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";
import Busboy from "busboy";
// @ts-ignore
import pdf from "pdf-parse";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const clientGeminiKey = process.env.GEMINI_API_KEY;
  const clientGroqKey = process.env.GROQ_API_KEY;

  if (!clientGeminiKey) {
    console.warn("GEMINI_API_KEY not found in environment. AI features will be limited.");
  }

  const ai = new GoogleGenAI({
    apiKey: clientGeminiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const groq = clientGroqKey ? new Groq({ apiKey: clientGroqKey }) : null;

  async function callLLM(options: { 
    geminiPrompt: string, 
    groqPrompt: string, 
    jsonSchema?: any 
  }, retryCount = 0) {
    // Try Gemini first
    try {
      console.log(`Attempting Gemini generation (Try ${retryCount + 1})...`);
      const genConfig: any = {};
      if (options.jsonSchema) {
        genConfig.responseMimeType = "application/json";
        genConfig.responseSchema = options.jsonSchema;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: options.geminiPrompt,
        config: genConfig
      });
      return { source: 'gemini', text: response.text };
    } catch (geminiError: any) {
      console.error("Gemini failed:", geminiError);
      
      const isQuotaError = geminiError?.message?.includes("429") || geminiError?.status === 429;

      if (groq) {
        try {
          console.log("Attempting Groq fallback...");
          const params: any = {
            messages: [{ role: "user", content: options.groqPrompt }],
            model: "llama-3.3-70b-versatile",
          };
          
          if (options.jsonSchema) {
            params.response_format = { type: "json_object" };
            params.messages[0].content += "\n\nCRITICAL: You must return a valid JSON object matching the requested schema. Do not include any other text besides the JSON.";
          }

          const completion = await groq.chat.completions.create(params);
          return { 
            source: 'groq', 
            text: completion.choices[0]?.message?.content || "{}" 
          };
        } catch (groqError: any) {
          console.error("Groq fallback also failed:", groqError);
          
          if (retryCount < 1 && (isQuotaError || groqError?.status === 429)) {
             console.log("Both services hit rate limits. Retrying in 2 seconds...");
             await new Promise(r => setTimeout(r, 2000));
             return callLLM(options, retryCount + 1);
          }

          throw new Error("Neural Compute Overloaded: Both AI processing layers are currently at capacity. Please wait 30 seconds and retry extraction.");
        }
      }
      throw geminiError;
    }
  }

  // IMPORTANT: Move upload route BEFORE express.json middleware to avoid body size limits being applied by middleware to multipart/form-data
  // API Route: Extract text from PDF
  app.post("/api/upload", (req, res) => {
    console.log("[STORAGE] Upload request received.");
    
    // Set a timeout for the response to prevent dangling requests if PDF parsing hangs
    const responseTimeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error("[STORAGE] Upload request timed out (30s).");
        res.status(504).json({ error: "The document extraction is taking too long. Please try a smaller file." });
      }
    }, 28000); // slightly less than Vercel's typical 30s limit

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
              // Robust attempt at importing pdf-parse
              let parsePdf;
              try {
                // Try to handle different export styles in serverless environments
                parsePdf = (pdf as any).default || pdf;
                if (typeof parsePdf !== 'function') {
                  throw new Error("PDF_MODULE_CONFIG_ERROR: pdf-parse export is not a function.");
                }
              } catch (importErr: any) {
                console.error("[NEURAL] PDF Module Import Failure:", importErr);
                throw new Error("SYSTEM_MODULE_ERROR: Could not initialize neural extraction engine.");
              }

              const result = await parsePdf(buffer);
              
              if (result && result.text) {
                extractedText = result.text;
                console.log(`[NEURAL] PDF parsed successfully. Lines: ${extractedText.split('\n').length}`);
              } else {
                throw new Error("EMPTY_EXTRACTION: No recognizable text was found in this document.");
              }
            } else {
              extractedText = buffer.toString("utf-8");
              console.log(`[STORAGE] Text file parsed. Length: ${extractedText.length}`);
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
      console.log("[STORAGE] Busboy finish event triggered.");
      try {
        await Promise.all(processingPromises);
        if (errorOccurred) {
          console.error("[STORAGE] Returning error response:", errorMessage);
          return res.status(500).json({ error: errorMessage });
        }
        if (!extractedText) {
          return res.status(400).json({ error: "No content could be extracted from the file." });
        }
        console.log("[STORAGE] Clean extraction. Sending success response.");
        res.json({ text: extractedText, fileName });
      } catch (finalErr: any) {
        console.error("[STORAGE] Finalization crash:", finalErr);
        if (!res.headersSent) {
          res.status(500).json({ error: "Systems failure during final assembly of document data." });
        }
      }
    });

    busboy.on("error", (err) => {
      clearTimeout(responseTimeout);
      console.error("[STORAGE] Busboy Global Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Communication link failure (Busboy Error)." });
      }
    });

    req.pipe(busboy);
  });

  app.use(express.json({ limit: '50mb' })); // Increased limit for JSON requests if needed

  // API Route: Generate Quiz
  app.post("/api/generate-quiz", async (req, res) => {
    const { content, count, difficulty, style = "mixed" } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Document content is empty. Please upload a file first." });
    }

    try {
      console.log("Generating quiz for content length:", content.length);
      const prompt = `You are an expert educational assessment engineer. Your task is to generate a high-quality MCQ quiz based ONLY on the provided source content.

STRICT RULES:
1. TRUTHFULNESS: Every question and answer must be explicitly supported by the source content. DO NOT use outside knowledge.
2. DISTRACTORS: Options should be plausible but clearly incorrect based on the text.
3. EXPLANATIONS: Provide a deep, pedagogical explanation for WHY the correct answer is right, citing or paraphrasing the document.

CONTEXT DATA:
${content.substring(0, 30000)}

QUIZ PARAMETERS:
- Question Count: ${count}
- Difficulty Level: ${difficulty}
- Stylistic Focus: ${style} (Conceptual, Analytical, or Application-based)`;

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
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of 4 multiple choice options"
                  },
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
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate quiz" });
    }
  });

  // API Route: Generate Summary
  app.post("/api/generate-summary", async (req, res) => {
    const { content, type = "detailed" } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Document content is empty." });
    }

    try {
      const promptMap: Record<string, string> = {
        concise: "Extract the core 3-5% of the most critical information into a single powerful paragraph. Focus on the 'Why' behind the facts.",
        detailed: "Provide a multi-section comprehensive breakdown using professional academic headings. Include an 'Overview', 'Key Pillars', 'Advanced Analysis', and 'Critical Takeaways'.",
        bullets: "Create an organized list of high-impact bullet points. Use bolding for key terms and group points by logical themes.",
        exam: "Identify key terminology, potential exam topics, and create a 'Cheat Sheet' format. Highlight definitions that are likely to be tested."
      };

      const prompt = `You are a high-level academic research assistant specializing in information synthesis.
Your goal is to transform the provided source content into a ${type} summary that remains 100% faithful to the text.

STRICT GROUNDING RULES:
1. ONLY use information provided in the source.
2. If the source contains contradictory information, note it as "Ambiguity in source".
3. Maintain the technical depth of the original document.

SPECIFIC OBJECTIVE: ${promptMap[type] || promptMap.detailed}

SOURCE CONTENT:
${content.substring(0, 40000)} // Increased limit slightly for better RAG context`;

      const result = await callLLM({
        geminiPrompt: prompt,
        groqPrompt: prompt
      });

      res.json({ summary: result.text });
    } catch (error: any) {
      console.error("Summary generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate summary" });
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
      const prompt = `You are a Semantic Intelligence Engine (Neural-GPT-X). Your primary function is to provide ultra-accurate, context-aware synthesis of the source document.
      
SYSTEM CAPABILITIES:
- Advanced Vector Retrieval Simulation (RAG)
- Multi-step Reasoning
- Strict Contextual Adherence

SOURCE INTELLIGENCE LAYER:
${content.substring(0, 40000)}

NEURAL CHAT REGISTRY (HISTORY):
${history.map((h: any) => `${h.role}: ${h.content}`).join("\n")}

INCOMING QUERY: ${message}

OPERATIONAL PARAMETERS:
1. Respond with high technical precision.
2. If the user asks for something outside the source, explicitly state: "QUERY_OUT_OF_BOUNDS: This specific dataset is not indexed in the current source layer."
3. Synthesize fragmented information across the document if necessary.
4. Use academic, authoritative tone.`;

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

STRICT ONTOLOGY RULES:
1. ENTITIES (Nodes): Group concepts into logical categories (1: Core Subject, 2: Supporting Tech, 3: Temporal/Historical, 4: Quantitative Data).
2. WEIGHTS: Assign 'val' (1-10) based on cognitive importance.
3. LINKS (Edges): Use specific relationship types as values (1: Related, 3: Prerequisite, 5: Core dependency).
4. INTEGRITY: Every 'source' and 'target' in the links list MUST match an 'id' in the nodes list exactly.
5. DENSITY: Aim for 20-30 high-quality nodes and 25-45 links. Do NOT include generic terms like "The" or "And".

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
                  id: { type: Type.STRING, description: "Unique name of the entity" },
                  group: { type: Type.NUMBER, description: "Category index 1-4" },
                  val: { type: Type.NUMBER, description: "Scale of 1-10" }
                },
                required: ["id", "group", "val"]
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING, description: "Match a Node ID" },
                  target: { type: Type.STRING, description: "Match a Node ID" },
                  value: { type: Type.NUMBER, description: "Strength 1-5" }
                },
                required: ["source", "target", "value"]
              }
            }
          },
          required: ["nodes", "links"]
        }
      });

      const parsed = JSON.parse(result.text || '{"nodes":[], "links":[]}');
      
      // Post-processing to ensure link integrity
      const nodeIds = new Set(parsed.nodes?.map((n: any) => n.id) || []);
      const validatedLinks = (parsed.links || []).filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target));
      
      res.json({
        nodes: parsed.nodes || [],
        links: validatedLinks
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New API Route: Predictive Assessment
  app.post("/api/predictive-assessment", async (req, res) => {
    const { results, content } = req.body;
    if (!content || !results) return res.status(400).json({ error: "Context and results are required" });

    try {
      const prompt = `As a Neural Psychometrician, analyze the user's performance on the recently administered quiz.
Match the user's incorrect responses to specific conceptual domains within the source document.
Predict exactly which sections or topics the user will struggle with in a professional exam.

SOURCE DOCUMENT:
${content.substring(0, 30000)}

QUIZ RESULTS:
Score: ${results.score}/${results.total}
Detailed Answers: ${JSON.stringify(results.answers)}

Return a structured breakdown of:
1. "Vulnerability Vectors" (Predicted areas of failure)
2. "Cognitive Strategy" (How to bridge the gap)
3. "Exam Risk Level" (Low/Medium/High)
Use Markdown for the response.`;

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
      const prompt = `Cross-reference the key claims in the following document with real-time research and external data.
Identify any assertions that might be outdated, controversial, or require further verification.

DOC CONTENT TO VERIFY:
${claims || content.substring(0, 5000)}

RULES:
1. Use Google Search to verify claims.
2. Provide links to supporting or refuting evidence by citing the URLs in the text.
3. Be objective and critical.`;

      // Use Gemini with Search Grounding
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      res.json({ 
        analysis: response.text,
        sources: grounding.map((g: any) => g.web?.uri).filter(Boolean)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
