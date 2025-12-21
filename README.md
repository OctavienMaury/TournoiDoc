# 🌍 GeoGuessr Tournament - CRED Doctoral Lab

Leaderboard interactif pour le tournoi GeoGuessr entre doctorants.
**100% gratuit** : Google Sheets (backend) + GitHub Pages (frontend)

---

## 🚀 Installation en 3 étapes

### Étape 1 : Configurer Google Sheets (5 min)

1. **Crée un nouveau Google Sheet** : [sheets.new](https://sheets.new)

2. **Renomme la première feuille** en `Scores` (clic droit sur l'onglet en bas)

3. **Ajoute ces en-têtes** en ligne 1 :
   | A | B | C | D |
   |---|---|---|---|
   | participantId | day | geoScore | timestamp |

4. **Va dans Extensions > Apps Script**

5. **Supprime le code par défaut** et colle le contenu du fichier `google-apps-script.js`

6. **Sauvegarde** (Ctrl+S ou Cmd+S)

7. **Déploie l'application :**
   - Clique sur "Déployer" > "Nouveau déploiement"
   - Clique sur la roue ⚙️ > "Application Web"
   - **Exécuter en tant que** : Moi
   - **Accès** : Tout le monde
   - Clique sur "Déployer"
   - **Autorise l'accès** quand demandé
   - **Copie l'URL** qui ressemble à : `https://script.google.com/macros/s/XXXX/exec`

---

### Étape 2 : Configurer le site React (2 min)

1. **Ouvre le fichier** `src/App.jsx`

2. **Remplace la ligne** :
   ```javascript
   const GOOGLE_SCRIPT_URL = 'COLLE_TON_URL_ICI';
   ```
   Par l'URL que tu as copiée :
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/XXXX/exec';
   ```

3. **Sauvegarde** le fichier

---

### Étape 3 : Déployer sur GitHub Pages (5 min)

1. **Crée un repo GitHub** : [github.new](https://github.new)
   - Nom : `geoguessr-tournament` (ou ce que tu veux)
   - Public
   - Ne coche rien d'autre

2. **Upload les fichiers** du dossier `frontend/` dans le repo

3. **Active GitHub Pages :**
   - Va dans Settings > Pages
   - Source : "GitHub Actions"
   - Choisis le workflow "Static HTML" ou crée un workflow Vite

4. **Ton site sera accessible sur** : `https://ton-username.github.io/geoguessr-tournament`

---

## 📁 Structure des fichiers

```
geoguessr-tournament/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← Code principal React
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── google-apps-script.js    ← À copier dans Google Apps Script
└── README.md
```

---

## 🔧 Personnalisation

### Changer les participants

Dans `src/App.jsx`, modifie le tableau `PARTICIPANTS` :

```javascript
const PARTICIPANTS = [
  { id: 1, name: 'Antoine', color: '#ef4444' },
  { id: 2, name: 'Marie', color: '#f97316' },
  // Ajoute/modifie les participants ici
];
```

### Changer la durée du tournoi

```javascript
const TOTAL_DAYS = 14; // Nombre de jours
```

### Changer le barème de points

```javascript
const pointsDistribution = { 1: 10, 2: 7, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };
```

### Changer le score max

```javascript
const MAX_DAILY_SCORE = 15000;
```

---

## 🌐 Domaine personnalisé (optionnel)

Tu peux connecter un domaine personnalisé à GitHub Pages :

1. Va dans Settings > Pages > Custom domain
2. Entre ton domaine (ex: `geoguessr.monsite.com`)
3. Configure les DNS chez ton registrar :
   - Type A : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Ou CNAME : `ton-username.github.io`

---

## 🐛 Dépannage

### "Erreur de chargement des scores"
- Vérifie que l'URL Google Script est correcte
- Vérifie que le déploiement est en "Tout le monde"
- Redéploie l'Apps Script si nécessaire

### Les scores ne se sauvegardent pas
- Vérifie les autorisations de l'Apps Script
- Regarde les logs dans Apps Script (Affichage > Journaux)

### CORS errors
- Assure-toi d'utiliser `mode: 'no-cors'` dans les requêtes POST (déjà configuré)

---

## 📊 Comment ça marche ?

1. **Frontend (React)** : Interface utilisateur hébergée sur GitHub Pages
2. **Backend (Google Apps Script)** : API qui lit/écrit dans Google Sheets
3. **Database (Google Sheets)** : Stockage des scores

Quand un joueur entre son score :
1. Le site envoie une requête POST à Google Apps Script
2. Apps Script écrit dans le Google Sheet
3. Le site recharge les données pour afficher le nouveau classement

---

## 🎮 Utilisation

1. Chaque jour, les joueurs font leur partie GeoGuessr
2. Ils vont sur le site et sélectionnent leur nom
3. Ils entrent leur score et valident
4. Le classement se met à jour automatiquement
5. Le graphique montre l'évolution au fil des jours

---

Bon tournoi ! 🏆
