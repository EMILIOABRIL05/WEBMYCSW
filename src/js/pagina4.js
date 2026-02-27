// Space Invaders - JavaScript Game Logic
// Author: Luis Miranda

const gCanvas = document.getElementById('game-canvas');
const ctx = gCanvas.getContext('2d');
let W = 1100, H = 640;

let bgOffset = 0;

function drawBackground(dt) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(5,15,5,0.8)');
    grad.addColorStop(0.5, 'rgba(3,8,3,0.6)');
    grad.addColorStop(1, 'rgba(5,12,5,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    bgOffset = (bgOffset + dt * 20) % (H + 150);
    ctx.font = 'bold 14px monospace';
    const chars = '01*#';
    for (let i = 0; i < 140; i++) {
        const x = i * 8 + 2;
        const y = bgOffset + (Math.sin(i) * 30 - 100);
        const char = chars[Math.floor(Math.random() * 4)];
        const opac = Math.sin((bgOffset + i * 50) * 0.008) * 0.08 + 0.18;
        ctx.fillStyle = `rgba(68,214,44,${opac})`;
        ctx.fillText(char, x, y);
    }

    ctx.fillStyle = 'rgba(68,214,44,0.03)';
    for (let y = (bgOffset * 0.4) % 40; y < H; y += 40) {
        ctx.fillRect(0, y, W, 2);
    }
}

const player = { w: 56, h: 14, x: W / 2 - 28, y: H - 70, speed: 320 };
let bullets = [], aliens = [], alienBullets = [];
let score = 0, lives = 3, running = false, paused = false, lastTs = null;

const DIFF = {
    easy: { rows: 3, cols: 6, aspd: 12, lives: 5, mint: 0.5 },
    medium: { rows: 4, cols: 8, aspd: 20, lives: 3, mint: 0.35 },
    hard: { rows: 5, cols: 9, aspd: 30, lives: 2, mint: 0.28 },
    impossible: { rows: 6, cols: 10, aspd: 50, lives: 1, mint: 0.22 }
};
let curDiff = 'medium', alienDir = 1, alienSpd = 20, alienTime = 0, alienInt = 0.35;

function spawn(r = 4, c = 8) {
    aliens = [];
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++)
            aliens.push({ x: 80 + j * 74, y: 60 + i * 40, w: 56, h: 14, on: true });
}

function reset() {
    const d = DIFF[curDiff] || DIFF.medium;
    score = 0;
    bgOffset = 0;
    bullets = [];
    alienBullets = [];
    player.x = W / 2 - 28;
    spawn(d.rows, d.cols);
    alienDir = 1;
    alienSpd = d.aspd;
    alienTime = 0;
    alienInt = d.mint;
    lives = d.lives;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    ctx.clearRect(0, 0, W, H);
}

function fire() {
    if (running && !paused) bullets.push({ x: player.x + 27, y: player.y - 10, w: 4, h: 10, vy: -520 });
}

function alienF() {
    if (!running || paused) return;
    const a = aliens.filter(x => x.on);
    if (!a.length) return;
    const e = a[Math.random() * a.length | 0];
    alienBullets.push({ x: e.x + 27, y: e.y + 20, vy: 140, w: 4, h: 10 });
}

