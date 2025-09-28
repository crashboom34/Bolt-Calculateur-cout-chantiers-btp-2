import { DEFAULT_DATA, Projet, ScenarioKey } from '@/types';

const STORAGE_PREFIX = 'bolt_scenario_';

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const storageKey = (scenario: ScenarioKey): string => `${STORAGE_PREFIX}${scenario}`;

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Accès à localStorage impossible pour les scénarios. Utilisation d’une copie en mémoire.', error);
    return null;
  }
};

const ensureBootstrap = (storage: Storage, scenario: ScenarioKey): Projet => {
  const key = storageKey(scenario);
  const raw = storage.getItem(key);

  if (!raw) {
    const data = deepClone(DEFAULT_DATA);
    storage.setItem(key, JSON.stringify(data));
    return data;
  }

  try {
    const parsed = JSON.parse(raw) as Projet;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid data');
    }
    return deepClone(parsed);
  } catch (error) {
    console.warn(`Données corrompues pour ${key}, réinitialisation.`, error);
    const data = deepClone(DEFAULT_DATA);
    storage.setItem(key, JSON.stringify(data));
    return data;
  }
};

export const loadScenario = (scenario: ScenarioKey): Projet => {
  const storage = getLocalStorage();
  if (!storage) {
    return deepClone(DEFAULT_DATA);
  }
  return ensureBootstrap(storage, scenario);
};

export const saveScenario = (scenario: ScenarioKey, projet: Projet): void => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  const data = deepClone(projet);
  storage.setItem(storageKey(scenario), JSON.stringify(data));
};

export const cloneScenario = (from: ScenarioKey, to: ScenarioKey): Projet => {
  const source = loadScenario(from);
  saveScenario(to, source);
  return loadScenario(to);
};

export const resetScenario = (scenario: ScenarioKey): Projet => {
  const storage = getLocalStorage();
  const data = deepClone(DEFAULT_DATA);
  if (!storage) {
    return data;
  }
  storage.setItem(storageKey(scenario), JSON.stringify(data));
  return data;
};

export const exportScenario = (scenario: ScenarioKey): Projet => loadScenario(scenario);
