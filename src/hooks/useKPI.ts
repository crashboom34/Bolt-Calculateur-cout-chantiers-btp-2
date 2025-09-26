import { useMemo } from 'react';
import { Chantier, Salarie, Materiau } from '../schemas';

export function useKPI(chantiers: Chantier[], salaries: Salarie[], materiaux: Materiau[]) {
  return useMemo(() => {
    const chantiersActifs = chantiers.filter(c => c.status !== 'prospect');
    const chantiersTermines = chantiers.filter(c => c.status === 'livre' || c.status === 'facture' || c.status === 'paye');
    
    // Calculs financiers
    const coutTotalChantiers = chantiersActifs.reduce((sum, c) => sum + c.coutTotal, 0);
    const caRealise = chantiersTermines.reduce((sum, c) => sum + (c.prixVenteTTC || 0), 0);
    const caPrevu = chantiers.reduce((sum, c) => sum + (c.prixVenteTTC || 0), 0);
    
    // Marges
    const marges = chantiersTermines
      .filter(c => c.margeReelle !== undefined)
      .map(c => c.margeReelle!);
    const margeMoyenne = marges.length > 0 ? marges.reduce((sum, m) => sum + m, 0) / marges.length : 0;
    
    // Productivité
    const totalHeuresPrevues = chantiers.reduce((sum, c) => {
      return sum + c.salaries.reduce((sSum, cs) => {
        return sSum + cs.presences.reduce((pSum, p) => pSum + p.heuresPresence, 0);
      }, 0);
    }, 0);
    
    const coutMoyenHeure = totalHeuresPrevues > 0 ? coutTotalChantiers / totalHeuresPrevues : 0;
    
    // Alertes
    const alertes = [];
    
    // Stock faible
    const stocksFaibles = materiaux.filter(m => 
      m.quantiteStock <= m.seuilAlerte && m.seuilAlerte > 0
    );
    if (stocksFaibles.length > 0) {
      alertes.push({
        type: 'warning' as const,
        message: `${stocksFaibles.length} matériau(x) en stock faible`,
        details: stocksFaibles.map(m => m.nom)
      });
    }
    
    // Chantiers en retard
    const chantiersEnRetard = chantiers.filter(c => {
      if (!c.dateFin || c.status === 'livre') return false;
      return new Date(c.dateFin) < new Date();
    });
    if (chantiersEnRetard.length > 0) {
      alertes.push({
        type: 'error' as const,
        message: `${chantiersEnRetard.length} chantier(s) en retard`,
        details: chantiersEnRetard.map(c => c.nom)
      });
    }
    
    // Marges négatives
    const chantiersMargeNegative = chantiersTermines.filter(c => 
      c.margeReelle !== undefined && c.margeReelle < 0
    );
    if (chantiersMargeNegative.length > 0) {
      alertes.push({
        type: 'error' as const,
        message: `${chantiersMargeNegative.length} chantier(s) avec marge négative`,
        details: chantiersMargeNegative.map(c => c.nom)
      });
    }

    return {
      // Compteurs
      nombreChantiers: chantiers.length,
      chantiersActifs: chantiersActifs.length,
      chantiersTermines: chantiersTermines.length,
      nombreSalaries: salaries.filter(s => s.actif).length,
      nombreMateriaux: materiaux.filter(m => m.actif).length,
      
      // Financier
      coutTotalChantiers,
      caRealise,
      caPrevu,
      margeMoyenne,
      beneficeEstime: caRealise - chantiersTermines.reduce((sum, c) => sum + c.coutTotal, 0),
      
      // Productivité
      totalHeuresPrevues,
      coutMoyenHeure,
      coutMoyenChantier: chantiersActifs.length > 0 ? coutTotalChantiers / chantiersActifs.length : 0,
      
      // Alertes
      alertes,
      
      // Tendances (sur les 30 derniers jours)
      tendances: {
        nouveauxChantiers: chantiers.filter(c => {
          const creation = new Date(c.dateCreation);
          const il30Jours = new Date();
          il30Jours.setDate(il30Jours.getDate() - 30);
          return creation >= il30Jours;
        }).length,
        chantiersLivres: chantiersTermines.filter(c => {
          if (!c.dateFin) return false;
          const fin = new Date(c.dateFin);
          const il30Jours = new Date();
          il30Jours.setDate(il30Jours.getDate() - 30);
          return fin >= il30Jours;
        }).length
      }
    };
  }, [chantiers, salaries, materiaux]);
}
