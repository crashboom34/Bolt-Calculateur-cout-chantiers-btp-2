import React from 'react';
import { EstimationResponse, PosteTravail } from '../../domain/api';

interface EstimationResultsCardProps {
  estimation: EstimationResponse | null;
  postes: PosteTravail[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

const EstimationResultsCard: React.FC<EstimationResultsCardProps> = ({ estimation, postes }) => {
  if (!estimation) return null;

  // Créer un mapping des IDs de postes vers les noms
  const posteNamesMap = postes.reduce((acc, poste) => {
    acc[poste.id] = poste.nom;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Résultat API</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Poste</th>
              <th className="text-right p-2 border">Coût Matériaux</th>
              <th className="text-right p-2 border">Coût Main d'Œuvre</th>
              <th className="text-right p-2 border">Sous-total</th>
            </tr>
          </thead>
          <tbody>
            {estimation.postes.map(poste => {
              const sousTotal = poste.coutMateriaux + poste.coutMainOeuvre;
              return (
                <tr key={poste.id} className="border-b">
                  <td className="p-2 border">{posteNamesMap[poste.id] || `Poste ${poste.id}`}</td>
                  <td className="p-2 border text-right">{formatCurrency(poste.coutMateriaux)}</td>
                  <td className="p-2 border text-right">{formatCurrency(poste.coutMainOeuvre)}</td>
                  <td className="p-2 border text-right font-medium">{formatCurrency(sousTotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="p-2 border text-right font-semibold">Total HT</td>
              <td className="p-2 border text-right font-semibold">{formatCurrency(estimation.totalHT)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="p-2 border text-right font-semibold">Marge estimée</td>
              <td className="p-2 border text-right font-semibold">{estimation.margeEstimee}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default EstimationResultsCard;
