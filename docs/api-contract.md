# Contrat API Estimation Chantier
POST /api/estimation
Content-Type: application/json

Request:
{
  "postes": [
    { "id": "uuid", "nom": "Maçonnerie", "charge": 24 } // charge en heures
  ]
}

Response 200:
{
  "postes": [
    { "id": "uuid", "coutMateriaux": 1320, "coutMainOeuvre": 840 }
  ],
  "totalHT": 2160,
  "margeEstimee": 388
}

Notes:
- L’API doit conserver les mêmes `id` pour le mapping.
- Les coûts sont exprimés en EUR HT.
- `margeEstimee` = marge globale prévisionnelle (libre côté serveur).
- Tolérer `charge` = 0 (poste gratuit), refuser négatif.
