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
