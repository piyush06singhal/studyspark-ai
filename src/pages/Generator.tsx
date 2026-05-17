import { useState } from "react";
import { motion } from "motion/react";
import { Brain, Sparkles, Wand2, ArrowRight, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/src/lib/store";
import { Button } from "@/src/components/ui/button";
import { Slider } from "@/src/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Switch } from "@/src/components/ui/switch";

export default function GeneratorPage() {
  const { documentText, quizConfig, setQuizConfig, setQuizQuestions } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!documentText) {
      setError("Please upload a document first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: documentText,
          count: quizConfig.count,
          difficulty: quizConfig.difficulty,
          style: quizConfig.style
        }),
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Synthesis failed (${response.status}). The context might be too dense for the current neural layer.`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions were generated. Try a different document or settings.");
      }
      
      setQuizQuestions(data.questions);
      navigate("/quiz");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 relative z-10 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        <header className="mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.25em] uppercase text-[10px]">Neural Layer Calibration</span>
          </motion.div>
          <h1 className="text-7xl md:text-[8.5rem] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-black via-black/80 to-black/40 dark:from-white dark:via-white/90 dark:to-white/20 leading-[0.8] mb-10 select-none">
            Fine-tune Your<br />Intelligence.
          </h1>
          <p className="text-2xl text-gray-500 font-semibold max-w-2xl leading-tight tracking-tight">Adjust the cognitive parameters to synchronize the AI orchestration layer with your learning density.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left panel */}
          <div className="lg:col-span-7 space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-10 rounded-[3rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-2xl backdrop-blur-3xl"
            >
              <div className="flex justify-between items-center mb-10">
                 <label className="text-2xl font-black tracking-tight dark:text-white">Density</label>
                 <div className="flex items-center gap-4">
                   <input 
                     type="number"
                     value={quizConfig.count}
                     onChange={(e) => {
                       const val = parseInt(e.target.value);
                       if (!isNaN(val)) setQuizConfig({ count: Math.min(50, Math.max(1, val)) });
                     }}
                     className="w-24 h-14 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-center font-black text-2xl dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                   />
                   <span className="px-5 py-2 rounded-2xl bg-indigo-600 text-white font-black font-mono text-2xl shadow-xl shadow-indigo-500/20">Questions</span>
                 </div>
              </div>
              <div className="px-2">
                <Slider
                  value={[quizConfig.count]}
                  onValueChange={(vals: number[]) => setQuizConfig({ count: vals[0] })}
                  max={50}
                  min={1}
                  step={1}
                  className="py-10"
                />
              </div>
              <p className="text-gray-500 font-bold text-sm mt-4 uppercase tracking-widest">Number of questions to synthesize from source</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-10 rounded-[3rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-2xl backdrop-blur-3xl"
            >
              <label className="text-2xl font-black tracking-tight mb-10 block dark:text-white">Cognitive Load</label>
              <Tabs 
                value={quizConfig.difficulty} 
                onValueChange={(val) => setQuizConfig({ difficulty: val })}
                className="w-full"
              >
                <TabsList className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-1.5 rounded-3xl h-20 items-stretch">
                  {['Easy', 'Medium', 'Hard', 'Mixed'].map(d => (
                    <TabsTrigger 
                      key={d} 
                      value={d}
                      className="flex-1 rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-lg text-gray-500 font-black text-lg transition-all"
                    >
                      {d}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <p className="text-gray-500 font-bold text-sm mt-8 uppercase tracking-widest text-center">AI will adjust Distractor Plausibility based on selection</p>
            </motion.div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-5 space-y-10">
             <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-10 rounded-[3rem] bg-indigo-600/5 dark:bg-indigo-600/10 border border-indigo-500/20 shadow-2xl backdrop-blur-3xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="flex items-start justify-between mb-10 relative z-10">
                <div>
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-3 dark:text-white">
                    <Sparkles className="w-6 h-6 text-indigo-500" />
                    Advanced Logic
                  </h3>
                  <p className="text-gray-500 font-bold">Inject specialized reasoning patterns</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {[
                  { id: 'conceptual', label: 'Conceptual Depth', desc: 'Theory & Fundamentals' },
                  { id: 'analytical', label: 'Analytical Engine', desc: 'Edge Cases & Exceptions' },
                  { id: 'application', label: 'Applied Scenarios', desc: 'Case Studies' },
                ].map(style => (
                  <div key={style.id} className="flex items-center justify-between p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-indigo-500/30 transition-all group">
                    <div>
                      <span className="text-black dark:text-white font-black block text-lg">{style.label}</span>
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{style.desc}</span>
                    </div>
                    <Switch 
                      checked={quizConfig.style === style.id}
                      onCheckedChange={(checked) => {
                        if (checked) setQuizConfig({ style: style.id });
                        else setQuizConfig({ style: 'mixed' });
                      }}
                      className="data-[state=checked]:bg-indigo-600" 
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {error && (
                <p className="text-red-500 font-bold text-center bg-red-500/10 py-3 rounded-2xl border border-red-500/20">
                  {error}
                </p>
              )}
              <Button
                disabled={loading || !documentText}
                onClick={handleGenerate}
                className="w-full py-12 rounded-[3.5rem] bg-indigo-600 hover:bg-indigo-700 text-white text-3xl font-black group overflow-hidden relative shadow-[0_30px_60px_rgba(79,70,229,0.3)]"
              >
                {loading ? (
                  <div className="flex items-center gap-6">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="tracking-tighter">Synthesizing...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-4 tracking-tighter">
                      GENERATE QUIZ 
                      <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-all" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
