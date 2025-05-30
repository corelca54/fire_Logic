// src/componentes/home.js
import { getAuth, onAuthStateChanged } from "firebase/auth";
// IMPORTA la función desde el archivo correcto:
import { mostrarMejoresPuntajesGenerales } from '../firebase/leaderboardService.js';

function renderHomePage(appContainer) {
    const auth = getAuth();

    appContainer.innerHTML = `
        <div id="pantalla-bienvenida" class="fade-in">
            <div class="bienvenida-contenido">
                <h1>Fire Logic App</h1>
                <p>Desafía tu mente con juegos de lógica, matemáticas y más.</p>
                <div id="user-status-home">Cargando estado del usuario...</div>
                <div id="home-actions">
                    <!-- Los botones se añadirán dinámicamente -->
                </div>
                <div id="leaderboard-home-container" class="leaderboard-container" style="margin-top: 20px;">
                    <!-- El leaderboard se cargará aquí -->
                </div>
            </div>
        </div>
    `;
    appContainer.setAttribute('data-pantalla', 'inicio');

    const userStatusDiv = document.getElementById('user-status-home');
    const homeActionsDiv = document.getElementById('home-actions');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            userStatusDiv.innerHTML = `<p>¡Hola, ${user.displayName || user.email}!</p>`;
            homeActionsDiv.innerHTML = `
                <button id="btn-ir-a-juegos" class="btn-accion-home">🚀 Ir a Juegos</button>
                <button id="btn-ver-perfil" class="btn-accion-home">👤 Mi Perfil</button>
                <button id="btn-logout-home" class="btn-accion-home">🚪 Cerrar Sesión</button>
            `;
            // TODO: Añadir event listeners para los botones y conectar con funciones de navegación/acción
            // document.getElementById('btn-logout-home').addEventListener('click', tuFuncionDeLogout);
        } else {
            userStatusDiv.innerHTML = `<p>¡Bienvenido! Inicia sesión para guardar tu progreso.</p>`;
            homeActionsDiv.innerHTML = `
                <button id="btn-login-home" class="btn-accion-home">🔑 Iniciar Sesión / Registrarse</button>
            `;
            // TODO: Añadir event listeners para los botones y conectar con funciones de navegación/acción
        }
    });

    // LLAMA a la función importada para mostrar el leaderboard
    const leaderboardDivId = 'leaderboard-home-container';
    mostrarMejoresPuntajesGenerales(leaderboardDivId, 5); // Muestra los 5 mejores generales
}

export default renderHomePage;