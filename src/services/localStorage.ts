import { Salarie, Materiau, Chantier } from '../types';
import { formatEuro } from '../utils/calculsFiscaux';

const STORAGE_KEYS = {
  SALARIES: 'btp-calculator-salaries',
  MATERIAUX: 'btp-calculator-materiaux', 
  CHANTIERS: 'btp-calculator-chantiers'
};

export const saveSalaries = (salaries: Salarie[]): void => {
  localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify(salaries));
};

export const loadSalaries = (): Salarie[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SALARIES);
  return data ? JSON.parse(data) : [];
};

export const saveMateriaux = (materiaux: Materiau[]): void => {
  localStorage.setItem(STORAGE_KEYS.MATERIAUX, JSON.stringify(materiaux));
};

export const loadMateriaux = (): Materiau[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MATERIAUX);
  return data ? JSON.parse(data) : [];
};

export const saveChantiers = (chantiers: Chantier[]): void => {
  localStorage.setItem(STORAGE_KEYS.CHANTIERS, JSON.stringify(chantiers));
};

export const loadChantiers = (): Chantier[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CHANTIERS);
  return data ? JSON.parse(data) : [];
};

export const exportToPDF = (chantier: Chantier): void => {
  // Pour une vraie implémentation, nous utiliserions une lib comme jsPDF
  // Ici, nous créons un récapitulatif formaté pour impression
  
  // Calcul des détails de présence
  const detailsPresences = chantier.salaries.map(cs => {
    const totalHeures = cs.presences.reduce((sum, p) => sum + p.heuresPresence, 0);
    const totalHeuresSupp = cs.presences.reduce((sum, p) => sum + (p.heuresSupplementaires || 0), 0);
    const nombreJours = cs.presences.length;
    return {
      salarieId: cs.salarieId,
      nombreJours,
      totalHeures,
      totalHeuresSupp,
      coutTotal: cs.coutTotal,
      presences: cs.presences
    };
  }).filter(d => d.nombreJours > 0);

  const content = `
=== RÉCAPITULATIF CHANTIER ===
Nom: ${chantier.nom}
Adresse: ${chantier.adresse}
Période: ${chantier.dateDebut} - ${chantier.dateFin}

DÉTAIL MAIN D'ŒUVRE:
${detailsPresences.map(detail => `
Salarié ID: ${detail.salarieId}
- ${detail.nombreJours} jours travaillés
- ${detail.totalHeures}h normales${detail.totalHeuresSupp > 0 ? ` + ${detail.totalHeuresSupp}h supplémentaires` : ''}
- Coût: ${formatEuro(detail.coutTotal)}

Détail des présences:
${detail.presences.map(p => `  ${p.date}: ${p.heuresPresence}h${p.heuresSupplementaires ? ` +${p.heuresSupplementaires}h supp.` : ''}${p.commentaire ? ` (${p.commentaire})` : ''}`).join('\n')}
`).join('\n')}

Main d'œuvre: ${formatEuro(chantier.coutMainOeuvre)}
Matériaux: ${formatEuro(chantier.coutMateriaux)}
Frais généraux: ${formatEuro((chantier.coutMainOeuvre + chantier.coutMateriaux) * (chantier.fraisGeneraux / 100))}

COÛT TOTAL: ${formatEuro(chantier.coutTotal)}
${chantier.marge ? `MARGE: ${new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(chantier.marge / 100)}` : ''}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chantier-${chantier.nom.replace(/\s+/g, '-').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};
