let mazoJuegoId = null;
let puntuacion = 0;
let juegoActual = null;

async function iniciarJuego() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="juego-container">
      <div class="puntaje">⭐ Puntos: <span>${puntuacion}</span></div>
      
      <div class="cartas-juego">
        <div class="carta-juego" id="carta1">
          <div class="valor-carta">?</div>
        </div>
        <div class="operacion">+</div>
        <div class="carta-juego" id="carta2">
          <div class="valor-carta">?</div>
        </div>
        <div class="igual">=</div>
        <input type="number" id="respuesta" placeholder="?" autofocus>
      </div>
      
      <div id="feedback"></div>
      
      <div class="controles-juego">
        <button id="comprobar">✅ Comprobar</button>
        <button id="nueva-carta">🔄 Nuevo Juego</button>
      </div>
    </div>
  `;

  document.getElementById('comprobar').addEventListener('click', comprobarRespuesta);
  document.getElementById('nueva-carta').addEventListener('click', nuevaRonda);
  document.getElementById('respuesta').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') comprobarRespuesta();
  });

  await nuevaRonda();
}

async function nuevaRonda() {
  try {
    if (!mazoJuegoId) {
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/');
      const data = await response.json();
      mazoJuegoId = data.deck_id;
    }
    
    const response = await fetch(`https://deckofcardsapi.com/api/deck/${mazoJuegoId}/draw/?count=2`);
    const data = await response.json();
    const [carta1, carta2] = data.cards;
    
    const valor1 = obtenerValorNumerico(carta1.value);
    const valor2 = obtenerValorNumerico(carta2.value);
    
    const operaciones = [
      { simbolo: '+', calcular: (a, b) => a + b, nombre: 'suma' },
      { simbolo: '-', calcular: (a, b) => a - b, nombre: 'resta' },
      { simbolo: '×', calcular: (a, b) => a * b, nombre: 'multiplicación' }
    ];
    
    const operacion = operaciones[Math.floor(Math.random() * operaciones.length)];
    const resultado = operacion.calcular(valor1, valor2);
    
    // Mostrar cartas con imágenes completas
    document.getElementById('carta1').innerHTML = `
      <img src="${carta1.image}" alt="${carta1.value} of ${carta1.suit}">
      <div class="valor-carta">${valor1}</div>
    `;
    
    document.getElementById('carta2').innerHTML = `
      <img src="${carta2.image}" alt="${carta2.value} of ${carta2.suit}">
      <div class="valor-carta">${valor2}</div>
    `;
    
    document.querySelector('.operacion').textContent = operacion.simbolo;
    document.getElementById('respuesta').value = '';
    document.getElementById('respuesta').focus();
    
    // Guardar estado actual
    juegoActual = { valor1, valor2, operacion, resultado };
    
  } catch (error) {
    console.error('Error en nueva ronda:', error);
    document.getElementById('feedback').innerHTML = `
      <p class="error">¡Oops! Las cartas mágicas no funcionan. Intenta de nuevo.</p>
    `;
  }
}

function obtenerValorNumerico(valorCarta) {
  const valores = {
    'ACE': 1, 'JACK': 11, 'QUEEN': 12, 'KING': 13
  };
  return valores[valorCarta] || parseInt(valorCarta);
}

function comprobarRespuesta() {
  const respuestaInput = document.getElementById('respuesta');
  const respuesta = parseInt(respuestaInput.value);
  const feedback = document.getElementById('feedback');
  
  if (isNaN(respuesta)) {
    feedback.innerHTML = '<p class="error">¡Necesito un número mágico!</p>';
    respuestaInput.focus();
    return;
  }
  
  if (respuesta === juegoActual.resultado) {
    puntuacion += 10;
    feedback.innerHTML = '<p class="correcto">¡Correcto! +10 puntos ⭐</p>';
    document.querySelector('.puntaje span').textContent = puntuacion;
    
    // Efecto de confeti para respuestas correctas
    if (puntuacion % 50 === 0) {
      feedback.innerHTML += '<p class="correcto">¡Racha mágica! 🎉</p>';
    }
    
    setTimeout(nuevaRonda, 1500);
  } else {
    feedback.innerHTML = `
      <p class="incorrecto">¡Ups! El número correcto es 
      ${respuesta < juegoActual.resultado ? 'mayor' : 'menor'}</p>
    `;
    respuestaInput.focus();
  }
}

window.iniciarJuego = iniciarJuego;