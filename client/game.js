// game.js - Desenha o layout inicial do Tank Battalion e estrutura as classes principais

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variáveis globais de multiplayer
let clientId = null;
let gameState = null;

// Dimensões do campo
let WIDTH = canvas.width;
let HEIGHT = canvas.height;

// Novo padrão de tijolos Tank Battalion: bloco 16x16, tijolos 4x2, linhas alternadas, argamassa preta
let brickPattern = null;
function createTankBattalionBrickPattern(ctx) {
  // Cria um canvas de 16x16 para o bloco do muro
  const brickCanvas = document.createElement('canvas');
  brickCanvas.width = 16;
  brickCanvas.height = 16;
  const brickCtx = brickCanvas.getContext('2d');

  // Configura cores
  const brickColor = '#B22222'; // cor do tijolo
  const brickWidth = 4;
  const brickHeight = 2;
  const mortar = 1; // espaçamento entre tijolos

  // Desenha padrão de tijolos dentro do bloco
  for (let row = 0; row < 8; row++) {  // 8 linhas de 2px em 16px de altura
    const y = row * (brickHeight + mortar / 2);
    const offsetX = (row % 2 === 0) ? 0 : brickWidth / 2; // desloca linhas ímpares
    for (let x = -brickWidth; x < 16; x += brickWidth + mortar) {
      brickCtx.fillStyle = brickColor;
      brickCtx.fillRect(x + offsetX, y, brickWidth, brickHeight);
    }
  }

  // Opcional: desenha borda para visualizar o bloco isolado (remova se quiser)
  // brickCtx.strokeStyle = 'lime';
  // brickCtx.strokeRect(0, 0, 16, 16);

  // Exibe só o bloco no documento para ver isolado:
  document.body.style.background = 'black';
  document.body.appendChild(brickCanvas);

  return ctx.createPattern(brickCanvas, 'repeat');
}

// ================= CLASSES PRINCIPAIS =================

// Classe Tank: representa um tanque controlado por um jogador
class Tank {
  constructor(x, y, color = '#1cc', direction = 'up') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.direction = direction; // 'up', 'down', 'left', 'right'
    this.size = 40; // Tamanho do tanque (área quadrada)
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    // Centro
    ctx.fillRect(this.x + 10, this.y + 10, 20, 20);
    // Cima
    ctx.fillRect(this.x + 10, this.y, 20, 10);
    // Baixo
    ctx.fillRect(this.x + 10, this.y + 30, 20, 10);
    // Esquerda
    ctx.fillRect(this.x, this.y + 10, 10, 20);
    // Direita
    ctx.fillRect(this.x + 30, this.y + 10, 10, 20);
  }
}

// Classe Bullet: representa um projétil disparado por um tanque
class Bullet {
  constructor(x, y, direction, speed = 5) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = speed;
    this.size = 6;
    this.active = true;
  }

  draw(ctx) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// Classe Map: representa o campo de batalha, blocos destrutíveis e indestrutíveis
class Map {
  constructor() {
    // 0 = vazio, 1 = indestrutível, 2 = destrutível
    this.tileSize = 16;
    this.cols = Math.floor(WIDTH / this.tileSize);
    this.rows = Math.floor(HEIGHT / this.tileSize);
    // Layout simples: borda indestrutível e alguns blocos destrutíveis
    this.grid = Array.from({ length: this.rows }, (_, y) =>
      Array.from({ length: this.cols }, (_, x) =>
        (x === 0 || x === this.cols - 1 || y === 0 || y === this.rows - 1) ? 1 : (Math.random() < 0.1 ? 2 : 0)
      )
    );
  }

