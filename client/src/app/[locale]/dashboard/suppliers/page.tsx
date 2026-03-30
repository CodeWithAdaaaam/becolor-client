"use client";
import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Truck, Plus, Search, Phone, Edit, Trash2, ShoppingBag, Clock, Eye, X, Save, FileText } from 'lucide-react'; // J'ai nettoyé les imports inutilisés
import { useTranslations, useLocale } from 'next-intl'; // <--- IMPORTS

interface Supplier {
  id: number;
  name: string;
  phone: string;
  description: string;
  lastPurchase: string | null;
  lastPayment: string | null;
}

export default function SuppliersPage() {
  const t = useTranslations('SuppliersPage'); // <--- HOOK TRADUCTION
  const locale = useLocale(); // <--- HOOK LOCALE

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Données pour l'historique
  const [selectedSupplierHistory, setSelectedSupplierHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState({ name: '', phone: '', description: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('/suppliers');
      setSuppliers(res.data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const fetchHistory = async (id: number) => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    setSelectedSupplierHistory(null);
    try {
        const res = await axios.get(`/suppliers/${id}`);
        setSelectedSupplierHistory(res.data);
    } catch (e) {
        console.error("Erreur historique", e);
        setShowHistoryModal(false);
    } finally {
        setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(`/suppliers/${editingSupplier.id}`, formData);
      } else {
        await axios.post('/suppliers', formData);
      }
      setShowModal(false);
      setEditingSupplier(null);
      setFormData({ name: '', phone: '', description: '' });
      fetchSuppliers();
      alert(t('alerts.success'));
    } catch (error) { alert(t('alerts.error')); }
  };

  const handleEdit = (sup: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSupplier(sup);
    setFormData({ name: sup.name, phone: sup.phone || '', description: sup.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm(t('alerts.confirmDelete'))) return;
    try {
        await axios.delete(`/suppliers/${id}`);
        fetchSuppliers();
    } catch (e: any) { alert(e.response?.data?.message || t('alerts.errorDelete')); }
  };

  const openNew = () => {
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', description: '' });
    setShowModal(true);
  };

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  // Utilitaire date avec locale dynamique
  const formatDate = (dateStr: string | null) => {
      if (!dateStr) return t('card.never');
      return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="text-black"/> {t('title')} <span className="text-gray-400 font-normal">({suppliers.length})</span>
            </h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                    type="text" placeholder={t('searchPlaceholder')}
                    className="w-full ps-10 pe-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                    value={search} onChange={e => setSearch(e.target.value)}
                />
            </div>
            <button onClick={openNew} className="bg-black text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow hover:bg-gray-800">
                <Plus size={20}/> <span className="hidden sm:inline">{t('newSupplier')}</span>
            </button>
        </div>
      </div>

      {/* GRILLE FOURNISSEURS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(sup => (
            <div 
                key={sup.id} 
                onClick={() => fetchHistory(sup.id)} 
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer group relative"
            >
                {/* En-tête Carte */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                            {sup.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">{sup.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone size={12}/> {sup.phone || t('card.noPhone')}
                            </div>
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); fetchHistory(sup.id); }} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded">
                            <Eye size={18}/>
                        </button>
                        <button onClick={(e) => handleEdit(sup, e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                            <Edit size={18}/>
                        </button>
                        <button onClick={(e) => handleDelete(sup.id, e)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={18}/>
                        </button>
                    </div>
                </div>

                {/* Description */}
                {sup.description && (
                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 italic mb-4 border border-gray-100 line-clamp-2">
                        "{sup.description}"
                    </div>
                )}

                {/* Stats Dates */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3 mt-auto">
                    <div>
                        <p className="text-gray-400 font-bold mb-1 flex items-center gap-1"><ShoppingBag size={10}/> {t('card.lastPurchase')}</p>
                        <p className={`font-medium ${sup.lastPurchase ? 'text-gray-800' : 'text-gray-300'}`}>
                            {formatDate(sup.lastPurchase)}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-400 font-bold mb-1 flex items-center gap-1"><Clock size={10}/> {t('card.lastPayment')}</p>
                        <p className={`font-medium ${sup.lastPayment ? 'text-green-700' : 'text-gray-300'}`}>
                            {formatDate(sup.lastPayment)}
                        </p>
                    </div>
                </div>
            </div>
        ))}
      </div>
      
      {filtered.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400 italic">{t('empty')}</div>
      )}

      {/* MODAL AJOUT / MODIF */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{editingSupplier ? t('modal.titleEdit') : t('modal.titleNew')}</h2>
                    <button onClick={() => setShowModal(false)}><X className="text-gray-500 hover:text-black"/></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('modal.nameLabel')}</label>
                        <input required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" 
                            placeholder={t('modal.namePlaceholder')}
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('modal.phoneLabel')}</label>
                        <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" 
                            placeholder={t('modal.phonePlaceholder')}
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('modal.descLabel')}</label>
                        <textarea className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" rows={3}
                            placeholder={t('modal.descPlaceholder')}
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
                    </div>

                    <button type="submit" className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 flex justify-center gap-2 mt-4 shadow-lg">
                        <Save size={20}/> {t('modal.save')}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* MODAL HISTORIQUE DES ACHATS */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[80vh]">
                
                {/* Header Modal */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="text-blue-600"/> {t('history.title')}
                        </h2>
                        {selectedSupplierHistory && (
                            <p className="text-sm text-gray-500">{selectedSupplierHistory.name}</p>
                        )}
                    </div>
                    <button onClick={() => setShowHistoryModal(false)} className="bg-white p-2 rounded-full hover:bg-gray-200 border"><X size={20}/></button>
                </div>

                {/* Contenu Scrollable */}
                <div className="p-0 overflow-y-auto flex-1">
                    {loadingHistory ? (
                        <div className="p-10 text-center text-gray-500">{t('history.loading')}</div>
                    ) : selectedSupplierHistory?.expenses?.length > 0 ? (
                        <table className="w-full text-left rtl:text-right border-collapse">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold sticky top-0">
                                <tr>
                                    <th className="p-4 border-b">{t('history.date')}</th>
                                    <th className="p-4 border-b">{t('history.reason')}</th>
                                    <th className="p-4 border-b text-right rtl:text-left">{t('history.amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {selectedSupplierHistory.expenses.map((exp: any) => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(exp.date).toLocaleDateString(locale)}
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">
                                            {exp.description || t('history.divers')}
                                            <div className="text-xs text-gray-400">{exp.category}</div>
                                        </td>
                                        <td className="p-4 text-right rtl:text-left font-bold text-red-600" dir="ltr">
                                            -{exp.amount} Dhs
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                            <FileText size={48} className="mb-2 opacity-20"/>
                            <p>{t('history.empty')}</p>
                        </div>
                    )}
                </div>

                {/* Footer Modal (Total) */}
                {selectedSupplierHistory?.expenses?.length > 0 && (
                    <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center text-lg font-bold">
                        <span>{t('history.total')}</span>
                        <span className="text-red-600" dir="ltr">
                            -{selectedSupplierHistory.expenses.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0)} Dhs
                        </span>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}