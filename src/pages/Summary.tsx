import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Sparkles, Copy, Download, Share2, Loader2, Wand2, Brain, ChevronRight, Network, Boxes, Search, Globe, ShieldCheck } from "lucide-react";
import { useStore } from "@/src/lib/store";
import { useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

export default function SummaryPage() {
  const { documentText, summary, setSummary } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("detailed");
  const [copied, setCopied] = useState(false);
  const [factCheck, setFactCheck] = useState<{ analysis: string; sources: string[] } | null>(null);
  const [checkingFacts, setCheckingFacts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!documentText) navigate('/upload');
  }, [documentText, navigate]);

  // Removed auto-fact-check to conserve API quota
  /*
  useEffect(() => {
    if (summary && !factCheck && !checkingFacts) {
      runFactCheck();
    }
  }, [summary, factCheck, checkingFacts]);
  */

  const generateSummary = async (type: string) => {
    if (!documentText) return;
    setMode(type);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: documentText, type }),
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Summary generation failed (${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }
      setSummary(data.summary);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportSummary = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Summary-${mode}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runFactCheck = async () => {
    if (!documentText) return;
    setCheckingFacts(true);
    try {
      const response = await fetch("/api/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: documentText.substring(0, 5000) }),
      });
      const data = await response.json();
      setFactCheck(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCheckingFacts(false);
    }
  };

  return (
    <div className="min-h-screen pt-44 pb-44 px-6 relative z-10 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 mb-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5 mb-6"
            >
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.25em] text-[10px]">Neural Intelligence Core</span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-r from-black to-black/60 dark:from-white dark:to-white/40">Smart<br />Synthesization.</h1>
            <p className="text-2xl text-gray-500 font-semibold leading-relaxed tracking-tight">Condensed knowledge architecture powered by specific ground-truth analysis.</p>
          </div>

          <div className="flex flex-wrap gap-4">
             {['Concise', 'Detailed', 'Bullets', 'Exam'].map((t) => (
                <Button
                  key={t}
                  onClick={() => generateSummary(t.toLowerCase())}
                  variant="outline"
                  className={`rounded-2xl px-10 h-16 font-black text-lg transition-all border-black/5 dark:border-white/10 ${
                    mode === t.toLowerCase() 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/20" 
                      : "bg-white dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  {t}
                </Button>
             ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!summary && !loading ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-32 rounded-[4rem] border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/[0.01] flex flex-col items-center text-center backdrop-blur-3xl"
            >
              {error && (
                <div className="mb-10 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold max-w-md mx-auto">
                  {error}
                </div>
              )}
              <div className="w-32 h-32 rounded-[3.5rem] bg-indigo-600/10 dark:bg-white/5 flex items-center justify-center mb-12 shadow-2xl">
                <Wand2 className="w-14 h-14 text-indigo-600 dark:text-gray-500" />
              </div>
              <h3 className="text-4xl font-black mb-6 tracking-tight dark:text-white">Synthesization Pipeline Idle</h3>
              <p className="text-2xl text-gray-500 max-w-xl mb-14 font-semibold leading-relaxed">Choose a neural compression protocol above to begin distilling document context.</p>
              <Button 
                onClick={() => generateSummary('detailed')}
                className="rounded-full px-16 py-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all group"
              >
                Spark Intelligence
                <ChevronRight className="ml-4 w-8 h-8 group-hover:translate-x-3 transition-transform" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] -z-10 rounded-[6rem]" />
              <div className="p-16 rounded-[4rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 backdrop-blur-3xl shadow-3xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 border-b border-black/5 dark:border-white/5 pb-12">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                        <FileText className="text-white w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] mb-1">Extraction Complete</p>
                        <span className="text-3xl font-black tracking-tighter dark:text-white">Profile: {mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <Button onClick={copyToClipboard} variant="outline" className={`rounded-2xl h-14 px-8 border-black/10 dark:border-white/10 hover:bg-black/5 font-black flex items-center gap-3 transition-all ${copied ? "text-indigo-600 border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" : ""}`}>
                        {copied ? <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" /> : <Copy className="w-5 h-5 flex-shrink-0" />}
                        {copied ? "Copied to Nucleus" : "Copy Raw Data"}
                      </Button>
                      <Button onClick={exportSummary} variant="outline" className="rounded-2xl h-14 px-8 border-black/10 dark:border-white/10 hover:bg-black/5 font-black flex items-center gap-3">
                        <Download className="w-5 h-5 flex-shrink-0" />
                        Export Intelligence
                      </Button>
                   </div>
                </div>

                {loading ? (
                  <div className="space-y-8 py-12">
                    {[1,2,3,4,5,6].map(i => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.15 }}
                        className="h-5 bg-black/5 dark:bg-white/10 rounded-full w-full" 
                        style={{ width: `${100 - (i * 8)}%` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed space-y-8 text-2xl font-semibold tracking-tight">
                    {summary.split('\n').map((line, idx) => (
                      <p key={idx} className={line.startsWith('#') ? 'text-4xl font-black text-black dark:text-white pt-8 first:pt-0 mb-4' : ''}>{line}</p>
                    ))}
                  </div>
                )}

                {/* Advanced Features Navigation */}
                {!loading && summary && (
                  <div className="mt-16 pt-16 border-t border-black/5 dark:border-white/5">
                    <h4 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500 mb-8">Advanced Synthesis Layers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <motion.div 
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/flashcards")}
                        className="p-10 rounded-[3rem] bg-indigo-600/5 dark:bg-indigo-600/10 border border-indigo-500/20 cursor-pointer group transition-all shadow-2xl"
                      >
                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-xl shadow-indigo-500/20">
                          <Brain className="w-8 h-8" />
                        </div>
                        <h5 className="text-3xl font-black mb-4 dark:text-white tracking-tighter">Neural Flashcards</h5>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg leading-relaxed">Synthesize interactive memory nodes for maximum retention.</p>
                        <div className="mt-8 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-widest">
                          Initialize Layer <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/insights")}
                        className="p-10 rounded-[3rem] bg-amber-600/5 dark:bg-amber-600/10 border border-amber-500/20 cursor-pointer group transition-all shadow-2xl"
                      >
                        <div className="w-16 h-16 rounded-[1.5rem] bg-amber-600 flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-transform shadow-xl shadow-amber-500/20">
                          <Sparkles className="w-8 h-8" />
                        </div>
                        <h5 className="text-3xl font-black mb-4 dark:text-white tracking-tighter">Heuristic Insights</h5>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg leading-relaxed">Analyze hidden logical connections and critical document patterns.</p>
                        <div className="mt-8 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-sm uppercase tracking-widest">
                          Scan Context <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/topics")}
                        className="p-10 rounded-[3rem] bg-emerald-600/5 dark:bg-emerald-600/10 border border-emerald-500/20 cursor-pointer group transition-all shadow-2xl"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-600 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-xl shadow-emerald-500/20 flex-shrink-0">
                            <Network className="w-8 h-8" />
                          </div>
                          <div>
                            <h5 className="text-3xl font-black mb-4 dark:text-white tracking-tighter">Semantic Mapping</h5>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg leading-relaxed">Deconstruct core thematic clusters and relevance metrics.</p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/graph")}
                        className="p-10 rounded-[3rem] bg-rose-600/5 dark:bg-rose-600/10 border border-rose-500/20 cursor-pointer group transition-all shadow-2xl"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-rose-600 flex items-center justify-center text-white group-hover:scale-110 group-hover:-rotate-12 transition-transform shadow-xl shadow-rose-500/20 flex-shrink-0">
                            <Boxes className="w-8 h-8" />
                          </div>
                          <div>
                            <h5 className="text-3xl font-black mb-4 dark:text-white tracking-tighter">Spatial Graph</h5>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg leading-relaxed">Visualize semantic relationships in a 3D knowledge topology.</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-32 flex flex-wrap justify-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Brain className="w-3 h-3 text-indigo-500" /> Grounded Core 2.1
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <ShieldCheck className="w-3 h-3 text-indigo-500" /> Hallucination Guard Active
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Globe className="w-3 h-3 text-indigo-500" /> Multimodal Sync
           </div>
        </div>
      </div>
    </div>
  );
}

function Target(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
