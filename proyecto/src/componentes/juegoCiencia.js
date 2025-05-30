// src/componentes/juegoCiencia.js
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const PREGUNTAS_CIENCIA = [
    // FÁCILES
    { id: "cie1", categoria: "Ciencia", subcategoria: "Astronomía", pregunta: "¿Planeta más cercano al Sol?", opciones: ["Venus", "Tierra", "Mercurio", "Marte"], respuestaCorrecta: "Mercurio", pista: "También el más pequeño.", dificultad: "facil", explicacionOpcional: "Mercurio es el planeta más interno de nuestro sistema solar." },
    { id: "cie2", categoria: "Ciencia", subcategoria: "Biología", pregunta: "¿Gas para fotosíntesis?", opciones: ["Oxígeno", "Dióxido de Carbono", "Nitrógeno", "Hidrógeno"], respuestaCorrecta: "Dióxido de Carbono", pista: "Lo exhalamos.", dificultad: "facil", explicacionOpcional: "Las plantas usan Dióxido de Carbono, agua y luz solar para crear su alimento." },
    { id: "cie8", categoria: "Ciencia", subcategoria: "Biología", pregunta: "¿Cuál es el órgano más grande del cuerpo humano?", opciones: ["Cerebro", "Hígado", "Piel", "Corazón"], respuestaCorrecta: "Piel", pista: "Nos cubre por completo.", dificultad: "facil", explicacionOpcional: "La piel es el órgano más extenso y nos protege del exterior." },
    { id: "mat_facil1", categoria: "Matemáticas", subcategoria: "Aritmética", pregunta: "¿Cuánto es 15 + 25?", opciones: ["30", "35", "40", "45"], respuestaCorrecta: "40", pista: "Suma las unidades y luego las decenas.", dificultad: "facil", explicacionOpcional: "15 + 25 = 40." },

    // MEDIAS
    { id: "cie3", categoria: "Ciencia", subcategoria: "Química", pregunta: "¿Fórmula del agua?", opciones: ["CO2", "O2", "H2O", "NaCl"], respuestaCorrecta: "H2O", pista: "Dos de un elemento, uno de otro.", dificultad: "media", explicacionOpcional: "H2O significa dos átomos de Hidrógeno y un átomo de Oxígeno." },
    { id: "cie4", categoria: "Ciencia", subcategoria: "Física", pregunta: "¿Quién formuló la ley de la gravedad?", opciones: ["Einstein", "Galileo", "Newton", "Curie"], respuestaCorrecta: "Newton", pista: "Una manzana...", dificultad: "media", explicacionOpcional: "Sir Isaac Newton es famoso por sus leyes del movimiento y la gravitación universal." },
    { id: "cie5", categoria: "Ciencia", subcategoria: "Física", pregunta: "¿Cuál es la unidad de medida de la energía en el SI?", opciones: ["Newton", "Watt", "Joule", "Pascal"], respuestaCorrecta: "Joule", pista: "También se usa para medir el trabajo.", dificultad: "media", explicacionOpcional: "El Joule (J) es la unidad del Sistema Internacional para energía, trabajo y calor." },
    { id: "cie6", categoria: "Ciencia", subcategoria: "Química", pregunta: "El componente principal del gas natural es el:", opciones: ["Propano", "Etano", "Metano", "Butano"], respuestaCorrecta: "Metano", pista: "Su fórmula química es CH4.", dificultad: "media", explicacionOpcional: "El metano (CH4) es el hidrocarburo más simple y el principal componente del gas natural." },
    { id: "mat_media1", categoria: "Matemáticas", subcategoria: "Álgebra", pregunta: "Si x + 5 = 12, ¿cuál es el valor de x?", opciones: ["5", "6", "7", "8"], respuestaCorrecta: "7", pista: "Resta 5 de ambos lados.", dificultad: "media", explicacionOpcional: "Para resolver x + 5 = 12, restamos 5 de ambos lados: x = 12 - 5, entonces x = 7." },

    // DIFÍCILES (Ejemplos, necesitarías más)
    { id: "fis_dificil1", categoria: "Ciencia", subcategoria: "Física", pregunta: "¿Cuál es la velocidad de la luz en el vacío (aproximadamente)?", opciones: ["300 km/s", "3,000 km/s", "30,000 km/s", "300,000 km/s"], respuestaCorrecta: "300,000 km/s", pista: "Es una constante fundamental en física.", dificultad: "dificil", explicacionOpcional: "La velocidad de la luz en el vacío es exactamente 299,792,458 metros por segundo, comúnmente redondeada a 300,000 km/s." },
    { id: "qui_dificil1", categoria: "Ciencia", subcategoria: "Química", pregunta: "¿Qué elemento tiene el número atómico 1?", opciones: ["Helio", "Oxígeno", "Hidrógeno", "Carbono"], respuestaCorrecta: "Hidrógeno", pista: "Es el elemento más ligero y abundante.", dificultad: "dificil", explicacionOpcional: "El Hidrógeno (H) es el primer elemento de la tabla periódica, con un protón en su núcleo." }
];

