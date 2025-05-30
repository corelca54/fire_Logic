// src/componentes/home.js
import { getAuth, onAuthStateChanged } from "firebase/auth";
// Si vas a mostrar el leaderboard aquí, importa las funciones necesarias:
import { mostrarMejoresPuntajesGenerales } from '../firebase/leaderboardService.js'; // (Ejemplo de ruta)

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
                    <!-- Aquí podrías cargar un leaderboard general si lo deseas -->
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
            document.getElementById('btn-logout-home').addEventListener('click', tuFuncionDeLogout);
             document.getElementById('btn-ir-a-juegos').addEventListener('click', tuFuncionParaNavegarAJuegos);
            document.getElementById('btn-ver-perfil').addEventListener('click', tuFuncionParaNavegarAPerfil);

        } else {
            userStatusDiv.innerHTML = `<p>¡Bienvenido! Inicia sesión para guardar tu progreso.</p>`;
            homeActionsDiv.innerHTML = `
                <button id="btn-login-home" class="btn-accion-home">🔑 Iniciar Sesión / Registrarse</button>
            `;
             document.getElementById('btn-login-home').addEventListener('click', tuFuncionParaNavegarALogin);
        }
        
         if (document.getElementById('btn-ir-a-juegos') && window.navegarAJuegos) {
            document.getElementById('btn-ir-a-juegos').addEventListener('click', window.navegarAJuegos);
        }
        // (Esto asume que tienes una función global 'navegarAJuegos' o similar)
    });

    // Ejemplo de cómo podrías cargar el leaderboard aquí
     if (typeof mostrarMejoresPuntajesGenerales === 'function') {
    mostrarMejoresPuntajesGenerales('leaderboard-home-container');
    } else {
      console.warn('Función mostrarMejoresPuntajesGenerales no disponible para home.');
     }
}

// La exportación que tu main.js espera:
export default renderHomePage;