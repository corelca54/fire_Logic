// src/componentes/juego.js

import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let mazoJuegoId = null;
let puntuacion = 0;
let juegoActual = null;

// No se necesita appDiv global aquí si se maneja dentro de iniciarJuego

async function iniciarJuego() {
  const auth = getAuth();
  const user = auth.currentUser;
  const currentAppDiv = document.getElementById('app'); // Obtener appDiv aquí

  if (!currentAppDiv) {
    console.error("Contenedor #app no encontrado al iniciar el juego.");
    return;
  }

  if (!user) {
    currentAppDiv.innerHTML = `<p class="aviso-login">Debes <a href="#" onclick="event.preventDefault(); window.navigateTo('login');">iniciar sesión</a> para jugar y guardar tus puntajes.</p>`;
    // Asumimos que navigateTo está disponible globalmente o a través de window si es necesario
    return;
  }

  currentAppDiv.setAttribute('data-pantalla', 'juego');
  puntuacion = 0;
  
  currentAppDiv.innerHTML = `
    <div class="juego-container animate__animated animate__fadeInUp">
      <div class="puntuacion-container">
        <span class="puntuacion-emoji">⭐</span> Puntos: <span id="puntuacion-actual" class="puntuacion-valor">${puntuacion}</span>
      </div>
      <div class="cartas-juego">
        <div class="carta-juego-wrapper"><div class="carta-juego" id="carta1-juego"><div class="carta-placeholder"></div></div></div>
        <div class="operacion" id="operacion-simbolo">+</div>
        <div class="carta-juego-wrapper"><div class="carta-juego" id="carta2-juego"><div class="carta-placeholder"></div></div></div>
        <div class="igual">=</div>
        <input type="number" id="respuesta-juego" placeholder="?" autofocus>
      </div>
      <div id="feedback-juego" class="feedback-container"></div>
      <div class="controles-juego">
        <button id="comprobar-juego" class="btn-juego btn-secundario">✅ Comprobar</button>
        <button id="siguiente-ronda-juego" class="btn-juego btn-primario">🔄 Siguiente</button> 
        <button id="terminar-juego-btn" class="btn-juego btn-acento">🏁 Terminar y Guardar</button>
      </div>
      <div id="leaderboard-juego-container" class="leaderboard-container" style="margin-top:1.5rem;"></div>
    </div>
  `;

  document.getElementById('comprobar-juego').addEventListener('click', comprobarRespuesta);
  document.getElementById('siguiente-ronda-juego').addEventListener('click', nuevaRonda);
  document.getElementById('terminar-juego-btn').addEventListener('click', terminarYGuardarPuntaje);
  const respuestaJuegoInput = document.getElementById('respuesta-juego');
  if (respuestaJuegoInput) {
    respuestaJuegoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') comprobarRespuesta();
    });
  }

  await nuevaRonda();
  await mostrarMejoresPuntajesJuego();
}

// ... (nuevaRonda, obtenerValorNumerico, comprobarRespuesta, animarPuntuacion, lanzarConfeti se mantienen como en la versión anterior que te di con esas mejoras)
// Asegúrate de que esas funciones estén aquí. Reemplazaré solo las que necesitan cambio de Firebase.

