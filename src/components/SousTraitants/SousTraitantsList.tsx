import React from 'react';
import { Edit, Trash2, Users, Phone, Mail } from 'lucide-react';
import { SousTraitant } from '../../schemas';
import { DataTable } from '../UI/DataTable';
import { formatEuro } from '../../utils/calculsFiscaux';

interface SousTraitantsListProps {
  sousTraitants: SousTraitant[];
  onEdit: (sousTraitant: SousTraitant) => void;
  onDelete: (id: string) => void;
}

export const SousTraitantsList: React.FC<SousTraitantsListProps> = ({ sousTraitants, onEdit, onDelete }) => {
  const getSpecialiteLabel = (specialite: SousTraitant['specialite']) => {
    const labels = {
      'plomberie': 'Plomberie',
      'electricite': 'Électricité',
      'peinture': 'Peinture',
      'carrelage': 'Carrelage',
      'menuiserie': 'Menuiserie',
      'isolation': 'Isolation',
      'couverture': 'Couverture',
      'cloisons': 'Cloisons',
      'sols': 'Sols',
      'facades': 'Façades',
      'autre': 'Autre'
    };
    return labels[specialite];
  };

  const getSpecialiteBadge = (specialite: SousTraitant['specialite']) => {
    const styles = {
      'plomberie': 'bg-blue-100 text-blue-800',
      'electricite': 'bg-yellow-100 text-yellow-800',
      'peinture': 'bg-green-100 text-green-800',
      'carrelage': 'bg-orange-100 text-orange-800',
      'menuiserie': 'bg-brown-100 text-brown-800',
      'isolation': 'bg-purple-100 text-purple-800',
      'couverture': 'bg-red-100 text-red-800',
      'cloisons': 'bg-gray-100 text-gray-800',
      'sols': 'bg-indigo-100 text-indigo-800',
      'facades': 'bg-pink-100 text-pink-800',
      'autre': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[specialite]}`}>
        {getSpecialiteLabel(specialite)}
      </span>
    );
  };

  const columns = [
    {
      key: 'nom',
      header: 'Sous-traitant',
      sortable: true,
      render: (sousTraitant: SousTraitant) => (
        <div className="flex items-center">
          <Users className={`h-4 w-4 mr-2 ${sousTraitant.actif ? 'text-green-500' : 'text-gray-400'}`} />
          <div>
            <div className="font-medium text-gray-900">{sousTraitant.nom}</div>
            <div className="text-sm text-gray-600">{sousTraitant.entreprise}</div>
            <div className="mt-1">{getSpecialiteBadge(sousTraitant.specialite)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (sousTraitant: SousTraitant) => (
        <div className="text-sm">
          {sousTraitant.telephone && (
            <div className="flex items-center text-gray-600 mb-1">
              <Phone className="h-3 w-3 mr-1" />
              {sousTraitant.telephone}
            </div>
          )}
          {sousTraitant.email && (
            <div className="flex items-center text-gray-600">
              <Mail className="h-3 w-3 mr-1" />
              {sousTraitant.email}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'adresse',
      header: 'Adresse',
      render: (sousTraitant: SousTraitant) => (
        <div className="text-sm text-gray-600">
          {sousTraitant.adresse || '-'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (sousTraitant: SousTraitant) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(sousTraitant);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(sousTraitant.id);
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
      data={sousTraitants}
      columns={columns}
      searchPlaceholder="Rechercher par nom, entreprise, spécialité..."
      emptyMessage="Aucun sous-traitant enregistré"
    />
  );
};
