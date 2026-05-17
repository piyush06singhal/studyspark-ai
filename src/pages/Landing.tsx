import { motion } from "motion/react";
import { ArrowRight, Brain, FileText, Zap, Shield, Sparkles, ChevronRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Hero3D from "@/src/components/Hero3D";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

const features = [
  {
    title: "AI Quiz Generation",
    desc: "Transform entire textbooks into customized MCQs with intelligent difficulty scaling.",
    icon: Brain,
    color: "from-blue-500 to-cyan-400"
  },
  {
    title: "Contextual Summaries",
    desc: "Generate concise or detailed summaries strictly based on your source documents.",
    icon: FileText,
    color: "from-purple-500 to-pink-400"
  },
  {
    title: "Instant Processing",
    desc: "Rapid extraction and analysis of PDFs, DOCX, and text files in seconds.",
    icon: Zap,
    color: "from-orange-500 to-yellow-400"
  }
];

const faqs = [
  { q: "How accurate is the quiz generation?", a: "Extremely. We use a RAG (Retrieval-Augmented Generation) pipeline that locks the AI to your specifically uploaded text, reducing hallucinations to near zero." },
  { q: "What file formats are supported?", a: "Currently we support PDF, DOCX, and TXT files. We are working on adding PPT and Image-to-Text capabilities soon." },
  { q: "Is my data stored permanently?", a: "No. For privacy, your session data is stored in your browser's state and is cleared when you refresh or close the tab, unless you choose to export it." }
];

import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div className="relative min-h-screen text-black dark:text-white transition-colors duration-500 font-sans">
      <Hero3D />
      
      {/* Content */}
      <div className="relative z-10 pt-56 px-4 pb-40">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-8xl md:text-[13rem] font-black tracking-tighter mb-12 leading-[0.75] bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-white/90 dark:to-white/20 select-none">
              Neural<br />
              <span className="text-indigo-600 dark:text-indigo-500">Prep.</span>
            </h1>
            
            <p className="text-2xl md:text-4xl text-gray-500 dark:text-gray-400 max-w-4xl mx-auto mb-24 font-semibold leading-none tracking-tight">
              Transcend traditional study methods. Transform dormant PDFs into active intelligence nodes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/upload">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="rounded-full px-12 py-9 text-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all group font-black">
                    Get Started Now
                    <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform w-8 h-8" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="mt-64 grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1, duration: 0.8 }}
                whileHover={{ y: -15, scale: 1.02 }}
                className="p-12 rounded-[4rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 backdrop-blur-3xl text-left group transition-all shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl" />
                <div className={cn("w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center mb-10 shadow-2xl group-hover:rotate-6 transition-transform", f.color)}>
                  <f.icon className="text-white w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black mb-6 tracking-tight dark:text-white">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-semibold text-lg">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* New Interactive Section */}
          <div className="mt-64 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none dark:text-white">Built for the<br /><span className="text-indigo-600">High-Performance</span> Student.</h2>
                <p className="text-xl text-gray-500 font-medium mb-10">Stop wasting hours manually creating flashcards. Upload your syllabus and let our AI do the heavy lifting with surgical precision.</p>
                <ul className="space-y-6">
                  {['No more hallucinations via RAG', 'Instant MCQ generation with levels', 'Smart semantic summaries'].map(item => (
                    <li key={item} className="flex items-center gap-4 text-xl font-bold dark:text-white">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                        <Check className="w-5 h-5" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <div className="relative aspect-square rounded-[4rem] bg-indigo-600/5 border border-indigo-500/10 overflow-hidden flex items-center justify-center group">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Brain className="w-48 h-48 text-indigo-600 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-white dark:from-black to-transparent">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Real-Time Processing</p>
                    <h4 className="text-3xl font-black dark:text-white">AI Orchestration Layer</h4>
                 </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-64 max-w-5xl mx-auto text-left p-16 md:p-24 rounded-[4rem] bg-white dark:bg-black border border-black/5 dark:border-white/10 shadow-2xl relative">
            <h2 className="text-5xl font-black mb-16 text-center tracking-tighter dark:text-white">Your Questions, <span className="text-indigo-600">Answered.</span></h2>
            <div className="space-y-12">
              {faqs.map((faq, idx) => (
                <div key={idx} className="group cursor-help transition-all hover:bg-black/5 dark:hover:bg-white/5 p-8 rounded-3xl -m-8">
                  <h4 className="text-2xl font-black mb-4 flex items-center gap-4 dark:text-white">
                    <HelpCircle className="text-indigo-500 w-7 h-7" />
                    {faq.q}
                  </h4>
                  <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed font-semibold pl-11">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Minimalist Footer replaced by Global Footer */}
        </div>
      </div>
      
      <Footer />

      <div className="fixed top-1/4 -left-20 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[160px] pointer-events-none opacity-50" />
      <div className="fixed bottom-1/4 -right-20 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[160px] pointer-events-none opacity-50" />
    </div>
  );
}

function HelpCircle(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
