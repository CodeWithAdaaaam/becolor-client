"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { 
  Plus, Trash2, User, Clock, X, ChevronDown, ChevronUp, 
  Briefcase, Mail, Shield, Palette, Edit, Check 
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';

const DAYS_INDICES = [0, 1, 2, 3, 4, 5, 6];
const ROLE_OPTIONS = ['COIFFEUR', 'ONGLERIE', 'ESTHETICIENNE', 'RECEPTIONIST', 'SUPERADMIN'];

interface ScheduleDay {
  day: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export default function TeamPage() {
  const t = useTranslations('TeamPage');
  const t_days = useTranslations('Days');

  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false); 
  const [editingId, setEditingId] = useState<number | null>(null);

  const defaultSchedule: ScheduleDay[] = DAYS_INDICES.map((i) => ({
    day: i, startTime: "09:00", endTime: "19:00", isWorking: i !== 0 
  }));

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: '', roles: [] as string[], color: '#3b82f6'
  });
  const [schedule, setSchedule] = useState<ScheduleDay[]>(defaultSchedule);

  useEffect(() => { loadTeam(); }, []);

  const loadTeam = async () => {
    try { const res = await api.get('/users'); setUsers(res.data); } catch (e) { console.error(e); }
  };

  // Logique pour cocher/décocher un rôle
  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role) 
        : [...prev.roles, role]
    }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ nom: '', prenom: '', email: '', password: '', roles: [], color: '#3b82f6' });
    setSchedule(defaultSchedule);
    setShowSchedule(false);
    setShowModal(true);
  };

  const openEditModal = async (user: any) => {
    setEditingId(user.id);
    
    // On transforme le rôle unique en tableau si nécessaire pour la compatibilité
    const initialRoles = Array.isArray(user.roles) 
        ? user.roles 
        : (user.role ? [user.role] : []);

    setFormData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        password: '', 
        roles: initialRoles,
        color: user.color || '#3b82f6'
    });

    try {
        const res = await api.get(`/users/${user.id}/schedule`);
        if (res.data && res.data.length > 0) {
            const userSchedule = DAYS_INDICES.map(dayIndex => {
                const existing = res.data.find((s: any) => s.day === dayIndex);
                return existing ? {
                    day: dayIndex,
                    startTime: existing.startTime || "09:00",
                    endTime: existing.endTime || "19:00",
                    isWorking: existing.isWorking
                } : { day: dayIndex, startTime: "09:00", endTime: "19:00", isWorking: false };
            });
            setSchedule(userSchedule);
        } else {
            setSchedule(defaultSchedule);
        }
    } catch (e) { setSchedule(defaultSchedule); }

    setShowSchedule(false);
    setShowModal(true);
  };

  const handleScheduleChange = (index: number, field: keyof ScheduleDay, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roles.length === 0) return alert(t('modal.noRoleError'));

    try {
      const payload = { ...formData, schedule };
      if (editingId) {
        if (!formData.password) delete (payload as any).password;
        await api.put(`/users/${editingId}`, payload);
        alert(t('alerts.successUpdate'));
      } else {
        await api.post('/auth/register', payload);
        alert(t('alerts.success'));
      }
      setShowModal(false);
      loadTeam();
    } catch (error: any) { 
        alert(error.response?.data?.message || t('alerts.error')); 
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm(t('alerts.confirmDelete'))) return;
    try { await api.delete(`/users/${id}`); loadTeam(); } catch (e) { alert(t('alerts.errorDelete')); }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="text-black"/> {t('title')}
            </h1>
            <p className="text-gray-500 text-sm">{t('subtitle')}</p>
        </div>
        <button onClick={openCreateModal} className="bg-black text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg w-full md:w-auto hover:bg-gray-800 transition">
          <Plus size={20}/> {t('addMember')}
        </button>
      </div>

      {/* GRILLE DES MEMBRES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative group hover:border-blue-200 transition">
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm" style={{ backgroundColor: u.color || '#000' }}>
                        {u.prenom[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{u.prenom} {u.nom}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {(u.roles || [u.role]).map((r: string) => (
                                <span key={r} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase font-bold border border-gray-200">
                                    {t(`roles.${r}`)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => openEditModal(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"><Edit size={18}/></button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-300 hover:text-red-500 rounded transition"><Trash2 size={18}/></button>
                </div>
             </div>
             <div className="mt-auto pt-4 border-t border-gray-50 text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-2"><Mail size={14}/> {u.email}</div>
             </div>
          </div>
        ))}
      </div>

      {/* MODAL AJOUT/MODIF */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <User size={24}/> {editingId ? t('modal.titleEdit') : t('modal.title')}
                </h2>
                <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-black"/></button>
            </div>
            
            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.firstName')}</label>
                                <input required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.lastName')}</label>
                                <input required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}/>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.email')}</label>
                                <input required type="email" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.password')}</label>
                                <input required={!editingId} type="password" placeholder={editingId ? t('modal.passwordPlaceholder') : "******"} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}/>
                            </div>
                        </div>
                    </div>

                    {/* SÉLECTION MULTI-RÔLES */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-3 block">{t('modal.rolesLabel')}</label>
                        <div className="flex flex-wrap gap-2">
                            {ROLE_OPTIONS.map((role) => {
                                const active = formData.roles.includes(role);
                                return (
                                    <button key={role} type="button" onClick={() => toggleRole(role)}
                                        className={clsx(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all",
                                            active ? "bg-black text-white border-black shadow-md" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                        )}
                                    >
                                        {active && <Check size={14}/>}
                                        {t(`roles.${role}`)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.color')}</label>
                        <div className="flex items-center gap-2 border p-2 rounded-lg w-full md:w-1/2">
                            <Palette size={20} className="text-gray-400 ms-2" />
                            <input type="color" className="w-full h-8 rounded cursor-pointer border-0 bg-transparent" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}/>
                        </div>
                    </div>

                    {/* HORAIRES ACCORDÉON */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <button type="button" onClick={() => setShowSchedule(!showSchedule)} className="w-full bg-gray-50 p-4 flex justify-between items-center font-bold text-gray-700 hover:bg-gray-100 transition">
                            <span className="flex items-center gap-2"><Clock size={18} className="text-blue-600"/> {t('modal.scheduleTitle')}</span>
                            {showSchedule ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                        </button>
                        {showSchedule && (
                            <div className="p-4 bg-white space-y-2 max-h-60 overflow-y-auto">
                                {schedule.map((day, index) => (
                                    <div key={day.day} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border ${day.isWorking ? 'border-gray-200 bg-white' : 'border-transparent bg-gray-50'}`}>
                                        <div className="flex items-center gap-3 w-32 mb-2 sm:mb-0">
                                            <input type="checkbox" checked={day.isWorking} onChange={e => handleScheduleChange(index, 'isWorking', e.target.checked)} className="w-5 h-5 accent-black cursor-pointer" />
                                            <span className={`text-sm font-bold ${day.isWorking ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{t_days(`${day.day}`)}</span>
                                        </div>
                                        {day.isWorking ? (
                                            <div className="flex items-center gap-2" dir="ltr">
                                                <input type="time" value={day.startTime} onChange={e => handleScheduleChange(index, 'startTime', e.target.value)} className="p-2 border rounded text-xs font-bold bg-gray-50"/>
                                                <span className="text-gray-300">-</span>
                                                <input type="time" value={day.endTime} onChange={e => handleScheduleChange(index, 'endTime', e.target.value)} className="p-2 border rounded text-xs font-bold bg-gray-50"/>
                                            </div>
                                        ) : <span className="text-xs font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full">{t('modal.rest')}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 shadow-lg text-lg transition-all active:scale-[0.98]">
                        {editingId ? t('modal.update') : t('modal.submit')}
                    </button>
                </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}