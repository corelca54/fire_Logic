// src/componentes/original.js

let todasLasCartas = [];
let mazoActual = 'all';

// Verifica si localStorage está disponible
const storage = (() => {
  try {
    const s = window.localStorage;
    s.setItem('__test__', '1'); // Intenta escribir
    s.removeItem('__test__');   // Intenta borrar
    return s;
  } catch (e) {
    console.warn("localStorage no está disponible. Los favoritos no persistirán entre sesiones.");
    // Fallback a un objeto en memoria que simula la API de localStorage
    const memoryStore = {};
    return {
      getItem: (key) => memoryStore[key] || null,
      setItem: (key, value) => { memoryStore[key] = String(value); },
      removeItem: (key) => { delete memoryStore[key]; },
      clear: () => { for (const key in memoryStore) delete memoryStore[key]; }
    };
  }
})();

// Usa storage en lugar de localStorage directamente
function esFavorita(codigoCarta) {
  const favoritos = JSON.parse(storage.getItem('favoritos') || '[]');
  return favoritos.some(carta => carta.code === codigoCarta);
}

// MODIFICADO: Acepta appContainer como argumento
async function mostrarContenidoOriginal(appContainer) { // Renombrado para claridad, o puedes mantener mostrarInicio
  if (!appContainer) {
    console.error("Contenedor de la app no fue proporcionado a mostrarContenidoOriginal.");
    return;
  }
  appContainer.setAttribute('data-pantalla', 'original-cartas'); // Para estilos
  appContainer.innerHTML = `
    <div class="original-page-container"> <!-- Contenedor específico para esta página -->
      <h1>Explora Todas las Cartas</h1>
      
      <div class="buscador-container">
        <input type="text" id="buscador-original" placeholder="🔍 Buscar por nombre (ej: ace, king, 5) o palo...">
        <select id="filtro-palo-original">
          <option value="all">Todos los palos</option>
          <option value="HEARTS">♥ Corazones</option>
          <option value="DIAMONDS">♦ Diamantes</option>
          <option value="CLUBS">♣ Tréboles</option>
          <option value="SPADES">♠ Picas</option>
        </select>
      </div>
      
      <div id="loading-original" class="loading-indicator">Cargando cartas...</div>
      <div id="card-container-original" class="card-container"></div>
    </div>
  `;

  const loading = document.getElementById('loading-original');
  const cardContainer = document.getElementById('card-container-original'); // Guardar referencia

  // Cargar todas las cartas al inicio si no están ya cargadas
  if (todasLasCartas.length === 0) {
    try {
      loading.style.display = 'block';
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/draw/?count=52');
      if (!response.ok) throw new Error(`Error HTTP al cargar cartas: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Fallo al obtener cartas de la API');
      todasLasCartas = data.cards;
      _mostrarCartasInterno(todasLasCartas, cardContainer); // Pasar cardContainer
    } catch (error) {
      console.error('Error al cargar cartas:', error);
      loading.innerHTML = `<p class="error">Error al cargar las cartas. Por favor recarga la página o revisa tu conexión.</p>`;
    } finally {
      loading.style.display = 'none';
    }
  } else {
    _mostrarCartasInterno(todasLasCartas, cardContainer); // Pasar cardContainer
    loading.style.display = 'none';
  }

  // Event listeners (asegurarse de que no se dupliquen si esta función se llama múltiples veces)
  // Es mejor removerlos antes de añadirlos o usar delegación de eventos.
  // Por simplicidad, los dejamos así por ahora, pero tenlo en cuenta.
  const buscadorInput = document.getElementById('buscador-original');
  const filtroPaloSelect = document.getElementById('filtro-palo-original');

  buscadorInput.oninput = () => _filtrarCartasInterno(cardContainer); // Pasar cardContainer
  filtroPaloSelect.onchange = function() {
    mazoActual = this.value;
    _filtrarCartasInterno(cardContainer); // Pasar cardContainer
  };
}

// Funciones internas renombradas con _ para indicar que son "privadas" de este módulo
// y para evitar colisiones si se exportan accidentalmente.
function _mostrarCartasInterno(cartas, container) { // Acepta container
  if (!container) {
      console.error("Contenedor de cartas no encontrado en _mostrarCartasInterno");
      return;
  }
  if (cartas.length === 0) {
    container.innerHTML = '<p>No se encontraron cartas. Intenta con otro filtro.</p>';
    return;
  }
  
  container.innerHTML = cartas.map(carta => `
    <div class="card">
      <img src="${carta.image}" alt="${carta.value} of ${carta.suit}" data-code="${carta.code}">
      <button class="favorito">
        <img src="assets/img/iconos/${esFavorita(carta.code) ? 'favorito-lleno.png' : 'favorito.png'}" alt="Toggle Favorito">
      </button>
    </div>
  `).join('');

  // Añadir event listeners a los botones de favorito después de crearlos
  container.querySelectorAll('.favorito').forEach(button => {
    button.onclick = function() {
        const cardElement = this.closest('.card');
        const imgElement = cardElement.querySelector('img[data-code]');
        if (imgElement) {
            toggleFavorito(imgElement.dataset.code);
        }
    };
  });
}

function _filtrarCartasInterno(container) { // Acepta container
  const texto = document.getElementById('buscador-original').value.toLowerCase();
  
  const filtradas = todasLasCartas.filter(carta => {
    const valorNormalizado = carta.value.toLowerCase();
    const paloNormalizado = carta.suit.toLowerCase();
    const textoBusqueda = texto; // Ya está en minúsculas

    // Lógica de búsqueda mejorada:
    // "king hearts" buscará King of Hearts
    // "ace" buscará todos los Ases
    // "spades" buscará todas las Picas
    const terminosBusqueda = textoBusqueda.split(' ').filter(t => t.length > 0);
    let coincideTexto = true;
    if (terminosBusqueda.length > 0) {
        coincideTexto = terminosBusqueda.every(term => 
            valorNormalizado.includes(term) || paloNormalizado.includes(term)
        );
    }
                         
    const coincidePaloSelect = mazoActual === 'all' || carta.suit === mazoActual;
    return coincideTexto && coincidePaloSelect;
  });
  
  _mostrarCartasInterno(filtradas, container); // Pasar container
}


// Esta función SÍ necesita ser global si se llama desde onclick="" en el HTML generado
// o si la refactorizamos para usar event listeners añadidos en _mostrarCartasInterno
window.toggleFavorito = function(codigoCarta) {
  let favoritos = JSON.parse(storage.getItem('favoritos')) || [];
  const carta = todasLasCartas.find(c => c.code === codigoCarta);
  
  // Encuentra el botón específico para esta carta y su imagen de favorito
  const cardElement = document.querySelector(`.card img[data-code="${codigoCarta}"]`);
  const favButtonImg = cardElement ? cardElement.closest('.card').querySelector('.favorito img') : null;

  if (esFavorita(codigoCarta)) {
    favoritos = favoritos.filter(c => c.code !== codigoCarta);
    storage.setItem('favoritos', JSON.stringify(favoritos));
    mostrarMensaje('Carta removida de favoritos');
    if (favButtonImg) favButtonImg.src = `assets/img/iconos/favorito.png`; // Actualiza la imagen del botón
  } else {
    if (carta) { // Asegurarse que la carta existe en todasLasCartas
      favoritos.push(carta);
      storage.setItem('favoritos', JSON.stringify(favoritos));
      mostrarMensaje('Carta añadida a favoritos');
      if (favButtonImg) favButtonImg.src = `assets/img/iconos/favorito-lleno.png`; // Actualiza la imagen del botón
    } else {
      console.warn(`No se encontró la carta con código ${codigoCarta} para añadir a favoritos.`);
    }
  }
  
}

function mostrarMensaje(mensaje) {
  // ... (código de mostrarMensaje sin cambios, pero asegúrate que las rutas de imágenes de favoritos sean correctas) ...
  // Ejemplo: 'assets/img/iconos/favorito.png' si tus imágenes están en public/assets/img/iconos/
  const toast = document.createElement('div');
  toast.textContent = mensaje;
  toast.className = 'toast-message'; // Añade una clase para estilizarlo en CSS
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}

export default mostrarContenidoOriginal;
// Si la dejaste como mostrarInicio:
// export default mostrarInicio;