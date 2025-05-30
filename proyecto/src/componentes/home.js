// Versión mejorada con manejo de errores
// conexion_api.js

// conexion_api.js

const API_BASE = 'https://deckofcardsapi.com/api/deck';

// 🔄 Baraja un nuevo mazo y devuelve su deck_id
export async function barajarMazo() {
  try {
    const respuesta = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!respuesta.ok) {
      throw new Error(`Error HTTP al barajar: ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    return datos.deck_id;
  } catch (error) {
    console.error('Error al barajar mazo:', error);

    if (window.androidFallback && typeof window.androidFallback.getFallbackDeckId === 'function') {
      return window.androidFallback.getFallbackDeckId(); // Android fallback
    }

    return null;
  }
}

// 🃏 Obtiene un mazo completo de 52 cartas
export async function obtenerCartas() {
  try {
    const respuesta = await fetch(`${API_BASE}/new/draw/?count=52`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    return datos.cards;
  } catch (error) {
    console.error('Error al obtener cartas:', error);

    if (window.androidFallback && typeof window.androidFallback.getLocalCards === 'function') {
      return window.androidFallback.getLocalCards(); // Android fallback
    }

    return [];
  }
}

// 📲 Compatibilidad con Android WebView
if (window.AndroidInterface) {
  window.AndroidInterface.registerAPI({
    barajarMazo,
    sacarCartas,
    obtenerCartas
  });
}

// También disponibles globalmente en el navegador
window.barajarMazo = barajarMazo;
window.sacarCartas = sacarCartas;
window.obtenerCartas = obtenerCartas;