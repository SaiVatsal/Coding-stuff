import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';

// Stubs for future pages
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ToolSeoPage from './pages/ToolSeoPage';

// Admin Stubs
import AdminToolsPage from './pages/admin/AdminToolsPage';

// Dynamic Tool Imports
import toolConfig from './config/toolConfig.json';
import { loadToolComponent } from './utils/toolLoader';

// Stubs for future pages
const ToolsPage = () => <div className="pt-24 min-h-screen text-center"><h1>Tools Page</h1></div>;

// Global Loading Fallback for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center pt-24 pb-20 bg-slate-50">
     <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);


function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin/tools" element={<AdminToolsPage />} />
                
                {/* Dynamically Loaded Tool Routes */}
                {toolConfig.tools.filter(t => t.enabled).map((tool) => {
                  const ToolComponent = loadToolComponent(tool.componentPath);

                  return (
                    <Route 
                      key={tool.id}
                      path={tool.route} 
                      element={
                        <ToolSeoPage
                          toolName={tool.name}
                          toolRoute={tool.route}
                          description={tool.description}
                          howToSteps={tool.seo.howToSteps}
                          faqs={tool.seo.faqs}
                        >
                          <ToolComponent />
                        </ToolSeoPage>
                      } 
                    />
                  );
                })}
              </Routes>
            </Suspense>
          </main>
        </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
