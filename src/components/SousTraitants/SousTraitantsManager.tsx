import React, { useState } from 'react';
import { Plus, Download, RotateCcw } from 'lucide-react';
import { SousTraitant } from '../../schemas';
import { SousTraitantForm } from './SousTraitantForm';
import { SousTraitantsList } from './SousTraitantsList';
import { useToast } from '../UI/Toast';
import { exportToCSV } from '../../services/importExportService';

interface SousTraitantsManagerProps {
  sousTraitants: SousTraitant[];
  setSousTraitants: (sousTraitants: SousTraitant[]) => boolean;
  isLoading: boolean;
  error: string | null;
}

export const SousTraitantsManager: React.FC<SousTraitantsManagerProps> = ({
  sousTraitants,
  setSousTraitants,
  isLoading,
  error
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSousTraitant, setEditingSousTraitant] = useState<SousTraitant | null>(null);
  const { addToast } = useToast();

  const ajouterSousTraitant = (nouveauSousTraitant: SousTraitant) => {
    const success = setSousTraitants([...sousTraitants, nouveauSousTraitant]);
    if (success) {
      addToast({
        type: 'success',
        title: 'Sous-traitant ajouté',
        description: `${nouveauSousTraitant.entreprise} a été ajouté`
      });
      setShowForm(false);
    }
  };

  const modifierSousTraitant = (sousTraitantModifie: SousTraitant) => {
    const nouveauxSousTraitants = sousTraitants.map(st => 
      st.id === sousTraitantModifie.id ? sousTraitantModifie : st
    );
    const success = setSousTraitants(nouveauxSousTraitants);
    
    if (success) {
      addToast({
        type: 'success',
        title: 'Sous-traitant modifié',
        description: `${sousTraitantModifie.entreprise} a été mis à jour`
      });
      setEditingSousTraitant(null);
    }
  };

  const supprimerSousTraitant = (id: string) => {
    const sousTraitant = sousTraitants.find(st => st.id === id);
    if (!sousTraitant) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${sousTraitant.entreprise} ?`)) {
      const success = setSousTraitants(sousTraitants.filter(st => st.id !== id));
      if (success) {
        addToast({
          type: 'success',
          title: 'Sous-traitant supprimé',
          description: `${sousTraitant.entreprise} a été supprimé`
        });
      }
    }
  };

  const exporterSousTraitants = () => {
    const headers = ['nom', 'entreprise', 'specialite', 'telephone', 'email', 'adresse'];
    exportToCSV(sousTraitants, 'sous-traitants.csv', headers);
    addToast({
      type: 'success',
      title: 'Export réussi',
      description: 'La liste des sous-traitants a été exportée'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions globales */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Gestion des sous-traitants</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={exporterSousTraitants}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau sous-traitant
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {(showForm || editingSousTraitant) && (
        <SousTraitantForm
          sousTraitant={editingSousTraitant}
          onSave={editingSousTraitant ? modifierSousTraitant : ajouterSousTraitant}
          onCancel={() => {
            setShowForm(false);
            setEditingSousTraitant(null);
          }}
        />
      )}

      {/* Liste */}
      <SousTraitantsList
        sousTraitants={sousTraitants}
        onEdit={setEditingSousTraitant}
        onDelete={supprimerSousTraitant}
      />
    </div>
  );
};
