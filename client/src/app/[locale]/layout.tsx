import { Inter } from "next/font/google";
import "./globals.css"; 
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { ReactNode } from "react";
import BackendActivator from '@/components/BackendActivator';

const inter = Inter({ subsets: ["latin"] });

// --- GÉNÉRATION DYNAMIQUE DES MÉTADONNÉES ---
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
 
  return {
    title: t('title'),
    description: t('description'),
  };
}

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  // Récupération de la locale
  const { locale } = await params;

  // Récupération des messages de traduction
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BackendActivator />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}