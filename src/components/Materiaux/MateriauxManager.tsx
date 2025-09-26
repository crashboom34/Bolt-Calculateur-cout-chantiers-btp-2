import React, { useState } from 'react';
import { Plus, Download, RotateCcw, AlertTriangle } from 'lucide-react';
import { Materiau } from '../../schemas';
import { MateriauForm } from './MateriauForm';
import { MateriauxList } from './MateriauxList';
import { useToast } from '../UI/Toast';
import { exportToCSV } from '../../services/importExportService';

interface MateriauxManagerProps {
  materiaux: Materiau[];
  setMateriaux: (materiaux: Materiau[]) => boolean;
  isLoading: boolean;
  error: string | null;
}

export const MateriauxManager: React.FC<MateriauxManagerProps> = ({
  materiaux,
  setMateriaux,
  isLoading,
  error
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMateriau, setEditingMateriau] = useState<Materiau | null>(null);
  const { addToast } = useToast();

  // Alertes stock
  const stocksFaibles = materiaux.filter(m => 
    m.actif && m.quantiteStock <= m.seuilAlerte && m.seuilAlerte > 0
  );

  const ajouterMateriau = (nouveauMateriau: Materiau) => {
    const success = setMateriaux([...materiaux, nouveauMateriau]);
    if (success) {
      addToast({
        type: 'success',
        title: 'Matériau ajouté',
        description: `${nouveauMateriau.nom} a été ajouté au catalogue`
      });
      setShowForm(false);
    }
  };

  const modifierMateriau = (materiauModifie: Materiau) => {
    const nouveauxMateriaux = materiaux.map(m => 
      m.id === materiauModifie.id ? materiauModifie : m
    );
    const success = setMateriaux(nouveauxMateriaux);
    
    if (success) {
      addToast({
        type: 'success',
        title: 'Matériau modifié',
        description: `${materiauModifie.nom} a été mis à jour`
      });
      setEditingMateriau(null);
    }
  };

  const supprimerMateriau = (id: string) => {
    const materiau = materiaux.find(m => m.id === id);
    if (!materiau) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${materiau.nom}" ?`)) {
      const success = setMateriaux(materiaux.filter(m => m.id !== id));
      if (success) {
        addToast({
          type: 'success',
          title: 'Matériau supprimé',
          description: `${materiau.nom} a été supprimé`
        });
      }
    }
  };

  const exporterMateriaux = () => {
    const headers = ['nom', 'reference', 'prixUnitaire', 'unite', 'quantiteStock', 'seuilAlerte', 'fournisseur', 'categorie', 'tauxTVA'];
    exportToCSV(materiaux, 'materiaux.csv', headers);
    addToast({
      type: 'success',
      title: 'Export réussi',
      description: 'Le catalogue matériaux a été exporté'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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
      {/* Alertes stock */}
      {stocksFaibles.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800">Alertes stock</h4>
              <p className="text-sm text-yellow-700">
                {stocksFaibles.length} matériau(x) en stock faible: {stocksFaibles.map(m => m.nom).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions globales */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Catalogue matériaux</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={exporterMateriaux}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau matériau
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {(showForm || editingMateriau) && (
        <MateriauForm
          materiau={editingMateriau}
          onSave={editingMateriau ? modifierMateriau : ajouterMateriau}
          onCancel={() => {
            setShowForm(false);
            setEditingMateriau(null);
          }}
        />
      )}

      {/* Liste */}
      <MateriauxList
        materiaux={materiaux}
        onEdit={setEditingMateriau}
        onDelete={supprimerMateriau}
      />
    </div>
  );
};
