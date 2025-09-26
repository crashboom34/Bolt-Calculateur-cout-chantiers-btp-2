import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Plus, Clock, Trash2, Calculator } from 'lucide-react';
import { Chantier, Salarie, Materiau, ChantierFormData, ChantierFormSchema } from '../../schemas';
import { calculerCoutsChantier } from '../../services/costEngine';
import { formatEuro } from '../../utils/calculsFiscaux';
import { calculerCoutChantierSalarie } from '../../utils/calculsFiscaux';
import { useToast } from '../UI/Toast';

interface ChantierFormProps {
  chantier?: Chantier | null;
  salaries: Salarie[];
  materiaux: Materiau[];
  sousTraitants: SousTraitant[];
  onSave: (chantier: Chantier) => void;
  onCancel: () => void;
}

export const ChantierForm: React.FC<ChantierFormProps> = ({
  chantier,
  salaries,
  materiaux,
  sousTraitants,
  onSave,
  onCancel
}) => {
  const { addToast } = useToast();
  const isEditing = !!chantier;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ChantierFormData>({
    resolver: zodResolver(ChantierFormSchema),
    defaultValues: chantier ? {
      reference: chantier.reference,
      nom: chantier.nom,
      client: chantier.client,
      adresse: chantier.adresse,
      dateDebut: chantier.dateDebut,
      dateFin: chantier.dateFin,
      fraisGeneraux: chantier.fraisGeneraux,
      margeObjectif: chantier.margeObjectif,
      prixVenteHT: chantier.prixVenteHT,
      prixVenteTTC: chantier.prixVenteTTC,
      status: chantier.status,
      tags: chantier.tags,
      notes: chantier.notes
    } : {
      reference: `CH${Date.now()}`,
      fraisGeneraux: 15,
      margeObjectif: 20,
      status: 'prospect',
      tags: [],
      client: {
        nom: '',
        adresse: ''
      }
    }
  });

  // États locaux pour la gestion des salariés et matériaux
  const [chantierSalaries, setChantierSalaries] = useState(chantier?.salaries || []);
  const [chantierMateriaux, setChantierMateriaux] = useState(chantier?.materiaux || []);
  const [chantierSousTraitants, setChantierSousTraitants] = useState(chantier?.sousTraitants || []);
  const [showSalarieForm, setShowSalarieForm] = useState(false);
  const [showMateriauForm, setShowMateriauForm] = useState(false);
  const [showSousTraitantForm, setShowSousTraitantForm] = useState(false);
  const [showPresenceForm, setShowPresenceForm] = useState<string | null>(null);

  // États pour les formulaires d'ajout
  const [selectedSalarieId, setSelectedSalarieId] = useState('');
  const [selectedSousTraitantId, setSelectedSousTraitantId] = useState('');
  const [newMateriau, setNewMateriau] = useState({
    materiauId: '',
    quantite: '',
    prixUnitaireReel: '',
    tauxTVA: '20' as const
  });
  const [newSousTraitant, setNewSousTraitant] = useState({
    sousTraitantId: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    montantForfait: '',
    notes: ''
  });
  const [newPresence, setNewPresence] = useState({
    date: '',
    heuresPresence: '8',
    heuresSupplementaires: '0',
    tacheDescription: '',
    commentaire: ''
  });

  // Calculs en temps réel
  const couts = React.useMemo(() => {
    const chantierTemp: Chantier = {
      id: chantier?.id || 'temp',
      reference: watch('reference') || '',
      nom: watch('nom') || '',
      client: watch('client') || { nom: '', adresse: '' },
      adresse: watch('adresse') || '',
      dateDebut: watch('dateDebut') || '',
      dateFin: watch('dateFin'),
      dateCreation: chantier?.dateCreation || new Date().toISOString(),
      salaries: chantierSalaries,
      materiaux: chantierMateriaux,
      sousTraitants: chantierSousTraitants,
      fraisGeneraux: watch('fraisGeneraux') || 15,
      margeObjectif: watch('margeObjectif') || 20,
      coutMainOeuvre: 0,
      coutMateriaux: 0,
      coutSousTraitance: 0,
      coutTotal: 0,
      prixVenteHT: watch('prixVenteHT'),
      prixVenteTTC: watch('prixVenteTTC'),
      status: watch('status') || 'prospect',
      echeancier: chantier?.echeancier || [],
      tags: watch('tags') || [],
      notes: watch('notes'),
      version: chantier?.version || 1
    };

    return calculerCoutsChantier(chantierTemp, salaries, materiaux, sousTraitants);
  }, [chantierSalaries, chantierMateriaux, chantierSousTraitants, watch, chantier, salaries, materiaux, sousTraitants]);

  // Gestion des salariés
  const ajouterSalarieChantier = () => {
    if (!selectedSalarieId) return;

    const nouveauChantierSalarie = {
      salarieId: selectedSalarieId,
      presences: [],
      coutTotal: 0
    };

    setChantierSalaries([...chantierSalaries, nouveauChantierSalarie]);
    setSelectedSalarieId('');
    setShowSalarieForm(false);
    
    addToast({
      type: 'success',
      title: 'Salarié ajouté',
      description: 'Le salarié a été ajouté au chantier'
    });
  };

  const ajouterPresence = (salarieId: string) => {
    if (!newPresence.date || !newPresence.heuresPresence) return;

    const presence = {
      date: newPresence.date,
      heuresPresence: parseFloat(newPresence.heuresPresence),
      heuresSupplementaires: parseFloat(newPresence.heuresSupplementaires) || 0,
      tacheDescription: newPresence.tacheDescription || undefined,
      commentaire: newPresence.commentaire || undefined
    };

    setChantierSalaries(prev => prev.map(cs => {
      if (cs.salarieId === salarieId) {
        const nouvelles = [...cs.presences, presence];
        const salarie = salaries.find(s => s.id === salarieId);
        if (salarie) {
          const totalHeures = nouvelles.reduce((sum, p) => sum + p.heuresPresence, 0);
          const totalHeuresSupp = nouvelles.reduce((sum, p) => sum + p.heuresSupplementaires, 0);
          const coutTotal = calculerCoutChantierSalarie(salarie.tauxHoraire, totalHeures, totalHeuresSupp);
          return { ...cs, presences: nouvelles, coutTotal };
        }
      }
      return cs;
    }));

    setNewPresence({
      date: '',
      heuresPresence: '8',
      heuresSupplementaires: '0',
      tacheDescription: '',
      commentaire: ''
    });
    setShowPresenceForm(null);
    
    addToast({
      type: 'success',
      title: 'Présence ajoutée',
      description: 'La journée de travail a été enregistrée'
    });
  };

  // Gestion des matériaux
  const ajouterMateriauChantier = () => {
    if (!newMateriau.materiauId || !newMateriau.quantite) return;

    const materiau = materiaux.find(m => m.id === newMateriau.materiauId);
    if (!materiau) return;

    const quantite = parseFloat(newMateriau.quantite);
    const prixUnitaire = newMateriau.prixUnitaireReel 
      ? parseFloat(newMateriau.prixUnitaireReel)
      : materiau.prixUnitaire;
    
    const coutHT = prixUnitaire * quantite;
    const tva = coutHT * (parseFloat(newMateriau.tauxTVA) / 100);
    const coutTTC = coutHT + tva;

    const chantierMateriau = {
      materiauId: newMateriau.materiauId,
      quantite,
      prixUnitaireReel: newMateriau.prixUnitaireReel ? prixUnitaire : undefined,
      tauxTVA: newMateriau.tauxTVA,
      coutHT,
      coutTTC
    };

    setChantierMateriaux([...chantierMateriaux, chantierMateriau]);
    setNewMateriau({
      materiauId: '',
      quantite: '',
      prixUnitaireReel: '',
      tauxTVA: '20'
    });
    setShowMateriauForm(false);
    
    addToast({
      type: 'success',
      title: 'Matériau ajouté',
      description: 'Le matériau a été ajouté au chantier'
    });
  };

  // Gestion des sous-traitants
  const ajouterSousTraitantChantier = () => {
    if (!newSousTraitant.sousTraitantId || !newSousTraitant.description || !newSousTraitant.montantForfait) return;

    const chantierSousTraitant = {
      sousTraitantId: newSousTraitant.sousTraitantId,
      description: newSousTraitant.description,
      dateDebut: newSousTraitant.dateDebut,
      dateFin: newSousTraitant.dateFin || undefined,
      montantForfait: parseFloat(newSousTraitant.montantForfait),
      coutTotal: parseFloat(newSousTraitant.montantForfait),
      statut: 'prevu' as const,
      notes: newSousTraitant.notes || undefined
    };

    setChantierSousTraitants([...chantierSousTraitants, chantierSousTraitant]);
    setNewSousTraitant({
      sousTraitantId: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      montantForfait: '',
      notes: ''
    });
    setShowSousTraitantForm(false);
    
    addToast({
      type: 'success',
      title: 'Sous-traitant ajouté',
      description: 'La prestation a été ajoutée au chantier'
    });
  };

  const onSubmit = (data: ChantierFormData) => {
    const chantierComplet: Chantier = {
      id: chantier?.id || Date.now().toString(),
      ...data,
      dateCreation: chantier?.dateCreation || new Date().toISOString(),
      salaries: chantierSalaries,
      materiaux: chantierMateriaux,
      sousTraitants: chantierSousTraitants,
      coutMainOeuvre: couts.coutMainOeuvre,
      coutMateriaux: couts.coutMateriaux,
      coutSousTraitance: couts.coutSousTraitance,
      coutTotal: couts.coutTotal,
      margeReelle: couts.margeReelle,
      echeancier: chantier?.echeancier || [],
      version: chantier?.version || 1
    };

    onSave(chantierComplet);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {isEditing ? 'Modifier le chantier' : 'Nouveau chantier'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-4">Informations générales</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence *
              </label>
              <input
                {...register('reference')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="CH2024001"
              />
              {errors.reference && (
                <p className="text-red-600 text-sm mt-1">{errors.reference.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du chantier *
              </label>
              <input
                {...register('nom')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rénovation maison Dupont"
              />
              {errors.nom && (
                <p className="text-red-600 text-sm mt-1">{errors.nom.message}</p>
              )}
            </div>
          </div>

          {/* Informations client */}
          <div className="mt-4">
            <h5 className="font-medium text-gray-700 mb-3">Client</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du client *
                </label>
                <input
                  {...register('client.nom')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="M. Dupont"
                />
                {errors.client?.nom && (
                  <p className="text-red-600 text-sm mt-1">{errors.client.nom.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  {...register('client.telephone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse client *
                </label>
                <input
                  {...register('client.adresse')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 rue de la Paix, Montpellier"
                />
                {errors.client?.adresse && (
                  <p className="text-red-600 text-sm mt-1">{errors.client.adresse.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register('client.email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="client@email.com"
                />
                {errors.client?.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.client.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Détails chantier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse chantier *
              </label>
              <input
                {...register('adresse')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="456 avenue des Travaux, Montpellier"
              />
              {errors.adresse && (
                <p className="text-red-600 text-sm mt-1">{errors.adresse.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="prospect">Prospect</option>
                <option value="devis">Devis envoyé</option>
                <option value="en_cours">En cours</option>
                <option value="livre">Livré</option>
                <option value="facture">Facturé</option>
                <option value="paye">Payé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début *
              </label>
              <input
                {...register('dateDebut')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.dateDebut && (
                <p className="text-red-600 text-sm mt-1">{errors.dateDebut.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                {...register('dateFin')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frais généraux (%)
              </label>
              <input
                {...register('fraisGeneraux', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marge objectif (%)
              </label>
              <input
                {...register('margeObjectif', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix vente HT (€)
              </label>
              <input
                {...register('prixVenteHT', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Prix proposé au client"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix vente TTC (€)
              </label>
              <input
                {...register('prixVenteTTC', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Prix TTC client"
              />
            </div>
          </div>
        </div>

        {/* Section Main d'œuvre */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              Main d'œuvre - Suivi temps détaillé
            </h4>
            <button
              type="button"
              onClick={() => setShowSalarieForm(!showSalarieForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter salarié
            </button>
          </div>

          {showSalarieForm && (
            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <select
                  value={selectedSalarieId}
                  onChange={(e) => setSelectedSalarieId(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir un salarié</option>
                  {salaries
                    .filter(s => s.actif && !chantierSalaries.some(cs => cs.salarieId === s.id))
                    .map((salarie) => (
                      <option key={salarie.id} value={salarie.id}>
                        {salarie.prenom} {salarie.nom} - {formatEuro(salarie.tauxHoraire)}/h
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={ajouterSalarieChantier}
                  disabled={!selectedSalarieId}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {/* Liste des salariés avec gestion des présences */}
          {chantierSalaries.map((cs) => {
            const salarie = salaries.find(s => s.id === cs.salarieId);
            if (!salarie) return null;

            const totalHeures = cs.presences.reduce((sum, p) => sum + p.heuresPresence, 0);
            const totalHeuresSupp = cs.presences.reduce((sum, p) => sum + p.heuresSupplementaires, 0);
            const nombreJours = cs.presences.length;

            return (
              <div key={cs.salarieId} className="bg-white rounded-lg border border-blue-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h5 className="font-semibold text-gray-800">
                        {salarie.prenom} {salarie.nom}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {formatEuro(salarie.tauxHoraire)}/h • {nombreJours} jours • {totalHeures}h
                        {totalHeuresSupp > 0 && ` (${totalHeuresSupp}h supp.)`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {formatEuro(cs.coutTotal)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPresenceForm(showPresenceForm === cs.salarieId ? null : cs.salarieId)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm transition-colors flex items-center"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      {showPresenceForm === cs.salarieId ? 'Fermer' : 'Ajouter jour'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChantierSalaries(prev => prev.filter(s => s.salarieId !== cs.salarieId))}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Formulaire d'ajout de présence */}
                {showPresenceForm === cs.salarieId && (
                  <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                    <h6 className="font-medium text-gray-800 mb-3">Ajouter une journée de travail</h6>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={newPresence.date}
                          onChange={(e) => setNewPresence({ ...newPresence, date: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Heures</label>
                        <input
                          type="number"
                          step="0.5"
                          value={newPresence.heuresPresence}
                          onChange={(e) => setNewPresence({ ...newPresence, heuresPresence: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">H. supp.</label>
                        <input
                          type="number"
                          step="0.5"
                          value={newPresence.heuresSupplementaires}
                          onChange={(e) => setNewPresence({ ...newPresence, heuresSupplementaires: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tâche</label>
                        <input
                          type="text"
                          value={newPresence.tacheDescription}
                          onChange={(e) => setNewPresence({ ...newPresence, tacheDescription: e.target.value })}
                          placeholder="Maçonnerie"
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Commentaire</label>
                        <input
                          type="text"
                          value={newPresence.commentaire}
                          onChange={(e) => setNewPresence({ ...newPresence, commentaire: e.target.value })}
                          placeholder="Optionnel"
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => ajouterPresence(cs.salarieId)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center justify-center"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liste des présences */}
                {cs.presences.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-sm font-medium text-gray-700">Présences enregistrées:</h6>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {cs.presences.map((presence, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">
                              {new Date(presence.date).toLocaleDateString('fr-FR', { 
                                weekday: 'short', 
                                day: '2-digit', 
                                month: '2-digit' 
                              })}
                            </span>
                            <span className="text-blue-600">
                              {presence.heuresPresence}h
                              {presence.heuresSupplementaires > 0 && (
                                <span className="text-orange-600"> +{presence.heuresSupplementaires}h supp.</span>
                              )}
                            </span>
                            {presence.tacheDescription && (
                              <span className="text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded">
                                {presence.tacheDescription}
                              </span>
                            )}
                            {presence.commentaire && (
                              <span className="text-gray-500 italic">"{presence.commentaire}"</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-green-600">
                              {formatEuro(calculerCoutChantierSalarie(
                                salarie.tauxHoraire, 
                                presence.heuresPresence, 
                                presence.heuresSupplementaires
                              ))}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setChantierSalaries(prev => prev.map(cs_inner => {
                                  if (cs_inner.salarieId === cs.salarieId) {
                                    const nouvelles = cs_inner.presences.filter((_, i) => i !== index);
                                    const totalHeures = nouvelles.reduce((sum, p) => sum + p.heuresPresence, 0);
                                    const totalHeuresSupp = nouvelles.reduce((sum, p) => sum + p.heuresSupplementaires, 0);
                                    const coutTotal = calculerCoutChantierSalarie(salarie.tauxHoraire, totalHeures, totalHeuresSupp);
                                    return { ...cs_inner, presences: nouvelles, coutTotal };
                                  }
                                  return cs_inner;
                                }));
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section Matériaux */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-800">Matériaux et fournitures</h4>
            <button
              type="button"
              onClick={() => setShowMateriauForm(!showMateriauForm)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter matériau
            </button>
          </div>

          {showMateriauForm && (
            <div className="bg-white rounded-lg p-4 mb-4 border border-orange-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  value={newMateriau.materiauId}
                  onChange={(e) => setNewMateriau({ ...newMateriau, materiauId: e.target.value })}
                  className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Choisir un matériau</option>
                  {materiaux.filter(m => m.actif).map((materiau) => (
                    <option key={materiau.id} value={materiau.id}>
                      {materiau.nom} ({formatEuro(materiau.prixUnitaire)}/{materiau.unite})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={newMateriau.quantite}
                  onChange={(e) => setNewMateriau({ ...newMateriau, quantite: e.target.value })}
                  placeholder="Quantité"
                  className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newMateriau.prixUnitaireReel}
                  onChange={(e) => setNewMateriau({ ...newMateriau, prixUnitaireReel: e.target.value })}
                  placeholder="Prix réel (opt.)"
                  className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                />
                <select
                  value={newMateriau.tauxTVA}
                  onChange={(e) => setNewMateriau({ ...newMateriau, tauxTVA: e.target.value as any })}
                  className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                >
                  <option value="5.5">TVA 5,5%</option>
                  <option value="10">TVA 10%</option>
                  <option value="20">TVA 20%</option>
                </select>
                <button
                  type="button"
                  onClick={ajouterMateriauChantier}
                  disabled={!newMateriau.materiauId || !newMateriau.quantite}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {chantierMateriaux.length > 0 && (
            <div className="space-y-2">
              {chantierMateriaux.map((cm, index) => {
                const materiau = materiaux.find(m => m.id === cm.materiauId);
                const prixUnitaire = cm.prixUnitaireReel || materiau?.prixUnitaire || 0;
                return (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border border-orange-200">
                    <div className="flex-1">
                      <span className="font-medium">{materiau?.nom}</span>
                      <div className="text-sm text-gray-600">
                        {cm.quantite} {materiau?.unite} × {formatEuro(prixUnitaire)} = {formatEuro(cm.coutHT)} HT
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          TVA {cm.tauxTVA}%: {formatEuro(cm.coutTTC - cm.coutHT)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="font-semibold text-orange-600">{formatEuro(cm.coutTTC)} TTC</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChantierMateriaux(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section Sous-traitance */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-800">Sous-traitance</h4>
            <button
              type="button"
              onClick={() => setShowSousTraitantForm(!showSousTraitantForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter prestation
            </button>
          </div>

          {showSousTraitantForm && (
            <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sous-traitant
                  </label>
                  <select
                    value={newSousTraitant.sousTraitantId}
                    onChange={(e) => setNewSousTraitant({ ...newSousTraitant, sousTraitantId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Choisir un sous-traitant</option>
                    {sousTraitants.filter(st => st.actif).map((sousTraitant) => (
                      <option key={sousTraitant.id} value={sousTraitant.id}>
                        {sousTraitant.entreprise} - {sousTraitant.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description de la prestation *
                  </label>
                  <input
                    type="text"
                    value={newSousTraitant.description}
                    onChange={(e) => setNewSousTraitant({ ...newSousTraitant, description: e.target.value })}
                    placeholder="Installation électrique complète"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={newSousTraitant.dateDebut}
                    onChange={(e) => setNewSousTraitant({ ...newSousTraitant, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date fin (optionnel)
                  </label>
                  <input
                    type="date"
                    value={newSousTraitant.dateFin}
                    onChange={(e) => setNewSousTraitant({ ...newSousTraitant, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant forfaitaire (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSousTraitant.montantForfait}
                    onChange={(e) => setNewSousTraitant({ ...newSousTraitant, montantForfait: e.target.value })}
                    placeholder="1500.00"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newSousTraitant.notes}
                    onChange={(e) => setNewSousTraitant({ ...newSousTraitant, notes: e.target.value })}
                    placeholder="Notes sur la prestation"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={ajouterSousTraitantChantier}
                  disabled={!newSousTraitant.sousTraitantId || !newSousTraitant.description || !newSousTraitant.montantForfait}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Ajouter la prestation
                </button>
              </div>
            </div>
          )}

          {chantierSousTraitants.length > 0 && (
            <div className="space-y-2">
              {chantierSousTraitants.map((cst, index) => {
                const sousTraitant = sousTraitants.find(st => st.id === cst.sousTraitantId);
                return (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border border-purple-200">
                    <div className="flex-1">
                      <div className="font-medium">{sousTraitant?.entreprise} - {sousTraitant?.nom}</div>
                      <div className="text-sm text-gray-600">{cst.description}</div>
                      <div className="text-xs text-gray-500">
                        {cst.dateDebut && `Du ${new Date(cst.dateDebut).toLocaleDateString('fr-FR')}`}
                        {cst.dateFin && ` au ${new Date(cst.dateFin).toLocaleDateString('fr-FR')}`}
                        {cst.notes && ` • ${cst.notes}`}
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="font-semibold text-purple-600">{formatEuro(cst.montantForfait)}</div>
                      <div className="text-xs text-gray-500 capitalize">{cst.statut.replace('_', ' ')}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChantierSousTraitants(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Récapitulatif financier en temps réel */}
        {(chantierSalaries.length > 0 || chantierMateriaux.length > 0 || chantierSousTraitants.length > 0) && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center mb-4">
              <Calculator className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-semibold text-gray-800">Récapitulatif financier</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <span className="text-gray-600 block">Main d'œuvre:</span>
                <div className="font-semibold text-blue-600 text-lg">{formatEuro(couts.coutMainOeuvre)}</div>
                <div className="text-xs text-gray-500">
                  {chantierSalaries.reduce((sum, cs) => sum + cs.presences.reduce((s, p) => s + p.heuresPresence, 0), 0)}h total
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <span className="text-gray-600 block">Matériaux:</span>
                <div className="font-semibold text-orange-600 text-lg">{formatEuro(couts.coutMateriaux)}</div>
                <div className="text-xs text-gray-500">
                  {chantierMateriaux.length} référence(s)
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <span className="text-gray-600 block">Sous-traitance:</span>
                <div className="font-semibold text-purple-600 text-lg">{formatEuro(couts.coutSousTraitance)}</div>
                <div className="text-xs text-gray-500">
                  {chantierSousTraitants.length} prestation(s)
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <span className="text-gray-600 block">Frais généraux:</span>
                <div className="font-semibold text-gray-600 text-lg">
                  {formatEuro(couts.fraisGeneraux)}
                </div>
                <div className="text-xs text-gray-500">{watch('fraisGeneraux')}%</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                <span className="text-gray-600 block">Coût total:</span>
                <div className="font-bold text-green-600 text-xl">{formatEuro(couts.coutTotal)}</div>
                {couts.margeReelle !== undefined && (
                  <div className={`text-xs ${couts.margeReelle >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Marge: {couts.margeReelle.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {/* Prix de vente recommandé */}
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Prix de vente recommandé (marge {watch('margeObjectif')}%):</strong>
                <span className="ml-2 font-bold">{formatEuro(couts.prixVenteRecommande)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes et observations
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Notes internes, spécificités du chantier..."
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {isEditing ? 'Sauvegarder les modifications' : 'Créer le chantier'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-3 rounded-md transition-colors duration-200"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};
