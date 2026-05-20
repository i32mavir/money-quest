const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ============================================================
// 🎮 MONEY QUEST v2 — Motor del juego (Rafa & Laura Edition)
// ============================================================

const DATA_FILE = path.join(__dirname, 'game_data.json');
const RANKINGS_FILE = path.join(__dirname, 'rankings.json');

const LEVELS = [
  { level: 1, exp: 0,    title: '🥉 Aprendiz del Ahorro' },
  { level: 2, exp: 100,  title: '🥈 Guerrero del Presupuesto' },
  { level: 3, exp: 250,  title: '🥇 Caballero de la Inversión' },
  { level: 4, exp: 450,  title: '💎 Maestro Financiero' },
  { level: 5, exp: 700,  title: '👑 Leyenda del Dinero' }
];

const CHALLENGES = [
  { id: 'anti_gasto',     name: '🏦 Día Anti-Gasto',       desc: 'No gastar nada en 24 horas',              exp: 30, coins: 15, difficulty: 2 },
  { id: 'chef_casero',    name: '🍳 Chef Casero',           desc: 'Cocinar en casa en vez de pedir comida',  exp: 20, coins: 10, difficulty: 1 },
  { id: 'caza_ofertas',   name: '🔍 Caza Ofertas',          desc: 'Encontrar un precio más barato en algo',  exp: 15, coins: 20, difficulty: 1 },
  { id: 'presupuesto',    name: '📊 Presupuesto Relámpago',  desc: 'Hacer presupuesto mensual en 10 min',     exp: 25, coins: 5,  difficulty: 2 },
  { id: 'ayuno_apps',     name: '🚫 Ayuno de Apps',         desc: 'No usar apps de compras durante 1 día',   exp: 20, coins: 10, difficulty: 2 },
  { id: 'ahorro_semanal', name: '🐷 Ahorro Semanal',        desc: 'Ahorrar 20€ esta semana',                 exp: 40, coins: 15, difficulty: 3 },
  { id: 'gasto_positivo', name: '📚 Gasto Positivo',        desc: 'Gastar solo en formación/libros hoy',     exp: 25, coins: 10, difficulty: 2 },
  { id: 'auditoria',      name: '📋 Mini Auditoría',        desc: 'Revisar gastos de la semana anterior',    exp: 20, coins: 15, difficulty: 1 },
  { id: 'trueque',        name: '🔄 Trueque Maestro',       desc: 'Intercambiar algo en vez de comprar',     exp: 15, coins: 10, difficulty: 1 },
  { id: 'reto_pareja',    name: '💑 Reto en Pareja',        desc: 'Completar un reto juntos',                exp: 35, coins: 20, difficulty: 3 }
];

const SHOP_ITEMS = [
  { id: 'escudo',       name: '🛡️ Escudo Anti-Capricho',   desc: 'Anula 1 gasto impulsivo del rival',        cost: 50, type: 'sabotaje' },
  { id: 'multiplicador', name: '⚡ Multiplicador EXP',       desc: 'x2 EXP en tu siguiente reto',              cost: 80, type: 'potenciador' },
  { id: 'robo',         name: '🪙 Robo Educativo',          desc: 'Quita 20 monedas al rival (van al bote)',  cost: 60, type: 'sabotaje' },
  { id: 'bendicion',    name: '💝 Bendición Compartida',    desc: 'Ambos jugadores ganan +10 EXP',            cost: 40, type: 'cooperativo' },
  { id: 'escudo_robo',  name: '🔰 Escudo Anti-Robo',        desc: 'Protege tus monedas de un robo',           cost: 30, type: 'defensa' },
  { id: 'dado_doble',   name: '🎲 Dado Doble',              desc: 'Tira 2 retos y elige el mejor',            cost: 45, type: 'potenciador' }
];

const AVATARS = [
  '🦁', '🐯', '🐺', '🦊', '🐉', '🦅', '🐬', '🦄', '🐲', '🦚', '🐈', '🐕',
  '👑', '⚔️', '🛡️', '🔥', '💎', '🌟', '🌈', '🍀', '🎭', '🎪', '🗡️', '🏆'
];

// ============================================================
// 📦 Gestión de datos mejorada
// ============================================================

function loadJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch(e) { console.error('Error cargando:', file, e); }
  return fallback;
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

