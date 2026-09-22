import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types';
import { ArrowRight } from 'lucide-react';

interface MegaMenuProps {
  category: Category;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ category, onClose }) => {
  return (
    <div
      className="absolute top-full left-0 w-full bg-white border-b border-luxury-border shadow-lift py-8 px-12 z-40 animate-fade-in"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        {/* Category Description & Featured Link */}
        <div className="col-span-3 border-r border-luxury-border pr-6">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-luxury-accent">
            Collection
          </span>
          <h3 className="font-serif text-2xl text-luxury-dark mt-1 mb-2">
            {category.name}
          </h3>
          <p className="text-xs text-luxury-muted leading-relaxed mb-4">
            {category.description}
          </p>
          <Link
            to={`/${category.slug}`}
            onClick={onClose}
            className="inline-flex items-center text-xs font-semibold text-luxury-dark hover:text-luxury-accent uppercase tracking-wider transition-colors group"
          >
            <span>Explore All {category.name}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Subcategories */}
        <div className="col-span-5 grid grid-cols-2 gap-6 pl-4">
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-3">
              Categories
            </h4>
            <ul className="space-y-2.5">
              {category.subcategories?.map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={`/${category.slug}?sub=${sub.slug}`}
                    onClick={onClose}
                    className="text-xs text-luxury-text hover:text-luxury-accent transition-colors block py-0.5"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-3">
              Trending Edits
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to={`/${category.slug}?filter=bestsellers`}
                  onClick={onClose}
                  className="text-xs text-luxury-text hover:text-luxury-accent transition-colors block py-0.5"
                >
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link
                  to={`/${category.slug}?filter=new`}
                  onClick={onClose}
                  className="text-xs text-luxury-text hover:text-luxury-accent transition-colors block py-0.5"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  to={`/sale?gender=${category.gender}`}
                  onClick={onClose}
                  className="text-xs text-luxury-accent font-medium hover:underline block py-0.5"
                >
                  Seasonal Sale (Up to 50% Off)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Featured Lookbook Card */}
        <div className="col-span-4 pl-4">
          <Link
            to={`/${category.slug}`}
            onClick={onClose}
            className="group block relative overflow-hidden h-48 border border-luxury-border"
          >
            <img
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[10px] uppercase tracking-widest text-luxury-bg-subtle">
                Editorial Lookbook
              </span>
              <h4 className="font-serif text-lg text-white font-medium">
                The New Season Edit
              </h4>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