async function nuevaRonda() {
  const feedbackDiv = document.getElementById('feedback-juego');
  const respuestaInput = document.getElementById('respuesta-juego');
  const comprobarBtn = document.getElementById('comprobar-juego');
  const carta1El = document.getElementById('carta1-juego');
  const carta2El = document.getElementById('carta2-juego');

  if (carta1El) carta1El.parentElement.classList.remove('carta-correcta', 'carta-incorrecta', 'animate__animated', 'animate__pulse', 'animate__shakeX');
  if (carta2El) carta2El.parentElement.classList.remove('carta-correcta', 'carta-incorrecta', 'animate__animated', 'animate__pulse', 'animate__shakeX');

  if (!feedbackDiv || !respuestaInput || !comprobarBtn || !carta1El || !carta2El) {
    console.error("Elementos de la UI del juego no encontrados en nuevaRonda.");
    return;
  }
  feedbackDiv.innerHTML = '';
  respuestaInput.value = '';
  respuestaInput.disabled = false;
  respuestaInput.className = ''; 
  comprobarBtn.disabled = false;
  respuestaInput.focus();
  
  carta1El.innerHTML = '<div class="carta-placeholder">Cargando...</div>';
  carta2El.innerHTML = '<div class="carta-placeholder">Cargando...</div>';
  if(carta1El.parentElement) carta1El.parentElement.classList.add('animate__animated', 'animate__fadeInUp'); 
  if(carta2El.parentElement) carta2El.parentElement.classList.add('animate__animated', 'animate__fadeInUp');

  try {
    if (!mazoJuegoId) {
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
      const data = await response.json();
      if (!data.success) throw new Error("No se pudo crear el mazo desde la API.");
      mazoJuegoId = data.deck_id;
    }
    let mazoInfo = await fetch(`https://deckofcardsapi.com/api/deck/${mazoJuegoId}/`);
    let mazoData = await mazoInfo.json();
    if (!mazoData.success && mazoData.error && mazoData.error.includes("Deck ID does not exist")) {
        mazoJuegoId = null; 
        await nuevaRonda();
        return;
    }
    if (mazoData.remaining < 2) {
        await fetch(`https://deckofcardsapi.com/api/deck/${mazoJuegoId}/shuffle/`);
    }
    const drawResponse = await fetch(`https://deckofcardsapi.com/api/deck/${mazoJuegoId}/draw/?count=2`);
    const drawData = await drawResponse.json();
    if (!drawData.success || drawData.cards.length < 2) {
      mazoJuegoId = null; 
      feedbackDiv.innerHTML = `<p class="error-mensaje">Problema con las cartas, intentando de nuevo...</p>`;
      setTimeout(nuevaRonda, 1500); 
      return;
    }
    const [carta1Api, carta2Api] = drawData.cards;
    let valor1 = obtenerValorNumerico(carta1Api.value);
    let valor2 = obtenerValorNumerico(carta2Api.value);
    const operaciones = [
      { simbolo: '+', calcular: (a, b) => a + b, nombre: 'suma' },
      { simbolo: '-', calcular: (a, b) => a - b, nombre: 'resta' },
      { simbolo: '×', calcular: (a, b) => a * b, nombre: 'multiplicación' }
    ];
    let operacionSeleccionada = operaciones[Math.floor(Math.random() * operaciones.length)];
    let resultado;
    let c1 = carta1Api, v1 = valor1, c2 = carta2Api, v2 = valor2;
    if (operacionSeleccionada.nombre === 'resta' && v1 < v2) {
      [v1, v2] = [v2, v1]; [c1, c2] = [carta2Api, carta1Api];
    }
    resultado = operacionSeleccionada.calcular(v1, v2);
    setTimeout(() => {
        if (carta1El) {
            carta1El.innerHTML = `<img src="${c1.image}" alt="${c1.code}"><div class="valor-carta">${v1}</div>`;
            if(carta1El.parentElement) carta1El.parentElement.classList.remove('animate__fadeInUp');
        }
        if (carta2El) {
            carta2El.innerHTML = `<img src="${c2.image}" alt="${c2.code}"><div class="valor-carta">${v2}</div>`;
            if(carta2El.parentElement) carta2El.parentElement.classList.remove('animate__fadeInUp');
        }
    }, 300);
    const operacionEl = document.getElementById('operacion-simbolo');
    if (operacionEl) operacionEl.textContent = operacionSeleccionada.simbolo;
    juegoActual = { valor1: v1, valor2: v2, operacion: operacionSeleccionada, resultado };
  } catch (error) {
    console.error('Error en nuevaRonda:', error);
    if (feedbackDiv) feedbackDiv.innerHTML = `<p class="error-mensaje">¡Oops! Algo salió mal (${error.message}). Pulsa "Siguiente".</p>`;
    if (comprobarBtn) comprobarBtn.disabled = true;
    if (respuestaInput) respuestaInput.disabled = true;
  }
}

function obtenerValorNumerico(valorCarta) {
  const valores = { 'ACE': 1, 'KING': 13, 'QUEEN': 12, 'JACK': 11 };
  return valores[valorCarta] || parseInt(valorCarta);
}

