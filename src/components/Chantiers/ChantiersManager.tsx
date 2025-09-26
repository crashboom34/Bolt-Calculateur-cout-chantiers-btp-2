import React, { useState } from 'react';
import { Plus, Download, Upload, RotateCcw } from 'lucide-react';
import { Chantier, Salarie, Materiau, SousTraitant } from '../../schemas';
import { ChantierForm } from './ChantierForm';
import { ChantiersList } from './ChantiersList';
import { useToast } from '../UI/Toast';
import { exportToJSON, genererNumeroDevis } from '../../services/importExportService';
import { genererDevisPDF } from '../../services/pdfService';

interface ChantiersManagerProps {
  chantiers: Chantier[];
  setChantiers: (chantiers: Chantier[]) => boolean;
  salaries: Salarie[];
  materiaux: Materiau[];
  sousTraitants: SousTraitant[];
  isLoading: boolean;
  error: string | null;
}

export const ChantiersManager: React.FC<ChantiersManagerProps> = ({
  chantiers,
  setChantiers,
  salaries,
  materiaux,
  sousTraitants,
  isLoading,
  error
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null);
  const { addToast } = useToast();

  const ajouterChantier = (nouveauChantier: Chantier) => {
    const success = setChantiers([...chantiers, nouveauChantier]);
    if (success) {
      addToast({
        type: 'success',
        title: 'Chantier créé',
        description: `Le chantier "${nouveauChantier.nom}" a été créé avec succès`
      });
      setShowForm(false);
    } else {
      addToast({
        type: 'error',
        title: 'Erreur',
        description: 'Impossible de créer le chantier'
      });
    }
  };

  const modifierChantier = (chantierModifie: Chantier) => {
    const nouveauxChantiers = chantiers.map(c => 
      c.id === chantierModifie.id ? { ...chantierModifie, version: c.version + 1 } : c
    );
    const success = setChantiers(nouveauxChantiers);
    
    if (success) {
      addToast({
        type: 'success',
        title: 'Chantier modifié',
        description: `Le chantier "${chantierModifie.nom}" a été mis à jour`
      });
      setEditingChantier(null);
    } else {
      addToast({
        type: 'error',
        title: 'Erreur',
        description: 'Impossible de modifier le chantier'
      });
    }
  };

  const supprimerChantier = (id: string) => {
    const chantier = chantiers.find(c => c.id === id);
    if (!chantier) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le chantier "${chantier.nom}" ?`)) {
      const success = setChantiers(chantiers.filter(c => c.id !== id));
      if (success) {
        addToast({
          type: 'success',
          title: 'Chantier supprimé',
          description: `Le chantier "${chantier.nom}" a été supprimé`
        });
      }
    }
  };

  const exporterDonnees = () => {
    exportToJSON({ salaries, materiaux, sousTraitants, chantiers });
    addToast({
      type: 'success',
      title: 'Export réussi',
      description: 'Les données ont été exportées'
    });
  };

  const genererDevis = (chantier: Chantier) => {
    const numeroDevis = genererNumeroDevis(chantiers);
    const pdf = genererDevisPDF(chantier, salaries, materiaux, sousTraitants, numeroDevis);
    pdf.save(`devis-${chantier.reference || chantier.id}.pdf`);
    
    addToast({
      type: 'success',
      title: 'Devis généré',
      description: `Devis ${numeroDevis} téléchargé`
    });
  };

  const resetDonnees = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les chantiers ? Cette action est irréversible.')) {
      const success = setChantiers([]);
      if (success) {
        addToast({
          type: 'success',
          title: 'Données réinitialisées',
          description: 'Tous les chantiers ont été supprimés'
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <h2 className="text-xl font-semibold text-gray-800">Gestion des chantiers</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={exporterDonnees}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </button>
            <button
              onClick={resetDonnees}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau chantier
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire de création/édition */}
      {(showForm || editingChantier) && (
        <ChantierForm
          chantier={editingChantier}
          salaries={salaries}
          materiaux={materiaux}
          sousTraitants={sousTraitants}
          sousTraitants={sousTraitants}
          onSave={editingChantier ? modifierChantier : ajouterChantier}
          onCancel={() => {
            setShowForm(false);
            setEditingChantier(null);
          }}
        />
      )}

      {/* Liste des chantiers */}
      <ChantiersList
        chantiers={chantiers}
        salaries={salaries}
        materiaux={materiaux}
        sousTraitants={sousTraitants}
        onEdit={setEditingChantier}
        onDelete={supprimerChantier}
        onGenerateDevis={genererDevis}
      />
    </div>
  );
};