  draw(ctx) {
    if (!brickPattern) brickPattern = createTankBattalionBrickPattern(ctx);
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === 1) {
          ctx.fillStyle = brickPattern;
          ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        } else if (this.grid[y][x] === 2) {
          ctx.fillStyle = '#c96'; // destrutível
          ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
      }
    }
  }

  // Verifica se há colisão de uma bala com algum bloco
  checkBulletCollision(bullet) {
    const tx = Math.floor((bullet.x + bullet.size / 2) / this.tileSize);
    const ty = Math.floor((bullet.y + bullet.size / 2) / this.tileSize);
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return false;
    const block = this.grid[ty][tx];
    if (block === 1) {
      // Bloco indestrutível: bala desaparece
      return 'indestrutivel';
    } else if (block === 2) {
      // Bloco destrutível: destrói bloco e bala
      this.grid[ty][tx] = 0;
      return 'destrutivel';
    }
    return false;
  }
}

// Classe Player: representa um jogador
class Player {
  constructor(id, tank) {
    this.id = id;
    this.tank = tank;
    // Futuramente: score, status, etc.
  }
}

// Classe GameManager: gerencia o estado do jogo
class GameManager {
  constructor() {
    this.players = [];
    this.bullets = [];
    this.map = new Map();
  }

  draw(ctx) {
    this.map.draw(ctx);
    this.players.forEach(p => p.tank.draw(ctx));
    this.bullets.forEach(b => b.draw(ctx));
  }
}

// ================= FUNÇÕES DE DESENHO INICIAL =================

function drawPlayerLabels() {
  // Tamanho fixo da fonte
  const fontSize = 16;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  
  // Posição Y fixa
  const labelY = 25;
  
  // Encontra o jogador local
  const localPlayer = gameState.players.find(p => p.id === clientId);
  if (localPlayer) {
    const hearts = '❤️'.repeat(localPlayer.lives);
    ctx.fillText(`Player 1 ${hearts}`, 10, labelY);
  }
  
  ctx.textAlign = 'right';
  // Encontra outros jogadores
  const otherPlayers = gameState.players.filter(p => p.id !== clientId);
  if (otherPlayers.length > 0) {
    const otherPlayer = otherPlayers[0];
    const hearts = '❤️'.repeat(otherPlayer.lives);
    ctx.fillText(`Player 2 ${hearts}`, WIDTH - 10, labelY);
  }
}

