import {
  Lot,
  LigneEngin,
  LigneMO,
  LigneMateriau,
  LigneSimple,
  ParamsGlobaux,
  Projet,
} from '@/types';

export type LotCategoryKey = 'materiaux' | 'mo' | 'engins' | 'sousTraitance' | 'transport' | 'divers';

export interface LotLineComputation {
  categorie: LotCategoryKey;
  designation: string;
  quantite: number | null;
  unite: string | null;
  params: Record<string, string | number>;
  coutLigne: number;
}

export interface CategoryTotals {
  materiaux: number;
  mo: number;
  engins: number;
  sousTraitance: number;
  transport: number;
  divers: number;
}

export interface LotComputationTotals {
  direct: number;
  fraisGeneraux: number;
  aleas: number;
  margeCible: number;
  remise: number;
  pvHtAvantRemise: number;
  pvHt: number;
  tva: number;
  ttc: number;
  margeApresRemise: number;
  margePct: number;
  categories: CategoryTotals;
}

export interface LotComputation {
  lot: Lot;
  lignes: LotLineComputation[];
  totaux: LotComputationTotals;
}

export interface ProjectTotals {
  direct: number;
  fraisGeneraux: number;
  aleas: number;
  margeCible: number;
  remise: number;
  pvHtAvantRemise: number;
  pvHt: number;
  tva: number;
  ttc: number;
  margeApresRemise: number;
  margePct: number;
  coutParMetrique?: number;
}

export interface ProjectComputation {
  lots: LotComputation[];
  totaux: ProjectTotals;
}

const PERCENT = 0.01;

const sum = (values: number[]): number => values.reduce((acc, value) => acc + value, 0);

const computeMateriau = (ligne: LigneMateriau): number => {
  const quantite = Number.isFinite(ligne.quantite) ? Math.max(ligne.quantite, 0) : 0;
  const pu = Number.isFinite(ligne.puHt) ? Math.max(ligne.puHt, 0) : 0;
  return quantite * pu;
};

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

interface ProductivityProfile {
  keywords: string[];
  heuresParUnite: number;
}

const DEFAULT_HEURES_PAR_UNITE = 0.35; // ~21 minutes par unité/m² par défaut

const PRODUCTIVITY_PROFILES: ProductivityProfile[] = [
  { keywords: ['macon', 'maçon', 'gros oeuvre', 'gros-oeuvre'], heuresParUnite: 0.4 },
  { keywords: ['manoeuvre', 'manœuvre'], heuresParUnite: 0.32 },
  { keywords: ['chef', 'conducteur'], heuresParUnite: 0.22 },
  { keywords: ['terrass', 'terrassement'], heuresParUnite: 0.38 },
  { keywords: ['coffr', 'beton'], heuresParUnite: 0.45 },
  { keywords: ['charpent', 'ossature'], heuresParUnite: 0.5 },
  { keywords: ['couvreur', 'toiture'], heuresParUnite: 0.42 },
  { keywords: ['plaqu', 'placo', 'platre', 'plâtr'], heuresParUnite: 0.28 },
  { keywords: ['isolation'], heuresParUnite: 0.25 },
  { keywords: ['menuiserie'], heuresParUnite: 0.4 },
  { keywords: ['peint', 'finitions'], heuresParUnite: 0.22 },
  { keywords: ['carrel'], heuresParUnite: 0.33 },
  { keywords: ['electric'], heuresParUnite: 0.6 },
  { keywords: ['plomb', 'sanitaire'], heuresParUnite: 0.55 },
  { keywords: ['hvac', 'clim', 'ventil'], heuresParUnite: 0.58 },
];

const findProfile = (poste: string): ProductivityProfile | undefined => {
  if (!poste) {
    return undefined;
  }
  const normalized = normalizeText(poste);
  return PRODUCTIVITY_PROFILES.find((profile) =>
    profile.keywords.some((keyword) => normalized.includes(keyword)),
  );
};

const scaleFactorFromQuantite = (quantite: number): number => {
  if (quantite <= 0) {
    return 0;
  }
  if (quantite < 20) {
    return 1.15;
  }
  if (quantite < 100) {
    return 1;
  }
  if (quantite < 300) {
    return 0.95;
  }
  if (quantite < 600) {
    return 0.9;
  }
  return 0.85;
};

const extractUserHeuresParUnite = (ligne: LigneMO): number => {
  const productivite = Number.isFinite(ligne.productivite) ? Math.max(ligne.productivite, 0) : 0;
  if (productivite === 0) {
    return 0;
  }
  if (ligne.mode === 'h_par_unite') {
    return productivite;
  }
  return productivite > 0 ? 1 / productivite : 0;
};