let gameData = loadJSON(DATA_FILE, { sessions: {} });
let rankings = loadJSON(RANKINGS_FILE, { history: [] });

function saveAll() {
  saveJSON(DATA_FILE, gameData);
  saveJSON(RANKINGS_FILE, rankings);
}

function getSession(code) { return gameData.sessions[code]; }

function saveSession(code, session) {
  gameData.sessions[code] = session;
  saveJSON(DATA_FILE, gameData);
}

function createPlayer(name, avatar) {
  return {
    id: uuidv4(),
    name: name,
    avatar: avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)],
    level: 1,
    exp: 0,
    coins: 50,
    completedChallenges: [],
    inventory: [],
    activeEffects: [],
    joinedAt: new Date().toISOString()
  };
}

function calculateLevel(exp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i].exp) return LEVELS[i];
  }
  return LEVELS[0];
}

function getExpToNextLevel(exp) {
  const cl = calculateLevel(exp);
  const idx = LEVELS.findIndex(l => l.level === cl.level);
  if (idx >= LEVELS.length - 1) return null;
  const nl = LEVELS[idx + 1];
  return { current: exp, needed: nl.exp, remaining: nl.exp - exp, nextTitle: nl.title };
}

function getLevelProgress(exp) {
  const cl = calculateLevel(exp);
  const idx = LEVELS.findIndex(l => l.level === cl.level);
  if (idx >= LEVELS.length - 1) return 100;
  return Math.floor(((exp - cl.exp) / (LEVELS[idx + 1].exp - cl.exp)) * 100);
}

