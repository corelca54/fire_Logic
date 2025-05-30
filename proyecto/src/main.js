// src/main.js

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig.js';

// Importaciones de los componentes/módulos de cada pantalla
import renderHomePage from './componentes/home.js';
import { renderProfilePage } from './componentes/perfil.js';
import handleLogout from './componentes/logout.js';
import renderLoginPage from './componentes/login.js';
import renderRegisterPage from './componentes/registro.js';
import { iniciarJuego as iniciarJuegoDeOperacionesConCartas } from './componentes/juego.js';
import { iniciarJuegoLogica } from './componentes/juegoLogica.js';
import { iniciarJuegoCiencia } from './componentes/juegoCiencia.js';

// Importa los estilos principales y Animate.css
import './style.css';
import 'animate.css';

// Referencias a los contenedores principales del DOM
const appDiv = document.getElementById('app');
const menuDiv = document.getElementById('menu');

if (!appDiv) {
    console.error("Error crítico: Contenedor #app no encontrado. La aplicación no puede iniciar.");
    document.body.innerHTML = "<h1>Error crítico: Contenedor #app no encontrado.</h1>";
}
if (!menuDiv) {
    console.error("Contenedor #menu no encontrado.");
}

// Función central de navegación (exportada)
export function navigateTo(pageName, params = {}) {
    if (!appDiv) return;

    console.log(`Navegando a: ${pageName}`);
    appDiv.innerHTML = '';
    appDiv.setAttribute('data-pantalla', pageName);

    switch (pageName) {
        case 'home':
            renderHomePage(appDiv, navigateTo);
            break;
        case 'login':
            renderLoginPage(appDiv, navigateTo);
            break;
        case 'registro':
            renderRegisterPage(appDiv, navigateTo);
            break;
        case 'perfil':
            if (params.currentUser) {
                renderProfilePage(appDiv, params.currentUser, navigateTo);
            } else {
                console.warn("Intento de navegar a perfil sin usuario, redirigiendo a login.");
                navigateTo('login');
            }
            break;
        case 'selectorJuegos':
            renderJuegosSelectorPage(appDiv, navigateTo);
            break;
        case 'juegoOperacionesCartas':
            iniciarJuegoDeOperacionesConCartas();
            break;
        case 'juegoLogica':
            iniciarJuegoLogica(appDiv, navigateTo);
            break;
        case 'juegoCiencia':
            iniciarJuegoCiencia(appDiv, navigateTo);
            break;
        default:
            console.warn(`Página desconocida: ${pageName}. Redirigiendo a 'home'.`);
            navigateTo('home');
    }
}

function renderMenu(currentUser) {
    if (!menuDiv) return;
    menuDiv.innerHTML = "";

    let botones = [];
    if (currentUser) {
        botones = [
            { texto: "🃏 Mis Mazos", id: "btn-home-mazos", action: () => navigateTo('home') },
            { texto: "🎮 Juegos", id: "btn-juegos", action: () => navigateTo('selectorJuegos') },
            { texto: "👤 Perfil", id: "btn-perfil", action: () => navigateTo('perfil', { currentUser }) },
            { texto: "🚪 Logout", id: "btn-logout", action: async () => { await handleLogout(); }}
        ];
    } else {
        botones = [
            { texto: "🔑 Login", id: "btn-login", action: () => navigateTo('login') },
            { texto: "✍️ Registro", id: "btn-registro", action: () => navigateTo('registro') }
        ];
    }
    botones.forEach(({ texto, id, action }) => {
        const btn = document.createElement("button");
        btn.id = id; btn.textContent = texto; btn.onclick = action;
        menuDiv.appendChild(btn);
    });
}

function renderJuegosSelectorPage(container, navigateFunc) {
    container.innerHTML = `
        <div class="selector-juegos-container">
            <h2>Elige un Desafío</h2>
            <div class="lista-juegos">
                <button id="btn-juego-operaciones" class="btn-seleccion-juego">
                    <span class="emoji-juego">🧮</span>
                    Operaciones con Cartas
                    <span class="descripcion-juego">Calcula el resultado de operaciones matemáticas usando cartas.</span>
                </button>
                <button id="btn-juego-logica" class="btn-seleccion-juego">
                    <span class="emoji-juego">🧠</span>
                    Lógica y Acertijos
                    <span class="descripcion-juego">¡Pon a prueba tu ingenio!</span>
                </button>
                <button id="btn-juego-ciencia" class="btn-seleccion-juego">
                    <span class="emoji-juego">⚛️</span>
                    Ciencia Divertida
                    <span class="descripcion-juego">Descubre el universo científico.</span>
                </button>
            </div>
            <button id="btn-volver-a-mazos" class="btn-accion-home btn-primario" style="margin-top: 20px;">🃏 Volver a Mis Mazos</button>
        </div>
    `;
    document.getElementById('btn-juego-operaciones').onclick = () => navigateFunc('juegoOperacionesCartas');
    document.getElementById('btn-juego-logica').onclick = () => navigateFunc('juegoLogica');
    document.getElementById('btn-juego-ciencia').onclick = () => navigateFunc('juegoCiencia');
    document.getElementById('btn-volver-a-mazos').onclick = () => navigateFunc('home');
}

function initializeApp() {
    if (!appDiv) return;
    onAuthStateChanged(auth, (user) => {
        console.log("Estado de autenticación cambiado. Usuario:", user ? user.uid : 'Ninguno');
        renderMenu(user);
        if (user) { navigateTo('home'); } else { navigateTo('login'); }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}