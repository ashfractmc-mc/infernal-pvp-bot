const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TIERS = {
  bronze: { min: 0, max: 499, emoji: "🥉" },
  silver: { min: 500, max: 999, emoji: "🥈" },
  gold: { min: 1000, max: 1499, emoji: "🏆" },
  platinum: { min: 1500, max: 1999, emoji: "💎" },
  diamond: { min: 2000, max: 2499, emoji: "👑" },
  master: { min: 2500, max: Infinity, emoji: "🔥" }
};

const DATA_FILE = path.join(__dirname, 'playerData.json');
let playerData = {};
try { playerData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (err) { playerData = {}; }

function saveData() { fs.writeFileSync(DATA_FILE, JSON.stringify(playerData, null, 2)); }

function getTier(points) {
  for (const [tier, range] of Object.entries(TIERS)) {
    if (points >= range.min && points <= range.max) return { name: tier, emoji: range.emoji };
  }
  return { name: "bronze", emoji: "🥉" };
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('ready', () => console.log(`✅ Bot online as ${client.user.tag}`));

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const args = message.content.split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === '!register') {
    if (!message.mentions.users.first()) return message.reply('❌ Mention a user!');
    const userId = message.mentions.users.first().id;
    const playerName = args.join(' ') || message.mentions.users.first().username;
    if (playerData[userId]) return message.reply('❌ Already registered!');
    playerData[userId] = { name: playerName, points: 1000, wins: 0, losses: 0 };
    saveData();
    const tier = getTier(1000);
    message.reply(`✅ Registered ${playerName} (${tier.emoji} **${tier.name}**)`);
  }

  if (command === '!win') {
    const userId = message.mentions.users.first()?.id || message.author.id;
    if (!playerData[userId]) return message.reply('❌ Not registered! Use !register');
    playerData[userId].wins++;
    playerData[userId].points += 50;
    saveData();
    const tier = getTier(playerData[userId].points);
    message.reply(`✅ +50 points for ${playerData[userId].name}! (${tier.emoji} **${tier.name}** - ${playerData[userId].points} pts)`);
  }

  if (command === '!loss') {
    const userId = message.mentions.users.first()?.id || message.author.id;
    if (!playerData[userId]) return message.reply('❌ Not registered! Use !register');
    playerData[userId].losses++;
    playerData[userId].points = Math.max(0, playerData[userId].points - 25);
    saveData();
    const tier = getTier(playerData[userId].points);
    message.reply(`❌ -25 points for ${playerData[userId].name}! (${tier.emoji} **${tier.name}** - ${playerData[userId].points} pts)`);
  }

  if (command === '!stats') {
    const targetUser = message.mentions.users.first() || message.author;
    const userId = targetUser.id;
    if (!playerData[userId]) return message.reply('❌ Not registered!');
    const data = playerData[userId];
    const tier = getTier(data.points);
    const winRate = data.wins + data.losses > 0 ? ((data.wins / (data.wins + data.losses)) * 100).toFixed(1) : 0;
    message.reply({ embeds: [{ title: `${data.name}'s Stats`, description: `${tier.emoji} **${tier.name.toUpperCase()}**\n**Points:** ${data.points}\n**Wins:** ${data.wins}\n**Losses:** ${data.losses}\n**Win Rate:** ${winRate}%`, color: 0x00ff00, thumbnail: { url: targetUser.displayAvatarURL() } }] });
  }

  if (command === '!leaderboard' || command === '!lb') {
    const sorted = Object.entries(playerData).sort((a, b) => b[1].points - a[1].points).slice(0, 10);
    const lbText = sorted.map(([id, p], i) => `**#${i+1}** ${getTier(p.points).emoji} **${p.name}** - ${p.points} pts (${p.wins}-${p.losses})`).join('\n');
    message.reply({ embeds: [{ title: '🏆 PvP Leaderboard', description: lbText, color: 0xffff00 }] });
  }
});

client.login(process.env.TOKEN);
