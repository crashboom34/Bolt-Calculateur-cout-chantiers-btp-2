import React from 'react';
import { Edit, Trash2, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { Materiau } from '../../schemas';
import { DataTable } from '../UI/DataTable';
import { formatEuro } from '../../utils/calculsFiscaux';

interface MateriauxListProps {
  materiaux: Materiau[];
  onEdit: (materiau: Materiau) => void;
  onDelete: (id: string) => void;
}

export const MateriauxList: React.FC<MateriauxListProps> = ({ materiaux, onEdit, onDelete }) => {
  const getCategoryLabel = (categorie: Materiau['categorie']) => {
    const labels = {
      'gros_oeuvre': 'Gros œuvre',
      'second_oeuvre': 'Second œuvre',
      'plomberie': 'Plomberie',
      'electricite': 'Électricité',
      'peinture': 'Peinture',
      'carrelage': 'Carrelage',
      'menuiserie': 'Menuiserie',
      'isolation': 'Isolation',
      'couverture': 'Couverture',
      'outillage': 'Outillage',
      'location_materiel': 'Location matériel'
    };
    return labels[categorie];
  };

  const getStockStatus = (materiau: Materiau) => {
    if (materiau.seuilAlerte === 0) return null;
    
    if (materiau.quantiteStock <= materiau.seuilAlerte) {
      return (
        <div className="flex items-center text-red-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          <span className="text-xs">Stock faible</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        <span className="text-xs">Stock OK</span>
      </div>
    );
  };

  const columns = [
    {
      key: 'nom',
      header: 'Matériau',
      sortable: true,
      render: (materiau: Materiau) => (
        <div className="flex items-center">
          <Package className={`h-4 w-4 mr-2 ${materiau.actif ? 'text-green-500' : 'text-gray-400'}`} />
          <div>
            <div className="font-medium text-gray-900">{materiau.nom}</div>
            {materiau.reference && (
              <div className="text-sm text-gray-500">Réf: {materiau.reference}</div>
            )}
            <div className="text-xs text-gray-500">{getCategoryLabel(materiau.categorie)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'prixUnitaire',
      header: 'Prix unitaire',
      sortable: true,
      render: (materiau: Materiau) => (
        <div className="text-right">
          <div className="font-medium">{formatEuro(materiau.prixUnitaire)}</div>
          <div className="text-sm text-gray-500">/{materiau.unite}</div>
          <div className="text-xs text-gray-500">TVA {materiau.tauxTVA}%</div>
        </div>
      )
    },
    {
      key: 'quantiteStock',
      header: 'Stock',
      sortable: true,
      render: (materiau: Materiau) => (
        <div className="text-center">
          <div className="font-medium">{materiau.quantiteStock} {materiau.unite}</div>
          {materiau.seuilAlerte > 0 && (
            <div className="text-xs text-gray-500">Seuil: {materiau.seuilAlerte}</div>
          )}
          {getStockStatus(materiau)}
        </div>
      )
    },
    {
      key: 'fournisseur',
      header: 'Fournisseur',
      sortable: true,
      render: (materiau: Materiau) => (
        <div className="text-sm text-gray-600">
          {materiau.fournisseur || '-'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (materiau: Materiau) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(materiau);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(materiau.id);
            }}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={materiaux}
      columns={columns}
      searchPlaceholder="Rechercher par nom, référence, fournisseur..."
      emptyMessage="Aucun matériau dans le catalogue"
    />
  );
};