function overlap(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

function update(dt) {
    bullets.forEach(b => b.y += b.vy * dt);
    bullets = bullets.filter(b => b.y > -10);

    alienTime += dt;
    if (alienTime >= alienInt) {
        let rev = false;
        aliens.forEach(a => {
            if (a.on) a.x += alienDir * 18;
            if (a.x <= 8 || a.x + a.w >= W - 8) rev = true;
        });
        if (rev) {
            alienDir *= -1;
            aliens.forEach(a => { if (a.on) a.y += 20; });
        }
        alienTime = 0;
        if (Math.random() < 0.28) alienF();
    }

    alienBullets.forEach(b => b.y += b.vy * dt);
    alienBullets = alienBullets.filter(b => b.y < H + 20);

    bullets.forEach(b => {
        aliens.forEach(a => {
            if (a.on && overlap(b, a)) {
                a.on = false;
                b.y = -9999;
                score += 12;
                document.getElementById('score').textContent = score;
            }
        });
    });

    alienBullets.forEach(b => {
        if (overlap(b, player)) {
            b.y = H + 999;
            lives--;
            document.getElementById('lives').textContent = lives;
            if (lives <= 0) gameEnd(false);
        }
    });

    aliens.forEach(a => { if (a.on && a.y + 14 >= player.y) gameEnd(false); });
    if (aliens.every(a => !a.on)) gameEnd(true);
}

function drawPlayerSprite(obj) {
    const pattern = [
        '  XX  ',
        ' XXXX ',
        ' XXXXXX',
        'XXXXXXX',
        ' XX XX ',
        '  XX  '
    ];
    const cols = pattern[0].length;
    const rows = pattern.length;
    const sizeX = obj.w / cols;
    const sizeY = obj.h / rows;
    ctx.fillStyle = '#55ff55';
    pattern.forEach((row, ry) => {
        for (let cx = 0; cx < row.length; cx++) {
            if (row[cx] === 'X') ctx.fillRect(obj.x + cx * sizeX, obj.y + ry * sizeY, sizeX, sizeY);
        }
    });
}

function drawAlienSprite(obj) {
    const pattern = [
        '  XX  ',
        ' XXXX ',
        'X XX X',
        'XXXXXX',
        ' XX XX'
    ];
    const cols = pattern[0].length;
    const rows = pattern.length;
    const sizeX = obj.w / cols;
    const sizeY = obj.h / rows;
    ctx.fillStyle = '#00ffdd';
    pattern.forEach((row, ry) => {
        for (let cx = 0; cx < row.length; cx++) {
            if (row[cx] === 'X') ctx.fillRect(obj.x + cx * sizeX, obj.y + ry * sizeY, sizeX, sizeY);
        }
    });
}

function draw(dt) {
    drawBackground(dt * 1000);

    drawPlayerSprite(player);

    const t = Date.now();
    aliens.forEach(a => {
        if (!a.on) return;
        drawAlienSprite(a);
        const blink = Math.abs(Math.sin(t * 0.005)) > 0.3;
        if (blink) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(a.x + a.w * 0.25, a.y + a.h * 0.1, a.w * 0.1, a.h * 0.2);
            ctx.fillRect(a.x + a.w * 0.65, a.y + a.h * 0.1, a.w * 0.1, a.h * 0.2);
        }
        const p = Math.sin(t * 0.004) * 0.3 + 0.4;
        ctx.shadowColor = `rgba(0,255,221,${p})`;
        ctx.shadowBlur = 10;
    });
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#88ff88';
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(136,255,136,0.5)';
        ctx.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
        ctx.fillStyle = '#88ff88';
    });

    ctx.fillStyle = '#ff5555';
    alienBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(255,85,85,0.5)';
        ctx.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
        ctx.fillStyle = '#ff5555';
    });
}

function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;
    ctx.clearRect(0, 0, W, H);
    if (running && !paused) update(dt);
    draw(dt);
    requestAnimationFrame(loop);
}

function gameEnd(w) {
    running = false;
    paused = false;
    const o = document.getElementById('ui-overlay');
    o.style.display = 'flex';
    o.classList.add('visible');
    document.getElementById('modal-title').textContent = w ? 'VICTORIA' : 'GAME OVER';
    document.getElementById('modal-msg').innerHTML = 'Puntuacion: ' + score;
    document.getElementById('final-score').textContent = score;
}

function init() {
    const keys = {};
    const startScreen = document.getElementById('start-screen');

    function begin() {
        if (startScreen) startScreen.style.display = 'none';
        document.getElementById('ui-overlay').style.display = 'none';
        document.getElementById('ui-overlay').classList.remove('visible');
        reset();
        running = true;
        lastTs = null;
    }

    document.addEventListener('keydown', e => {
        if (e.repeat) return;
        keys[e.code] = true;
        if (e.code === 'Space') { e.preventDefault(); fire(); }
        if (e.code === 'KeyP') paused = !paused;
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    setInterval(() => {
        if (!running || paused) return;
        const m = player.speed / 60;
        if (keys['ArrowLeft'] || keys['KeyA']) player.x = Math.max(8, player.x - m);
        if (keys['ArrowRight'] || keys['KeyD']) player.x = Math.min(W - 64, player.x + m);
    }, 16);

    document.getElementById('btn-start').onclick = begin;
    document.getElementById('btn-pause').onclick = () => {
        paused = !paused;
        document.getElementById('btn-pause').textContent = paused ? 'Reanudar' : 'Pausar';
    };
    document.getElementById('btn-restart').onclick = begin;
    document.getElementById('modal-restart').onclick = begin;
    if (startScreen) startScreen.addEventListener('click', begin);

    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.onclick = () => {
            curDiff = btn.dataset.diff;
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            begin();
        };
    });

    const tL = document.getElementById('touch-left');
    const tR = document.getElementById('touch-right');
    const tF = document.getElementById('touch-fire');
    if (tL) {
        tL.ontouchstart = (e) => { e.preventDefault(); keys['tL'] = true; };
        tL.ontouchend = () => { keys['tL'] = false; };
    }
    if (tR) {
        tR.ontouchstart = (e) => { e.preventDefault(); keys['tR'] = true; };
        tR.ontouchend = () => { keys['tR'] = false; };
    }
    if (tF) { tF.ontouchstart = (e) => { e.preventDefault(); fire(); }; }

    setInterval(() => {
        if (keys['tL']) player.x = Math.max(8, player.x - 8);
        if (keys['tR']) player.x = Math.min(W - 64, player.x + 8);
    }, 16);

    reset();
    requestAnimationFrame(loop);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
