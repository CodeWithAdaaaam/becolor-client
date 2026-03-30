// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Liste des locales supportées
  locales: ['fr', 'ar'],
  
  // Locale par défaut
  defaultLocale: 'fr',
  
  // Redirection automatique
  localePrefix: 'always' // ou 'as-needed'
});

export const config = {
  // Matcher pour intercepter toutes les routes sauf les fichiers statiques
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};