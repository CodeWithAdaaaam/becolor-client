"use client";
import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { 
  ArrowUpRight, ArrowDownLeft, Search, Calendar, 
  Wallet, Loader2 
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl'; // <--- IMPORTS

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  payment_method: string;
  created_at: string;
  user?: { prenom: string; nom: string };
  client?: { prenom: string; nom: string };
}

const formatPrice = (p: number) => 
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(p);

export default function HistoryPage() {
  const t = useTranslations('HistoryPage'); // <--- HOOK TRADUCTION
  const locale = useLocale(); // <--- HOOK LOCALE

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/caisse/history');
      setTransactions(res.data);
    } catch (e) {
      console.error("Erreur historique", e);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local
  const filtered = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(search.toLowerCase()) || 
                          t.client?.nom.toLowerCase().includes(search.toLowerCase());
    
    const isIncome = ['REVENU', 'DEPOT', 'ENCAISSEMENT_RDV'].includes(t.type);
    const isExpense = ['DEPENSE', 'RETRAIT'].includes(t.type);

    if (filterType === 'IN') return matchesSearch && isIncome;
    if (filterType === 'OUT') return matchesSearch && isExpense;
    return matchesSearch;
  });

  // Calcul des totaux affichés
  const totalIn = filtered.reduce((acc, t) => ['REVENU', 'DEPOT', 'ENCAISSEMENT_RDV'].includes(t.type) ? acc + Number(t.amount) : acc, 0);
  const totalOut = filtered.reduce((acc, t) => ['DEPENSE', 'RETRAIT'].includes(t.type) ? acc + Number(t.amount) : acc, 0);

  // Helper pour traduire la méthode de paiement
  const translateMethod = (method: string) => {
    // @ts-ignore
    return t.has(`methods.${method}`) ? t(`methods.${method}`) : method;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                <Wallet className="text-black"/> {t('title')}
            </h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        
        {/* Résumé Rapide */}
        <div className="flex gap-4 text-sm font-bold bg-white p-2 rounded-lg border border-gray-200 shadow-sm" dir="ltr">
            {/* Force LTR ici pour garder le + et - du bon côté des chiffres */}
            <span className="text-green-600 flex items-center gap-1"><ArrowUpRight size={16}/> +{formatPrice(totalIn)}</span>
            <span className="text-gray-300">|</span>
            <span className="text-red-600 flex items-center gap-1"><ArrowDownLeft size={16}/> -{formatPrice(totalOut)}</span>
        </div>
      </div>

      {/* BARRE D'OUTILS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                className="w-full ps-10 pe-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                value={search} onChange={e => setSearch(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setFilterType('ALL')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filterType === 'ALL' ? 'bg-black text-white' : 'bg-white border text-gray-600'}`}
            >
                {t('filters.all')}
            </button>
            <button 
                onClick={() => setFilterType('IN')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${filterType === 'IN' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-white border text-gray-600'}`}
            >
                <ArrowUpRight size={16}/> {t('filters.in')}
            </button>
            <button 
                onClick={() => setFilterType('OUT')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1 ${filterType === 'OUT' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-white border text-gray-600'}`}
            >
                <ArrowDownLeft size={16}/> {t('filters.out')}
            </button>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right min-w-[800px]">
                <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                        <th className="p-4 w-48">{t('table.date')}</th>
                        <th className="p-4">{t('table.description')}</th>
                        <th className="p-4">{t('table.author')}</th>
                        <th className="p-4">{t('table.method')}</th>
                        <th className="p-4 text-right rtl:text-left">{t('table.amount')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filtered.map((t_item) => { // renommé t_item pour ne pas confondre avec t()
                        const isExpense = ['DEPENSE', 'RETRAIT'].includes(t_item.type);
                        return (
                            <tr key={t_item.id} className="hover:bg-gray-50 transition group">
                                <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400"/>
                                        {/* Date adaptée à la langue */}
                                        {new Date(t_item.created_at).toLocaleDateString(locale)}
                                        <span className="text-gray-400 text-xs ms-1">
                                            {new Date(t_item.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="font-medium text-gray-900 block">{t_item.description || t('table.noDescription')}</span>
                                    {t_item.client && <span className="text-xs text-gray-500">{t('table.clientPrefix')} {t_item.client.prenom} {t_item.client.nom}</span>}
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {t_item.user ? t_item.user.prenom : '-'}
                                </td>
                                <td className="p-4 text-sm">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase border border-gray-200">
                                        {translateMethod(t_item.payment_method)}
                                    </span>
                                </td>
                                <td className={`p-4 text-right rtl:text-left font-bold text-lg ${isExpense ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                                    {isExpense ? '-' : '+'}{formatPrice(Number(t_item.amount))}
                                </td>
                            </tr>
                        );
                    })}
                    
                    {!loading && filtered.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-gray-400">{t('table.empty')}</td>
                        </tr>
                    )}
                    {loading && (
                        <tr><td colSpan={5} className="p-12 text-center text-gray-400"><Loader2 className="animate-spin mx-auto"/> {t('table.loading')}</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}