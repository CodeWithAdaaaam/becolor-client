"use client";
import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import { Search, UserPlus, Phone, Edit, FileText, X, Save, MessageCircle, User, Trash2, Eye } from 'lucide-react';
import { createWhatsAppLink } from '@/utils/whatsapp';
import { useTranslations } from 'next-intl'; // <--- IMPORT

interface Client {
  id: number;
  nom: string;
  prenom: string;
  tel_principal: string;
  email?: string;
  notes_techniques?: string;
}

export default function ClientsPage() {
  const t = useTranslations('ClientsPage'); // <--- HOOK
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ nom: '', prenom: '', tel_principal: '', email: '', notes_techniques: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get('/clients');
      setClients(res.data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await axios.put(`/clients/${editingClient.id}`, formData);
      } else {
        await axios.post('/clients', formData);
      }
      setShowModal(false);
      setEditingClient(null);
      setFormData({ nom: '', prenom: '', tel_principal: '', email: '', notes_techniques: '' });
      fetchClients();
    } catch (error) {
      alert(t('alerts.errorSave'));
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      tel_principal: client.tel_principal,
      email: client.email || '',
      notes_techniques: client.notes_techniques || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if(!confirm(t('alerts.confirmDelete'))) return;
    try {
        await axios.delete(`/clients/${id}`);
        fetchClients();
    } catch(e) { alert(t('alerts.errorDelete')); }
  };

  const openNew = () => {
    setEditingClient(null);
    setFormData({ nom: '', prenom: '', tel_principal: '', email: '', notes_techniques: '' });
    setShowModal(true);
  };

  const filteredClients = clients.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase()) || 
    c.prenom.toLowerCase().includes(search.toLowerCase()) ||
    c.tel_principal.includes(search)
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
      
      {/* HEADER + RECHERCHE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <User className="hidden md:block"/> {t('title')} <span className="text-gray-400 text-lg font-normal">({clients.length})</span>
            </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')}
                    className="w-full sm:w-64 ps-10 pe-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <button onClick={openNew} className="bg-black text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow hover:bg-gray-800 transition">
                <UserPlus size={20}/> <span className="md:hidden">{t('newShort')}</span><span className="hidden md:inline">{t('newClient')}</span>
            </button>
        </div>
      </div>

      {/* --- VUE MOBILE : CARTES --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredClients.map(client => (
            <div key={client.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                            {client.prenom.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{client.prenom} {client.nom}</h3>
                            <p className="text-sm text-gray-500 rtl:text-right" dir="ltr">{client.tel_principal}</p>
                        </div>
                    </div>
                    {/* BOUTON VOIR FICHE (MOBILE) */}
                    <Link href={`/dashboard/clients/${client.id}`}>
                        <button className="p-2 text-white bg-black hover:bg-gray-800 rounded-lg shadow-sm transition">
                            <Eye size={18}/>
                        </button>
                    </Link>
                </div>

                {/* Actions Rapides Mobile */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                    <a href={`tel:${client.tel_principal}`} className="flex items-center justify-center py-2 bg-gray-50 text-gray-700 rounded-lg border border-gray-200">
                        <Phone size={18}/>
                    </a>
                    <a href={createWhatsAppLink(client.tel_principal, `Bonjour ${client.prenom}, `)} target="_blank" className="flex items-center justify-center py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                        <MessageCircle size={18}/>
                    </a>
                    <button onClick={() => handleEdit(client)} className="flex items-center justify-center py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                        <Edit size={18}/>
                    </button>
                </div>

                {client.notes_techniques && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 mt-1">
                        <div className="flex items-center gap-1 font-bold uppercase mb-1 opacity-70">
                            <FileText size={10}/> {t('table.notes')}
                        </div>
                        <p className="line-clamp-2">"{client.notes_techniques}"</p>
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* --- VUE DESKTOP : TABLEAU --- */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left rtl:text-right">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                <tr>
                    <th className="p-4">{t('table.client')}</th>
                    <th className="p-4">{t('table.contact')}</th>
                    <th className="p-4">{t('table.notes')}</th>
                    <th className="p-4 text-right rtl:text-left">{t('table.actions')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 transition group">
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                    {client.prenom.charAt(0)}
                                </div>
                                <Link href={`/dashboard/clients/${client.id}`} className="font-bold text-gray-800 hover:text-blue-600 hover:underline">
                                    {client.prenom} {client.nom}
                                </Link>
                            </div>
                        </td>
                        <td className="p-4">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-700 rtl:text-right" dir="ltr">{client.tel_principal}</span>
                                <span className="text-xs text-gray-400">{client.email || '-'}</span>
                            </div>
                        </td>
                        <td className="p-4 max-w-xs">
                            {client.notes_techniques ? (
                                <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-100 truncate">
                                    {client.notes_techniques}
                                </div>
                            ) : <span className="text-gray-300 text-sm italic">{t('table.noNotes')}</span>}
                        </td>
                        <td className="p-4 text-right rtl:text-left">
                            <div className="flex items-center justify-end rtl:justify-start gap-2 opacity-0 group-hover:opacity-100 transition">
                                <Link href={`/dashboard/clients/${client.id}`} className="p-2 text-gray-600 hover:bg-black hover:text-white rounded transition">
                                    <Eye size={18}/>
                                </Link>
                                <a href={createWhatsAppLink(client.tel_principal, `Bonjour ${client.prenom}, `)} target="_blank" className="p-2 text-green-600 hover:bg-green-50 rounded">
                                    <MessageCircle size={18}/>
                                </a>
                                <button onClick={() => handleEdit(client)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                    <Edit size={18}/>
                                </button>
                                <button onClick={() => handleDelete(client.id)} className="p-2 text-red-400 hover:bg-red-50 rounded">
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {filteredClients.length === 0 && !loading && (
            <div className="p-10 text-center text-gray-400">{t('empty')}</div>
        )}
      </div>

      {/* MODAL RESPONSIVE (AJOUT/MODIF) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{editingClient ? t('modal.titleEdit') : t('modal.titleNew')}</h2>
                    <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="text-gray-500 hover:text-black"/></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.firstName')}</label>
                            <input required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.lastName')}</label>
                            <input required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}/>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.phone')}</label>
                        <input type="tel" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" value={formData.tel_principal} onChange={e => setFormData({...formData, tel_principal: e.target.value})}/>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.email')}</label>
                        <input type="email" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/>
                    </div>

                    {/* SECTION TECHNIQUE */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-2">
                        <label className="text-sm font-bold text-yellow-900 flex items-center gap-2 mb-2">
                            <FileText size={16}/> {t('modal.techNotes')}
                        </label>
                        <textarea 
                            className="w-full p-3 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                            rows={3}
                            placeholder={t('modal.techPlaceholder')}
                            value={formData.notes_techniques}
                            onChange={e => setFormData({...formData, notes_techniques: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 flex justify-center gap-2 mt-4 shadow-lg">
                        <Save size={20}/> {t('modal.save')}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}