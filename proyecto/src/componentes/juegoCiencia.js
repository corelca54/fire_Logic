// src/componentes/juegoCiencia.js

const PREGUNTAS_CIENCIA = [
    {
        id: "cie1",
        pregunta: "¿Cuál es el planeta más cercano al Sol?",
        opciones: ["Venus", "Tierra", "Mercurio", "Marte"],
        respuestaCorrecta: "Mercurio",
        pista: "Es también el planeta más pequeño de nuestro sistema solar.",
        dificultad: "facil"
    },
    {
        id: "cie2",
        pregunta: "¿Qué gas necesitan las plantas para la fotosíntesis?",
        opciones: ["Oxígeno", "Dióxido de Carbono", "Nitrógeno", "Hidrógeno"],
        respuestaCorrecta: "Dióxido de Carbono",
        pista: "Es el gas que exhalamos los humanos.",
        dificultad: "facil"
    },
    {
        id: "cie3",
        pregunta: "¿Cuál es la fórmula química del agua?",
        opciones: ["CO2", "O2", "H2O", "NaCl"],
        respuestaCorrecta: "H2O",
        pista: "Dos átomos de un elemento y uno de otro.",
        dificultad: "media"
    },
    {
        id: "cie4",
        pregunta: "La ley de la gravedad fue formulada por:",
        opciones: ["Albert Einstein", "Galileo Galilei", "Isaac Newton", "Marie Curie"],
        respuestaCorrecta: "Isaac Newton",
        pista: "Una manzana tuvo algo que ver, según la leyenda.",
        dificultad: "media"
    }
];

let preguntaActualCiencia = null;
let puntajeCiencia = 0;
let preguntasCienciaUsadas = [];

function obtenerNuevaPreguntaCiencia() {
    let preguntasDisponibles = PREGUNTAS_CIENCIA.filter(p => !preguntasCienciaUsadas.includes(p.id));
    if (preguntasDisponibles.length === 0) {
        preguntasCienciaUsadas = [];
        preguntasDisponibles = PREGUNTAS_CIENCIA;
        if (preguntasDisponibles.length === 0) return null;
    }
    const indiceAleatorio = Math.floor(Math.random() * preguntasDisponibles.length);
    const nuevaPregunta = preguntasDisponibles[indiceAleatorio];
    preguntasCienciaUsadas.push(nuevaPregunta.id);
    return nuevaPregunta;
}

