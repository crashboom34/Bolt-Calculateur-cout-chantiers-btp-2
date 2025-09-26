import React from 'react';
import { Edit, Trash2, FileText, Download, Calendar, MapPin, TrendingUp, Users, Package } from 'lucide-react';
import { Chantier, Salarie, Materiau } from '../../schemas';
import { DataTable } from '../UI/DataTable';
import { calculerCoutsChantier } from '../../services/costEngine';
import { formatEuro } from '../../utils/calculsFiscaux';

interface ChantiersListProps {
  chantiers: Chantier[];
  salaries: Salarie[];
  materiaux: Materiau[];
  onEdit: (chantier: Chantier) => void;
  onDelete: (id: string) => void;
  onGenerateDevis: (chantier: Chantier) => void;
}

export const ChantiersList: React.FC<ChantiersListProps> = ({
  chantiers,
  salaries,
  materiaux,
  onEdit,
  onDelete,
  onGenerateDevis
}) => {
  const getStatusBadge = (status: Chantier['status']) => {
    const styles = {
      'prospect': 'bg-gray-100 text-gray-800',
      'devis': 'bg-yellow-100 text-yellow-800',
      'en_cours': 'bg-blue-100 text-blue-800',
      'livre': 'bg-green-100 text-green-800',
      'facture': 'bg-purple-100 text-purple-800',
      'paye': 'bg-green-100 text-green-800'
    };
    
    const labels = {
      'prospect': 'Prospect',
      'devis': 'Devis envoyé',
      'en_cours': 'En cours',
      'livre': 'Livré',
      'facture': 'Facturé',
      'paye': 'Payé'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const columns = [
    {
      key: 'reference',
      header: 'Référence',
      sortable: true,
      render: (chantier: Chantier) => (
        <div>
          <div className="font-medium text-gray-900">{chantier.reference}</div>
          <div className="text-sm text-gray-500">{chantier.nom}</div>
        </div>
      )
    },
    {
      key: 'client',
      header: 'Client',
      sortable: true,
      render: (chantier: Chantier) => (
        <div>
          <div className="font-medium text-gray-900">{chantier.client.nom}</div>
          <div className="text-sm text-gray-500">{chantier.adresse}</div>
        </div>
      )
    },
    {
      key: 'dateDebut',
      header: 'Période',
      sortable: true,
      render: (chantier: Chantier) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-900">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(chantier.dateDebut).toLocaleDateString('fr-FR')}
          </div>
          {chantier.dateFin && (
            <div className="text-gray-500">
              → {new Date(chantier.dateFin).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      render: (chantier: Chantier) => getStatusBadge(chantier.status)
    },
    {
      key: 'coutTotal',
      header: 'Coût',
      sortable: true,
      render: (chantier: Chantier) => {
        const couts = calculerCoutsChantier(chantier, salaries, materiaux);
        return (
          <div className="text-right">
            <div className="font-semibold text-gray-900">{formatEuro(couts.coutTotal)}</div>
            {couts.margeReelle !== undefined && (
              <div className={`text-xs ${couts.margeReelle >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {couts.margeReelle.toFixed(1)}% marge
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (chantier: Chantier) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(chantier);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateDevis(chantier);
            }}
            className="text-green-600 hover:text-green-800 transition-colors"
            title="Générer devis"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chantier.id);
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
    <div className="space-y-6">
      {/* Vue tableau */}
      <DataTable
        data={chantiers}
        columns={columns}
        searchPlaceholder="Rechercher par référence, nom, client..."
        emptyMessage="Aucun chantier créé"
        onRowClick={(chantier) => {
          // Optionnel: ouvrir les détails en cliquant sur la ligne
        }}
      />

      {/* Vue détaillée (cartes) */}
      <div className="space-y-4">
        {chantiers.map((chantier) => {
          const couts = calculerCoutsChantier(chantier, salaries, materiaux);
          
          return (
            <div key={chantier.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-800">{chantier.nom}</h4>
                      <span className="text-sm text-gray-500">({chantier.reference})</span>
                      {getStatusBadge(chantier.status)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {chantier.client.nom} - {chantier.adresse}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(chantier.dateDebut).toLocaleDateString('fr-FR')}
                        {chantier.dateFin && ` - ${new Date(chantier.dateFin).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(chantier)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </button>
                    <button
                      onClick={() => onGenerateDevis(chantier)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Devis
                    </button>
                    <button
                      onClick={() => onDelete(chantier.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Résumé financier */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Users className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Main d'œuvre</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatEuro(couts.coutMainOeuvre)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {chantier.salaries.reduce((sum, cs) => sum + cs.presences.length, 0)} jours-homme
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Package className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Matériaux</span>
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatEuro(couts.coutMateriaux)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {chantier.materiaux.length} référence(s)
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Frais généraux</div>
                    <div className="text-lg font-bold text-gray-600">
                      {formatEuro(couts.fraisGeneraux)}
                    </div>
                    <div className="text-xs text-gray-500">{chantier.fraisGeneraux}%</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Coût total</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatEuro(couts.coutTotal)}
                    </div>
                  </div>
                  
                  {couts.margeReelle !== undefined && (
                    <div className={`rounded-lg p-4 ${couts.margeReelle >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center mb-2">
                        <TrendingUp className={`h-5 w-5 mr-2 ${couts.margeReelle >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <span className="text-sm font-medium text-gray-700">Marge</span>
                      </div>
                      <div className={`text-lg font-bold ${couts.margeReelle >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {couts.margeReelle.toFixed(1)}%
                      </div>
                      {chantier.prixVenteHT && (
                        <div className="text-xs text-gray-500">
                          Prix: {formatEuro(chantier.prixVenteHT)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Détail des présences par salarié */}
                {chantier.salaries.some(cs => cs.presences.length > 0) && (
                  <div className="mt-6">
                    <h5 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Détail des présences
                    </h5>
                    <div className="space-y-3">
                      {chantier.salaries.filter(cs => cs.presences.length > 0).map((cs) => {
                        const salarie = salaries.find(s => s.id === cs.salarieId);
                        const totalHeures = cs.presences.reduce((sum, p) => sum + p.heuresPresence, 0);
                        const totalHeuresSupp = cs.presences.reduce((sum, p) => sum + p.heuresSupplementaires, 0);
                        
                        return (
                          <div key={cs.salarieId} className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-medium text-sm text-gray-800">
                                {salarie?.prenom} {salarie?.nom}
                              </div>
                              <div className="text-sm text-blue-600 font-semibold">
                                {cs.presences.length} jours • {totalHeures}h
                                {totalHeuresSupp > 0 && ` (+${totalHeuresSupp}h supp.)`}
                                • {formatEuro(cs.coutTotal)}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                              {cs.presences.map((presence, pIndex) => (
                                <div key={pIndex} className="bg-white rounded p-2 border">
                                  <div className="font-medium">
                                    {new Date(presence.date).toLocaleDateString('fr-FR', { 
                                      day: '2-digit', 
                                      month: '2-digit' 
                                    })}
                                  </div>
                                  <div className="text-blue-600">
                                    {presence.heuresPresence}h
                                    {presence.heuresSupplementaires > 0 && (
                                      <span className="text-orange-600"> +{presence.heuresSupplementaires}h</span>
                                    )}
                                  </div>
                                  {presence.tacheDescription && (
                                    <div className="text-purple-600 text-xs bg-purple-100 px-1 rounded mt-1">
                                      {presence.tacheDescription}
                                    </div>
                                  )}
                                  {presence.commentaire && (
                                    <div className="text-gray-500 italic truncate mt-1" title={presence.commentaire}>
                                      {presence.commentaire}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
