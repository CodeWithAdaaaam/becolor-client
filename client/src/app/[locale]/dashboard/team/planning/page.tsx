"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Clock, Save, User, CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl'; // <--- IMPORT

const DAYS_INDICES = [0, 1, 2, 3, 4, 5, 6];

// Type pour une journée
interface WorkDay {
  day: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export default function MyPlanningPage() {
  const t = useTranslations('TeamPlanningPage'); // <--- HOOK PAGE
  const t_days = useTranslations('Days'); // <--- HOOK JOURS

  const [schedule, setSchedule] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  // Quand on change d'utilisateur, on charge son planning
  useEffect(() => {
    if (selectedUserId) {
        loadSchedule(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
        const res = await api.get('/users');
        setUsers(res.data);
        if (res.data.length > 0) setSelectedUserId(res.data[0].id);
    } catch (e) { console.error(e); }
  };

  const loadSchedule = async (userId: number) => {
    try {
      const res = await api.get(`/users/${userId}/schedule`);
      
      // Initialisation par défaut si vide (9h-18h)
      let initialSchedule = res.data;
      if (initialSchedule.length === 0) {
        initialSchedule = DAYS_INDICES.map((_, index) => ({
            day: index,
            startTime: "09:00",
            endTime: "18:00",
            isWorking: index !== 0 // Dimanche repos par défaut
        }));
      } else {
        // S'assurer qu'ils sont dans l'ordre 0-6
        initialSchedule.sort((a: any, b: any) => a.day - b.day);
      }
      setSchedule(initialSchedule);
    } catch (error) {
      console.error("Erreur chargement", error);
    }
  };

  const handleChange = (index: number, field: keyof WorkDay, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const saveSchedule = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await api.post(`/users/${selectedUserId}/schedule`, schedule);
      alert(t('success'));
    } catch (error) {
      alert(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CalendarDays /> {t('title')}
      </h1>

      {/* SÉLECTEUR D'EMPLOYÉ */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex items-center gap-4">
        <div className="bg-blue-50 p-2 rounded-full text-blue-600"><User/></div>
        <div>
            <label className="block text-sm font-bold text-gray-500">{t('configFor')}</label>
            <select 
                className="font-bold text-lg bg-transparent focus:outline-none cursor-pointer"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
            >
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                ))}
            </select>
        </div>
      </div>

      {/* GRILLE HORAIRES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <span className="font-bold text-gray-500 uppercase text-xs">{t('typicalWeek')}</span>
            <button 
                onClick={saveSchedule}
                disabled={loading} 
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition"
            >
                <Save size={16}/> {loading ? t('saving') : t('save')}
            </button>
        </div>

        <div className="divide-y">
            {schedule.map((day, index) => (
                <div key={day.day} className={`p-4 flex flex-col md:flex-row items-center justify-between transition-colors ${day.isWorking ? 'bg-white' : 'bg-gray-50'}`}>
                    
                    {/* Switch Jour */}
                    <div className="flex items-center gap-3 w-40 mb-2 md:mb-0">
                        <input 
                            type="checkbox" 
                            checked={day.isWorking}
                            onChange={(e) => handleChange(index, 'isWorking', e.target.checked)}
                            className="w-5 h-5 accent-blue-600 cursor-pointer"
                        />
                        <span className={`font-medium ${day.isWorking ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                            {t_days(`${day.day}`)}
                        </span>
                    </div>

                    {/* Inputs Heures */}
                    {day.isWorking ? (
                        <div className="flex items-center gap-2" dir="ltr">
                            <div className="relative">
                                <Clock size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="time" 
                                    value={day.startTime}
                                    onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                                    className="pl-7 pr-2 py-1 border rounded text-sm font-bold bg-gray-50 focus:bg-white focus:ring-2 ring-blue-500 outline-none"
                                />
                            </div>
                            <span className="text-gray-300 font-bold">-</span>
                            <div className="relative">
                                <Clock size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="time" 
                                    value={day.endTime}
                                    onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                                    className="pl-7 pr-2 py-1 border rounded text-sm font-bold bg-gray-50 focus:bg-white focus:ring-2 ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{t('rest')}</span>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}