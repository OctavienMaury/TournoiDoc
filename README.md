# 🌍 GeoGuessr Tournament

A web app for running a private GeoGuessr tournament with friends. Feel free to fork this repo for your own use!

## How it works

GeoGuessr offers 3 free games per day, with a maximum score of 5,000 points each (15,000 total per day). These daily games are the same for everyone.

Each day, participants play all 3 games and submit their combined score. Players are then ranked and awarded tournament points:

| Rank | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th |
|------|-----|-----|-----|-----|-----|-----|-----|-----|
| Points | 10 | 7 | 5 | 4 | 3 | 2 | 1 | 1 |

The leaderboard tracks cumulative tournament points over the competition period (default: 14 days).

## Stack

- **Frontend**: React + Tailwind CSS (hosted on GitHub Pages)
- **Backend**: Google Apps Script
- **Database**: Google Sheets

## Setup

### 1. Google Sheets

1. Create a new Google Sheet with a sheet named `Scores`
2. Add headers in row 1: `participantId | day | geoScore | timestamp`
3. Go to Extensions > Apps Script > paste `google-apps-script.js`
4. Deploy > Web App > Access: Anyone
5. Copy the deployment URL

### 2. Configuration

In `frontend/src/App.jsx`, replace:
```js
const GOOGLE_SCRIPT_URL = 'YOUR_URL_HERE';
```

### 3. Deploy

Push to `main` → GitHub Actions automatically deploys to Pages.

## Local dev

```bash
cd frontend
npm install
npm run dev
```

## Customization

Edit `App.jsx`:
- `PARTICIPANTS`: player list (name + color)
- `TOTAL_DAYS`: tournament duration
- `MAX_DAILY_SCORE`: max score per day (15,000)
- `pointsDistribution`: ranking points scale