function comprobarRespuesta() {
  const respuestaInput = document.getElementById('respuesta-juego');
  const feedbackDiv = document.getElementById('feedback-juego');
  const comprobarBtn = document.getElementById('comprobar-juego');
  const carta1Wrapper = document.getElementById('carta1-juego')?.parentElement;
  const carta2Wrapper = document.getElementById('carta2-juego')?.parentElement;

  if (!respuestaInput || !feedbackDiv || !comprobarBtn || !juegoActual) { return; }
  const respuestaUsuario = parseInt(respuestaInput.value);
  if (isNaN(respuestaUsuario)) {
    feedbackDiv.innerHTML = '<p class="feedback-mensaje incorrecto animate__animated animate__headShake">¡Escribe un número!</p>';
    respuestaInput.classList.add('input-error');
    respuestaInput.focus();
    return;
  }
  respuestaInput.classList.remove('input-error');
  if (respuestaUsuario === juegoActual.resultado) {
    puntuacion += 10;
    feedbackDiv.innerHTML = `<p class="feedback-mensaje correcto animate__animated animate__tada">¡Excelente! ${juegoActual.valor1} ${juegoActual.operacion.simbolo} ${juegoActual.valor2} = ${juegoActual.resultado}. <span class="puntos-ganados">(+10 pts ⭐)</span></p>`;
    animarPuntuacion();
    if (carta1Wrapper) carta1Wrapper.classList.add('carta-correcta', 'animate__animated', 'animate__pulse');
    if (carta2Wrapper) carta2Wrapper.classList.add('carta-correcta', 'animate__animated', 'animate__pulse');
    if (puntuacion > 0 && puntuacion % 50 === 0) {
      feedbackDiv.innerHTML += '<p class="racha animate__animated animate__flash">¡Racha mágica! 🔥</p>';
      lanzarConfeti();
    }
    comprobarBtn.disabled = true; 
    respuestaInput.disabled = true;
    setTimeout(nuevaRonda, 2500);
  } else {
    puntuacion -= 5;
    if (puntuacion < 0) puntuacion = 0; 
    animarPuntuacion(false);
    let pista = respuestaUsuario < juegoActual.resultado ? 'Un poco más alto...' : 'Un poco más bajo...';
    feedbackDiv.innerHTML = `
      <p class="feedback-mensaje incorrecto animate__animated animate__shakeX">¡Casi! ${pista}</p>
      <p class="info-ayuda">La respuesta correcta era ${juegoActual.resultado} ( ${juegoActual.valor1} ${juegoActual.operacion.simbolo} ${juegoActual.valor2} )</p>
      `;
      // <button id="btn-pista-juego" class="btn-juego btn-pista">💡 Pista (Próxima)</button> // Botón de pista futuro
    if (carta1Wrapper) carta1Wrapper.classList.add('carta-incorrecta');
    if (carta2Wrapper) carta2Wrapper.classList.add('carta-incorrecta');
    respuestaInput.classList.add('input-error');
    respuestaInput.focus();
    respuestaInput.select();
  }
  const puntuacionActualEl = document.getElementById('puntuacion-actual');
  if (puntuacionActualEl) puntuacionActualEl.textContent = puntuacion;
}

function animarPuntuacion(incremento = true) {
    const puntuacionEl = document.getElementById('puntuacion-actual');
    if (puntuacionEl) {
        puntuacionEl.classList.add('animate__animated', incremento ? 'animate__bounceIn' : 'animate__shakeY');
        setTimeout(() => {
            puntuacionEl.classList.remove('animate__animated', 'animate__bounceIn', 'animate__shakeY');
        }, 1000);
    }
}
function lanzarConfeti() {
    const gameContainer = document.querySelector('.juego-container');
    if (!gameContainer) return;
    for (let i = 0; i < 30; i++) {
        const confeti = document.createElement('div');
        confeti.className = 'confetti-piece';
        confeti.style.left = Math.random() * 100 + '%';
        confeti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        confeti.style.animationDuration = (Math.random() * 1.5 + 1) + 's'; // Duración 1-2.5s
        confeti.style.animationDelay = Math.random() * 0.3 + 's';
        gameContainer.appendChild(confeti);
        setTimeout(() => confeti.remove(), 2500); // Limpiar
    }
}

