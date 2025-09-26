import { getConfig } from '@/lib/config';

export type PosteTravail = { id: string; nom: string; charge: number }; // charge en heures
export type EstimationRequest = { postes: PosteTravail[] };
export type EstimationPoste = { id: string; coutMateriaux: number; coutMainOeuvre: number };
export type EstimationResponse = { postes: EstimationPoste[]; totalHT: number; margeEstimee: number };

export async function estimerChantier(data: EstimationRequest): Promise<EstimationResponse> {
  const { apiBaseUrl } = await getConfig();
  
  // Mode mock si apiBaseUrl est null ou 'mock'
  if (apiBaseUrl === null || apiBaseUrl === 'mock') {
    // Simuler un délai réseau
    await new Promise(r => setTimeout(r, 400));
    
    // Générer les données mock
    const postes: EstimationPoste[] = data.postes.map(poste => {
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
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API estimation ${res.status}`);
  return res.json();
}
