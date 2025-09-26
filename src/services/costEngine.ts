import { Salarie, Materiau, Chantier, SousTraitant } from '../schemas';

/**
 * Moteur de calcul des coûts pour les chantiers BTP
 * Calculs conformes à la réglementation française
 */

export interface CoutSalarie {
  salaireNet: number;
  salaireBrut: number;
  chargesPatronales: number;
  coutTotal: number;
  tauxCharges: number;
}

export interface CoutMateriau {
  prixHT: number;
  montantTVA: number;
  totalTTC: number;
  tauxTVA: number;
}

export interface CoutChantier {
  coutMainOeuvre: number;
  coutMateriaux: number;
  coutSousTraitance: number;
  coutDirect: number;
  fraisGeneraux: number;
  coutTotal: number;
  prixVenteRecommande: number;
  margeReelle: number;
  margeObjectif: number;
}

export interface KPIChantier {
  nombreJoursTravailles: number;
  heuresMoyennesParJour: number;
  totalHeuresSupplementaires: number;
  coutHoraireMoyen: number;
  productivite: number; // heures réelles vs heures prévues
  deriveMateriaux: number; // coût réel vs prévu
  deriveSousTraitance: number; // coût réel vs prévu
  rentabilite: number; // marge / CA
}

/**
 * Calcule le coût complet d'un salarié (net → brut → charges → total employeur)
 */
export const calculerCoutSalarie = (
  salaireNet: number,
  nombreSemaines: number = 1,
  heuresSupplementaires: number = 0
): CoutSalarie => {
  // Conversion net → brut (approximation pour le BTP)
  const salaireBrut = salaireNet * 1.28;
  
  // Charges patronales BTP (taux moyen 44%)
  const tauxCharges = 0.44;
  const chargesPatronales = salaireBrut * tauxCharges;
  
  // Majoration heures supplémentaires (+25%)
  const majorationHS = heuresSupplementaires * (salaireBrut / 35) * 0.25;
  
  const coutTotal = (salaireBrut + chargesPatronales + majorationHS) * nombreSemaines;

  return {
    salaireNet: salaireNet * nombreSemaines,
    salaireBrut: salaireBrut * nombreSemaines,
    chargesPatronales: (chargesPatronales + majorationHS) * nombreSemaines,
    coutTotal,
    tauxCharges
  };
};

/**
 * Calcule le coût d'un matériau avec TVA
 */
export const calculerCoutMateriau = (
  prixUnitaire: number,
  quantite: number,
  tauxTVA: number = 20
): CoutMateriau => {
  const prixHT = prixUnitaire * quantite;
  const montantTVA = prixHT * (tauxTVA / 100);
  const totalTTC = prixHT + montantTVA;

  return {
    prixHT,
    montantTVA,
    totalTTC,
    tauxTVA
  };
};

/**
 * Calcule le coût d'une prestation de sous-traitance
 */
export const calculerCoutSousTraitance = (montantForfait: number): number => {
  return montantForfait;
};

/**
 * Calcule le coût complet d'un chantier
 */
export const calculerCoutsChantier = (
  chantier: Chantier,
  salaries: Salarie[],
  materiaux: Materiau[],
  sousTraitants: SousTraitant[] = []
) => {
  // Calcul coût main d'œuvre
  let coutMainOeuvre = 0;
  
  chantier.salaries.forEach(cs => {
    coutMainOeuvre += cs.coutTotal;
  });

  // Calcul coût matériaux
  let coutMateriaux = 0;
  
  chantier.materiaux.forEach(cm => {
    coutMateriaux += cm.coutTTC;
  });

  // Calcul coût sous-traitance
  let coutSousTraitance = 0;
  
  if (chantier.sousTraitants) {
    chantier.sousTraitants.forEach(cst => {
      coutSousTraitance += cst.coutTotal;
    });
  }

  const coutDirect = coutMainOeuvre + coutMateriaux + coutSousTraitance;
  const fraisGeneraux = coutDirect * (chantier.fraisGeneraux / 100);
  const coutTotal = coutDirect + fraisGeneraux;
  const prixVenteRecommande = coutTotal * (1 + chantier.margeObjectif / 100);
  
  const margeReelle = chantier.prixVenteTTC 
    ? ((chantier.prixVenteTTC - coutTotal) / chantier.prixVenteTTC) * 100
    : 0;

  return {
    coutMainOeuvre,
    coutMateriaux,
    coutSousTraitance,
    coutDirect,
    fraisGeneraux,
    coutTotal,
    prixVenteRecommande,
    margeReelle,
    margeObjectif: chantier.margeObjectif
  };
};

