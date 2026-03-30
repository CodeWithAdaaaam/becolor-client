"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; // <--- AJOUT ROUTER
import axios from '@/lib/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign, Clock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false); // <--- ÉTAT DE SÉCURITÉ

  const formatPrice = (price: number) => 
    new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', { 
        style: 'currency', 
        currency: 'MAD' 
    }).format(price || 0);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      // 1. VÉRIFICATION DU RÔLE
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const userRoles = user.roles || (user.role ? [user.role] : []);

      // Si l'utilisateur n'est pas Admin, on le dégage vers l'agenda
      if (!userRoles.includes('SUPERADMIN')) {
        router.replace(`/${params.locale || 'fr'}/dashboard/agenda`);
        return;
      }

      // Si c'est un admin, on autorise l'affichage et on charge les stats
      setIsAuthorized(true);
      
      try {
        const res = await axios.get('/stats/dashboard');
        setStats(res.data);
      } catch (e) { 
        console.error("Erreur chargement dashboard", e);
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetch();
  }, [router, params.locale]);

  // Écran de chargement ou transition
  if (!isAuthorized || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-center text-red-500">Erreur de chargement.</div>;

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      
      {/* 1. EN-TÊTE RESPONSIVE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 text-xs md:text-sm">{t('subtitle')}</p>
        </div>
        <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 w-full sm:w-auto text-left sm:text-right rtl:text-right">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">{t('today')}</p>
            <p className="text-sm md:text-xl font-bold text-gray-800 capitalize">
                {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>
      </div>

      {/* 2. CARTES KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-black text-white p-5 rounded-2xl shadow-lg flex items-center justify-between transition hover:scale-[1.02]">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('kpi.dailyRevenue')}</p>
                <h3 className="text-2xl md:text-3xl font-bold">{formatPrice(stats.dailyRevenue)}</h3>
            </div>
            <div className="bg-gray-800 p-3 rounded-full text-green-400"><DollarSign size={24}/></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition hover:scale-[1.02]">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('kpi.monthlyRevenue')}</p>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{formatPrice(stats.monthlyRevenue)}</h3>
            </div>
            <div className="bg-green-50 text-green-600 p-3 rounded-full"><TrendingUp size={24}/></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('kpi.dailyCount')}</p>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{stats.dailyCount}</h3>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-full"><Users size={24}/></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* 3. GRAPHIQUE */}
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-sm md:text-base">
                <TrendingUp size={18} className="text-gray-400"/> {t('charts.evolution')}
            </h3>
            <div className="h-60 md:h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData || []}>
                        <defs>
                            <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#000000" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} interval={0}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} width={40}/>
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number) => [`${value} MAD`, t('charts.ca')]}
                        />
                        <Area type="monotone" dataKey="ca" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorCa)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 4. TOP SERVICES */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-sm md:text-base">
                🔥 {t('charts.topServices')}
            </h3>
            <div className="space-y-3">
                {(stats.topServices || []).map((srv: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className="bg-gray-100 text-gray-600 min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold group-hover:bg-black group-hover:text-white transition">#{i+1}</span>
                            <div className="truncate">
                                <p className="font-medium text-sm text-gray-800 truncate">{srv.name}</p>
                                <p className="text-xs text-gray-400">{srv.count} {t('charts.sales')}</p>
                            </div>
                        </div>
                        <span className="font-bold text-sm text-gray-900 whitespace-nowrap">{srv.ca} Dhs</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 5. PROCHAINS RDV */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                <Clock size={20} className="text-blue-500"/> {t('upcoming.title')}
            </h3>
            <Link href="/dashboard/agenda" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                {t('upcoming.viewAgenda')} <ArrowRight size={14} className="rtl:rotate-180"/>
            </Link>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm min-w-[600px]">
                <thead className="text-gray-400 uppercase text-xs border-b font-medium bg-gray-50">
                    <tr>
                        <th className="px-4 md:px-6 py-3">{t('upcoming.table.time')}</th>
                        <th className="px-4 md:px-6 py-3">{t('upcoming.table.client')}</th>
                        <th className="px-4 md:px-6 py-3">{t('upcoming.table.service')}</th>
                        <th className="px-4 md:px-6 py-3">{t('upcoming.table.staff')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {(stats.upcoming || []).map((apt: any) => (
                        <tr key={apt.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 md:px-6 py-4 font-bold text-blue-600">
                                {new Date(apt.heure_debut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-4 md:px-6 py-4 font-medium text-gray-900">{apt.client.prenom} {apt.client.nom}</td>
                            <td className="px-4 md:px-6 py-4">
                                {/* ✅ AFFICHAGE MULTI-SERVICES JOINT PAR UNE VIRGULE */}
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                                    {apt.services?.map((s: any) => s.nom).join(', ') || apt.service?.nom}
                                </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 text-gray-500">{apt.user ? apt.user.prenom : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {(!stats.upcoming || stats.upcoming.length === 0) && (
                <div className="p-8 text-center text-gray-400 italic">{t('upcoming.empty')}</div>
            )}
        </div>
      </div>
    </div>
  );
}