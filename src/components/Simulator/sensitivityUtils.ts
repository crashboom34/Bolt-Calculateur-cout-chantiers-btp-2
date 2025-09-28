import { adjustProjectForSensitivity, calculateProject, ProjectComputation } from '@/core/calc';
import { Projet } from '@/types';

export interface SensitivityState {
  materiauxPct: number;
  tauxHorairePct: number;
  productivitePct: number;
  fraisGenerauxPct: number;
  aleasPct: number;
  margePct: number;
}

export type SensitivityKey = keyof SensitivityState;

export interface SensitivityVariable {
  key: SensitivityKey;
  label: string;
}

export interface SensitivityRow {
  key: SensitivityKey;
  label: string;
  deltaPvHt: number;
  deltaMarge: number;
}

export const SENSITIVITY_VARIABLES: SensitivityVariable[] = [
  { key: 'materiauxPct', label: 'Prix des matériaux' },
  { key: 'tauxHorairePct', label: 'Taux horaire MO' },
  { key: 'productivitePct', label: 'Productivité MO' },
  { key: 'fraisGenerauxPct', label: 'Frais généraux' },
  { key: 'aleasPct', label: 'Aléas' },
  { key: 'margePct', label: 'Marge' },
];

export const SENSITIVITY_STEPS = [5, 10, 15] as const;

export const buildSensitivityRows = (
  projet: Projet,
  base: ProjectComputation,
  state: SensitivityState,
): SensitivityRow[] => {
  return SENSITIVITY_VARIABLES.map(({ key, label }) => {
    const value = state[key];
    if (value === 0) {
      return { key, label, deltaPvHt: 0, deltaMarge: 0 };
    }
    const adjustment: SensitivityState = {
      materiauxPct: 0,
      tauxHorairePct: 0,
      productivitePct: 0,
      fraisGenerauxPct: 0,
      aleasPct: 0,
      margePct: 0,
    };
    adjustment[key] = value;
    const adjusted = adjustProjectForSensitivity(projet, adjustment);
    const computed = calculateProject(adjusted);
    return {
      key,
      label,
      deltaPvHt: computed.totaux.pvHt - base.totaux.pvHt,
      deltaMarge: computed.totaux.margeApresRemise - base.totaux.margeApresRemise,
    };
  });
};
