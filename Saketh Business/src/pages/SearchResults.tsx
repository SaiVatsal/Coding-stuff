import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductGrid';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SEO } from '../components/common/SEO';
import { nitroDataService } from '../lib/supabase/service';
import { Search } from 'lucide-react';

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const results = useMemo(() => {
    return nitroDataService.getProducts({ search: query });
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SEO
        title={`Search results for "${query}" — Nitro Hub`}
        description={`Explore search results for "${query}" on Nitro Hub.`}
      />

      <Breadcrumbs items={[{ label: `Search: "${query}"` }]} />

      <div className="pb-6 border-b border-luxury-border">
        <div className="flex items-center space-x-2 text-luxury-accent text-xs font-semibold uppercase tracking-widest mb-1">
          <Search className="w-3.5 h-3.5" />
          <span>Search Results</span>
        </div>
        <h1 className="font-serif text-3xl text-luxury-dark">
          Results for <span className="italic font-normal">"{query}"</span>
        </h1>
        <p className="text-xs text-luxury-muted mt-1">
          Found <strong>{results.length}</strong> styles matching your criteria.
        </p>
      </div>

      <ProductGrid products={results} />
    </div>
  );
};
