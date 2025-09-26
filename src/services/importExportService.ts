import { Salarie, Materiau, Chantier } from '../schemas';

export const exportToJSON = (data: {
  salaries: Salarie[];
  materiaux: Materiau[];
  chantiers: Chantier[];
}) => {
  const exportData = {
    ...data,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `btp-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header] || '';
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Fichier JSON invalide'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file);
  });
};

export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n');
  const result: string[][] = [];
  
  for (const line of lines) {
    if (line.trim()) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      row.push(current.trim());
      result.push(row);
    }
  }
  
  return result;
};

export const genererNumeroDevis = (chantiers: Chantier[]): string => {
  const annee = new Date().getFullYear();
  const devisAnnee = chantiers.filter(c => 
    c.dateCreation.startsWith(annee.toString())
  ).length + 1;
  
  return `DEV${annee}${devisAnnee.toString().padStart(4, '0')}`;
};

export const genererNumeroFacture = (chantiers: Chantier[]): string => {
  const annee = new Date().getFullYear();
  const facturesAnnee = chantiers.filter(c => 
    c.status === 'facture' || c.status === 'paye'
  ).length + 1;
  
  return `FAC${annee}${facturesAnnee.toString().padStart(4, '0')}`;
};
