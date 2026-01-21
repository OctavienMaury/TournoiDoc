import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Globe, MapPin, TrendingUp, Medal, Crown, ChevronDown, ChevronUp, Check, RefreshCw, User, Gamepad2, MessageCircle, Send, X, Users, Calendar, Archive } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ============================================
// CONFIGURATION GOOGLE SHEETS
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwHDFTviVGhuASKWUsQP1NSWkwD1hZIzNK9PoPrM0XuWVu1qq6vjFcOh64AjlpQBH80/exec';

// ============================================
// CONFIGURATION DES TOURNOIS
// ============================================
const TOURNAMENTS = [
  {
    id: 'tournament_1',
    name: 'Tournoi #1 - Individuel',
    startDate: new Date(2024, 11, 22),
    endDate: new Date(2025, 0, 4),
    totalDays: 14,
    isTeamBased: false,
    participants: [
      { id: 1, name: 'Antoine', color: '#ef4444' },
      { id: 2, name: 'Florian', color: '#f97316' },
      { id: 3, name: 'Irene', color: '#eab308' },
      { id: 4, name: 'Charlie x Papa', color: '#22c55e' },
      { id: 5, name: 'Illan', color: '#06b6d4' },
      { id: 6, name: 'Romane', color: '#3b82f6' },
      { id: 7, name: 'Enora', color: '#8b5cf6' },
      { id: 8, name: 'Octavien', color: '#ec4899' },
      { id: 9, name: 'Ambre', color: '#ec4877' },
    ],
    pointsDistribution: { 1: 10, 2: 7, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 },
    archived: true
  },
  {
    id: 'tournament_2',
    name: 'Tournoi #2 - Équipes',
    startDate: new Date(2026, 0, 20),
    endDate: new Date(2026, 1, 7),
    totalDays: 14,
    skipWeekends: true,
    isTeamBased: true,
    teams: [
      { id: 1, name: 'Équipe AMI', color: '#ef4444', members: ['Antoine', 'Maxime', 'Irene'] },
      { id: 2, name: 'GéoBagarre', color: '#22c55e', members: ['Octavien', 'Ambre'] },
      { id: 3, name: 'Équipe RE', color: '#3b82f6', members: ['Enora', 'Romane'] },
      { id: 4, name: 'Équipe FI', color: '#8b5cf6', members: ['Florian', 'Illan'] },
    ],
    pointsDistribution: { 1: 10, 2: 7, 3: 5, 4: 4 },
    archived: false
  }
];

const MAX_DAILY_SCORE = 15000;
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const calculateCurrentDay = (tournament) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(tournament.startDate);
  start.setHours(0, 0, 0, 0);
  
  if (today < start) return 1;
  
  let dayCount = 0;
  let currentDate = new Date(start);
  
  while (currentDate <= today && dayCount < tournament.totalDays) {
    if (!tournament.skipWeekends || (currentDate.getDay() !== 0 && currentDate.getDay() !== 6)) {
      dayCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
    if (currentDate > today) break;
  }
  
  return Math.max(1, Math.min(tournament.totalDays, dayCount || 1));
};

