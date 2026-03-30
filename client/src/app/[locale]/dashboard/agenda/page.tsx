'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import api from '@/lib/axios';

// --- IMPORTS I18N ---
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// --- ICÔNES ---
import { 
  Plus, X, User, CheckCircle, 
  Filter, Pencil 
} from 'lucide-react';
import { clsx } from 'clsx';

// --- STYLES ---
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = { 'fr': fr, 'ar': ar };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);

// --- INTERFACES ---
interface Client { id: number; nom: string; prenom: string; tel_principal: string; }
interface Service { id: number; nom: string; prix: number; duree: number; is_starting_price: boolean; }
interface Staff { id: number; prenom: string; nom: string; roles: string[]; color?: string; }
interface Appointment { 
  id: number; heure_debut: string; heure_fin: string; statut: string; 
  client: Client; services: Service[]; user?: Staff; prix: number;
}
interface CalendarEvent { id: number; title: string; start: Date; end: Date; resource: Appointment; }
interface StoreHour { 
    day: number; 
    isOpen: boolean; 
    morningOpen: string; 
    morningClose: string; 
    afternoonOpen: string; 
    afternoonClose: string; 
}

export default function AgendaPage() {
  const t = useTranslations('AgendaPage');
  const t_modal = useTranslations('Modals');
  const locale = useLocale();

  // --- ÉTATS ---
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [storeHours, setStoreHours] = useState<StoreHour[]>([]); 
  
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [completionData, setCompletionData] = useState({ price: 0 });

  const [formData, setFormData] = useState({ 
    client_id: '', service_ids: [] as number[], user_id: '', date: '', time: '' 
  });

  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date } | null>(null);
  const [clientTab, setClientTab] = useState<'EXISTING' | 'NEW' | 'WALKIN'>('EXISTING');
  const [newClientData, setNewClientData] = useState({ nom: '', prenom: '', tel: '' });

  // --- CALCUL DYNAMIQUE DES BORNES D'AFFICHAGE ---
