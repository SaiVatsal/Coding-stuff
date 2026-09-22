require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const pdfRoutes = require('./src/routes/pdfRoutes');
app.use('/api/pdf', pdfRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AI PDF Studio Backend is running' });
});

// AI Auto Tool Generator Endpoint
app.post('/api/generate-tool', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    // 1. Analyze prompt and generate ID
    const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const toolId = `ai-${slug}-${Date.now().toString().slice(-4)}`;
    
    // In a real production scenario, we would call OpenAI API to generate the exact React component code.
    // For this demonstration, we scaffold a boilerplate matching our system architecture.
    
    const generatedComponentName = toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Page';
    const componentPath = `pages/generated/${generatedComponentName}`;
    
    // Create the AI Generated React File
    const generatedCode = `
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ${generatedComponentName} = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // AI Generated Tool Logic Placeholder based on: "${prompt}"
  const processTool = () => {
    setIsProcessing(true);
    setTimeout(() => {
      alert('AI Generated Processing Complete!');
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-[50vh] bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">AI Generated Tool</h2>
      <p className="text-slate-600 mb-8">This module was automatically constructed by AI based on admin requirements.</p>
      
      <div className="border border-dashed border-primary-300 bg-primary-50 rounded-2xl p-12 text-center mb-8">
        <p className="text-primary-700 font-medium font-mono text-sm">System Ready: ${toolId}</p>
      </div>
      
      <button 
        onClick={processTool}
        disabled={isProcessing}
        className="bg-accent-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-accent-500 transition-all shadow-md disabled:opacity-50"
      >
        {isProcessing ? 'Processing AI Logic...' : 'Run Tool Workflow'}
      </button>
    </div>
  );
};

export default ${generatedComponentName};
    `;

    // Write file to filesystem
    const destDir = path.join(__dirname, '../frontend/src/pages/generated');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.writeFileSync(path.join(destDir, `${generatedComponentName}.tsx`), generatedCode);

    // Update toolConfig.json Registry
    const configPath = path.join(__dirname, '../frontend/src/config/toolConfig.json');
    const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    const newToolEntry = {
      id: toolId,
      name: `AI Generated: ${slug.replace(/-/g, ' ')}`,
      route: `/tools/${toolId}`,
      componentPath: componentPath,
      description: `Automatically constructed logic based on admin requirements: '${prompt}'`,
      isGenerated: true,
      enabled: true,
      seo: {
        howToSteps: ["Upload your file.", "Configure AI settings.", "Process and download."],
        faqs: [
          { q: "How does this tool work?", a: "This tool was built in real-time by our AI System utilizing advanced architectural code generation." }
        ]
      }
    };
    
    existingConfig.tools.push(newToolEntry);
    fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));

    // Wait a brief moment to simulate AI compilation time
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.status(200).json({ status: 'success', message: 'Tool generated and injected.', tool: newToolEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed generating tool", message: err.message });
  }
});

// Dynamic Sitemap Endpoint
app.get('/sitemap.xml', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../frontend/src/config/toolConfig.json');
    const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n';
    
    // Base Routes
    const baseRoutes = ['/', '/pricing', '/login', '/signup', '/tools'];
    baseRoutes.forEach(route => {
      xml += `  <url>\\n    <loc>https://aipdfstudio.com${route}</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n`;
    });

    // Dynamic Tool Routes
    existingConfig.tools.filter(t => t.enabled).forEach(tool => {
        xml += `  <url>\\n    <loc>https://aipdfstudio.com${tool.route}</loc>\\n    <changefreq>daily</changefreq>\\n    <priority>0.9</priority>\\n  </url>\\n`;
    });
    
    xml += '</urlset>';
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch(e) {
    res.status(500).send('Error generating sitemap');
  }
});

// Dynamic Robots.txt
app.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *\\nAllow: /\\nDisallow: /admin/\\nSitemap: https://aipdfstudio.com/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
