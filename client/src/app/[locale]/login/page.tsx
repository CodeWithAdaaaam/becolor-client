'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl'; // <--- IMPORT

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('Login'); // <--- HOOK
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      // On affiche le message de l'API s'il existe, sinon le message générique traduit
      setError(err.response?.data?.message || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">be COLOR</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            {/* start-3 permet de placer l'icône à gauche en FR et à droite en AR automatiquement */}
            <Mail className="absolute start-3 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="email" 
              required 
              placeholder={t('emailPlaceholder')}
              // ps-10 (padding-start) laisse la place à l'icône quel que soit le sens de lecture
              className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute start-3 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="password" 
              required 
              placeholder={t('passwordPlaceholder')}
              className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex justify-center items-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 me-2" />
                {t('loading')}
              </>
            ) : (
              t('submit')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}