// Função para desenhar explosão
function drawExplosion(ctx, x, y, frame) {
  ctx.save();
  ctx.translate(x, y);
  
  // Cores da explosão
  const colors = ['#ff0000', '#ff6600', '#ffff00', '#ffffff'];
  const color = colors[Math.floor(frame / 2) % colors.length];
  
  // Tamanho da explosão baseado no frame
  const size = 20 + frame * 3;
  const alpha = 1 - (frame / 8);
  
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  
  // Desenha círculos concêntricos para efeito de explosão
  for (let i = 0; i < 3; i++) {
    const circleSize = size - i * 5;
    ctx.beginPath();
    ctx.arc(0, 0, circleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

// ================= EXEMPLO DE USO DAS CLASSES =================
// (Remover instâncias e loop single player)
// const tank1 = new Tank(80, 80, '#1cc');
// const tank2 = new Tank(270, 180, '#1cc');
// const tank3 = new Tank(470, 80, '#1cc');
// let bullets = [];
// const BULLET_SPEED = 6;
// function shootBullet(tank) { /* ... */ }
// window.addEventListener('keydown', (e) => { /* ... */ });
// function updateBullets() { /* ... */ }
// function draw() { /* ... */ }
// function gameLoop() { /* ... */ }
// gameLoop();
// ================= FIM DO SINGLE PLAYER =================

// ================= MOVIMENTAÇÃO DO TANQUE =================

// Velocidade de movimento dos tanques
const TANK_SPEED = 3;

// Função utilitária para checar colisão do tanque com blocos do mapa
function canMoveTo(x, y, map, size = 40) {
  // Margem de segurança para evitar grudar nos muros
  const margin = 2;
  const adjustedSize = size - margin;
  
  // Verifica os 4 cantos do tanque com margem
  const checks = [
    [x + margin, y + margin],
    [x + adjustedSize, y + margin],
    [x + margin, y + adjustedSize],
    [x + adjustedSize, y + adjustedSize],
  ];
  
  for (const [cx, cy] of checks) {
    const tx = Math.floor(cx / 20);
    const ty = Math.floor(cy / 20);
    if (tx < 0 || tx >= map[0].length || ty < 0 || ty >= map.length) {
      return false; // Fora dos limites do mapa
    }
    if (map[ty] && (map[ty][tx] === 1 || map[ty][tx] === 2)) {
      return false; // Colisão com muro
    }
  }
  return true;
}

// ================= CONTROLES DO JOGADOR =================

let canShoot = true;

window.addEventListener('keydown', (e) => {
  if (!gameState || !clientId) return;
  const player = gameState.players.find(p => p.id === clientId);
  if (!player) return;
  let moved = false;
  let { x, y, direction } = player;
  let nx = x, ny = y, ndir = direction;
  switch (e.key.toLowerCase()) {
    case 'w': ny -= TANK_SPEED; ndir = 'up'; moved = true; break;
    case 's': ny += TANK_SPEED; ndir = 'down'; moved = true; break;
    case 'a': nx -= TANK_SPEED; ndir = 'left'; moved = true; break;
    case 'd': nx += TANK_SPEED; ndir = 'right'; moved = true; break;
  }
  if (moved) {
    // Só move se não colidir com bloco
    if (canMoveTo(nx, ny, gameState.map)) {
      sendMove(nx, ny, ndir);
    } else {
      sendMove(x, y, ndir); // Atualiza direção mesmo sem mover
    }
  }
  if (e.code === 'Space' && canShoot) {
    const myBullets = gameState.bullets.filter(b => b.owner === clientId);
    if (myBullets.length === 0) {
      let bx = player.x + 20 - 3;
      let by = player.y + 20 - 3;
      switch (player.direction) {
        case 'up': by = player.y; break;
        case 'down': by = player.y + 40 - 6; break;
        case 'left': bx = player.x; break;
        case 'right': bx = player.x + 40 - 6; break;
      }
      sendShoot(bx, by, player.direction);
      canShoot = false;
      setTimeout(() => { canShoot = true; }, 100);
    }
  }
});

// ================= RENDERIZAÇÃO MULTIPLAYER =================

function getTankAngle(direction) {
  switch (direction) {
    case 'up': return 0;
    case 'right': return Math.PI / 2;
    case 'down': return Math.PI;
    case 'left': return -Math.PI / 2;
    default: return 0;
  }
}

function drawMultiplayer() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (!gameState) return;
  
  // Inicializa o padrão de tijolos se ainda não foi criado
  if (!brickPattern) brickPattern = createTankBattalionBrickPattern(ctx);
  
  // Desenha o mapa
  for (let y = 0; y < gameState.map.length; y++) {
    for (let x = 0; x < gameState.map[0].length; x++) {
      if (gameState.map[y][x] === 1) {
        // Bordas indestrutíveis - cor sólida cinza
        ctx.fillStyle = '#888';
        ctx.fillRect(x * 20, y * 20, 20, 20);
      } else if (gameState.map[y][x] === 2) {
        // Blocos de obstáculos destrutíveis - padrão de tijolos
        ctx.fillStyle = brickPattern;
        ctx.fillRect(x * 20, y * 20, 20, 20);
      }
    }
  }
  
  // Desenha tanques vivos com sprite retrô
  gameState.players.forEach(tank => {
    if (tank.alive) {
      ctx.save();
      ctx.globalAlpha = (tank.id === clientId) ? 1 : 0.85;
      drawRetroTank(ctx, tank.x + 20, tank.y + 20, getTankAngle(tank.direction));
      ctx.restore();
    }
  });
  
  // Desenha balas
  gameState.bullets.forEach(bullet => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
  });
  
  // Desenha explosões
  if (gameState.explosions) {
    gameState.explosions.forEach(explosion => {
      drawExplosion(ctx, explosion.x, explosion.y, explosion.frame);
    });
  }
  
  // Desenha labels
  drawPlayerLabels();
}

function gameLoopMultiplayer() {
  updateMobileMovement();
  drawMultiplayer();
  requestAnimationFrame(gameLoopMultiplayer);
}

// ================= MULTIPLAYER SOCKET.IO =================

const socket = io();

// Recebe o id do cliente e o mapa inicial
socket.on('init', (data) => {
  clientId = data.id;
  // O mapa inicial pode ser usado para sincronizar o layout
});

// Recebe o estado do jogo do servidor
socket.on('gameState', (state) => {
  gameState = state;
});

// Recebe mensagem de sala cheia
socket.on('roomFull', (data) => {
  alert('Sala cheia! Máximo 2 jogadores permitidos.');
  console.log('Sala cheia:', data.message);
});

// Envia movimento para o servidor
function sendMove(x, y, direction) {
  socket.emit('move', { x, y, direction });
}

// Envia tiro para o servidor
function sendShoot(x, y, direction) {
  socket.emit('shoot', { x, y, direction });
}

// Função para desenhar o tanque retrô estilo Tank Battalion
function drawRetroTank(ctx, cx, cy, angle = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Cores
  const baseColor = "#006666";
  const towerColor = "#008080";
  const trackColor = "#003333";
  const barrelColor = "#444";

  // Lagartas (tracks) - esquerda e direita (4x28)
  ctx.fillStyle = trackColor;
  ctx.fillRect(-10, -14, 4, 28);   // Esquerda
  ctx.fillRect(6, -14, 4, 28);     // Direita

  // Base do tanque (20x28), centralizada
  ctx.fillStyle = baseColor;
  ctx.fillRect(-10, -14, 20, 28);

  // Torre (10x10), centralizada no topo da base
  ctx.fillStyle = towerColor;
  ctx.fillRect(-5, -14, 10, 10);

  // Cano (3x14), saindo do topo da torre
  ctx.fillStyle = barrelColor;
  ctx.fillRect(-1.5, -24, 3, 14);

  ctx.restore();
}

// Controles móveis
let isMobile = false;
let mobileControls = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
  shootPressed: false
};

