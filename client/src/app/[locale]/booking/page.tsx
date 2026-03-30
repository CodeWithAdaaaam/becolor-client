"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/axios';
import { 
    Calendar, User, Scissors, CheckCircle, ChevronLeft, 
    Search, ChevronDown, ChevronUp, Sparkles, Palette, Eye, Smile, Clock, MapPin
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// --- TYPES ---
interface Service { 
    id: number; 
    nom: string; 
    prix: number; 
    duree: number; 
    category: string; 
    is_starting_price: boolean; // Ajouté
}
interface Staff { id: number; prenom: string; nom: string; roles: string[]; }
type CategoryConfig = { [key: string]: { label: string, icon: LucideIcon } };

// --- CONFIGURATION ---
const CATEGORY_CONFIG: CategoryConfig = {
    'Coiffage': { label: 'Coiffage & Brushing', icon: Scissors },
    'Coupe': { label: 'Coupes', icon: Scissors },
    'Coloration': { label: 'Coloration', icon: Palette },
    'Balayages': { label: 'Balayages & Ombré', icon: Sparkles },
    'SoinCheveux': { label: 'Soins Cheveux', icon: Sparkles },
    'Proteine': { label: 'Soin Protéine', icon: Sparkles },
    'MainsPieds': { label: 'Onglerie', icon: Sparkles },
    'Epilation': { label: 'Épilation', icon: Sparkles },
    'Maquillage': { label: 'Maquillage', icon: Smile },
    'FauxCils': { label: 'Cils & Sourcils', icon: Eye },
    'SoinVisage': { label: 'Soins Visage', icon: Smile },
};

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // DONNÉES
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // SÉLECTION
  const [booking, setBooking] = useState({
    service: null as Service | null,
    staff: null as Staff | null,
    date: new Date().toISOString().split('T')[0],
    time: '',
    client: { prenom: '', nom: '', tel: '', email: '' }
  });

  // UX
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // CHARGEMENT INITIAL
  useEffect(() => {
    const init = async () => {
      try {
        const [s, u] = await Promise.all([api.get('/services'), api.get('/users')]);
        setServices(s.data);
        setStaffList(u.data);
      } catch (e) { console.error("Erreur chargement", e); } 
      finally { setLoading(false); }
    };
    init();
  }, []);

  // CHARGEMENT CRÉNEAUX
  const fetchSlots = useCallback(async () => {
    if (!booking.service || !booking.date) return;
    setLoadingSlots(true);
    try {
      const staffId = booking.staff ? booking.staff.id : 'any';
      const res = await api.get(`/booking/slots?date=${booking.date}&serviceId=${booking.service.id}&staffId=${staffId}`);
      setSlots(res.data);
    } catch (e) { setSlots([]); } 
    finally { setLoadingSlots(false); }
  }, [booking.service, booking.date, booking.staff]);

  useEffect(() => {
    if (step === 3) fetchSlots();
  }, [step, fetchSlots]);

  const handleConfirm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking.service) return;
    try {
      await api.post('/booking/create', {
        client: booking.client,
        serviceId: booking.service.id,
        staffId: booking.staff ? booking.staff.id : null,
        date: booking.date,
        time: booking.time
      });
      setStep(5);
    } catch (e: any) {
      alert("Erreur : " + (e.response?.data?.message || "Impossible de réserver."));
    }
  }, [booking]);

  const filteredServices = useMemo(() => {
    if (!searchTerm) return [];
    return services.filter(s => s.nom.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [services, searchTerm]);

  const groupedServices = useMemo(() => {
    return services.reduce((acc: { [key: string]: Service[] }, service) => {
      const cat = service.category || 'Autre';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {});
  }, [services]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin text-black">●</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
        
        {/* BANNIÈRE MARQUE */}
        {step < 5 && (
            <div className="w-full bg-black text-white p-4 text-center shadow-md">
                <h1 className="text-xl font-bold tracking-wide uppercase">be COLOR</h1>
                <p className="text-xs text-gray-400 mt-1">Salon de Coiffure & Beauté</p>
            </div>
        )}

        <div className="w-full max-w-lg bg-white min-h-screen sm:min-h-[auto] sm:my-6 sm:rounded-2xl sm:shadow-xl overflow-hidden flex flex-col">
            
            {/* STEPPER */}
            {step < 5 && (
                <div className="flex gap-1 p-2 bg-gray-50">
                    {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-black' : 'bg-gray-200'}`}/>
                    ))}
                </div>
            )}

            {/* CONTENU */}
            <div className="flex-1">
                
                {/* ÉTAPE 1 : PRESTATION */}
                {step === 1 && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-2">Bonjour ! 👋</h2>
                        <p className="text-gray-500 mb-6">Quelle prestation souhaitez-vous réaliser ?</p>
                        
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={20}/>
                            <input type="text" placeholder="Rechercher (ex: Brushing...)" 
                                className="w-full pl-10 p-3.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition"
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>

                        <div className="space-y-3 pb-20">
                            {searchTerm ? (
                                filteredServices.map((s) => (
                                    <ServiceCard key={s.id} service={s} onClick={() => { setBooking({...booking, service: s}); setStep(2); }} />
                                ))
                            ) : (
                                Object.keys(groupedServices).map((catKey) => {
                                    const config = CATEGORY_CONFIG[catKey] || { label: catKey, icon: Scissors };
                                    const Icon = config.icon;
                                    const isOpen = expandedCategory === catKey;
                                    return (
                                        <div key={catKey} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
                                            <button onClick={() => setExpandedCategory(isOpen ? null : catKey)}
                                                className={`w-full p-4 flex items-center justify-between transition-colors ${isOpen ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <Icon size={22} className={isOpen ? "text-white" : "text-gray-800"} />
                                                    <span className="font-bold text-lg">{config.label}</span>
                                                </div>
                                                {isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                            </button>
                                            {isOpen && (
                                                <div className="p-2 space-y-2 bg-gray-50 border-t border-gray-100">
                                                    {groupedServices[catKey].map((s) => (
                                                        <ServiceCard key={s.id} service={s} onClick={() => { setBooking({...booking, service: s}); setStep(2); }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* ÉTAPE 2 : STAFF */}
                {step === 2 && (
                    <div className="p-6">
                        <button onClick={() => setStep(1)} className="text-sm text-gray-500 mb-6 flex items-center gap-1 hover:text-black transition"><ChevronLeft size={16}/> Retour</button>
                        <h2 className="text-xl font-bold mb-2">Avec qui ?</h2>
                        <p className="text-gray-500 mb-6 text-sm">Pour : <span className="font-bold text-black">{booking.service?.nom}</span></p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => { setBooking({...booking, staff: null}); setStep(3); }} className="p-5 border-2 border-dashed border-gray-300 rounded-2xl hover:border-black hover:bg-gray-50 text-center transition flex flex-col items-center justify-center h-40">
                                <span className="font-bold text-lg text-gray-800">Peu importe</span>
                                <span className="text-xs text-gray-500 mt-1">Premier créneau dispo</span>
                            </button>
                            {staffList.map((s) => (
                                <button key={s.id} onClick={() => { setBooking({...booking, staff: s}); setStep(3); }} className="p-4 border rounded-2xl hover:border-black hover:bg-gray-50 text-center shadow-sm transition flex flex-col items-center justify-center h-40 bg-white">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 font-bold text-xl text-gray-600 border border-gray-200">{s.prenom[0]}</div>
                                    <span className="font-bold block text-gray-900">{s.prenom}</span>
                                    <span className="text-xs text-gray-400 capitalize mt-1 bg-gray-50 px-2 py-0.5 rounded-full">
                                        {s.roles?.join(', ').toLowerCase()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ÉTAPE 3 : DATE & HEURE */}
                {step === 3 && (
                    <div className="p-6">
                        <button onClick={() => setStep(2)} className="text-sm text-gray-500 mb-6 flex items-center gap-1 hover:text-black transition"><ChevronLeft size={16}/> Retour</button>
                        <h2 className="text-xl font-bold mb-4">Quand êtes-vous libre ?</h2>
                        
                        <div className="mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-gray-100">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Date</label>
                            <input type="date" className="w-full p-4 border rounded-xl text-lg font-bold shadow-sm focus:ring-2 focus:ring-black outline-none bg-gray-50"
                                value={booking.date} min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBooking({...booking, date: e.target.value, time: ''})} />
                        </div>

                        {loadingSlots ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
                                <span className="text-gray-400 text-sm font-medium">Recherche des disponibilités...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pb-10">
                                {slots.length > 0 ? slots.map((time) => (
                                    <button key={time} onClick={() => { setBooking({...booking, time}); setStep(4); }}
                                        className="py-4 px-2 bg-white border border-gray-200 rounded-xl hover:bg-black hover:text-white hover:border-black text-sm font-bold transition shadow-sm active:scale-95">
                                        {time}
                                    </button>
                                )) : (
                                    <div className="col-span-4 text-center py-12 px-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <p className="font-bold mb-1">Aucun créneau libre 😔</p>
                                        <p className="text-sm">Essayez une autre date ou un autre coiffeur.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ÉTAPE 4 : FORMULAIRE */}
                {step === 4 && (
                    <div className="p-6">
                        <button onClick={() => setStep(3)} className="text-sm text-gray-500 mb-6 flex items-center gap-1 hover:text-black transition"><ChevronLeft size={16}/> Retour</button>
                        <h2 className="text-2xl font-bold mb-2">Vos coordonnées</h2>
                        <p className="text-gray-500 mb-6 text-sm">Afin de vous envoyer la confirmation.</p>

                        <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100 shadow-inner">
                            <p className="flex justify-between mb-2 text-sm text-gray-600"><span>Prestation</span> <span className="font-bold text-black">{booking.service?.nom}</span></p>
                            <p className="flex justify-between mb-2 text-sm text-gray-600"><span>Date</span> <span className="font-bold text-black">{new Date(booking.date).toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'long'})} à {booking.time}</span></p>
                            <div className="border-t border-gray-200 my-2 pt-2 flex justify-between text-base">
                                <span>Total estimé</span> 
                                <span className="font-bold text-black">
                                    {booking.service?.is_starting_price ? '+ ' : ''}{booking.service?.prix} Dhs
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleConfirm} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Prénom</label><input required className="p-3.5 border rounded-xl w-full bg-white focus:ring-2 focus:ring-black outline-none font-medium" value={booking.client.prenom} onChange={e => setBooking({...booking, client: {...booking.client, prenom: e.target.value}})} /></div>
                                <div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nom</label><input required className="p-3.5 border rounded-xl w-full bg-white focus:ring-2 focus:ring-black outline-none font-medium" value={booking.client.nom} onChange={e => setBooking({...booking, client: {...booking.client, nom: e.target.value}})} /></div>
                            </div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Téléphone (Mobile)</label><input required type="tel" className="p-3.5 border rounded-xl w-full bg-white focus:ring-2 focus:ring-black outline-none font-bold tracking-wide" value={booking.client.tel} onChange={e => setBooking({...booking, client: {...booking.client, tel: e.target.value}})} /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Email (Optionnel)</label><input type="email" className="p-3.5 border rounded-xl w-full bg-white focus:ring-2 focus:ring-black outline-none" value={booking.client.email} onChange={e => setBooking({...booking, client: {...booking.client, email: e.target.value}})} /></div>
                            
                            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-xl mt-4 active:scale-95 transform">CONFIRMER LE RDV</button>
                        </form>
                    </div>
                )}

                {/* ÉTAPE 5 : SUCCÈS */}
                {step === 5 && (
                    <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-gray-50">
                        <div className="w-28 h-28 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce">
                            <CheckCircle size={56}/>
                        </div>
                        <h2 className="text-3xl font-extrabold mb-4 text-gray-900">Merci {booking.client.prenom} !</h2>
                        <p className="text-gray-600 mb-10 max-w-xs mx-auto leading-relaxed">
                            Votre rendez-vous est confirmé. Vous allez recevoir un message WhatsApp récapitulatif.
                        </p>
                        
                        <div className="bg-white border border-gray-200 shadow-lg p-8 rounded-3xl w-full max-w-sm mb-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                            <p className="uppercase text-xs font-bold tracking-widest text-gray-400 mb-4">Votre Ticket</p>
                            <p className="text-black font-black text-3xl mb-2">{booking.time}</p>
                            <p className="text-gray-800 font-bold text-lg mb-6 capitalize">{new Date(booking.date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'})}</p>
                            <div className="border-t border-dashed border-gray-300 my-4 pt-4">
                                <p className="font-medium text-gray-900">{booking.service?.nom}</p>
                                <p className="text-sm text-gray-500 mt-1">avec {booking.staff ? booking.staff.prenom : 'un membre de l\'équipe'}</p>
                            </div>
                        </div>

                        <button onClick={() => window.location.reload()} className="text-black font-bold underline text-sm hover:text-gray-600 transition">
                            Prendre un autre rendez-vous
                        </button>
                    </div>
                )}
            </div>
        </div>
        
        {step < 5 && <div className="p-4 text-center text-xs text-gray-400">© 2026 be COLOR Salon</div>}
    </div>
  );
}

function ServiceCard({ service, onClick }: { service: Service, onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full text-left p-4 bg-white border border-gray-100 rounded-xl hover:border-black hover:shadow-lg transition flex justify-between items-center group active:scale-95">
            <div className="flex-1">
                <span className="font-bold text-gray-800 block group-hover:text-black text-sm sm:text-base">{service.nom}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-medium bg-gray-50 w-fit px-2 py-0.5 rounded"><Clock size={10}/> {service.duree} min</span>
            </div>
            <div className="text-right">
                {service.is_starting_price && (
                    <span className="text-[10px] text-gray-400 uppercase block font-bold leading-none mb-1">À partir de</span>
                )}
                <span className="text-black font-bold bg-gray-100 px-3 py-1.5 rounded-lg group-hover:bg-black group-hover:text-white transition text-sm whitespace-nowrap">
                    {service.prix} MAD
                </span>
            </div>
        </button>
    )
}