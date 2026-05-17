import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Network, ArrowLeft, Download, Info, AlertCircle, Share2, ZoomIn, Boxes } from "lucide-react";
import { useStore } from "@/src/lib/store";
import { Button } from "@/src/components/ui/button";
import { useNavigate } from "react-router-dom";
import ForceGraph3D from "react-force-graph-3d";

export default function KnowledgeGraphPage() {
  const { documentText, graphData, setGraphData } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (!documentText) {
      navigate("/");
      return;
    }
    if (!graphData.nodes || graphData.nodes.length === 0) {
      generateGraph();
    }
  }, []);

  const generateGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/knowledge-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: documentText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGraphData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: any) => {
    // Aim at node from outside
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    if (fgRef.current) {
        fgRef.current.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new pos
            node, // lookAt ({ x, y, z })
            3000  // ms transition time
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020202]">
        <div className="relative w-32 h-32 mb-12">
           <motion.div 
            animate={{ 
                scale: [1, 1.4, 1], 
                rotate: [0, 90, 180],
                opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 border-2 border-indigo-500 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.3)]"
           />
           <motion.div 
            animate={{ 
                scale: [1.4, 1, 1.4], 
                rotate: [180, 270, 360],
                opacity: [1, 0.5, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 border-2 border-emerald-500 rounded-full"
           />
        </div>
        <h2 className="text-4xl font-black tracking-tighter mb-4 text-white">Projecting Neural Nodes...</h2>
        <p className="text-indigo-400 font-bold animate-pulse text-lg tracking-widest uppercase">Initializing 3D Spatial Context</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020202]">
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black tracking-tighter mb-4 text-white">Projection Failed</h2>
        <p className="text-gray-400 font-bold mb-8 text-center max-w-md">{error}</p>
        <Button onClick={generateGraph} className="rounded-2xl h-14 px-8 bg-indigo-600 font-black text-white">
          Retry Projection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] overflow-hidden relative">
      {/* Header UI */}
      <div className="absolute top-12 left-12 right-12 z-50 pointer-events-none flex justify-between items-start">
        <div>
          <Button 
                onClick={() => navigate(-1)} 
                variant="ghost" 
                className="pointer-events-auto p-0 hover:bg-transparent text-gray-500 hover:text-white flex items-center gap-2 font-black uppercase tracking-widest text-[10px] mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Control
            </Button>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-indigo-400 font-black tracking-[0.3em] uppercase text-[10px]">Neural Topology</span>
          </motion.div>
          
          <h1 className="text-7xl font-black tracking-tighter text-white mb-4 leading-none select-none">
            Spatial Graph.
          </h1>
          <p className="text-lg text-gray-400 font-medium max-w-xl leading-relaxed select-none">
            Observe the non-linear relationships between semantic entities extracted from the source intelligence layer.
          </p>
        </div>

        <div className="flex gap-4 pointer-events-auto">
            <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Entity Count</span>
                <span className="text-3xl font-black text-white tabular-nums">{graphData.nodes?.length || 0}</span>
            </div>
            <Button onClick={generateGraph} variant="outline" className="rounded-3xl border-white/10 h-20 px-8 bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white font-black flex flex-col items-center justify-center gap-1 group">
                <Boxes className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[10px] uppercase tracking-widest">Regenerate</span>
            </Button>
        </div>
      </div>

      {/* Control Tips Overlay */}
      <div className="absolute bottom-12 left-12 z-50 pointer-events-none">
          <div className="space-y-4">
              {[
                { label: 'Rotate', icon: 'Left Click' },
                { label: 'Zoom', icon: 'Scroll' },
                { label: 'Pan', icon: 'Right Click' },
                { label: 'Select Node', icon: 'Node Tap' }
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
                    <div className="px-2 py-1 rounded bg-white/10 border border-white/10 text-[8px] font-black text-white uppercase tracking-widest min-w-[70px] text-center">
                        {tip.icon}
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{tip.label}</span>
                </div>
              ))}
          </div>
      </div>

      {/* The Graph */}
      <div className="w-full h-screen cursor-grab active:cursor-grabbing">
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="id"
          nodeAutoColorBy="group"
          nodeRelSize={6}
          linkWidth={1.5}
          linkDirectionalParticles={4}
          linkDirectionalParticleSpeed={0.01}
          backgroundColor="#020202"
          onNodeClick={handleNodeClick}
          showNavInfo={false}
          linkColor={() => 'rgba(255,255,255,0.1)'}
          nodeThreeObjectExtend={true}
          nodeThreeObject={(node: any) => {
             // Returning undefined lets the default object be used
             return undefined;
          }}
        />
      </div>
    </div>
  );
}
