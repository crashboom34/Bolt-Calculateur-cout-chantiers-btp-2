import React from 'react';
import { EstimationResponse, PosteTravail } from '../../domain/api';
import { formatEuro } from '../../utils/calculsFiscaux';
import { computeChargePonderee } from '@/domain/posteTypes';

interface EstimationResultsCardProps {
  estimation: EstimationResponse | null;
  postes: PosteTravail[];
  targetMargin: number;
}

const EstimationResultsCard: React.FC<EstimationResultsCardProps> = ({ estimation, postes, targetMargin }) => {
  if (!estimation) return null;

  // Créer un mapping des IDs de postes vers les noms
  const posteNamesMap = postes.reduce((acc, poste) => {
    acc[poste.id] = poste.nom;
    return acc;
  }, {} as Record<string, string>);

  const margeRealisableMontant = estimation.margeEstimee;
  const margeRealisablePourcentage = estimation.totalHT === 0
    ? 0
    : (margeRealisableMontant / estimation.totalHT) * 100;
  const ecart = margeRealisablePourcentage - targetMargin;

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
              <th className="text-right p-2 border">Charge pondérée (h)</th>
            </tr>
          </thead>
          <tbody>
            {estimation.postes.map(poste => {
              const sousTotal = poste.coutMateriaux + poste.coutMainOeuvre;
              const posteInitial = postes.find((p) => p.id === poste.id);
              return (
                <tr key={poste.id} className="border-b">
                  <td className="p-2 border">{posteNamesMap[poste.id] || `Poste ${poste.id}`}</td>
                  <td className="p-2 border text-right">{formatEuro(poste.coutMateriaux)}</td>
                  <td className="p-2 border text-right">{formatEuro(poste.coutMainOeuvre)}</td>
                  <td className="p-2 border text-right font-medium">{formatEuro(sousTotal)}</td>
                  <td className="p-2 border text-right">{posteInitial ? computeChargePonderee(posteInitial.charge, posteInitial.typePoste).toFixed(2) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="p-2 border text-right font-semibold">Total HT</td>
              <td className="p-2 border text-right font-semibold">{formatEuro(estimation.totalHT)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="p-2 border text-right font-semibold">Marge réalisable</td>
              <td className="p-2 border text-right font-semibold">
                {formatEuro(margeRealisableMontant)}
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({margeRealisablePourcentage.toFixed(1)}%)
                </span>
              </td>
              <td className="p-2 border" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs uppercase text-blue-600">Marge cible</p>
          <p className="text-lg font-semibold">{targetMargin.toFixed(1)}%</p>
        </div>
        <div className="rounded border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs uppercase text-emerald-600">Marge réalisable</p>
          <p className="text-lg font-semibold">{margeRealisablePourcentage.toFixed(1)}%</p>
        </div>
        <div className={`rounded p-3 border ${ecart >= 0 ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
          <p className="text-xs uppercase">Écart</p>
          <p className="text-lg font-semibold">{ecart >= 0 ? '+' : ''}{ecart.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default EstimationResultsCard;