let preguntaActualCiencia = null;
let puntajeCiencia = 0;
let preguntasCienciaUsadas = [];

// ... (obtenerNuevaPreguntaCiencia como estaba) ...
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
        terminarJuegoCiencia(container, navigateTo, true);
        return;
    }
    const opcionesMezcladas = [...preguntaActualCiencia.opciones].sort(() => Math.random() - 0.5);
    container.innerHTML = `
        <div class="juego-generico-container juego-ciencia-activo animate__animated animate__fadeIn">
            <header class="juego-header">
                <h1>⚛️ Ciencia Divertida ${preguntaActualCiencia.subcategoria ? `(${preguntaActualCiencia.subcategoria})` : ''}</h1>
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
                <button id="pista-ciencia" class="btn-juego btn-advertencia">💡 Pista</button>
                <button id="siguiente-pregunta-ciencia" class="btn-juego btn-primario" style="display:none;">➡️ Siguiente</button>
            </div>
            <button id="terminar-juego-ciencia-btn" class="btn-juego btn-acento" style="margin-top:15px;">🏁 Terminar y Guardar</button>
        </div>
    `;
    document.querySelectorAll('.btn-opcion-ciencia').forEach(btn => {
        btn.onclick = () => comprobarRespuestaCiencia(btn.dataset.opcion, container, navigateTo);
    });
    document.getElementById('pista-ciencia').onclick = mostrarPistaCiencia;
    document.getElementById('siguiente-pregunta-ciencia').onclick = () => mostrarPreguntaCiencia(container, navigateTo);
    document.getElementById('terminar-juego-ciencia-btn').onclick = () => terminarJuegoCiencia(container, navigateTo, false);
}

function comprobarRespuestaCiencia(opcionSeleccionada, container, navigateTo) {
    const feedbackEl = document.getElementById('feedback-ciencia');
    const siguienteBtn = document.getElementById('siguiente-pregunta-ciencia');
    const pistaBtn = document.getElementById('pista-ciencia');
    const botonesOpcion = document.querySelectorAll('.btn-opcion-ciencia');
    if (!feedbackEl || !preguntaActualCiencia) return;
    botonesOpcion.forEach(btn => btn.disabled = true);
    if(pistaBtn) pistaBtn.style.display = 'none';

    let explicacionHTML = "";
    if (preguntaActualCiencia.explicacionOpcional) {
        explicacionHTML = `<p class="explicacion-respuesta animate__animated animate__fadeInUp">${preguntaActualCiencia.explicacionOpcional}</p>`;
    }

    if (opcionSeleccionada === preguntaActualCiencia.respuestaCorrecta) {
        puntajeCiencia += 10;
        feedbackEl.innerHTML = `<p class="feedback-mensaje correcto animate__animated animate__tada">¡Correcto! <span class="puntos-ganados">(+10 pts)</span></p>${explicacionHTML}`;
        botonesOpcion.forEach(btn => { if (btn.dataset.opcion === preguntaActualCiencia.respuestaCorrecta) btn.classList.add('opcion-correcta'); });
    } else {
        puntajeCiencia -= (puntajeCiencia >= 5 ? 5 : puntajeCiencia);
        feedbackEl.innerHTML = `<p class="feedback-mensaje incorrecto animate__animated animate__shakeX">Incorrecto. La correcta era "${preguntaActualCiencia.respuestaCorrecta}".</p>${explicacionHTML}`;
        botonesOpcion.forEach(btn => {
            if (btn.dataset.opcion === opcionSeleccionada) btn.classList.add('opcion-incorrecta');
            if (btn.dataset.opcion === preguntaActualCiencia.respuestaCorrecta) btn.classList.add('opcion-correcta-despues-fallo');
        });
    }
    const puntajeEl = document.getElementById('puntaje-ciencia-actual');
    if (puntajeEl) puntajeEl.textContent = puntajeCiencia;
    if(siguienteBtn) siguienteBtn.style.display = 'inline-block';
}

