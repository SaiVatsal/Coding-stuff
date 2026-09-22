import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed w-full z-50 glass transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="bg-primary-600 p-2 rounded-lg text-white shadow-lg shadow-primary-500/30"
            >
              <FileText size={24} />
            </motion.div>
            <Link to="/" className="font-bold text-xl tracking-tight text-slate-800">
              AI PDF <span className="text-primary-600 font-extrabold">Studio</span>
            </Link>
          </div>
          
          <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
            <Link to="/tools" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Tools</Link>
            <Link to="/pricing" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Pricing</Link>
            <Link to="/faq" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">FAQ</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-primary-600 to-accent-500 text-white px-5 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition-all"
              >
                Sign up free
              </Link>
            </motion.div>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-primary-600 focus:outline-none">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass border-t border-slate-200 shadow-xl"
        >
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/tools" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 rounded-md">Tools</Link>
            <Link to="/pricing" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 rounded-md">Pricing</Link>
            <Link to="/login" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 rounded-md">Log in</Link>
            <Link to="/signup" className="block w-full text-center mt-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-5 py-2 rounded-full font-medium shadow-md">Sign up free</Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
