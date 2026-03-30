import { redirect } from 'next/navigation';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  // On récupère la locale
  const { locale } = await params;
  
  // On redirige vers la page de login
  redirect(`/${locale}/login`);
}