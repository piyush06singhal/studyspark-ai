import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { Upload, File, X, CheckCircle2, Loader2, FileText, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/src/lib/store";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const { setDocument } = useStore();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: uploading
  });

  const handleManualSubmit = () => {
    if (manualText.trim().length < 50) {
      setError("Please provide at least 50 characters of content.");
      return;
    }
    setDocument(manualText, "Manual Entry");
    navigate('/generate');
  };

  const handleUpload = async () => {
    if (!file) return;

    // Client-side guard for Vercel's 4.5MB payload limit
    if (file.size > 4.5 * 1024 * 1024) {
      setError("Document too large. The neural context buffer is limited to 4.5MB. Please compress the file or use Manual Entry.");
      return;
    }

    setUploading(true);
    setProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (response.status === 413) {
          throw new Error("The file is too large for the neural engine's current buffer (Max 4.5MB on Vercel). Please try a smaller document.");
        }
        throw new Error(`Neural Link Error (${response.status}): The server returned an unparseable response. This usually indicates a system-level limit was exceeded.`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Neural extraction failed at the core layer.");
      }
      
      if (!data.text || data.text.trim().length < 50) {
        throw new Error("The document is too short or no text could be extracted. Please try a more substantial PDF or text file.");
      }

      setProgress(100);
      setDocument(data.text, data.fileName);
      setTimeout(() => navigate('/generate'), 800);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setError(error.message || "Upload failed. Please try again.");
      setUploading(false);
      setFile(null);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-44 px-6 relative z-10 transition-colors duration-500">
      <div className="max-w-4xl mx-auto text-center">
        <header className="mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.3em] uppercase text-[11px]">Neural Ingest Protocol</span>
          </motion.div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-black via-black/80 to-black/40 dark:from-white dark:via-white/90 dark:to-white/20 leading-[0.8] mb-12 select-none">
            Ingest<br />Knowledge.
          </h1>
          <p className="text-2xl text-gray-500 font-semibold max-w-2xl mx-auto tracking-tight mb-12 leading-tight">Drop your research or study materials into the neural orchestration layer for deep decomposition.</p>
          
          <div className="flex justify-center gap-4 mb-12">
            <button 
              onClick={() => { setMode("upload"); setError(null); }}
              className={`px-8 py-3 rounded-2xl font-black transition-all ${mode === "upload" ? "bg-indigo-600 text-white shadow-xl" : "bg-black/5 dark:bg-white/5 text-gray-500 hover:bg-black/10"}`}
            >
              FILE DROP
            </button>
            <button 
              onClick={() => { setMode("manual"); setError(null); }}
              className={`px-8 py-3 rounded-2xl font-black transition-all ${mode === "manual" ? "bg-indigo-600 text-white shadow-xl" : "bg-black/5 dark:bg-white/5 text-gray-500 hover:bg-black/10"}`}
            >
              MANUAL ENTRY
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold max-w-xl mx-auto mb-10"
            >
              {error}
              {error.includes("PDF parser returned no text") && (
                <p className="text-sm font-medium mt-2 opacity-80">This often happens with scanned PDFs. Try using the "Manual Entry" tab to paste the text directly.</p>
              )}
            </motion.div>
          )}
        </header>

        {mode === "upload" ? (
          <div 
            {...getRootProps()} 
            className="relative group cursor-pointer"
          >
            <input {...getInputProps()} />
            <motion.div 
              whileHover={{ scale: 1.01, y: -5 }}
              className={`p-20 rounded-[4rem] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center min-h-[450px] shadow-3xl backdrop-blur-3xl ${
              isDragActive 
                ? "border-indigo-500 bg-indigo-500/10 ring-4 ring-indigo-500/20" 
                : "border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] hover:bg-white/80 dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/20"
            }`}>
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-32 h-32 rounded-[3rem] bg-indigo-600/10 flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform duration-500">
                      <FileText className="w-14 h-14 text-indigo-600 dark:text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-3xl font-black text-black dark:text-white tracking-tighter mb-4">Initialize Data Drop</p>
                    <p className="text-lg text-gray-500 font-black uppercase tracking-[0.2em]">PDF • DOCX • TXT • MARKDOWN</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="file"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center w-full max-w-md"
                  >
                    <div className="w-32 h-32 rounded-[3rem] bg-indigo-600 text-white flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/40 relative">
                       <File className="w-14 h-14" />
                       {progress === 100 && (
                         <motion.div 
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           className="absolute -top-4 -right-4 w-12 h-12 bg-green-500 rounded-full border-4 border-white dark:border-black flex items-center justify-center shadow-xl"
                         >
                           <CheckCircle2 className="text-white w-6 h-6" />
                         </motion.div>
                       )}
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 px-8 py-4 rounded-3xl flex items-center gap-4 mb-10 w-full group/file">
                      <span className="text-xl font-bold dark:text-white truncate flex-1">{file.name}</span>
                      {!uploading && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}
                          className="p-2 hover:bg-black/10 dark:hover:bg-red-500/20 rounded-xl transition-all"
                        >
                          <X className="w-5 h-5 text-gray-500 hover:text-red-500" />
                        </button>
                      )}
                    </div>

                    {(uploading || progress === 100) && (
                      <div className="w-full space-y-4">
                        <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-indigo-600"
                          />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 flex items-center justify-center gap-3">
                          {progress < 100 ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {progress < 100 ? "Syncing Neural Weights..." : "Data Stream Verified"}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste your study materials, syllabus, or lecture notes here (min 50 characters)..."
              className="w-full min-h-[450px] p-10 rounded-[3rem] bg-white/50 dark:bg-white/[0.02] border-2 border-black/5 dark:border-white/10 text-xl font-medium focus:border-indigo-500 outline-none transition-all resize-none shadow-3xl dark:text-white"
            />
            <Button 
              onClick={handleManualSubmit}
              disabled={manualText.trim().length < 50}
              className="rounded-full px-20 py-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xl shadow-[0_30px_60px_rgba(79,70,229,0.3)] group transition-all"
            >
              Process Content
              <ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-3 transition-transform" />
            </Button>
          </motion.div>
        )}

        {mode === "upload" && file && !uploading && progress < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-20"
          >
            <Button 
              onClick={handleUpload}
              className="rounded-full px-20 py-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xl shadow-[0_30px_60px_rgba(79,70,229,0.3)] group transition-all"
            >
              Analyze Material
              <ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-3 transition-transform" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
