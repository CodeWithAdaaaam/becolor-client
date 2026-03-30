'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';

interface Service { id: number; nom: string; }

interface Props {
  appointment: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangeServiceModal({ appointment, onClose, onSuccess }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceId, setNewServiceId] = useState<string>(appointment.service_id.toString());
  const [isLoading, setIsLoading] = useState(false);

  // Charger la liste de tous les services au démarrage
  useEffect(() => {
    const fetchServices = async () => {
      const res = await api.get('/services');
      setServices(res.data);
    };
    fetchServices();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.put(`/appointments/${appointment.id}/service`, { 
        newServiceId: Number(newServiceId) 
      });
      alert('Prestation modifiée avec succès !');
      onSuccess(); // Ferme le modal et rafraîchit l'agenda
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la modification. Vérifiez qu\'il n\'y a pas de conflit horaire.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm">
        <h3 className="font-bold text-lg mb-4">Changer la Prestation</h3>
        <p className="text-sm mb-1">Cliente: <span className="font-bold">{appointment.client.prenom} {appointment.client.nom}</span></p>
        <p className="text-sm mb-4">Date: <span className="font-bold">{new Date(appointment.date).toLocaleDateString('fr-FR')} à {new Date(appointment.heure_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></p>

        <div>
          <label className="block text-sm font-bold mb-1">Nouvelle Prestation</label>
          <select
            className="w-full p-2 border rounded"
            value={newServiceId}
            onChange={(e) => setNewServiceId(e.target.value)}
          >
            {services.map(service => (
              <option key={service.id} value={service.id}>{service.nom}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="text-gray-600">Annuler</button>
          <button 
            onClick={handleSave} 
            disabled={isLoading || newServiceId === appointment.service_id.toString()}
            className="bg-black text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}