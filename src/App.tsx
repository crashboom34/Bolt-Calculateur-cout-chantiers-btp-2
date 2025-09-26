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
  const [isEstimating, setIsEstimating] = useState(false);

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
                        { id: newId(), nom: 'Démolition', charge: 10 },
                        { id: newId(), nom: 'Plomberie', charge: 18 },
                        { id: newId(), nom: 'Électricité', charge: 8 },
                        { id: newId(), nom: 'Carrelage', charge: 22 },
                        { id: newId(), nom: 'Peinture', charge: 12 }
                      ]);
                      setError(null);
                      setEstimation(null);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Exemple SDB
                  </button>
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
                        const result = await estimerChantier({ postes });
                        setEstimation(result);
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
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(estimation.totalHT)}
                    </p>
                    <p>Marge estimée : {estimation.margeEstimee}%</p>
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
