import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  route: string;
  type?: string;
  imageUrl?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ 
  title, 
  description, 
  route, 
  type = 'website',
  imageUrl = 'https://aipdfstudio.com/og-image.jpg' // Default OG image
}) => {
  const siteUrl = 'https://aipdfstudio.com';
  const fullUrl = `${siteUrl}${route}`;
  const fullTitle = `${title} | AI PDF Studio`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": fullTitle,
    "description": description,
    "url": fullUrl,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All"
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
      
      {/* Schema.org Markup */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEOHead;
