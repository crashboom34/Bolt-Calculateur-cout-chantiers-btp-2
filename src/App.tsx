import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
 codex/enhance-btp-cost-calculator-features-3ufwlp

const TAB_IDS = ['dashboard', 'simulator', 'salaries', 'materiaux', 'sous-traitants', 'chantiers'] as const;
type TabId = typeof TAB_IDS[number];

const normalizeHash = (value: string): string => (value.startsWith('#') ? value.slice(1) : value);

const SALARIES_LIST_SCHEMA = z.array(SalarieSchema);
const MATERIAUX_LIST_SCHEMA = z.array(MateriauSchema);
const SOUS_TRAITANTS_LIST_SCHEMA = z.array(SousTraitantSchema);
const CHANTIERS_LIST_SCHEMA = z.array(ChantierSchema);

const DEFAULT_SALARIES: Salarie[] = [];
const DEFAULT_MATERIAUX: Materiau[] = [];
const DEFAULT_SOUS_TRAITANTS: SousTraitant[] = [];
const DEFAULT_CHANTIERS: Chantier[] = [];
 main

function App() {
  const allowedTabs = useMemo(() => new Set<string>(TAB_IDS), []);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const hash = normalizeHash(window.location.hash);
    return allowedTabs.has(hash) ? (hash as TabId) : 'dashboard';
  });

  // Hooks de persistance avec validation Zod
  const salariesStorage = useLocalStorage({
    key: 'btp-salaries',
    schema: SALARIES_LIST_SCHEMA,
    defaultValue: DEFAULT_SALARIES,
    version: 1
  });

  const materiauxStorage = useLocalStorage({
    key: 'btp-materiaux',
    schema: MATERIAUX_LIST_SCHEMA,
    defaultValue: DEFAULT_MATERIAUX,
    version: 1
  });

  const sousTraitantsStorage = useLocalStorage({
    key: 'btp-sous-traitants',
    schema: SOUS_TRAITANTS_LIST_SCHEMA,
    defaultValue: DEFAULT_SOUS_TRAITANTS,
    version: 1
  });

  const chantiersStorage = useLocalStorage({
    key: 'btp-chantiers',
    schema: CHANTIERS_LIST_SCHEMA,
    defaultValue: DEFAULT_CHANTIERS,
    version: 1
  });

  // Synchroniser l'URL avec l'onglet actif
  useEffect(() => {
    const currentHash = normalizeHash(window.location.hash);
    if (currentHash !== activeTab) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  // Écouter les changements d'URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = normalizeHash(window.location.hash);
      if (allowedTabs.has(hash) && hash !== activeTab) {
        setActiveTab(hash as TabId);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, allowedTabs]);

  const handleTabChange = useCallback((tab: string) => {
    if (allowedTabs.has(tab) && tab !== activeTab) {
      setActiveTab(tab as TabId);
    }
  }, [activeTab, allowedTabs]);

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
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={handleTabChange}>
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
                <Simulator />
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
