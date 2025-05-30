// src/componentes/juegoLogica.js
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const PREGUNTAS_LOGICA = [
    { id: "log1", tipo: "acertijo_texto", pregunta: "Tiene ciudades, pero no casas. Tiene montañas, pero no árboles. Tiene agua, pero no peces. ¿Qué es?", respuesta: "un mapa", pista: "Es algo que usas para orientarte.", dificultad: "media" },
    { id: "log2", tipo: "secuencia_numerica", pregunta: "Continúa la secuencia: 2, 4, 8, 16, ___", respuesta: "32", pista: "Cada número es el doble del anterior.", dificultad: "facil" },
    { id: "log3", tipo: "logica_deductiva", pregunta: "Si todos los Zigs son Zags y algunos Zags son Zoogs, ¿podemos asegurar que algunos Zigs son Zoogs? (sí/no)", respuesta: "no", pista: "Piensa en conjuntos.", dificultad: "dificil" },
    { id: "log4", tipo: "acertijo_texto", pregunta: "Soy alto cuando soy joven y corto cuando soy viejo. ¿Qué soy?", respuesta: "una vela", pista: "Me encienden.", dificultad: "media" }
    // ... (preguntas existentes) ...
    {
        id: "log5",
        tipo: "acertijo_matematico",
        pregunta: "Un granjero tiene 17 ovejas. Todas menos nueve murieron. ¿Cuántas ovejas vivas le quedan?",
        respuesta: "9",
        pista: "Lee la pregunta con atención: 'Todas menos nueve...'",
        dificultad: "media"
    },
    {
        id: "log6",
        tipo: "logica_programacion_conceptual",
        pregunta: "Si tienes una lista de números y quieres encontrar el más grande, ¿qué harías primero con el primer número de la lista?",
        respuesta: "asumir que es el mas grande", // O "guardarlo como el mayor actual", "tomarlo como referencia"
        pista: "Necesitas un punto de partida para comparar.",
        dificultad: "media"
    },
    {
        id: "log7",
        tipo: "secuencia_letras",
        pregunta: "Continúa la secuencia: A, C, F, J, O, ___",
        respuesta: "u",
        pista: "La distancia entre las letras aumenta: +2, +3, +4, +5...",
        dificultad: "dificil"
    },
    {
        id: "log8",
        tipo: "acertijo_clasico",
        pregunta: "¿Qué tiene un ojo pero no puede ver?",
        respuesta: "una aguja",
        pista: "Se usa para coser.",
        dificultad: "facil"
    }
    // ... ¡Añade muchas más! ...
];

let preguntaActualLogica = null;
let puntajeLogica = 0; // << DECLARADA AQUÍ A NIVEL DE MÓDULO
let preguntasLogicaUsadas = [];

function obtenerNuevaPreguntaLogica() {
    let preguntasDisponibles = PREGUNTAS_LOGICA.filter(p => !preguntasLogicaUsadas.includes(p.id));
    if (preguntasDisponibles.length === 0) {
        preguntasLogicaUsadas = [];
        preguntasDisponibles = PREGUNTAS_LOGICA;
        if (preguntasDisponibles.length === 0) return null;
    }
    const indiceAleatorio = Math.floor(Math.random() * preguntasDisponibles.length);
    const nuevaPregunta = preguntasDisponibles[indiceAleatorio];
    preguntasLogicaUsadas.push(nuevaPregunta.id);
    return nuevaPregunta;
}

function mostrarPreguntaLogica(container, navigateTo) {
    preguntaActualLogica = obtenerNuevaPreguntaLogica();
    if (!preguntaActualLogica) {
        terminarJuegoLogica(container, navigateTo, true);
        return;
    }
    container.innerHTML = `
        <div class="juego-generico-container juego-logica-activo animate__animated animate__fadeIn">
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
                <button id="comprobar-logica" class="btn-juego btn-secundario">✔️ Comprobar</button>
                <button id="pista-logica" class="btn-juego btn-advertencia">💡 Pista</button>
                <button id="siguiente-pregunta-logica" class="btn-juego btn-primario" style="display:none;">➡️ Siguiente</button>
            </div>
            <button id="terminar-juego-logica-btn" class="btn-juego btn-acento" style="margin-top:15px;">🏁 Terminar y Guardar</button>
        </div>
    `;
    document.getElementById('comprobar-logica').onclick = () => comprobarRespuestaLogica(container, navigateTo);
    document.getElementById('pista-logica').onclick = mostrarPistaLogica;
    document.getElementById('siguiente-pregunta-logica').onclick = () => mostrarPreguntaLogica(container, navigateTo);
    document.getElementById('terminar-juego-logica-btn').onclick = () => terminarJuegoLogica(container, navigateTo, false);
    const respuestaInput = document.getElementById('respuesta-logica');
    if (respuestaInput) {
        respuestaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') comprobarRespuestaLogica(container, navigateTo);
        });
    }
}

