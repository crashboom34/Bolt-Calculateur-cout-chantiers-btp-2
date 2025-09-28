export interface Salarie {
  id: string;
  nom: string;
  prenom: string;
  salaireNet: number;
  salaireBrut: number;
  chargesPatronales: number;
  coutTotal: number;
  tauxHoraire: number;
  heuresParJour: number;
}

export interface Materiau {
  id: string;
  nom: string;
  prixUnitaire: number;
  unite: string;
  quantite: number;
  coutTotal: number;
  fournisseur?: string;
  categorie: string;
}

export interface ChantierSalarie {
  salarieId: string;
  presences: ChantierPresence[];
  coutTotal: number;
}

export interface ChantierPresence {
  date: string;
  heuresPresence: number;
  heuresSupplementaires?: number;
  commentaire?: string;
}

export interface ChantierMateriau {
  materiauId: string;
  quantite: number;
  coutTotal: number;
}

export interface Chantier {
  id: string;
  nom: string;
  adresse: string;
  dateDebut: string;
  dateFin: string;
  salaries: ChantierSalarie[];
  materiaux: ChantierMateriau[];
  fraisGeneraux: number;
  prixVenteClient?: number;
  coutMainOeuvre: number;
  coutMateriaux: number;
  coutTotal: number;
  marge?: number;
  status: 'en_cours' | 'termine' | 'planifie';
}

export interface CalculFiscal {
  salaireNet: number;
  salaireBrut: number;
  chargesPatronales: number;
  coutTotal: number;
}

export type ProductiviteMode = 'h_par_unite' | 'unites_par_h';

export interface LigneMateriau {
  designation: string;
  unite: string;
  quantite: number;
  puHt: number;
}

export interface LigneMO {
  poste: string;
  mode: ProductiviteMode;
  productivite: number;
  quantiteRef: number;
  tauxHoraireHt: number;
  chargesPct: number;
}

export interface LigneEngin {
  type: string;
  tauxJourHt: number;
  jours: number;
  carburantPct: number;
  maintenancePct: number;
}

export interface LigneSimple {
  designation: string;
  coutHt: number;
}

export interface Lot {
  id: string;
  nom: string;
  tvaPct: 10 | 20;
  materiaux: LigneMateriau[];
  mo: LigneMO[];
  engins: LigneEngin[];
  sousTraitance: LigneSimple[];
  transport: LigneSimple[];
  divers: LigneSimple[];
  notes?: string;
}

export interface ParamsGlobaux {
  fraisGenerauxPct: number;
  aleasPct: number;
  margePct: number;
  remisePct: number;
  tvaDefautPct: 10 | 20;
  chargesSocialesDefautPct: number;
  tauxHoraireMoDefaut: number;
  metrique: 'm2' | 'ml' | 'unite';
  surface?: number;
}

export interface Projet {
  meta: {
    nom: string;
    version: string;
  };
  params: ParamsGlobaux;
  lots: Lot[];
}

export type ScenarioKey = 'A' | 'B' | 'C';

export const SCENARIO_KEYS: readonly ScenarioKey[] = ['A', 'B', 'C'];

export const DEFAULT_DATA: Projet = {
  meta: { nom: 'Projet exemple', version: '1.0.0' },
  params: {
    fraisGenerauxPct: 12,
    aleasPct: 7,
    margePct: 15,
    remisePct: 0,
    tvaDefautPct: 20,
    chargesSocialesDefautPct: 45,
    tauxHoraireMoDefaut: 38,
    metrique: 'm2',
    surface: undefined,
  },
  lots: [
    {
      id: 'lot-1',
      nom: 'Gros œuvre',
      tvaPct: 20,
      materiaux: [
        { designation: 'Ciment CEM II 35kg', unite: 'sac', quantite: 120, puHt: 7.8 },
        { designation: 'Acier HA Fe500', unite: 'kg', quantite: 850, puHt: 1.65 },
      ],
      mo: [
        { poste: 'Maçon qualifié', mode: 'h_par_unite', productivite: 0, quantiteRef: 1200, tauxHoraireHt: 42, chargesPct: 45 },
      ],
      engins: [
        { type: 'Pelle 5T', tauxJourHt: 320, jours: 3, carburantPct: 8, maintenancePct: 4 },
      ],
      sousTraitance: [{ designation: 'Pompe à béton', coutHt: 550 }],
      transport: [{ designation: 'Camion 20m³ (mascotte)', coutHt: 380 }],
      divers: [],
    },
  ],
};
