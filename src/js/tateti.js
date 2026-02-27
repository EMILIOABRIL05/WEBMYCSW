// Variables del juego
let tablero = ['', '', '', '', '', '', '', '', ''];
let turnoJugador = true; // true = X (jugador), false = O (máquina)
let juegoActivo = false;
let movimientos = 0;

// Elementos HTML
const gameBoard = document.getElementById('gameBoard');
const modalInicio = document.getElementById('modalInicio');
const btnJugar = document.getElementById('btnJugar');
const btnSalir = document.getElementById('btnSalir');
const btnNuevaPartida = document.getElementById('btnNuevaPartida');
const tableroDiv = document.getElementById('tablero');
const turnoSpan = document.getElementById('turno');

// Combinaciones ganadoras
const combinacionesGanadoras = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6]
];

// Inicializar el juego
function inicializarJuego() {
	btnJugar.addEventListener('click', iniciarPartida);
	btnSalir.addEventListener('click', volverAlInicio);
	btnNuevaPartida.addEventListener('click', nuevaPartida);
	crearTablero();
}

// Crear el tablero visualmente
function crearTablero() {
	gameBoard.innerHTML = '';
	for (let i = 0; i < 9; i++) {
		const casilla = document.createElement('div');
		casilla.className = 'game-cell';
		casilla.dataset.index = i;
		casilla.addEventListener('click', () => marcarJugador(i));
		gameBoard.appendChild(casilla);
	}
}

// Marcar movimiento del jugador
function marcarJugador(index) {
	if (!juegoActivo || tablero[index] !== '') return;

	tablero[index] = 'X';
	actualizarTablero();
	movimientos++;

	if (verificarGanador('X')) {
		mostrarResultado('¡GANASTE!');
		return;
	}

	if (movimientos === 9) {
		mostrarResultado('¡EMPATE!');
		return;
	}

	turnoSpan.textContent = 'O';
	setTimeout(movimientoMaquina, 500);
}

// Movimiento de la máquina (IA simple)
function movimientoMaquina() {
	if (!juegoActivo || tablero.every(celda => celda === 'X' || celda === 'O')) return;

	// Intentar ganar
	let indiceIA = encontrarMovimientoOptimo('O');

	// Si no puede ganar, bloquear al jugador
	if (indiceIA === -1) {
		indiceIA = encontrarMovimientoOptimo('X');
	}

	// Si no, movimiento aleatorio
	if (indiceIA === -1) {
		const disponibles = tablero
			.map((celda, i) => celda === '' ? i : null)
			.filter(i => i !== null);
		indiceIA = disponibles[Math.floor(Math.random() * disponibles.length)];
	}

	if (indiceIA !== -1) {
		tablero[indiceIA] = 'O';
		actualizarTablero();
		movimientos++;

		if (verificarGanador('O')) {
			mostrarResultado('¡PERDISTE!');
			return;
		}

		if (movimientos === 9) {
			mostrarResultado('¡EMPATE!');
			return;
		}

		turnoSpan.textContent = 'X';
	}
}

// Encontrar movimiento óptimo para la IA
function encontrarMovimientoOptimo(jugador) {
	for (let combinacion of combinacionesGanadoras) {
		const [a, b, c] = combinacion;
		const celdas = [tablero[a], tablero[b], tablero[c]];

		if (celdas.filter(celda => celda === jugador).length === 2 &&
			celdas.filter(celda => celda === '').length === 1) {
			const indice = [a, b, c].find(i => tablero[i] === '');
			return indice;
		}
	}
	return -1;
}

// Verificar si hay ganador
function verificarGanador(jugador) {
	return combinacionesGanadoras.some(combinacion => {
		return combinacion.every(index => tablero[index] === jugador);
	});
}

// Actualizar el tablero visualmente
function actualizarTablero() {
	const casillas = document.querySelectorAll('.game-cell');
	casillas.forEach((casilla, index) => {
		casilla.textContent = tablero[index];
		casilla.className = 'game-cell';
		if (tablero[index] === 'X') {
			casilla.classList.add('x');
		} else if (tablero[index] === 'O') {
			casilla.classList.add('o');
		}
	});
}

// Mostrar resultado
function mostrarResultado(mensaje) {
	juegoActivo = false;
	const modalResultado = document.createElement('div');
	modalResultado.className = 'modal-overlay';
	modalResultado.innerHTML = `
		<div class="bg-razerGrey border border-razerGreen/30 px-8 py-10 rounded-lg text-center max-w-md mx-4">
			<h2 class="font-syncopate text-2xl mb-6 text-razerGreen razer-txt-glow">${mensaje}</h2>
			<button id="btnRepetir"
				class="hvr-sweep-to-right btn-razer font-syncopate px-8 py-3 uppercase tracking-widest text-razerGreen mb-4 w-full">
				Nueva Partida
			</button>
			<button id="btnVolverInicio"
				class="hvr-sweep-to-right btn-razer font-syncopate px-8 py-3 uppercase tracking-widest text-gray-400 w-full hover:text-razerGreen">
				Volver al Inicio
			</button>
		</div>
	`;
	document.body.appendChild(modalResultado);

	document.getElementById('btnRepetir').addEventListener('click', () => {
		modalResultado.remove();
		nuevaPartida();
	});

	document.getElementById('btnVolverInicio').addEventListener('click', () => {
		modalResultado.remove();
		volverAlInicio();
	});
}

// Nueva partida
function nuevaPartida() {
	tablero = ['', '', '', '', '', '', '', '', ''];
	movimientos = 0;
	juegoActivo = true;
	turnoSpan.textContent = 'X';
	crearTablero();
}

// Iniciar partida
function iniciarPartida() {
	modalInicio.classList.add('hidden');
	tableroDiv.classList.remove('hidden');
	nuevaPartida();
}

// Volver al inicio
function volverAlInicio() {
	window.location.href = '../index.html';
}

// Ejecutar cuando carga la página
window.addEventListener('load', inicializarJuego);
