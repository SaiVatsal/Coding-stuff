import React, { useState } from 'react';
import { ProductImage } from '../../types';

export interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const activeImage = images[selectedIndex] || images[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnail Rail */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[600px] flex-shrink-0">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setSelectedIndex(idx)}
              className={`w-16 h-20 md:w-20 md:h-24 bg-luxury-bg-subtle border flex-shrink-0 overflow-hidden transition-all ${
                selectedIndex === idx
                  ? 'border-luxury-dark ring-1 ring-luxury-dark'
                  : 'border-luxury-border opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img.image_url}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image Display with Hover Zoom */}
      <div
        className="relative flex-1 aspect-[3/4] bg-luxury-bg-subtle border border-luxury-border overflow-hidden cursor-crosshair"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={activeImage?.image_url}
          alt={activeImage?.alt_text || productName}
          className={`w-full h-full object-cover transition-transform duration-200 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                }
              : undefined
          }
        />
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider select-none pointer-events-none">
          Hover / Tap to Zoom
        </div>
      </div>
    </div>
  );
};
