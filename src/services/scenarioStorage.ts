import { DEFAULT_DATA, Projet, ScenarioKey } from '@/types';

const STORAGE_PREFIX = 'bolt_scenario_';

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const storageKey = (scenario: ScenarioKey): string => `${STORAGE_PREFIX}${scenario}`;

// Permet de persister les scénarios en mémoire quand localStorage est indisponible (SSR, mode privé...)
const memoryStore = new Map<ScenarioKey, Projet>();

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn(
      'Accès à localStorage impossible pour les scénarios. Utilisation d’une copie en mémoire.',
      error,
    );
    return null;
  }
};

const bootstrapMemoryScenario = (scenario: ScenarioKey): Projet => {
  if (!memoryStore.has(scenario)) {
    memoryStore.set(scenario, deepClone(DEFAULT_DATA));
  }
  return deepClone(memoryStore.get(scenario)!);
};

const ensureBootstrap = (scenario: ScenarioKey, storage: Storage | null): Projet => {
  if (!storage) {
    return bootstrapMemoryScenario(scenario);
  }

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

const persistScenario = (scenario: ScenarioKey, projet: Projet, storage: Storage | null): void => {
  const payload = deepClone(projet);
  if (storage) {
    storage.setItem(storageKey(scenario), JSON.stringify(payload));
  } else {
    memoryStore.set(scenario, payload);
  }
};

export const loadScenario = (scenario: ScenarioKey): Projet => {
  const storage = getLocalStorage();
  const projet = ensureBootstrap(scenario, storage);

  if (!storage) {
    // synchroniser la mémoire pour conserver la dernière version chargée
    memoryStore.set(scenario, deepClone(projet));
  }

  return projet;
};

export const saveScenario = (scenario: ScenarioKey, projet: Projet): void => {
  const storage = getLocalStorage();
  persistScenario(scenario, projet, storage);
};

export const cloneScenario = (from: ScenarioKey, to: ScenarioKey): Projet => {
  const source = loadScenario(from);
  saveScenario(to, source);
  return loadScenario(to);
};

export const resetScenario = (scenario: ScenarioKey): Projet => {
  const data = deepClone(DEFAULT_DATA);
  const storage = getLocalStorage();
  persistScenario(scenario, data, storage);
  return data;
};

export const exportScenario = (scenario: ScenarioKey): Projet => loadScenario(scenario);
