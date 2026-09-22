import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { UploadCloud, X, AlertCircle } from 'lucide-react';

interface UniversalUploadProps {
  onFilesAccepted: (files: File[]) => void;
  acceptedTypes?: Record<string, string[]>;
  maxFiles?: number;
  maxSizeMB?: number;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const UniversalUpload: React.FC<UniversalUploadProps> = ({ 
  onFilesAccepted, 
  acceptedTypes = { 'application/pdf': ['.pdf'] },
  maxFiles = 0, // 0 means unlimited
  maxSizeMB = 50,
  title = "Drag & Drop Files Here",
  subtitle = "or click to browse",
  icon = <UploadCloud className="w-12 h-12 text-primary-500 mb-4" />
}) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);
    if (fileRejections.length > 0) {
      const err = fileRejections[0].errors[0];
      if (err.code === 'file-too-large') {
        setError(`File is too large. Max size is ${maxSizeMB}MB.`);
      } else if (err.code === 'file-invalid-type') {
        setError(`Invalid file type format.`);
      } else {
        setError(err.message);
      }
      return;
    }

    if (maxFiles > 0 && acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    onFilesAccepted(acceptedFiles);
  }, [maxFiles, maxSizeMB, onFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize: maxSizeMB * 1024 * 1024
  });

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`w-full p-10 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[300px] 
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'}
        `}
      >
        <input {...getInputProps()} />
        {icon}
        <p className="text-xl font-semibold text-slate-800 tracking-tight">{title}</p>
        <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
        {maxFiles > 0 && (
          <p className="text-xs text-slate-400 mt-2 font-medium">Up to {maxFiles} file(s) allowed (Max {maxSizeMB}MB)</p>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors" title="Dismiss error" aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UniversalUpload;
