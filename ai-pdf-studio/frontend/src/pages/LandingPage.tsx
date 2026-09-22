import { motion } from 'framer-motion';
import { 
  FileUp, Sparkles, Zap, ShieldCheck, ArrowRight, 
  Image as ImageIcon, Layers, Minimize, Scissors, 
  FileText, Pencil, Lock, Unlock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const tools = [
  { id: 'image-to-pdf', name: 'Image to PDF', icon: ImageIcon, route: '/tools/image-to-pdf', color: 'from-blue-400 to-blue-600', description: 'Convert your images to optimized PDFs.' },
  { id: 'merge-pdf', name: 'Merge PDF', icon: Layers, route: '/tools/merge-pdf', color: 'from-purple-400 to-purple-600', description: 'Combine multiple PDFs into one document.' },
  { id: 'compress-pdf', name: 'Compress PDF', icon: Minimize, route: '/tools/compress-pdf', color: 'from-green-400 to-green-600', description: 'Reduce file size while keeping quality.' },
  { id: 'split-pdf', name: 'Split PDF', icon: Scissors, route: '/tools/split-pdf', color: 'from-orange-400 to-orange-600', description: 'Separate PDF pages into easy independent files.' },
  { id: 'pdf-to-word', name: 'PDF to Word', icon: FileText, route: '/tools/pdf-to-word', color: 'from-blue-500 to-cyan-500', description: 'Convert PDF files into DOC/DOCX format.' },
  { id: 'edit-pdf', name: 'Edit PDF', icon: Pencil, route: '/tools/edit-pdf', color: 'from-rose-400 to-rose-600', description: 'Add text, shapes or annotations to PDFs.' },
  { id: 'protect-pdf', name: 'Protect PDF', icon: Lock, route: '/tools/protect-pdf', color: 'from-slate-600 to-slate-800', description: 'Encrypt your PDF with a secure password.' },
  { id: 'unlock-pdf', name: 'Unlock PDF', icon: Unlock, route: '/tools/unlock-pdf', color: 'from-teal-400 to-teal-600', description: 'Remove PDF password protection instantly.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden relative font-sans">
      {/* Dynamic 3D Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.2, 1] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-40 -right-20 w-[30rem] h-[30rem] bg-indigo-400/20 rounded-full blur-3xl" 
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm text-sm font-medium text-primary-700 mb-8"
        >
           <Sparkles className="w-4 h-4 text-emerald-500" />
           <span>Next-Gen AI Document OS</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6"
        >
          Do more with your PDFs using <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
            AI PDF Studio
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-slate-600 max-w-2xl mb-10"
        >
          The ultimate platform to merge, compress, convert, and edit your PDFs. Fully powered by AI, completely free, and designed for speed.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/tools/image-to-pdf" className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="#tools" className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl font-bold text-lg shadow-lg shadow-slate-200/50 transition-all hover:-translate-y-1 border border-slate-100 flex items-center justify-center gap-2">
            Explore All Tools
          </Link>
        </motion.div>
      </section>

      {/* Tools Grid Section */}
      <section id="tools" className="relative z-10 py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Powerful Tools for Every Need</h2>
          <p className="text-slate-600">Everything you need to manage your documents securely.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/30 border border-slate-100/50 hover:shadow-2xl hover:border-primary-100 transition-all cursor-pointer relative overflow-hidden"
            >
               {/* Hover Gradient Background */}
               <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${tool.color} opacity-0 group-hover:opacity-10 rounded-bl-full transition-opacity duration-500`} />
               
               <Link to={tool.route} className="block w-full h-full">
                 <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${tool.color} shadow-lg text-white transform group-hover:rotate-6 transition-transform`}>
                    <tool.icon className="w-7 h-7" strokeWidth={1.5} />
                 </div>
                 
                 <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary-600 transition-colors">
                   {tool.name}
                 </h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   {tool.description}
                 </p>
               </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Overview */}
      <section className="relative z-10 py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12 text-center">
           <div className="flex flex-col items-center">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
               <Zap className="w-8 h-8" />
             </div>
             <h4 className="text-xl font-bold text-slate-900 mb-3">Lightning Fast</h4>
             <p className="text-slate-600">Processes your documents in milliseconds using advanced WASM and Web Workers directly in browser.</p>
           </div>
           
           <div className="flex flex-col items-center">
             <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
               <ShieldCheck className="w-8 h-8" />
             </div>
             <h4 className="text-xl font-bold text-slate-900 mb-3">Military-grade Privacy</h4>
             <p className="text-slate-600">Your files never leave your device unless using AI models. Complete local-first privacy.</p>
           </div>

           <div className="flex flex-col items-center">
             <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
               <FileUp className="w-8 h-8" />
             </div>
             <h4 className="text-xl font-bold text-slate-900 mb-3">Universal Formats</h4>
             <p className="text-slate-600">Support for over 40+ document and image formats with smart auto-conversion technology.</p>
           </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
