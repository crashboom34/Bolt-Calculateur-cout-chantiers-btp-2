import React, { useState } from 'react';
import { PlusCircle, MinusCircle, Calculator, Save, X, ArrowRight } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../UI/Toast';
import { EstimationRequest, EstimationChantier, PosteTravail, obtenirEstimation } from '../../services/estimationAPI';
import { formatEuro } from '../../utils/calculsFiscaux';

// Schéma de validation pour le formulaire d'estimation
const EstimationFormSchema = z.object({
  reference: z.string().min(1, 'La référence est requise'),
  nom: z.string().min(1, 'Le nom du chantier est requis'),
  adresse: z.string().min(1, 'L\'adresse est requise'),
  surface: z.number().min(1, 'La surface doit être supérieure à 0'),
  typeConstruction: z.enum([
    'maison_individuelle', 
    'appartement', 
    'immeuble', 
    'local_commercial',
    'batiment_industriel',
    'renovation',
    'extension'
  ]),
  postes: z.array(z.object({
    id: z.string(),
    nom: z.string().min(1, 'Le nom du poste est requis'),
    description: z.string(),
    unite: z.string().min(1, 'L\'unité est requise'),
    quantite: z.number().min(0.1, 'La quantité doit être supérieure à 0')
  })).min(1, 'Au moins un poste de travail est requis'),
  commentaires: z.string().optional(),
  options: z.object({
    qualite: z.enum(['standard', 'premium', 'luxe']).default('standard'),
    delai: z.enum(['normal', 'urgent', 'tres_urgent']).default('normal'),
    difficulte: z.enum(['facile', 'moyen', 'difficile']).default('facile')
  })
});

type EstimationFormData = z.infer<typeof EstimationFormSchema>;

interface EstimationFormProps {
  onSaveEstimation: (estimation: EstimationChantier) => void;
  onCancel: () => void;
}

export const EstimationForm: React.FC<EstimationFormProps> = ({ onSaveEstimation, onCancel }) => {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [estimation, setEstimation] = useState<EstimationChantier | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<EstimationFormData>({
    resolver: zodResolver(EstimationFormSchema),
    defaultValues: {
      reference: `EST${Date.now().toString().slice(-6)}`,
      nom: '',
      adresse: '',
      surface: 0,
      typeConstruction: 'maison_individuelle',
      postes: [
        {
          id: `poste_${Date.now()}`,
          nom: 'Gros œuvre',
          description: 'Fondations, murs porteurs, planchers',
          unite: 'm²',
          quantite: 0
        }
      ],
      commentaires: '',
      options: {
        qualite: 'standard',
        delai: 'normal',
        difficulte: 'facile'
      }
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'postes'
  });

  const ajouterPoste = () => {
    append({
      id: `poste_${Date.now()}`,
      nom: '',
      description: '',
      unite: 'm²',
      quantite: 0
    });
  };

  const onSubmit = async (data: EstimationFormData) => {
    setIsLoading(true);
    try {
      const request: EstimationRequest = {
        reference: data.reference,
        nom: data.nom,
        adresse: data.adresse,
        surface: data.surface,
        typeConstruction: data.typeConstruction,
        postes: data.postes,
        commentaires: data.commentaires,
        options: data.options
      };

      const resultat = await obtenirEstimation(request);
      setEstimation(resultat);
      addToast({
        type: 'success',
        title: 'Estimation réussie',
        description: 'L\'estimation du chantier a été calculée avec succès'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur d\'estimation',
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sauvegarderEstimation = () => {
    if (estimation) {
      onSaveEstimation(estimation);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Estimation de chantier
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!estimation ? (
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
                  placeholder="EST001"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse du chantier *
                </label>
                <input
                  {...register('adresse')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 rue de la Paix, 75000 Paris"
                />
                {errors.adresse && (
                  <p className="text-red-600 text-sm mt-1">{errors.adresse.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de construction *
                </label>
                <select
                  {...register('typeConstruction')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="maison_individuelle">Maison individuelle</option>
                  <option value="appartement">Appartement</option>
                  <option value="immeuble">Immeuble</option>
                  <option value="local_commercial">Local commercial</option>
                  <option value="batiment_industriel">Bâtiment industriel</option>
                  <option value="renovation">Rénovation</option>
                  <option value="extension">Extension</option>
                </select>
                {errors.typeConstruction && (
                  <p className="text-red-600 text-sm mt-1">{errors.typeConstruction.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surface (m²) *
                </label>
                <input
                  {...register('surface', { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                />
                {errors.surface && (
                  <p className="text-red-600 text-sm mt-1">{errors.surface.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualité des matériaux
                </label>
                <select
                  {...register('options.qualite')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="luxe">Luxe</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Délai d'exécution
                </label>
                <select
                  {...register('options.delai')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="tres_urgent">Très urgent</option>
                </select>