// Detecta se é dispositivo móvel
function detectMobile() {
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             window.innerWidth <= 768;
  
  if (isMobile) {
    resizeForMobile();
    createMobileControls();
  }
}

// Redimensiona o jogo para mobile
function resizeForMobile() {
  // Mantém o tamanho original do desktop (900x600)
  canvas.width = 900;
  canvas.height = 600;
  
  // Apenas ajusta o CSS para ocupar a tela em modo retrato
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '1';
  canvas.style.objectFit = 'contain';
  
  // Atualiza as dimensões globais (mantém original)
  WIDTH = 900;
  HEIGHT = 600;
  
  // Ajusta o fundo do body
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.backgroundColor = '#000';
  
  console.log('Canvas configurado para mobile - tamanho original mantido');
}

// Cria os controles móveis
function createMobileControls() {
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'mobile-controls';
  
  // Calcula tamanhos baseados na tela
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const buttonSize = Math.min(screenWidth, screenHeight) * 0.12; // 12% da menor dimensão
  const directionSize = buttonSize * 3 + 10; // 3 botões + gap
  const shootSize = buttonSize * 1.6; // Botão de tiro um pouco maior
  
  controlsContainer.style.cssText = `
    position: fixed;
    bottom: ${buttonSize * 0.5}px;
    left: ${buttonSize * 0.5}px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: ${buttonSize * 0.2}px;
  `;

  // Botões de direção
  const directionControls = document.createElement('div');
  directionControls.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    gap: ${buttonSize * 0.1}px;
    width: ${directionSize}px;
    height: ${directionSize}px;
  `;

  // Botão cima
  const upBtn = createControlButton('▲', 'up', buttonSize);
  upBtn.style.gridColumn = '2';
  upBtn.style.gridRow = '1';

  // Botão baixo
  const downBtn = createControlButton('▼', 'down', buttonSize);
  downBtn.style.gridColumn = '2';
  downBtn.style.gridRow = '3';

  // Botão esquerda
  const leftBtn = createControlButton('◀', 'left', buttonSize);
  leftBtn.style.gridColumn = '1';
  leftBtn.style.gridRow = '2';

  // Botão direita
  const rightBtn = createControlButton('▶', 'right', buttonSize);
  rightBtn.style.gridColumn = '3';
  rightBtn.style.gridRow = '2';

  directionControls.appendChild(upBtn);
  directionControls.appendChild(downBtn);
  directionControls.appendChild(leftBtn);
  directionControls.appendChild(rightBtn);

  // Botão de tiro
  const shootBtn = createControlButton('💥', 'shoot', shootSize);
  shootBtn.style.cssText = `
    position: fixed;
    bottom: ${buttonSize * 0.5}px;
    right: ${buttonSize * 0.5}px;
    width: ${shootSize}px;
    height: ${shootSize}px;
    background: linear-gradient(145deg, #ff4444, #cc0000);
    border: ${buttonSize * 0.06}px solid #880000;
    border-radius: 50%;
    color: white;
    font-size: ${buttonSize * 0.4}px;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
    touch-action: manipulation;
    box-shadow: 0 ${buttonSize * 0.08}px ${buttonSize * 0.16}px rgba(0,0,0,0.3);
    transition: all 0.1s ease;
    z-index: 1000;
  `;

  controlsContainer.appendChild(directionControls);
  document.body.appendChild(controlsContainer);
  document.body.appendChild(shootBtn);
}

// Cria um botão de controle
function createControlButton(text, action, size) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    background: linear-gradient(145deg, #4a90e2, #357abd);
    border: ${size * 0.06}px solid #2c5aa0;
    border-radius: ${size * 0.2}px;
    color: white;
    font-size: ${size * 0.36}px;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
    touch-action: manipulation;
    box-shadow: 0 ${size * 0.08}px ${size * 0.16}px rgba(0,0,0,0.3);
    transition: all 0.1s ease;
  `;

  // Eventos para desktop
  button.addEventListener('mousedown', () => {
    mobileControls[action] = true;
    button.style.transform = 'scale(0.95)';
    button.style.background = 'linear-gradient(145deg, #357abd, #2c5aa0)';
  });

  button.addEventListener('mouseup', () => {
    mobileControls[action] = false;
    button.style.transform = 'scale(1)';
    button.style.background = 'linear-gradient(145deg, #4a90e2, #357abd)';
  });

  button.addEventListener('mouseleave', () => {
    mobileControls[action] = false;
    button.style.transform = 'scale(1)';
    button.style.background = 'linear-gradient(145deg, #4a90e2, #357abd)';
  });

  // Eventos para mobile
  button.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mobileControls[action] = true;
    button.style.transform = 'scale(0.95)';
    button.style.background = 'linear-gradient(145deg, #357abd, #2c5aa0)';
  });

  button.addEventListener('touchend', (e) => {
    e.preventDefault();
    mobileControls[action] = false;
    button.style.transform = 'scale(1)';
    button.style.background = 'linear-gradient(145deg, #4a90e2, #357abd)';
  });

  return button;
}

