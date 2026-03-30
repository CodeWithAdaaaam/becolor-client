"use client";
import React, { useState, useEffect } from 'react';
import { statsService } from '@/services/statsService';
import { TrendingUp, TrendingDown, Wallet, Users, Scissors, ShoppingBag, Calendar, Loader2, ArrowRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useTranslations } from 'next-intl'; // <--- IMPORT

const formatPrice = (p: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(p);

export default function StatsPage() {
  const t = useTranslations('StatsPage'); // <--- HOOK
  
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59);
      
      const res = await statsService.getStats(
          new Date(startDate).toISOString(), 
          endDateTime.toISOString()
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper pour traduire les méthodes de paiement (ex: ESPECES -> نقد)
  const translateMethod = (method: string) => {
    // @ts-ignore
    return t.has(`methods.${method}`) ? t(`methods.${method}`) : method;
  };

  if (loading || !data) return (
    <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
      
      {/* HEADER + FILTRE DATE RESPONSIVE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-black"/> {t('title')}
            </h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        
        {/* Sélecteur de date */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <Calendar size={18} className="text-gray-400"/>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="text-sm font-bold bg-transparent focus:outline-none w-full sm:w-auto"
                />
            </div>
            <span className="text-gray-400 text-xs sm:text-sm font-bold">{t('dates.to')}</span>
            <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="text-sm font-bold bg-transparent focus:outline-none w-full sm:w-auto text-right sm:text-left rtl:text-left"
                />
            </div>
            <button onClick={fetchStats} className="bg-black text-white p-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 w-full sm:w-auto flex justify-center shadow-md">
                <ArrowRight size={18} className="rtl:rotate-180"/>
            </button>
        </div>
      </div>

      {/* 1. CHIFFRES CLÉS (CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        
        {/* REVENU GLOBAL */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-s-4 border-green-500 relative overflow-hidden transition hover:shadow-md">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">{t('kpi.revenue')}</p>
                    <h2 className="text-3xl font-bold text-gray-900">{formatPrice(data.global.revenue)}</h2>
                </div>
                <div className="p-2 bg-green-50 rounded-lg text-green-600"><TrendingUp size={24}/></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] sm:text-xs font-medium text-gray-500 z-10 relative">
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100"><Scissors size={12}/> {t('kpi.services')}: {formatPrice(data.details.services)}</span>
                {data.details.products > 0 && <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100"><ShoppingBag size={12}/> {t('kpi.sales')}: {formatPrice(data.details.products)}</span>}
            </div>
        </div>

        {/* DÉPENSES */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-s-4 border-red-500 transition hover:shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">{t('kpi.expenses')}</p>
                    <h2 className="text-3xl font-bold text-gray-900">{formatPrice(data.global.expenses)}</h2>
                </div>
                <div className="p-2 bg-red-50 rounded-lg text-red-600"><TrendingDown size={24}/></div>
            </div>
            <p className="mt-4 text-xs text-gray-400">{t('kpi.expensesDesc')}</p>
        </div>

        {/* BÉNÉFICE NET */}
        <div className="bg-gray-900 text-white p-5 rounded-xl shadow-lg border-s-4 border-blue-500 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('kpi.net')}</p>
                    <h2 className="text-3xl font-bold">{formatPrice(data.global.net)}</h2>
                </div>
                <div className="p-2 bg-gray-800 rounded-lg text-blue-400"><Wallet size={24}/></div>
            </div>
            <p className="mt-4 text-xs text-gray-500">{t('kpi.netDesc')}</p>
        </div>
      </div>

      {/* 2. TABLEAUX DÉTAILLÉS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PERFORMANCE STAFF */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20}/> {t('sections.team')}</h3>
            <div className="space-y-3">
                {data.byStaff.map((staff: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition group">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-50 text-blue-600'}`}>
                                {index + 1}
                            </div>
                            <span className="font-medium text-gray-700 text-sm group-hover:text-black">{staff.name}</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{formatPrice(staff.value)}</span>
                    </div>
                ))}
                {data.byStaff.length === 0 && <p className="text-gray-400 text-sm italic text-center py-4">{t('sections.empty')}</p>}
            </div>
        </div>

        {/* TOP CLIENTS */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🏆 {t('sections.topClients')}</h3>
            <div className="space-y-3">
                {data.byClient.map((client: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400 font-bold text-xs w-4">#{index + 1}</span>
                            <span className="font-medium text-gray-700 text-sm truncate max-w-[150px] sm:max-w-none">{client.name}</span>
                        </div>
                        <span className="font-bold text-green-600 text-sm whitespace-nowrap">{formatPrice(client.value)}</span>
                    </div>
                ))}
                {data.byClient.length === 0 && <p className="text-gray-400 text-sm italic text-center py-4">{t('sections.empty')}</p>}
            </div>
        </div>

        {/* RÉPARTITION PAIEMENT */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4">💳 {t('sections.paymentMethods')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(data.byMethod).map(([method, amount]: any) => (
                    <div key={method} className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 text-center hover:border-gray-300 transition">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{translateMethod(method)}</p>
                        <p className="text-lg font-bold text-gray-800">{formatPrice(amount)}</p>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}