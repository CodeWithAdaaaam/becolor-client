// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Tes locales
  locales: ['fr', 'ar'],
  
  // Locale par défaut
  defaultLocale: 'fr',
  
  // (Optionnel) Pour éviter de dupliquer /fr/fr/
  localePrefix: 'always'
});

export const config = {
  // LE PLUS IMPORTANT : Ce matcher ignore les dossiers internes de Next.js
  // Il laisse passer les images, le CSS, les fichiers _next, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};