// Atualiza o movimento baseado nos controles móveis
function updateMobileMovement() {
  if (!isMobile || !gameState || !clientId) return;
  
  const localPlayer = gameState.players.find(p => p.id === clientId);
  if (!localPlayer || !localPlayer.alive) return;
  
  // Velocidade fixa (mesma do desktop)
  const speed = 5;
  
  let newX = localPlayer.x;
  let newY = localPlayer.y;
  let direction = localPlayer.direction;

  if (mobileControls.up) {
    newY -= speed;
    direction = 'up';
  }
  if (mobileControls.down) {
    newY += speed;
    direction = 'down';
  }
  if (mobileControls.left) {
    newX -= speed;
    direction = 'left';
  }
  if (mobileControls.right) {
    newX += speed;
    direction = 'right';
  }

  // Verifica colisão com paredes
  if (!checkWallCollision(newX, newY)) {
    localPlayer.x = newX;
    localPlayer.y = newY;
    localPlayer.direction = direction;
    socket.emit('move', localPlayer);
  }

  // Tiro móvel
  if (mobileControls.shoot && !mobileControls.shootPressed) {
    mobileControls.shootPressed = true;
    shoot();
  } else if (!mobileControls.shoot) {
    mobileControls.shootPressed = false;
  }
}

// Inicialização
window.addEventListener('load', () => {
  detectMobile();
  gameLoopMultiplayer(); // Inicia o loop do jogo
});

