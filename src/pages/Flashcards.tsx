import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw, Download, Share2, Brain, Sparkles, AlertCircle } from "lucide-react";
import { useStore } from "@/src/lib/store";
import { Button } from "@/src/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function FlashcardsPage() {
  const { documentText, flashcards, setFlashcards } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!documentText) {
      navigate("/");
      return;
    }
    if (flashcards.length === 0) {
      generateFlashcards();
    }
  }, []);

  const generateFlashcards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: documentText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFlashcards(data.flashcards);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const downloadFlashcards = () => {
    const dataStr = JSON.stringify(flashcards, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Flashcards.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 relative mb-8">
           <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
           <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-4 dark:text-white">Orchestrating Knowledge...</h2>
        <p className="text-gray-500 font-bold animate-pulse text-lg">Synthesizing Anki-style memory nodes from source content.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black tracking-tighter mb-4 dark:text-white">Neural Disruption</h2>
        <p className="text-gray-500 font-bold mb-8 text-center max-w-md">{error}</p>
        <Button onClick={generateFlashcards} className="rounded-2xl h-14 px-8 bg-indigo-600 font-black">
          Re-initialize Layer
        </Button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen pt-32 pb-44 px-6 relative z-10 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-xs">Neural Synthesis</span>
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter dark:text-white mb-4">Memory Nodes</h1>
            <p className="text-gray-500 font-bold">Interactive retrieval practice calibrated to your document.</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={downloadFlashcards} variant="outline" className="rounded-2xl border-black/10 dark:border-white/10 h-14 w-14 p-0 hover:bg-black/5">
              <Download className="w-6 h-6" />
            </Button>
            <Button onClick={() => setCurrentIndex(0)} variant="outline" className="rounded-2xl border-black/10 dark:border-white/10 h-14 w-14 p-0 hover:bg-black/5">
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>
        </header>

        {flashcards.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Flashcard */}
            <div 
              className="w-full max-w-2xl h-[400px] perspective-1000 cursor-pointer group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative transition-all duration-500 preserve-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
              >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full backface-hidden p-12 rounded-[3.5rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-2xl backdrop-blur-3xl flex flex-col items-center justify-center text-center">
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 mb-8">
                    <Sparkles className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight dark:text-white leading-tight">
                    {currentCard.front}
                  </h3>
                  <div className="mt-auto pt-8">
                     <span className="text-xs text-gray-400 font-black tracking-widest uppercase">Click to Reveal Synthesis</span>
                  </div>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 w-full h-full backface-hidden p-12 rounded-[3.5rem] bg-indigo-600 text-white shadow-2xl flex flex-col items-center justify-center text-center"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <div className="mb-8 p-3 rounded-2xl bg-white/10">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold leading-relaxed">
                    {currentCard.back}
                  </p>
                  <div className="mt-auto pt-8">
                     <span className="text-xs text-white/50 font-black tracking-widest uppercase">Memory Node Verified</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="mt-12 flex items-center gap-12">
              <Button 
                onClick={(e) => { e.stopPropagation(); prevCard(); }}
                variant="outline" 
                className="w-20 h-20 rounded-full border-black/10 dark:border-white/10 hover:bg-black/5"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              
              <div className="text-center">
                <div className="text-4xl font-black dark:text-white tabular-nums">
                  {currentIndex + 1}
                </div>
                <div className="text-gray-500 font-black uppercase text-xs tracking-widest mt-1">
                  of {flashcards.length}
                </div>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); nextCard(); }}
                variant="outline" 
                className="w-20 h-20 rounded-full border-black/10 dark:border-white/10 hover:bg-black/5"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Styles for perspective and preserve-3d */}
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}} />
    </div>
  );
}
