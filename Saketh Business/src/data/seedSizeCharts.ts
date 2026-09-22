import { SizeChart } from '../types';

export const SEED_SIZE_CHARTS: Record<string, SizeChart> = {
  women_dresses: {
    id: 'sc-women-dresses',
    name: "Women's Dresses & Kurtis Size Guide",
    category_id: 'cat-women',
    measurements: [
      { size: 'XS', chest_in: 32, chest_cm: 81, waist_in: 26, waist_cm: 66, hip_in: 36, hip_cm: 91, length_in: 44, length_cm: 112 },
      { size: 'S', chest_in: 34, chest_cm: 86, waist_in: 28, waist_cm: 71, hip_in: 38, hip_cm: 96, length_in: 45, length_cm: 114 },
      { size: 'M', chest_in: 36, chest_cm: 91, waist_in: 30, waist_cm: 76, hip_in: 40, hip_cm: 101, length_in: 46, length_cm: 117 },
      { size: 'L', chest_in: 38, chest_cm: 96, waist_in: 32, waist_cm: 81, hip_in: 42, hip_cm: 107, length_in: 47, length_cm: 119 },
      { size: 'XL', chest_in: 40, chest_cm: 102, waist_in: 34, waist_cm: 86, hip_in: 44, hip_cm: 112, length_in: 48, length_cm: 122 },
      { size: 'XXL', chest_in: 42, chest_cm: 107, waist_in: 36, waist_cm: 91, hip_in: 46, hip_cm: 117, length_in: 49, length_cm: 124 },
    ],
  },
  men_shirts: {
    id: 'sc-men-shirts',
    name: "Men's Shirts & Tops Size Guide",
    category_id: 'cat-men',
    measurements: [
      { size: 'S', chest_in: 38, chest_cm: 96, waist_in: 32, waist_cm: 81, hip_in: 38, hip_cm: 96, length_in: 28, length_cm: 71 },
      { size: 'M', chest_in: 40, chest_cm: 102, waist_in: 34, waist_cm: 86, hip_in: 40, hip_cm: 101, length_in: 29, length_cm: 74 },
      { size: 'L', chest_in: 42, chest_cm: 107, waist_in: 36, waist_cm: 91, hip_in: 42, hip_cm: 107, length_in: 30, length_cm: 76 },
      { size: 'XL', chest_in: 44, chest_cm: 112, waist_in: 38, waist_cm: 96, hip_in: 44, hip_cm: 112, length_in: 31, length_cm: 79 },
      { size: 'XXL', chest_in: 46, chest_cm: 117, waist_in: 40, waist_cm: 102, hip_in: 46, hip_cm: 117, length_in: 32, length_cm: 81 },
    ],
  },
  men_trousers: {
    id: 'sc-men-trousers',
    name: "Men's Trousers Size Guide",
    category_id: 'cat-men',
    measurements: [
      { size: '30', chest_in: 0, chest_cm: 0, waist_in: 30, waist_cm: 76, hip_in: 38, hip_cm: 96, length_in: 40, length_cm: 101 },
      { size: '32', chest_in: 0, chest_cm: 0, waist_in: 32, waist_cm: 81, hip_in: 40, hip_cm: 101, length_in: 41, length_cm: 104 },
      { size: '34', chest_in: 0, chest_cm: 0, waist_in: 34, waist_cm: 86, hip_in: 42, hip_cm: 107, length_in: 42, length_cm: 107 },
      { size: '36', chest_in: 0, chest_cm: 0, waist_in: 36, waist_cm: 91, hip_in: 44, hip_cm: 112, length_in: 42, length_cm: 107 },
      { size: '38', chest_in: 0, chest_cm: 0, waist_in: 38, waist_cm: 96, hip_in: 46, hip_cm: 117, length_in: 43, length_cm: 109 },
    ],
  },
};
