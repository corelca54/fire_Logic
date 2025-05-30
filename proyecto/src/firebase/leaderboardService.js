// src/componentes/home.js
export async function mostrarMejoresPuntajesGenerales(containerElementId, count = 5, specificGame = null) {
    // ... tu lógica para mostrar puntajes ...
    console.log("Intentando mostrar mejores puntajes..."); // Añade un console.log para depurar
}
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { mostrarMejoresPuntajesGenerales } from '../firebase/leaderboardService.js'; // <-- ESTA LÍNEA AHORA DEBERÍA FUNCIONAR

function renderHomePage(appContainer) {
    // ... (resto del código de renderHomePage que te di antes) ...

    // Por ejemplo, dentro del onAuthStateChanged o al final de renderHomePage:
    const leaderboardDivId = 'leaderboard-home-container'; // Asegúrate que este div exista en tu HTML de home
    
    // Para mostrar los 5 mejores puntajes generales:
    mostrarMejoresPuntajesGenerales(leaderboardDivId, 5);

    // O si quisieras mostrar los 3 mejores de "Operaciones con Cartas" específicamente:
    // mostrarMejoresPuntajesGenerales(leaderboardDivId, 3, "Operaciones con Cartas");

    // ... (resto del código de renderHomePage) ...
}

export default renderHomePage;