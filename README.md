# Calculateur de coût de chantiers BTP

Application Vite + React destinée à estimer et suivre les coûts d'un chantier BTP.

## Installation rapide

```bash
npm install
npm run dev
```

## Estimation API

L'application lit sa configuration distante depuis `/public/config.json`. Ce fichier doit être présent dans le dossier `public` du projet (voir l'exemple ci-dessous) et sera servi en lecture seule via l'URL `/config.json`.

```json
{
  "API_BASE_URL": "mock"
}
```

- Lorsque `API_BASE_URL` vaut `mock` (ou que la clé est absente/`null`), l'API d'estimation fonctionne en mode maquette. Le service `estimerChantier` simule alors la latence réseau, calcule des montants factices pour chaque poste et renvoie un total hors taxes ainsi qu'une marge estimée.
- En mode réel, l'application effectue un POST sur `${API_BASE_URL}/api/estimation` avec le payload suivant :

```json
{
  "postes": [
    { "id": "uuid", "nom": "Terrassement", "charge": 42 }
  ]
}
```

Chaque poste correspond à une tâche de chantier, identifiée par `id`, avec un libellé (`nom`) et une charge exprimée en heures (`charge`).

Pour basculer en production, mettez à jour `public/config.json` en renseignant l'URL de base de l'API déployée :

```json
{
  "API_BASE_URL": "https://mon-api.btp.example"
}
```

Le front consommera alors l'endpoint `/api/estimation` exposé par ce domaine.

## Déploiement sur GitHub Pages

Une configuration automatique est prévue pour GitHub Pages : lors d'un build exécuté
dans un workflow GitHub Actions, la variable d'environnement `GITHUB_REPOSITORY`
est utilisée pour déduire le sous-répertoire de publication (par exemple
`/mon-repo/`). Le bundle généré fonctionnera ainsi à la fois en local et sur
`https://<utilisateur>.github.io/<mon-repo>/` sans réglage manuel du `base` Vite.

Veillez également à conserver le fichier `public/config.json` dans le dossier
`dist` publié afin que l'application puisse charger sa configuration via
`import.meta.env.BASE_URL`.

## Simulateur multi-scénarios

Le simulateur de coûts fournit désormais trois scénarios persistés (`A`, `B`,
`C`) stockés dans le navigateur (`localStorage`). Chaque scénario contient les
lots, paramètres globaux et notes. Les actions disponibles sont :

- sélection d'un scénario actif,
- clonage d'un scénario vers un autre,
- réinitialisation à partir des données par défaut.

### Paramétrage et édition

- Les paramètres globaux (frais généraux, aléas, marge, remise, métrique, etc.)
  sont éditables dans un panneau repliable avec validation des valeurs.
- Chaque lot dispose de tableaux pour les catégories (Matériaux, MO, Engins,
  Sous-traitance, Transport, Divers) avec ajout/suppression de lignes et saisie
  inline.
- Une bibliothèque d'éléments récurrents permet d'injecter rapidement des
  références de main-d'œuvre, engins ou matériaux.

### Export, import et impression

- Export JSON : téléchargement de la structure complète du scénario.
- Import JSON : remplacement du scénario courant après confirmation.
- Export CSV : une ligne par poste de coût avec montants HT et totaux de lot.
- Impression/PDF : feuilles A4 optimisées via `@media print`.

### Analyse et synthèse

- Calculs consolidés (HT, TVA, TTC, marge € / %) mis à jour en temps réel.
- Alerte si la marge projet passe sous 10 %.
- Analyse de sensibilité : curseurs ±5/10/15 % et graphique « tornado » Chart.js
  indiquant l’impact sur le prix de vente HT et la marge.
