import jsPDF from 'jspdf';
import { Chantier, Salarie, Materiau, SousTraitant } from '../schemas';
import { calculerCoutsChantier } from './costEngine';
import { formatEuro, calculerTVA } from '../utils/calculsFiscaux';

export const genererDevisPDF = (
  chantier: Chantier,
  salaries: Salarie[],
  materiaux: Materiau[],
  sousTraitants: SousTraitant[],
  numeroDevis: string
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // En-tête entreprise
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BTP SARL MONTPELLIER', margin, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('123 Avenue de la République, 34000 Montpellier', margin, yPosition);
  yPosition += 5;
  pdf.text('Tél: 04 67 XX XX XX - Email: contact@btp-montpellier.fr', margin, yPosition);
  yPosition += 5;
  pdf.text('SIRET: 123 456 789 00012 - TVA: FR12345678901', margin, yPosition);
  yPosition += 20;

  // Titre devis
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`DEVIS N° ${numeroDevis}`, pageWidth - margin - 60, margin + 20);
  yPosition += 10;

  // Informations client
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CLIENT:', margin, yPosition);
  yPosition += 8;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(chantier.client.nom, margin, yPosition);
  yPosition += 6;
  pdf.text(chantier.client.adresse, margin, yPosition);
  yPosition += 6;
  if (chantier.client.telephone) {
    pdf.text(`Tél: ${chantier.client.telephone}`, margin, yPosition);
    yPosition += 6;
  }
  if (chantier.client.email) {
    pdf.text(`Email: ${chantier.client.email}`, margin, yPosition);
    yPosition += 6;
  }
  yPosition += 10;

  // Informations chantier
  pdf.setFont('helvetica', 'bold');
  pdf.text('CHANTIER:', margin, yPosition);
  yPosition += 8;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nom: ${chantier.nom}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Adresse: ${chantier.adresse}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Période: ${new Date(chantier.dateDebut).toLocaleDateString('fr-FR')}${chantier.dateFin ? ` - ${new Date(chantier.dateFin).toLocaleDateString('fr-FR')}` : ''}`, margin, yPosition);
  yPosition += 15;

  // Calculs
  const couts = calculerCoutsChantier(chantier, salaries, materiaux, sousTraitants);
  
  // Tableau des coûts
  pdf.setFont('helvetica', 'bold');
  pdf.text('DÉTAIL DES COÛTS:', margin, yPosition);
  yPosition += 10;

  // Ligne main d'œuvre
  pdf.setFont('helvetica', 'normal');
  pdf.text('Main d\'œuvre', margin, yPosition);
  pdf.text(formatEuro(couts.coutMainOeuvre), pageWidth - margin - 40, yPosition, { align: 'right' });
  yPosition += 8;

  // Ligne matériaux
  pdf.text('Matériaux et fournitures', margin, yPosition);
  pdf.text(formatEuro(couts.coutMateriaux), pageWidth - margin - 40, yPosition, { align: 'right' });
  yPosition += 8;

  // Ligne sous-traitance
  if (couts.coutSousTraitance > 0) {
    pdf.text('Sous-traitance', margin, yPosition);
    pdf.text(formatEuro(couts.coutSousTraitance), pageWidth - margin - 40, yPosition, { align: 'right' });
    yPosition += 8;
  }

  // Ligne frais généraux
  pdf.text(`Frais généraux (${chantier.fraisGeneraux}%)`, margin, yPosition);
  pdf.text(formatEuro(couts.fraisGeneraux), pageWidth - margin - 40, yPosition, { align: 'right' });
  yPosition += 8;

  // Ligne sous-total HT
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('SOUS-TOTAL HT', margin, yPosition);
  pdf.text(formatEuro(couts.coutTotal), pageWidth - margin - 40, yPosition, { align: 'right' });
  yPosition += 10;

  // TVA (supposons 20% par défaut)
  const tva = calculerTVA(couts.coutTotal, '20');
  pdf.setFont('helvetica', 'normal');
  pdf.text('TVA (20%)', margin, yPosition);
  pdf.text(formatEuro(tva), pageWidth - margin - 40, yPosition, { align: 'right' });
  yPosition += 8;

  // Total TTC
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL TTC', margin, yPosition);
  pdf.text(formatEuro(couts.coutTotal + tva), pageWidth - margin - 40, yPosition, { align: 'right' });
  yPosition += 20;

  // Conditions
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CONDITIONS:', margin, yPosition);
  yPosition += 8;
  pdf.text('- Devis valable 30 jours', margin, yPosition);
  yPosition += 5;
  pdf.text('- Acompte de 30% à la commande', margin, yPosition);
  yPosition += 5;
  pdf.text('- Solde à la livraison', margin, yPosition);
  yPosition += 5;
  pdf.text('- Garantie décennale incluse', margin, yPosition);

  // Pied de page
  const dateDevis = new Date().toLocaleDateString('fr-FR');
  pdf.text(`Devis établi le ${dateDevis}`, margin, pdf.internal.pageSize.height - 20);

  return pdf;
};

export const genererRecapitulatifChantier = (
  chantier: Chantier,
  salaries: Salarie[],
  materiaux: Materiau[],
  sousTraitants: SousTraitant[] = []
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Titre
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RÉCAPITULATIF CHANTIER', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Informations chantier
  pdf.setFontSize(12);
  pdf.text(`Chantier: ${chantier.nom}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Référence: ${chantier.reference}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Adresse: ${chantier.adresse}`, margin, yPosition);
  yPosition += 15;

  // Détail main d'œuvre
  pdf.setFont('helvetica', 'bold');
  pdf.text('DÉTAIL MAIN D\'ŒUVRE:', margin, yPosition);
  yPosition += 10;

  chantier.salaries.forEach(cs => {
    const salarie = salaries.find(s => s.id === cs.salarieId);
    if (!salarie) return;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`${salarie.prenom} ${salarie.nom}`, margin, yPosition);
    yPosition += 6;

    cs.presences.forEach(presence => {
      const date = new Date(presence.date).toLocaleDateString('fr-FR');
      const heures = `${presence.heuresPresence}h${presence.heuresSupplementaires ? ` +${presence.heuresSupplementaires}h supp.` : ''}`;
      const cout = calculerCoutChantierSalarie(
        salarie.tauxHoraire,
        presence.heuresPresence,
        presence.heuresSupplementaires || 0
      );
      
      pdf.text(`  ${date}: ${heures} = ${formatEuro(cout)}`, margin + 10, yPosition);
      if (presence.commentaire) {
        pdf.setFont('helvetica', 'italic');
        pdf.text(`    "${presence.commentaire}"`, margin + 15, yPosition + 4);
        pdf.setFont('helvetica', 'normal');
        yPosition += 4;
      }
      yPosition += 6;
    });
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total: ${formatEuro(cs.coutTotal)}`, margin + 10, yPosition);
    yPosition += 10;
  });

  // Détail sous-traitance
  if (chantier.sousTraitants && chantier.sousTraitants.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('DÉTAIL SOUS-TRAITANCE:', margin, yPosition);
    yPosition += 10;

    chantier.sousTraitants.forEach(cst => {
      const sousTraitant = sousTraitants.find(st => st.id === cst.sousTraitantId);
      if (!sousTraitant) return;

      pdf.setFont('helvetica', 'normal');
      pdf.text(`${sousTraitant.entreprise} - ${sousTraitant.nom}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`  ${cst.description}`, margin + 10, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total: ${formatEuro(cst.coutTotal)}`, margin + 10, yPosition);
      yPosition += 10;
    });
  }

  // Calculs finaux
  const couts = calculerCoutsChantier(chantier, salaries, materiaux, sousTraitants);
  yPosition += 10;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('RÉCAPITULATIF FINANCIER:', margin, yPosition);
  yPosition += 10;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Main d'œuvre: ${formatEuro(couts.coutMainOeuvre)}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Matériaux: ${formatEuro(couts.coutMateriaux)}`, margin, yPosition);
  yPosition += 6;
  if (couts.coutSousTraitance > 0) {
    pdf.text(`Sous-traitance: ${formatEuro(couts.coutSousTraitance)}`, margin, yPosition);
    yPosition += 6;
  }
  pdf.text(`Frais généraux: ${formatEuro(couts.fraisGeneraux)}`, margin, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text(`COÛT TOTAL: ${formatEuro(couts.coutTotal)}`, margin, yPosition);
  
  if (couts.margeReelle !== undefined) {
    yPosition += 10;
    pdf.text(`MARGE RÉALISÉE: ${couts.margeReelle.toFixed(1)}%`, margin, yPosition);
  }

  return pdf;
};
