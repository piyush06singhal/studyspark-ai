# 🧠 NeuralContext: Semantic Intelligence Engine

NeuralContext is a high-fidelity document analysis and synthesis platform. It transforms static documents (PDFs, Text) into dynamic, interactive learning environments using advanced LLM reasoning and semantic visualization.

## 🚀 Key Features

- **Neural PDF Ingestion**: High-precision text extraction from academic and technical documents.
- **3D Semantic Cartography**: Interactive 3D Knowledge Graphs that visualize entities and relationships using Force-Directed Graphs.
- **Adaptive Assessment Layer**: AI-generated MCQ quizzes with pedagogical explanations tailored to document content.
- **Multi-Objective Summarization**: Generate concise, detailed, bulleted, or exam-focused syntheses.
- **Predictive Learning Insights**: Analyze quiz results to identify "Vulnerability Vectors" and cognitive gaps.
- **Semantic Chatbot**: A document-aware AI assistant (Neural-GPT-X) for deep context retrieval.
- **High-Yield Flashcards**: Automatically generate study aids based on core document concepts.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Animations**: Framer Motion (motion/react)
- **Visuals**: Three.js, React-Force-Graph-3D
- **Icons**: Lucide React
- **Backend**: Node.js, Express
- **AI Core**: 
  - **Primary**: Google Gemini API (models/gemini-3-flash-preview)
  - **Fallback**: Groq (Llama 3.3 70B)
  - **Search**: Google Search Grounding for fact-checking

## ⚙️ Environment Configuration

To run this project, you need to configure the following environment variables.

### Required Keys
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `GROQ_API_KEY`: Your Groq API key (used as a high-performance fallback).

### Local Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory (referencing `.env.example`).
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 Vercel Deployment

This project is configured for seamless deployment on Vercel. 

### Steps to Deploy:
1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Add the following **Environment Variables** in the Vercel Dashboard:
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
4. The `vercel.json` file handles the routing and serverless function configuration automatically.

## 📄 License
MIT License - Created with AI Studio Build.
