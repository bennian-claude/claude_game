import { ACTORS, LANES, createInitialState, movePlayer, resetGame, shoot, tickGame } from './game.js';
import { drawGunfighter, getCharacterSpriteAsset, getEnemySpriteAsset } from './sprites.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const fileInput = document.querySelector('#backgroundFile');
const statusLine = document.querySelector('#statusLine');
const restartButton = document.querySelector('#restartButton');
const endRestartButton = document.querySelector('#endRestartButton');
const homeButton = document.querySelector('#homeButton');
const footerHomeButton = document.querySelector('#footerHomeButton');
const leftButton = document.querySelector('#leftButton');
const rightButton = document.querySelector('#rightButton');
const shootButton = document.querySelector('#shootButton');
const endScreen = document.querySelector('#endScreen');
const finalScore = document.querySelector('#finalScore');
const nameSection = document.querySelector('#nameInputSection');
const leaderboardSection = document.querySelector('#leaderboardSection');
const leaderboardList = document.querySelector('#leaderboardList');
const nameInput = document.querySelector('#playerNameInput');
const submitScoreBtn = document.querySelector('#submitScoreBtn');
const skipScoreBtn = document.querySelector('#skipScoreBtn');

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCFVDsAvTx10-eshL3RYiSzyYlPFEvqyz8',
  authDomain: 'claude-code-project-3a0d3.firebaseapp.com',
  projectId: 'claude-code-project-3a0d3',
  storageBucket: 'claude-code-project-3a0d3.firebasestorage.app',
  messagingSenderId: '451203824543',
  appId: '1:451203824543:web:fa2e9bb8c2c0f69c339baa'
};
const db = window.firebase ? getFirestore() : null;

const state = createInitialState();
const background = new Image();
const spriteImages = new Map();
let hasBackground = false;
let lastFrame = performance.now();
let endHandled = false;
let submitted = false;

background.onload = () => {
  hasBackground = true;
  statusLine.textContent = '背景已套用。方向鍵移動，空白鍵射擊。';
};
background.onerror = () => {
  hasBackground = false;
  statusLine.textContent = '把原圖放到 assets/restaurant.png，或用左側按鈕選圖。';
};
background.src = 'assets/restaurant.png';

loadSprite(getCharacterSpriteAsset());
for (const actor of ACTORS) {
  loadSprite(getEnemySpriteAsset(actor.label));
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  background.src = URL.createObjectURL(file);
});

restartButton.addEventListener('click', startGame);
endRestartButton.addEventListener('click', startGame);
homeButton.addEventListener('click', goHome);
footerHomeButton.addEventListener('click', goHome);
leftButton.addEventListener('click', () => movePlayer(state, 'left'));
rightButton.addEventListener('click', () => movePlayer(state, 'right'));
shootButton.addEventListener('click', () => shoot(state));
submitScoreBtn.addEventListener('click', submitScore);
skipScoreBtn.addEventListener('click', () => showLeaderboard(null));

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
    event.preventDefault();
    movePlayer(state, 'left');
  }
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
    event.preventDefault();
    movePlayer(state, 'right');
  }
  if (event.code === 'Space' || event.key === 'Enter') {
    event.preventDefault();
    shoot(state);
  }
  if (event.key.toLowerCase() === 'r') {
    startGame();
  }
});

requestAnimationFrame(loop);

function loop(now) {
  const delta = Math.min(48, now - lastFrame);
  lastFrame = now;
  tickGame(state, delta);
  if (state.gameOver && !endHandled) showEndScreen();
  render();
  requestAnimationFrame(loop);
}

function startGame() {
  resetGame(state);
  endHandled = false;
  submitted = false;
  endScreen.classList.add('hidden');
  nameSection.classList.remove('hidden');
  leaderboardSection.classList.add('hidden');
  submitScoreBtn.disabled = false;
  submitScoreBtn.textContent = '送出分數';
  nameInput.value = '';
  statusLine.textContent = '方向鍵/A/D 移動，空白鍵/Enter 射擊。';
}

function showEndScreen() {
  endHandled = true;
  finalScore.textContent = `SCORE ${String(state.score).padStart(4, '0')}`;
  endScreen.classList.remove('hidden');
}

function goHome() {
  window.location.href = '../../index.html?skipIntro=1';
}

function getFirestore() {
  if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
  return window.firebase.firestore();
}

