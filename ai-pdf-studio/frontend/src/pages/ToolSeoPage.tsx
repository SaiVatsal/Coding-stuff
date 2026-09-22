import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import { Link } from 'react-router-dom';

interface ToolSeoPageProps {
  toolName: string;
  toolRoute: string;
  description: string;
  howToSteps: string[];
  faqs: { q: string, a: string }[];
  children: React.ReactNode; // The actual interactive tool component
}

const ToolSeoPage: React.FC<ToolSeoPageProps> = ({ 
  toolName, 
  toolRoute, 
  description, 
  howToSteps, 
  faqs,
  children 
}) => {
  return (
    <>
      <SEOHead 
        title={toolName} 
        description={description} 
        route={toolRoute}
      />
      
      {/* Render the actual tool at the top */}
      <div className="w-full">
         {children}
      </div>

      {/* SEO Optimized Content Below the Fold */}
      <div className="bg-white border-t border-slate-200 py-20 pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              How to use the {toolName} tool
            </h2>
            <p className="text-lg text-slate-600">
              {description} Follow these simple steps below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            {/* How-to Guide */}
            <div>
               <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <CheckCircle className="text-primary-600" /> Step-by-Step Guide
               </h3>
               <div className="space-y-6">
                 {howToSteps.map((step, index) => (
                   <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                        {index + 1}
                      </div>
                      <p className="text-slate-700 leading-relaxed pt-1">
                        {step}
                      </p>
                   </div>
                 ))}
               </div>
            </div>

            {/* Why use us */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <AlertCircle className="text-accent-500" /> Why use AI PDF Studio?
               </h3>
               <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                   <FileText size={20} className="text-slate-400 shrink-0 mt-0.5" />
                   <span className="text-slate-600"><strong>Bank-grade security:</strong> Files are deleted immediately after processing.</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <FileText size={20} className="text-slate-400 shrink-0 mt-0.5" />
                   <span className="text-slate-600"><strong>AI Enhanced:</strong> Advanced algorithms ensure zero quality loss during PDF operations.</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <FileText size={20} className="text-slate-400 shrink-0 mt-0.5" />
                   <span className="text-slate-600"><strong>Fast infrastructure:</strong> Distributed cloud servers process massive files in seconds.</span>
                 </li>
               </ul>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="border-t border-slate-200 pt-16">
             <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-10 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8 divide-y divide-slate-100">
              {faqs.map((faq, index) => (
                <div key={index} className="pt-8 first:pt-0">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h4>
                  <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Internal Linking */}
          <div className="mt-20 text-center">
             <p className="text-slate-500 mb-4 font-medium uppercase tracking-wider text-sm">Related Tools</p>
             <div className="flex flex-wrap justify-center gap-4">
                <Link to="/tools/merge" className="text-primary-600 hover:text-primary-700 hover:underline">Merge PDF</Link>
                <span className="text-slate-300">•</span>
                <Link to="/tools/compress" className="text-primary-600 hover:text-primary-700 hover:underline">Compress PDF</Link>
                <span className="text-slate-300">•</span>
                <Link to="/tools/split" className="text-primary-600 hover:text-primary-700 hover:underline">Split PDF</Link>
             </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ToolSeoPage;