function generateSessionCode() {
  const words = ['DRAGON', 'TESORO', 'MONEDA', 'ORO', 'RUBI', 'MAGIA', 'FUEGO', 'HIELO',
                  'SABIO', 'REY', 'REINA', 'CASTILLO', 'BOSQUE', 'ESTRELLA', 'LUNA', 'SOL', 'RAFA', 'LAURA'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return word + num;
}

// ============================================================
// 🔌 Socket.IO - Tiempo real
// ============================================================

io.on('connection', (socket) => {
  console.log(`🔌 Conectado: ${socket.id}`);

  // ----- CREAR SESIÓN -----
  socket.on('crear_sesion', (data, callback) => {
    const { playerName, avatar } = data;
    if (!playerName || playerName.trim().length < 2) {
      return callback({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    const code = generateSessionCode();
    const session = {
      code,
      player1: createPlayer(playerName.trim(), avatar),
      player2: null,
      gameLog: [],
      bote: 0,
      mesActual: new Date().toISOString().slice(0, 7),
      createdAt: new Date().toISOString(),
      version: 2
    };

    socket.join(code);
    socket.data.sessionCode = code;
    socket.data.playerId = session.player1.id;
    socket.data.playerNum = 1;

    saveSession(code, session);
    console.log(`🎮 Sesión creada: ${code} por ${playerName} ${avatar || ''}`);

    callback({ success: true, sessionCode: code, player: session.player1, playerNum: 1 });
  });

  // ----- UNIRSE A SESIÓN -----
  socket.on('unir_sesion', (data, callback) => {
    const { sessionCode, playerName, avatar } = data;
    if (!playerName || playerName.trim().length < 2) {
      return callback({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    const session = getSession(sessionCode);
    if (!session) return callback({ error: '❌ Sesión no encontrada. Verifica el código.' });
    if (session.player2) return callback({ error: '❌ Esta sesión ya tiene 2 jugadores.' });
    if (session.player1.name === playerName.trim()) {
      return callback({ error: '❌ No puedes usar el mismo nombre que el jugador 1.' });
    }

    session.player2 = createPlayer(playerName.trim(), avatar);
    socket.join(sessionCode);
    socket.data.sessionCode = sessionCode;
    socket.data.playerId = session.player2.id;
    socket.data.playerNum = 2;

    saveSession(sessionCode, session);

    io.to(sessionCode).emit('rival_conectado', {
      player1: session.player1,
      player2: session.player2,
      gameLog: session.gameLog
    });

    console.log(`🎮 ${playerName} se unió a sesión ${sessionCode}`);
    callback({ success: true, session, playerNum: 2, player: session.player2 });
  });

  // ----- COMPLETAR RETO -----
  socket.on('completar_reto', (data, callback) => {
    const session = getSession(socket.data.sessionCode);
    if (!session) return callback({ error: 'Sesión no encontrada' });

    const player = socket.data.playerNum === 1 ? session.player1 : session.player2;
    const rival = socket.data.playerNum === 1 ? session.player2 : session.player1;
    const challenge = CHALLENGES.find(c => c.id === data.challengeId);
    if (!challenge) return callback({ error: 'Reto no encontrado' });

    const today = new Date().toISOString().slice(0, 10);
    const alreadyDone = (player.completedChallenges || []).find(
      c => c.id === challenge.id && c.date === today
    );
    if (alreadyDone) return callback({ error: '⚠️ Ya has completado este reto hoy. ¡Espera a mañana!' });

    let expMultiplier = 1;
    const multiIdx = (player.activeEffects || []).findIndex(e => e.type === 'multiplicador_exp');
    if (multiIdx >= 0) {
      expMultiplier = (player.activeEffects[multiIdx].value || 2);
      player.activeEffects.splice(multiIdx, 1);
    }

    const expGanada = Math.floor(challenge.exp * expMultiplier);
    const coinsGanadas = challenge.coins;

    player.exp = (player.exp || 0) + expGanada;
    player.coins = (player.coins || 0) + coinsGanadas;
    if (!player.completedChallenges) player.completedChallenges = [];
    player.completedChallenges.push({ id: challenge.id, date: today, exp: expGanada, coins: coinsGanadas });

    const newLevel = calculateLevel(player.exp);
    const oldLevel = player.level;
    player.level = newLevel.level;

    const logEntry = {
      time: new Date().toISOString(),
      player: player.name,
      avatar: player.avatar || '👤',
      action: `completó ${challenge.name}`,
      reward: `+${expGanada} EXP, +${coinsGanadas} monedas${expMultiplier > 1 ? ' (⚡x2 EXP!)' : ''}`
    };
    session.gameLog.unshift(logEntry);
    if (session.gameLog.length > 100) session.gameLog.length = 100;

    saveSession(socket.data.sessionCode, session);

    io.to(socket.data.sessionCode).emit('juego_actualizado', {
      session,
      lastAction: {
        playerName: player.name,
        playerAvatar: player.avatar || '👤',
        challengeName: challenge.name,
        expGanada,
        coinsGanadas,
        leveledUp: oldLevel !== newLevel.level,
        newLevel: newLevel.level,
        newTitle: newLevel.title,
        expMultiplier: expMultiplier > 1
      },
      gameLog: session.gameLog
    });

    // Notificar al rival
    if (rival) {
      io.to(socket.data.sessionCode).emit('notificacion_rival', {
        title: `⚔️ ${player.name} completó un reto`,
        body: `${challenge.name}: +${expGanada} EXP, +${coinsGanadas} 💰`,
        playerName: player.name,
        playerAvatar: player.avatar || '👤'
      });
    }

    callback({ 
      success: true, player,
      expGanada, coinsGanadas,
      leveledUp: oldLevel !== newLevel.level,
      newTitle: newLevel.title
    });
  });

  // ----- COMPRAR ITEM -----
  socket.on('comprar_item', (data, callback) => {
    const session = getSession(socket.data.sessionCode);
    if (!session) return callback({ error: 'Sesión no encontrada' });

    const player = socket.data.playerNum === 1 ? session.player1 : session.player2;
    const rival = socket.data.playerNum === 1 ? session.player2 : session.player1;
    const item = SHOP_ITEMS.find(i => i.id === data.itemId);
    if (!item) return callback({ error: 'Objeto no encontrado' });
    if ((player.coins || 0) < item.cost) return callback({ error: '💰 No tienes suficientes monedas' });

    player.coins -= item.cost;
    if (!player.inventory) player.inventory = [];
    player.inventory.push({ itemId: item.id, name: item.name, boughtAt: new Date().toISOString() });

    let extraMessage = '';
    if (item.id === 'bendicion') {
      player.exp = (player.exp || 0) + 10;
      if (rival) rival.exp = (rival.exp || 0) + 10;
      extraMessage = '✨ ¡Ambos recibieron +10 EXP!';
    }

    session.gameLog.unshift({
      time: new Date().toISOString(),
      player: player.name,
      avatar: player.avatar || '👤',
      action: `compró ${item.name}`,
      reward: extraMessage || `Gastó ${item.cost} monedas`
    });

    saveSession(socket.data.sessionCode, session);

    io.to(socket.data.sessionCode).emit('juego_actualizado', {
      session,
      lastAction: { playerName: player.name, playerAvatar: player.avatar, actionType: 'compra', itemName: item.name, extraMessage },
      gameLog: session.gameLog
    });

    callback({ success: true, player, item, extraMessage });
  });

  // ----- USAR OBJETO -----
  socket.on('usar_objeto', (data, callback) => {
    const session = getSession(socket.data.sessionCode);
    if (!session) return callback({ error: 'Sesión no encontrada' });

    const player = socket.data.playerNum === 1 ? session.player1 : session.player2;
    const rival = socket.data.playerNum === 1 ? session.player2 : session.player1;
    if (!rival) return callback({ error: 'No hay rival' });

    const invIdx = (player.inventory || []).findIndex(i => i.itemId === data.itemId);
    if (invIdx < 0) return callback({ error: 'No tienes ese objeto' });

    const item = SHOP_ITEMS.find(i => i.id === data.itemId);
    player.inventory.splice(invIdx, 1);

    let logMsg = '', rivalAffected = false;
    if (!player.activeEffects) player.activeEffects = [];
    if (!rival.activeEffects) rival.activeEffects = [];

    switch(data.itemId) {
      case 'escudo':
        rival.activeEffects.push({ type: 'anular_reto', value: 1, appliedBy: player.name });
        logMsg = `🛡️ ${player.name} activó Escudo Anti-Capricho contra ${rival.name}`;
        rivalAffected = true;
        break;
      case 'multiplicador':
        player.activeEffects.push({ type: 'multiplicador_exp', value: 2 });
        logMsg = `⚡ ${player.name} activó Multiplicador EXP`;
        break;
      case 'robo':
        const tieneEscudo = rival.activeEffects.findIndex(e => e.type === 'escudo_robo');
        if (tieneEscudo >= 0) {
          rival.activeEffects.splice(tieneEscudo, 1);
          logMsg = `🔰 ${rival.name} bloqueó el robo con Escudo Anti-Robo`;
        } else {
          const robbed = Math.min(20, (rival.coins || 0));
          rival.coins = (rival.coins || 0) - robbed;
          session.bote = (session.bote || 0) + robbed;
          logMsg = `🪙 ${player.name} robó ${robbed} monedas a ${rival.name}`;
          rivalAffected = true;
        }
        break;
      case 'bendicion':
        player.exp = (player.exp || 0) + 10;
        rival.exp = (rival.exp || 0) + 10;
        logMsg = `💝 Bendición Compartida: ambos +10 EXP`;
        rivalAffected = true;
        break;
      case 'escudo_robo':
        player.activeEffects.push({ type: 'escudo_robo', value: 1 });
        logMsg = `🔰 ${player.name} activó Escudo Anti-Robo`;
        break;
      case 'dado_doble':
        player.activeEffects.push({ type: 'dado_doble', value: 1 });
        logMsg = `🎲 ${player.name} activó Dado Doble`;
        break;
    }

    session.gameLog.unshift({
      time: new Date().toISOString(),
      player: player.name,
      avatar: player.avatar || '👤',
      action: logMsg, reward: ''
    });

    saveSession(socket.data.sessionCode, session);

    io.to(socket.data.sessionCode).emit('juego_actualizado', {
      session,
      lastAction: { playerName: player.name, playerAvatar: player.avatar, actionType: 'uso_objeto', itemName: item.name, logMessage: logMsg },
      gameLog: session.gameLog
    });

    callback({ success: true, player, rival: rivalAffected ? rival : null, logMsg });
  });

  // ----- OBTENER ESTADO -----
  socket.on('obtener_estado', (data, callback) => {
    const session = getSession(socket.data.sessionCode);
    if (!session) return callback({ error: 'Sesión no encontrada' });
    const player = socket.data.playerNum === 1 ? session.player1 : session.player2;
    callback({
      session, playerNum: socket.data.playerNum,
      myProgress: { level: calculateLevel(player.exp || 0), nextLevel: getExpToNextLevel(player.exp || 0), progress: getLevelProgress(player.exp || 0) },
      challenges: CHALLENGES, shop: SHOP_ITEMS, gameLog: session.gameLog || [],
      rankings: rankings.history.slice(0, 10),
      avatars: AVATARS
    });
  });

  // ----- REINICIAR MES -----
  socket.on('reiniciar_mes', (data, callback) => {
    const session = getSession(socket.data.sessionCode);
    if (!session) return callback({ error: 'Sesión no encontrada' });
    if (socket.data.playerNum !== 1) return callback({ error: 'Solo el creador puede reiniciar' });

    const p1 = session.player1, p2 = session.player2;
    let ganador = null;
    if ((p1.exp || 0) > (p2?.exp || 0)) ganador = { name: p1.name, avatar: p1.avatar };
    else if (p2 && (p2.exp || 0) > (p1.exp || 0)) ganador = { name: p2.name, avatar: p2.avatar };
    else ganador = { name: 'Empate', avatar: '🤝' };

    // Guardar en ranking histórico
    rankings.history.unshift({
      month: session.mesActual,
      sessionCode: session.code,
      ganador: ganador.name,
      ganadorAvatar: ganador.avatar,
      rafa: { name: p1.name, avatar: p1.avatar, exp: p1.exp || 0, level: p1.level },
      laura: p2 ? { name: p2.name, avatar: p2.avatar, exp: p2.exp || 0, level: p2.level } : null,
      fecha: new Date().toISOString()
    });
    if (rankings.history.length > 50) rankings.history.length = 50;

    // Reiniciar
    ['player1', 'player2'].forEach(key => {
      const p = session[key];
      if (!p) return;
      p.exp = 0; p.level = 1; p.coins = 50;
      p.completedChallenges = []; p.inventory = []; p.activeEffects = [];
    });

    session.gameLog = [{
      time: new Date().toISOString(),
      player: 'Sistema', avatar: '🏆',
      action: `¡Nuevo mes! Ganador anterior: ${ganador.name}`,
      reward: '¡Todos reiniciados a Nivel 1!'
    }];
    session.bote = 0;
    session.mesActual = new Date().toISOString().slice(0, 7);

    saveSession(socket.data.sessionCode, session);
    saveJSON(RANKINGS_FILE, rankings);

    io.to(socket.data.sessionCode).emit('mes_reiniciado', {
      session, ganadorAnterior: ganador.name, ganadorAvatar: ganador.avatar,
      rankings: rankings.history.slice(0, 10)
    });

    callback({ success: true, ganadorAnterior: ganador, rankings: rankings.history.slice(0, 10) });
  });

  // ----- DESCONEXIÓN -----
  socket.on('disconnect', () => {
    console.log(`🔌 Desconectado: ${socket.id}`);
    if (socket.data.sessionCode) {
      io.to(socket.data.sessionCode).emit('jugador_desconectado', {
        playerNum: socket.data.playerNum
      });
    }
  });
});

// ============================================================
// 🌐 API REST
// ============================================================

app.get('/api/sesion/:code', (req, res) => {
  const session = getSession(req.params.code);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
  res.json(session);
});

app.get('/api/rankings', (req, res) => {
  res.json(rankings.history.slice(0, 50));
});

app.get('/api/rafaylaura', (req, res) => {
  // Buscar stats de Rafa y Laura en todo el historial
  const allTime = { rafa: { wins: 0, totalExp: 0, months: 0 }, laura: { wins: 0, totalExp: 0, months: 0 } };
  
  rankings.history.forEach(r => {
    if (r.rafa) {
      allTime.rafa.totalExp += r.rafa.exp;
      allTime.rafa.months++;
      if (r.ganador === r.rafa.name) allTime.rafa.wins++;
    }
    if (r.laura) {
      allTime.laura.totalExp += r.laura.exp;
      allTime.laura.months++;
      if (r.ganador === r.laura.name) allTime.laura.wins++;
    }
  });

  res.json(allTime);
});

// ============================================================
// 🚀 INICIAR
// ============================================================

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🎮 MONEY QUEST v2 — Rafa & Laura 🎮  ║
║   RPG Financiero de Pareja              ║
║   Puerto: ${PORT}                         ║
║   Niveles: 5 | Retos: ${CHALLENGES.length} | Tienda: ${SHOP_ITEMS.length}     ║
║   🏆 Rankings: ${rankings.history.length} meses       ║
║   📱 PWA lista | 🔔 Notificaciones ON  ║
╚══════════════════════════════════════════╝
  `);
});
