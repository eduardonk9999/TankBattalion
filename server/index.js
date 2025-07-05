// Servidor básico para Tank Battalion multiplayer
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir arquivos estáticos do cliente
app.use(express.static(path.join(__dirname, '../client')));

// Porta do servidor
const PORT = process.env.PORT || 3000;

// Estado do jogo no servidor
let players = {};
let bullets = [];
let explosions = [];
let map = null;

// Função para criar o mapa com estruturas estratégicas
function createMap() {
  const tileSize = 16;        // tamanho do bloco original Tank Battalion
  const cols = 45;
  const rows = 30;

  // Cria mapa vazio
  const map = Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => 0)
  );

  // Adiciona bordas indestrutíveis
  for (let x = 0; x < cols; x++) {
    map[0][x] = 1; // Borda superior
    map[rows - 1][x] = 1; // Borda inferior
  }
  for (let y = 0; y < rows; y++) {
    map[y][0] = 1; // Borda esquerda
    map[y][cols - 1] = 1; // Borda direita
  }

  // Função para adicionar corredores horizontais
  function addHorizontalCorridors() {
    for (let y = 1; y < rows - 1; y += 4) { // começa logo após a borda
      let x = 1;
      while (x < cols - 2) {
        const length = Math.floor(Math.random() * 5) + 3; // blocos seguidos: 3-7
        for (let i = 0; i < length && x + i < cols - 1; i++) {
          map[y][x + i] = 2; // adiciona bloco de muro
        }
        x += length + Math.floor(Math.random() * 4) + 2; // pula espaço entre trechos
      }
    }
  }

  // Função para adicionar corredores verticais
  function addVerticalCorridors() {
    for (let x = 1; x < cols - 1; x += 8) { // começa logo após a borda
      let y = 1;
      while (y < rows - 2) {
        const length = Math.floor(Math.random() * 4) + 2; // blocos seguidos: 2-5
        for (let i = 0; i < length && y + i < rows - 1; i++) {
          map[y + i][x] = 2; // adiciona bloco de muro
        }
        y += length + Math.floor(Math.random() * 4) + 2; // pula espaço entre trechos
      }
    }
  }

  // Gera os corredores do mapa
  addHorizontalCorridors();
  addVerticalCorridors();

  return map;
}


map = createMap();

// Função para criar um novo tanque
function createTank(id, color) {
  // Posições iniciais afastadas das bordas (mínimo 40px de distância)
  const positions = [
    { x: 60, y: 60 },    // canto superior esquerdo afastado
    { x: 780, y: 60 },   // canto superior direito afastado
    { x: 400, y: 480 },  // centro inferior afastado
  ];
  let pos = positions[Object.keys(players).length % positions.length];

  // Função para checar se a posição está livre de muros
  function isFree(x, y) {
    const tileSize = 20;
    const tankSize = 40;
    // Checa os 4 cantos do tanque
    const checks = [
      [x, y],
      [x + tankSize - 1, y],
      [x, y + tankSize - 1],
      [x + tankSize - 1, y + tankSize - 1],
    ];
    for (const [cx, cy] of checks) {
      const tx = Math.floor(cx / tileSize);
      const ty = Math.floor(cy / tileSize);
      if (map[ty] && (map[ty][tx] === 1 || map[ty][tx] === 2)) {
        return false;
      }
    }
    return true;
  }

  // Se a posição inicial estiver ocupada, procura a posição livre mais próxima
  if (!isFree(pos.x, pos.y)) {
    let found = false;
    for (let radius = 1; radius < 10 && !found; radius++) {
      for (let dx = -radius * 20; dx <= radius * 20; dx += 20) {
        for (let dy = -radius * 20; dy <= radius * 20; dy += 20) {
          const nx = pos.x + dx;
          const ny = pos.y + dy;
          if (nx >= 40 && nx <= 900 - 40 && ny >= 40 && ny <= 600 - 40) {
            if (isFree(nx, ny)) {
              pos = { x: nx, y: ny };
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
    }
  }

  return {
    id,
    x: pos.x,
    y: pos.y,
    color: color || '#1cc',
    direction: 'up',
    alive: true,
    lives: 3,
    hits: 0,
    respawnTime: 0
  };
}

// Função para criar explosão
function createExplosion(x, y) {
  explosions.push({
    x: x,
    y: y,
    frame: 0,
    maxFrames: 8,
    active: true
  });
}

// Envia o estado do jogo para todos os clientes
function broadcastGameState() {
  io.emit('gameState', {
    players: Object.values(players),
    bullets,
    explosions,
    map,
  });
}

io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);
  
  // Verifica se já há 2 jogadores conectados
  const currentPlayers = Object.keys(players).length;
  if (currentPlayers >= 2) {
    console.log('Sala cheia! Jogador rejeitado:', socket.id);
    socket.emit('roomFull', { message: 'Sala cheia! Máximo 2 jogadores.' });
    socket.disconnect();
    return;
  }
  
  // Cria um novo tanque para o jogador
  players[socket.id] = createTank(socket.id);
  socket.emit('init', { id: socket.id, map });
  broadcastGameState();
  
  console.log(`Jogadores conectados: ${Object.keys(players).length}/2`);

  // Movimento do tanque
  socket.on('move', (data) => {
    const player = players[socket.id];
    if (!player || !player.alive) return;
    player.x = data.x;
    player.y = data.y;
    player.direction = data.direction;
    broadcastGameState();
  });

  // Tiro
  socket.on('shoot', (data) => {
    const player = players[socket.id];
    if (!player || !player.alive) return;
    bullets.push({
      x: data.x,
      y: data.y,
      direction: data.direction,
      owner: socket.id,
      size: 6,
      speed: 10,
      active: true,
    });
    broadcastGameState();
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);
    delete players[socket.id];
    broadcastGameState();
    console.log(`Jogadores conectados: ${Object.keys(players).length}/2`);
  });
});

