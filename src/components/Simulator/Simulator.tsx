import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LigneEngin,
  LigneMO,
  LigneMateriau,
  LigneSimple,
  Lot,
  ParamsGlobaux,
  Projets,
  ScenarioKey,
  SCENARIO_KEYS,
} from '@/types';
import { adjustProjectForSensitivity, calculateProject, LotCategoryKey, ProjectComputation } from '@/core/calc';
import { cloneScenario, loadScenario, resetScenario, saveScenario } from '@/services/scenarioStorage';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { formatEuro } from '@/utils/calculsFiscaux';
import { newId } from '@/lib/id';
import { SensitivityAnalysis } from './SensitivityAnalysis';
import { buildSensitivityRows, SensitivityState } from './sensitivityUtils';

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type LotCollectionKey = LotCategoryKey;

type CollectionMap = {
  materiaux: LigneMateriau[];
  mo: LigneMO[];
  engins: LigneEngin[];
  sousTraitance: LigneSimple[];
  transport: LigneSimple[];
  divers: LigneSimple[];
};

const COLLECTION_KEYS: LotCollectionKey[] = ['materiaux', 'mo', 'engins', 'sousTraitance', 'transport', 'divers'];

const createEmptyLine = <K extends LotCollectionKey>(key: K, params: ParamsGlobaux): CollectionMap[K][number] => {
  switch (key) {
    case 'materiaux':
      return {
        designation: '',
        unite: '',
        quantite: 0,
        puHt: 0,
      } as CollectionMap[K][number];
    case 'mo':
      return {
        poste: '',
        mode: 'h_par_unite',
        productivite: 0,
        quantiteRef: 0,
        tauxHoraireHt: params.tauxHoraireMoDefaut,
        chargesPct: params.chargesSocialesDefautPct,
      } as CollectionMap[K][number];
    case 'engins':
      return {
        type: '',
        tauxJourHt: 0,
        jours: 1,
        carburantPct: 0,
        maintenancePct: 0,
      } as CollectionMap[K][number];
    case 'sousTraitance':
    case 'transport':
    case 'divers':
      return {
        designation: '',
        coutHt: 0,
      } as CollectionMap[K][number];
    default:
      return {
        designation: '',
        coutHt: 0,
      } as CollectionMap[K][number];
  }
};

const marginThresholdPct = 10;

type LibraryCategory = LotCollectionKey;

type LibraryEntries = {
  [K in LibraryCategory]: Array<{ label: string; value: CollectionMap[K][number] }>;
};

const cloneLibraryValue = <K extends LibraryCategory>(value: LibraryEntries[K][number]['value']): CollectionMap[K][number] => (
  JSON.parse(JSON.stringify(value)) as CollectionMap[K][number]
);

const libraryEntries: LibraryEntries = {
  mo: [
    { label: 'Maçon', value: { poste: 'Maçon', mode: 'h_par_unite', productivite: 0, quantiteRef: 0, tauxHoraireHt: 42, chargesPct: 45 } },
    { label: 'Manœuvre', value: { poste: 'Manœuvre', mode: 'h_par_unite', productivite: 0, quantiteRef: 0, tauxHoraireHt: 32, chargesPct: 45 } },
    { label: "Chef d'équipe", value: { poste: "Chef d'équipe", mode: 'h_par_unite', productivite: 0, quantiteRef: 0, tauxHoraireHt: 48, chargesPct: 45 } },
  ],
  engins: [
    { label: 'Pelle 1,7T', value: { type: 'Pelle 1,7T', tauxJourHt: 240, jours: 1, carburantPct: 6, maintenancePct: 4 } },
    { label: 'Pelle 2,7T', value: { type: 'Pelle 2,7T', tauxJourHt: 280, jours: 1, carburantPct: 7, maintenancePct: 4 } },
    { label: 'Pelle 5T', value: { type: 'Pelle 5T', tauxJourHt: 320, jours: 1, carburantPct: 8, maintenancePct: 4 } },
    { label: 'Bobcat 2,7T', value: { type: 'Bobcat 2,7T', tauxJourHt: 300, jours: 1, carburantPct: 7, maintenancePct: 4 } },
    { label: 'Camion 20 m³ (mascotte)', value: { type: 'Camion 20 m³ (mascotte)', tauxJourHt: 390, jours: 1, carburantPct: 10, maintenancePct: 5 } },
  ],
  transport: [
    { label: 'Décharge gravats 140 €/t', value: { designation: 'Décharge gravats', coutHt: 140 } },
  ],
  materiaux: [
    { label: 'Granulats 0/31.5 18 €/t', value: { designation: 'Granulats 0/31.5', unite: 't', quantite: 1, puHt: 18 } },
    { label: 'Béton C25/30 115 €/m³', value: { designation: 'Béton C25/30', unite: 'm³', quantite: 1, puHt: 115 } },
    { label: 'BA13 3,1 €/m²', value: { designation: 'BA13', unite: 'm²', quantite: 1, puHt: 3.1 } },
  ],
  sousTraitance: [
    { label: 'Pompe à béton', value: { designation: 'Pompe à béton', coutHt: 550 } },
  ],
  divers: [],
};

