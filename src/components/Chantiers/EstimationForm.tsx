import React, { useState } from 'react';
import { PlusCircle, MinusCircle, Calculator, Save, X, ArrowRight } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../UI/Toast';
import { EstimationRequest, EstimationChantier, obtenirEstimation } from '../../services/estimationAPI';
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
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="sr-only">Fermer le formulaire</span>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {!estimation ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-800">Informations générales</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reference">
                  Référence *
                </label>
                <input
                  id="reference"
                  {...register('reference')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="EST001"
                />
                {errors.reference && (
                  <p className="text-red-600 text-sm mt-1">{errors.reference.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nom-chantier">
                  Nom du chantier *
                </label>
                <input
                  id="nom-chantier"
                  {...register('nom')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rénovation maison Dupont"
                />
                {errors.nom && (
                  <p className="text-red-600 text-sm mt-1">{errors.nom.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="adresse-chantier">
                  Adresse du chantier *
                </label>
                <input
                  id="adresse-chantier"
                  {...register('adresse')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 rue de la Paix, 75000 Paris"
                />
                {errors.adresse && (
                  <p className="text-red-600 text-sm mt-1">{errors.adresse.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="type-construction">
                  Type de construction *
                </label>
                <select
                  id="type-construction"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="surface-chantier">
                  Surface (m²) *
                </label>
                <input
                  id="surface-chantier"
                  {...register('surface', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                />
                {errors.surface && (
                  <p className="text-red-600 text-sm mt-1">{errors.surface.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="qualite-materiaux">
                  Qualité des matériaux
                </label>
                <select
                  id="qualite-materiaux"
                  {...register('options.qualite')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="luxe">Luxe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="delai-execution">
                  Délai d'exécution
                </label>
                <select
                  id="delai-execution"
                  {...register('options.delai')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="tres_urgent">Très urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="difficulte-chantier">
                Difficulté estimée
              </label>
              <select
                id="difficulte-chantier"
                {...register('options.difficulte')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="facile">Facile</option>
                <option value="moyen">Moyen</option>
                <option value="difficile">Difficile</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Postes de travail</h4>
              <button
                type="button"
                onClick={ajouterPoste}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                Ajouter un poste
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border border-gray-200 bg-white p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`poste-nom-${index}`}>
                        Nom du poste *
                      </label>
                      <input
                        id={`poste-nom-${index}`}
                        {...register(`postes.${index}.nom` as const)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Gros œuvre"
                      />
                      {errors.postes?.[index]?.nom && (
                        <p className="text-red-600 text-sm mt-1">{errors.postes[index]?.nom?.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`poste-unite-${index}`}>
                        Unité *
                      </label>
                      <input
                        id={`poste-unite-${index}`}
                        {...register(`postes.${index}.unite` as const)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="m²"
                      />
                      {errors.postes?.[index]?.unite && (
                        <p className="text-red-600 text-sm mt-1">{errors.postes[index]?.unite?.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`poste-description-${index}`}>
                        Description
                      </label>
                      <textarea
                        id={`poste-description-${index}`}
                        rows={2}
                        {...register(`postes.${index}.description` as const)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Détail des travaux prévus pour ce poste"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`poste-quantite-${index}`}>
                        Quantité *
                      </label>
                      <input
                        id={`poste-quantite-${index}`}
                        type="number"
                        min={0}
                        step="0.1"
                        {...register(`postes.${index}.quantite` as const, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                      {errors.postes?.[index]?.quantite && (
                        <p className="text-red-600 text-sm mt-1">{errors.postes[index]?.quantite?.message}</p>
                      )}
                    </div>
                  </div>

                  {fields.length > 1 && (
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <MinusCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        Supprimer ce poste
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="commentaires">
              Commentaires ou précisions
            </label>
            <textarea
              id="commentaires"
              rows={3}
              {...register('commentaires')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contraintes spécifiques, attentes du client, etc."
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
            >
              <Calculator className="h-4 w-4 mr-2" aria-hidden="true" />
              {isLoading ? 'Calcul en cours...' : 'Lancer l\'estimation'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Synthèse</h4>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-700 font-medium">Coût matériaux</p>
                <p className="text-lg font-bold text-blue-900">{formatEuro(estimation.coutMateriauxTotal)}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Coût main d'œuvre</p>
                <p className="text-lg font-bold text-blue-900">{formatEuro(estimation.coutMainOeuvreTotal)}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Frais généraux</p>
                <p className="text-lg font-bold text-blue-900">{formatEuro(estimation.fraisGeneraux)}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Prix de vente conseillé</p>
                <p className="text-lg font-bold text-blue-900">{formatEuro(estimation.prixVenteRecommande)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-blue-700">
              Marge recommandée : {estimation.margeRecommandee.toFixed(1)}%
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Postes estimés</h4>
            {estimation.postes.map((poste) => (
              <div key={poste.posteId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">{poste.posteId}</p>
                  <p className="text-sm text-gray-600">Coût total : {formatEuro(poste.coutTotal)}</p>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Matériaux</p>
                    <ul className="space-y-1 text-gray-600">
                      {poste.materiaux.map((materiau, index) => (
                        <li key={`${poste.posteId}-mat-${index}`}>
                          {materiau.description} — {materiau.quantite} {materiau.unite} @ {formatEuro(materiau.prixUnitaire)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Main d'œuvre</p>
                    <ul className="space-y-1 text-gray-600">
                      {poste.mainOeuvre.map((mo, index) => (
                        <li key={`${poste.posteId}-mo-${index}`}>
                          {mo.qualification} — {mo.heures.toFixed(1)} h @ {formatEuro(mo.tauxHoraire)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {estimation.commentaires.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Commentaires de l'estimation</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {estimation.commentaires.map((commentaire, index) => (
                  <li key={index}>{commentaire}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3">
            <button
              type="button"
              onClick={() => setEstimation(null)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />
              Nouvelle estimation
            </button>
            <button
              type="button"
              onClick={sauvegarderEstimation}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              Créer le chantier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

