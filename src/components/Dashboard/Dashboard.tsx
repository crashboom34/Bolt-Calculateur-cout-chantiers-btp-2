import React from 'react';
import { BarChart3, TrendingUp, Users, Package, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Chantier, Salarie, Materiau } from '../../schemas';
import { useKPI } from '../../hooks/useKPI';
import { formatEuro, formatPourcentage } from '../../utils/calculsFiscaux';

interface DashboardProps {
  chantiers: Chantier[];
  salaries: Salarie[];
  materiaux: Materiau[];
}

export const Dashboard: React.FC<DashboardProps> = ({ chantiers, salaries, materiaux }) => {
  const kpi = useKPI(chantiers, salaries, materiaux);

  return (
    <div className="space-y-6">
      {/* Alertes */}
      {kpi.alertes.length > 0 && (
        <div className="space-y-3">
          {kpi.alertes.map((alerte, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 border ${
                alerte.type === 'error' 
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <div>
                  <h4 className="font-medium">{alerte.message}</h4>
                  {alerte.details && (
                    <p className="text-sm mt-1 opacity-90">
                      {alerte.details.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Chantiers actifs</p>
              <p className="text-3xl font-bold text-blue-700">{kpi.chantiersActifs}</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 text-xs text-blue-600">
            {kpi.nombreChantiers} total • {kpi.chantiersTermines} terminés
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">CA réalisé</p>
              <p className="text-2xl font-bold text-green-700">
                {formatEuro(kpi.caRealise)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 text-xs text-green-600">
            Prévu: {formatEuro(kpi.caPrevu)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Marge moyenne</p>
              <p className={`text-3xl font-bold ${kpi.margeMoyenne >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
                {kpi.margeMoyenne.toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 text-xs text-purple-600">
            Bénéfice: {formatEuro(kpi.beneficeEstime)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Coût/heure</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatEuro(kpi.coutMoyenHeure)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2 text-xs text-orange-600">
            {kpi.totalHeuresPrevues}h prévues
          </div>
        </div>
      </div>

      {/* Ressources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              Équipe ({kpi.nombreSalaries})
            </h3>
          </div>
          
          <div className="space-y-3">
            {salaries.filter(s => s.actif).slice(0, 5).map((salarie) => (
              <div key={salarie.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {salarie.prenom} {salarie.nom}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {salarie.qualification.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{formatEuro(salarie.tauxHoraire)}/h</div>
                  <div className="text-sm text-gray-600">{formatEuro(salarie.coutTotal)}/mois</div>
                </div>
              </div>
            ))}
            
            {salaries.filter(s => s.actif).length > 5 && (
              <div className="text-center text-sm text-gray-500">
                +{salaries.filter(s => s.actif).length - 5} autres salariés
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Package className="h-5 w-5 text-orange-600 mr-2" />
              Matériaux ({kpi.nombreMateriaux})
            </h3>
          </div>
          
          <div className="space-y-3">
            {materiaux.filter(m => m.actif).slice(0, 5).map((materiau) => {
              const stockFaible = materiau.seuilAlerte > 0 && materiau.quantiteStock <= materiau.seuilAlerte;
              
              return (
                <div key={materiau.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center">
                    {stockFaible ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{materiau.nom}</div>
                      <div className="text-sm text-gray-600">
                        Stock: {materiau.quantiteStock} {materiau.unite}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">
                      {formatEuro(materiau.prixUnitaire)}
                    </div>
                    <div className="text-sm text-gray-600">/{materiau.unite}</div>
                  </div>
                </div>
              );
            })}
            
            {materiaux.filter(m => m.actif).length > 5 && (
              <div className="text-center text-sm text-gray-500">
                +{materiaux.filter(m => m.actif).length - 5} autres matériaux
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chantiers récents */}
      {chantiers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="h-5 w-5 text-green-600 mr-2" />
            Chantiers récents
          </h3>
          
          <div className="space-y-3">
            {chantiers.slice(0, 5).map((chantier) => (
              <div key={chantier.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <div className="font-medium text-gray-900">{chantier.nom}</div>
                  <div className="text-sm text-gray-600">{chantier.client.nom}</div>
                  <div className="text-xs text-gray-500">{chantier.reference}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{formatEuro(chantier.coutTotal)}</div>
                  {chantier.margeReelle !== undefined && (
                    <div className={`text-sm ${chantier.margeReelle >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {chantier.margeReelle.toFixed(1)}% marge
                    </div>
                  )}
                  <div className="text-xs text-gray-500 capitalize">
                    {chantier.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tendances */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendances (30 derniers jours)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-600 mb-1">Nouveaux chantiers</div>
            <div className="text-2xl font-bold text-blue-700">{kpi.tendances.nouveauxChantiers}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600 mb-1">Chantiers livrés</div>
            <div className="text-2xl font-bold text-green-700">{kpi.tendances.chantiersLivres}</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-600 mb-1">Coût moyen chantier</div>
            <div className="text-xl font-bold text-purple-700">
              {formatEuro(kpi.coutMoyenChantier)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