type TableColumn = {
  key: string;
  header: string;
  inputType: 'text' | 'number' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  ariaLabel: string;
};

const collectionColumns: Record<LotCollectionKey, TableColumn[]> = {
  materiaux: [
    { key: 'designation', header: 'Désignation', inputType: 'text', ariaLabel: 'Désignation du matériau' },
    { key: 'unite', header: 'Unité', inputType: 'text', ariaLabel: "Unité de mesure" },
    { key: 'quantite', header: 'Quantité', inputType: 'number', min: 0, step: 0.01, ariaLabel: 'Quantité' },
    { key: 'puHt', header: 'PU HT', inputType: 'number', min: 0, step: 0.01, ariaLabel: 'Prix unitaire hors taxe' },
  ],
  mo: [
    { key: 'poste', header: 'Poste', inputType: 'text', ariaLabel: 'Poste de main-dœuvre' },
    {
      key: 'mode',
      header: 'Mode',
      inputType: 'select',
      ariaLabel: 'Mode de productivité',
      options: [
        { label: 'Heures / unité', value: 'h_par_unite' },
        { label: 'Unités / heure', value: 'unites_par_h' },
      ],
    },
    {
      key: 'productivite',
      header: 'Ajustement manuel (h/unité)',
      inputType: 'number',
      min: 0,
      step: 0.05,
      ariaLabel: 'Ajustement manuel de productivité en heures par unité',
    },
    {
      key: 'quantiteRef',
      header: 'Quantité (m² / unité)',
      inputType: 'number',
      min: 0,
      step: 0.01,
      ariaLabel: 'Quantité totale en unités ou m²',
    },
    { key: 'tauxHoraireHt', header: 'Taux horaire HT', inputType: 'number', min: 0, step: 0.5, ariaLabel: 'Taux horaire hors taxe' },
    { key: 'chargesPct', header: 'Charges %', inputType: 'number', min: 0, max: 100, step: 0.5, ariaLabel: 'Charges sociales en pourcentage' },
  ],
  engins: [
    { key: 'type', header: 'Type', inputType: 'text', ariaLabel: "Type d'engin" },
    { key: 'tauxJourHt', header: 'Taux jour HT', inputType: 'number', min: 0, step: 1, ariaLabel: 'Taux journalier hors taxe' },
    { key: 'jours', header: 'Jours', inputType: 'number', min: 0, step: 0.5, ariaLabel: 'Nombre de jours' },
    { key: 'carburantPct', header: 'Carburant %', inputType: 'number', min: 0, max: 100, step: 0.5, ariaLabel: 'Pourcentage carburant' },
    { key: 'maintenancePct', header: 'Maintenance %', inputType: 'number', min: 0, max: 100, step: 0.5, ariaLabel: 'Pourcentage maintenance' },
  ],
  sousTraitance: [
    { key: 'designation', header: 'Désignation', inputType: 'text', ariaLabel: 'Désignation sous-traitance' },
    { key: 'coutHt', header: 'Coût HT', inputType: 'number', min: 0, step: 1, ariaLabel: 'Coût hors taxe' },
  ],
  transport: [
    { key: 'designation', header: 'Désignation', inputType: 'text', ariaLabel: 'Désignation transport' },
    { key: 'coutHt', header: 'Coût HT', inputType: 'number', min: 0, step: 1, ariaLabel: 'Coût hors taxe' },
  ],
  divers: [
    { key: 'designation', header: 'Désignation', inputType: 'text', ariaLabel: 'Désignation divers' },
    { key: 'coutHt', header: 'Coût HT', inputType: 'number', min: 0, step: 1, ariaLabel: 'Coût hors taxe' },
  ],
};

