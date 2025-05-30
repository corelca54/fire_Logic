// juego.js

// Importaciones de Firebase (asegúrate que tu firebaseConfig.js esté bien configurado e inicializado)
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let mazoJuegoId = null;
let puntuacion = 0; // Puntuación de la sesión actual
let juegoActual = null; // { valor1, valor2, operacion, resultado }
let authInstance; // Almacenará la instancia de getAuth()
let dbInstance;   // Almacenará la instancia de getFirestore()

const appDiv = document.getElementById('app'); // Definir una vez

// Función de inicialización del módulo de juego (llamarla una vez)
function inicializarModuloJuego() {
  authInstance = getAuth();
  dbInstance = getFirestore(); // Asume que Firebase App ya está inicializada
  console.log("Módulo de juego inicializado con Firebase.");
}

// LLAMAR A LA INICIALIZACIÓN DEL MODULO:
// Esto debería ocurrir cuando tu app carga este script, o antes de llamar a iniciarJuego por primera vez.
// Si main.js importa juego.js, puedes ponerlo al final de este archivo o en main.js.
// Por simplicidad, lo llamamos aquí, pero considera el flujo de tu app.
inicializarModuloJuego();


async function iniciarJuego() {
  // Asegurarse que el usuario esté logueado para jugar
  const user = authInstance.currentUser;
  if (!user) {
    appDiv.innerHTML = `<p class="aviso-login">Debes <a href="#login">iniciar sesión</a> para jugar y guardar tus puntajes.</p>`;
    // Aquí podrías tener una lógica para mostrar el login si no estás usando un router que ya lo maneje
    return;
  }

  appDiv.setAttribute('data-pantalla', 'juego'); // Para estilos CSS específicos
  puntuacion = 0; // Reiniciar puntuación para una nueva sesión de juego
  
  appDiv.innerHTML = `
    <div class="juego-container">
      <div class="puntaje">⭐ Puntos: <span id="puntuacion-actual">${puntuacion}</span></div>
      
      <div class="cartas-juego">
        <div class="carta-juego" id="carta1-juego">
          <!-- El contenido se llenará dinámicamente -->
        </div>
        <div class="operacion" id="operacion-simbolo">+</div>
        <div class="carta-juego" id="carta2-juego">
          <!-- El contenido se llenará dinámicamente -->
        </div>
        <div class="igual">=</div>
        <input type="number" id="respuesta-juego" placeholder="?" autofocus>
      </div>
      
      <div id="feedback-juego"></div>
      
      <div class="controles-juego">
        <button id="comprobar-juego">✅ Comprobar</button>
        <button id="siguiente-ronda-juego">🔄 Siguiente</button> 
        <button id="terminar-juego-btn">🏁 Terminar y Guardar</button>
      </div>
      <div id="leaderboard-juego-container" class="leaderboard-container"></div>
    </div>
  `;

  document.getElementById('comprobar-juego').addEventListener('click', comprobarRespuesta);
  document.getElementById('siguiente-ronda-juego').addEventListener('click', () => {
    // Podrías penalizar si saltan rondas sin intentar, o simplemente pasar a la siguiente.
    nuevaRonda();
  });
  document.getElementById('terminar-juego-btn').addEventListener('click', terminarYGuardarPuntaje);
  document.getElementById('respuesta-juego').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') comprobarRespuesta();
  });

  await nuevaRonda(); // Iniciar la primera ronda
  await mostrarMejoresPuntajesJuego(); // Mostrar leaderboard al iniciar
}

