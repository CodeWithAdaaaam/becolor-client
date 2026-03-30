'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, Info, Save, Power, User, Smartphone, CheckCircle, XCircle, ChevronRight, Scissors } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import api from '@/lib/axios';
import { useTranslations } from 'next-intl';

// --- CONFIGURATION CONSTANTE ---
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface Schedule {
  id?: number; 
  day: number; 
  isOpen: boolean;
  morningOpen: string; 
  morningClose: string;
  afternoonOpen: string; 
  afternoonClose: string;
}

interface UserSchedule {
    id?: number; day: number; startTime: string; endTime: string; isWorking: boolean;
}

// ============================================================================
// 1. ONGLET : MON PLANNING (Personnel)
// ============================================================================
function MyPlanningTab() {
    const t = useTranslations('SettingsPage.planning');
    const t_days = useTranslations('Days');
    const t_global = useTranslations('SettingsPage');
    
    const [schedule, setSchedule] = useState<UserSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const user = storedUser ? JSON.parse(storedUser) : null;
                if (!user) return;
                setCurrentUser(user);

                const res = await api.get(`/users/${user.id}/schedule`);
                let mySchedule = res.data;
                if (mySchedule.length === 0) {
                    mySchedule = [0, 1, 2, 3, 4, 5, 6].map(d => ({
                        day: d, startTime: '10:00', endTime: '20:00', isWorking: d !== 0 
                    }));
                }
                setSchedule(mySchedule);
            } catch (e) {
                console.error("Erreur chargement planning", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleChange = (dayIndex: number, field: string, value: any) => {
        setSchedule(prev => prev.map(s => s.day === dayIndex ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        if (!currentUser) return;
        try {
            await api.post(`/users/${currentUser.id}/schedule`, schedule);
            alert(t('success'));
        } catch (error) {
            alert(t('error'));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">{t_global('loading')}</div>;

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                        <User className="text-blue-600"/> {t('title')}
                    </h2>
                    <p className="text-sm text-gray-500">{t('subtitle')}</p>
                </div>
                <button onClick={handleSave} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 font-bold shadow-sm transition active:scale-95">
                    <Save size={18}/> {t('save')}
                </button>
            </div>

            <div className="space-y-3">
                {DISPLAY_ORDER.map((dayIndex) => {
                    const dayData = schedule.find(s => s.day === dayIndex);
                    if (!dayData) return null;
                    
                    return (
                        <div key={dayIndex} className={`p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between border transition ${dayData.isWorking ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-4 w-full sm:w-1/3 mb-3 sm:mb-0">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={dayData.isWorking} onChange={e => handleChange(dayIndex, 'isWorking', e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                                <span className={`font-bold ${dayData.isWorking ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                    {t_days(`${dayIndex}`)}
                                </span>
                            </div>

                            {dayData.isWorking ? (
                                <div className="flex items-center gap-2 w-full sm:w-auto" dir="ltr">
                                    <input type="time" value={dayData.startTime} onChange={e => handleChange(dayIndex, 'startTime', e.target.value)} className="flex-1 sm:flex-none p-2 border rounded-lg bg-white text-sm font-bold text-center"/>
                                    <span className="text-gray-400 font-bold">-</span>
                                    <input type="time" value={dayData.endTime} onChange={e => handleChange(dayIndex, 'endTime', e.target.value)} className="flex-1 sm:flex-none p-2 border rounded-lg bg-white text-sm font-bold text-center"/>
                                </div>
                            ) : (
                                <span className="text-xs font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full">{t('rest')}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// 2. ONGLET : WHATSAPP
// ============================================================================
function WhatsAppTab() {
    const t = useTranslations('SettingsPage.whatsapp');
    const t_global = useTranslations('SettingsPage');
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/whatsapp/status')
           .then(res => setStatus(res.data))
           .catch(() => setStatus(null))
           .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-6 text-center text-gray-500">{t_global('loading')}</div>;
    const isConnected = status && status.isConnected;

    return (
        <div className={`p-6 rounded-xl shadow-sm border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                        <Smartphone className={isConnected ? "text-green-600" : "text-gray-400"}/> 
                        {t('title')}
                    </h2>
                    <p className="text-sm text-gray-600 mt-2">{t('subtitle')}</p>
                </div>
                <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {isConnected ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                        {isConnected ? t('connected') : t('disconnected')}
                    </div>
                    <Link href="/dashboard/settings/whatsapp" className="w-full">
                        <button className="w-full bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg">
                            {isConnected ? t('manage') : t('scan')} <ChevronRight size={16} className="rtl:rotate-180"/>
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// 3. ONGLET : HORAIRES MAGASIN (Double Session corrigée)
// ============================================================================
function HorairesTab() {
    const t = useTranslations('SettingsPage.hours');
    const t_days = useTranslations('Days');
    const t_global = useTranslations('SettingsPage');
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      api.get<Schedule[]>('/settings/hours')
         .then(res => setSchedules(res.data))
         .catch(console.error)
         .finally(() => setIsLoading(false));
    }, []);
  
    const handleChange = (dayIndex: number, field: keyof Schedule, value: string | boolean) => {
      setSchedules(prev => prev.map(s => s.day === dayIndex ? { ...s, [field]: value } : s));
    };
  
    const handleSave = async () => {
      try { 
        await api.put('/settings/hours', schedules); 
        alert(t('success')); 
      } catch (err) { alert(t('error')); }
    };
    
    if (isLoading) return <div className="p-6 text-center">{t_global('loading')}</div>;
  
    return (
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900"><Clock size={20}/> {t('title')}</h2>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <button onClick={handleSave} className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-gray-800 transition-all shadow-md">
            <Save size={18}/> {t('save')}
          </button>
        </div>

        <div className="space-y-4">
          {DISPLAY_ORDER.map((dayIndex) => {
            const schedule = schedules.find(s => s.day === dayIndex);
            if (!schedule) return null;
            return (
              <div key={dayIndex} className={`p-4 rounded-xl border transition-all ${schedule.isOpen ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <div className="flex items-center justify-between mb-4">
                    <span className={`font-bold text-base ${schedule.isOpen ? 'text-black' : 'text-gray-400'}`}>{t_days(`${dayIndex}`)}</span>
                    <button onClick={() => handleChange(dayIndex, 'isOpen', !schedule.isOpen)} className={`relative h-6 w-11 rounded-full transition-colors ${schedule.isOpen ? 'bg-black' : 'bg-gray-300'}`}>
                        <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${schedule.isOpen ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                {schedule.isOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="ltr">
                        {/* Session 1 : Matin */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Session 1 (Ouverture - Pause)</label>
                            <div className="flex items-center gap-2">
                                <input type="time" value={schedule.morningOpen || '10:00'} onChange={e => handleChange(dayIndex, 'morningOpen', e.target.value)} className="flex-1 p-2 border rounded-lg bg-white text-center font-bold focus:ring-2 focus:ring-black outline-none" />
                                <span className="text-gray-300">-</span>
                                <input type="time" value={schedule.morningClose || '13:00'} onChange={e => handleChange(dayIndex, 'morningClose', e.target.value)} className="flex-1 p-2 border rounded-lg bg-white text-center font-bold focus:ring-2 focus:ring-black outline-none" />
                            </div>
                        </div>
                        {/* Session 2 : Après-midi */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Session 2 (Reprise - Fermeture)</label>
                            <div className="flex items-center gap-2">
                                <input type="time" value={schedule.afternoonOpen || '14:00'} onChange={e => handleChange(dayIndex, 'afternoonOpen', e.target.value)} className="flex-1 p-2 border rounded-lg bg-white text-center font-bold focus:ring-2 focus:ring-black outline-none" />
                                <span className="text-gray-300">-</span>
                                <input type="time" value={schedule.afternoonClose || '20:00'} onChange={e => handleChange(dayIndex, 'afternoonClose', e.target.value)} className="flex-1 p-2 border rounded-lg bg-white text-center font-bold focus:ring-2 focus:ring-black outline-none" />
                            </div>
                        </div>
                    </div>
                )}
                {!schedule.isOpen && <div className="text-sm font-bold text-gray-400 italic">Magasin fermé</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
}

// ============================================================================
// 4. ONGLET : RÉSERVATIONS EN LIGNE
// ============================================================================
function BookingStatusTab() {
    const t = useTranslations('SettingsPage.booking');
    const [isActive, setIsActive] = useState(true);
    useEffect(() => {
        api.get('/settings/onlineBookingActive').then(res => setIsActive((res.data as any).active)).catch(() => setIsActive(true));
    }, []);
    const handleToggle = async () => {
        const newStatus = !isActive;
        setIsActive(newStatus);
        try { await api.put('/settings/onlineBookingActive', { active: newStatus }); } catch (e) { setIsActive(!newStatus); }
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4">{t('title')}</h2>
            <div className={`p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 ${isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                <div>
                    <p className={`font-bold text-lg ${isActive ? 'text-green-700' : 'text-red-700'}`}>{isActive ? t('active') : t('inactive')}</p>
                    <p className="text-sm text-gray-600">{isActive ? t('activeDesc') : t('inactiveDesc')}</p>
                </div>
                <button onClick={handleToggle} className={`w-14 h-8 rounded-full p-1 transition-colors ${isActive ? 'bg-green-600' : 'bg-red-600'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'} rtl:${isActive ? '-translate-x-6' : '-translate-x-0'}`} />
                </button>
            </div>
        </div>
    );
}

function GeneralTab() { return <div className="bg-white p-12 rounded-xl text-center border border-gray-200"><Info className="mx-auto text-gray-300 mb-4" size={48}/><h2>Infos générales du salon (À venir)</h2></div>; }

// ============================================================================
// 5. PAGE PRINCIPALE
// ============================================================================
export default function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const [activeTab, setActiveTab] = useState('my_planning');

  const tabs = [
    { id: 'my_planning', label: t('tabs.planning'), icon: User },
    { id: 'whatsapp', label: t('tabs.whatsapp'), icon: Smartphone },
    { id: 'horaires', label: t('tabs.hours'), icon: Clock },
    { id: 'booking', label: t('tabs.booking'), icon: Power },
    { id: 'general', label: t('tabs.general'), icon: Info },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-black text-white rounded-xl shadow-lg"><Scissors size={24}/></div>
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
      </div>
      
      {/* Barre d'onglets défilable */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
        <nav className="flex space-x-8 min-w-max pb-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={clsx("flex items-center gap-2 pb-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap",
                activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
              )}>
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'my_planning' && <MyPlanningTab />}
        {activeTab === 'whatsapp' && <WhatsAppTab />}
        {activeTab === 'horaires' && <HorairesTab />}
        {activeTab === 'booking' && <BookingStatusTab />}
        {activeTab === 'general' && <GeneralTab />}
      </div>
    </div>
  );
}