async function submitScore() {
  if (submitted) return;
  const name = nameInput.value.trim() || '匿名';
  submitted = true;
  submitScoreBtn.disabled = true;
  submitScoreBtn.textContent = '送出中...';
  try {
    if (db) {
      await db.collection('lcd_retro').add({
        name,
        score: state.score,
        lives: state.lives,
        timestamp: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Failed to submit lcd_retro score', error);
  }
  await showLeaderboard(name);
}

async function showLeaderboard(myName) {
  nameSection.classList.add('hidden');
  leaderboardSection.classList.remove('hidden');
  leaderboardList.innerHTML = '<div class="lb-state">載入排行榜中...</div>';
  try {
    const rows = [];
    if (db) {
      const snap = await db.collection('lcd_retro').orderBy('score', 'desc').limit(10).get();
      snap.forEach(doc => rows.push(doc.data()));
    }
    if (!rows.length) {
      leaderboardList.innerHTML = '<div class="lb-state">還沒有紀錄，第一名等你來拿。</div>';
      return;
    }
    const medals = ['1', '2', '3'];
    leaderboardList.innerHTML = rows.map((row, index) => {
      const name = escapeHtml(row.name || '匿名玩家');
      const score = Number(row.score || 0).toLocaleString('zh-TW');
      const mine = myName && row.name === myName && row.score === state.score;
      return `<div class="lb-row${mine ? ' is-mine' : ''}">
        <span>${medals[index] || index + 1}</span>
        <span>${name}</span>
        <span class="lb-score">${score}</span>
      </div>`;
    }).join('');
  } catch (error) {
    leaderboardList.innerHTML = '<div class="lb-state">排行榜讀取失敗，請稍後再試。</div>';
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawActors();
  drawProjectiles();
  drawPlayer();
  drawHud();
  drawFlash();
  if (state.gameOver) drawGameOver();
}

function drawBackground() {
  if (hasBackground) {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(177, 199, 180, 0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  ctx.fillStyle = '#b9c8b7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#6e7d6c';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.beginPath();
  ctx.moveTo(0, 132);
  ctx.lineTo(canvas.width, 132);
  ctx.stroke();
  ctx.fillStyle = '#263229';
  ctx.font = '18px monospace';
  ctx.fillText('DROP IN RESTAURANT LCD PHOTO', 128, 174);
}

function drawActors() {
  ctx.save();
  ctx.strokeStyle = '#15231a';
  ctx.fillStyle = '#15231a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  ACTORS.forEach((actor) => {
    drawCharacter(getEnemySpriteAsset(actor.label), actor.x, actor.y, actor.facing, getEnemyScale(actor.label));
  });

  ctx.restore();
}

function drawProjectiles() {
  ctx.save();
  ctx.strokeStyle = '#111d16';
  ctx.fillStyle = '#111d16';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  for (const projectile of state.projectiles) {
    if (projectile.type === 'beer') {
      drawBeer(projectile.x, projectile.y);
    } else {
      drawThrownObject(projectile.x, projectile.y);
    }
  }

  ctx.restore();
}

function drawBeer(x, y) {
  ctx.beginPath();
  ctx.rect(x - 7, y - 10, 14, 18);
  ctx.moveTo(x + 7, y - 4);
  ctx.arc(x + 11, y - 2, 5, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 14);
  ctx.lineTo(x + 4, y - 14);
  ctx.stroke();
}

function drawThrownObject(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.moveTo(x - 12, y + 5);
  ctx.lineTo(x + 12, y - 5);
  ctx.stroke();
}

function drawPlayer() {
  const pos = LANES[state.playerLane];
  ctx.save();
  ctx.strokeStyle = '#111d16';
  ctx.fillStyle = '#111d16';
  ctx.lineWidth = 4.6;
  ctx.lineCap = 'round';
  drawCharacter(getCharacterSpriteAsset(), pos.x, pos.y, 1, 0.54);
  ctx.restore();
}

function loadSprite(src) {
  if (spriteImages.has(src)) return;
  const image = new Image();
  spriteImages.set(src, { image, loaded: false });
  image.onload = () => {
    spriteImages.set(src, { image, loaded: true });
  };
  image.onerror = () => {
    spriteImages.set(src, { image, loaded: false });
  };
  image.src = src;
}

function drawCharacter(src, x, y, facing, scale) {
  const sprite = spriteImages.get(src);
  if (!sprite?.loaded) {
    drawGunfighter(ctx, x, y, { facing, scale: scale * 1.25 });
    return;
  }

  const width = sprite.image.naturalWidth * scale;
  const height = sprite.image.naturalHeight * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.drawImage(sprite.image, -width / 2, -height + 8, width, height);
  ctx.restore();
}

function getEnemyScale(label) {
  const scales = {
    'table-left': 0.36,
    'table-right': 0.36,
    bar: 0.30
  };
  return scales[label] ?? 0.44;
}

function drawHud() {
  ctx.save();
  ctx.fillStyle = '#17251c';
  ctx.font = '20px monospace';
  ctx.fillText(`SCORE ${String(state.score).padStart(4, '0')}`, 24, 304);
  ctx.fillText(`LIFE ${state.lives}`, 438, 304);
  ctx.restore();
}

function drawFlash() {
  if (!state.flash) return;
  const pos = LANES[state.flash.lane];
  ctx.save();
  ctx.fillStyle = state.flash.kind === 'hurt' ? 'rgba(20, 30, 22, 0.22)' : 'rgba(20, 30, 22, 0.14)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111d16';
  ctx.font = '22px monospace';
  const text = state.flash.kind === 'hit' ? 'HIT' : state.flash.kind === 'hurt' ? 'OUCH' : state.flash.kind === 'patron' ? 'HEY!' : 'MISS';
  ctx.fillText(text, pos.x - 22, Math.max(44, pos.y - 96));
  ctx.restore();
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'rgba(185, 200, 183, 0.78)';
  ctx.fillRect(110, 120, 354, 92);
  ctx.strokeStyle = '#142219';
  ctx.lineWidth = 3;
  ctx.strokeRect(110, 120, 354, 92);
  ctx.fillStyle = '#142219';
  ctx.font = '28px monospace';
  ctx.fillText('GAME OVER', 210, 158);
  ctx.font = '16px monospace';
  ctx.fillText('Press R or restart', 214, 188);
  ctx.restore();
}