async function nuevaRonda() {
  const feedbackDiv = document.getElementById('feedback-juego');
  const respuestaInput = document.getElementById('respuesta-juego');
  const comprobarBtn = document.getElementById('comprobar-juego');

  feedbackDiv.innerHTML = '';
  respuestaInput.value = '';
  respuestaInput.disabled = false;
  comprobarBtn.disabled = false;
  respuestaInput.focus();

  try {
    if (!mazoJuegoId) {
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
      const data = await response.json();
      if (!data.success) throw new Error("No se pudo crear el mazo desde la API.");
      mazoJuegoId = data.deck_id;
      console.log("Nuevo mazo creado:", mazoJuegoId);
    }
    
    // Verificar cartas restantes y barajar si es necesario
    let mazoInfo = await fetch(`https://deckofcardsapi.com/api/deck/${mazoJuegoId}/`);
    let mazoData = await mazoInfo.json();
    if (mazoData.remaining < 2) {
        console.log("Pocas cartas, barajando mazo:", mazoJuegoId);
        await fetch(`https://deckofcardsapi.com/api/deck/${mazoJuegoId}/shuffle/`);
        // Podrías también optar por crear un mazo nuevo si el actual da problemas recurrentes.
        // mazoJuegoId = null; // Forzaría la creación de un nuevo mazo en la siguiente llamada
        // await nuevaRonda();
        // return;
    }

    const drawResponse = await fetch(`https://deckofcardsapi.com/api/deck/${mazoJuegoId}/draw/?count=2`);
    const drawData = await drawResponse.json();

    if (!drawData.success || drawData.cards.length < 2) {
      console.error('Error al sacar cartas, intentando con nuevo mazo:', drawData.error);
      mazoJuegoId = null; // Forzar la creación de un nuevo mazo
      feedbackDiv.innerHTML = `<p class="error">Problema con las cartas, intentando de nuevo...</p>`;
      setTimeout(nuevaRonda, 1000); // Reintentar con un nuevo mazo
      return;
    }
    const [carta1Api, carta2Api] = drawData.cards;
    
    let valor1 = obtenerValorNumerico(carta1Api.value);
    let valor2 = obtenerValorNumerico(carta2Api.value);
    
    const operaciones = [
      { simbolo: '+', calcular: (a, b) => a + b, nombre: 'suma' },
      { simbolo: '-', calcular: (a, b) => a - b, nombre: 'resta' },
      { simbolo: '×', calcular: (a, b) => a * b, nombre: 'multiplicación' }
      // Podríamos añadir división si nos aseguramos de que sea exacta.
    ];
    
    let operacionSeleccionada = operaciones[Math.floor(Math.random() * operaciones.length)];
    let resultado;
    let c1 = carta1Api;
    let v1 = valor1;
    let c2 = carta2Api;
    let v2 = valor2;

    // Para restas, asegurar que el primer número sea mayor o igual para evitar resultados negativos (simplificación)
    if (operacionSeleccionada.nombre === 'resta' && valor1 < valor2) {
      // Intercambiamos valores y cartas para la visualización y el cálculo
      [v1, v2] = [valor2, valor1];
      [c1, c2] = [carta2Api, carta1Api];
    }
    resultado = operacionSeleccionada.calcular(v1, v2);
    
    document.getElementById('carta1-juego').innerHTML = `
      <img src="${c1.image}" alt="${c1.code}">
      <div class="valor-carta">${v1}</div>`;
    document.getElementById('carta2-juego').innerHTML = `
      <img src="${c2.image}" alt="${c2.code}">
      <div class="valor-carta">${v2}</div>`;
    
    document.getElementById('operacion-simbolo').textContent = operacionSeleccionada.simbolo;
    
    juegoActual = { valor1: v1, valor2: v2, operacion: operacionSeleccionada, resultado };
    
  } catch (error) {
    console.error('Error en nuevaRonda:', error);
    feedbackDiv.innerHTML = `<p class="error">¡Oops! Algo salió mal con las cartas mágicas (${error.message}). Intenta recargar o pulsa "Siguiente".</p>`;
    comprobarBtn.disabled = true;
    respuestaInput.disabled = true;
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
  
  const respuestaUsuario = parseInt(respuestaInput.value);
  
  if (isNaN(respuestaUsuario)) {
    feedbackDiv.innerHTML = '<p class="incorrecto">¡Escribe un número, por favor!</p>';
    respuestaInput.focus();
    return;
  }
  
  if (respuestaUsuario === juegoActual.resultado) {
    puntuacion += 10;
    feedbackDiv.innerHTML = `<p class="correcto">¡Excelente! ${juegoActual.valor1} ${juegoActual.operacion.simbolo} ${juegoActual.valor2} = ${juegoActual.resultado}. (+10 puntos ⭐)</p>`;
    
    if (puntuacion > 0 && puntuacion % 50 === 0) {
      feedbackDiv.innerHTML += '<p class="racha">¡Racha mágica! 🔥</p>';
      // Aquí podrías añadir un efecto visual (ej. confeti())
    }
    
    comprobarBtn.disabled = true; // Evitar múltiples envíos
    respuestaInput.disabled = true;
    setTimeout(nuevaRonda, 2000); // Siguiente ronda automáticamente
  } else {
    puntuacion -= 5;
    if (puntuacion < 0) puntuacion = 0; // No permitir puntajes negativos
    
    let pista = '';
    if (respuestaUsuario < juegoActual.resultado) {
        pista = 'Un poco más alto...';
    } else {
        pista = 'Un poco más bajo...';
    }

    feedbackDiv.innerHTML = `
      <p class="incorrecto">¡Casi! ${pista} La respuesta correcta era ${juegoActual.resultado}. (-5 puntos 💔)</p>
      <p class="info-ayuda">${juegoActual.valor1} ${juegoActual.operacion.simbolo} ${juegoActual.valor2} = ${juegoActual.resultado}</p>
    `;
    respuestaInput.focus();
    respuestaInput.select();
    // No pasar a nueva ronda automáticamente. El usuario puede usar "Siguiente" o intentar corregir (aunque no se reevaluará la misma pregunta aquí).
  }
  document.getElementById('puntuacion-actual').textContent = puntuacion;
}

async function terminarYGuardarPuntaje() {
  const user = authInstance.currentUser;
  const feedbackDiv = document.getElementById('feedback-juego');
  const controles = document.querySelector('.controles-juego');

  if (controles) { // Deshabilitar botones
    Array.from(controles.children).forEach(btn => btn.disabled = true);
  }


  if (user && puntuacion > 0) {
    try {
      feedbackDiv.innerHTML = `<p class="info">Guardando tu puntaje...</p>`;
      const scoresCollectionRef = collection(dbInstance, "puntajes");
      await addDoc(scoresCollectionRef, {
        userId: user.uid,
        displayName: user.displayName || user.email.split('@')[0], // Usar nombre o parte del email
        puntaje: puntuacion,
        juego: "Operaciones con Cartas", // Para identificar el juego
        fecha: serverTimestamp()
      });
      feedbackDiv.innerHTML = `<p class="correcto">¡Puntaje de ${puntuacion} guardado! 🎉 Puedes ver los mejores puntajes abajo o jugar otra vez.</p>`;
      await mostrarMejoresPuntajesJuego(); // Actualizar leaderboard
    } catch (error) {
      console.error("Error al guardar puntaje: ", error);
      feedbackDiv.innerHTML = `<p class="error">Error al guardar tu puntaje. Inténtalo de nuevo más tarde.</p>`;
    }
  } else if (user && puntuacion <= 0) {
    feedbackDiv.innerHTML = `<p class="info">No hay puntaje nuevo que guardar. ¡Juega una ronda para sumar puntos!</p>`;
  } else {
    feedbackDiv.innerHTML = `<p class="error">Debes estar logueado para guardar puntajes.</p>`;
  }
  // Aquí podrías ofrecer un botón para "Jugar de Nuevo" que llame a iniciarJuego()
  // o dejar que el usuario navegue con el menú.
  // Por ejemplo, añadir un botón para reiniciar:
  if(controles && !document.getElementById('jugar-de-nuevo-btn')) {
    const jugarDeNuevoBtn = document.createElement('button');
    jugarDeNuevoBtn.id = 'jugar-de-nuevo-btn';
    jugarDeNuevoBtn.textContent = '🚀 Jugar de Nuevo';
    jugarDeNuevoBtn.onclick = iniciarJuego; // Llama a la función para reiniciar todo el juego
    controles.appendChild(jugarDeNuevoBtn);
  }
}

async function mostrarMejoresPuntajesJuego() {
  const leaderboardContainer = document.getElementById('leaderboard-juego-container');
  if (!leaderboardContainer) return; // Si el contenedor no existe en la vista actual

  leaderboardContainer.innerHTML = '<h4>🏆 Salón de la Fama (Operaciones) 🏆</h4>';
  const ul = document.createElement('ul');
  ul.className = 'leaderboard-lista';

  try {
    const scoresQuery = query(
      collection(dbInstance, "puntajes"),
      // where("juego", "==", "Operaciones con Cartas"), // Si quieres filtrar por este juego específico
      orderBy("puntaje", "desc"),
      limit(5) // Mostrar los top 5
    );
    const querySnapshot = await getDocs(scoresQuery);
    
    if (querySnapshot.empty) {
      ul.innerHTML = '<li>Aún no hay valientes en el salón. ¡Sé el primero!</li>';
    } else {
      let rank = 1;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement('li');
        const fechaFormat = data.fecha ? new Date(data.fecha.seconds * 1000).toLocaleDateString() : '-';
        li.innerHTML = `<span>${rank}. ${data.displayName}</span>: <strong>${data.puntaje} pts</strong> <small>(${fechaFormat})</small>`;
        ul.appendChild(li);
        rank++;
      });
    }
  } catch (error) {
    console.error("Error al obtener puntajes: ", error);
    ul.innerHTML = '<li>Error al cargar el salón de la fama.</li>';
  }
  leaderboardContainer.appendChild(ul);
}


 document.getElementById('boton-jugar-cartas').addEventListener('click', iniciarJuego);

// Para que sea accesible globalmente si no usas módulos ES6 estrictamente para esto:
window.iniciarJuegoDeCartas = iniciarJuego; 
// Si usas módulos ES6, exportarías:
 export { iniciarJuego };