const estimateHeuresFromQuantite = (ligne: LigneMO): number => {
  const quantiteRef = Number.isFinite(ligne.quantiteRef) ? Math.max(ligne.quantiteRef, 0) : 0;
  if (quantiteRef === 0) {
    return 0;
  }

  const profile = findProfile(ligne.poste);
  const baseHeuresParUnite = profile?.heuresParUnite ?? DEFAULT_HEURES_PAR_UNITE;
  const userHeuresParUnite = extractUserHeuresParUnite(ligne);
  const heuresParUnite = userHeuresParUnite > 0
    ? baseHeuresParUnite * 0.7 + userHeuresParUnite * 0.3
    : baseHeuresParUnite;

  const scaleFactor = scaleFactorFromQuantite(quantiteRef);
  return quantiteRef * heuresParUnite * scaleFactor;
};

const computeMainOeuvre = (ligne: LigneMO): number => {
  const tauxHoraire = Number.isFinite(ligne.tauxHoraireHt) ? Math.max(ligne.tauxHoraireHt, 0) : 0;
  const charges = Number.isFinite(ligne.chargesPct) ? Math.max(ligne.chargesPct, 0) : 0;

  const heures = estimateHeuresFromQuantite(ligne);
  if (heures === 0) {
    return 0;
  }

  const coutHoraireCharge = tauxHoraire * (1 + charges * PERCENT);
  return heures * coutHoraireCharge;
};

const computeEngin = (ligne: LigneEngin): number => {
  const tauxJour = Number.isFinite(ligne.tauxJourHt) ? Math.max(ligne.tauxJourHt, 0) : 0;
  const jours = Number.isFinite(ligne.jours) ? Math.max(ligne.jours, 0) : 0;
  const carburant = Number.isFinite(ligne.carburantPct) ? Math.max(ligne.carburantPct, 0) : 0;
  const maintenance = Number.isFinite(ligne.maintenancePct) ? Math.max(ligne.maintenancePct, 0) : 0;

  const base = tauxJour * jours;
  return base * (1 + (carburant + maintenance) * PERCENT);
};

