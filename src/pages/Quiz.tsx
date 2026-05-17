import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Check, X, Timer, HelpCircle, Trophy, Sparkles } from "lucide-react";
import { useStore } from "@/src/lib/store";
import { useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import confetti from "canvas-confetti";

export default function QuizInterface() {
  const { quizQuestions, setQuizResults } = useStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!quizQuestions.length) navigate('/upload');
    const interval = setInterval(() => {
      setTimeLeft(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [quizQuestions, navigate, startTime]);

  const currentQuestion = quizQuestions[currentIdx];
  const total = quizQuestions.length;
  const progress = ((currentIdx + 1) / total) * 100;

  const handleOptionSelect = (option: string) => {
    if (selectedAnswers[currentIdx]) return;
    setSelectedAnswers({ ...selectedAnswers, [currentIdx]: option });
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const answers = quizQuestions.map((q, idx) => ({
      questionIndex: idx,
      selectedAnswer: selectedAnswers[idx],
      isCorrect: selectedAnswers[idx] === q.correctAnswer
    }));
    const score = answers.filter(a => a.isCorrect).length;
    
    setQuizResults({ score, total, answers, timeTaken: timeLeft });
    if (score / total > 0.7) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    navigate('/results');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen pt-44 pb-44 px-6 relative z-10 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl">
              <HelpCircle className="text-indigo-600 dark:text-indigo-400 w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] mb-1">Session Protocol</p>
              <h1 className="text-3xl font-black tracking-tighter dark:text-white">Question {currentIdx + 1} of {total}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white dark:bg-black/40 px-6 py-3 rounded-[1.5rem] border border-black/5 dark:border-white/10 shadow-2xl backdrop-blur-xl">
            <Timer className="w-5 h-5 text-indigo-500" />
            <span className="font-mono text-2xl font-black dark:text-white">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="relative h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-16">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="absolute inset-y-0 left-0 bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-16"
            >
              <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white leading-[1.1] tracking-tight">
                {currentQuestion.question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selectedAnswers[currentIdx] === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  const isWrong = isSelected && !isCorrect;
                  const showsCorrect = showExplanation && isCorrect;

                  return (
                    <motion.button
                      key={i}
                      disabled={!!selectedAnswers[currentIdx]}
                      onClick={() => handleOptionSelect(option)}
                      whileHover={!selectedAnswers[currentIdx] ? { y: -5, scale: 1.01 } : {}}
                      whileTap={!selectedAnswers[currentIdx] ? { scale: 0.98 } : {}}
                      className={`p-10 rounded-[2.5rem] border text-left transition-all duration-300 relative overflow-hidden group shadow-2xl backdrop-blur-3xl flex items-center justify-between ${
                        isSelected 
                          ? isCorrect 
                            ? "bg-green-500/10 border-green-500/50" 
                            : "bg-red-500/10 border-red-500/50"
                          : showsCorrect 
                            ? "bg-green-500/10 border-green-500/50" 
                            : "bg-white dark:bg-white/[0.03] border-black/5 dark:border-white/10 hover:border-indigo-500/30"
                      }`}
                    >
                      <span className={`text-xl font-bold transition-colors ${
                        isSelected ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"
                      }`}>{option}</span>
                      
                      <div className="relative z-10">
                        {isSelected && isCorrect && <Check className="text-green-500 w-8 h-8" />}
                        {isSelected && !isCorrect && <X className="text-red-500 w-8 h-8" />}
                        {showsCorrect && !isSelected && <Check className="text-green-500/40 w-8 h-8" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-12 rounded-[3rem] bg-indigo-600/5 dark:bg-indigo-600/10 border border-indigo-500/20 shadow-2xl backdrop-blur-3xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                    <h4 className="text-indigo-600 dark:text-indigo-400 font-black mb-6 flex items-center gap-3 text-xl uppercase tracking-widest">
                      <Sparkles className="w-6 h-6" />
                      Pedagogical Reasoning
                    </h4>
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-semibold italic">
                      "{currentQuestion.explanation}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-12">
                <Button
                  disabled={!selectedAnswers[currentIdx]}
                  onClick={handleNext}
                  className="rounded-full px-16 py-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] font-black text-2xl transition-all group"
                >
                  {currentIdx === total - 1 ? "Protocol Complete" : "Next Segment"}
                  <ChevronRight className="ml-4 w-8 h-8 group-hover:translate-x-3 transition-transform" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
