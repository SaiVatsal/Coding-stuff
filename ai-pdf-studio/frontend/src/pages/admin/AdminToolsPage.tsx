import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Settings, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import toolConfig from '../../config/toolConfig.json';

const AdminToolsPage = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tools, setTools] = useState(toolConfig.tools);
  const [recentLog, setRecentLog] = useState<string[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setRecentLog(prev => [`[INFO] AI received prompt: "${prompt}"`, ...prev]);
    
    try {
      // In a real scenario, this connects to our backend endpoint which calls OpenAI, 
      // generates the React component string, writes the file, and updates toolConfig.json.
      setRecentLog(prev => [`[FETCH] Sending request to /api/generate-tool...`, ...prev]);
      
      const response = await fetch('http://localhost:5000/api/generate-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRecentLog(prev => [`[SUCCESS] Generated tool: ${data.tool.name}`, ...prev]);
        setRecentLog(prev => [`[SUCCESS] Route registered at: ${data.tool.route}`, ...prev]);
        setTools(prev => [...prev, data.tool]);
        setPrompt('');
      } else {
        throw new Error(data.message || 'Failed generation');
      }
    } catch (error: any) {
      console.error(error);
      setRecentLog(prev => [`[ERROR] Generation failed: ${error.message}. Is backend running?`, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleToolStatus = (id: string) => {
    setTools(tools.map(t => {
      if (t.id === id) return { ...t, enabled: !t.enabled };
      return t;
    }));
    // In a real app, send update to backend
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-10 border-b border-slate-200 pb-6 flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Settings className="text-primary-600" /> Admin Dashboard
              </h1>
              <p className="text-slate-500 mt-2">Manage tools, view generated systems, and instruct AI to build new ones.</p>
           </div>
           
           <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-bold text-slate-700">AI Generator Online</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Generator Panel */}
           <div className="lg:col-span-2 space-y-8">
              <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="glass-dark p-8 rounded-3xl relative overflow-hidden"
              >
                  <div className="absolute -right-20 -top-20 opacity-10">
                    <Sparkles size={250} />
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="text-accent-400" /> AI Auto Tool Generator
                  </h2>
                  <p className="text-slate-400 mb-8">Describe the PDF tool you want the AI to generate. It will write the UI, logic, SEO, and automatically mount it to the router.</p>
                  
                  <form onSubmit={handleGenerate}>
                     <textarea 
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                       placeholder="E.g. Create a PDF watermark remover that accepts an image watermark and dynamically renders it on all pages before allowing download..."
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 min-h-[120px] focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all mb-4"
                     />
                     <button 
                       type="submit"
                       disabled={isGenerating || !prompt.trim()}
                       className="w-full sm:w-auto bg-gradient-to-r from-accent-600 to-purple-600 hover:from-accent-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                       {isGenerating ? "Generating Full-Stack Module..." : "Generate Tool"}
                     </button>
                  </form>
              </motion.div>

              {/* Generator Logs */}
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 font-mono text-sm shadow-inner h-64 overflow-y-auto">
                 <h3 className="text-slate-400 mb-4 border-b border-slate-800 pb-2 uppercase tracking-wider text-xs">Generation Logs</h3>
                 {recentLog.length === 0 ? (
                   <div className="text-slate-600 italic">Waiting for input...</div>
                 ) : (
                   <ul className="space-y-2">
                     {recentLog.map((log, i) => (
                       <li key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-green-400' : 'text-slate-300'}`}>
                         <span className="opacity-50 text-xs mr-2">{new Date().toLocaleTimeString()}</span>
                         {log}
                       </li>
                     ))}
                   </ul>
                 )}
              </div>
           </div>

           {/* Tool Registry Sidebar */}
           <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-24">
                 <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                   <Layers className="text-primary-600"/> Tool Registry
                 </h2>
                 
                 <div className="space-y-4">
                    {tools.map(tool => (
                      <div key={tool.id} className={`p-4 rounded-xl border transition-all ${tool.enabled ? 'border-primary-100 bg-primary-50/50' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
                         <div className="flex justify-between items-start mb-2">
                           <h3 className="font-bold text-slate-800">{tool.name}</h3>
                           <button 
                             onClick={() => toggleToolStatus(tool.id)}
                             className={`text-xs font-bold px-2 py-1 rounded-md ${tool.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}
                           >
                             {tool.enabled ? 'Active' : 'Disabled'}
                           </button>
                         </div>
                         <p className="text-xs text-slate-500 mb-2 font-mono bg-white px-2 py-1 rounded border border-slate-100 break-all">{tool.route}</p>
                         <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-3 pt-3 border-t border-slate-200">
                            <span className="flex items-center gap-1"><CheckCircle size={12} className={tool.isGenerated ? "text-accent-500" : "text-green-500"}/> {tool.isGenerated ? "AI Generated" : "Native"}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminToolsPage;
