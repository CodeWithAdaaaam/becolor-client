'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Save, Loader2 } from 'lucide-react';

// --- INTERFACE & PROPS ---

// Cette interface doit correspondre EXACTEMENT aux champs de votre modèle Prisma `FicheTechnique`
interface FicheData {
  id?: number;
  statut_client?: string;
  type_cheveux?: string;
  epaisseur?: string;
  densite?: string;
  cuir_chevelu?: string;
  longueur?: string;
  longueur_racines_cm?: string;
  porosite?: string;
  elasticite?: string;
  historique_chimique?: string; // Sera une string comme "COLORATION,DECOLORATION"
  problemes_constates?: string; // Sera une string comme "CASSANTS,FOURCHUS"
  style_souhaite?: string;
  couleur_desiree?: string;
  couleur_appliquee?: string;
  evenement_particulier?: string;
  test_meche?: boolean;
  resultat_test?: string;
  produits_recommandes?: string;
  temps_pose_estime?: string;
  precautions?: string;
  service_prevu?: string;
  duree_estimee_h?: string;
  produits_utilises?: string;
  resultat_obtenu?: string;
  conseils_post_service?: string;
  prochain_rdv_conseille?: string;
  remarques?: string;
}

interface Props {
  clientId: number;
}

// --- COMPOSANT ---

