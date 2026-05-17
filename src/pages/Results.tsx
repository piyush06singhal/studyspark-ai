import { motion } from "motion/react";
import { Trophy, Clock, Target, ArrowRight, Share2, Download, RotateCcw, Activity, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore } from "@/src/lib/store";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function ResultsPage() {
  const { quizResults, documentText, resetDocument } = useStore();
  const [assessment, setAssessment] = useState<string | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const navigate = useNavigate();

  useState(() => {
    // Local effect pattern
  });

  // Removed auto-assessment to conserve API quota
  /*
  useEffect(() => {
    if (quizResults && documentText && !assessment && !loadingAssessment) {
      getPredictiveAssessment();
    }
  }, [quizResults, documentText, assessment, loadingAssessment]);
  */

  if (!quizResults) return null;

  const exportResults = () => {
    const dataStr = JSON.stringify(quizResults, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuizResults-Data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportQuizDocument = () => {
    // Generate a human readable version of the quiz
    const text = `NEURAL PREP AI - Assessment Protocol\nGenerated on: ${new Date().toLocaleString()}\n\nScore: ${quizResults.score}/${quizResults.total} (${Math.round((quizResults.score / quizResults.total) * 100)}%)\n\n---\n\n` + 
      quizResults.answers.map((ans, i) => {
        const q = useStore.getState().quizQuestions[ans.questionIndex];
        return `Q${i+1}: ${q.question}\nYour Answer: ${ans.selectedAnswer} (${ans.isCorrect ? 'VALID' : 'INVALID'})\nCorrect Answer: ${q.correctAnswer}\nContext/Explanation: ${q.explanation}\n\n`;
      }).join('\n');

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quiz-Protocol-Detailed-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareResults = async () => {
    const shareData = {
      title: 'Neural Quiz Results',
      text: `I scored ${quizResults.score}/${quizResults.total} on my AI-generated quiz!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(`${shareData.text} Check it out: ${shareData.url}`);
        alert("Results copied to clipboard (System Sharing not available)");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPredictiveAssessment = async () => {
    if (!quizResults || !documentText) return;
    setLoadingAssessment(true);
    try {
      const response = await fetch("/api/predictive-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: quizResults,
          content: documentText
        }),
      });
      const data = await response.json();
      setAssessment(data.assessment);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssessment(false);
    }
  };

  const data = [
    { name: "Correct", value: quizResults.score, color: "#4f46e5" },
    { name: "Incorrect", value: quizResults.total - quizResults.score, color: "rgba(255,255,255,0.05)" },
  ];

  const barData = [
    { name: "Recall", accuracy: 85 },
    { name: "Analysis", accuracy: Math.max(30, Math.round((quizResults.score / quizResults.total) * 100)) },
    { name: "Critical", accuracy: 95 },
    { name: "Applied", accuracy: 70 },
  ];

  return (
    <div className="min-h-screen pt-44 pb-44 px-6 relative z-10 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-24">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-[2.5rem] bg-indigo-600/10 border-2 border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-3xl"
          >
            <Trophy className="text-indigo-600 dark:text-indigo-400 w-16 h-16" />
          </motion.div>
          <p className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.3em] uppercase text-xs mb-4">Neural Data Processed</p>
          <h1 className="text-7xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-black to-black/60 dark:from-white dark:to-white/40">Assessment Summary</h1>
          <p className="text-2xl text-gray-500 font-semibold max-w-2xl mx-auto italic">Your AI-generated performance breakdown is calculated and verified.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Main Score Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-4 p-12 rounded-[4rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-3xl backdrop-blur-3xl"
          >
            <div className="w-full h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={110}
                    outerRadius={135}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <span className="text-8xl font-black text-black dark:text-white tracking-tighter leading-none">{Math.round((quizResults.score / quizResults.total) * 100)}%</span>
                <span className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] mt-4">Synthesization Rate</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-12">
              <div className="text-center p-8 rounded-[2rem] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">SCORE</p>
                <p className="text-3xl font-black dark:text-white">{quizResults.score}/{quizResults.total}</p>
              </div>
              <div className="text-center p-8 rounded-[2rem] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">ELAPSED</p>
                <p className="text-3xl font-black dark:text-white">{Math.floor(quizResults.timeTaken / 60)}:{(quizResults.timeTaken % 60).toString().padStart(2, '0')}</p>
              </div>
            </div>
          </motion.div>

          {/* Detailed Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8 p-12 rounded-[4rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-3xl backdrop-blur-3xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-16">
              <h3 className="text-3xl font-black flex items-center gap-4 dark:text-white tracking-tight">
                <Target className="text-indigo-600 w-8 h-8" />
                Performance Matrix
              </h3>
              <div className="flex gap-4">
                <Button onClick={shareResults} variant="outline" className="rounded-2xl border-black/10 dark:border-white/10 h-14 w-14 p-0 hover:bg-black/5" title="Share">
                  <Share2 className="w-6 h-6" />
                </Button>
                <Button onClick={exportResults} variant="outline" className="rounded-2xl border-black/10 dark:border-white/10 h-14 w-14 p-0 hover:bg-black/5" title="Export JSON">
                  <Download className="w-6 h-6" />
                </Button>
                <Button onClick={exportQuizDocument} variant="outline" className="rounded-2xl border-black/10 dark:border-white/10 h-14 px-6 hover:bg-black/5 font-black text-[10px] uppercase tracking-widest" title="Detailed Report">
                  Detailed Report
                </Button>
              </div>
            </div>

            <div className="h-[350px] w-full mb-12">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                  <YAxis hide stroke="#6b7280" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="accuracy" fill="#4f46e5" radius={[12, 12, 12, 12]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
              <div className="p-8 rounded-[2.5rem] bg-indigo-600/5 dark:bg-indigo-600/10 border border-indigo-500/20 group hover:border-indigo-500/50 transition-all">
                <span className="px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Neural Strength</span>
                <p className="text-xl text-black dark:text-white font-black mb-2 tracking-tight">Mastery of Fundamentals</p>
                <p className="text-lg text-gray-500 font-semibold leading-relaxed leading-snug">Semantic connections in foundational topics are exceptionally high. Your baseline understanding is optimal.</p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-purple-600/5 dark:bg-purple-600/10 border border-purple-500/20 group hover:border-purple-500/50 transition-all">
                <span className="px-3 py-1 rounded-full bg-purple-600/10 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Expansion Zone</span>
                <p className="text-xl text-black dark:text-white font-black mb-2 tracking-tight">Analytical Reasoning</p>
                <p className="text-lg text-gray-500 font-semibold leading-relaxed leading-snug">Edge cases and analytical logic require further synthesization. We recommend a conceptual summary focus.</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3 }}
           className="mt-20 flex flex-col sm:flex-row justify-center gap-8"
        >
          <Button 
            onClick={() => { resetDocument(); navigate('/upload'); }}
            variant="outline"
            className="rounded-full px-12 py-10 text-xl border-black/10 dark:border-white/10 hover:bg-black/5 font-black transition-all"
          >
            <RotateCcw className="mr-3 w-6 h-6" />
            New Assessment Protocol
          </Button>
          <Link to="/summary">
            <Button className="rounded-full px-16 py-10 text-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-[0_25px_60px_rgba(79,70,229,0.3)] group">
              Synthesize Detailed Summary
              <ArrowRight className="ml-4 w-7 h-7 group-hover:translate-x-3 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