function SnakeGame({ onClose, entities, googleScriptUrl, tournamentId }) {
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
  const [food, setFood] = useState({ x: 12, y: 7 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [snakePlayer, setSnakePlayer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const directionRef = useRef({ x: 1, y: 0 });
  const GRID_SIZE = 15;

  const loadLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const response = await fetch(`${googleScriptUrl}?action=getSnakeScores&tournamentId=${tournamentId}`);
      const data = await response.json();
      if (data.success) setLeaderboard(data.scores || []);
    } catch (err) {
      console.error('Erreur chargement leaderboard Snake:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => { loadLeaderboard(); }, []);

  const saveToLeaderboard = async (entityId, finalScore) => {
    try {
      await fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addSnakeScore',
          tournamentId,
          entityId,
          score: finalScore,
          timestamp: new Date().toISOString()
        }),
      });
      setTimeout(loadLeaderboard, 500);
    } catch (err) {
      console.error('Erreur sauvegarde score Snake:', err);
    }
  };

  const spawnFood = (currentSnake) => {
    let newFood;
    do {
      newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (currentSnake.some(s => s.x === newFood.x && s.y === newFood.y));
    return newFood;
  };

  const resetGame = () => {
    const initialSnake = [{ x: 7, y: 7 }];
    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setFood(spawnFood(initialSnake));
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!gameStarted && !gameOver && snakePlayer) setGameStarted(true);
        
        const current = directionRef.current;
        let newDir = current;
        
        if (e.key === 'ArrowUp' && current.y !== 1) newDir = { x: 0, y: -1 };
        else if (e.key === 'ArrowDown' && current.y !== -1) newDir = { x: 0, y: 1 };
        else if (e.key === 'ArrowLeft' && current.x !== 1) newDir = { x: -1, y: 0 };
        else if (e.key === 'ArrowRight' && current.x !== -1) newDir = { x: 1, y: 0 };
        
        directionRef.current = newDir;
        setDirection(newDir);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, snakePlayer]);

  useEffect(() => {
    if (gameOver || !gameStarted) return;
    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const dir = directionRef.current;
        const newHead = {
          x: (prevSnake[0].x + dir.x + GRID_SIZE) % GRID_SIZE,
          y: (prevSnake[0].y + dir.y + GRID_SIZE) % GRID_SIZE,
        };
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          if (score > 0) saveToLeaderboard(snakePlayer, score);
          return prevSnake;
        }
        const newSnake = [newHead, ...prevSnake];
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(prev => prev + 10);
          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 130);
    return () => clearInterval(interval);
  }, [gameOver, gameStarted, food, score, snakePlayer]);

  const getCellContent = (x, y) => {
    const isHead = snake[0].x === x && snake[0].y === y;
    const isBody = snake.slice(1).some(s => s.x === x && s.y === y);
    const isFood = food.x === x && food.y === y;
    if (isHead) return 'bg-green-500 rounded-sm';
    if (isBody) return 'bg-green-400';
    if (isFood) return 'bg-red-500 rounded-full';
    return 'bg-slate-800';
  };

  const getEntityName = (entityId) => entities.find(e => e.id === entityId)?.name || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-green-400">🐍 Snake</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        {!snakePlayer && (
          <div className="mb-4">
            <p className="text-slate-400 text-sm mb-2">Choisis ton joueur :</p>
            <div className="grid grid-cols-2 gap-2">
              {entities.map(e => (
                <button key={e.id} onClick={() => setSnakePlayer(e.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:border-green-500 hover:bg-slate-700 transition-all">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="text-sm">{e.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {snakePlayer && (
          <>
            <div className="flex justify-between mb-3 text-sm">
              <span className="text-white font-bold">Score: {score}</span>
              <span className="text-slate-400">{getEntityName(snakePlayer)}</span>
            </div>
            <div className="grid gap-px bg-slate-700 p-px rounded-lg mx-auto" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 18px)`, gridTemplateRows: `repeat(${GRID_SIZE}, 18px)` }}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                return <div key={i} className={`${getCellContent(x, y)}`} />;
              })}
            </div>
            <div className="mt-4 text-center">
              {!gameStarted && !gameOver && <p className="text-slate-400 text-sm">Appuie sur une flèche pour jouer</p>}
              {gameOver && (
                <div>
                  <p className="text-red-400 font-bold mb-2">Game Over! Score: {score}</p>
                  <button onClick={resetGame} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm">Rejouer</button>
                </div>
              )}
            </div>
          </>
        )}
        <div className="mt-6 border-t border-slate-700 pt-4">
          <h3 className="text-lg font-bold text-yellow-400 mb-3">🏆 Leaderboard</h3>
          {loadingLeaderboard ? (
            <p className="text-slate-500 text-sm text-center">Chargement...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-slate-500 text-sm text-center">Aucun score</p>
          ) : (
            <div className="space-y-1">
              {leaderboard.slice(0, 10).map((entry, idx) => (
                <div key={idx} className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-300' : idx === 1 ? 'bg-slate-400/20 text-slate-300' : idx === 2 ? 'bg-amber-600/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold w-6">{idx + 1}.</span>
                    <span>{getEntityName(entry.entityId)}</span>
                  </div>
                  <span className="font-bold">{entry.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeoGuessrLeaderboard() {
  const [selectedTournament, setSelectedTournament] = useState(TOURNAMENTS[TOURNAMENTS.length - 1]);
  const [scores, setScores] = useState([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityScore, setEntityScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showSnake, setShowSnake] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatEntity, setChatEntity] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);
  const konamiIndexRef = useRef(0);

  useEffect(() => { setCurrentDay(calculateCurrentDay(selectedTournament)); }, [selectedTournament]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const expectedKey = KONAMI_CODE[konamiIndexRef.current];
      const isMatch = e.key === expectedKey || e.key.toLowerCase() === expectedKey.toLowerCase();
      if (isMatch) {
        konamiIndexRef.current++;
        if (konamiIndexRef.current === KONAMI_CODE.length) {
          setShowSnake(true);
          konamiIndexRef.current = 0;
        }
      } else {
        if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) konamiIndexRef.current = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadScores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get&tournamentId=${selectedTournament.id}`);
      const data = await response.json();
      if (data.success) setScores(data.scores || []);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les scores.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getMessages&tournamentId=${selectedTournament.id}`);
      const data = await response.json();
      if (data.success) setMessages(data.messages || []);
    } catch (err) {
      console.error('Erreur chargement chat:', err);
    }
  };

  const sendMessage = async () => {
    if (!chatEntity || !newMessage.trim()) return;
    try {
      setSendingMessage(true);
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMessage',
          tournamentId: selectedTournament.id,
          entityId: chatEntity,
          message: newMessage.trim(),
          timestamp: new Date().toISOString()
        }),
      });
      setNewMessage('');
      setTimeout(loadMessages, 500);
    } catch (err) {
      console.error('Erreur envoi message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const saveScore = async (entityId, day, geoScore) => {
    try {
      setSaving(true);
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          tournamentId: selectedTournament.id,
          entityId,
          day,
          geoScore,
          timestamp: new Date().toISOString()
        }),
      });
      await loadScores();
      setError(null);
    } catch (err) {
      setError('Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (GOOGLE_SCRIPT_URL !== 'COLLE_TON_URL_ICI') {
      loadScores();
      loadMessages();
      const interval = setInterval(loadMessages, 10000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setError('Configure URL Google Script');
    }
  }, [selectedTournament]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const entities = selectedTournament.isTeamBased ? selectedTournament.teams : selectedTournament.participants;
  const getScore = (entityId, day) => scores.find(s => s.entityId === entityId && s.day === day)?.geoScore || null;

  const calculateDayRankings = (day) => {
    const dayScores = entities.map(e => ({ id: e.id, geoScore: getScore(e.id, day) })).filter(e => e.geoScore !== null).sort((a, b) => b.geoScore - a.geoScore);
    let currentRank = 1;
    return dayScores.map((e, idx) => {
      if (idx > 0 && e.geoScore < dayScores[idx - 1].geoScore) currentRank = idx + 1;
      return { ...e, rank: currentRank, tournamentPoints: selectedTournament.pointsDistribution[currentRank] || 0 };
    });
  };

  const getTournamentPoints = (entityId, day) => calculateDayRankings(day).find(r => r.id === entityId)?.tournamentPoints || 0;

  const getCumulativePoints = (entityId, upToDay) => {
    let total = 0;
    for (let d = 1; d <= upToDay; d++) total += getTournamentPoints(entityId, d);
    return total;
  };

  const calculateTotals = () => {
    return entities.map(e => {
      let totalPoints = 0, totalGeoScore = 0, daysPlayed = 0;
      for (let day = 1; day <= selectedTournament.totalDays; day++) {
        const geoScore = getScore(e.id, day);
        if (geoScore !== null) {
          totalPoints += getTournamentPoints(e.id, day);
          totalGeoScore += geoScore;
          daysPlayed++;
        }
      }
      return { ...e, totalPoints, totalGeoScore, daysPlayed, avgGeoScore: daysPlayed > 0 ? Math.round(totalGeoScore / daysPlayed) : 0 };
    }).sort((a, b) => b.totalPoints - a.totalPoints || b.totalGeoScore - a.totalGeoScore);
  };

  const prepareChartData = () => {
    const data = [];
    for (let day = 1; day <= selectedTournament.totalDays; day++) {
      const dayData = { day: `J${day}` };
      entities.forEach(e => { dayData[e.name] = getCumulativePoints(e.id, day); });
      data.push(dayData);
    }
    return data;
  };

  const rankedEntities = calculateTotals();
  const chartData = prepareChartData();

  const handleSubmitScore = async () => {
    if (selectedEntity && entityScore !== '') {
      const score = Math.min(MAX_DAILY_SCORE, Math.max(0, parseInt(entityScore) || 0));
      await saveScore(selectedEntity, currentDay, score);
      setSelectedEntity(null);
      setEntityScore('');
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black shadow-lg';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg';
    return 'bg-slate-800/80 text-white';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6" />;
    if (rank === 2) return <Medal className="w-6 h-6" />;
    if (rank === 3) return <Medal className="w-6 h-6" />;
    return <span className="font-bold text-lg">#{rank}</span>;
  };

  const formatScore = (score) => score !== null && score !== undefined ? score.toLocaleString('fr-FR') : '-';
  const formatTime = (timestamp) => new Date(timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const selectedEntityObj = entities.find(e => e.id === selectedEntity);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      {showSnake && <SnakeGame onClose={() => setShowSnake(false)} entities={entities} googleScriptUrl={GOOGLE_SCRIPT_URL} tournamentId={selectedTournament.id} />}
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Globe className="w-10 h-10 text-green-400 animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent">GeoGuessr Tournament</h1>
            <MapPin className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-blue-300 text-lg">CRED Doctoral Lab Championship 🌍</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Sélectionner un tournoi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TOURNAMENTS.map(tournament => (
              <button key={tournament.id} onClick={() => setSelectedTournament(tournament)} className={`p-4 rounded-lg border-2 transition-all text-left ${selectedTournament.id === tournament.id ? 'border-green-500 bg-green-500/20' : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {tournament.isTeamBased ? <Users className="w-5 h-5 text-purple-400" /> : <User className="w-5 h-5 text-blue-400" />}
                    <span className="font-bold text-white">{tournament.name}</span>
                  </div>
                  {tournament.archived && <Archive className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="text-sm text-slate-400">{tournament.startDate.toLocaleDateString('fr-FR')} - {tournament.endDate.toLocaleDateString('fr-FR')}</div>
                <div className="text-xs text-slate-500 mt-1">{tournament.totalDays} jours {tournament.skipWeekends && '(weekdays)'} • {tournament.isTeamBased ? `${tournament.teams.length} équipes` : `${tournament.participants.length} joueurs`}</div>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 text-red-300">{error}</div>}

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            {selectedTournament.isTeamBased ? <Users className="w-5 h-5 text-purple-400" /> : <User className="w-5 h-5 text-green-400" />}
            Ajouter {selectedTournament.isTeamBased ? "le score de l'équipe" : "mon score"}
          </h3>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button onClick={() => setCurrentDay(Math.max(1, currentDay - 1))} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <span className="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold min-w-24 text-center">Jour {currentDay}</span>
            <button onClick={() => setCurrentDay(Math.min(selectedTournament.totalDays, currentDay + 1))} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
              <ChevronUp className="w-4 h-4 rotate-90" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 text-sm mb-2 block">{selectedTournament.isTeamBased ? 'Quelle équipe ?' : 'Qui es-tu ?'}</label>
              <div className="grid grid-cols-2 gap-2">
                {entities.map(e => (
                  <button key={e.id} onClick={() => setSelectedEntity(e.id === selectedEntity ? null : e.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${selectedEntity === e.id ? 'border-green-500 bg-green-500/20 text-white' : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'}`}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <span className="text-sm truncate">{e.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Score du jour</label>
              <input type="number" min="0" max={MAX_DAILY_SCORE} value={entityScore} onChange={(e) => setEntityScore(e.target.value)} placeholder={`0 - ${formatScore(MAX_DAILY_SCORE)}`} className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500" />
              <p className="text-slate-500 text-xs mt-1">Score GeoGuessr (max {formatScore(MAX_DAILY_SCORE)})</p>
            </div>
            <div className="flex items-end">
              <button onClick={handleSubmitScore} disabled={!selectedEntity || entityScore === '' || saving} className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2">
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {saving ? 'Sauvegarde...' : 'Valider'}
              </button>
            </div>
          </div>
          {selectedEntityObj && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedEntityObj.color }} />
              Score pour <span className="text-white font-medium">{selectedEntityObj.name}</span> - Jour {currentDay}
              {selectedTournament.isTeamBased && selectedEntityObj.members && <span className="text-slate-500">({selectedEntityObj.members.join(', ')})</span>}
            </div>
          )}
          {calculateDayRankings(currentDay).length > 0 && (
            <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-bold text-slate-400 mb-2">Scores du Jour {currentDay} :</h4>
              <div className="flex flex-wrap gap-2">
                {calculateDayRankings(currentDay).map((e) => {
                  const entity = entities.find(ent => ent.id === e.id);
                  return (
                    <div key={e.id} className={`px-3 py-1 rounded-full text-sm font-medium ${e.rank === 1 ? 'bg-yellow-500 text-black' : e.rank === 2 ? 'bg-gray-400 text-black' : e.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'}`}>
                      {e.rank}. {entity?.name} ({formatScore(e.geoScore)}) → +{e.tournamentPoints} pts
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-7 h-7 text-yellow-400" />
              Classement Général
            </h2>
            <button onClick={loadScores} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
          <div className="space-y-3">
            {rankedEntities.map((entity, index) => {
              const rank = index + 1;
              return (
                <div key={entity.id} className={`${getRankStyle(rank)} rounded-xl p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">{getRankIcon(rank)}</div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entity.color }} />
                      <div>
                        <p className="font-bold text-lg">{entity.name}</p>
                        <p className="text-sm opacity-75">
                          {entity.daysPlayed} jour(s) • Moy: {formatScore(entity.avgGeoScore)} pts
                          {selectedTournament.isTeamBased && entity.members && <span className="ml-2">({entity.members.join(', ')})</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{entity.totalPoints}</p>
                    <p className="text-sm opacity-75">pts tournoi</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                <Legend />
                {entities.map(e => (
                  <Line key={e.id} type="monotone" dataKey={e.name} stroke={e.color} strokeWidth={2} dot={{ fill: e.color, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            Chat du tournoi
          </h3>
          <div className="bg-slate-900/50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Aucun message pour l'instant.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, idx) => {
                  const author = entities.find(e => e.id === msg.entityId);
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: author?.color || '#666' }}>
                        {author?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-white">{author?.name || 'Inconnu'}</span>
                          <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-slate-300 text-sm">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <select value={chatEntity || ''} onChange={(e) => setChatEntity(e.target.value ? parseInt(e.target.value) : null)} className="px-3 py-2 bg-purple-600 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer">
              <option value="">Qui es-tu ?</option>
              {entities.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Ton message..." className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
            <button onClick={sendMessage} disabled={!chatEntity || !newMessage.trim() || sendingMessage} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2">
              {sendingMessage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Distribution des points tournoi</h3>
          <div className={`grid gap-2 ${selectedTournament.isTeamBased ? 'grid-cols-4' : 'grid-cols-4 md:grid-cols-8'}`}>
            {Object.entries(selectedTournament.pointsDistribution).map(([rank, points]) => (
              <div key={rank} className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-sm">{rank}{rank === '1' ? 'er' : 'e'}</p>
                <p className="text-white font-bold text-xl">{points}</p>
                <p className="text-slate-500 text-xs">pts</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 overflow-x-auto">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-blue-400" />
            Détail des scores
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left p-2">{selectedTournament.isTeamBased ? 'Équipe' : 'Participant'}</th>
                {Array.from({ length: selectedTournament.totalDays }, (_, i) => (
                  <th key={i} className="p-2 text-center min-w-16">J{i + 1}</th>
                ))}
                <th className="p-2 text-center text-blue-400 min-w-20">Total Geo</th>
                <th className="p-2 text-center text-green-400 min-w-20">Pts Tournoi</th>
              </tr>
            </thead>
            <tbody>
              {rankedEntities.map((e, idx) => (
                <tr key={e.id} className={idx % 2 === 0 ? 'bg-slate-700/30' : ''}>
                  <td className="p-2 text-white font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                      {e.name}
                    </div>
                  </td>
                  {Array.from({ length: selectedTournament.totalDays }, (_, i) => {
                    const geoScore = getScore(e.id, i + 1);
                    const tournamentPts = getTournamentPoints(e.id, i + 1);
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
                  <td className="p-2 text-center text-blue-400 font-bold">{formatScore(e.totalGeoScore)}</td>
                  <td className="p-2 text-center text-green-400 font-bold">{e.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8 text-slate-500 text-sm">
          CRED Doctoral Lab • GeoGuessr Tournament 2025
        </div>
      </div>
    </div>
  );
}
