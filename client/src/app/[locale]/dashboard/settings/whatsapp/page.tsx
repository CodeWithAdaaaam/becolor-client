"use client";
import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, CheckCircle, Smartphone, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl'; // <--- IMPORT

export default function WhatsAppConnectPage() {
  const t = useTranslations('WhatsAppPage'); // <--- HOOK
  const [status, setStatus] = useState<any>({ isConnected: false, qrCode: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/whatsapp/status');
      setStatus(res.data);
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    if(!confirm(t('confirmDisconnect'))) return;
    setLoading(true);
    await axios.post('/whatsapp/logout');
    fetchStatus();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto text-center min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 justify-center text-green-600">
        <Smartphone size={32}/> {t('title')}
      </h1>
      <p className="text-gray-500 mb-8">
        {t('subtitle')}
      </p>

      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 w-full max-w-md">
        
        {loading ? (
            <div className="flex flex-col items-center">
                <RefreshCw className="animate-spin text-gray-400 mb-4" size={32}/>
                <p>{t('loading')}</p>
            </div>
        ) : status.isConnected ? (
            <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="text-green-600" size={40}/>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('connectedTitle')}</h2>
                <p className="text-gray-500 mb-6">{t('connectedDesc')}</p>
                <button 
                    onClick={handleLogout}
                    className="bg-red-50 text-red-600 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-red-100 transition"
                >
                    <LogOut size={18}/> {t('disconnect')}
                </button>
            </div>
        ) : (
            <div className="flex flex-col items-center">
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300 mb-6">
                    {status.qrCode ? (
                        <QRCodeSVG value={status.qrCode} size={256} />
                    ) : (
                        <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                            {t('generating')}
                        </div>
                    )}
                </div>
                
                <ol className="text-left rtl:text-right text-sm text-gray-600 space-y-2 mb-6 bg-blue-50 p-4 rounded-lg dir-ltr">
                    <li>{t('steps.1')}</li>
                    {/* J'ai simplifié le HTML pour éviter les problèmes de rendu, le texte est dans le JSON */}
                    <li>{t('steps.2')}</li>
                    <li>{t('steps.3')}</li>
                    <li>{t('steps.4')}</li>
                </ol>
            </div>
        )}
      </div>
    </div>
  );
}