/**
 * Calcule les KPI d'un chantier
 */
export const calculerKPIChantier = (
  chantier: Chantier,
  salaries: Salarie[]
): KPIChantier => {
  let nombreJoursTravailles = 0;
  let totalHeures = 0;
  let totalHeuresSupplementaires = 0;
  let coutTotal = 0;

  // Analyse des présences
  if (chantier.taches) {
    chantier.taches.forEach(tache => {
      const salarie = salaries.find(s => s.id === tache.salarieId);
      if (salarie && tache.presences) {
        nombreJoursTravailles += tache.presences.length;
        
        tache.presences.forEach(presence => {
          totalHeures += presence.heuresNormales;
          totalHeuresSupplementaires += presence.heuresSupplementaires || 0;
          
          const coutJour = calculerCoutSalarie(
            salarie.salaireNet / 35 * presence.heuresNormales,
            1,
            presence.heuresSupplementaires || 0
          );
          coutTotal += coutJour.coutTotal;
        });
      }
    });
  }

  const heuresMoyennesParJour = nombreJoursTravailles > 0 ? totalHeures / nombreJoursTravailles : 0;
  const coutHoraireMoyen = totalHeures > 0 ? coutTotal / totalHeures : 0;
  
  // Calcul productivité (heures réelles vs prévues)
  const heuresPrevues = chantier.taches?.reduce((acc, tache) => acc + tache.heures, 0) || 0;
  const productivite = heuresPrevues > 0 ? (totalHeures / heuresPrevues) * 100 : 100;
  
  // Dérive matériaux (à implémenter avec budget prévisionnel)
  const deriveMateriaux = 0;
  
  // Rentabilité
  const rentabilite = chantier.prixVenteClient && chantier.prixVenteClient > 0
    ? ((chantier.prixVenteClient - coutTotal) / chantier.prixVenteClient) * 100
    : 0;

  return {
    nombreJoursTravailles,
    heuresMoyennesParJour,
    totalHeuresSupplementaires,
    coutHoraireMoyen,
    productivite,
    deriveMateriaux,
    rentabilite
  };
};

/**
 * Simule l'impact de variations sur un chantier
 */
export const simulerVariations = (
  chantier: Chantier,
  salaries: Salarie[],
  materiaux: Materiau[],
  variations: {
    productivite: number; // %
    prixMateriaux: number; // %
    absences: number; // %
  }
): CoutChantier => {
  // Créer une copie du chantier avec les variations appliquées
  const chantierSimule: Chantier = {
    ...chantier,
    taches: chantier.taches?.map(tache => ({
      ...tache,
      heures: tache.heures * (1 + variations.absences / 100) / (1 + variations.productivite / 100)
    })),
    lignesMateriaux: chantier.lignesMateriaux?.map(ligne => {
      const materiau = materiaux.find(m => m.id === ligne.materiauId);
      if (materiau) {
        const materiauAjuste: Materiau = {
          ...materiau,
          prixUnitaire: materiau.prixUnitaire * (1 + variations.prixMateriaux / 100)
        };
        return ligne;
      }
      return ligne;
    })
  };

  return calculerCoutChantier(chantierSimule, salaries, materiaux);
};

/**
 * Génère un rapport de coûts détaillé
 */
export const genererRapportCouts = (
  chantier: Chantier,
  salaries: Salarie[],
  materiaux: Materiau[]
) => {
  const couts = calculerCoutChantier(chantier, salaries, materiaux);
  const kpis = calculerKPIChantier(chantier, salaries);

  return {
    chantier: {
      id: chantier.id,
      nom: chantier.nom,
      client: chantier.client,
      statut: chantier.statut
    },
    couts,
    kpis,
    alertes: [
      ...(couts.margeReelle < 10 ? ['Marge faible (< 10%)'] : []),
      ...(kpis.productivite < 80 ? ['Productivité faible (< 80%)'] : []),
      ...(kpis.totalHeuresSupplementaires > 20 ? ['Nombreuses heures supplémentaires'] : [])
    ],
    recommandations: [
      ...(couts.margeReelle < 15 ? ['Revoir les prix de vente ou optimiser les coûts'] : []),
      ...(kpis.heuresMoyennesParJour > 10 ? ['Surveiller la fatigue des équipes'] : []),
      ...(kpis.productivite > 120 ? ['Excellente productivité, capitaliser sur les bonnes pratiques'] : [])
    ]
  };
};
