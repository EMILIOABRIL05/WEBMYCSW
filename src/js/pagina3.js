document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const loader = document.getElementById('loader');
    const canvas = document.getElementById("dos");

    startBtn.addEventListener('click', () => {
        // Validación de seguridad para la librería
        if (typeof Dos === 'undefined') {
            alert("Error: La librería de emulación no se ha cargado. Revisa tu conexión a internet.");
            return;
        }

        startBtn.innerText = "SISTEMA_EN_LINEA";
        startBtn.disabled = true;
        loader.classList.remove('hidden'); // Asegura que se vea el mensaje de carga

        // Ejecución del emulador
        Dos(canvas, {
            cycleDelay: 1,
            autolock: false,
        }).run("https://js-dos.com/cdn/doom.jsdos").then((runtime) => {
            console.log("DOOM cargado exitosamente");
            loader.style.display = "none"; // Oculta el mensaje una vez cargado el juego
        }).catch((err) => {
            console.error("Fallo al cargar el juego:", err);
            loader.innerText = "ERROR_DE_CONEXION";
        });
    });
});