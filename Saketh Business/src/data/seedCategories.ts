import { Category, Subcategory } from '../types';

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-women',
    name: 'Women',
    slug: 'women',
    description: 'Effortless silhouettes, handpicked fabrics, and contemporary Indian tailoring.',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    gender: 'women',
    display_order: 1,
    is_active: true,
    subcategories: [
      { id: 'sub-w-dresses', category_id: 'cat-women', name: 'Dresses', slug: 'dresses', is_active: true },
      { id: 'sub-w-kurtis', category_id: 'cat-women', name: 'Kurtis & Tunics', slug: 'kurtis', is_active: true },
      { id: 'sub-w-coords', category_id: 'cat-women', name: 'Co-ord Sets', slug: 'co-ord-sets', is_active: true },
      { id: 'sub-w-shirts', category_id: 'cat-women', name: 'Oversized Shirts', slug: 'shirts', is_active: true },
      { id: 'sub-w-anarkali', category_id: 'cat-women', name: 'Festive & Anarkali', slug: 'festive', is_active: true },
    ],
  },
  {
    id: 'cat-men',
    name: 'Men',
    slug: 'men',
    description: 'Clean architectural cuts, breathable linen, and timeless casual luxury.',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    gender: 'men',
    display_order: 2,
    is_active: true,
    subcategories: [
      { id: 'sub-m-shirts', category_id: 'cat-men', name: 'Linen & Cotton Shirts', slug: 'shirts', is_active: true },
      { id: 'sub-m-tees', category_id: 'cat-men', name: 'Oversized T-Shirts', slug: 't-shirts', is_active: true },
      { id: 'sub-m-polos', category_id: 'cat-men', name: 'Knit & Casual Polos', slug: 'polos', is_active: true },
      { id: 'sub-m-trousers', category_id: 'cat-men', name: 'Pleated & Straight Trousers', slug: 'trousers', is_active: true },
    ],
  },
  {
    id: 'cat-collections',
    name: 'Collections',
    slug: 'collections',
    description: 'Curated seasonal capsules designed for modern everyday elevation.',
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
    gender: 'unisex',
    display_order: 3,
    is_active: true,
    subcategories: [
      { id: 'sub-c-summer-linen', category_id: 'cat-collections', name: 'The Linen Edit', slug: 'the-linen-edit', is_active: true },
      { id: 'sub-c-monochrome', category_id: 'cat-collections', name: 'Monochrome Capsule', slug: 'monochrome', is_active: true },
      { id: 'sub-c-festive', category_id: 'cat-collections', name: 'Festive Occasion', slug: 'festive-occasion', is_active: true },
    ],
  },
];
