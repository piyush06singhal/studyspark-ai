import { create } from 'zustand';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

interface Flashcard {
  front: string;
  back: string;
  category?: string;
}

interface AppState {
  // Document state
  documentText: string;
  fileName: string;
  isProcessing: boolean;
  setDocument: (text: string, name: string) => void;
  resetDocument: () => void;
  
  // Quiz state
  quizQuestions: QuizQuestion[];
  quizConfig: {
    count: number;
    difficulty: string;
    style: string;
  };
  setQuizQuestions: (questions: QuizQuestion[]) => void;
  setQuizConfig: (config: Partial<AppState['quizConfig']>) => void;
  
  // Results state
  quizResults: {
    score: number;
    total: number;
    answers: { questionIndex: number; selectedAnswer: string; isCorrect: boolean }[];
    timeTaken: number;
  } | null;
  setQuizResults: (results: AppState['quizResults']) => void;
  
  // Summary state
  summary: string;
  setSummary: (summary: string) => void;

  // Advanced AI Features
  flashcards: Flashcard[];
  setFlashcards: (flashcards: Flashcard[]) => void;
  insights: string;
  setInsights: (insights: string) => void;
  topics: { name: string; relevance: number; description: string }[];
  setTopics: (topics: { name: string; relevance: number; description: string }[]) => void;

  // Chat state
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  clearChat: () => void;

  // Graph state
  graphData: { nodes: any[]; links: any[] };
  setGraphData: (data: { nodes: any[]; links: any[] }) => void;
}

export const useStore = create<AppState>((set) => ({
  documentText: '',
  fileName: '',
  isProcessing: false,
  setDocument: (text, name) => set({ documentText: text, fileName: name, isProcessing: false }),
  resetDocument: () => set({ 
    documentText: '', 
    fileName: '', 
    isProcessing: false, 
    quizQuestions: [], 
    summary: '', 
    flashcards: [], 
    insights: '', 
    topics: [],
    chatHistory: [],
    graphData: { nodes: [], links: [] }
  }),
  
  quizQuestions: [],
  quizConfig: {
    count: 10,
    difficulty: 'Medium',
    style: 'mixed'
  },
  setQuizQuestions: (questions) => set({ quizQuestions: questions }),
  setQuizConfig: (config) => set((state) => ({ quizConfig: { ...state.quizConfig, ...config } })),
  
  quizResults: null,
  setQuizResults: (results) => set({ quizResults: results }),
  
  summary: '',
  setSummary: (summary) => set({ summary }),

  flashcards: [],
  setFlashcards: (flashcards) => set({ flashcards }),
  insights: '',
  setInsights: (insights) => set({ insights }),
  topics: [],
  setTopics: (topics) => set({ topics }),

  chatHistory: [],
  addChatMessage: (role, content) => set((state) => ({ 
    chatHistory: [...state.chatHistory, { role, content }] 
  })),
  clearChat: () => set({ chatHistory: [] }),

  graphData: { nodes: [], links: [] },
  setGraphData: (data) => set({ graphData: data })
}));
