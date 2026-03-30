'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/axios';

export default function BackendActivator() {
  const pathname = usePathname();

  // Fonction de réveil (Ping)
  const wakeUp = async () => {
    try {
      // On utilise axios ou fetch vers ton backend
      await api.get('/ping'); 
      console.log("📡 [Activator] Backend réveillé.");
    } catch (e) {
      // On ne log pas d'erreur pour rester discret
    }
  };

  // EFFET 1 : Intervalle de 10 minutes (Background)
  useEffect(() => {
    const timer = setInterval(wakeUp, 600000); // 10 minutes
    return () => clearInterval(timer);
  }, []);

  // EFFET 2 : Déclenchement sur pages critiques
  useEffect(() => {
    // Liste des pages qui doivent "forcer" le réveil immédiat
    // On vérifie si l'URL contient 'login' ou 'booking'
    const criticalPages = ['login', 'booking'];
    const isCritical = criticalPages.some(page => pathname.includes(page));

    if (isCritical) {
      console.log(`🚀 [Activator] Page critique détectée (${pathname}), réveil forcé...`);
      wakeUp();
    }
  }, [pathname]); // Se déclenche à chaque changement de page

  return null; // Ce composant ne dessine rien à l'écran
}