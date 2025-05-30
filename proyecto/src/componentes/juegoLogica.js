// src/componentes/juegoLogica.js

// Banco de preguntas de Lógica y Acertijos (ejemplos)
const PREGUNTAS_LOGICA = [
    {
        id: "log1",
        tipo: "acertijo_texto",
        pregunta: "Tiene ciudades, pero no casas. Tiene montañas, pero no árboles. Tiene agua, pero no peces. ¿Qué es?",
        respuesta: "un mapa", // Aceptaremos respuestas en minúsculas y sin tildes para simplificar
        pista: "Es algo que usas para orientarte en un viaje.",
        dificultad: "media"
    },
    {
        id: "log2",
        tipo: "secuencia_numerica",
        pregunta: "Continúa la secuencia: 2, 4, 8, 16, ___",
        respuesta: "32",
        pista: "Cada número es el doble del anterior.",
        dificultad: "facil"
    },
    {
        id: "log3",
        tipo: "logica_deductiva",
        pregunta: "Si todos los Zigs son Zags y algunos Zags son Zoogs, ¿podemos asegurar que algunos Zigs son Zoogs? (Responde sí o no)",
        respuesta: "no",
        pista: "Piensa en conjuntos. Que algunos Zags sean Zoogs no implica que los Zigs que son Zags también sean Zoogs.",
        dificultad: "dificil"
    },
    {
        id: "log4",
        tipo: "acertijo_texto",
        pregunta: "Soy alto cuando soy joven y corto cuando soy viejo. ¿Qué soy?",
        respuesta: "una vela",
        pista: "Me encienden y me consumo con el tiempo.",
        dificultad: "media"
    }
];

let preguntaActualLogica = null;
let puntajeLogica = 0;
let preguntasLogicaUsadas = []; // Para no repetir preguntas en una sesión

function obtenerNuevaPreguntaLogica() {
    let preguntasDisponibles = PREGUNTAS_LOGICA.filter(p => !preguntasLogicaUsadas.includes(p.id));
    if (preguntasDisponibles.length === 0) {
        // Si se acaban las preguntas, reiniciamos las usadas para poder jugar de nuevo
        // En una app más grande, cargarías más o indicarías que no hay más.
        preguntasLogicaUsadas = [];
        preguntasDisponibles = PREGUNTAS_LOGICA;
        if (preguntasDisponibles.length === 0) return null; // No hay preguntas en absoluto
    }
    const indiceAleatorio = Math.floor(Math.random() * preguntasDisponibles.length);
    const nuevaPregunta = preguntasDisponibles[indiceAleatorio];
    preguntasLogicaUsadas.push(nuevaPregunta.id);
    return nuevaPregunta;
}

function mostrarPreguntaLogica(container, navigateTo) {
    preguntaActualLogica = obtenerNuevaPreguntaLogica();

    if (!preguntaActualLogica) {
        container.innerHTML = `
            <div class="juego-generico-container">
                <h2>¡Genial!</h2>
                <p>Has respondido todas nuestras preguntas de lógica por ahora.</p>
                <p>Tu puntaje final es: ${puntajeLogica}</p>
                <button id="btn-volver-selector-logica-fin" class="btn-juego btn-siguiente">🎮 Volver a Juegos</button>
            </div>`;
        document.getElementById('btn-volver-selector-logica-fin').onclick = () => navigateTo('selectorJuegos');
        return;
    }

    container.innerHTML = `
        <div class="juego-generico-container juego-logica-activo">
            <header class="juego-header">
                <h1>🧠 Lógica y Acertijos</h1>
                <div class="puntaje-juego-logica">Puntos: <span id="puntaje-logica-actual">${puntajeLogica}</span></div>
            </header>
            
            <div class="pregunta-logica-container">
                <p class="pregunta-texto">${preguntaActualLogica.pregunta}</p>
                <input type="text" id="respuesta-logica" placeholder="Escribe tu respuesta aquí..." autofocus>
            </div>
            
            <div id="feedback-logica" class="feedback-container"></div>
            
            <div class="controles-juego-logica">
                <button id="comprobar-logica" class="btn-juego btn-comprobar">✔️ Comprobar</button>
                <button id="pista-logica" class="btn-juego btn-pista">💡 Pista</button>
                <button id="siguiente-pregunta-logica" class="btn-juego btn-siguiente" style="display:none;">➡️ Siguiente Pregunta</button>
            </div>
             <button id="terminar-juego-logica" class="btn-juego btn-terminar" style="margin-top: 15px;">🏁 Terminar Juego</button>
        </div>
    `;

    document.getElementById('comprobar-logica').onclick = () => comprobarRespuestaLogica(container, navigateTo);
    document.getElementById('pista-logica').onclick = mostrarPistaLogica;
    document.getElementById('siguiente-pregunta-logica').onclick = () => mostrarPreguntaLogica(container, navigateTo);
    document.getElementById('terminar-juego-logica').onclick = () => terminarJuegoLogica(container, navigateTo);

    const respuestaInput = document.getElementById('respuesta-logica');
    respuestaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') comprobarRespuestaLogica(container, navigateTo);
    });
}