function normalizarRespuesta(texto) {
    return texto.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
        feedbackEl.innerHTML = `<p class="feedback-mensaje incorrecto animate__animated animate__headShake">Escribe una respuesta.</p>`;
        return;
    }
    if (respuestaUsuario === respuestaCorrecta) {
        puntajeLogica += 10;
        feedbackEl.innerHTML = `<p class="feedback-mensaje correcto animate__animated animate__tada">¡Correcto! <span class="puntos-ganados">(+10 pts)</span></p>`;
        if(respuestaUsuarioEl) respuestaUsuarioEl.disabled = true;
        if(comprobarBtn) comprobarBtn.style.display = 'none';
        if(pistaBtn) pistaBtn.style.display = 'none';
        if(siguienteBtn) siguienteBtn.style.display = 'inline-block';
    } else {
        puntajeLogica -= (puntajeLogica >= 5 ? 5 : puntajeLogica);
        feedbackEl.innerHTML = `<p class="feedback-mensaje incorrecto animate__animated animate__shakeX">Incorrecto. La respuesta era: "${preguntaActualLogica.respuesta}".</p>`;
    }
    const puntajeEl = document.getElementById('puntaje-logica-actual');
    if (puntajeEl) puntajeEl.textContent = puntajeLogica;
}

async function terminarJuegoLogica(container, navigateTo, finPorPreguntasAgotadas = false){
    const auth = getAuth(); const user = auth.currentUser; const db = getFirestore();
    let mensajeFinal = finPorPreguntasAgotadas ? "¡Completaste todas las preguntas!" : "Juego de Lógica Terminado";
    const controlesOriginales = container.querySelector('.controles-juego-logica');
    if (controlesOriginales) controlesOriginales.innerHTML = ''; // Limpiar botones de juego
    const inputRespuesta = container.querySelector('#respuesta-logica');
    if (inputRespuesta) inputRespuesta.style.display = 'none';
    const btnTerminarOriginal = container.querySelector('#terminar-juego-logica-btn');
    if(btnTerminarOriginal) btnTerminarOriginal.style.display = 'none';
    const preguntaContainer = container.querySelector('.pregunta-logica-container');
    if(preguntaContainer) preguntaContainer.style.display = 'none';
    const headerEl = container.querySelector('.juego-header h1');
    if(headerEl) headerEl.textContent = mensajeFinal;
    
    let feedbackGuardado = "";
    if (user && puntajeLogica > 0) {
        try {
            feedbackGuardado = `<p class="info animate__animated animate__fadeIn">Guardando puntaje...</p>`;
            container.querySelector('#feedback-logica').innerHTML = feedbackGuardado;
            const scoresCollectionRef = collection(db, "puntajes");
            await addDoc(scoresCollectionRef, { userId: user.uid, displayName: user.displayName || user.email.split('@')[0], puntaje: puntajeLogica, juego: "Lógica y Acertijos", fecha: serverTimestamp() });
            feedbackGuardado = `<p class="feedback-mensaje correcto animate__animated animate__bounceIn">¡Puntaje de ${puntajeLogica} guardado!</p>`;
        } catch (error) { console.error("Error guardando puntaje Lógica: ", error); feedbackGuardado = `<p class="error-mensaje">Error al guardar.</p>`; }
    } else if (user && puntajeLogica <= 0) { feedbackGuardado = `<p class="info">No obtuviste puntos.</p>`;
    } else if (!user) { feedbackGuardado = `<p class="error-mensaje">Logueate para guardar.</p>`; }
    
    const feedbackEl = container.querySelector('#feedback-logica');
    if (feedbackEl) {
         feedbackEl.innerHTML = `${feedbackGuardado}<p style="margin-top:1rem;">Puntaje final: <strong>${puntajeLogica}</strong></p>`;
        const controlesFinales = document.createElement('div');
        controlesFinales.className = 'controles-juego-generico'; controlesFinales.style.marginTop = '1rem';
        controlesFinales.innerHTML = `
            <button id="btn-jugar-logica-otravez" class="btn-juego btn-secundario">🧠 Jugar de Nuevo</button>
            <button id="btn-volver-selector-logica-final" class="btn-juego btn-primario">🎮 Volver a Juegos</button>
        `;
        feedbackEl.parentNode.insertBefore(controlesFinales, feedbackEl.nextSibling); // Insertar después del feedback
        document.getElementById('btn-jugar-logica-otravez').onclick = () => iniciarJuegoLogica(container, navigateTo);
        document.getElementById('btn-volver-selector-logica-final').onclick = () => navigateTo('selectorJuegos');
    }
}

export function iniciarJuegoLogica(appContainer, navigateTo) {
    puntajeLogica = 0; // << CORRECCIÓN: Asegurar que se reinicie
    preguntasLogicaUsadas = [];
    mostrarPreguntaLogica(appContainer, navigateTo);
}

function mostrarPistaLogica() {
    const feedbackEl = document.getElementById('feedback-logica');
    const pistaBtn = document.getElementById('pista-logica');
    if (preguntaActualLogica && preguntaActualLogica.pista) {
        feedbackEl.innerHTML = `<p class="feedback-mensaje info animate__animated animate__fadeInUp"><strong>Pista:</strong> ${preguntaActualLogica.pista}</p>`;
        puntajeLogica -= (puntajeLogica >= 2 ? 2 : 0); 
        document.getElementById('puntaje-logica-actual').textContent = puntajeLogica;
        if(pistaBtn) pistaBtn.disabled = true; 
    }
}