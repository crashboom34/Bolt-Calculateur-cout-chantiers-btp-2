import axios from 'axios';
import { Chantier } from '../schemas';

// Types pour l'API d'estimation
export interface PosteTravail {
  id: string;
  nom: string;
  description: string;
  unite: string;
  quantite: number;
}

export interface EstimationPoste {
  posteId: string;
  materiaux: {
    description: string;
    quantite: number;
    unite: string;
    prixUnitaire: number;
    coutTotal: number;
  }[];
  mainOeuvre: {
    qualification: string;
    heures: number;
    tauxHoraire: number;
    coutTotal: number;
  }[];
  coutMateriauxTotal: number;
  coutMainOeuvreTotal: number;
  coutTotal: number;
}

export interface EstimationChantier {
  chantierRef: string;
  postes: EstimationPoste[];
  coutMateriauxTotal: number;
  coutMainOeuvreTotal: number;
  coutDirectTotal: number;
  fraisGeneraux: number;
  coutTotal: number;
  margeRecommandee: number;
  prixVenteRecommande: number;
  commentaires: string[];
}

export interface EstimationRequest {
  reference: string;
  nom: string;
  adresse: string;
  surface: number;
  typeConstruction: string;
  postes: PosteTravail[];
  commentaires?: string;
  options?: {
    qualite: 'standard' | 'premium' | 'luxe';
    delai: 'normal' | 'urgent' | 'tres_urgent';
    difficulte: 'facile' | 'moyen' | 'difficile';
  };
}

// URL de l'API (à remplacer par l'URL réelle)
const API_URL = process.env.ESTIMATION_API_URL || 'https://api.estimation-btp.com/v1';

/**
 * Obtient une estimation détaillée pour un chantier
 */
export const obtenirEstimation = async (request: EstimationRequest): Promise<EstimationChantier> => {
  try {
    // En environnement de développement, simuler une réponse
    if (process.env.NODE_ENV === 'development') {
      return simulerEstimation(request);
    }
    
    // En production, appeler l'API réelle
    const response = await axios.post(`${API_URL}/estimations`, request);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'estimation du chantier:', error);
    throw new Error('Impossible d\'obtenir l\'estimation. Veuillez réessayer plus tard.');
  }
};

/**
 * Convertit une estimation en chantier
 */
export const convertirEstimationEnChantier = (estimation: EstimationChantier): Partial<Chantier> => {
  // Conversion des données d'estimation en structure de chantier
  return {
    reference: estimation.chantierRef,
    nom: `Chantier basé sur estimation ${estimation.chantierRef}`,
    fraisGeneraux: estimation.fraisGeneraux,
    margeObjectif: estimation.margeRecommandee,
    prixVenteHT: estimation.prixVenteRecommande,
    prixVenteTTC: estimation.prixVenteRecommande * 1.2, // Approximation TVA 20%
    notes: `Estimation générée automatiquement.\n\nCommentaires: ${estimation.commentaires.join('\n')}`
  };
};

/**
 * Fonction de simulation pour le développement
 * À remplacer par l'appel API réel en production
 */
const simulerEstimation = (request: EstimationRequest): EstimationChantier => {
  // Calcul des coûts de base en fonction de la surface
  const coutMateriauxBase = request.surface * 250; // 250€/m² pour les matériaux
  const coutMainOeuvreBase = request.surface * 200; // 200€/m² pour la main d'œuvre
  
  // Ajustements en fonction des options
  const coeffQualite = request.options?.qualite === 'premium' ? 1.3 : 
                       request.options?.qualite === 'luxe' ? 1.8 : 1;
  
  const coeffDelai = request.options?.delai === 'urgent' ? 1.2 : 
                     request.options?.delai === 'tres_urgent' ? 1.4 : 1;
  
  const coeffDifficulte = request.options?.difficulte === 'moyen' ? 1.15 : 
                          request.options?.difficulte === 'difficile' ? 1.3 : 1;
  
  // Application des coefficients
  const coutMateriauxTotal = coutMateriauxBase * coeffQualite * coeffDifficulte;
  const coutMainOeuvreTotal = coutMainOeuvreBase * coeffDelai * coeffDifficulte;
  
  // Création des postes d'estimation
  const postes: EstimationPoste[] = request.postes.map(poste => {
    // Répartition des coûts par poste (simulation)
    const ratio = poste.quantite / request.postes.reduce((sum, p) => sum + p.quantite, 0);
    const coutMateriauxPoste = coutMateriauxTotal * ratio;
    const coutMainOeuvrePoste = coutMainOeuvreTotal * ratio;
    
    return {
      posteId: poste.id,
      materiaux: [
        {
          description: `Matériaux pour ${poste.nom}`,
          quantite: poste.quantite,
          unite: poste.unite,
          prixUnitaire: coutMateriauxPoste / poste.quantite,
          coutTotal: coutMateriauxPoste
        }
      ],
      mainOeuvre: [
        {
          qualification: 'ouvrier',
          heures: coutMainOeuvrePoste / 35, // Approximation à 35€/h
          tauxHoraire: 35,
          coutTotal: coutMainOeuvrePoste
        }
      ],
      coutMateriauxTotal: coutMateriauxPoste,
      coutMainOeuvreTotal: coutMainOeuvrePoste,
      coutTotal: coutMateriauxPoste + coutMainOeuvrePoste
    };
  });
  
  // Calcul des totaux
  const coutDirectTotal = coutMateriauxTotal + coutMainOeuvreTotal;
  const fraisGeneraux = coutDirectTotal * 0.15; // 15% de frais généraux
  const coutTotal = coutDirectTotal + fraisGeneraux;
  const margeRecommandee = 20; // 20% de marge recommandée
  const prixVenteRecommande = coutTotal * (1 + margeRecommandee / 100);
  
  // Génération de commentaires pertinents
  const commentaires = [
    `Estimation basée sur une surface de ${request.surface}m² pour un projet de type ${request.typeConstruction}.`,
    `Qualité des matériaux: ${request.options?.qualite || 'standard'}.`,
    `Délai d'exécution: ${request.options?.delai || 'normal'}.`,
    `Niveau de difficulté estimé: ${request.options?.difficulte || 'facile'}.`
  ];
  
  if (request.commentaires) {
    commentaires.push(`Commentaires client: ${request.commentaires}`);
  }
  
  return {
    chantierRef: request.reference,
    postes,
    coutMateriauxTotal,
    coutMainOeuvreTotal,
    coutDirectTotal,
    fraisGeneraux,
    coutTotal,
    margeRecommandee,
    prixVenteRecommande,
    commentaires
  };
};
