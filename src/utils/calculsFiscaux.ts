import { CalculFiscal } from '../types';

// Taux de charges sociales BTP en France (2024)
const TAUX_CHARGES_SALARIALES = 0.22; // 22%
const TAUX_CHARGES_PATRONALES = 0.44; // 44% (spécifique BTP)

export const calculerSalaireBrut = (salaireNet: number): number => {
  return salaireNet / (1 - TAUX_CHARGES_SALARIALES);
};

export const calculerChargesPatronales = (salaireBrut: number): number => {
  return salaireBrut * TAUX_CHARGES_PATRONALES;
};

export const calculerCoutTotal = (salaireBrut: number, chargesPatronales: number): number => {
  return salaireBrut + chargesPatronales;
};

export const calculCompletSalaire = (salaireNet: number): CalculFiscal => {
  const salaireBrut = calculerSalaireBrut(salaireNet);
  const chargesPatronales = calculerChargesPatronales(salaireBrut);
  const coutTotal = calculerCoutTotal(salaireBrut, chargesPatronales);

  return {
    salaireNet,
    salaireBrut,
    chargesPatronales,
    coutTotal
  };
};

export const calculerTauxHoraire = (coutTotal: number, heuresParMois: number = 151.67): number => {
  return coutTotal / heuresParMois;
};

export const calculerCoutChantierSalarie = (
  tauxHoraire: number,
  totalHeures: number,
  heuresSupplementaires: number = 0
): number => {
  // Heures normales + heures supplémentaires majorées à 25%
  const coutHeuresNormales = tauxHoraire * (totalHeures - heuresSupplementaires);
  const coutHeuresSupp = tauxHoraire * heuresSupplementaires * 1.25;
  return coutHeuresNormales + coutHeuresSupp;
};

export const formatEuro = (montant: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(montant);
};

export const formatPourcentage = (valeur: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(valeur);
};

export const calculerTVA = (montantHT: number, tauxTVA: string): number => {
  return montantHT * (parseFloat(tauxTVA) / 100);
};
