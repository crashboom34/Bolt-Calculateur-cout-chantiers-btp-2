import { z } from 'zod';
import { POSTE_TYPE_ORDER } from '@/domain/posteTypes';

// Schémas de base
export const PosteTravailSchema = z.object({
  id: z.string(),
  nom: z.string(),
  charge: z.number().min(0),
  typePoste: z.enum(POSTE_TYPE_ORDER).optional(),
});

export const EstimationPosteSchema = z.object({
  id: z.string(),
  coutMateriaux: z.number().min(0),
  coutMainOeuvre: z.number().min(0),
});

export const EstimationResponseSchema = z.object({
  postes: z.array(EstimationPosteSchema),
  totalHT: z.number().min(0),
  margeEstimee: z.number(),
});

export const SalarieSchema = z.object({
  id: z.string(),
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  salaireNet: z.number().positive('Le salaire net doit être positif'),
  salaireBrut: z.number().positive(),
  chargesPatronales: z.number().positive(),
  coutTotal: z.number().positive(),
  tauxHoraire: z.number().positive(),
  heuresParJour: z.number().min(1).max(12, 'Maximum 12h par jour'),
  qualification: z.enum(['ouvrier', 'chef_equipe', 'conducteur_travaux', 'ingenieur']).default('ouvrier'),
  dateEmbauche: z.string().optional(),
  actif: z.boolean().default(true),
  tags: z.array(z.string()).default([])
});

export const MateriauSchema = z.object({
  id: z.string(),
  nom: z.string().min(1, 'Le nom est requis'),
  reference: z.string().optional(),
  prixUnitaire: z.number().positive('Le prix doit être positif'),
  unite: z.enum(['m²', 'm³', 'ml', 'kg', 't', 'sac', 'unité', 'lot', 'forfait']),
  quantiteStock: z.number().min(0).default(0),
  seuilAlerte: z.number().min(0).default(0),
  fournisseur: z.string().optional(),
  categorie: z.enum([
    'gros_oeuvre', 'second_oeuvre', 'plomberie', 'electricite', 
    'peinture', 'carrelage', 'menuiserie', 'isolation', 
    'couverture', 'outillage', 'location_materiel'
  ]),
  tauxTVA: z.enum(['5.5', '10', '20']).default('20'),
  actif: z.boolean().default(true),
  tags: z.array(z.string()).default([])
});

export const ChantierPresenceSchema = z.object({
  date: z.string(),
  heuresPresence: z.number().min(0).max(24),
  heuresSupplementaires: z.number().min(0).max(12).default(0),
  tacheDescription: z.string().optional(),
  commentaire: z.string().optional()
});

export const ChantierSalarieSchema = z.object({
  salarieId: z.string(),
  presences: z.array(ChantierPresenceSchema).default([]),
  coutTotal: z.number().min(0).default(0)
});

export const ChantierMateriauSchema = z.object({
  materiauId: z.string(),
  quantite: z.number().positive(),
  prixUnitaireReel: z.number().positive().optional(),
  tauxTVA: z.enum(['5.5', '10', '20']).default('20'),
  coutHT: z.number().min(0),
  coutTTC: z.number().min(0)
});

export const EcheancierSchema = z.object({
  id: z.string(),
  libelle: z.string(),
  montantHT: z.number().positive(),
  montantTTC: z.number().positive(),
  dateEcheance: z.string(),
  statut: z.enum(['prevu', 'facture', 'paye']).default('prevu'),
  numeroFacture: z.string().optional()
});

