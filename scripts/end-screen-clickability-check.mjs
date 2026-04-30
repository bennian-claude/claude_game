import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/Users/ben/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}

const baseUrl = process.env.CLAUDE_GAME_BASE_URL || 'http://localhost:4173';
const mobileViewport = { width: 390, height: 844, isMobile: true, hasTouch: true };

const cases = [
  {
    name: 'Cyber Tetris game over',
    path: '/games/cyber-tetris/index.html',
    selector: '#overlay-screen button, #sidebar > div:nth-child(2) > button, #leaderboard-panel button, #leaderboard-panel input',
    setup: () => {
      window.gameState = 'GAMEOVER';
      window.showOverlay?.('SYSTEM FAILURE', '最終分數: 9999');
      window.onCyberTetrisEnd?.(9999, 12, 3);
    },
  },
  {
    name: 'Balloon Shooter end screen',
    path: '/games/balloon-shooter/index.html',
    selector: '#endScreen button, #endScreen input',
    setup: () => {
      document.getElementById('introScreen')?.classList.add('hidden');
      document.getElementById('clickToStart')?.classList.add('hidden');
      document.getElementById('skipBtn').style.display = 'none';
      document.getElementById('startScreen')?.classList.add('hidden');
      document.getElementById('endScreen')?.classList.remove('hidden');
      window.onGameEnd?.(123);
    },
  },
  {
    name: 'Rhythm result screen',
    path: '/games/rhythm-game/index.html',
    selector: '#resultScreen button, #resultScreen input',
    setup: () => {
      document.getElementById('introScreen').style.display = 'none';
      document.getElementById('startScreen').style.display = 'none';
      document.getElementById('resultScreen').style.display = 'flex';
      document.getElementById('resultDetails').innerHTML = '<div style="width:280px;padding:20px">測試結果</div>';
      window.onRhythmGameEnd?.(98765, 'NORMAL', 42, '99.00%', 'TEST');
    },
  },
  {
    name: 'Zombie Hunter lose screen',
    path: '/games/zombie-hunter/index.html',
    selector: '#endActions button',
    setup: () => {
      window.state = 'lose';
      document.getElementById('endActions').style.display = 'flex';
      document.getElementById('lbBox').style.display = 'none';
    },
  },
  {
    name: 'Zombie Hunter win leaderboard',
    path: '/games/zombie-hunter/index.html',
    selector: '#lbBox button, #lbBox input',
    setup: () => {
      window.state = 'win';
      window.onZombieHunterEnd?.(1500, 15, 2, 30);
    },
  },
  {
    name: 'LCD Retro game over',
    path: '/games/lcd-retro/index.html',
    selector: '#endScreen button, #endScreen input',
    setup: () => {
      document.getElementById('endScreen')?.classList.remove('hidden');
    },
  },
];

function prettyTarget(node) {
  if (!node) return 'none';
  const id = node.id ? `#${node.id}` : '';
  const cls = node.className && typeof node.className === 'string'
    ? `.${node.className.trim().split(/\s+/).filter(Boolean).join('.')}`
    : '';
  return `${node.tagName.toLowerCase()}${id}${cls}`;
}

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
});
const page = await browser.newPage({ viewport: mobileViewport });
const failures = [];

for (const testCase of cases) {
  await page.goto(`${baseUrl}${testCase.path}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(testCase.setup);

  const results = await page.$$eval(testCase.selector, elements => {
    return elements
      .filter(el => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' &&
          style.pointerEvents !== 'none' && rect.width > 0 && rect.height > 0;
      })
      .map(el => {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const top = document.elementFromPoint(x, y);
        const clickable = top === el || el.contains(top);
        return {
          label: (el.innerText || el.value || el.placeholder || el.id || el.tagName).trim(),
          target: {
            tagName: el.tagName,
            id: el.id,
            className: typeof el.className === 'string' ? el.className : '',
          },
          top: top ? {
            tagName: top.tagName,
            id: top.id,
            className: typeof top.className === 'string' ? top.className : '',
          } : null,
          clickable,
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      });
  });

  if (!results.length) {
    failures.push(`${testCase.name}: no visible end-screen options found`);
    continue;
  }

  for (const result of results) {
    if (!result.clickable) {
      failures.push(`${testCase.name}: "${result.label}" is covered by ${prettyTarget(result.top)}`);
    }
  }

  console.log(`${testCase.name}: ${results.length} visible options checked`);
}

await browser.close();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('end-screen clickability checks passed');
