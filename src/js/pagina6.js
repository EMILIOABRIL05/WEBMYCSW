// ======================================
// TERMINAL HACKER - VERSIÓN DEFINITIVA
// ======================================

let secretCode = [];
let attempts = 8;
let maxAttempts = 8;
let gameOver = false;
let discoveredDigits = [];
let gameWon = false;

const codeInput    = document.getElementById('code-input');
const verifyBtn    = document.getElementById('verify-btn');
const hintBtn      = document.getElementById('hint-btn');
const resetBtn     = document.getElementById('reset-btn');
const messagesDiv  = document.getElementById('messages');
const attemptsSpan = document.getElementById('attempts');
const progressFill = document.getElementById('progress-fill');
const matrixCode   = document.getElementById('matrix-code');
const timeSpan     = document.getElementById('time');

// ── INICIALIZAR ───────────────────────────────────────────────
function initGame() {
    secretCode = [];
    for (let i = 0; i < 5; i++) {
        secretCode.push(Math.floor(Math.random() * 10));
    }

    discoveredDigits = [false, false, false, false, false];

    // Revelar 2 dígitos al azar desde el inicio
    const visibles = [];
    while (visibles.length < 2) {
        const pos = Math.floor(Math.random() * 5);
        if (!visibles.includes(pos)) {
            visibles.push(pos);
            discoveredDigits[pos] = true;
        }
    }

    attempts = 8;
    gameOver = false;
    gameWon  = false;

    updateCodeDisplay();
    updateAttempts();
    updateProgress();

    codeInput.value    = '';
    codeInput.disabled = false;
    messagesDiv.innerHTML = '';

    addMessage('⚡ SISTEMA INICIADO', 'info');
    addMessage('🔓 CÓDIGO PARCIALMENTE VISIBLE', 'info');
    addMessage(`💚 TIENES ${attempts}/${maxAttempts} INTENTOS`, 'success');
}

// ── DISPLAY DEL CÓDIGO ────────────────────────────────────────
function updateCodeDisplay() {
    const codeBox = document.getElementById('code-box');
    codeBox.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const span = document.createElement('span');
        span.className = 'code-digit';

        if (gameOver) {
            span.textContent = secretCode[i];
            if (!gameWon) {
                span.style.color      = '#ff3300';
                span.style.textShadow = '0 0 10px #ff3300';
            }
        } else {
            if (discoveredDigits[i]) {
                span.textContent = secretCode[i];
            } else {
                span.textContent  = '?';
                span.style.opacity = '0.5';
            }
        }

        codeBox.appendChild(span);
    }
}

// ── INTENTOS ──────────────────────────────────────────────────
function updateAttempts() {
    attemptsSpan.textContent = `${attempts}/${maxAttempts}`;

    if (attempts <= 0 && !gameWon) {
        gameOver = true;
        codeInput.disabled = true;
        updateCodeDisplay();
        addMessage('❌ ACCESO DENEGADO - SISTEMA BLOQUEADO', 'error');
        addMessage(`🔐 EL CÓDIGO ERA: ${secretCode.join('')}`, 'info');
    }
}

// ── PROGRESO ──────────────────────────────────────────────────
function updateProgress() {
    const found    = discoveredDigits.filter(d => d).length;
    const progress = (found / 5) * 100;
    progressFill.style.width = progress + '%';
}

// ── MENSAJES ──────────────────────────────────────────────────
function addMessage(text, type = 'info') {
    const msg = document.createElement('div');
    msg.className   = `message ${type}`;
    msg.textContent = `> ${text}`;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    while (messagesDiv.children.length > 8) {
        messagesDiv.removeChild(messagesDiv.firstChild);
    }
}

