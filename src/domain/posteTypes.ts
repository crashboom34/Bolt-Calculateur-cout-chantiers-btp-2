export const POSTE_TYPE_ORDER = ['leger', 'standard', 'complexe', 'expert'] as const;
export type PosteTravailType = typeof POSTE_TYPE_ORDER[number];

export type PosteTypeDefinition = {
  label: string;
  coefficient: number;
  description: string;
};

export const POSTE_TYPE_DEFINITIONS: Record<PosteTravailType, PosteTypeDefinition> = {
  leger: {
    label: 'Faible complexité',
    coefficient: 0.85,
    description: 'Tâches simples avec peu de risques et une technicité limitée.'
  },
  standard: {
    label: 'Standard',
    coefficient: 1,
    description: 'Postes courants sans difficulté particulière.'
  },
  complexe: {
    label: 'Complexe',
    coefficient: 1.25,
    description: 'Travaux nécessitant une coordination accrue ou des compétences spécifiques.'
  },
  expert: {
    label: 'Expert',
    coefficient: 1.5,
    description: 'Interventions hautement techniques avec un niveau d’expertise élevé.'
  }
};

export function getPosteTypeCoefficient(type: PosteTravailType | undefined): number {
  if (!type) {
    return POSTE_TYPE_DEFINITIONS.standard.coefficient;
  }
  return POSTE_TYPE_DEFINITIONS[type]?.coefficient ?? POSTE_TYPE_DEFINITIONS.standard.coefficient;
}

export function computeChargePonderee(charge: number, type: PosteTravailType | undefined): number {
  const coefficient = getPosteTypeCoefficient(type);
  return Math.round(charge * coefficient * 100) / 100;
}
