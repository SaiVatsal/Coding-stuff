import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="py-3 text-xs">
      <ol className="flex items-center space-x-2 text-luxury-muted">
        <li>
          <Link to="/" className="hover:text-luxury-dark transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight className="w-3.5 h-3.5 text-luxury-border-dark" />
              {isLast || !item.href ? (
                <span className="text-luxury-dark font-medium truncate max-w-[200px] md:max-w-none">
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="hover:text-luxury-dark transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
