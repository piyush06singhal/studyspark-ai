import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { Brain, FileText, LayoutDashboard, Share2, Menu, X, Sparkles, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navItems = [
    { name: "Landing", path: "/", icon: Sparkles },
    { name: "Workspace", path: "/upload", icon: FileText },
    { name: "Generator", path: "/generate", icon: Brain },
    { name: "Summary", path: "/summary", icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-6 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto bg-white/5 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/10 px-6 py-3 rounded-full shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
              <Brain className="text-white w-6 h-6" />
            </div>
            <motion.div 
               animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 rounded-xl bg-indigo-500 -z-10"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
              NeuroPrep AI
            </span>
          </div>
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 relative group",
                  isActive 
                    ? "text-black dark:text-white" 
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-black/10 dark:bg-white/10 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-bold tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => setIsDark(!isDark)}
            className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Link to="/upload">
            <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 font-bold px-6">
              Launch App
            </Button>
          </Link>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-gray-500 dark:text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="md:hidden absolute top-24 left-4 right-4 rounded-3xl bg-white/90 dark:bg-black/90 backdrop-blur-2xl border border-black/5 dark:border-white/10 overflow-hidden pointer-events-auto shadow-2xl"
          >
            <div className="p-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-2xl transition-all",
                    location.pathname === item.path 
                      ? "bg-indigo-600 text-white" 
                      : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-bold">{item.name}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
