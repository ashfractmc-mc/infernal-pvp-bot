const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'playerData.json');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/leaderboard', (req, res) => {
  try {
    const playerData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const sorted = Object.entries(playerData).sort((a, b) => b[1].points - a[1].points).map(([id, data]) => ({
      name: data.name,
      points: data.points,
      wins: data.wins,
      losses: data.losses,
      tier: getTier(data.points)
    }));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

function getTier(points) {
  const tiers = [
    { name: 'master', min: 2500, emoji: '🔥' },
    { name: 'diamond', min: 2000, emoji: '👑' },
    { name: 'platinum', min: 1500, emoji: '💎' },
    { name: 'gold', min: 1000, emoji: '🏆' },
    { name: 'silver', min: 500, emoji: '🥈' },
    { name: 'bronze', min: 0, emoji: '🥉' }
  ];
  for (const tier of tiers) if (points >= tier.min) return { name: tier.name, emoji: tier.emoji };
  return { name: 'bronze', emoji: '🥉' };
}

app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Web server running on port ${PORT}`));
