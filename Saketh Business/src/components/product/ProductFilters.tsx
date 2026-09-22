import React from 'react';
import { ProductFilters as FilterType, Category } from '../../types';
import { SEED_SIZES, SEED_COLORS } from '../../data/seedProducts';
import { X, Check } from 'lucide-react';

export interface ProductFiltersProps {
  category?: Category;
  filters: FilterType;
  onChange: (newFilters: FilterType) => void;
  onReset: () => void;
  isMobileDrawer?: boolean;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  category,
  filters,
  onChange,
  onReset,
}) => {
  const activeSizes = filters.sizes || [];
  const activeColors = filters.colors || [];

  const handleSizeToggle = (sizeCode: string) => {
    const next = activeSizes.includes(sizeCode)
      ? activeSizes.filter((s) => s !== sizeCode)
      : [...activeSizes, sizeCode];
    onChange({ ...filters, sizes: next });
  };

  const handleColorToggle = (colorName: string) => {
    const next = activeColors.includes(colorName)
      ? activeColors.filter((c) => c !== colorName)
      : [...activeColors, colorName];
    onChange({ ...filters, colors: next });
  };

  const hasActiveFilters =
    Boolean(filters.subcategory) ||
    activeSizes.length > 0 ||
    activeColors.length > 0 ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.inStockOnly);

  return (
    <div className="space-y-6 text-xs text-luxury-text">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between pb-3 border-b border-luxury-border">
        <span className="font-serif text-sm font-semibold uppercase tracking-wider text-luxury-dark">
          Refine Results
        </span>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-[11px] text-luxury-accent hover:underline font-medium flex items-center"
          >
            <X className="w-3 h-3 mr-1" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Subcategories (if category provided) */}
      {category && category.subcategories && category.subcategories.length > 0 && (
        <div className="space-y-2 pb-5 border-b border-luxury-border/60">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-luxury-muted">
            Subcategory
          </label>
          <div className="space-y-1.5">
            <button
              onClick={() => onChange({ ...filters, subcategory: undefined })}
              className={`w-full text-left py-1 text-xs transition-colors flex items-center justify-between ${
                !filters.subcategory ? 'font-semibold text-luxury-accent' : 'text-luxury-text hover:text-luxury-dark'
              }`}
            >
              <span>All {category.name}</span>
              {!filters.subcategory && <Check className="w-3 h-3 text-luxury-accent" />}
            </button>
            {category.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onChange({ ...filters, subcategory: sub.slug })}
                className={`w-full text-left py-1 text-xs transition-colors flex items-center justify-between ${
                  filters.subcategory === sub.slug ? 'font-semibold text-luxury-accent' : 'text-luxury-text hover:text-luxury-dark'
                }`}
              >
                <span>{sub.name}</span>
                {filters.subcategory === sub.slug && <Check className="w-3 h-3 text-luxury-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      <div className="space-y-2 pb-5 border-b border-luxury-border/60">
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-luxury-muted">
          Size
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.values(SEED_SIZES).map((size) => {
            const isSelected = activeSizes.includes(size.code);
            return (
              <button
                key={size.id}
                onClick={() => handleSizeToggle(size.code)}
                className={`py-2 px-1 text-[11px] font-medium border text-center uppercase tracking-wider transition-colors ${
                  isSelected
                    ? 'border-luxury-dark bg-luxury-dark text-white'
                    : 'border-luxury-border bg-white text-luxury-text hover:border-luxury-dark'
                }`}
              >
                {size.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors Swatches */}
      <div className="space-y-2 pb-5 border-b border-luxury-border/60">
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-luxury-muted">
          Color Palette
        </label>
        <div className="space-y-1.5">
          {Object.values(SEED_COLORS).map((color) => {
            const isSelected = activeColors.includes(color.name);
            return (
              <button
                key={color.id}
                onClick={() => handleColorToggle(color.name)}
                className="w-full flex items-center justify-between py-1 text-xs text-luxury-text hover:text-luxury-dark transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-none border border-luxury-border flex-shrink-0"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <span className={isSelected ? 'font-semibold text-luxury-dark' : ''}>{color.name}</span>
                </div>
                {isSelected && <Check className="w-3 h-3 text-luxury-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2 pb-5 border-b border-luxury-border/60">
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-luxury-muted">
          Price Range (₹)
        </label>
        <div className="space-y-1.5">
          {[
            { label: 'All Prices', min: undefined, max: undefined },
            { label: 'Under ₹999', min: 0, max: 999 },
            { label: '₹1,000 - ₹1,499', min: 1000, max: 1499 },
            { label: '₹1,500 - ₹2,499', min: 1500, max: 2499 },
            { label: '₹2,500 & Above', min: 2500, max: 10000 },
          ].map((priceTier, idx) => {
            const isSelected =
              filters.minPrice === priceTier.min && filters.maxPrice === priceTier.max;
            return (
              <button
                key={idx}
                onClick={() =>
                  onChange({
                    ...filters,
                    minPrice: priceTier.min,
                    maxPrice: priceTier.max,
                  })
                }
                className={`w-full text-left py-1 text-xs transition-colors flex items-center justify-between ${
                  isSelected ? 'font-semibold text-luxury-accent' : 'text-luxury-text hover:text-luxury-dark'
                }`}
              >
                <span>{priceTier.label}</span>
                {isSelected && <Check className="w-3 h-3 text-luxury-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* In-Stock Only Toggle */}
      <div className="pt-1">
        <label className="flex items-center space-x-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.inStockOnly)}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="w-4 h-4 rounded-none border-luxury-border text-luxury-dark focus:ring-luxury-dark"
          />
          <span className="text-xs font-medium text-luxury-dark">In-Stock Only</span>
        </label>
      </div>
    </div>
  );
};
