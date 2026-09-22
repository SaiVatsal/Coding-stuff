import { lazy } from 'react';

// Maps component paths from toolConfig.json to actual lazy imports 
// Note: Vite requires dynamic imports to have some static hint of the path,
// so we use a switch map or import.meta.glob for broader matches.

export const loadToolComponent = (componentPath: string) => {
  // Pre-configured static pages
  if (componentPath === 'pages/ImageToPdfPage') {
    return lazy(() => import('../pages/ImageToPdfPage'));
  }

  // AI-Generated dynamic pages (they will be written to pages/generated/)
  return lazy(() => import(`../pages/generated/${componentPath.replace('pages/generated/', '')}.tsx`));
};
