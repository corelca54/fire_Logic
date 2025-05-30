// src/api/conexionDeckOfCards.js

const API_BASE = 'https://deckofcardsapi.com/api/deck';

/**
 * Baraja un nuevo mazo (o un mazo existente si se provee deck_id)
 * @param {string} [deckId=null] - Opcional. ID del mazo a barajar. Si es null, crea y baraja uno nuevo.
 * @returns {Promise<string|null>} El ID del mazo barajado o null en caso de error.
 */
export async function barajarMazo(deckId = null) {
  const url = deckId ? `${API_BASE}/${deckId}/shuffle/` : `${API_BASE}/new/shuffle/?deck_count=1`;
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP al barajar: ${respuesta.status} ${respuesta.statusText}`);
    }
    const datos = await respuesta.json();
    if (!datos.success) {
        throw new Error(datos.error || 'La API indicó un fallo al barajar pero no dio un error específico.');
    }
    return datos.deck_id;
  } catch (error) {
    console.error('Error en barajarMazo:', error);
    // Aquí podrías implementar un fallback si lo tuvieras, como el de Android
    return null;
  }
}

/**
 * Saca un número específico de cartas de un mazo.
 * @param {string} deckId - El ID del mazo del cual sacar cartas.
 * @param {number} count - El número de cartas a sacar.
 * @returns {Promise<Array<Object>|null>} Un array de objetos carta, o null en caso de error.
 */
export async function sacarCartas(deckId, count) {
  if (!deckId) {
    console.error("Error en sacarCartas: deckId es requerido.");
    return null;
  }
  try {
    const respuesta = await fetch(`${API_BASE}/${deckId}/draw/?count=${count}`);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP al sacar cartas: ${respuesta.status} ${respuesta.statusText}`);
    }
    const datos = await respuesta.json();
    if (!datos.success) {
        // Si el error es porque no quedan cartas, la API devuelve success:false y "remaining: 0"
        if (datos.error && datos.error.toLowerCase().includes("not enough cards remaining")) {
            console.warn(`No quedan suficientes cartas en el mazo ${deckId}. Cartas restantes: ${datos.remaining}`);
            return []; // Devuelve un array vacío para indicar que no se pudieron sacar más cartas
        }
        throw new Error(datos.error || 'La API indicó un fallo al sacar cartas.');
    }
    return datos.cards;
  } catch (error) {
    console.error('Error en sacarCartas:', error);
    return null;
  }
}

/**
 * Obtiene información sobre un mazo, incluyendo las cartas restantes.
 * @param {string} deckId - El ID del mazo.
 * @returns {Promise<Object|null>} Un objeto con la información del mazo o null en caso de error.
 */
export async function obtenerInfoMazo(deckId) {
    if (!deckId) {
        console.error("Error en obtenerInfoMazo: deckId es requerido.");
        return null;
    }
    try {
        const respuesta = await fetch(`${API_BASE}/${deckId}/`);
        if (!respuesta.ok) {
            throw new Error(`Error HTTP al obtener info del mazo: ${respuesta.status} ${respuesta.statusText}`);
        }
        const datos = await respuesta.json();
        return datos; // Devuelve el objeto completo de la API (incluye success, deck_id, shuffled, remaining)
    } catch (error) {
        console.error('Error en obtenerInfoMazo:', error);
        return null;
    }
}

