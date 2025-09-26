import React, { useState } from 'react';
import { Plus, Download, RotateCcw } from 'lucide-react';
import { Salarie } from '../../schemas';
import { SalarieForm } from './SalarieForm';
import { SalariesList } from './SalariesList';
import { useToast } from '../UI/Toast';
import { exportToCSV } from '../../services/importExportService';

interface SalariesManagerProps {
  salaries: Salarie[];
  setSalaries: (salaries: Salarie[]) => boolean;
  isLoading: boolean;
  error: string | null;
}

export const SalariesManager: React.FC<SalariesManagerProps> = ({
  salaries,
  setSalaries,
  isLoading,
  error
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSalarie, setEditingSalarie] = useState<Salarie | null>(null);
  const { addToast } = useToast();

  const ajouterSalarie = (nouveauSalarie: Salarie) => {
    const success = setSalaries([...salaries, nouveauSalarie]);
    if (success) {
      addToast({
        type: 'success',
        title: 'Salarié ajouté',
        description: `${nouveauSalarie.prenom} ${nouveauSalarie.nom} a été ajouté`
      });
      setShowForm(false);
    }
  };

  const modifierSalarie = (salarieModifie: Salarie) => {
    const nouveauxSalaries = salaries.map(s => 
      s.id === salarieModifie.id ? salarieModifie : s
    );
    const success = setSalaries(nouveauxSalaries);
    
    if (success) {
      addToast({
        type: 'success',
        title: 'Salarié modifié',
        description: `${salarieModifie.prenom} ${salarieModifie.nom} a été mis à jour`
      });
      setEditingSalarie(null);
    }
  };

  const supprimerSalarie = (id: string) => {
    const salarie = salaries.find(s => s.id === id);
    if (!salarie) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${salarie.prenom} ${salarie.nom} ?`)) {
      const success = setSalaries(salaries.filter(s => s.id !== id));
      if (success) {
        addToast({
          type: 'success',
          title: 'Salarié supprimé',
          description: `${salarie.prenom} ${salarie.nom} a été supprimé`
        });
      }
    }
  };

  const exporterSalaries = () => {
    const headers = ['nom', 'prenom', 'salaireNet', 'salaireBrut', 'chargesPatronales', 'coutTotal', 'tauxHoraire', 'qualification'];
    exportToCSV(salaries, 'salaries.csv', headers);
    addToast({
      type: 'success',
      title: 'Export réussi',
      description: 'La liste des salariés a été exportée'
    });
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
          <h2 className="text-xl font-semibold text-gray-800">Gestion des salariés</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={exporterSalaries}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau salarié
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {(showForm || editingSalarie) && (
        <SalarieForm
          salarie={editingSalarie}
          onSave={editingSalarie ? modifierSalarie : ajouterSalarie}
          onCancel={() => {
            setShowForm(false);
            setEditingSalarie(null);
          }}
        />
      )}

      {/* Liste */}
      <SalariesList
        salaries={salaries}
        onEdit={setEditingSalarie}
        onDelete={supprimerSalarie}
      />
    </div>
  );
};
