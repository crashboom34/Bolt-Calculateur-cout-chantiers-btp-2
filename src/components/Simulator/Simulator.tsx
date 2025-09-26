import React, { useState } from 'react';
import { Salarie, Materiau, Chantier } from '../../types';
import PostesForm from '../PostesForm';
import EstimationResultsCard from './EstimationResultsCard';
import { PosteTravail, EstimationResponse, estimerChantier } from '../../domain/api';

interface SimulatorProps {
  salaries: Salarie[];
  materiaux: Materiau[];
  chantiers: Chantier[];
}

export const Simulator: React.FC<SimulatorProps> = ({ salaries, materiaux, chantiers }) => {
  const [postes, setPostes] = useState<PosteTravail[]>([]);
  const [estimation, setEstimation] = useState<EstimationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculer = async () => {
    if (postes.length === 0) {
      setError("Veuillez ajouter au moins un poste de travail");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await estimerChantier({ postes });
      setEstimation(result);
    } catch (err) {
      setError(`Erreur lors de l'estimation: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Simulateur de coûts</h2>
        
        <div className="mb-6">
          <PostesForm value={postes} onChange={setPostes} />
        </div>

        <div className="mt-4">
          <button
            onClick={handleCalculer}
            disabled={isLoading}
            className={`px-4 py-2 rounded font-medium ${
              isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? 'Calcul en cours...' : 'Calculer'}
          </button>
          
          {error && (
            <p className="mt-2 text-red-600">{error}</p>
          )}
        </div>

        {/* Carte de résultats API */}
        <EstimationResultsCard estimation={estimation} postes={postes} />
      </div>
    </div>
  );
};
