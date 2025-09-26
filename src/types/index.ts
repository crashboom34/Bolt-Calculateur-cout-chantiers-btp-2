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
