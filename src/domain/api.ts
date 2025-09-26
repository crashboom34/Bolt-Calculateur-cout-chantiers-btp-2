import { getConfig } from '@/lib/config';
import { computeChargePonderee, getPosteTypeCoefficient, type PosteTravailType } from './posteTypes';

export type PosteTravail = {
  id: string;
  nom: string;
  charge: number; // charge initiale saisie
  typePoste?: PosteTravailType;
};

export type EstimationRequest = { postes: PosteTravail[] };
export type EstimationPoste = { id: string; coutMateriaux: number; coutMainOeuvre: number };
export type EstimationResponse = { postes: EstimationPoste[]; totalHT: number; margeEstimee: number };

type PosteTravailPayload = {
  id: string;
  nom: string;
  charge: number;
  typePoste: PosteTravailType;
  chargeInitiale: number;
  coefficientTypePoste: number;
};

export async function estimerChantier(data: EstimationRequest): Promise<EstimationResponse> {
  const { apiBaseUrl } = await getConfig();

  const postesPayload: PosteTravailPayload[] = data.postes.map((poste) => {
    const typePoste = poste.typePoste ?? 'standard';
    const chargeInitiale = poste.charge;
    const chargePonderee = computeChargePonderee(chargeInitiale, typePoste);
    const coefficientTypePoste = getPosteTypeCoefficient(typePoste);

    return {
      id: poste.id,
      nom: poste.nom,
      typePoste,
      charge: chargePonderee,
      chargeInitiale,
      coefficientTypePoste,
    };
  });

  // Mode mock si apiBaseUrl est null ou 'mock'
  if (apiBaseUrl === null || apiBaseUrl === 'mock') {
    // Simuler un délai réseau
    await new Promise(r => setTimeout(r, 400));

    // Générer les données mock
    const postes: EstimationPoste[] = postesPayload.map(poste => {
      const coutMateriaux = Math.round(poste.charge * 55);
      const coutMainOeuvre = Math.round(poste.charge * 35);

      return {
        id: poste.id,
        coutMateriaux,
        coutMainOeuvre
      };
    });
    
    // Calculer le total HT
    const totalHT = postes.reduce((sum, poste) =>
      sum + poste.coutMateriaux + poste.coutMainOeuvre, 0);
    
    // Calculer la marge estimée
    const margeEstimee = Math.round(totalHT * 0.18);
    
    return {
      postes,
      totalHT,
      margeEstimee
    };
  }
  
  // Mode production: appel API réel
  const url = `${apiBaseUrl}/api/estimation`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postes: postesPayload }),
  });
  if (!res.ok) throw new Error(`API estimation ${res.status}`);
  return res.json();
}
