import React, { useState, useEffect } from 'react';
import { BarChart3, Calculator, Users, Package, MapPin, UserCheck } from 'lucide-react';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Simulator } from './components/Simulator/Simulator';
import { SalariesManager } from './components/Salaries/SalariesManager';
import { MateriauxManager } from './components/Materiaux/MateriauxManager';
import { ChantiersManager } from './components/Chantiers/ChantiersManager';
import { SousTraitantsManager } from './components/SousTraitants/SousTraitantsManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/UI/Tabs';
import { ToastProvider } from './components/UI/Toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { SalarieSchema, MateriauSchema, ChantierSchema, SousTraitantSchema, Salarie, Materiau, Chantier, SousTraitant } from './schemas';
import { z } from 'zod';
import { newId } from './lib/id';
import { estimerChantier, type EstimationResponse, type PosteTravail } from '@/domain/api';
import { formatEuro } from './utils/calculsFiscaux';
import { useEstimationHistory } from './hooks/useEstimationHistory';
import { computeChargePonderee } from '@/domain/posteTypes';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    // Récupérer l'onglet depuis l'URL hash
    const hash = window.location.hash.slice(1);
    return ['dashboard', 'simulator', 'salaries', 'materiaux', 'sous-traitants', 'chantiers'].includes(hash) 
      ? hash 
      : 'dashboard';
  });

  // Hooks de persistance avec validation Zod
  const salariesStorage = useLocalStorage({
    key: 'btp-salaries',
    schema: z.array(SalarieSchema),
    defaultValue: [] as Salarie[],
    version: 1
  });

  const materiauxStorage = useLocalStorage({
    key: 'btp-materiaux',
    schema: z.array(MateriauSchema),
    defaultValue: [] as Materiau[],
    version: 1
  });

  const sousTraitantsStorage = useLocalStorage({
    key: 'btp-sous-traitants',
    schema: z.array(SousTraitantSchema),
    defaultValue: [] as SousTraitant[],
    version: 1
  });

  const chantiersStorage = useLocalStorage({
    key: 'btp-chantiers',
    schema: z.array(ChantierSchema),
    defaultValue: [] as Chantier[],
    version: 1
  });

  const [postes, setPostes] = useState<PosteTravail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<EstimationResponse | null>(null);
  const [posteNameMap, setPosteNameMap] = useState<Map<string, string>>(new Map());
  const [isEstimating, setIsEstimating] = useState(false);
  const [targetMargin, setTargetMargin] = useState<number>(20);
  const estimationHistory = useEstimationHistory();

  // Synchroniser l'URL avec l'onglet actif
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Écouter les changements d'URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (['dashboard', 'simulator', 'salaries', 'materiaux', 'sous-traitants', 'chantiers'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Tableau de bord', 
      icon: <BarChart3 className="h-4 w-4" /> 
    },
    { 
      id: 'simulator', 
      label: 'Simulateur', 
      icon: <Calculator className="h-4 w-4" /> 
    },
    { 
      id: 'salaries', 
      label: 'Salariés', 
      icon: <Users className="h-4 w-4" /> 
    },
    { 
      id: 'materiaux', 
      label: 'Matériaux', 
      icon: <Package className="h-4 w-4" /> 
    },
    { 
      id: 'sous-traitants', 
      label: 'Sous-traitants', 
      icon: <UserCheck className="h-4 w-4" /> 
    },
    { 
      id: 'chantiers', 
      label: 'Chantiers', 
      icon: <MapPin className="h-4 w-4" /> 
    }
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  icon={tab.icon}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <main className="pb-8">
              <TabsContent value="dashboard">
                <Dashboard 
                  chantiers={chantiersStorage.data}
                  salaries={salariesStorage.data}
                  materiaux={materiauxStorage.data}
                />
              </TabsContent>

              <TabsContent value="simulator">
                {error && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setPostes([
                        { id: newId(), nom: 'Démolition', charge: 10, typePoste: 'complexe' },
                        { id: newId(), nom: 'Plomberie', charge: 18, typePoste: 'expert' },
                        { id: newId(), nom: 'Électricité', charge: 8, typePoste: 'expert' },
                        { id: newId(), nom: 'Carrelage', charge: 22, typePoste: 'standard' },
                        { id: newId(), nom: 'Peinture', charge: 12, typePoste: 'leger' }
                      ]);
                      setError(null);
                      setEstimation(null);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Exemple SDB
                  </button>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Marge cible (%)
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={targetMargin}
                      onChange={(event) => setTargetMargin(Number(event.target.value))}
                      className="w-24 rounded border border-gray-300 px-2 py-1"
                    />
                  </label>
                  <button
                    onClick={async () => {
                      if (isEstimating) {
                        return;
                      }
                      if (postes.length === 0) {
                        setError('Veuillez ajouter au moins un poste avant de lancer une estimation.');
                        return;
                      }
                      setIsEstimating(true);
                      setError(null);
                      try {
                        const labelsSnapshot = new Map(
                          postes.map((poste) => [poste.id, poste.nom] as const)
                        );
                        setPosteNameMap(labelsSnapshot);
                        const result = await estimerChantier({ postes });
                        setEstimation(result);
                        const postesSnapshot = postes.map((poste) => ({ ...poste }));
                        estimationHistory.addEntry({
                          postes: postesSnapshot,
                          estimation: result,
                          targetMargin,
                        });
                      } catch (apiError) {
                        setEstimation(null);
                        setError(apiError instanceof Error ? apiError.message : 'Une erreur est survenue lors de l\'estimation.');
                      } finally {
                        setIsEstimating(false);
                      }
                    }}
                    disabled={isEstimating}
                    className={`px-4 py-2 rounded-md text-white transition-colors ${
                      isEstimating
                        ? 'cursor-not-allowed bg-gray-400'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isEstimating ? 'Estimation…' : 'Estimer via API'}
                  </button>
                </div>
                {estimation && (
                  <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                    <p>
                      Estimation totale HT :
                      {' '}
                      {formatEuro(estimation.totalHT)}
                    </p>
                    {(() => {
                      const margeRealisableMontant = estimation.margeEstimee;
                      const margeRealisablePourcentage = estimation.totalHT === 0
                        ? 0
                        : (margeRealisableMontant / estimation.totalHT) * 100;
                      const ecart = margeRealisablePourcentage - targetMargin;
                      return (
                        <div className="mt-2 space-y-1">
                          <p>
                            Marge réalisable : {formatEuro(margeRealisableMontant)} ({margeRealisablePourcentage.toFixed(1)}%)
                          </p>
                          <p>Marge cible : {targetMargin.toFixed(1)}%</p>
                          <p className={ecart >= 0 ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                            Écart : {ecart >= 0 ? '+' : ''}{ecart.toFixed(1)}%
                          </p>
                        </div>
                      );
                    })()}
                    {estimation.postes.length > 0 && (
                      <div className="mt-4 overflow-x-auto text-xs sm:text-sm">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="bg-emerald-100">
                              <th className="border px-2 py-1 text-left">Poste</th>
                              <th className="border px-2 py-1 text-right">Coût Matériaux</th>
                              <th className="border px-2 py-1 text-right">Coût Main d'Œuvre</th>
                              <th className="border px-2 py-1 text-right">Sous-total</th>
                              <th className="border px-2 py-1 text-right">Charge pondérée (h)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {estimation.postes.map((poste) => {
                              const sousTotal = poste.coutMateriaux + poste.coutMainOeuvre;
                              const label = posteNameMap.get(poste.id) ?? poste.nom ?? `Poste ${poste.id}`;
                              const posteInitial = postes.find((p) => p.id === poste.id);
                              return (
                                <tr key={poste.id} className="border-b border-emerald-100">
                                  <td className="border px-2 py-1">{label}</td>
                                  <td className="border px-2 py-1 text-right">
                                    {formatEuro(poste.coutMateriaux)}
                                  </td>
                                  <td className="border px-2 py-1 text-right">
                                    {formatEuro(poste.coutMainOeuvre)}
                                  </td>
                                  <td className="border px-2 py-1 text-right font-medium">
                                    {formatEuro(sousTotal)}
                                  </td>
                                  <td className="border px-2 py-1 text-right">
                                    {posteInitial ? computeChargePonderee(posteInitial.charge, posteInitial.typePoste).toFixed(2) : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                <Simulator
                  salaries={salariesStorage.data}
                  materiaux={materiauxStorage.data}
                  chantiers={chantiersStorage.data}
                />
              </TabsContent>

              <TabsContent value="salaries">
                <SalariesManager 
                  salaries={salariesStorage.data}
                  setSalaries={salariesStorage.setData}
                  isLoading={salariesStorage.isLoading}
                  error={salariesStorage.error}
                />
              </TabsContent>

              <TabsContent value="materiaux">
                <MateriauxManager 
                  materiaux={materiauxStorage.data}
                  setMateriaux={materiauxStorage.setData}
                  isLoading={materiauxStorage.isLoading}
                  error={materiauxStorage.error}
                />
              </TabsContent>

              <TabsContent value="sous-traitants">
                <SousTraitantsManager 
                  sousTraitants={sousTraitantsStorage.data}
                  setSousTraitants={sousTraitantsStorage.setData}
                  isLoading={sousTraitantsStorage.isLoading}
                  error={sousTraitantsStorage.error}
                />
              </TabsContent>

              <TabsContent value="chantiers">
                <ChantiersManager 
                  chantiers={chantiersStorage.data}
                  setChantiers={chantiersStorage.setData}
                  salaries={salariesStorage.data}
                  materiaux={materiauxStorage.data}
                  sousTraitants={sousTraitantsStorage.data}
                  isLoading={chantiersStorage.isLoading}
                  error={chantiersStorage.error}
                />
              </TabsContent>
            </main>
          </Tabs>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
