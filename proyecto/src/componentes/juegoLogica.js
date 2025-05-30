// src/componentes/juegoLogica.js
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const PREGUNTAS_LOGICA = [
    // Acertijos de Texto
    { id: "log1", tipo: "acertijo_texto", pregunta: "Tiene ciudades, pero no casas. Tiene montañas, pero no árboles. Tiene agua, pero no peces. ¿Qué es?", respuesta: "un mapa", pista: "Es algo que usas para orientarte.", dificultad: "media" },
    { id: "log4", tipo: "acertijo_texto", pregunta: "Soy alto cuando soy joven y corto cuando soy viejo. ¿Qué soy?", respuesta: "una vela", pista: "Me encienden y me consumo.", dificultad: "media" },
    { id: "log8", tipo: "acertijo_clasico", pregunta: "¿Qué tiene un ojo pero no puede ver?", respuesta: "una aguja", pista: "Se usa para coser.", dificultad: "facil" },
    { id: "log9", tipo: "acertijo_texto", pregunta: "Entra duro y brillante, sale blando y mojado. ¿Qué es?", respuesta: "un fideo", pista: "Se cocina en agua caliente.", dificultad: "media" },
    { id: "log10", tipo: "acertijo_texto", pregunta: "¿Qué sube pero nunca baja?", respuesta: "tu edad", pista: "Aumenta cada año.", dificultad: "facil" },

    // Secuencias
    { id: "log2", tipo: "secuencia_numerica", pregunta: "Continúa la secuencia: 2, 4, 8, 16, ___", respuesta: "32", pista: "Cada número es el doble del anterior.", dificultad: "facil" },
    { id: "log7", tipo: "secuencia_letras", pregunta: "Continúa la secuencia: A, C, F, J, O, ___", respuesta: "u", pista: "La distancia entre las letras aumenta: +2, +3, +4, +5...", dificultad: "dificil" },
    { id: "log11", tipo: "secuencia_numerica", pregunta: "Continúa la secuencia: 1, 1, 2, 3, 5, 8, ___", respuesta: "13", pista: "Es una secuencia famosa donde cada número es la suma de los dos anteriores.", dificultad: "media" },
    { id: "log12", tipo: "secuencia_simbolos", pregunta: "Continúa la secuencia: O, T, T, F, F, S, S, E, ___ (Iniciales de números en inglés)", respuesta: "n", pista: "One, Two, Three, Four...", dificultad: "dificil" },

    // Lógica Deductiva / Problemas
    { id: "log3", tipo: "logica_deductiva", pregunta: "Si todos los Zigs son Zags y algunos Zags son Zoogs, ¿podemos asegurar que algunos Zigs son Zoogs? (sí/no)", respuesta: "no", pista: "Piensa en conjuntos. No todos los Zags son Zigs.", dificultad: "dificil" },
    { id: "log5", tipo: "acertijo_matematico", pregunta: "Un granjero tiene 17 ovejas. Todas menos nueve murieron. ¿Cuántas ovejas vivas le quedan?", respuesta: "9", pista: "Lee con atención: 'Todas MENOS nueve...'", dificultad: "media" },
    { id: "log13", tipo: "problema_logico", pregunta: "Un caracol está en el fondo de un pozo de 30 metros. Cada día sube 3 metros, pero por la noche resbala y baja 2 metros. ¿Cuántos días tardará en salir del pozo?", respuesta: "28", pista: "El último día, cuando llega a la cima, ya no resbala.", dificultad: "dificil" },

    // Lógica de Programación Conceptual
    { id: "log6", tipo: "logica_programacion", pregunta: "En programación, ¿qué se usa para repetir un bloque de código varias veces?", respuesta: "un bucle", opcionesFalsas: ["una condicion", "una variable", "una funcion"], pista: "Puede ser 'for' o 'while'.", dificultad: "facil" },
    { id: "log14", tipo: "logica_programacion", pregunta: "Si una variable 'edad' es 18, y la condición es 'edad >= 18', ¿la condición es verdadera o falsa?", respuesta: "verdadera", opcionesFalsas: ["falsa"], pista: ">= significa 'mayor o igual que'.", dificultad: "facil" },
    { id: "log15", tipo: "logica_programacion", pregunta: "¿Cuál es el propósito principal de una función en programación?", respuesta: "reutilizar codigo", opcionesFalsas: ["almacenar datos", "mostrar errores", "crear interfaces"], pista: "Evita escribir el mismo código una y otra vez.", dificultad: "media" },

    // Matemáticas (Álgebra simple)
    { id: "mat1", categoria: "Matemáticas", subcategoria: "Álgebra", pregunta: "Si 2x + 4 = 10, ¿cuál es el valor de x?", respuesta: "3", pista: "Primero resta 4, luego divide entre 2.", dificultad: "facil" },
    { id: "mat2", categoria: "Matemáticas", subcategoria: "Álgebra", pregunta: "Si y/3 = 5, ¿cuál es el valor de y?", respuesta: "15", pista: "Multiplica ambos lados por 3.", dificultad: "facil" },
    { id: "mat3", categoria: "Matemáticas", subcategoria: "Álgebra", pregunta: "Expande la expresión: 3(a + 2b)", respuesta: "3a + 6b", pista: "Propiedad distributiva.", dificultad: "media" }
];

