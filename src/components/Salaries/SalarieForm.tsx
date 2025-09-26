import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, User } from 'lucide-react';
import { Salarie, SalarieFormData, SalarieFormSchema } from '../../schemas';
import { calculCompletSalaire, calculerTauxHoraire } from '../../utils/calculsFiscaux';

interface SalarieFormProps {
  salarie?: Salarie | null;
  onSave: (salarie: Salarie) => void;
  onCancel: () => void;
}

export const SalarieForm: React.FC<SalarieFormProps> = ({ salarie, onSave, onCancel }) => {
  const isEditing = !!salarie;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SalarieFormData>({
    resolver: zodResolver(SalarieFormSchema),
    defaultValues: salarie ? {
      nom: salarie.nom,
      prenom: salarie.prenom,
      salaireNet: salarie.salaireNet,
      heuresParJour: salarie.heuresParJour,
      qualification: salarie.qualification,
      dateEmbauche: salarie.dateEmbauche,
      actif: salarie.actif,
      tags: salarie.tags
    } : {
      heuresParJour: 8,
      qualification: 'ouvrier',
      actif: true,
      tags: []
    }
  });

  const salaireNet = watch('salaireNet');
  const calculs = React.useMemo(() => {
    if (!salaireNet || salaireNet <= 0) return null;
    return calculCompletSalaire(salaireNet);
  }, [salaireNet]);

  const onSubmit = (data: SalarieFormData) => {
    if (!calculs) return;

    const salarieComplet: Salarie = {
      id: salarie?.id || Date.now().toString(),
      ...data,
      salaireBrut: calculs.salaireBrut,
      chargesPatronales: calculs.chargesPatronales,
      coutTotal: calculs.coutTotal,
      tauxHoraire: calculerTauxHoraire(calculs.coutTotal)
    };

    onSave(salarieComplet);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Modifier le salarié' : 'Nouveau salarié'}
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
        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              {...register('nom')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dupont"
            />
            {errors.nom && (
              <p className="text-red-600 text-sm mt-1">{errors.nom.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom *
            </label>
            <input
              {...register('prenom')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jean"
            />
            {errors.prenom && (
              <p className="text-red-600 text-sm mt-1">{errors.prenom.message}</p>
            )}
          </div>
        </div>

        {/* Informations professionnelles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qualification
            </label>
            <select
              {...register('qualification')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ouvrier">Ouvrier</option>
              <option value="chef_equipe">Chef d'équipe</option>
              <option value="conducteur_travaux">Conducteur de travaux</option>
              <option value="ingenieur">Ingénieur</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'embauche
            </label>
            <input
              {...register('dateEmbauche')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heures par jour
            </label>
            <input
              {...register('heuresParJour', { valueAsNumber: true })}
              type="number"
              step="0.5"
              min="1"
              max="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.heuresParJour && (
              <p className="text-red-600 text-sm mt-1">{errors.heuresParJour.message}</p>
            )}
          </div>
        </div>

        {/* Salaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salaire net mensuel (€) *
            </label>
            <input
              {...register('salaireNet', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1800.00"
            />
            {errors.salaireNet && (
              <p className="text-red-600 text-sm mt-1">{errors.salaireNet.message}</p>
            )}
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                {...register('actif')}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Salarié actif</span>
            </label>
          </div>
        </div>

        {/* Calculs automatiques */}
        {calculs && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3">Calculs automatiques (charges BTP)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 block">Salaire brut:</span>
                <span className="font-semibold text-blue-600">{calculs.salaireBrut.toFixed(2)} €</span>
              </div>
              <div>
                <span className="text-gray-600 block">Charges patronales:</span>
                <span className="font-semibold text-orange-600">{calculs.chargesPatronales.toFixed(2)} €</span>
              </div>
              <div>
                <span className="text-gray-600 block">Coût total employeur:</span>
                <span className="font-semibold text-green-600">{calculs.coutTotal.toFixed(2)} €</span>
              </div>
              <div>
                <span className="text-gray-600 block">Taux horaire:</span>
                <span className="font-semibold text-purple-600">
                  {calculerTauxHoraire(calculs.coutTotal).toFixed(2)} €/h
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={!calculs}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {isEditing ? 'Sauvegarder' : 'Ajouter le salarié'}
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