const { calMin, calMax } = useMemo(() => {
  let earliest = 8; 
  let latest = 23; 

  if (storeHours && storeHours.length > 0) {
    storeHours.forEach(h => {
      if (h.isOpen) {
        // Heure d'ouverture - on prend la session du matin
        if (h.morningOpen) {
          const hStart = parseInt(h.morningOpen.split(':')[0], 10);
          if (hStart < earliest) earliest = hStart;
        }
        
        // Heure de fermeture - on prend TOUJOURS afternoonClose (la vraie fermeture)
        if (h.afternoonClose) {
          const hEnd = parseInt(h.afternoonClose.split(':')[0], 10);
          // Si fermeture après minuit (01:00-05:00), on traite comme le lendemain
          if (hEnd >= 0 && hEnd <= 5) {
            // Fermeture après minuit - on limite à 23h59 pour le calendrier
            if (23 > latest) latest = 23;
          } else if (hEnd > latest) {
            latest = hEnd;
          }
        }
      }
    });
  }

  console.log('📅 Heures calculées:', { earliest, latest });

  return {
    calMin: new Date(1970, 0, 1, Math.max(0, earliest - 1), 0, 0),
    calMax: new Date(1970, 0, 1, Math.min(23, latest + 1), 59, 59)
  };
}, [storeHours]);
  // --- CHARGEMENT ---
  const loadData = useCallback(async () => {
    try {
      const [resCli, resSrv, resStaff, resHours] = await Promise.all([
        api.get('/clients'), 
        api.get('/services'),
        api.get('/users'),
        api.get('/settings/hours')
      ]);
      setClients(resCli.data);
      setServices(resSrv.data);
      setStaff(resStaff.data);
      setStoreHours(resHours.data);
    } catch (e) { console.error("Erreur chargement données", e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const fetchAppointments = useCallback(async (start: Date, end: Date) => {
    if (!start || !end) return;
    try {
      let url = `/appointments?start=${start.toISOString()}&end=${end.toISOString()}`;
      if (selectedRole) url += `&role=${selectedRole}`;
      if (selectedStaffId) url += `&userId=${selectedStaffId}`;
      const res = await api.get(url);
      const formatted = res.data.map((apt: Appointment) => ({
        id: apt.id,
        title: `${apt.client.prenom} - ${apt.services.map(s => s.nom).join(', ')}`,
        start: new Date(apt.heure_debut),
        end: new Date(apt.heure_fin),
        resource: apt
      }));
      setEvents(formatted);
    } catch (err) { console.error(err); }
  }, [selectedRole, selectedStaffId]);

  useEffect(() => {
    if (currentRange) fetchAppointments(currentRange.start, currentRange.end);
  }, [currentRange, fetchAppointments]);

  // --- HANDLERS ---
  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleViewChange = (newView: View) => setView(newView);

  const onEventDrop = useCallback(async ({ event, start, end }: any) => {
    try {
      const updatedEvents = events.map(ev => ev.id === event.id ? { ...ev, start, end } : ev);
      setEvents(updatedEvents);
      await api.put(`/appointments/${event.resource.id}`, {
        heure_debut: start.toISOString(),
        heure_fin: end.toISOString(),
        user_id: event.resource.user?.id 
      });
      if (currentRange) fetchAppointments(currentRange.start, currentRange.end);
    } catch (err) { if (currentRange) fetchAppointments(currentRange.start, currentRange.end); }
  }, [events, currentRange, fetchAppointments]);

  const onEventResize = useCallback(async ({ event, start, end }: any) => {
    try {
      const updatedEvents = events.map(ev => ev.id === event.id ? { ...ev, start, end } : ev);
      setEvents(updatedEvents);
      await api.put(`/appointments/${event.resource.id}`, {
        heure_debut: start.toISOString(),
        heure_fin: end.toISOString()
      });
      if (currentRange) fetchAppointments(currentRange.start, currentRange.end);
    } catch (err) { if (currentRange) fetchAppointments(currentRange.start, currentRange.end); }
  }, [events, currentRange, fetchAppointments]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalClientId = formData.client_id;
      if (!isEditing && clientTab === 'NEW') {
        const res = await api.post('/clients', { nom: newClientData.nom, prenom: newClientData.prenom, tel_principal: newClientData.tel });
        finalClientId = res.data.id;
      }
      const payload = {
        client_id: finalClientId,
        service_ids: formData.service_ids,
        user_id: formData.user_id,
        heure_debut: `${formData.date}T${formData.time}:00`
      };
      if (isEditing && selectedAppointment) {
        await api.put(`/appointments/${selectedAppointment.id}`, payload);
      } else {
        await api.post('/appointments', payload);
      }
      setShowCreateModal(false);
      setIsEditing(false);
      if (currentRange) fetchAppointments(currentRange.start, currentRange.end);
    } catch (err: any) { alert(err.response?.data?.message || "Erreur"); }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedAppointment) return;
    if (newStatus === 'TERMINE') {
        setCompletionData({ price: Number(selectedAppointment.prix) });
        setShowDetailsModal(false);
        setShowCompletionModal(true);
        return;
    }
    try {
      await api.put(`/appointments/${selectedAppointment.id}`, { statut: newStatus });
      setShowDetailsModal(false);
      if (currentRange) fetchAppointments(currentRange.start, currentRange.end);
    } catch (e) { alert("Erreur"); }
  };

  const handleConfirmCompletion = async () => {
    if (!selectedAppointment) return;
    try {
        await api.put(`/appointments/${selectedAppointment.id}`, { statut: 'TERMINE', price: completionData.price });
        setShowCompletionModal(false); 
        if (currentRange) fetchAppointments(currentRange.start, currentRange.end);
    } catch (error) { alert("Erreur"); }
  };

  const selectedServicesDetails = useMemo(() => services.filter(s => formData.service_ids.includes(s.id)), [formData.service_ids, services]);
  const totalDuration = selectedServicesDetails.reduce((acc, s) => acc + s.duree, 0);
  const totalPrice = selectedServicesDetails.reduce((acc, s) => acc + Number(s.prix), 0);
  const containsStartingPrice = selectedServicesDetails.some(s => s.is_starting_price);

  const toggleService = (id: number) => {
    setFormData(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(id) ? prev.service_ids.filter(sid => sid !== id) : [...prev.service_ids, id]
    }));
  };

  const messages = useMemo(() => ({
    allDay: t('calendar.allDay'), today: t('calendar.today'), previous: t('calendar.previous'),
    next: t('calendar.next'), month: t('calendar.month'), week: t('calendar.week'),
    day: t('calendar.day'), agenda: t('calendar.agenda'), showMore: (total: number) => `+ ${total} ${t('calendar.showMore')}`,
  }), [t]);

  const filteredStaff = selectedRole ? staff.filter(s => s.roles?.includes(selectedRole as any)) : staff;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen p-4 overflow-hidden bg-gray-50">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <div className="flex gap-2 items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200 w-full md:w-auto">
          <Filter size={18} className="text-gray-400" />
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="text-sm p-1 border-none focus:ring-0 bg-transparent outline-none">
            <option value="">{t('filterByJob')}</option>
            <option value="COIFFEUR">{t('jobCoiffure')}</option>
            <option value="ONGLERIE">{t('jobOnglerie')}</option>
            <option value="ESTHETICIENNE">{t('jobEsthetique')}</option>
          </select>
          <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} className="text-sm p-1 border-none focus:ring-0 bg-transparent outline-none">
            <option value="">{t('filterByStaff')}</option>
            {filteredStaff.map(s => <option key={s.id} value={s.id}>{s.prenom}</option>)}
          </select>
          <LanguageSwitcher />
        </div>
        <button onClick={() => { setIsEditing(false); setShowCreateModal(true); }} className="bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow">
          <Plus size={20} /> <span>{t('newAppointment')}</span>
        </button>
      </div>

      {/* CALENDRIER */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex-grow overflow-hidden">
        <DnDCalendar
          localizer={localizer} 
          events={events} 
          startAccessor="start" 
          endAccessor="end"
          view={view} 
          onView={handleViewChange}
          date={date} 
          onNavigate={handleNavigate}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          resizable
          messages={messages} 
          culture={locale}
          selectable 
          min={calMin} // DYNAMIQUE (Calculé par useMemo)
          max={calMax} // DYNAMIQUE (Calculé par useMemo)
          onSelectSlot={({ start }) => {
            setIsEditing(false);
            setFormData({ ...formData, date: format(start, 'yyyy-MM-dd'), time: format(start, 'HH:mm'), service_ids: [] });
            setShowCreateModal(true);
          }}
          onSelectEvent={(e: CalendarEvent) => { setSelectedAppointment(e.resource); setShowDetailsModal(true); }}
          onRangeChange={(range: any) => {
            let start: Date;
            let end: Date;

            if (Array.isArray(range)) {
              // Cas où c'est un tableau (ex: vue Mois ou Semaine)
              start = new Date(range[0]);
              end = new Date(range[range.length - 1]);
            } else if (range.start && range.end) {
              // Cas où c'est un objet (ex: vue Jour)
              start = new Date(range.start);
              end = new Date(range.end);
            } else {
              return;
            }

            // --- FIX : NORMALISATION POUR LA VUE JOUR ---
            // Si start et end sont le même jour (ou très proches), on force la journée entière
            if (start.toDateString() === end.toDateString()) {
              start.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59, 999);
            } else {
              // Pour les autres vues, on s'assure aussi de bien couvrir les journées
              start.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59, 999);
            }

            console.log("📡 Plage de dates demandée :", start.toLocaleString(), "au", end.toLocaleString());
            setCurrentRange({ start, end });
          }}
          eventPropGetter={(e: CalendarEvent) => ({ style: { backgroundColor: e.resource.user?.color || '#000', borderRadius: '4px', border: 'none' } })}
        />
      </div>

      {/* MODAL CRÉATION / ÉDITION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{isEditing ? "Modifier RDV" : t_modal('create.title')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition"><X /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border">
                {isEditing ? (
                  <p className="font-bold">{selectedAppointment?.client.prenom} {selectedAppointment?.client.nom}</p>
                ) : (
                    <select value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})} className="w-full p-2 border rounded bg-white outline-none">
                      <option value="">Sélectionner client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                    </select>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t_modal('create.selectServices')}</label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border rounded bg-white text-sm">
                  {services.map(s => (
                    <label key={s.id} className={clsx("flex items-center gap-2 p-1.5 rounded cursor-pointer transition", formData.service_ids.includes(s.id) ? "bg-black text-white" : "hover:bg-gray-50")}>
                      <input type="checkbox" className="sr-only" checked={formData.service_ids.includes(s.id)} onChange={() => toggleService(s.id)} />
                      <span className="flex-1">{s.nom}</span>
                      <span className="text-xs opacity-70">{s.is_starting_price ? t('table.startingAt') : ''} {s.prix} Dhs</span>
                    </label>
                  ))}
                </div>
                {formData.service_ids.length > 0 && (
                  <div className="mt-2 flex justify-between p-2 bg-gray-900 text-white rounded text-[10px] font-bold">
                    <span>Durée: {totalDuration} min</span>
                    <span>Total: {containsStartingPrice ? '+ ' : ''}{totalPrice} Dhs</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select required value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} className="p-2 border rounded text-sm bg-white outline-none">
                  <option value="">{t_modal('create.staff')}</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.prenom}</option>)}
                </select>
                <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="p-2 border rounded text-sm font-bold text-center outline-none" />
              </div>
              <input type="date" required className="w-full p-2 border rounded text-sm outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition shadow">Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t_modal('details.title')}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition"><X /></button>
            </div>
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">{selectedAppointment.user?.prenom[0]}</div>
                <p className="font-bold text-gray-800">{selectedAppointment.user?.prenom}</p>
              </div>
              <p className="flex items-center gap-2 text-gray-700"><User size={18} className="text-gray-400" /> {selectedAppointment.client.prenom} {selectedAppointment.client.nom}</p>
              <div className="flex flex-wrap gap-1">
                {selectedAppointment.services.map(s => <span key={s.id} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold border">{s.nom}</span>)}
              </div>
            </div>
            <button onClick={() => { setShowDetailsModal(false); setIsEditing(true); setFormData({ client_id: selectedAppointment.client.id.toString(), service_ids: selectedAppointment.services.map(s => s.id), user_id: selectedAppointment.user?.id.toString() || '', date: format(new Date(selectedAppointment.heure_debut), 'yyyy-MM-dd'), time: format(new Date(selectedAppointment.heure_debut), 'HH:mm') }); setShowCreateModal(true); }} className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700 transition">
              <Pencil size={16} /> Modifier RDV
            </button>
            <div className="border-t pt-4 flex flex-wrap gap-2">
              <button onClick={() => handleUpdateStatus('TERMINE')} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold shadow hover:bg-green-700 transition">Terminer & Encaisser</button>
              <button onClick={() => handleUpdateStatus('ANNULE')} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition border border-red-200">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CLÔTURE (PAIEMENT) */}
      {showCompletionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <h2 className="text-xl font-bold mb-4">{t_modal('complete.title')}</h2>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Montant Final (MAD)</label>
                <input type="number" className="w-full text-2xl font-bold p-3 border rounded-xl border-black text-right outline-none focus:ring-2 focus:ring-black/20" value={completionData.price} onChange={(e) => setCompletionData({...completionData, price: Number(e.target.value)})} />
                <div className="flex gap-3 mt-8">
                    <button onClick={() => setShowCompletionModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">Annuler</button>
                    <button onClick={handleConfirmCompletion} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition">Valider l'encaissement</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}