const computeSimple = (ligne: LigneSimple): number => {
  const cout = Number.isFinite(ligne.coutHt) ? Math.max(ligne.coutHt, 0) : 0;
  return cout;
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const computeCategories = (lot: Lot): {
  lignes: LotLineComputation[];
  categories: CategoryTotals;
} => {
  const materiauxLignes = lot.materiaux.map<LotLineComputation>((ligne) => ({
    categorie: 'materiaux',
    designation: ligne.designation,
    quantite: Number.isFinite(ligne.quantite) ? ligne.quantite : null,
    unite: ligne.unite || null,
    params: { puHt: ligne.puHt },
    coutLigne: computeMateriau(ligne),
  }));

  const moLignes = lot.mo.map<LotLineComputation>((ligne) => ({
    categorie: 'mo',
    designation: ligne.poste,
    quantite: Number.isFinite(ligne.quantiteRef) ? ligne.quantiteRef : null,
    unite: 'unité',
    params: {
      mode: ligne.mode,
      productivite: ligne.productivite,
      tauxHoraireHt: ligne.tauxHoraireHt,
      chargesPct: ligne.chargesPct,
      heuresEstimees: Math.round((estimateHeuresFromQuantite(ligne) + Number.EPSILON) * 100) / 100,
    },
    coutLigne: computeMainOeuvre(ligne),
  }));

  const enginLignes = lot.engins.map<LotLineComputation>((ligne) => ({
    categorie: 'engins',
    designation: ligne.type,
    quantite: Number.isFinite(ligne.jours) ? ligne.jours : null,
    unite: 'j',
    params: {
      tauxJourHt: ligne.tauxJourHt,
      carburantPct: ligne.carburantPct,
      maintenancePct: ligne.maintenancePct,
    },
    coutLigne: computeEngin(ligne),
  }));

  const sousTraitanceLignes = lot.sousTraitance.map<LotLineComputation>((ligne) => ({
    categorie: 'sousTraitance',
    designation: ligne.designation,
    quantite: 1,
    unite: null,
    params: {},
    coutLigne: computeSimple(ligne),
  }));

  const transportLignes = lot.transport.map<LotLineComputation>((ligne) => ({
    categorie: 'transport',
    designation: ligne.designation,
    quantite: 1,
    unite: null,
    params: {},
    coutLigne: computeSimple(ligne),
  }));

  const diversLignes = lot.divers.map<LotLineComputation>((ligne) => ({
    categorie: 'divers',
    designation: ligne.designation,
    quantite: 1,
    unite: null,
    params: {},
    coutLigne: computeSimple(ligne),
  }));

  const lignes = [
    ...materiauxLignes,
    ...moLignes,
    ...enginLignes,
    ...sousTraitanceLignes,
    ...transportLignes,
    ...diversLignes,
  ];

  const categories: CategoryTotals = {
    materiaux: sum(materiauxLignes.map((ligne) => ligne.coutLigne)),
    mo: sum(moLignes.map((ligne) => ligne.coutLigne)),
    engins: sum(enginLignes.map((ligne) => ligne.coutLigne)),
    sousTraitance: sum(sousTraitanceLignes.map((ligne) => ligne.coutLigne)),
    transport: sum(transportLignes.map((ligne) => ligne.coutLigne)),
    divers: sum(diversLignes.map((ligne) => ligne.coutLigne)),
  };

  return { lignes, categories };
};

export const calculateLot = (lot: Lot, params: ParamsGlobaux): LotComputation => {
  const { lignes, categories } = computeCategories(lot);
  const direct = sum(lignes.map((ligne) => ligne.coutLigne));
  const fraisGeneraux = direct * (params.fraisGenerauxPct * PERCENT);
  const aleas = direct * (params.aleasPct * PERCENT);
  const margeCible = (direct + fraisGeneraux + aleas) * (params.margePct * PERCENT);
  const pvHtAvantRemise = direct + fraisGeneraux + aleas + margeCible;
  const remise = pvHtAvantRemise * (params.remisePct * PERCENT);
  const pvHt = pvHtAvantRemise - remise;
  const tva = pvHt * (lot.tvaPct * PERCENT);
  const ttc = pvHt + tva;
  const margeApresRemise = pvHt - (direct + fraisGeneraux + aleas);
  const margePct = pvHt > 0 ? (margeApresRemise / pvHt) * 100 : 0;

  return {
    lot: deepClone(lot),
    lignes,
    totaux: {
      direct,
      fraisGeneraux,
      aleas,
      margeCible,
      remise,
      pvHtAvantRemise,
      pvHt,
      tva,
      ttc,
      margeApresRemise,
      margePct,
      categories,
    },
  };
};

export const calculateProject = (projet: Projet): ProjectComputation => {
  const lots = projet.lots.map((lot) => calculateLot(lot, projet.params));

  const direct = sum(lots.map((item) => item.totaux.direct));
  const fraisGeneraux = sum(lots.map((item) => item.totaux.fraisGeneraux));
  const aleas = sum(lots.map((item) => item.totaux.aleas));
  const margeCible = sum(lots.map((item) => item.totaux.margeCible));
  const remise = sum(lots.map((item) => item.totaux.remise));
  const pvHtAvantRemise = sum(lots.map((item) => item.totaux.pvHtAvantRemise));
  const pvHt = sum(lots.map((item) => item.totaux.pvHt));
  const tva = sum(lots.map((item) => item.totaux.tva));
  const ttc = sum(lots.map((item) => item.totaux.ttc));
  const margeApresRemise = sum(lots.map((item) => item.totaux.margeApresRemise));
  const margePct = pvHt > 0 ? (margeApresRemise / pvHt) * 100 : 0;

  const surface = Number.isFinite(projet.params.surface) ? projet.params.surface : undefined;
  const surfacePositive = surface && surface > 0 ? surface : undefined;
  const coutParMetrique = surfacePositive ? pvHt / surfacePositive : undefined;

  return {
    lots,
    totaux: {
      direct,
      fraisGeneraux,
      aleas,
      margeCible,
      remise,
      pvHtAvantRemise,
      pvHt,
      tva,
      ttc,
      margeApresRemise,
      margePct,
      coutParMetrique,
    },
  };
};

export const adjustProjectForSensitivity = (
  projet: Projet,
  adjustments: {
    materiauxPct: number;
    tauxHorairePct: number;
    productivitePct: number;
    fraisGenerauxPct: number;
    aleasPct: number;
    margePct: number;
  },
): Projet => {
  const clone = deepClone(projet);
  clone.lots.forEach((lot) => {
    lot.materiaux = lot.materiaux.map((ligne) => ({
      ...ligne,
      puHt: ligne.puHt * (1 + adjustments.materiauxPct * PERCENT),
    }));

    lot.mo = lot.mo.map((ligne) => ({
      ...ligne,
      tauxHoraireHt: ligne.tauxHoraireHt * (1 + adjustments.tauxHorairePct * PERCENT),
      productivite: ligne.productivite * (1 + adjustments.productivitePct * PERCENT),
    }));
  });

  clone.params = {
    ...clone.params,
    fraisGenerauxPct: clone.params.fraisGenerauxPct * (1 + adjustments.fraisGenerauxPct * PERCENT),
    aleasPct: clone.params.aleasPct * (1 + adjustments.aleasPct * PERCENT),
    margePct: clone.params.margePct * (1 + adjustments.margePct * PERCENT),
  };

  return clone;
};