function normalizarRespuesta(texto) {
    return texto.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar tildes
}

function comprobarRespuestaLogica(container, navigateTo) {
    const respuestaUsuarioEl = document.getElementById('respuesta-logica');
    const feedbackEl = document.getElementById('feedback-logica');
    const comprobarBtn = document.getElementById('comprobar-logica');
    const siguienteBtn = document.getElementById('siguiente-pregunta-logica');
    const pistaBtn = document.getElementById('pista-logica');

    if (!respuestaUsuarioEl || !feedbackEl || !preguntaActualLogica) return;

    const respuestaUsuario = normalizarRespuesta(respuestaUsuarioEl.value);
    const respuestaCorrecta = normalizarRespuesta(preguntaActualLogica.respuesta);

    if (respuestaUsuario === "") {
        feedbackEl.innerHTML = `<p class="feedback-mensaje incorrecto animate__animated animate__headShake">Por favor, escribe una respuesta.</p>`;
        return;
    }

    if (respuestaUsuario === respuestaCorrecta) {
        puntajeLogica += 10;
        feedbackEl.innerHTML = `<p class="feedback-mensaje correcto animate__animated animate__tada">¡Correcto! La respuesta es "${preguntaActualLogica.respuesta}". <span class="puntos-ganados">(+10 pts)</span></p>`;
        respuestaUsuarioEl.disabled = true;
        comprobarBtn.style.display = 'none';
        pistaBtn.style.display = 'none';
        siguienteBtn.style.display = 'inline-block';
    } else {
        puntajeLogica -= (puntajeLogica > 0 ? 5 : 0); // No bajar de 0
        feedbackEl.innerHTML = `<p class="feedback-mensaje incorrecto animate__animated animate__shakeX">Respuesta incorrecta. ¡Sigue intentando o pide una pista!</p>`;
    }
    document.getElementById('puntaje-logica-actual').textContent = puntajeLogica;
}

function mostrarPistaLogica() {
    const feedbackEl = document.getElementById('feedback-logica');
    if (preguntaActualLogica && preguntaActualLogica.pista) {
        feedbackEl.innerHTML = `<p class="feedback-mensaje info animate__animated animate__fadeInUp"><strong>Pista:</strong> ${preguntaActualLogica.pista}</p>`;
        puntajeLogica -= (puntajeLogica > 2 ? 2 : 0); // Penalización por pista
        document.getElementById('puntaje-logica-actual').textContent = puntajeLogica;
        document.getElementById('pista-logica').disabled = true; // Solo una pista por pregunta
    }
}
function terminarJuegoLogica(container, navigateTo){
    // Aquí podrías guardar el puntaje en Firebase si lo deseas, similar al juego de cartas
    container.innerHTML = `
        <div class="juego-generico-container">
            <h2>Juego de Lógica Terminado</h2>
            <p>Tu puntaje final fue: <strong>${puntajeLogica}</strong></p>
            <p>¡Gracias por jugar!</p>
            <button id="btn-jugar-logica-otravez" class="btn-juego btn-comprobar">🧠 Jugar de Nuevo (Lógica)</button>
            <button id="btn-volver-selector-logica-final" class="btn-juego btn-siguiente">🎮 Volver a Juegos</button>
        </div>`;
    document.getElementById('btn-jugar-logica-otravez').onclick = () => iniciarJuegoLogica(container, navigateTo);
    document.getElementById('btn-volver-selector-logica-final').onclick = () => navigateTo('selectorJuegos');
}


// Esta es la función que se importa en main.js
export function iniciarJuegoLogica(appContainer, navigateTo) {
    puntajeLogica = 0; // Reiniciar puntaje al iniciar un nuevo juego
    preguntasLogicaUsadas = []; // Reiniciar preguntas usadas
    appContainer.setAttribute('data-pantalla', 'juegoLogica');
    mostrarPreguntaLogica(appContainer, navigateTo); // Llama a la función que realmente renderiza la pregunta
}