// ... (terminarJuegoCiencia, iniciarJuegoCiencia, mostrarPistaCiencia como estaban en la respuesta anterior, que ya incluyen guardado) ...
async function terminarJuegoCiencia(container, navigateTo, finPorPreguntasAgotadas = false){
    const auth = getAuth(); const user = auth.currentUser; const db = getFirestore();
    let mensajeFinal = finPorPreguntasAgotadas ? "¡Completaste todas las preguntas!" : "Juego de Ciencia Terminado";
    const controlesOriginales = container.querySelector('.controles-juego-ciencia');
    if (controlesOriginales) controlesOriginales.innerHTML = '';
    const opcionesContainer = container.querySelector('.opciones-container');
    if (opcionesContainer) opcionesContainer.style.display = 'none';
    const btnTerminarOriginal = container.querySelector('#terminar-juego-ciencia-btn');
    if(btnTerminarOriginal) btnTerminarOriginal.style.display = 'none';
    const preguntaContainer = container.querySelector('.pregunta-ciencia-container');
    if(preguntaContainer) preguntaContainer.style.display = 'none';
    const headerEl = container.querySelector('.juego-header h1');
    if(headerEl) headerEl.textContent = mensajeFinal;

    let feedbackGuardado = "";
    if (user && puntajeCiencia > 0) {
        try {
            feedbackGuardado = `<p class="info animate__animated animate__fadeIn">Guardando puntaje...</p>`;
            container.querySelector('#feedback-ciencia').innerHTML = feedbackGuardado;
            const scoresCollectionRef = collection(db, "puntajes");
            await addDoc(scoresCollectionRef, { userId: user.uid, displayName: user.displayName || user.email.split('@')[0], puntaje: puntajeCiencia, juego: "Ciencia Divertida", fecha: serverTimestamp() });
            feedbackGuardado = `<p class="feedback-mensaje correcto animate__animated animate__bounceIn">¡Puntaje de ${puntajeCiencia} guardado!</p>`;
        } catch (error) { console.error("Error guardando puntaje Ciencia: ", error); feedbackGuardado = `<p class="error-mensaje">Error al guardar.</p>`; }
    } else if (user && puntajeCiencia <= 0) { feedbackGuardado = `<p class="info">No obtuviste puntos.</p>`;
    } else if (!user) { feedbackGuardado = `<p class="error-mensaje">Logueate para guardar.</p>`; }

    const feedbackEl = container.querySelector('#feedback-ciencia');
    if (feedbackEl) {
         feedbackEl.innerHTML = `${feedbackGuardado}<p style="margin-top:1rem;">Puntaje final: <strong>${puntajeCiencia}</strong></p>`;
        const controlesFinales = document.createElement('div');
        controlesFinales.className = 'controles-juego-generico'; controlesFinales.style.marginTop = '1rem';
        controlesFinales.innerHTML = `
            <button id="btn-jugar-ciencia-otravez" class="btn-juego btn-secundario">⚛️ Jugar de Nuevo</button>
            <button id="btn-volver-selector-ciencia-final" class="btn-juego btn-primario">🎮 Volver a Juegos</button>
        `;
        feedbackEl.parentNode.insertBefore(controlesFinales, feedbackEl.nextSibling);
        document.getElementById('btn-jugar-ciencia-otravez').onclick = () => iniciarJuegoCiencia(container, navigateTo);
        document.getElementById('btn-volver-selector-ciencia-final').onclick = () => navigateTo('selectorJuegos');
    }
}

export function iniciarJuegoCiencia(appContainer, navigateTo) {
    puntajeCiencia = 0; 
    preguntasCienciaUsadas = [];
    mostrarPreguntaCiencia(appContainer, navigateTo);
}

function mostrarPistaCiencia() {
    const feedbackEl = document.getElementById('feedback-ciencia');
    const pistaBtn = document.getElementById('pista-ciencia');
    if (preguntaActualCiencia && preguntaActualCiencia.pista) {
        feedbackEl.innerHTML = `<p class="feedback-mensaje info animate__animated animate__fadeInUp"><strong>Pista:</strong> ${preguntaActualCiencia.pista}</p>`;
        puntajeCiencia -= (puntajeCiencia >= 2 ? 2 : 0);
        document.getElementById('puntaje-ciencia-actual').textContent = puntajeCiencia;
        if(pistaBtn) pistaBtn.disabled = true;
    }
}