const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const clampPercentage = (value: number): number => Math.min(100, Math.max(0, value));

const categoriesLabels: Record<LotCategoryKey, string> = {
  materiaux: 'Matériaux',
  mo: "Main d'œuvre",
  engins: 'Engins',
  sousTraitance: 'Sous-traitance',
  transport: 'Transport',
  divers: 'Divers',
};

const metricsLabels: Record<ParamsGlobaux['metrique'], string> = {
  m2: 'm²',
  ml: 'ml',
  unite: 'unité',
};

const cloneProjet = (projet: Projet): Projet => JSON.parse(JSON.stringify(projet));

export const Simulator: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('A');
  const [projet, setProjet] = useState<Projet>(() => cloneProjet(loadScenario('A')));
  const [paramsOpen, setParamsOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryLotId, setLibraryLotId] = useState<string | null>(null);
  const [cloneTarget, setCloneTarget] = useState<ScenarioKey>('B');
  const [sensitivity, setSensitivity] = useState<SensitivityState>({
    materiauxPct: 0,
    tauxHorairePct: 0,
    productivitePct: 0,
    fraisGenerauxPct: 0,
    aleasPct: 0,
    margePct: 0,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setProjet(cloneProjet(loadScenario(activeScenario)));
  }, [activeScenario]);

  useDebouncedEffect(
    () => {
      saveScenario(activeScenario, projet);
    },
    [activeScenario, projet],
    250,
  );

  useEffect(() => {
    if (libraryLotId && !projet.lots.some((lot) => lot.id === libraryLotId)) {
      setLibraryLotId(projet.lots[0]?.id ?? null);
    }
  }, [libraryLotId, projet.lots]);

  const calcul = useMemo<ProjectComputation>(() => calculateProject(projet), [projet]);

  const sensitivityResult = useMemo(() => {
    if (
      sensitivity.materiauxPct === 0 &&
      sensitivity.tauxHorairePct === 0 &&
      sensitivity.productivitePct === 0 &&
      sensitivity.fraisGenerauxPct === 0 &&
      sensitivity.aleasPct === 0 &&
      sensitivity.margePct === 0
    ) {
      return calcul;
    }
    const adjusted = adjustProjectForSensitivity(projet, sensitivity);
    return calculateProject(adjusted);
  }, [calcul, projet, sensitivity]);

  const sensitivityRows = useMemo(() => buildSensitivityRows(projet, calcul, sensitivity), [projet, calcul, sensitivity]);

  const switchScenario = useCallback((scenario: ScenarioKey) => {
    setActiveScenario(scenario);

    setProjet(cloneProjet(loadScenario(scenario)));
  }, []);

  const updateProjet = useCallback((updater: (current: Projet) => Projet) => {
    setProjet((current) => {
      const updated = updater(cloneProjet(current));
      return updated;
    });
  }, []);

  const updateParams = useCallback(<K extends keyof ParamsGlobaux>(key: K, value: ParamsGlobaux[K]) => {
    updateProjet((current) => ({
      ...current,
      params: {
        ...current.params,
        [key]: key === 'remisePct' || key === 'fraisGenerauxPct' || key === 'aleasPct' || key === 'margePct' || key === 'chargesSocialesDefautPct'
          ? clampPercentage(Number(value))
          : key === 'surface'
            ? (value === undefined || value === null ? undefined : Number(value))
            : value,
      },
    }));
  }, [updateProjet]);

  const updateLotField = useCallback((lotId: string, field: keyof Lot, value: unknown) => {
    updateProjet((current) => ({
      ...current,
      lots: current.lots.map((lot) =>
        lot.id === lotId
          ? {
              ...lot,
              [field]: field === 'tvaPct' ? (Number(value) as Lot['tvaPct']) : value,
            }
          : lot,
      ),
    }));
  }, [updateProjet]);

  const updateLotCollection = useCallback(<K extends LotCollectionKey>(lotId: string, key: K, updater: (items: CollectionMap[K]) => CollectionMap[K]) => {
    updateProjet((current) => ({
      ...current,
      lots: current.lots.map((lot) => {
        if (lot.id !== lotId) {
          return lot;
        }
        const updatedCollection = updater(lot[key] as CollectionMap[K]);
        return {
          ...lot,
          [key]: updatedCollection,
        };
      }),
    }));
  }, [updateProjet]);

  const addLine = useCallback((lotId: string, key: LotCollectionKey) => {
    updateLotCollection(lotId, key, (items) => [...items, createEmptyLine(key, projet.params)] as CollectionMap[typeof key]);
  }, [projet.params, updateLotCollection]);

  const removeLine = useCallback((lotId: string, key: LotCollectionKey, index: number) => {
    updateLotCollection(lotId, key, (items) => items.filter((_, idx) => idx !== index) as CollectionMap[typeof key]);
  }, [updateLotCollection]);

  const updateLineValue = useCallback((lotId: string, key: LotCollectionKey, index: number, field: string, value: string | number) => {
    updateLotCollection(lotId, key, (items) => {
      const next = items.map((item, idx) => {
        if (idx !== index) {
          return item;
        }
        const parsedValue = typeof (item as Record<string, unknown>)[field] === 'number'
          ? Number(value)
          : value;
        return {
          ...(item as Record<string, unknown>),
          [field]: parsedValue,
        } as CollectionMap[typeof key][number];
      });
      return next as CollectionMap[typeof key];
    });
  }, [updateLotCollection]);

  const addLot = useCallback(() => {
    const baseTva = projet.params.tvaDefautPct;
    const newLot: Lot = {
      id: newId(),
      nom: `Lot ${projet.lots.length + 1}`,
      tvaPct: baseTva,
      materiaux: [],
      mo: [],
      engins: [],
      sousTraitance: [],
      transport: [],
      divers: [],
      notes: '',
    };
    updateProjet((current) => ({
      ...current,
      lots: [...current.lots, newLot],
    }));
  }, [projet.lots.length, projet.params.tvaDefautPct, updateProjet]);

  const duplicateLot = useCallback((lotId: string) => {
    updateProjet((current) => {
      const index = current.lots.findIndex((lot) => lot.id === lotId);
      if (index === -1) {
        return current;
      }
      const lot = current.lots[index];
      const copy: Lot = {
        ...cloneProjet(lot),
        id: newId(),
        nom: `${lot.nom} (copie)`,
      };
      const lots = [...current.lots];
      lots.splice(index + 1, 0, copy);
      return {
        ...current,
        lots,
      };
    });
  }, [updateProjet]);

  const deleteLot = useCallback((lotId: string) => {
    updateProjet((current) => ({
      ...current,
      lots: current.lots.filter((lot) => lot.id !== lotId),
    }));
  }, [updateProjet]);

  useEffect(() => {
    if (cloneTarget === activeScenario) {
      const fallback = SCENARIO_KEYS.find((scenario) => scenario !== activeScenario) ?? activeScenario;
      setCloneTarget(fallback);
    }
  }, [activeScenario, cloneTarget]);

  const handleCloneScenario = useCallback(() => {
    if (cloneTarget === activeScenario) {
      window.alert('Choisissez un scénario différent pour le clonage.');
      return;
    }
    cloneScenario(activeScenario, cloneTarget);
  }, [activeScenario, cloneTarget]);

  const handleResetScenario = useCallback(() => {
    if (window.confirm('Réinitialiser le scénario avec les données par défaut ?')) {
      const data = resetScenario(activeScenario);
      setProjet(cloneProjet(data));
    }
  }, [activeScenario]);

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(projet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scenario-${activeScenario}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeScenario, projet]);

  const handleExportCsv = useCallback(() => {
    const headers = ['scenario', 'lot', 'categorie', 'designation', 'quantite', 'unite', 'params', 'cout_ligne_ht', 'totaux_lot_ht'];
    const rows: string[] = [headers.join(';')];
    calcul.lots.forEach((lotCalc) => {
      lotCalc.lignes.forEach((ligne) => {
        const paramsString = JSON.stringify(ligne.params);
        const row = [
          activeScenario,
          lotCalc.lot.nom,
          categoriesLabels[ligne.categorie],
          ligne.designation,
          ligne.quantite ?? '',
          ligne.unite ?? '',
          paramsString,
          round(ligne.coutLigne).toFixed(2),
          round(lotCalc.totaux.pvHt).toFixed(2),
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(';');
        rows.push(row);
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scenario-${activeScenario}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeScenario, calcul.lots]);

  const handleImportJson = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result;
        if (typeof content !== 'string') {
          throw new Error('Format invalide');
        }
        const parsed = JSON.parse(content) as Projet;
        if (window.confirm('Importer ce scénario ? Les données actuelles seront remplacées.')) {
          saveScenario(activeScenario, parsed);
          setProjet(cloneProjet(parsed));
        }
      } catch (error) {
        window.alert(`Import impossible: ${(error as Error).message}`);
      }
    };
    reader.readAsText(file);
  }, [activeScenario]);

  const handleInsertFromLibrary = useCallback((category: LibraryCategory, entryIndex: number) => {
    const lotId = libraryLotId ?? projet.lots[0]?.id;
    if (!lotId) {
      window.alert('Veuillez d’abord créer un lot.');
      return;
    }
    const entry = libraryEntries[category][entryIndex];
    if (!entry) {
      return;
    }
    const value = cloneLibraryValue(entry.value);
    updateLotCollection(lotId, category, (items) => [...items, value]);

    updateLotCollection(lotId, category, (items) => [...items, entry.value]);
  }, [libraryLotId, projet.lots, updateLotCollection]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSensitivityReset = useCallback(() => {
    setSensitivity({
      materiauxPct: 0,
      tauxHorairePct: 0,
      productivitePct: 0,
      fraisGenerauxPct: 0,
      aleasPct: 0,
      margePct: 0,
    });
  }, []);

  return (
    <div className="space-y-6 print:p-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onFileChange}
      />
      <section className="rounded-lg bg-white p-6 shadow print:shadow-none" aria-label="Scénarios">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choix de scénario">
            {SCENARIO_KEYS.map((scenario) => (
              <button
                key={scenario}
                role="tab"
                aria-selected={scenario === activeScenario}
                onClick={() => switchScenario(scenario)}
                className={`rounded border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring focus:ring-blue-400 ${
                  scenario === activeScenario
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Scénario {scenario}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-gray-600" htmlFor="clone-select">
              Cloner vers
            </label>
            <select
              id="clone-select"
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring"
              value={cloneTarget}
              onChange={(event) => setCloneTarget(event.target.value as ScenarioKey)}
            >
              {SCENARIO_KEYS.map((scenario) => (
                <option key={scenario} value={scenario}>
                  {scenario === activeScenario ? `Scénario ${scenario} (actif)` : `Scénario ${scenario}`}
                </option>
              ))}
            </select>
            <button
              onClick={handleCloneScenario}
              className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring focus:ring-blue-300"
            >
              Cloner
            </button>
            <button
              onClick={handleResetScenario}
              className="rounded border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring focus:ring-red-300"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow print:shadow-none" aria-label="Actions" >
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJson}
            className="no-print rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportCsv}
            className="no-print rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-400"
          >
            Export CSV
          </button>
          <button
            onClick={handleImportJson}
            className="no-print rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring focus:ring-blue-400"
          >
            Import JSON
          </button>
          <button
            onClick={handlePrint}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring focus:ring-blue-400"
          >
            Imprimer / PDF
          </button>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow print:shadow-none" aria-label="Paramètres globaux">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Paramètres globaux</h2>
          <button
            onClick={() => setParamsOpen((value) => !value)}
            className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring focus:ring-blue-300"
            aria-expanded={paramsOpen}
          >
            {paramsOpen ? 'Replier' : 'Déplier'}
          </button>
        </header>
        {paramsOpen && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Frais généraux (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={projet.params.fraisGenerauxPct}
                onChange={(event) => updateParams('fraisGenerauxPct', Number(event.target.value))}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Aléas (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={projet.params.aleasPct}
                onChange={(event) => updateParams('aleasPct', Number(event.target.value))}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Marge cible (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={projet.params.margePct}
                onChange={(event) => updateParams('margePct', Number(event.target.value))}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Remise commerciale (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={projet.params.remisePct}
                onChange={(event) => updateParams('remisePct', Number(event.target.value))}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Charges sociales par défaut (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={projet.params.chargesSocialesDefautPct}
                onChange={(event) => updateParams('chargesSocialesDefautPct', Number(event.target.value))}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Taux horaire MO défaut (€)
              <input
                type="number"
                min={0}
                step={0.5}
                value={projet.params.tauxHoraireMoDefaut}
                onChange={(event) => updateParams('tauxHoraireMoDefaut', Number(event.target.value))}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              TVA par défaut
              <select
                value={projet.params.tvaDefautPct}
                onChange={(event) => updateParams('tvaDefautPct', Number(event.target.value) as 10 | 20)}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              >
                <option value={10}>10 %</option>
                <option value={20}>20 %</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Métrique principale
              <select
                value={projet.params.metrique}
                onChange={(event) => updateParams('metrique', event.target.value as ParamsGlobaux['metrique'])}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              >
                <option value="m2">m²</option>
                <option value="ml">ml</option>
                <option value="unite">unité</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Surface / métrique totale
              <input
                type="number"
                min={0}
                step={0.5}
                value={projet.params.surface ?? ''}
                onChange={(event) => updateParams('surface', event.target.value === '' ? undefined : Number(event.target.value))}
                className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </label>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow print:shadow-none" aria-label="Bibliothèque">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Bibliothèque d’éléments</h2>
              <button
                onClick={() => setLibraryOpen((value) => !value)}
                className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring focus:ring-blue-300"
                aria-expanded={libraryOpen}
              >
                {libraryOpen ? 'Replier' : 'Déplier'}
              </button>
            </header>
            {libraryOpen && (
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sélectionner un lot
                  <select
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
                    value={libraryLotId ?? ''}
                    onChange={(event) => setLibraryLotId(event.target.value || null)}
                  >
                    <option value="">Choisir…</option>
                    {projet.lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.nom}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  {(Object.keys(libraryEntries) as LibraryCategory[]).map((category) => (
                    <div key={category} className="rounded border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-700">{categoriesLabels[category as LotCategoryKey]}</h3>
                      <div className="mt-2 space-y-2">
                        {libraryEntries[category].map((entry, index) => (
                          <button
                            key={entry.label}
                            onClick={() => handleInsertFromLibrary(category, index)}
                            className="w-full rounded border border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring focus:ring-blue-300"
                          >
                            {entry.label} — Insérer
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="space-y-6 print:break-after-page">
            {projet.lots.map((lot, lotIndex) => {
              const lotTotals = calcul.lots[lotIndex]?.totaux;
              return (
                <section key={lot.id} className="rounded-lg bg-white p-6 shadow print:shadow-none" aria-label={`Lot ${lot.nom}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <label className="flex flex-col text-sm font-medium text-gray-700">
                        Nom du lot
                        <input
                          value={lot.nom}
                          onChange={(event) => updateLotField(lot.id, 'nom', event.target.value)}
                          className="mt-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-gray-700">
                        TVA
                        <select
                          value={lot.tvaPct}
                          onChange={(event) => updateLotField(lot.id, 'tvaPct', Number(event.target.value) as 10 | 20)}
                          className="mt-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
                        >
                          <option value={10}>10 %</option>
                          <option value={20}>20 %</option>
                        </select>
                      </label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => duplicateLot(lot.id)}
                        className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring focus:ring-blue-300"
                      >
                        Dupliquer
                      </button>
                      <button
                        onClick={() => deleteLot(lot.id)}
                        className="rounded border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring focus:ring-red-300"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {COLLECTION_KEYS.map((key) => (
                      <div key={key}>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-base font-semibold text-gray-800">{categoriesLabels[key]}</h3>
                          <button
                            onClick={() => addLine(lot.id, key)}
                            className="rounded border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring focus:ring-green-300"
                          >
                            Ajouter une ligne
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {collectionColumns[key].map((column) => (
                                  <th
                                    key={column.key}
                                    scope="col"
                                    className="px-3 py-2 text-left font-semibold text-gray-700"
                                  >
                                    {column.header}
                                  </th>
                                ))}
                                <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {lot[key].map((item, index) => {
                                const columns = collectionColumns[key];
                                const lineTotal = calcul.lots[lotIndex]?.lignes.filter((ligne) => ligne.categorie === key)[index]?.coutLigne ?? 0;
                                return (
                                  <tr key={index} className="align-top">
                                    {columns.map((column) => (
                                      <td key={column.key} className="px-3 py-2">
                                        {column.inputType === 'select' ? (
                                          <select
                                            aria-label={column.ariaLabel}
                                            value={(item as Record<string, unknown>)[column.key] as string}
                                            onChange={(event) => updateLineValue(lot.id, key, index, column.key, event.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring"
                                          >
                                            {column.options?.map((option) => (
                                              <option key={option.value} value={option.value}>
                                                {option.label}
                                              </option>
                                            ))}
                                          </select>
                                        ) : (
                                          <input
                                            aria-label={column.ariaLabel}
                                            type={column.inputType}
                                            min={column.min}
                                            max={column.max}
                                            step={column.step}
                                            value={(item as Record<string, unknown>)[column.key] as string | number}
                                            onChange={(event) => updateLineValue(lot.id, key, index, column.key, column.inputType === 'number' ? Number(event.target.value) : event.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring"
                                          />
                                        )}
                                      </td>
                                    ))}
                                    <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatEuro(lineTotal)}</td>
                                    <td className="px-3 py-2 text-right">
                                      <button
                                        onClick={() => removeLine(lot.id, key, index)}
                                        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 focus:outline-none focus:ring focus:ring-red-300"
                                      >
                                        Supprimer
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span>Total direct HT</span>
                      <span className="font-semibold">{formatEuro(lotTotals?.direct ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais généraux</span>
                      <span className="font-semibold">{formatEuro(lotTotals?.fraisGeneraux ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aléas</span>
                      <span className="font-semibold">{formatEuro(lotTotals?.aleas ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marge après remise</span>
                      <span className="font-semibold">{formatEuro(lotTotals?.margeApresRemise ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix de vente HT</span>
                      <span className="font-semibold">{formatEuro(lotTotals?.pvHt ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA</span>
                      <span className="font-semibold">{formatEuro(lotTotals?.tva ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total TTC</span>
                      <span className="font-semibold">{formatEuro(lotTotals?.ttc ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marge (%)</span>
                      <span className="font-semibold">{numberFormatter.format(lotTotals?.margePct ?? 0)}%</span>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                      Notes
                      <textarea
                        value={lot.notes ?? ''}
                        onChange={(event) => updateLotField(lot.id, 'notes', event.target.value)}
                        className="min-h-[80px] rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
                      />
                    </label>
                  </div>
                </section>
              );
            })}
            <button
              onClick={addLot}
              className="no-print w-full rounded border border-dashed border-blue-400 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring focus:ring-blue-300"
            >
              Ajouter un lot
            </button>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="sticky top-24 rounded-lg bg-white p-6 shadow print:static print:shadow-none" aria-label="Synthèse du projet">
            <h2 className="text-lg font-semibold">Synthèse</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Total direct HT</span>
                <span className="font-semibold">{formatEuro(calcul.totaux.direct)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frais généraux</span>
                <span className="font-semibold">{formatEuro(calcul.totaux.fraisGeneraux)}</span>
              </div>
              <div className="flex justify-between">
                <span>Aléas</span>
                <span className="font-semibold">{formatEuro(calcul.totaux.aleas)}</span>
              </div>
              <div className="flex justify-between">
                <span>Marge après remise</span>
                <span className="font-semibold">{formatEuro(calcul.totaux.margeApresRemise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Prix de vente HT</span>
                <span className="font-semibold">{formatEuro(calcul.totaux.pvHt)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA</span>
                <span className="font-semibold">{formatEuro(calcul.totaux.tva)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total TTC</span>
                <span className="font-semibold">{formatEuro(calcul.totaux.ttc)}</span>
              </div>
              {calcul.totaux.coutParMetrique !== undefined && (
                <div className="flex justify-between">
                  <span>Coût par {metricsLabels[projet.params.metrique]}</span>
                  <span className="font-semibold">{formatEuro(calcul.totaux.coutParMetrique)}</span>
                </div>
              )}
              <div className={`flex justify-between ${calcul.totaux.margePct < marginThresholdPct ? 'text-red-600' : 'text-gray-900'}`}>
                <span>Marge (%)</span>
                <span className="font-semibold">{numberFormatter.format(calcul.totaux.margePct)}%</span>
              </div>
            </div>
            {calcul.totaux.margePct < marginThresholdPct && (
              <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                Attention : la marge est inférieure à {marginThresholdPct}%.
              </p>
            )}
          </section>

          <section className="rounded-lg bg-white p-6 shadow print:shadow-none" aria-label="Analyse de sensibilité">
            <SensitivityAnalysis
              base={calcul}
              adjusted={sensitivityResult}
              adjustments={sensitivity}
              rows={sensitivityRows}
              onChange={setSensitivity}
              onReset={handleSensitivityReset}
            />
          </section>
        </aside>
      </div>
    </div>
  );
};
