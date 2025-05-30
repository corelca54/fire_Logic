let todasLasCartas = [];
let mazoActual = 'all';
// Verifica si localStorage está disponible
const storage = (() => {
  try {
    return window.localStorage;
  } catch (e) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
  }
})();

// Usa storage en lugar de localStorage directamente
function esFavorita(codigoCarta) {
  const favoritos = JSON.parse(storage.getItem('favoritos') || '[]');
  return favoritos.some(carta => carta.code === codigoCarta);
}

async function mostrarInicio() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Explora Todas las Cartas</h1>
    
    <div class="buscador-container">
      <input type="text" id="buscador" placeholder="🔍 Buscar por nombre (ej: ace, king, 5) o palo...">
      <select id="filtro-palo">
        <option value="all">Todos los palos</option>
        <option value="HEARTS">♥ Corazones</option>
        <option value="DIAMONDS">♦ Diamantes</option>
        <option value="CLUBS">♣ Tréboles</option>
        <option value="SPADES">♠ Picas</option>
      </select>
    </div>
    
    <div id="loading">Cargando cartas...</div>
    <div id="card-container" class="card-container"></div>
  `;

  const loading = document.getElementById('loading');

  // Cargar todas las cartas al inicio
  if (todasLasCartas.length === 0) {
    try {
      loading.style.display = 'block';
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/draw/?count=52');
      const data = await response.json();
      todasLasCartas = data.cards;
      mostrarCartas(todasLasCartas);
    } catch (error) {
      console.error('Error al cargar cartas:', error);
      loading.innerHTML = `
        <p class="error">Error al cargar las cartas. Por favor recarga la página.</p>
      `;
    } finally {
      loading.style.display = 'none';
    }
  } else {
    mostrarCartas(todasLasCartas);
    loading.style.display = 'none'; // También ocultar si ya están en caché
  }

  // Event listeners
  document.getElementById('buscador').addEventListener('input', filtrarCartas);
  document.getElementById('filtro-palo').addEventListener('change', function() {
    mazoActual = this.value;
    filtrarCartas();
  });
}

function mostrarCartas(cartas) {
  const container = document.getElementById('card-container');
  
  if (cartas.length === 0) {
    container.innerHTML = '<p>No se encontraron cartas. Intenta con otro filtro.</p>';
    return;
  }
  
  container.innerHTML = cartas.map(carta => `
    <div class="card">
      <img src="${carta.image}" alt="${carta.value} of ${carta.suit}">
      <button class="favorito" onclick="toggleFavorito('${carta.code}')">
        <img src="img/iconos/${esFavorita(carta.code) ? 'favorito-lleno.png' : 'favorito.png'}" alt="Favorito">
      </button>
    </div>
  `).join('');
}

function filtrarCartas() {
  const texto = document.getElementById('buscador').value.toLowerCase();
  
  const filtradas = todasLasCartas.filter(carta => {
    const coincideTexto = carta.value.toLowerCase().includes(texto) || 
                         carta.suit.toLowerCase().includes(texto);
    const coincidePalo = mazoActual === 'all' || carta.suit === mazoActual;
    return coincideTexto && coincidePalo;
  });
  
  mostrarCartas(filtradas);
}

function esFavorita(codigoCarta) {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  return favoritos.some(carta => carta.code === codigoCarta);
}

function toggleFavorito(codigoCarta) {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  const carta = todasLasCartas.find(c => c.code === codigoCarta);
  
  if (esFavorita(codigoCarta)) {
    const nuevosFavoritos = favoritos.filter(c => c.code !== codigoCarta);
    localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
    mostrarMensaje('Carta removida de favoritos');
  } else {
    favoritos.push(carta);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    mostrarMensaje('Carta añadida a favoritos');
  }
  
  // Actualizar visualización
  const botones = document.querySelectorAll(`.favorito img[alt="Favorito"]`);
  botones.forEach(boton => {
    const cardCode = boton.closest('.card').querySelector('img').alt.split(' of ')[0];
    boton.src = `img/iconos/${esFavorita(cardCode) ? 'favorito-lleno.png' : 'favorito.png'}`;
  });
}

function mostrarMensaje(mensaje) {
  const toast = document.createElement('div');
  toast.textContent = mensaje;
  toast.style.position = 'fixed';
  toast.style.bottom = '100px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = '#27ae60';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '20px';
  toast.style.zIndex = '1000';
  toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}

window.mostrarInicio = mostrarInicio;
window.toggleFavorito = toggleFavorito;