import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Image as ImageIcon, Settings, ArrowRight, MoveUp, MoveDown } from 'lucide-react';

import { PDFDocument, PageSizes } from 'pdf-lib';

interface PreviewImage {
  file: File;
  preview: string;
  id: string;
}

const ImageToPdfPage = () => {
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('small');
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] }
  });

  const removeImage = (idToRemove: string) => {
    setImages(images.filter((img) => img.id !== idToRemove));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    }
    setImages(newImages);
  };

  const processImages = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      const marginMap: Record<string, number> = { none: 0, small: 20, big: 50 };
      const marginVal = marginMap[margin] || 0;

      for (const imgObj of images) {
        const imageBytes = await imgObj.file.arrayBuffer();
        let pdfImage;
        
        if (imgObj.file.type === 'image/jpeg') {
          pdfImage = await pdfDoc.embedJpg(imageBytes);
        } else if (imgObj.file.type === 'image/png') {
          pdfImage = await pdfDoc.embedPng(imageBytes);
        } else {
          continue; // skip unsupported
        }

        const dims = pdfImage.scale(1);
        let pageW = 0;
        let pageH = 0;

        // Determine Page Size
        if (pageSize === 'a4') {
          pageW = orientation === 'portrait' ? PageSizes.A4[0] : PageSizes.A4[1];
          pageH = orientation === 'portrait' ? PageSizes.A4[1] : PageSizes.A4[0];
        } else if (pageSize === 'letter') {
          pageW = orientation === 'portrait' ? PageSizes.Letter[0] : PageSizes.Letter[1];
          pageH = orientation === 'portrait' ? PageSizes.Letter[1] : PageSizes.Letter[0];
        } else if (pageSize === 'fit') {
          pageW = dims.width + (marginVal * 2);
          pageH = dims.height + (marginVal * 2);
        }

        const page = pdfDoc.addPage([pageW, pageH]);
        
        // Calculate scaling to fit within available area (width - 2*margin, height - 2*margin)
        const availableWidth = pageW - (marginVal * 2);
        const availableHeight = pageH - (marginVal * 2);
        
        const scaleFactor = Math.min(
          availableWidth / dims.width,
          availableHeight / dims.height,
          1 // don't upscale beyond original if fit, but we usually scale down
        );
        
        const scaledWidth = dims.width * scaleFactor;
        const scaledHeight = dims.height * scaleFactor;

        // Center the image
        const x = (pageW - scaledWidth) / 2;
        const y = (pageH - scaledHeight) / 2;

        page.drawImage(pdfImage, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI_PDF_Studio_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Image To PDF Converter</h1>
          <p className="text-lg text-slate-600">Transform JPG, PNG, or TIFF files to PDF intuitively.</p>
        </div>

        {images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div 
              {...getRootProps()} 
              className={`rounded-3xl border-3 border-dashed p-16 text-center cursor-pointer transition-all duration-300 ease-in-out ${
                isDragActive ? 'border-primary-500 bg-primary-50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50 relative overflow-hidden group'
              }`}
            >
              <input {...getInputProps()} />
              
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud size={40} className="text-primary-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {isDragActive ? "Drop images here" : "Choose Images"}
              </h3>
              <p className="text-slate-500 mb-8">or drag and drop them here</p>
              
              <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-medium shadow-md group-hover:shadow-lg transition-all">
                Select Files
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Preview Area */}
            <div className="lg:w-2/3 glass rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ImageIcon size={20}/> Selected Images ({images.length})</h2>
                    <div {...getRootProps()} className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100">
                        <input {...getInputProps()} />
                        + Add More
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {images.map((img, idx) => (
                      <motion.div 
                        key={img.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[3/4] bg-slate-100"
                      >
                        <img 
                          src={img.preview} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex justify-between w-full">
                               <div className="bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">{idx + 1}</div>
                               <button 
                                 onClick={(e) => {e.stopPropagation(); removeImage(img.id);}}
                                 className="bg-red-500 text-white p-1 rounded-md shadow-sm hover:bg-red-600"
                                 title="Remove Image"
                                 aria-label="Remove Image"
                               >
                                 <X size={16} />
                               </button>
                            </div>
                            <div className="flex justify-end gap-2">
                               <button 
                                 onClick={(e) => {e.stopPropagation(); moveImage(idx, 'up');}}
                                 className="bg-white/90 text-slate-800 p-1 rounded-lg shadow-sm hover:bg-white disabled:opacity-50"
                                 disabled={idx === 0}
                                 title="Move Up"
                                 aria-label="Move Up"
                               >
                                 <MoveUp size={16} />
                               </button>
                               <button 
                                 onClick={(e) => {e.stopPropagation(); moveImage(idx, 'down');}}
                                 className="bg-white/90 text-slate-800 p-1 rounded-lg shadow-sm hover:bg-white disabled:opacity-50"
                                 disabled={idx === images.length - 1}
                                 title="Move Down"
                                 aria-label="Move Down"
                               >
                                 <MoveDown size={16} />
                               </button>
                            </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
            </div>

            {/* Sidebar Settings Area */}
            <div className="lg:w-1/3">
              <div className="glass rounded-3xl p-6 shadow-sm sticky top-24">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                      <Settings size={20} className="text-primary-600" /> PDF Options
                  </h3>

                  <div className="space-y-6">
                      <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Page Size</label>
                            <select 
                              title="Select Page Size"
                              aria-label="Page Size Options"
                              value={pageSize}
                              onChange={(e) => setPageSize(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="a4">A4 (Standard)</option>
                              <option value="letter">US Letter</option>
                              <option value="fit">Fit to Image</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
                            <select 
                              title="Select Orientation"
                              aria-label="Orientation Options"
                              value={orientation}
                              onChange={(e) => setOrientation(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="portrait">Portrait</option>
                              <option value="landscape">Landscape</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Margins</label>
                            <select 
                              title="Select Margins"
                              aria-label="Margin Options"
                              value={margin}
                              onChange={(e) => setMargin(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="none">No Margin</option>
                              <option value="small">Small Margin</option>
                              <option value="big">Big Margin</option>
                            </select>
                         </div>
                      </div>

                      {/* Action Button */}
                      <button 
                        disabled={isProcessing}
                        onClick={processImages}
                        className="w-full relative group mt-8 py-4 px-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                         {isProcessing ? "Converting..." : "Convert to PDF"}
                         {!isProcessing && <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-100 group-hover:translate-x-1 group-hover:text-white transition-all" />}
                      </button>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageToPdfPage;
