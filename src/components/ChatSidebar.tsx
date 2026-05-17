import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { useStore } from "@/src/lib/store";
import { Button } from "@/src/components/ui/button";

export default function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { chatHistory, addChatMessage, documentText, clearChat } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!documentText) {
      addChatMessage("assistant", "Please upload a document to initialize my neural context. I need source material to think.");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    addChatMessage("user", userMessage);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory,
          content: documentText
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      addChatMessage("assistant", data.response);
    } catch (err: any) {
      addChatMessage("assistant", "Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Removed the null return to keep the button visible as a hint
  // if (!documentText) return null;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 z-[60] w-16 h-16 rounded-3xl bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group overflow-hidden"
        whileHover={{ rotate: [0, -10, 10, 0] }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquare className="w-8 h-8" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-[#050505] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[100] border-l border-black/5 dark:border-white/5 flex flex-col backdrop-blur-3xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Semantic Layer</span>
                </div>
                <h3 className="text-2xl font-black tracking-tighter dark:text-white">Neural Chat.</h3>
              </div>
              <Button 
                onClick={() => setIsOpen(false)} 
                variant="ghost" 
                size="icon" 
                className="rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Chat History */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 mb-6">
                    <Bot className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black mb-2 dark:text-white">Ready for Synthesis.</h4>
                  <p className="text-gray-500 font-bold text-sm leading-relaxed">
                    Ask anything about the document. I have decoded the semantic structures for you.
                  </p>
                </div>
              )}
              
              {chatHistory.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-black/5 dark:bg-white/10' : 'bg-indigo-600'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 dark:text-white" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <div className={`max-w-[80%] p-5 rounded-3xl font-bold leading-relaxed text-sm ${
                    msg.role === 'user' 
                      ? 'bg-black/5 dark:bg-white/5 dark:text-white rounded-tr-none' 
                      : 'bg-indigo-600/5 border border-indigo-600/20 text-indigo-900 dark:text-indigo-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                   </div>
                   <div className="flex gap-1 items-center px-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                        />
                      ))}
                   </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
              <form onSubmit={sendMessage} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Query semantic memory..."
                  className="w-full h-16 pl-6 pr-16 rounded-2xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-sm transition-all"
                />
                <Button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-2 h-12 w-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 p-0 shadow-lg shadow-indigo-600/30"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
              <div className="mt-4 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                   {documentText ? `Vector Context: ${documentText.length} chars` : "System Offline: No Context Loaded"}
                 </span>
                 <button onClick={clearChat} className="text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 tracking-tighter">Clear Registry</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
