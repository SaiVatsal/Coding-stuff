import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  productData?: {
    name: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock';
    rating?: number;
    reviewCount?: number;
  };
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Nitro Hub — Premium Fashion. Better Prices.',
  description = 'Accessible luxury clothing crafted with premium fabrics and impeccable tailoring, without boutique markup.',
  image = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
  url = 'https://nitrohub.in/',
  type = 'website',
  productData,
}) => {
  useEffect(() => {
    // Update document title
    document.title = title.includes('Nitro Hub') ? title : `${title} | Nitro Hub`;

    // Update meta tags
    const metaTags: Record<string, string> = {
      description,
      'og:title': title,
      'og:description': description,
      'og:image': image,
      'og:url': url,
      'og:type': type,
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
    };

    Object.entries(metaTags).forEach(([key, val]) => {
      let element = document.querySelector(`meta[name="${key}"], meta[property="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (key.startsWith('og:')) {
          element.setAttribute('property', key);
        } else {
          element.setAttribute('name', key);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', val);
    });

    // Add JSON-LD Schema if product
    if (productData) {
      const scriptId = 'json-ld-product';
      let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      const schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: productData.name,
        image: [image],
        description: description,
        brand: {
          '@type': 'Brand',
          name: 'Nitro Hub',
        },
        offers: {
          '@type': 'Offer',
          url: window.location.href,
          priceCurrency: productData.currency || 'INR',
          price: productData.price,
          availability: `https://schema.org/${productData.availability || 'InStock'}`,
          seller: {
            '@type': 'Organization',
            name: 'Nitro Hub Apparel Pvt. Ltd.',
          },
        },
        ...(productData.rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: productData.rating,
            reviewCount: productData.reviewCount || 1,
          },
        }),
      };

      scriptTag.text = JSON.stringify(schema);
    }
  }, [title, description, image, url, type, productData]);

  return null;
};
