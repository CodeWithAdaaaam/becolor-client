import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

const locales = ['fr', 'ar'];

export default getRequestConfig(async ({requestLocale}) => {
  // On attend que la locale soit résolue
  let locale = await requestLocale;

  // Sécurité : si undefined ou inconnue, on arrête tout
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }

  return {
    // AJOUTE CETTE LIGNE ICI ! 👇
    locale: locale, 
    
    // Tes messages (le chemin ../messages est le bon)
    messages: (await import(`../messages/${locale}.json`)).default
  };
});