import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Package } from 'lucide-react';
import { Materiau, MateriauFormData, MateriauFormSchema } from '../../schemas';

interface MateriauFormProps {
  materiau?: Materiau | null;
  onSave: (materiau: Materiau) => void;
  onCancel: () => void;
}

const CATEGORIES_MATERIAUX = [
  { value: 'gros_oeuvre', label: 'Gros œuvre' },
  { value: 'second_oeuvre', label: 'Second œuvre' },
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'couverture', label: 'Couverture' },
  { value: 'outillage', label: 'Outillage' },
  { value: 'location_materiel', label: 'Location matériel' }
];

const UNITES = ['m²', 'm³', 'ml', 'kg', 't', 'sac', 'unité', 'lot', 'forfait'];

export const MateriauForm: React.FC<MateriauFormProps> = ({ materiau, onSave, onCancel }) => {
  const isEditing = !!materiau;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<MateriauFormData>({
    resolver: zodResolver(MateriauFormSchema),
    defaultValues: materiau ? {
      nom: materiau.nom,
      reference: materiau.reference,
      prixUnitaire: materiau.prixUnitaire,
      unite: materiau.unite,
      quantiteStock: materiau.quantiteStock,
      seuilAlerte: materiau.seuilAlerte,
      fournisseur: materiau.fournisseur,
      categorie: materiau.categorie,
      tauxTVA: materiau.tauxTVA,
      actif: materiau.actif,
      tags: materiau.tags
    } : {
      unite: 'm²',
      quantiteStock: 0,
      seuilAlerte: 0,
      categorie: 'gros_oeuvre',
      tauxTVA: '20',
      actif: true,
      tags: []
    }
  });

  const onSubmit = (data: MateriauFormData) => {
    const materiauComplet: Materiau = {
      id: materiau?.id || Date.now().toString(),
      ...data
    };

    onSave(materiauComplet);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Package className="h-5 w-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Modifier le matériau' : 'Nouveau matériau'}
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
              Nom du matériau *
            </label>
            <input
              {...register('nom')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Carrelage 60x60 blanc"
            />
            {errors.nom && (
              <p className="text-red-600 text-sm mt-1">{errors.nom.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence
            </label>
            <input
              {...register('reference')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="REF-CAR-001"
            />
          </div>
        </div>

        {/* Prix et unité */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix unitaire HT (€) *
            </label>
            <input
              {...register('prixUnitaire', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="25.50"
            />
            {errors.prixUnitaire && (
              <p className="text-red-600 text-sm mt-1">{errors.prixUnitaire.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unité
            </label>
            <select
              {...register('unite')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {UNITES.map((unite) => (
                <option key={unite} value={unite}>{unite}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TVA
            </label>
            <select
              {...register('tauxTVA')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="5.5">5,5% (rénovation)</option>
              <option value="10">10% (amélioration)</option>
              <option value="20">20% (standard)</option>
            </select>
          </div>
        </div>

        {/* Gestion stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité en stock
            </label>
            <input
              {...register('quantiteStock', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seuil d'alerte
            </label>
            <input
              {...register('seuilAlerte', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="10"
            />
          </div>
        </div>

        {/* Catégorie et fournisseur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              {...register('categorie')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {CATEGORIES_MATERIAUX.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fournisseur
            </label>
            <input
              {...register('fournisseur')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Leroy Merlin, Point P..."
            />
          </div>
        </div>

        {/* Statut */}
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              {...register('actif')}
              type="checkbox"
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-700">Matériau actif</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {isEditing ? 'Sauvegarder' : 'Ajouter le matériau'}
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
