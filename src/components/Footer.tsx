import { motion } from "motion/react";
import { Brain, Github, Twitter, Linkedin, Heart, Shield, Zap, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-3xl pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
        <div className="space-y-8 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter dark:text-white">NeuroPrep AI</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
            Advanced document synthesization and neural prep. Engineered for precision knowledge extraction.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-6">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500">Neural Connect</h4>
          <div className="flex gap-4">
            <motion.a
              whileHover={{ y: -3, scale: 1.1 }}
              href="https://github.com/piyush06singhal"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest"
            >
              <Github className="w-4 h-4" />
              GitHub
            </motion.a>
            <motion.a
              whileHover={{ y: -3, scale: 1.1 }}
              href="https://x.com/PiyushS07508112"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </motion.a>
            <motion.a
              whileHover={{ y: -3, scale: 1.1 }}
              href="https://www.linkedin.com/in/piyush06singhal/"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </motion.a>
          </div>
          <div className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">© 2026 NeuroPrep Architecture</div>
        </div>
      </div>
    </footer>
  );
}
