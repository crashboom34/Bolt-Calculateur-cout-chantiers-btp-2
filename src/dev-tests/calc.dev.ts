import { calculateProject } from '@/core/calc';
import { DEFAULT_DATA } from '@/types';

const projet = JSON.parse(JSON.stringify(DEFAULT_DATA));

const result = calculateProject(projet);

console.log('--- Test calcul projet ---');
console.log('Direct HT:', result.totaux.direct.toFixed(2));
console.log('PV HT:', result.totaux.pvHt.toFixed(2));

console.assert(result.totaux.direct > 0, 'Le total direct doit être positif');
console.assert(result.totaux.pvHt >= result.totaux.direct, 'Le PV HT doit couvrir les coûts directs');

console.log('Tests de base du moteur de calcul exécutés.');
