"use client";
import React, { useState, useEffect, useCallback } from 'react'; // Ajout de useCallback
import axios from '@/lib/axios';
import { Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function AppointmentListPage() {
  const t = useTranslations('AppointmentsPage');
  const locale = useLocale();
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Filtres
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  // Utilisation de useCallback pour éviter les avertissements de dépendances
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/appointments/list', {
        params: { page, limit: 15, search, status }
      });
      setAppointments(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchAppointments();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  const getStatusBadge = (statut: string) => {
    const label = ['CONFIRME', 'TERMINE', 'ANNULE', 'EN_COURS'].includes(statut) 
        ? t(`filterStatus.${statut}`) 
        : statut;

    switch (statut) {
      case 'CONFIRME': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">{label}</span>;
      case 'TERMINE': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">{label}</span>;
      case 'ANNULE': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">{label}</span>;
      case 'EN_COURS': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">{label}</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">{label}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar /> {t('title')}
            </h1>
            <p className="text-gray-500 text-sm">{t('subtitle')}</p>
        </div>
        
        {/* BARRE DE RECHERCHE & FILTRE */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')}
                    className="ps-10 pe-4 py-2 border rounded-lg w-full md:w-64 focus:ring-2 focus:ring-black focus:outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            
            <select 
                className="p-2 border rounded-lg bg-white"
                value={status}
                onChange={e => setStatus(e.target.value)}
            >
                <option value="ALL">{t('filterStatus.all')}</option>
                <option value="CONFIRME">{t('filterStatus.CONFIRME')}</option>
                <option value="TERMINE">{t('filterStatus.TERMINE')}</option>
                <option value="ANNULE">{t('filterStatus.ANNULE')}</option>
            </select>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left rtl:text-right">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                    <tr>
                        <th className="p-4">{t('table.date')}</th>
                        <th className="p-4">{t('table.client')}</th>
                        <th className="p-4">{t('table.service')}</th>
                        <th className="p-4">{t('table.staff')}</th>
                        <th className="p-4">{t('table.price')}</th>
                        <th className="p-4">{t('table.status')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {appointments.map((rdv) => (
                        <tr key={rdv.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 whitespace-nowrap">
                                <div className="font-bold text-gray-800">
                                    {new Date(rdv.heure_debut).toLocaleDateString(locale)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(rdv.heure_debut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="font-medium text-gray-900">{rdv.client.prenom} {rdv.client.nom}</div>
                                <div className="text-xs text-gray-500 rtl:text-right" dir="ltr">{rdv.client.tel_principal}</div>
                            </td>
                            
                            {/* --- CORRECTION ICI (Multi-Prestations) --- */}
                            <td className="p-4">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {rdv.services && rdv.services.length > 0 ? (
                                        rdv.services.map((s: any) => (
                                            <span key={s.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                                                {s.nom}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 italic">-</span>
                                    )}
                                </div>
                            </td>
                            {/* ------------------------------------------ */}

                            <td className="p-4 text-sm text-gray-600">
                                {rdv.user ? (
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: rdv.user.color || '#000'}}></div>
                                        {rdv.user.prenom}
                                    </span>
                                ) : <span className="text-gray-400 italic">{t('table.unassigned')}</span>}
                            </td>
                            <td className="p-4 font-bold text-gray-900">
                                {rdv.prix} Dhs
                            </td>
                            <td className="p-4">
                                {getStatusBadge(rdv.statut)}
                            </td>
                        </tr>
                    ))}
                    {!loading && appointments.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-400">{t('table.empty')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
            <span className="text-sm text-gray-500">
                {t('pagination', {current: page, total: totalPages})}
            </span>
            <div className="flex gap-2">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 rtl:rotate-180"
                >
                    <ChevronLeft size={16}/>
                </button>
                <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 rtl:rotate-180"
                >
                    <ChevronRight size={16}/>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}