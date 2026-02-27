document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS AL DOM ---
    const lanes = [
        document.getElementById('lane-0'),
        document.getElementById('lane-1'),
        document.getElementById('lane-2'),
        document.getElementById('lane-3')
    ];
    const scoreElement = document.getElementById('score');
    const comboElement = document.getElementById('combo');
    const startBtn = document.getElementById('startBtn');
    const startScreen = document.getElementById('start-screen');
    const exitBtn = document.querySelector('a[href="../index.html"]');

    // --- VARIABLES DE ESTADO ---
    let score = 0;
    let combo = 0;
    let gameActive = false;
    let spawnTimer;
    const keys = ['KeyA', 'KeyS', 'KeyD', 'KeyF'];

    // --- LÓGICA DEL JUEGO (NEON RHYTHM) ---s

    function createNote() {
        if (!gameActive) return;

        const laneIndex = Math.floor(Math.random() * 4);
        const lane = lanes[laneIndex];
        const note = document.createElement('div');
        note.classList.add('note');
        
        // Posición inicial fuera de pantalla
        let pos = -50;
        note.style.transform = `translate3d(0, ${pos}px, 0)`;
        lane.appendChild(note);

        const speed = 7; // Velocidad de caída constante

        function update() {
            if (!gameActive) { 
                note.remove(); 
                return; 
            }
            
            pos += speed;
            // Uso de translate3d para evitar parpadeos y usar aceleración de hardware
            note.style.transform = `translate3d(0, ${pos}px, 0)`;

            // Si la nota se pasa de la línea de juicio (Fallo/Miss)
            if (pos > 500) {
                note.remove();
                combo = 0;
                comboElement.innerText = combo;
                // Pequeño feedback visual de fallo en el tablero
                document.getElementById('game-board').style.borderColor = 'rgba(255, 0, 0, 0.5)';
                setTimeout(() => {
                    document.getElementById('game-board').style.borderColor = 'rgba(68, 214, 44, 0.3)';
                }, 100);
            } else {
                // Sincronización con los FPS del monitor
                note.dataset.frameId = requestAnimationFrame(update);
            }
        }
        note.dataset.frameId = requestAnimationFrame(update);

        // Intervalo de aparición aleatorio entre 400ms y 900ms
        spawnTimer = setTimeout(createNote, Math.random() * (900 - 400) + 400);
    }

    // --- ENTRADA DE USUARIO (TECLADO) ---
    document.addEventListener('keydown', (e) => {
        const index = keys.indexOf(e.code);
        if (index !== -1 && gameActive) {
            checkHit(index);
            // Efecto de luz en la pista al presionar
            lanes[index].classList.add('hit-flash');
            setTimeout(() => lanes[index].classList.remove('hit-flash'), 100);
        }
    });

    // --- SALIDA DE DATOS (PUNTUACIÓN) ---
    function checkHit(laneIndex) {
        const lane = lanes[laneIndex];
        const notes = lane.getElementsByClassName('note');
        
        if (notes.length > 0) {
            const firstNote = notes[0];
            // Obtener la posición actual desde la matriz de transformación
            const style = window.getComputedStyle(firstNote);
            const matrix = new WebKitCSSMatrix(style.transform);
            const pos = matrix.m42;

            // Rango de acierto (Judgment Window)
            if (pos > 380 && pos < 470) {
                // Cálculo de puntos con multiplicador de combo
                score += 10 + (combo * 2);
                combo++;
                
                // Actualización de la UI
                scoreElement.innerText = score;
                comboElement.innerText = combo;
                
                // Limpieza de la nota
                cancelAnimationFrame(firstNote.dataset.frameId);
                firstNote.remove();
            }
        }
    }

    // --- CONTROLES DE INTERFAZ ---

    // Iniciar Juego
    startBtn.addEventListener('click', () => {
        gameActive = true;
        score = 0;
        combo = 0;
        scoreElement.innerText = score;
        comboElement.innerText = combo;
        startScreen.classList.add('hidden');
        
        clearTimeout(spawnTimer);
        createNote();
    });

    // Botón de Salir (Sin animaciones adicionales)
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            // Detener el juego antes de salir
            gameActive = false;
            clearTimeout(spawnTimer);
        });
    }
});