function mostrarPreguntaCiencia(container, navigateTo) {
    preguntaActualCiencia = obtenerNuevaPreguntaCiencia();

    if (!preguntaActualCiencia) {
        container.innerHTML = `
            <div class="juego-generico-container">
                <h2>¡Increíble!</h2>
                <p>Has respondido todas nuestras preguntas de ciencia por ahora.</p>
                <p>Tu puntaje final es: ${puntajeCiencia}</p>
                <button id="btn-volver-selector-ciencia-fin" class="btn-juego btn-siguiente">🎮 Volver a Juegos</button>
            </div>`;
        document.getElementById('btn-volver-selector-ciencia-fin').onclick = () => navigateTo('selectorJuegos');
        return;
    }

    // Mezclar opciones para que la correcta no esté siempre en la misma posición
    const opcionesMezcladas = [...preguntaActualCiencia.opciones].sort(() => Math.random() - 0.5);

    container.innerHTML = `
        <div class="juego-generico-container juego-ciencia-activo">
            <header class="juego-header">
                <h1>⚛️ Ciencia Divertida</h1>
                <div class="puntaje-juego-ciencia">Puntos: <span id="puntaje-ciencia-actual">${puntajeCiencia}</span></div>
            </header>
            
            <div class="pregunta-ciencia-container">
                <p class="pregunta-texto">${preguntaActualCiencia.pregunta}</p>
                <div class="opciones-container">
                    ${opcionesMezcladas.map((opcion, index) => `
                        <button class="btn-opcion-ciencia" data-opcion="${opcion}">
                            ${String.fromCharCode(65 + index)}. ${opcion}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div id="feedback-ciencia" class="feedback-container"></div>
            
            <div class="controles-juego-ciencia">
                <button id="pista-ciencia" class="btn-juego btn-pista">💡 Pista</button>
                <button id="siguiente-pregunta-ciencia" class="btn-juego btn-siguiente" style="display:none;">➡️ Siguiente Pregunta</button>
            </div>
            <button id="terminar-juego-ciencia" class="btn-juego btn-terminar" style="margin-top: 15px;">🏁 Terminar Juego</button>
        </div>
    `;

    document.querySelectorAll('.btn-opcion-ciencia').forEach(btn => {
        btn.onclick = () => comprobarRespuestaCiencia(btn.dataset.opcion, container, navigateTo);
    });
    document.getElementById('pista-ciencia').onclick = mostrarPistaCiencia;
    document.getElementById('siguiente-pregunta-ciencia').onclick = () => mostrarPreguntaCiencia(container, navigateTo);
    document.getElementById('terminar-juego-ciencia').onclick = () => terminarJuegoCiencia(container, navigateTo);
}

function comprobarRespuestaCiencia(opcionSeleccionada, container, navigateTo) {
    const feedbackEl = document.getElementById('feedback-ciencia');
    const siguienteBtn = document.getElementById('siguiente-pregunta-ciencia');
    const pistaBtn = document.getElementById('pista-ciencia');
    const botonesOpcion = document.querySelectorAll('.btn-opcion-ciencia');

    if (!feedbackEl || !preguntaActualCiencia) return;

    // Deshabilitar todos los botones de opción
    botonesOpcion.forEach(btn => btn.disabled = true);
    pistaBtn.style.display = 'none'; // Ocultar pista después de responder

    if (opcionSeleccionada === preguntaActualCiencia.respuestaCorrecta) {
        puntajeCiencia += 10;
        feedbackEl.innerHTML = `<p class="feedback-mensaje correcto animate__animated animate__tada">¡Correcto! La respuesta es "${preguntaActualCiencia.respuestaCorrecta}". <span class="puntos-ganados">(+10 pts)</span></p>`;
        // Resaltar la opción correcta
        botonesOpcion.forEach(btn => {
            if (btn.dataset.opcion === preguntaActualCiencia.respuestaCorrecta) {
                btn.classList.add('opcion-correcta');
            }
        });
    } else {
        puntajeCiencia -= (puntajeCiencia > 0 ? 5 : 0);
        feedbackEl.innerHTML = `<p class="feedback-mensaje incorrecto animate__animated animate__shakeX">Incorrecto. La respuesta correcta era "${preguntaActualCiencia.respuestaCorrecta}".</p>`;
        // Resaltar la opción incorrecta y la correcta
        botonesOpcion.forEach(btn => {
            if (btn.dataset.opcion === opcionSeleccionada) {
                btn.classList.add('opcion-incorrecta');
            }
            if (btn.dataset.opcion === preguntaActualCiencia.respuestaCorrecta) {
                btn.classList.add('opcion-correcta-despues-fallo');
            }
        });
    }
    document.getElementById('puntaje-ciencia-actual').textContent = puntajeCiencia;
    siguienteBtn.style.display = 'inline-block';
}

function mostrarPistaCiencia() {
    const feedbackEl = document.getElementById('feedback-ciencia');
    if (preguntaActualCiencia && preguntaActualCiencia.pista) {
        feedbackEl.innerHTML = `<p class="feedback-mensaje info animate__animated animate__fadeInUp"><strong>Pista:</strong> ${preguntaActualCiencia.pista}</p>`;
        puntajeCiencia -= (puntajeCiencia > 2 ? 2 : 0);
        document.getElementById('puntaje-ciencia-actual').textContent = puntajeCiencia;
        document.getElementById('pista-ciencia').disabled = true;
    }
}

function terminarJuegoCiencia(container, navigateTo){
    container.innerHTML = `
        <div class="juego-generico-container">
            <h2>Juego de Ciencia Terminado</h2>
            <p>Tu puntaje final fue: <strong>${puntajeCiencia}</strong></p>
            <p>¡Sigue explorando el mundo!</p>
            <button id="btn-jugar-ciencia-otravez" class="btn-juego btn-comprobar">⚛️ Jugar de Nuevo (Ciencia)</button>
            <button id="btn-volver-selector-ciencia-final" class="btn-juego btn-siguiente">🎮 Volver a Juegos</button>
        </div>`;
    document.getElementById('btn-jugar-ciencia-otravez').onclick = () => iniciarJuegoCiencia(container, navigateTo);
    document.getElementById('btn-volver-selector-ciencia-final').onclick = () => navigateTo('selectorJuegos');
}

export function iniciarJuegoCiencia(appContainer, navigateTo) {
    puntajeCiencia = 0;
    preguntasCienciaUsadas = [];
    appContainer.setAttribute('data-pantalla', 'juegoCiencia');
    mostrarPreguntaCiencia(appContainer, navigateTo);
}