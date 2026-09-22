import { useState } from 'react';
import UniversalUpload from '../components/ui/UniversalUpload';
import { Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CompressPdfPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFilesAccepted = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  };

  const handleAction = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      
      const response = await fetch('http://localhost:5000/api/pdf/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to compress images to PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed-images.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setFiles([]);
    } catch (error) {
       console.error(error);
       alert('Error compressing to PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Compress PDF</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Reduce file size while optimizing for maximal PDF quality.
          </p>
        </div>

        {files.length === 0 ? (
          <div className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50">
             <UniversalUpload 
               onFilesAccepted={handleFilesAccepted} 
               acceptedTypes={{'application/pdf': ['.pdf']}}
               icon={<Minimize className="w-16 h-16 text-primary-500 mb-4 drop-shadow-sm" />}
               title="Select PDF files"
               subtitle="or drop PDFs here"
             />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 min-h-[400px]">
               <div className="flex gap-4 flex-wrap">
                  <AnimatePresence>
                     {files.map((f, i) => (
                       <motion.div 
                         initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.8}}
                         key={f.name + i} 
                         className="w-32 h-40 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-4 relative"
                       >
                          <span className="text-xs text-center break-words w-full line-clamp-3">{f.name}</span>
                          <button 
                            onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            aria-label="Remove element"
                            title="Remove element"
                          >×</button>
                       </motion.div>
                     ))}
                  </AnimatePresence>
               </div>
            </div>

            <div className="flex justify-center">
               <button 
                 onClick={handleAction}
                 disabled={loading}
                 className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
               >
                 {loading ? 'Processing...' : 'Compress PDF'} <Minimize size={20} />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompressPdfPage;
