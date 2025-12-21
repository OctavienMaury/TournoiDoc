import React, { useState, useEffect } from 'react';
import { Trophy, Globe, MapPin, TrendingUp, Medal, Crown, ChevronDown, ChevronUp, Check, RefreshCw, User, Gamepad2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ============================================
// CONFIGURATION GOOGLE SHEETS
// ============================================
// 1. Crée un Google Sheet avec les colonnes : participantId | day | geoScore | timestamp
// 2. Va dans Extensions > Apps Script et colle le code du fichier google-apps-script.js
// 3. Déploie en tant qu'application web (accès: tout le monde)
// 4. Copie l'URL et colle-la ici :
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfMxL9KhLPcPBS8lmWK_rfciMs4CF9-mwCuRqRA2HBWDsMcqJwxw1HFjppN-Dk6fo/exec';
// ============================================

const PARTICIPANTS = [
  { id: 1, name: 'Antoine', color: '#ef4444' },
  { id: 2, name: 'Florian', color: '#f97316' },
  { id: 3, name: 'Irene', color: '#eab308' },
  { id: 4, name: 'Charlie', color: '#22c55e' },
  { id: 5, name: 'Illan', color: '#06b6d4' },
  { id: 6, name: 'Romane', color: '#3b82f6' },
  { id: 7, name: 'Enora', color: '#8b5cf6' },
  { id: 8, name: 'Octavien', color: '#ec4899' },
];

const pointsDistribution = { 1: 10, 2: 7, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };
const MAX_DAILY_SCORE = 15000;
const TOTAL_DAYS = 14;

export default function GeoGuessrLeaderboard() {
  const [scores, setScores] = useState([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerScore, setPlayerScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load scores from Google Sheets
  const loadScores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get`);
      const data = await response.json();
      if (data.success) {
        setScores(data.scores || []);
      }
      setError(null);
    } catch (err) {
      setError('Impossible de charger les scores. Vérifiez la connexion.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Save score to Google Sheets
  const saveScore = async (participantId, day, geoScore) => {
    try {
      setSaving(true);
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          participantId,
          day,
          geoScore,
          timestamp: new Date().toISOString()
        }),
      });
      
      // Refresh data after save
      await loadScores();
      setError(null);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (GOOGLE_SCRIPT_URL !== 'COLLE_TON_URL_ICI') {
      loadScores();
    } else {
      setLoading(false);
      setError('Configure l\'URL Google Script dans le code (GOOGLE_SCRIPT_URL)');
    }
  }, []);

  // Get score for a participant on a specific day
  const getScore = (participantId, day) => {
    const score = scores.find(s => s.participantId === participantId && s.day === day);
    return score ? score.geoScore : null;
  };

  // Calculate tournament points for a day
  const calculateDayRankings = (day) => {
    const dayScores = PARTICIPANTS
      .map(p => ({ id: p.id, geoScore: getScore(p.id, day) }))
      .filter(p => p.geoScore !== null)
      .sort((a, b) => b.geoScore - a.geoScore);
    
    return dayScores.map((p, idx) => ({
      ...p,
      rank: idx + 1,
      tournamentPoints: pointsDistribution[idx + 1] || 0
    }));
  };

  // Get tournament points for a participant on a day
  const getTournamentPoints = (participantId, day) => {
    const rankings = calculateDayRankings(day);
    const player = rankings.find(r => r.id === participantId);
    return player ? player.tournamentPoints : 0;
  };

  // Calculate cumulative points up to a day
  const getCumulativePoints = (participantId, upToDay) => {
    let total = 0;
    for (let d = 1; d <= upToDay; d++) {
      total += getTournamentPoints(participantId, d);
    }
    return total;
  };

  // Calculate totals for leaderboard
  const calculateTotals = () => {
    return PARTICIPANTS.map(p => {
      let totalPoints = 0;
      let totalGeoScore = 0;
      let daysPlayed = 0;

      for (let day = 1; day <= TOTAL_DAYS; day++) {
        const geoScore = getScore(p.id, day);
        if (geoScore !== null) {
          totalPoints += getTournamentPoints(p.id, day);
          totalGeoScore += geoScore;
          daysPlayed++;
        }
      }

      return {
        ...p,
        totalPoints,
        totalGeoScore,
        daysPlayed,
        avgGeoScore: daysPlayed > 0 ? Math.round(totalGeoScore / daysPlayed) : 0,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints || b.totalGeoScore - a.totalGeoScore);
  };

  // Prepare chart data
  const prepareChartData = () => {
    const data = [];
    for (let day = 1; day <= TOTAL_DAYS; day++) {
      const dayData = { day: `J${day}` };
      PARTICIPANTS.forEach(p => {
        dayData[p.name] = getCumulativePoints(p.id, day);
      });
      data.push(dayData);
    }
    return data;
  };

  const rankedParticipants = calculateTotals();
  const chartData = prepareChartData();

  const handleSubmitScore = async () => {
    if (selectedPlayer && playerScore !== '') {
      const score = Math.min(MAX_DAILY_SCORE, Math.max(0, parseInt(playerScore) || 0));
      await saveScore(selectedPlayer, currentDay, score);
      setSelectedPlayer(null);
      setPlayerScore('');
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg shadow-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black shadow-lg shadow-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30';
    return 'bg-slate-800/80 text-white';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6" />;
    if (rank === 2) return <Medal className="w-6 h-6" />;
    if (rank === 3) return <Medal className="w-6 h-6" />;
    return <span className="font-bold text-lg">#{rank}</span>;
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return '-';
    return score.toLocaleString('fr-FR');
  };

  const selectedParticipant = PARTICIPANTS.find(p => p.id === selectedPlayer);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Chargement des scores...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Globe className="w-10 h-10 text-green-400 animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
              GeoGuessr Tournament
            </h1>
            <MapPin className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-blue-300 text-lg">CRED Doctoral Lab Championship 🌍</p>
          <p className="text-slate-400 mt-1">14 jours • 15 000 pts max/jour</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* Score Entry Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-green-400" />
            Ajouter mon score
          </h3>
          
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <span className="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold min-w-24 text-center">
              Jour {currentDay}
            </span>
            <button
              onClick={() => setCurrentDay(Math.min(TOTAL_DAYS, currentDay + 1))}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              <ChevronUp className="w-4 h-4 rotate-90" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Custom Player Select */}
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Qui es-tu ?</label>
              <div className="relative">
                <div className="grid grid-cols-2 gap-2">
                  {PARTICIPANTS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlayer(p.id === selectedPlayer ? null : p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        selectedPlayer === p.id
                          ? 'border-green-500 bg-green-500/20 text-white'
                          : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-sm truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Score Input */}
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Score du jour</label>
              <input
                type="number"
                min="0"
                max={MAX_DAILY_SCORE}
                value={playerScore}
                onChange={(e) => setPlayerScore(e.target.value)}
                placeholder={`0 - ${formatScore(MAX_DAILY_SCORE)}`}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
              />
              <p className="text-slate-500 text-xs mt-1">Score GeoGuessr (max {formatScore(MAX_DAILY_SCORE)})</p>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                onClick={handleSubmitScore}
                disabled={!selectedPlayer || playerScore === '' || saving}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {saving ? 'Sauvegarde...' : 'Valider'}
              </button>
            </div>
          </div>

          {/* Selected player feedback */}
          {selectedParticipant && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedParticipant.color }} />
              Score pour <span className="text-white font-medium">{selectedParticipant.name}</span> - Jour {currentDay}
            </div>
          )}

          {/* Current day scores preview */}
          {calculateDayRankings(currentDay).length > 0 && (
            <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-bold text-slate-400 mb-2">Scores du Jour {currentDay} :</h4>
              <div className="flex flex-wrap gap-2">
                {calculateDayRankings(currentDay).map((p) => {
                  const participant = PARTICIPANTS.find(part => part.id === p.id);
                  return (
                    <div key={p.id} className={`px-3 py-1 rounded-full text-sm font-medium ${
                      p.rank === 1 ? 'bg-yellow-500 text-black' :
                      p.rank === 2 ? 'bg-gray-400 text-black' :
                      p.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-slate-600 text-white'
                    }`}>
                      {p.rank}. {participant?.name} ({formatScore(p.geoScore)}) → +{p.tournamentPoints} pts
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-7 h-7 text-yellow-400" />
              Classement Général
            </h2>
            <button
              onClick={loadScores}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>

          <div className="space-y-3">
            {rankedParticipants.map((participant, index) => {
              const rank = index + 1;
              return (
                <div
                  key={participant.id}
                  className={`${getRankStyle(rank)} rounded-xl p-4 flex items-center justify-between transition-all duration-500`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: participant.color }}
                      />
                      <div>
                        <p className="font-bold text-lg">{participant.name}</p>
                        <p className="text-sm opacity-75">
                          {participant.daysPlayed} jour(s) • Moy: {formatScore(participant.avgGeoScore)} pts
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{participant.totalPoints}</p>
                    <p className="text-sm opacity-75">pts tournoi</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Évolution des points tournoi
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {PARTICIPANTS.map(p => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.name}
                    stroke={p.color}
                    strokeWidth={2}
                    dot={{ fill: p.color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Points Distribution */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Distribution des points tournoi
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {Object.entries(pointsDistribution).map(([rank, points]) => (
              <div key={rank} className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-sm">{rank}{rank === '1' ? 'er' : 'e'}</p>
                <p className="text-white font-bold text-xl">{points}</p>
                <p className="text-slate-500 text-xs">pts</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Scores Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 overflow-x-auto">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-blue-400" />
            Détail des scores
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left p-2">Participant</th>
                {Array.from({ length: TOTAL_DAYS }, (_, i) => (
                  <th key={i} className="p-2 text-center min-w-16">J{i + 1}</th>
                ))}
                <th className="p-2 text-center text-blue-400 min-w-20">Total Geo</th>
                <th className="p-2 text-center text-green-400 min-w-20">Pts Tournoi</th>
              </tr>
            </thead>
            <tbody>
              {rankedParticipants.map((p, idx) => (
                <tr key={p.id} className={idx % 2 === 0 ? 'bg-slate-700/30' : ''}>
                  <td className="p-2 text-white font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </div>
                  </td>
                  {Array.from({ length: TOTAL_DAYS }, (_, i) => {
                    const geoScore = getScore(p.id, i + 1);
                    const tournamentPts = getTournamentPoints(p.id, i + 1);
                    return (
                      <td key={i} className="p-2 text-center text-slate-300 text-xs">
                        {geoScore !== null ? (
                          <div>
                            <div>{formatScore(geoScore)}</div>
                            <div className="text-green-400">+{tournamentPts}</div>
                          </div>
                        ) : '-'}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center text-blue-400 font-bold">{formatScore(p.totalGeoScore)}</td>
                  <td className="p-2 text-center text-green-400 font-bold">{p.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          CRED Doctoral Lab • GeoGuessr Tournament 2025
        </div>
      </div>
    </div>
  );
}