let preguntaActualLogica = null;
let puntajeLogica = 0;
let preguntasLogicaUsadas = [];

function obtenerNuevaPreguntaLogica() {
    let preguntasDisponibles = PREGUNTAS_LOGICA.filter(p => !preguntasLogicaUsadas.includes(p.id));
    if (preguntasDisponibles.length === 0) {
        preguntasLogicaUsadas = []; // Reiniciar si se acaban
        preguntasDisponibles = PREGUNTAS_LOGICA;
        if (preguntasDisponibles.length === 0) return null; // No hay preguntas
    }
    const indiceAleatorio = Math.floor(Math.random() * preguntasDisponibles.length);
    const nuevaPregunta = preguntasDisponibles[indiceAleatorio];
    preguntasLogicaUsadas.push(nuevaPregunta.id);
    return nuevaPregunta;
}

function mostrarPreguntaLogica(container, navigateTo) {
    preguntaActualLogica = obtenerNuevaPreguntaLogica();
    if (!preguntaActualLogica) {
        terminarJuegoLogica(container, navigateTo, true); // true = fin por agotar preguntas
        return;
    }

    // Determinar el tipo de input basado en preguntaActualLogica.tipo o opcionesFalsas
    let inputHTML = `<input type="text" id="respuesta-logica" placeholder="Escribe tu respuesta aquí..." autofocus>`;
    if (preguntaActualLogica.opcionesFalsas) { // Si tiene opciones, es opción múltiple conceptual
        const todasOpciones = [preguntaActualLogica.respuesta, ...preguntaActualLogica.opcionesFalsas].sort(() => Math.random() - 0.5);
        inputHTML = `<div class="opciones-logica-container">
            ${todasOpciones.map((op, idx) => `<button class="btn-opcion-logica" data-respuesta="${op}">${String.fromCharCode(65 + idx)}. ${op}</button>`).join('')}
        </div>`;
    }

    container.innerHTML = `
        <div class="juego-generico-container juego-logica-activo animate__animated animate__fadeIn">
            <header class="juego-header">
                <h1>🧠 Lógica y Acertijos ${preguntaActualLogica.subcategoria ? `(${preguntaActualLogica.subcategoria})` : ''}</h1>
                <div class="puntaje-juego-logica">Puntos: <span id="puntaje-logica-actual">${puntajeLogica}</span></div>
            </header>
            <div class="pregunta-logica-container">
                <p class="pregunta-texto">${preguntaActualLogica.pregunta}</p>
                ${inputHTML}
            </div>
            <div id="feedback-logica" class="feedback-container"></div>
            <div class="controles-juego-logica">
                ${!preguntaActualLogica.opcionesFalsas ? '<button id="comprobar-logica" class="btn-juego btn-secundario">✔️ Comprobar</button>' : ''}
                <button id="pista-logica" class="btn-juego btn-advertencia">💡 Pista</button>
                <button id="siguiente-pregunta-logica" class="btn-juego btn-primario" style="display:none;">➡️ Siguiente</button>
            </div>
            <button id="terminar-juego-logica-btn" class="btn-juego btn-acento" style="margin-top:15px;">🏁 Terminar y Guardar</button>
        </div>
    `;

    if (!preguntaActualLogica.opcionesFalsas) {
        document.getElementById('comprobar-logica').onclick = () => comprobarRespuestaLogica(container, navigateTo);
        const respuestaInput = document.getElementById('respuesta-logica');
        if (respuestaInput) {
            respuestaInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') comprobarRespuestaLogica(container, navigateTo);
            });
        }
    } else {
        document.querySelectorAll('.btn-opcion-logica').forEach(btn => {
            btn.onclick = () => comprobarRespuestaLogica(container, navigateTo, btn.dataset.respuesta);
        });
    }

    document.getElementById('pista-logica').onclick = mostrarPistaLogica;
    document.getElementById('siguiente-pregunta-logica').onclick = () => mostrarPreguntaLogica(container, navigateTo);
    document.getElementById('terminar-juego-logica-btn').onclick = () => terminarJuegoLogica(container, navigateTo, false);
}