async function terminarYGuardarPuntaje() {
  const auth = getAuth(); // Obtener instancia de Auth
  const user = auth.currentUser;
  const db = getFirestore(); // Obtener instancia de Firestore

  const feedbackDiv = document.getElementById('feedback-juego');
  const controles = document.querySelector('.controles-juego');

  if (!feedbackDiv) return;

  if (controles) {
    Array.from(controles.children).forEach(btn => {
        if (btn.id !== 'jugar-de-nuevo-btn') btn.disabled = true;
    });
  }

  if (user && puntuacion > 0) {
    try {
      feedbackDiv.innerHTML = `<p class="info">Guardando tu brillante puntaje...</p>`;
      const scoresCollectionRef = collection(db, "puntajes");
      await addDoc(scoresCollectionRef, {
        userId: user.uid,
        displayName: user.displayName || user.email.split('@')[0],
        puntaje: puntuacion,
        juego: "Operaciones con Cartas",
        fecha: serverTimestamp()
      });
      feedbackDiv.innerHTML = `<p class="feedback-mensaje correcto animate__animated animate__bounceIn">¡Puntaje de ${puntuacion} guardado con éxito! 🎉</p>`;
      await mostrarMejoresPuntajesJuego(); 
    } catch (error) {
      console.error("Error al guardar puntaje: ", error);
      feedbackDiv.innerHTML = `<p class="error-mensaje">Error al guardar tu puntaje. Revisa tu conexión.</p>`;
    }
  } else if (user && puntuacion <= 0) {
    feedbackDiv.innerHTML = `<p class="info">No obtuviste puntos en esta sesión. ¡Inténtalo de nuevo!</p>`;
  } else {
    feedbackDiv.innerHTML = `<p class="error-mensaje">Debes estar logueado para guardar puntajes.</p>`;
  }
  
  if(controles) {
    let jugarDeNuevoBtn = document.getElementById('jugar-de-nuevo-btn');
    if (!jugarDeNuevoBtn) {
        jugarDeNuevoBtn = document.createElement('button');
        jugarDeNuevoBtn.id = 'jugar-de-nuevo-btn';
        jugarDeNuevoBtn.className = 'btn-juego btn-primario'; // Reutilizar estilo
        jugarDeNuevoBtn.innerHTML = '🚀 Jugar de Nuevo';
        jugarDeNuevoBtn.onclick = iniciarJuego; 
        // Insertar antes del botón de terminar si aún existe o al final
        const terminarBtn = document.getElementById('terminar-juego-btn');
        if(terminarBtn) controles.insertBefore(jugarDeNuevoBtn, terminarBtn.nextSibling);
        else controles.appendChild(jugarDeNuevoBtn);
    }
    jugarDeNuevoBtn.disabled = false;
  }
}

async function mostrarMejoresPuntajesJuego() {
  const db = getFirestore(); // Obtener instancia de Firestore
  const leaderboardContainer = document.getElementById('leaderboard-juego-container');
  if (!leaderboardContainer) return;

  leaderboardContainer.innerHTML = '<h4 style="margin-bottom:0.5rem; color:var(--color-primario);">🏆 Salón de la Fama (Operaciones) 🏆</h4>';
  const ul = document.createElement('ul');
  ul.className = 'leaderboard-lista'; // Asegúrate de tener estilos para esto

  try {
    const scoresQuery = query(
      collection(db, "puntajes"),
      where("juego", "==", "Operaciones con Cartas"), // Filtrar por este juego
      orderBy("puntaje", "desc"),
      limit(5) 
    );
    const querySnapshot = await getDocs(scoresQuery);
    
    if (querySnapshot.empty) {
      ul.innerHTML = '<li>¡Sé el primero en dejar tu marca!</li>';
    } else {
      querySnapshot.forEach((doc, index) => {
        const data = doc.data();
        const li = document.createElement('li');
        const fechaFormat = data.fecha ? new Date(data.fecha.seconds * 1000).toLocaleDateString() : '-';
        li.innerHTML = `<span class="rank">${index + 1}.</span> <span class="name">${data.displayName}</span>: <strong class="score">${data.puntaje} pts</strong> <small class="date">(${fechaFormat})</small>`;
        ul.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Error al obtener puntajes: ", error);
    ul.innerHTML = '<li>Error al cargar el salón de la fama.</li>';
  }
  leaderboardContainer.appendChild(ul);
}

export { iniciarJuego };