// ── VERIFICAR ─────────────────────────────────────────────────
function verifyCode() {
    if (gameOver) { addMessage('⛔ SISTEMA BLOQUEADO - REINICIA', 'error'); return; }

    const input = codeInput.value.trim();
    if (input.length !== 5)      { addMessage('⚠️ DEBES INGRESAR 5 DÍGITOS', 'error'); return; }
    if (!/^\d+$/.test(input))    { addMessage('⚠️ SOLO DÍGITOS 0-9', 'error');         return; }

    const userCode = input.split('').map(Number);
    let newDiscoveries = 0;
    let exactMatches   = 0;

    for (let i = 0; i < 5; i++) {
        if (userCode[i] === secretCode[i]) {
            exactMatches++;
            if (!discoveredDigits[i]) {
                discoveredDigits[i] = true;
                newDiscoveries++;
            }
        }
    }

    updateCodeDisplay();
    updateProgress();
    attempts--;

    if (newDiscoveries > 0) {
        addMessage(`✅ ¡${newDiscoveries} DÍGITO(S) NUEVO(S)!`, 'success');
        addMessage(`🎯 ACIERTOS TOTALES: ${exactMatches}/5`, 'success');
    } else {
        addMessage(exactMatches > 0
            ? `⚠️ SIN NUEVOS DÍGITOS (${exactMatches}/5 ya conocidos)`
            : `❌ NINGÚN DÍGITO CORRECTO`,
            exactMatches > 0 ? 'info' : 'error');
    }

    addMessage(`⚡ INTENTOS RESTANTES: ${attempts}/${maxAttempts}`, 'info');

    if (discoveredDigits.every(d => d)) {
        gameWon = gameOver = true;
        codeInput.disabled = true;
        addMessage('🎉 ¡ACCESO CONCEDIDO!', 'success');
        addMessage('⭐ HACKEO EXITOSO', 'success');
        addMessage(`🔓 CÓDIGO: ${secretCode.join('')}`, 'success');
    }

    updateAttempts();
    codeInput.value = '';
}

// ── PISTA ─────────────────────────────────────────────────────
function giveHint() {
    if (gameOver) { addMessage('⛔ SISTEMA BLOQUEADO', 'error'); return; }
    if (attempts < 3) { addMessage('⚠️ INTENTOS INSUFICIENTES (NECESITAS 3)', 'error'); return; }

    const unknown = [];
    for (let i = 0; i < 5; i++) {
        if (!discoveredDigits[i]) unknown.push(i);
    }

    if (unknown.length === 0) { addMessage('🎯 YA DESCUBRISTE TODO', 'info'); return; }

    const pos = unknown[Math.floor(Math.random() * unknown.length)];
    discoveredDigits[pos] = true;
    attempts -= 3;

    updateCodeDisplay();
    updateProgress();
    updateAttempts();

    addMessage(`🔍 PISTA CARA: DÍGITO ${pos + 1} REVELADO (-3 INTENTOS)`, 'info');
    addMessage(`⚡ TE QUEDAN ${attempts}/${maxAttempts} INTENTOS`, 'info');

    if (discoveredDigits.every(d => d)) {
        gameWon = gameOver = true;
        codeInput.disabled = true;
        addMessage('🎉 ¡ACCESO CONCEDIDO POR PISTAS!', 'success');
        addMessage(`🔓 CÓDIGO: ${secretCode.join('')}`, 'success');
    }
}

// ── RELOJ ─────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    timeSpan.textContent =
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
}

// ── MATRIX ────────────────────────────────────────────────────
function generateMatrixCode() {
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const area  = document.getElementById('matrix-area');
    const cols  = Math.ceil(area.clientWidth / 14) + 5;
    const rows  = Math.ceil(area.clientHeight / 17) + 2;
    let matrix  = '';

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            matrix += chars[Math.floor(Math.random() * chars.length)];
        }
        matrix += '\n';
    }
    matrixCode.textContent = matrix;
}

// ── EVENTOS ───────────────────────────────────────────────────
verifyBtn.addEventListener('click', verifyCode);
hintBtn.addEventListener('click', giveHint);
resetBtn.addEventListener('click', initGame);
codeInput.addEventListener('keypress', e => { if (e.key === 'Enter') verifyCode(); });

// ── ARRANQUE ──────────────────────────────────────────────────
initGame();
updateClock();
generateMatrixCode();
setInterval(updateClock, 1000);
setInterval(generateMatrixCode, 2000);