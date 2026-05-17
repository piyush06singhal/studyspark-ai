import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Download, Share2, ArrowLeft, Terminal, AlertCircle } from "lucide-react";
import { useStore } from "@/src/lib/store";
import { Button } from "@/src/components/ui/button";
import { useNavigate } from "react-router-dom";
import Markdown from "react-markdown";

export default function InsightsPage() {
  const { documentText, insights, setInsights } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!documentText) {
      navigate("/");
      return;
    }
    if (!insights) {
      extractInsights();
    }
  }, []);

  const extractInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/extract-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: documentText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setInsights(data.insights);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadInsights = () => {
    const blob = new Blob([insights], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Deep-Insights.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ height: [20, 60, 20], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-3 bg-indigo-500 rounded-full"
            />
          ))}
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-4 dark:text-white">Analyzing Patterns...</h2>
        <p className="text-gray-500 font-bold animate-pulse text-lg">Scanning for hidden connections and critical vulnerabilities.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black tracking-tighter mb-4 dark:text-white">Neural Disruption</h2>
        <p className="text-gray-500 font-bold mb-8 text-center max-w-md">{error}</p>
        <Button onClick={extractInsights} className="rounded-2xl h-14 px-8 bg-indigo-600 font-black">
          Re-initialize Layer
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
            <div className="flex gap-4">
               <Button onClick={downloadInsights} variant="outline" className="rounded-2xl border-black/10 dark:border-white/10 h-14 px-8 font-black flex items-center gap-3">
                  <Download className="w-5 h-5" />
                  Export Intelligence
               </Button>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-xs">Heuristic Discovery</span>
          </motion.div>
          
          <h1 className="text-6xl font-black tracking-tighter dark:text-white mb-6 leading-none">
            Deep Insights.
          </h1>
          <p className="text-xl text-gray-500 font-bold max-w-2xl leading-relaxed">
            Heuristic analysis of the documents internal logic, highlighting patterns and connections and non-obvious conclusions.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12">
           <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 md:p-16 rounded-[4rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="markdown-body dark:prose-invert">
              <Markdown>{insights}</Markdown>
            </div>
          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .markdown-body {
          font-family: inherit;
          line-height: 1.8;
          font-size: 1.125rem;
          color: inherit;
        }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          font-weight: 900;
          letter-spacing: -0.05em;
          margin-top: 2.5rem;
          margin-bottom: 1.5rem;
          color: black;
        }
        .dark .markdown-body h1, .dark .markdown-body h2, .dark .markdown-body h3 { color: white; }
        .markdown-body h1 { font-size: 3rem; }
        .markdown-body h2 { font-size: 2.25rem; }
        .markdown-body h3 { font-size: 1.5rem; }
        .markdown-body ul { 
          list-style-type: none; 
          padding-left: 0;
          margin-bottom: 2rem;
        }
        .markdown-body li {
          position: relative;
          padding-left: 2rem;
          margin-bottom: 1rem;
          font-weight: 500;
        }
        .markdown-body li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.7em;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #4f46e5;
          border-radius: 9999px;
        }
        .markdown-body strong {
          color: #4f46e5;
          font-weight: 800;
        }
        .markdown-body p {
          margin-bottom: 1.5rem;
        }
      `}} />
    </div>
  );
}