function normalizarRespuesta(texto) {
    if (typeof texto !== 'string') texto = String(texto); // Convertir números a string para normalizar
    return texto.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function comprobarRespuestaLogica(container, navigateTo, respuestaUsuarioDada = null) {
    const feedbackEl = document.getElementById('feedback-logica');
    const comprobarBtn = document.getElementById('comprobar-logica'); // Puede no existir para opción múltiple
    const siguienteBtn = document.getElementById('siguiente-pregunta-logica');
    const pistaBtn = document.getElementById('pista-logica');
    const opcionesBtns = document.querySelectorAll('.btn-opcion-logica');

    if (!feedbackEl || !preguntaActualLogica) return;

    let respuestaUsuario;
    if (respuestaUsuarioDada !== null) { // Opción múltiple
        respuestaUsuario = normalizarRespuesta(respuestaUsuarioDada);
        opcionesBtns.forEach(btn => btn.disabled = true);
    } else { // Input de texto
        const respuestaUsuarioEl = document.getElementById('respuesta-logica');
        if (!respuestaUsuarioEl) return;
        respuestaUsuario = normalizarRespuesta(respuestaUsuarioEl.value);
        if (respuestaUsuario === "") {
            feedbackEl.innerHTML = `<p class="feedback-mensaje incorrecto animate__animated animate__headShake">Escribe una respuesta.</p>`;
            return;
        }
        if(respuestaUsuarioEl) respuestaUsuarioEl.disabled = true;
    }
    
    const respuestaCorrecta = normalizarRespuesta(preguntaActualLogica.respuesta);

    if (respuestaUsuario === respuestaCorrecta) {
        puntajeLogica += 10;
        feedbackEl.innerHTML = `<p class="feedback-mensaje correcto animate__animated animate__tada">¡Correcto! <span class="puntos-ganados">(+10 pts)</span></p>`;
        if (preguntaActualLogica.opcionesFalsas) { // Marcar opción correcta
            opcionesBtns.forEach(btn => { if(normalizarRespuesta(btn.dataset.respuesta) === respuestaCorrecta) btn.classList.add('opcion-correcta'); });
        }
    } else {
        puntajeLogica -= (puntajeLogica >= 5 ? 5 : puntajeLogica);
        feedbackEl.innerHTML = `<p class="feedback-mensaje incorrecto animate__animated animate__shakeX">Incorrecto. La respuesta era: "${preguntaActualLogica.respuesta}".</p>`;
        if (preguntaActualLogica.opcionesFalsas) { // Marcar opción incorrecta y correcta
             opcionesBtns.forEach(btn => {
                if(normalizarRespuesta(btn.dataset.respuesta) === respuestaUsuario) btn.classList.add('opcion-incorrecta');
                if(normalizarRespuesta(btn.dataset.respuesta) === respuestaCorrecta) btn.classList.add('opcion-correcta-despues-fallo');
            });
        }
    }

    if(comprobarBtn) comprobarBtn.style.display = 'none';
    if(pistaBtn) pistaBtn.style.display = 'none';
    if(siguienteBtn) siguienteBtn.style.display = 'inline-block';
    
    const puntajeEl = document.getElementById('puntaje-logica-actual');
    if (puntajeEl) puntajeEl.textContent = puntajeLogica;
}

// ... (terminarJuegoLogica y mostrarPistaLogica se mantienen como en la versión anterior) ...
// ... (iniciarJuegoLogica se mantiene como en la versión anterior) ...

async function terminarJuegoLogica(container, navigateTo, finPorPreguntasAgotadas = false){
    const auth = getAuth(); const user = auth.currentUser; const db = getFirestore();
    let mensajeFinal = finPorPreguntasAgotadas ? "¡Completaste todas las preguntas!" : "Juego de Lógica Terminado";
    const controlesOriginales = container.querySelector('.controles-juego-logica');
    if (controlesOriginales) controlesOriginales.innerHTML = '';
    const inputRespuesta = container.querySelector('#respuesta-logica');
    if (inputRespuesta) inputRespuesta.style.display = 'none';
    const opcionesContainerLogica = container.querySelector('.opciones-logica-container');
    if(opcionesContainerLogica) opcionesContainerLogica.style.display = 'none';
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
        feedbackEl.parentNode.insertBefore(controlesFinales, feedbackEl.nextSibling); 
        document.getElementById('btn-jugar-logica-otravez').onclick = () => iniciarJuegoLogica(container, navigateTo);
        document.getElementById('btn-volver-selector-logica-final').onclick = () => navigateTo('selectorJuegos');
    }
}

export function iniciarJuegoLogica(appContainer, navigateTo) {
    puntajeLogica = 0; 
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