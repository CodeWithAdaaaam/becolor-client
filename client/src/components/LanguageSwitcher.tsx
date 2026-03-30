// src/components/LanguageSwitcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react'; // Assure-toi d'avoir lucide-react installé

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = () => {
    // Si on est en FR, on passe en AR, et inversement
    const newLocale = locale === 'fr' ? 'ar' : 'fr';
    
    // On remplace le segment de langue dans l'URL actuelle
    // Ex: /fr/dashboard -> /ar/dashboard
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    
    router.push(newPath);
  };

  return (
    <button
      onClick={switchLanguage}
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md w-full transition-colors"
    >
      <Globe size={20} />
      <span>
        {locale === 'fr' ? 'العربية' : 'Français'}
      </span>
    </button>
  );
}