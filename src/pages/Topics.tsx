import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Network, ArrowLeft, Download, Info, AlertCircle, BarChart3 } from "lucide-react";
import { useStore } from "@/src/lib/store";
import { Button } from "@/src/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TopicsPage() {
  const { documentText, topics, setTopics } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!documentText) {
      navigate("/");
      return;
    }
    if (topics.length === 0) {
      analyzeTopics();
    }
  }, []);

  const analyzeTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/topic-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: documentText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTopics(data.topics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="relative w-24 h-24 mb-10">
           <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360], borderRadius: ["20%", "50%", "20%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full bg-indigo-500/20 border-2 border-dashed border-indigo-500"
           />
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-4 dark:text-white text-center">Mapping Cognitive Clusters...</h2>
        <p className="text-gray-500 font-bold animate-pulse text-lg">Extracting semantic entities and weighting relevance.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black tracking-tighter mb-4 dark:text-white">Neural Disruption</h2>
        <p className="text-gray-500 font-bold mb-8 text-center max-w-md">{error}</p>
        <Button onClick={analyzeTopics} className="rounded-2xl h-14 px-8 bg-indigo-600 font-black text-white">
          Retry Mapping
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-44 px-6 relative z-10 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <header className="mb-20">
          <div className="flex justify-between items-start mb-8">
            <Button 
                onClick={() => navigate(-1)} 
                variant="ghost" 
                className="p-0 hover:bg-transparent text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-2 font-black uppercase tracking-widest text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Return
            </Button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Network className="w-5 h-5" />
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-xs text-indigo-600">Semantic Distribution</span>
          </motion.div>
          
          <h1 className="text-6xl font-black tracking-tighter dark:text-white mb-6 leading-none">
            Topic Analysis.
          </h1>
          <p className="text-xl text-gray-500 font-bold max-w-2xl leading-relaxed">
            Automatic identification and clustering of core themes discovered within your document's semantic structure.
          </p>
        </header>

        <div className="space-y-8">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-8 md:p-10 rounded-[3rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-xl backdrop-blur-3xl group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl">
                    {index + 1}
                  </div>
                  <h3 className="text-3xl font-black tracking-tight dark:text-white group-hover:text-indigo-600 transition-colors">
                    {topic.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-black dark:text-white tabular-nums">{topic.relevance}% Relevance</span>
                </div>
              </div>

              {/* Relevance Bar */}
              <div className="w-full h-2.5 bg-black/5 dark:bg-white/5 rounded-full mb-8 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${topic.relevance}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                />
              </div>

              <div className="flex gap-3">
                <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                <p className="text-lg text-gray-500 font-bold leading-relaxed">
                   {topic.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
