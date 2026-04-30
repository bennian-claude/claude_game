import fs from 'node:fs';

const files = [
  'index.html',
  'games/balloon-shooter/index.html',
  'games/rhythm-game/index.html',
  'games/zombie-hunter/index.html',
  'games/cyber-tetris/index.html',
  'games/lcd-retro/index.html',
];

const failures = [];

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];

  scripts.forEach((match, index) => {
    try {
      new Function(match[1]);
    } catch (error) {
      failures.push(`${file}: inline script ${index + 1} has syntax error: ${error.message}`);
    }
  });
}

const rhythm = fs.readFileSync('games/rhythm-game/index.html', 'utf8');
if (!rhythm.includes('id="btnGoHome" onclick="goHome()"')) {
  failures.push('Rhythm result screen must keep a direct home button.');
}
if (!rhythm.includes('id="btnGoMenu" onclick="goToMenu(false)"')) {
  failures.push('Rhythm cursed menu behavior must target the song menu button, not the home button.');
}

const cyber = fs.readFileSync('games/cyber-tetris/index.html', 'utf8');
if (!/player\.shields--[\s\S]*updateScore\(\);[\s\S]*if \(collide\(arena, player\)\)/.test(cyber)) {
  failures.push('Cyber Tetris shield recovery must re-check spawn collision after clearing rows.');
}
if (!cyber.includes('body:not(.controls-active) #controls') || !cyber.includes('syncInteractionLayers()')) {
  failures.push('Cyber Tetris mobile controls must not intercept menu or overlay options outside active play.');
}
if (!/body\.game-over #leaderboard-panel[\s\S]*position: fixed/.test(cyber)) {
  failures.push('Cyber Tetris mobile game-over leaderboard must remain reachable above the controls.');
}

const balloon = fs.readFileSync('games/balloon-shooter/index.html', 'utf8');
if (!/\.overlay[\s\S]*overflow-y: auto[\s\S]*touch-action: pan-y/.test(balloon)) {
  failures.push('Balloon Shooter mobile overlays must be scrollable so all options can be tapped.');
}

const zombie = fs.readFileSync('games/zombie-hunter/index.html', 'utf8');
if (!/#lbBox[\s\S]*overflow-y: auto[\s\S]*touch-action: pan-y/.test(zombie)) {
  failures.push('Zombie Hunter leaderboard panel must be scrollable on mobile.');
}

const lcd = fs.readFileSync('games/lcd-retro/index.html', 'utf8');
if (!lcd.includes('id="homeButton"') || !lcd.includes('id="leaderboardSection"')) {
  failures.push('LCD Retro must include home navigation and leaderboard UI.');
}
const lcdMain = fs.readFileSync('games/lcd-retro/src/main.js', 'utf8');
if (!lcdMain.includes("../../index.html?skipIntro=1")) {
  failures.push('LCD Retro home navigation should return to the hub without replaying the intro.');
}

for (const file of files.filter(file => file.startsWith('games/'))) {
  const html = fs.readFileSync(file, 'utf8');
  if (file !== 'games/lcd-retro/index.html' && !html.includes("../../index.html?skipIntro=1")) {
    failures.push(`${file}: home navigation should return to the hub without replaying the intro.`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('bug-hunter checks passed');