// Listener para redimensionamento da janela
window.addEventListener('resize', () => {
  const wasMobile = isMobile;
  detectMobile();
  
  // Se mudou de desktop para mobile ou vice-versa, recria os controles
  if (wasMobile !== isMobile) {
    // Remove controles existentes
    const existingControls = document.getElementById('mobile-controls');
    if (existingControls) {
      existingControls.remove();
    }
    const existingShootBtn = document.querySelector('button[data-action="shoot"]');
    if (existingShootBtn) {
      existingShootBtn.remove();
    }
    
    // Recria controles se necessário
    if (isMobile) {
      createMobileControls();
    }
  }
});

// Loop principal do jogo
function gameLoop() {
  updateMobileMovement();
  drawMultiplayer();
  requestAnimationFrame(gameLoop);
}

// Função para atirar (usada pelos controles móveis)
function shoot() {
  if (!gameState || !clientId) return;
  
  const localPlayer = gameState.players.find(p => p.id === clientId);
  if (!localPlayer || !localPlayer.alive) return;
  
  // Calcula a posição da bala baseada na direção do tanque
  let bulletX = localPlayer.x + 20;
  let bulletY = localPlayer.y + 20;
  
  switch (localPlayer.direction) {
    case 'up':
      bulletY = localPlayer.y;
      break;
    case 'down':
      bulletY = localPlayer.y + 40;
      break;
    case 'left':
      bulletX = localPlayer.x;
      break;
    case 'right':
      bulletX = localPlayer.x + 40;
      break;
  }
  
  socket.emit('shoot', {
    x: bulletX,
    y: bulletY,
    direction: localPlayer.direction
  });
}

// Função para verificar colisão com paredes
function checkWallCollision(x, y) {
  if (!gameState || !gameState.map) return false;
  
  const tileSize = 20;
  const tankSize = 40;
  
  // Verifica os 4 cantos do tanque
  const corners = [
    { x: x, y: y }, // Canto superior esquerdo
    { x: x + tankSize, y: y }, // Canto superior direito
    { x: x, y: y + tankSize }, // Canto inferior esquerdo
    { x: x + tankSize, y: y + tankSize } // Canto inferior direito
  ];
  
  for (let corner of corners) {
    const mapX = Math.floor(corner.x / tileSize);
    const mapY = Math.floor(corner.y / tileSize);
    
    // Verifica se está dentro dos limites do mapa
    if (mapY >= 0 && mapY < gameState.map.length && 
        mapX >= 0 && mapX < gameState.map[0].length) {
      const tile = gameState.map[mapY][mapX];
      if (tile === 1 || tile === 2) {
        return true; // Há colisão
      }
    }
  }
  
  return false; // Não há colisão
}