export const SousTraitantSchema = z.object({
  id: z.string(),
  nom: z.string().min(1, 'Le nom est requis'),
  entreprise: z.string().min(1, 'Le nom de l\'entreprise est requis'),
  specialite: z.enum([
    'plomberie', 'electricite', 'peinture', 'carrelage', 'menuiserie', 
    'isolation', 'couverture', 'cloisons', 'sols', 'facades', 'autre'
  ]),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  siret: z.string().optional(),
  actif: z.boolean().default(true),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export const ChantierSousTraitantSchema = z.object({
  sousTraitantId: z.string(),
  description: z.string().min(1, 'La description est requise'),
  dateDebut: z.string(),
  dateFin: z.string().optional(),
  montantForfait: z.number().positive('Le montant forfaitaire doit être positif'),
  coutTotal: z.number().min(0),
  statut: z.enum(['prevu', 'en_cours', 'termine', 'facture']).default('prevu'),
  notes: z.string().optional()
});

export const ChantierSchema = z.object({
  id: z.string(),
  reference: z.string().min(1, 'La référence est requise'),
  nom: z.string().min(1, 'Le nom est requis'),
  client: z.object({
    nom: z.string().min(1),
    adresse: z.string().min(1),
    telephone: z.string().optional(),
    email: z.string().email().optional(),
    siret: z.string().optional()
  }),
  adresse: z.string().min(1, 'L\'adresse est requise'),
  dateDebut: z.string(),
  dateFin: z.string().optional(),
  dateCreation: z.string(),
  salaries: z.array(ChantierSalarieSchema).default([]),
  materiaux: z.array(ChantierMateriauSchema).default([]),
  sousTraitants: z.array(ChantierSousTraitantSchema).default([]),
  fraisGeneraux: z.number().min(0).max(100).default(15),
  margeObjectif: z.number().min(0).max(100).default(20),
  coutMainOeuvre: z.number().min(0).default(0),
  coutMateriaux: z.number().min(0).default(0),
  coutSousTraitance: z.number().min(0).default(0),
  coutTotal: z.number().min(0).default(0),
  prixVenteHT: z.number().min(0).optional(),
  prixVenteTTC: z.number().min(0).optional(),
  margeReelle: z.number().optional(),
  status: z.enum(['prospect', 'devis', 'en_cours', 'livre', 'facture', 'paye']).default('prospect'),
  echeancier: z.array(EcheancierSchema).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  version: z.number().default(1)
});

// Types dérivés
export type SousTraitant = z.infer<typeof SousTraitantSchema>;
export type ChantierSousTraitant = z.infer<typeof ChantierSousTraitantSchema>;
export type Salarie = z.infer<typeof SalarieSchema>;
export type Materiau = z.infer<typeof MateriauSchema>;
export type Chantier = z.infer<typeof ChantierSchema>;
export type ChantierPresence = z.infer<typeof ChantierPresenceSchema>;
export type ChantierSalarie = z.infer<typeof ChantierSalarieSchema>;
export type ChantierMateriau = z.infer<typeof ChantierMateriauSchema>;
export type Echeancier = z.infer<typeof EcheancierSchema>;

// Schémas pour les formulaires
export const SousTraitantFormSchema = SousTraitantSchema.omit({ id: true });
export const SalarieFormSchema = SalarieSchema.omit({ 
  id: true, 
  salaireBrut: true, 
  chargesPatronales: true, 
  coutTotal: true, 
  tauxHoraire: true 
});

export const MateriauFormSchema = MateriauSchema.omit({ id: true });

export const ChantierFormSchema = ChantierSchema.omit({
  id: true,
  dateCreation: true,
  coutMainOeuvre: true,
  coutMateriaux: true,
  coutSousTraitance: true,
  coutTotal: true,
  margeReelle: true,
  version: true
});

export type SousTraitantFormData = z.infer<typeof SousTraitantFormSchema>;
export type SalarieFormData = z.infer<typeof SalarieFormSchema>;
export type MateriauFormData = z.infer<typeof MateriauFormSchema>;
export type ChantierFormData = z.infer<typeof ChantierFormSchema>;

export const EstimationHistoryItemSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  postes: z.array(PosteTravailSchema),
  estimation: EstimationResponseSchema,
  targetMargin: z.number().min(0).max(100),
});

export const EstimationHistorySchema = z.array(EstimationHistoryItemSchema);

export type EstimationHistoryItem = z.infer<typeof EstimationHistoryItemSchema>;
