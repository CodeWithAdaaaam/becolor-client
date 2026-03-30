"use client";
import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Plus, Pencil, Trash2, X, Tag, Clock, Coins, Scissors, Palette, Info } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl'; // Ajout de useLocale

interface Service {
  id: number;
  nom: string;
  category: string;
  prix: number;
  duree: number;
  couleur: string;
  is_starting_price: boolean; 
}

export default function ServicesPage() {
  const t = useTranslations('ServicesPage');
  const locale = useLocale(); // Pour la détection de la langue si nécessaire
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    category: '',
    prix: '', 
    duree: '30',
    couleur: '#000000',
    is_starting_price: false 
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get('/services');
      setServices(res.data);
    } catch (e) { console.error("Erreur chargement services", e); }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ 
        nom: '', 
        category: '', 
        prix: '', 
        duree: '30', 
        couleur: '#000000', 
        is_starting_price: false 
    });
    setShowModal(true);
  };

  const openEditModal = (s: Service) => {
    setEditingId(s.id);
    setFormData({ 
        nom: s.nom, 
        category: s.category || '', 
        prix: s.prix.toString(), 
        duree: s.duree.toString(),
        couleur: s.couleur || '#000000',
        is_starting_price: s.is_starting_price || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if(!confirm(t('alerts.confirmDelete'))) return;
    try {
      await axios.delete(`/services/${id}`);
      fetchServices();
    } catch(e) { alert(t('alerts.errorDelete')); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
          ...formData,
          prix: Number(formData.prix),
          duree: Number(formData.duree)
      };

      if (editingId) {
        await axios.put(`/services/${editingId}`, dataToSend);
      } else {
        await axios.post('/services', dataToSend);
      }
      setShowModal(false);
      fetchServices();
    } catch (e) { alert(t('alerts.errorSave')); }
  };

  const getCategoryBadge = (cat: string) => {
    const label = (cat && t.has(`categories.${cat}`)) ? t(`categories.${cat}`) : (cat || t('table.other'));
    return <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded text-xs font-bold">{label}</span>;
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Scissors className="text-black"/> {t('title')}
            </h1>
            <p className="text-gray-500 text-sm">{t('subtitle')}</p>
        </div>
        <button 
            onClick={openCreateModal} 
            className="bg-black text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition shadow-md"
        >
          <Plus size={20} /> {t('newService')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                <tr>
                <th className="p-4">{t('table.name')}</th>
                <th className="p-4">{t('table.category')}</th>
                <th className="p-4">{t('table.duration')}</th>
                <th className="p-4">{t('table.price')}</th>
                <th className="p-4 text-right rtl:text-left">{t('table.actions')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition group">
                    <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: s.couleur }}></div>
                        {s.nom}
                    </td>
                    <td className="p-4">{getCategoryBadge(s.category)}</td>
                    <td className="p-4 text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14}/> {s.duree} {t('table.min')}
                    </td>
                    <td className="p-4 text-gray-900">
                        {s.is_starting_price && (
                            <span className="text-[10px] block font-normal text-gray-400 uppercase leading-none mb-1">
                                {t('table.startingAt')}
                            </span>
                        )}
                        <span className="font-bold">{s.prix} Dhs</span>
                    </td>
                    <td className="p-4 text-right rtl:text-left flex justify-end rtl:justify-start gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEditModal(s)} className="p-2 hover:bg-blue-50 text-blue-600 rounded"><Pencil size={16}/></button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button>
                    </td>
                </tr>
                ))}
                {services.length === 0 && (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">{t('table.empty')}</td></tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl w-full max-w-lg relative shadow-2xl animate-in fade-in zoom-in-95">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 rtl:left-5 rtl:right-auto text-gray-400 hover:text-black">
                <X size={20}/>
            </button>

            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                {editingId ? <Pencil size={20}/> : <Plus size={20}/>}
                {editingId ? t('modal.titleEdit') : t('modal.titleNew')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* NOM */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.nameLabel')}</label>
                <div className="relative">
                    <Scissors className="absolute start-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" required 
                        placeholder={t('modal.namePlaceholder')}
                        className="w-full border p-2.5 ps-10 rounded-lg focus:ring-2 focus:ring-black outline-none font-medium"
                        value={formData.nom} 
                        onChange={e => setFormData({...formData, nom: e.target.value})} 
                    />
                </div>
              </div>

              {/* CATÉGORIE + COULEUR */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.categoryLabel')}</label>
                    <div className="relative">
                        <Tag className="absolute start-3 top-3 text-gray-400" size={18} />
                        <select 
                            required 
                            className="w-full border p-2.5 ps-10 rounded-lg bg-white focus:ring-2 focus:ring-black outline-none appearance-none"
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="">{t('modal.selectPlaceholder')}</option>
                            <optgroup label={t('categories.groupCoiffure')}>
                                <option value="Coiffage">{t('categories.Coiffage')}</option>
                                <option value="Coupe">{t('categories.Coupe')}</option>
                                <option value="Coloration">{t('categories.Coloration')}</option>
                                <option value="Balayages">{t('categories.Balayages')}</option>
                                <option value="Proteine">{t('categories.Proteine')}</option>
                                <option value="SoinCheveux">{t('categories.SoinCheveux')}</option>
                            </optgroup>
                            <optgroup label={t('categories.groupEsthetique')}>
                                <option value="MainsPieds">{t('categories.MainsPieds')}</option>
                                <option value="FauxCils">{t('categories.FauxCils')}</option>
                                <option value="Epilation">{t('categories.Epilation')}</option>
                                <option value="Maquillage">{t('categories.Maquillage')}</option>
                                <option value="SoinVisage">{t('categories.SoinVisage')}</option>
                            </optgroup>
                        </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.colorLabel')}</label>
                    <div className="relative border p-1 rounded-lg flex items-center bg-white">
                        <Palette className="absolute start-3 text-gray-400" size={18}/>
                        <input 
                            type="color" 
                            className="w-full h-9 rounded cursor-pointer border-0 ps-8 bg-transparent"
                            value={formData.couleur} 
                            onChange={e => setFormData({...formData, couleur: e.target.value})}
                        />
                    </div>
                  </div>
              </div>

              {/* PRIX + DURÉE */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.priceLabel')}</label>
                    <div className="relative">
                        <Coins className="absolute start-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="number" required min="0"
                            placeholder="0"
                            className="w-full border p-2.5 ps-10 rounded-lg focus:ring-2 focus:ring-black outline-none font-bold"
                            value={formData.prix} 
                            onChange={e => setFormData({...formData, prix: e.target.value})} 
                        />
                    </div>
                 </div>

                 <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">{t('modal.durationLabel')}</label>
                    <div className="relative">
                        <Clock className="absolute start-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="number" required min="5" step="5"
                            placeholder="30"
                            className="w-full border p-2.5 ps-10 rounded-lg focus:ring-2 focus:ring-black outline-none font-medium"
                            value={formData.duree} 
                            onChange={e => setFormData({...formData, duree: e.target.value})} 
                        />
                    </div>
                 </div>
              </div>

              {/* CASE A COCHER : PRIX A PARTIR DE */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <input 
                    type="checkbox" 
                    id="is_starting_price"
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    checked={formData.is_starting_price}
                    onChange={e => setFormData({...formData, is_starting_price: e.target.checked})}
                />
                <label htmlFor="is_starting_price" className="text-sm cursor-pointer select-none">
                    <span className="font-bold block text-gray-800">
                        {t('modal.isStartingPriceLabel')}
                    </span>
                    <span className="text-xs text-gray-500">
                        {t('modal.isStartingPriceHint')}
                    </span>
                </label>
              </div>

              <button type="submit" className="w-full bg-black text-white py-3.5 rounded-lg font-bold hover:bg-gray-800 transition mt-2 shadow-lg">
                {editingId ? t('modal.save') : t('modal.create')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}