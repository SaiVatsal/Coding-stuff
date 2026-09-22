import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { SEED_SIZE_CHARTS } from '../../data/seedSizeCharts';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorySlug?: string;
  gender?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  categorySlug = 'women_dresses',
  gender = 'women',
}) => {
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  // Pick appropriate chart
  const chart =
    gender === 'men'
      ? categorySlug.includes('trouser')
        ? SEED_SIZE_CHARTS.men_trousers
        : SEED_SIZE_CHARTS.men_shirts
      : SEED_SIZE_CHARTS.women_dresses;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={chart.name} maxWidth="lg">
      <div className="space-y-6 text-xs text-luxury-text">
        {/* Unit Switcher */}
        <div className="flex items-center justify-between border-b border-luxury-border pb-3">
          <span className="text-[11px] uppercase tracking-widest text-luxury-muted font-semibold">
            Measurements Table
          </span>
          <div className="flex border border-luxury-border">
            <button
              onClick={() => setUnit('in')}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                unit === 'in'
                  ? 'bg-luxury-dark text-white'
                  : 'bg-white text-luxury-muted hover:text-luxury-dark'
              }`}
            >
              Inches
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                unit === 'cm'
                  ? 'bg-luxury-dark text-white'
                  : 'bg-white text-luxury-muted hover:text-luxury-dark'
              }`}
            >
              CM
            </button>
          </div>
        </div>

        {/* Size Chart Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-luxury-border text-left">
            <thead>
              <tr className="bg-luxury-bg-subtle border-b border-luxury-border font-serif text-luxury-dark">
                <th className="p-2.5 border-r border-luxury-border">Size</th>
                {chart.measurements[0].chest_in > 0 && (
                  <th className="p-2.5 border-r border-luxury-border">
                    Chest / Bust ({unit})
                  </th>
                )}
                <th className="p-2.5 border-r border-luxury-border">Waist ({unit})</th>
                <th className="p-2.5 border-r border-luxury-border">Hip ({unit})</th>
                <th className="p-2.5">Garment Length ({unit})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border">
              {chart.measurements.map((row) => (
                <tr key={row.size} className="hover:bg-luxury-bg-subtle/50 transition-colors">
                  <td className="p-2.5 font-semibold text-luxury-dark border-r border-luxury-border">
                    {row.size}
                  </td>
                  {row.chest_in > 0 && (
                    <td className="p-2.5 border-r border-luxury-border">
                      {unit === 'in' ? row.chest_in : row.chest_cm}
                    </td>
                  )}
                  <td className="p-2.5 border-r border-luxury-border">
                    {unit === 'in' ? row.waist_in : row.waist_cm}
                  </td>
                  <td className="p-2.5 border-r border-luxury-border">
                    {unit === 'in' ? row.hip_in : row.hip_cm}
                  </td>
                  <td className="p-2.5">
                    {unit === 'in' ? row.length_in : row.length_cm}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Instructions */}
        <div className="bg-luxury-bg-subtle p-4 border border-luxury-border space-y-2">
          <h4 className="font-serif text-sm font-semibold text-luxury-dark">
            How to Measure For an Ideal Fit
          </h4>
          <ul className="list-disc list-inside space-y-1 text-luxury-muted text-[11px] leading-relaxed">
            <li><strong>Chest/Bust:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
            <li><strong>Waist:</strong> Measure around your natural waistline, typically the narrowest point above your hips.</li>
            <li><strong>Hips:</strong> Stand with feet together and measure around the fullest part of your hips and seat.</li>
            <li><strong>Fit Tip:</strong> Our garments are tailored with relaxed contemporary ease. If you prefer a closer fit, consider sizing down one size.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
