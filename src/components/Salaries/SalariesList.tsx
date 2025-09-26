import React from 'react';
import { Edit, Trash2, User, UserCheck, UserX } from 'lucide-react';
import { Salarie } from '../../schemas';
import { DataTable } from '../UI/DataTable';
import { formatEuro } from '../../utils/calculsFiscaux';

interface SalariesListProps {
  salaries: Salarie[];
  onEdit: (salarie: Salarie) => void;
  onDelete: (id: string) => void;
}

export const SalariesList: React.FC<SalariesListProps> = ({ salaries, onEdit, onDelete }) => {
  const getQualificationBadge = (qualification: Salarie['qualification']) => {
    const styles = {
      'ouvrier': 'bg-blue-100 text-blue-800',
      'chef_equipe': 'bg-purple-100 text-purple-800',
      'conducteur_travaux': 'bg-green-100 text-green-800',
      'ingenieur': 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      'ouvrier': 'Ouvrier',
      'chef_equipe': 'Chef d\'équipe',
      'conducteur_travaux': 'Conducteur',
      'ingenieur': 'Ingénieur'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[qualification]}`}>
        {labels[qualification]}
      </span>
    );
  };

  const columns = [
    {
      key: 'nom',
      header: 'Salarié',
      sortable: true,
      render: (salarie: Salarie) => (
        <div className="flex items-center">
          {salarie.actif ? (
            <UserCheck className="h-4 w-4 text-green-500 mr-2" />
          ) : (
            <UserX className="h-4 w-4 text-red-500 mr-2" />
          )}
          <div>
            <div className="font-medium text-gray-900">
              {salarie.prenom} {salarie.nom}
            </div>
            <div className="text-sm text-gray-500">
              {getQualificationBadge(salarie.qualification)}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'salaireNet',
      header: 'Net mensuel',
      sortable: true,
      render: (salarie: Salarie) => (
        <div className="text-right">
          <div className="font-medium">{formatEuro(salarie.salaireNet)}</div>
          <div className="text-xs text-gray-500">{formatEuro(salarie.tauxHoraire)}/h</div>
        </div>
      )
    },
    {
      key: 'salaireBrut',
      header: 'Brut mensuel',
      sortable: true,
      render: (salarie: Salarie) => (
        <div className="text-right font-medium">
          {formatEuro(salarie.salaireBrut)}
        </div>
      )
    },
    {
      key: 'chargesPatronales',
      header: 'Charges patronales',
      sortable: true,
      render: (salarie: Salarie) => (
        <div className="text-right">
          <div className="font-medium text-orange-600">{formatEuro(salarie.chargesPatronales)}</div>
          <div className="text-xs text-gray-500">44% BTP</div>
        </div>
      )
    },
    {
      key: 'coutTotal',
      header: 'Coût total',
      sortable: true,
      render: (salarie: Salarie) => (
        <div className="text-right">
          <div className="font-bold text-green-600 text-lg">{formatEuro(salarie.coutTotal)}</div>
          <div className="text-xs text-gray-500">employeur</div>
        </div>
      )
    },
    {
      key: 'dateEmbauche',
      header: 'Embauche',
      sortable: true,
      render: (salarie: Salarie) => (
        <div className="text-sm text-gray-600">
          {salarie.dateEmbauche 
            ? new Date(salarie.dateEmbauche).toLocaleDateString('fr-FR')
            : '-'
          }
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (salarie: Salarie) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(salarie);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(salarie.id);
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
      data={salaries}
      columns={columns}
      searchPlaceholder="Rechercher par nom, prénom, qualification..."
      emptyMessage="Aucun salarié enregistré"
    />
  );
};