// Atualização periódica do estado das balas (simples)
setInterval(() => {
  bullets.forEach(bullet => {
    switch (bullet.direction) {
      case 'up': bullet.y -= bullet.speed; break;
      case 'down': bullet.y += bullet.speed; break;
      case 'left': bullet.x -= bullet.speed; break;
      case 'right': bullet.x += bullet.speed; break;
    }
    
    // Remove balas que saíram do mapa
    if (
      bullet.x < 0 || bullet.x > 900 ||
      bullet.y < 0 || bullet.y > 600
    ) {
      bullet.active = false;
    }
    
    // Verifica colisão com muros
    const tileSize = 20;
    const bulletCenterX = bullet.x + bullet.size / 2;
    const bulletCenterY = bullet.y + bullet.size / 2;
    const mapX = Math.floor(bulletCenterX / tileSize);
    const mapY = Math.floor(bulletCenterY / tileSize);
    
    // Verifica se a bala está dentro dos limites do mapa
    if (mapY >= 0 && mapY < map.length && mapX >= 0 && mapX < map[0].length) {
      const tile = map[mapY][mapX];
      if (tile === 1 || tile === 2) {
        // Bala atingiu um muro (indestrutível ou destrutível) - apenas para e desaparece
        bullet.active = false;
      }
    }
    
    // Verifica colisão com tanques
    Object.values(players).forEach(player => {
      if (player.alive && bullet.owner !== player.id) {
        const tankCenterX = player.x + 20;
        const tankCenterY = player.y + 20;
        const distance = Math.sqrt(
          Math.pow(bulletCenterX - tankCenterX, 2) + 
          Math.pow(bulletCenterY - tankCenterY, 2)
        );
        
        if (distance < 35) { // Colisão com tanque - aumentado para chegar mais perto
          bullet.active = false;
          player.hits++;
          
          console.log(`Tanque ${player.id} atingido! Hits: ${player.hits}, Vidas: ${player.lives}`);
          
          // A cada 3 tiros, perde uma vida
          if (player.hits >= 3) {
            player.lives--;
            player.hits = 0;
            
            console.log(`Tanque ${player.id} perdeu uma vida! Vidas restantes: ${player.lives}`);
            
            if (player.lives <= 0) {
              // Tanque morreu
              player.alive = false;
              createExplosion(tankCenterX, tankCenterY);
              player.respawnTime = Date.now() + 3000; // Respawn em 3 segundos
              console.log(`Tanque ${player.id} morreu! Respawn em 3 segundos`);
            }
          }
        }
      }
    });
  });
  
  // Atualiza explosões
  explosions.forEach(explosion => {
    explosion.frame++;
    if (explosion.frame >= explosion.maxFrames) {
      explosion.active = false;
    }
  });
  
  // Respawn de tanques
  Object.values(players).forEach(player => {
    if (!player.alive && player.respawnTime > 0 && Date.now() >= player.respawnTime) {
      // Respawn do tanque
      const positions = [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 400, y: 400 },
      ];
      const pos = positions[Math.floor(Math.random() * positions.length)];
      player.x = pos.x;
      player.y = pos.y;
      player.alive = true;
      player.lives = 3; // Restaura as 3 vidas
      player.hits = 0; // Reseta a contagem de tiros
      player.respawnTime = 0;
    }
  });
  
  bullets = bullets.filter(b => b.active);
  explosions = explosions.filter(e => e.active);
  broadcastGameState();
}, 50);

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
