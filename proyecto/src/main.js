// src/main.js

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig.js';

// Importaciones de los componentes/módulos de cada pantalla
import renderHomePage from './componentes/home.js'; // Esta es ahora la página de "Mis Mazos" con filtros
import renderProfilePage from './componentes/perfil.js';
import handleLogout from './componentes/logout.js';
import renderLoginPage from './componentes/login.js';
import renderRegisterPage from './componentes/registro.js';
import { iniciarJuego as iniciarJuegoDeOperacionesConCartas } from './componentes/juego.js';
import { iniciarJuegoLogica } from './componentes/juegoLogica.js';   // NUEVA IMPORTACIÓN
import { iniciarJuegoCiencia } from './componentes/juegoCiencia.js'; // NUEVA IMPORTACIÓN

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

    console.log(`Navegando a: ${pageName}`); // Log para depuración
    appDiv.innerHTML = ''; // Limpia el contenido anterior
    appDiv.setAttribute('data-pantalla', pageName); // Para estilos CSS específicos

    switch (pageName) {
        case 'home': // Esta es la vista de "Mis Mazos", manejada por home.js
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
        case 'selectorJuegos': // Pantalla de selección de juegos
            renderJuegosSelectorPage(appDiv, navigateTo);
            break;
        case 'juegoOperacionesCartas': // Juego específico de operaciones con cartas
            iniciarJuegoDeOperacionesConCartas(); // Esta función maneja su propia UI dentro de appDiv
            break;
        case 'juegoLogica': // NUEVO CASE
            iniciarJuegoLogica(appDiv, navigateTo); // Pasamos appDiv y navigateTo
            break;
        case 'juegoCiencia': // NUEVO CASE
            iniciarJuegoCiencia(appDiv, navigateTo); // Pasamos appDiv y navigateTo
            break;
        default:
            console.warn(`Página desconocida: ${pageName}. Redirigiendo a 'home' (Mis Mazos).`);
            navigateTo('home');
    }
}

// Función para renderizar el menú dinámicamente basado en el estado de autenticación
function renderMenu(currentUser) {
    if (!menuDiv) return;
    menuDiv.innerHTML = ""; // Limpia el menú existente

    let botones = [];

    if (currentUser) {
        botones = [
            { texto: "🃏 Mis Mazos", id: "btn-home-mazos", action: () => navigateTo('home') },
            { texto: "🎮 Juegos", id: "btn-juegos", action: () => navigateTo('selectorJuegos') },
            { texto: "👤 Perfil", id: "btn-perfil", action: () => navigateTo('perfil', { currentUser }) },
            { texto: "🚪 Logout", id: "btn-logout", action: async () => {
                await handleLogout();
            }}
        ];
    } else {
        botones = [
            { texto: "🔑 Login", id: "btn-login", action: () => navigateTo('login') },
            { texto: "✍️ Registro", id: "btn-registro", action: () => navigateTo('registro') }
        ];
    }

    botones.forEach(({ texto, id, action }) => {
        const btn = document.createElement("button");
        btn.id = id;
        btn.textContent = texto;
        btn.onclick = action;
        menuDiv.appendChild(btn);
    });
}

// --- PANTALLA DE SELECCIÓN DE JUEGOS ---
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
            <button id="btn-volver-a-mazos" class="btn-accion-home" style="margin-top: 20px;">🃏 Volver a Mis Mazos</button>
        </div>
    `;

    document.getElementById('btn-juego-operaciones').onclick = () => navigateFunc('juegoOperacionesCartas');
    document.getElementById('btn-juego-logica').onclick = () => navigateFunc('juegoLogica');     // LLAMA A LA NUEVA RUTA
    document.getElementById('btn-juego-ciencia').onclick = () => navigateFunc('juegoCiencia');   // LLAMA A LA NUEVA RUTA
    document.getElementById('btn-volver-a-mazos').onclick = () => navigateFunc('home');
}


// --- INICIALIZACIÓN DE LA APP Y MANEJO DE AUTENTICACIÓN ---
function initializeApp() {
    if (!appDiv) return;

    // Aquí no necesitas llamar a initFirebase() si firebaseConfig.js lo hace al importarse
    // y las funciones de Firebase SDK (getAuth, etc.) se llaman después de que ese módulo cargue.

    onAuthStateChanged(auth, (user) => {
        console.log("Estado de autenticación cambiado. Usuario:", user ? user.uid : 'Ninguno');
        renderMenu(user);

        if (user) {
            navigateTo('home'); // 'home' es la vista de "Mis Mazos"
        } else {
            navigateTo('login');
        }
    });
}

// Llama a la inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}