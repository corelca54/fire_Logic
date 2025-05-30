// src/firebase/leaderboardService.js

import { getFirestore, collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
// No necesitas getAuth aquí a menos que hagas algo muy específico con el usuario actual

/**
 * Muestra los N mejores puntajes generales en un contenedor HTML.
 * @param {string} containerElementId El ID del elemento HTML donde se mostrarán los puntajes.
 * @param {number} [count=5] El número de mejores puntajes a mostrar.
 * @param {string|null} [specificGame=null] Opcional. Si se provee, filtra por este nombre de juego.
 */
export async function mostrarMejoresPuntajesGenerales(containerElementId, count = 5, specificGame = null) {
  const db = getFirestore();
  const leaderboardContainer = document.getElementById(containerElementId);

  if (!leaderboardContainer) {
    console.error(`Contenedor de leaderboard con ID "${containerElementId}" no encontrado.`);
    return;
  }

  let title = `🏆 Salón de la Fama ${specificGame ? `(${specificGame})` : '(General)'} 🏆`;
  leaderboardContainer.innerHTML = `<h4>${title}</h4>`;
  const ul = document.createElement('ul');
  ul.className = 'leaderboard-lista';

  try {
    const puntajesRef = collection(db, "puntajes");
    let q;

    if (specificGame) {
      q = query(
        puntajesRef,
        where("juego", "==", specificGame),
        orderBy("puntaje", "desc"),
        limit(count)
      );
    } else {
      q = query(
        puntajesRef,
        orderBy("puntaje", "desc"),
        limit(count)
      );
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      ul.innerHTML = '<li>Aún no hay héroes en esta categoría. ¡Sé el primero!</li>';
    } else {
      let rank = 1;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement('li');
        let fechaFormateada = '';
        if (data.fecha && data.fecha.seconds) {
          try {
            fechaFormateada = new Date(data.fecha.seconds * 1000).toLocaleDateString();
          } catch (e) { console.warn("Error al formatear fecha", e); }
        }
        let gameNameHTML = data.juego && !specificGame ? `<small class="game-name">(${data.juego})</small>` : '';
        li.innerHTML = `
          <span class="rank">${rank}.</span>
          <span class="display-name">${data.displayName || 'Jugador Anónimo'}</span>: 
          <strong class="score">${data.puntaje} pts</strong>
          ${gameNameHTML}
          ${fechaFormateada ? `<small class="date"> - ${fechaFormateada}</small>` : ''}
        `;
        ul.appendChild(li);
        rank++;
      });
    }
  } catch (error) {
    console.error("Error al obtener los mejores puntajes: ", error);
    ul.innerHTML = '<li>Error al cargar el salón de la fama. Intenta más tarde.</li>';
  }
  leaderboardContainer.appendChild(ul);
}