const FicheTechniqueForm: React.FC<Props> = ({ clientId }) => {
  const [fiche, setFiche] = useState<FicheData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- LOGIQUE DE GESTION DES DONNÉES ---

  // 1. Charger les données de la fiche au montage du composant
  useEffect(() => {
    const fetchFiche = async () => {
      if (!clientId) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/clients/${clientId}/fiche`);
        setFiche(res.data || {}); // Initialise un objet vide si la fiche est `null`
      } catch (error) {
        console.error("Erreur chargement fiche technique:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiche();
  }, [clientId]);

  // 2. Gérer les changements dans les inputs, textareas et selects
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Gère le cas de la checkbox "test_meche"
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    
    setFiche(prev => ({ ...prev, [name]: finalValue }));
  };
  
  // 3. Gérer les groupes de checkboxes (pour les champs à choix multiples)
  const handleCheckboxGroupChange = (name: keyof FicheData, value: string) => {
    const currentValues = fiche[name]?.split(',').filter(Boolean) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    setFiche(prev => ({ ...prev, [name]: newValues.join(',') }));
  };

  // 4. Sauvegarder les données
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await api.post(`/clients/${clientId}/fiche`, fiche);
      alert("Fiche technique sauvegardée avec succès !");
    } catch (e) {
      alert("Erreur lors de la sauvegarde de la fiche.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }, [clientId, fiche]);
  
  // --- AFFICHAGE ---

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center justify-center h-64">
        <Loader2 className="animate-spin" />
        <span className="ml-2">Chargement de la fiche...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6 sticky top-24">
      {/* En-tête et bouton de sauvegarde */}
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="text-lg font-bold">Fiche Technique Cliente</h3>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 disabled:bg-gray-400"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Section : Statut & Diagnostic */}
      <details open className="space-y-4">
        <summary className="font-bold cursor-pointer">Historique & Diagnostic</summary>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <SelectField label="Statut" name="statut_client" value={fiche.statut_client} onChange={handleChange} options={["PREMIERE_VISITE", "FIDELE", "OCCASIONNELLE"]} />
            <SelectField label="Type cheveux" name="type_cheveux" value={fiche.type_cheveux} onChange={handleChange} options={["RAIDES", "ONDULES", "BOUCLES", "CREPUS"]} />
            <SelectField label="Épaisseur" name="epaisseur" value={fiche.epaisseur} onChange={handleChange} options={["FINS", "MOYENS", "EPAIS"]} />
            <SelectField label="Densité" name="densite" value={fiche.densite} onChange={handleChange} options={["FAIBLE", "MOYENNE", "FORTE"]} />
            <SelectField label="Cuir chevelu" name="cuir_chevelu" value={fiche.cuir_chevelu} onChange={handleChange} options={["NORMAL", "SEC", "GRAS", "PELLICULES", "SENSIBLE"]} />
            <SelectField label="Longueur" name="longueur" value={fiche.longueur} onChange={handleChange} options={["COURT", "MI_LONG", "LONG"]} />
            <InputField label="Long. Racines" name="longueur_racines_cm" value={fiche.longueur_racines_cm} onChange={handleChange} placeholder="ex: 2cm" />
            <SelectField label="Porosité" name="porosite" value={fiche.porosite} onChange={handleChange} options={["FAIBLE", "MOYENNE", "FORTE"]} />
            <SelectField label="Élasticité" name="elasticite" value={fiche.elasticite} onChange={handleChange} options={["BONNE", "MOYENNE", "FAIBLE"]} />
        </div>
        <CheckboxGroup
            label="Historique chimique"
            name="historique_chimique"
            options={["Coloration", "Décoloration", "Lissage", "Permanente", "Aucune"]}
            value={fiche.historique_chimique}
            onChange={(val) => handleCheckboxGroupChange('historique_chimique', val)}
        />
        <CheckboxGroup
            label="Problèmes constatés"
            name="problemes_constates"
            options={["Cassants", "Fourchus", "Ternes", "Chute", "Autres"]}
            value={fiche.problemes_constates}
            onChange={(val) => handleCheckboxGroupChange('problemes_constates', val)}
        />
      </details>

      {/* Section : Objectifs & Technique */}
      <details className="space-y-4">
        <summary className="font-bold cursor-pointer">Objectifs & Technique</summary>
        <div className="pt-2 space-y-4">
            <TextAreaField label="Couleur désirée (objectifs)" name="couleur_desiree" value={fiche.couleur_desiree} onChange={handleChange} rows={2} />
            <TextAreaField label="Couleur/Formule appliquée habituellement" name="couleur_appliquee" value={fiche.couleur_appliquee} onChange={handleChange} rows={3} placeholder="ex: Majirel 5.1 (20g) + 6.0 (10g) avec Oxydant 20vol..." />
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <label className="text-sm font-bold text-red-800">Précautions / Allergies</label>
                <textarea name="precautions" className="w-full bg-transparent p-1 text-sm mt-1 focus:outline-none" rows={2} value={fiche.precautions || ''} onChange={handleChange} />
            </div>
            <div className="flex items-center gap-4">
                <label className="font-bold text-sm">Test de mèche ?</label>
                <input type="checkbox" name="test_meche" checked={!!fiche.test_meche} onChange={handleChange} className="h-5 w-5"/>
            </div>
        </div>
      </details>
      
      {/* Section : Plan & Suivi */}
      <details className="space-y-4">
        <summary className="font-bold cursor-pointer">Plan & Suivi</summary>
        <div className="pt-2 space-y-4">
          <TextAreaField label="Produits recommandés pour la maison" name="produits_recommandes" value={fiche.produits_recommandes} onChange={handleChange} rows={2} />
          <InputField label="Prochain RDV conseillé" name="prochain_rdv_conseille" value={fiche.prochain_rdv_conseille} onChange={handleChange} placeholder="ex: Dans 6 semaines, pour les racines"/>
        </div>
      </details>
      
      {/* Section : Remarques */}
      <details>
        <summary className="font-bold cursor-pointer">Remarques générales</summary>
        <TextAreaField label="" name="remarques" value={fiche.remarques} onChange={handleChange} rows={4} />
      </details>
    </div>
  );
};

export default FicheTechniqueForm;


// --- PETITS COMPOSANTS D'UI POUR SIMPLIFIER LE JSX ---

const InputField = ({ label, name, value, onChange, placeholder = '' }: any) => (
  <div>
    <label className="text-xs font-bold text-gray-500">{label}</label>
    <input type="text" name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full border rounded p-2 text-sm mt-1" />
  </div>
);

const TextAreaField = ({ label, name, value, onChange, rows = 2, placeholder = '' }: any) => (
  <div>
    {label && <label className="text-sm font-bold text-gray-700">{label}</label>}
    <textarea name={name} value={value || ''} onChange={onChange} rows={rows} placeholder={placeholder} className="w-full border rounded p-2 text-sm mt-1" />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }: any) => (
  <div>
    <label className="text-xs font-bold text-gray-500">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} className="w-full border rounded p-2 text-sm mt-1">
      <option value="">-</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt.replace(/_/g, ' ').charAt(0).toUpperCase() + opt.replace(/_/g, ' ').slice(1).toLowerCase()}</option>)}
    </select>
  </div>
);

const CheckboxGroup = ({ label, name, options, value, onChange }: any) => (
  <div>
    <label className="text-sm font-bold text-gray-700 block mb-2">{label}</label>
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {options.map((opt: string) => (
        <label key={opt} className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={value?.includes(opt) || false}
            onChange={() => onChange(opt)}
            className="h-4 w-4"
          />
          {opt}
        </label>
      ))}
    </div>
  </div>
);