'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, FileDown, FlaskConical, History, Phone, X } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslations, useLocale } from 'next-intl'; // <--- IMPORTS

import FicheTechniqueForm from '@/components/FicheTechniqueForm';

// --- FONCTIONS UTILITAIRES ---

const getBase64FromUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType?.startsWith('image/')) return "";
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) { return ""; }
};

// --- INTERFACES ---

interface Appointment {
  id: number; date: string; statut: string; prix: number;
  services: { nom: string }[]; notes_internes?: string; user?: { prenom: string };
}
interface ColorationHistory {
  appointment_id: number; formule_utilisee?: string;
  couleur_appliquee?: string; resultat?: string;
}
interface ClientDetails {
  id: number; nom: string; prenom: string; tel_principal: string;
  email: string | null; date_naissance: string | null;
  appointments: Appointment[]; coloration_history: ColorationHistory[];
}
interface FicheData {
  precautions?: string; type_cheveux?: string; epaisseur?: string;
  densite?: string; porosite?: string; cuir_chevelu?: string;
  elasticite?: string; historique_chimique?: string; problemes_constates?: string;
  couleur_desiree?: string; couleur_appliquee?: string; produits_recommandes?: string;
}

// --- COMPOSANT PRINCIPAL ---

export default function ClientDetailPage() {
  const t = useTranslations('ClientDetailsPage'); // <--- HOOK TRADUCTION
  const locale = useLocale(); // <--- HOOK LOCALE
  const params = useParams();

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRdvId, setSelectedRdvId] = useState<number | null>(null);
  const [historyForm, setHistoryForm] = useState({ formule: '', technique: '', resultat: '' });

  // Fonction pour calculer l'âge avec traduction
  const calculateAge = (birthdate: string | null | undefined): string => {
    if (!birthdate) return t('na');
    try {
      const birthDate = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? t('age', { count: age }) : t('ageInf');
    } catch { return t('na'); }
  };

  const fetchClient = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await api.get(`/clients/${params.id}`);
      setClient(res.data);
    } catch (err) { console.error("Failed to fetch client:", err); }
  }, [params.id]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  const openHistoryModal = useCallback((rdvId: number) => {
    setSelectedRdvId(rdvId);
    const existingHistory = client?.coloration_history.find(h => h.appointment_id === rdvId);
    setHistoryForm({
      formule: existingHistory?.formule_utilisee || '',
      technique: existingHistory?.couleur_appliquee || '',
      resultat: existingHistory?.resultat || ''
    });
    setShowHistoryModal(true);
  }, [client]);

  const handleSaveHistory = useCallback(async () => {
    if (!selectedRdvId || !client) return;
    try {
      await api.post(`/clients/${client.id}/history/${selectedRdvId}`, historyForm);
      setShowHistoryModal(false);
      fetchClient();
      alert(t('modal.success'));
    } catch (e) {
      alert("Erreur lors de la sauvegarde.");
    }
  }, [selectedRdvId, client, historyForm, fetchClient, t]);

  // --- PDF GENERATION (Reste en Français pour compatibilité technique) ---
  const generateFullPDF = useCallback(async () => {
    if (!client) return;
    let ficheData: FicheData | null = null;
    try {
      const res = await api.get(`/clients/${client.id}/fiche`);
      ficheData = res.data;
    } catch (e) { console.error("PDF Error", e); }

    const doc = new jsPDF();
    let startY = 20;

    const logo = await getBase64FromUrl('/logo_becolor.png');
    if (logo) doc.addImage(logo, 'PNG', 15, 10, 25, 25);

    doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text("be COLOR", 195, 22, { align: 'right' });
    doc.setFontSize(12); doc.setFont("helvetica", "normal");
    doc.text("Fiche Technique Client", 195, 29, { align: 'right' });
    startY = 45;

    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(`${client.prenom} ${client.nom.toUpperCase()}`, 15, startY);
    startY += 8;

    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    // Note: On garde les labels PDF en français pour éviter les bugs d'encodage arabe sans font custom
    doc.text(`Téléphone :`, 15, startY);
    doc.text(client.tel_principal || 'N/A', 45, startY);
    doc.text(`Age :`, 100, startY);

    // Calcul age basique pour le PDF (évite le mélange arabe/latin dans jsPDF)
    const birthDate = client.date_naissance ? new Date(client.date_naissance) : null;
    let ageStr = "N/A";
    if (birthDate) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      ageStr = `${age} ans`;
    }
    doc.text(ageStr, 120, startY);

    startY += 5;
    doc.text(`Email :`, 15, startY);
    doc.text(client.email || 'N/A', 45, startY);
    startY += 8;
    doc.line(15, startY, 195, startY);
    startY += 8;

    if (ficheData?.precautions) {
      doc.setFillColor(255, 235, 238);
      doc.rect(15, startY - 4, 180, 10, 'F');
      doc.setTextColor(220, 38, 38);
      doc.setFont("helvetica", "bold");
      doc.text(`⚠️ PRÉCAUTIONS / ALLERGIES : ${ficheData.precautions}`, 17, startY);
      doc.setTextColor(0, 0, 0);
      startY += 12;
    }

    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("Diagnostic Capillaire", 15, startY);
    startY += 6;
    doc.setFontSize(9);

    const diagnosticItems = [
      { label: 'Type de cheveux', value: ficheData?.type_cheveux }, { label: 'Épaisseur', value: ficheData?.epaisseur },
      { label: 'Densité', value: ficheData?.densite }, { label: 'Porosité', value: ficheData?.porosite },
      { label: 'Cuir chevelu', value: ficheData?.cuir_chevelu }, { label: 'Élasticité', value: ficheData?.elasticite },
    ];

    diagnosticItems.forEach((item, index) => {
      if (index % 2 === 0 && index > 0) startY += 5;
      const xPos = (index % 2 === 0) ? 20 : 110;
      doc.setFont("helvetica", "bold"); doc.text(`${item.label} :`, xPos, startY);
      doc.setFont("helvetica", "normal"); doc.text(item.value?.replace(/_/g, ' ').toLowerCase() || '-', xPos + 35, startY);
    });
    startY += 8;

    const drawWrappedText = (title: string, text: string | undefined, currentY: number) => {
      if (!text) return currentY;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold"); doc.text(title + " :", 15, currentY);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(text.replace(/,/g, ', '), 180);
      doc.text(splitText, 15, currentY + 4);
      return currentY + (splitText.length * 4) + 4;
    };
    startY = drawWrappedText("Historique chimique", ficheData?.historique_chimique, startY);
    startY = drawWrappedText("Problèmes constatés", ficheData?.problemes_constates, startY);
    startY += 4;
    doc.line(15, startY, 195, startY);
    startY += 8;

    startY = drawWrappedText("Objectifs / Couleur désirée", ficheData?.couleur_desiree, startY);
    startY = drawWrappedText("Formule de base / habituelle", ficheData?.couleur_appliquee, startY);
    startY = drawWrappedText("Produits recommandés", ficheData?.produits_recommandes, startY);
    startY += 4;

    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("Historique des Visites", 15, startY);

    const tableColumn = ["Date", "Service", "Technique", "Formule", "Résultat"];
    const tableRows = client.appointments.map(apt => {
      const hist = client.coloration_history.find(h => h.appointment_id === apt.id);
      return [
        new Date(apt.date).toLocaleDateString('fr-FR'), apt.services?.map(s => s.nom).join(', ') || '-',
        hist?.couleur_appliquee || '-', hist?.formule_utilisee || '-', hist?.resultat || '-'
      ];
    });

    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: startY + 2,
      theme: 'grid', headStyles: { fillColor: [22, 22, 22] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 2: { cellWidth: 40 }, 3: { cellWidth: 40 } }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Fiche de ${client.prenom} ${client.nom} - Page ${i}/${pageCount}`, 15, doc.internal.pageSize.height - 10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 195, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    doc.save(`Fiche_Client_${client.nom}_${client.prenom}.pdf`);
  }, [client]);

  // --- AFFICHAGE ---

  if (!client) return <div className="p-8 text-center">{t('loading')}</div>;

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <Link href="/dashboard/clients" className="flex items-center gap-2 text-gray-500 hover:text-black mb-4 group">
        <ArrowLeft size={20} className="rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition" />
        {t('backToList')}
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl font-bold">
            {client.prenom[0]}{client.nom[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.prenom} {client.nom}</h1>
            <p className="text-gray-500 flex items-center gap-2">
              <Phone size={14} />
              <span dir="ltr">{client.tel_principal}</span> {/* Force LTR pour le numéro */}
            </p>
            <p className="text-sm text-gray-400 mt-1">{calculateAge(client.date_naissance)}</p>
          </div>
        </div>
        <button onClick={generateFullPDF} className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 shadow-md mt-4 md:mt-0 w-full md:w-auto justify-center">
          <FileDown size={18} /> {t('exportPdf')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><History /> {t('historyTitle')}</h2>
          <div className="space-y-4">
            {client.appointments.map((apt) => {
              const hist = client.coloration_history.find(h => h.appointment_id === apt.id);
              return (
                <div key={apt.id} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-lg block sm:inline">{apt.services?.map(s => s.nom).join(', ') || '-'}</span>
                      {/* Date adaptative selon la locale */}
                      <span className="text-gray-500 text-sm sm:ms-2 block sm:inline">
                        {new Date(apt.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${apt.statut === 'TERMINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                      {apt.statut}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mt-2">
                    {hist ? (
                      <div className="space-y-1">
                        <p><span className="font-bold text-purple-700">{t('cards.formula')}</span> {hist.formule_utilisee}</p>
                        <p><span className="font-bold">{t('cards.technique')}</span> {hist.couleur_appliquee}</p>
                      </div>
                    ) : (<p className="text-gray-400 italic">{t('cards.noNote')}</p>)}
                    <button onClick={() => openHistoryModal(apt.id)} className="mt-3 text-purple-600 font-bold text-xs flex items-center gap-1 hover:underline">
                      <FlaskConical size={14} /> {hist ? t('cards.editNote') : t('cards.addNote')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {/* Le composant formulaire technique reste inchangé pour l'instant */}
          <FicheTechniqueForm clientId={client.id} />
        </div>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl flex items-center gap-2"><FlaskConical /> {t('modal.title')}</h3>
              <button onClick={() => setShowHistoryModal(false)}><X /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">{t('modal.formulaLabel')}</label>
                <textarea rows={3} className="w-full p-2 border rounded font-mono text-sm bg-gray-50" value={historyForm.formule} onChange={e => setHistoryForm({ ...historyForm, formule: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{t('modal.techniqueLabel')}</label>
                <input type="text" className="w-full p-2 border rounded" value={historyForm.technique} onChange={e => setHistoryForm({ ...historyForm, technique: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{t('modal.resultLabel')}</label>
                <input type="text" className="w-full p-2 border rounded" value={historyForm.resultat} onChange={e => setHistoryForm({ ...historyForm, resultat: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={handleSaveHistory} className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
                {t('modal.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}