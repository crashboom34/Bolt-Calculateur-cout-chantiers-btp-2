import { useState } from 'react';
import { estimerChantier, type EstimationResponse, type PosteTravail } from '../domain/api';

interface EstimerButtonProps {
  postes: PosteTravail[];
  onDone: (response: EstimationResponse) => void;
  onError: (message: string) => void;
}

export default function EstimerButton({ postes, onDone, onError }: EstimerButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await estimerChantier({ postes });
      onDone(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button disabled={loading} onClick={handleClick}>
      {loading ? 'Estimation…' : 'Estimer via API'}
    </button>
  );
}
