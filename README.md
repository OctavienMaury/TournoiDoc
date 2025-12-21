# 🌍 GeoGuessr Tournament

Leaderboard pour notre tournoi GeoGuessr entre doctorants du CRED.

## Stack

- **Frontend** : React + Tailwind CSS (GitHub Pages)
- **Backend** : Google Apps Script
- **Database** : Google Sheets

## Setup

### 1. Google Sheets

1. Créer un Google Sheet avec une feuille `Scores`
2. En-têtes ligne 1 : `participantId | day | geoScore | timestamp`
3. Extensions > Apps Script > coller `google-apps-script.js`
4. Déployer > Application Web > Accès : Tout le monde
5. Copier l'URL

### 2. Configuration

Dans `frontend/src/App.jsx`, remplacer :
```js
const GOOGLE_SCRIPT_URL = 'COLLE_TON_URL_ICI';
```

### 3. Déploiement

Push sur `main` → GitHub Actions déploie automatiquement sur Pages.

## Dev local

```bash
cd frontend
npm install
npm run dev
```

## Personnalisation

Modifier dans `App.jsx` :
- `PARTICIPANTS` : liste des joueurs
- `TOTAL_DAYS` : durée du tournoi  
- `MAX_DAILY_SCORE` : score max (15 000)
- `pointsDistribution` : barème de points
