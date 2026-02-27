document.addEventListener('DOMContentLoaded', () => {
    const lanes = [document.getElementById('lane-0'), document.getElementById('lane-1'), document.getElementById('lane-2'), document.getElementById('lane-3')];
    const scoreElement = document.getElementById('score');
    const comboElement = document.getElementById('combo');
    const startBtn = document.getElementById('startBtn');
    const startScreen = document.getElementById('start-screen');

    let score = 0;
    let combo = 0;
    let gameActive = false;
    let spawnTimer;
    const keys = ['KeyA', 'KeyS', 'KeyD', 'KeyF'];

    function createNote() {
        if (!gameActive) return;

        const laneIndex = Math.floor(Math.random() * 4);
        const note = document.createElement('div');
        note.classList.add('note');
        note.style.top = '-20px';
        lanes[laneIndex].appendChild(note);

        let pos = -20;
        const speed = 7; // Velocidad estable

        function moveNote() {
            if (!gameActive) { note.remove(); return; }
            
            pos += speed;
            note.style.top = pos + 'px';

            if (pos > 450) { // Fallo (Miss)
                note.remove();
                combo = 0;
                comboElement.innerText = combo;
            } else {
                // Usamos requestAnimationFrame para máxima suavidad (Cero parpadeo)
                note.dataset.frameId = requestAnimationFrame(moveNote);
            }
        }
        note.dataset.frameId = requestAnimationFrame(moveNote);
        
        // Intervalo de aparición dinámico
        spawnTimer = setTimeout(createNote, Math.random() * (800 - 400) + 400);
    }

    document.addEventListener('keydown', (e) => {
        const index = keys.indexOf(e.code);
        if (index !== -1 && gameActive) {
            checkHit(index);
            lanes[index].classList.add('hit-flash');
            setTimeout(() => lanes[index].classList.remove('hit-flash'), 100);
        }
    });

    function checkHit(laneIndex) {
        const lane = lanes[laneIndex];
        const notes = lane.getElementsByClassName('note');
        
        if (notes.length > 0) {
            const firstNote = notes[0];
            const pos = parseInt(firstNote.style.top);

            // Rango de precisión ajustado
            if (pos > 380 && pos < 460) {
                score += 10 + (combo * 2);
                combo++;
                scoreElement.innerText = score;
                comboElement.innerText = combo;
                
                cancelAnimationFrame(firstNote.dataset.frameId);
                firstNote.remove();
            }
        }
    }

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
});