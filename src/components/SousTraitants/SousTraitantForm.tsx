import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Users } from 'lucide-react';
import { SousTraitant, SousTraitantFormData, SousTraitantFormSchema } from '../../schemas';

interface SousTraitantFormProps {
  sousTraitant?: SousTraitant | null;
  onSave: (sousTraitant: SousTraitant) => void;
  onCancel: () => void;
}

const SPECIALITES = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'couverture', label: 'Couverture' },
  { value: 'cloisons', label: 'Cloisons' },
  { value: 'sols', label: 'Sols' },
  { value: 'facades', label: 'Façades' },
  { value: 'autre', label: 'Autre' }
];

export const SousTraitantForm: React.FC<SousTraitantFormProps> = ({ sousTraitant, onSave, onCancel }) => {
  const isEditing = !!sousTraitant;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SousTraitantFormData>({
    resolver: zodResolver(SousTraitantFormSchema),
    defaultValues: sousTraitant ? {
      nom: sousTraitant.nom,
      entreprise: sousTraitant.entreprise,
      specialite: sousTraitant.specialite,
      tauxHoraire: sousTraitant.tauxHoraire,
      telephone: sousTraitant.telephone,
      email: sousTraitant.email,
      adresse: sousTraitant.adresse,
      siret: sousTraitant.siret,
      actif: sousTraitant.actif,
      notes: sousTraitant.notes,
      tags: sousTraitant.tags
    } : {
      specialite: 'autre',
      actif: true,
      tags: []
    }
  });

  const onSubmit = (data: SousTraitantFormData) => {
    const sousTraitantComplet: SousTraitant = {
      id: sousTraitant?.id || Date.now().toString(),
      ...data
    };

    onSave(sousTraitantComplet);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Modifier le sous-traitant' : 'Nouveau sous-traitant'}
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du contact *
            </label>
            <input
              {...register('nom')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Jean Dupont"
            />
            {errors.nom && (
              <p className="text-red-600 text-sm mt-1">{errors.nom.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entreprise *
            </label>
            <input
              {...register('entreprise')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="SARL Dupont Plomberie"
            />
            {errors.entreprise && (
              <p className="text-red-600 text-sm mt-1">{errors.entreprise.message}</p>
            )}
          </div>
        </div>

        {/* Spécialité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spécialité
            </label>
            <select
              {...register('specialite')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {SPECIALITES.map((spec) => (
                <option key={spec.value} value={spec.value}>{spec.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              {...register('telephone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="06 12 34 56 78"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="contact@entreprise.fr"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Adresse et SIRET */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              {...register('adresse')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="123 rue de la Paix, Montpellier"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIRET
            </label>
            <input
              {...register('siret')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="12345678901234"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Notes sur le sous-traitant..."
          />
        </div>

        {/* Statut */}
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              {...register('actif')}
              type="checkbox"
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">Sous-traitant actif</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {isEditing ? 'Sauvegarder' : 'Ajouter le sous-traitant'}
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
