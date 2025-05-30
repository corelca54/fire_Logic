// src/main.js

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig.js'; // Asegúrate que este archivo exporte 'auth' correctamente

// Importaciones de los componentes/módulos de cada pantalla
import renderHomePage from './componentes/home.js';
import renderOriginalPage from './componentes/original.js';
import renderProfilePage from './componentes/perfil.js';
import handleLogout from './componentes/logout.js';
import renderLoginPage from './componentes/login.js';
import renderRegisterPage from './componentes/registro.js';

// Importa los estilos principales
import './style.css';

// Referencias a los contenedores principales del DOM
const appDiv = document.getElementById('app');
const menuDiv = document.getElementById('menu');

// Función para limpiar el contenido de app y opcionalmente establecer un atributo de pantalla
function clearAppScreen(screenName = '') {
  if (appDiv) {
    appDiv.innerHTML = ''; // Limpia el contenido
    if (screenName) {
      appDiv.setAttribute('data-pantalla', screenName);
    } else {
      appDiv.removeAttribute('data-pantalla');
    }
  } else {
    console.error("Contenedor #app no encontrado.");
  }
}

// Función para renderizar el menú dinámicamente basado en el estado de autenticación
function renderMenu(currentUser) {
  if (!menuDiv) {
    console.error("Contenedor #menu no encontrado.");
    return;
  }
  menuDiv.innerHTML = ""; // Limpia el menú existente

  let botones = [];

  if (currentUser) {
    botones = [
      { texto: "🏠 Home", id: "btn-home", action: () => { clearAppScreen('inicio'); renderHomePage(appDiv); }},
      // { texto: "🃏 Juego Original", id: "btn-original", action: () => { clearAppScreen('original'); renderOriginalPage(appDiv); }},
      { texto: "🎮 Juegos", id: "btn-juegos", action: navigateToJuegos },
      { texto: "👤 Perfil", id: "btn-perfil", action: () => { clearAppScreen('perfil'); renderProfilePage(appDiv, currentUser); }},
      { texto: "🚪 Logout", id: "btn-logout", action: async () => { await handleLogout(); /* No necesita appDiv si solo desloguea y auth.signOut() redirige o refresca */ }}
    ];
  } else {
    botones = [
      { texto: "🔑 Login", id: "btn-login", action: () => { clearAppScreen('login'); renderLoginPage(appDiv); }},
      { texto: "✍️ Registro", id: "btn-registro", action: () => { clearAppScreen('registro'); renderRegisterPage(appDiv); }}
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

// --- NAVEGACIÓN Y LÓGICA DE PANTALLAS ---
function navigateToJuegos() {
  clearAppScreen('juegos');
  if (appDiv) {
    appDiv.innerHTML = `<h2>Elige un Juego</h2>`;
    const btnJuegoCartas = document.createElement('button');
    btnJuegoCartas.textContent = "Operaciones con Cartas";
    btnJuegoCartas.onclick = () => {
      // Asegúrate de que 'iniciarJuegoDeCartas' esté disponible globalmente o importado
      // Si lo exportaste desde juego.js, necesitarías importarlo al principio de main.js
      // Ejemplo: import { iniciarJuegoDeCartas } from './juegos/juegoCartas.js'; (ajusta la ruta)
      // O si está en window:
      if (typeof window.iniciarJuegoDeCartas === 'function') {
        clearAppScreen('juego');
        window.iniciarJuegoDeCartas();
      } else {
        console.error("Función iniciarJuegoDeCartas no encontrada.");
        appDiv.innerHTML = "<p>Error al cargar el juego de cartas. Asegúrate de que esté correctamente exportado e importado o disponible globalmente.</p>";
      }
    };
    appDiv.appendChild(btnJuegoCartas);
    // Aquí podrías añadir más botones para otros juegos
  }
}

// --- INICIALIZACIÓN DE LA APP Y MANEJO DE AUTENTICACIÓN ---
function initializeApp() { // <<< --- LLAVE DE APERTURA AÑADIDA AQUÍ --- >>>
  if (!appDiv) {
    document.body.innerHTML = "<h1>Error crítico: Contenedor #app no encontrado. La aplicación no puede iniciar.</h1>";
    return;
  }

  onAuthStateChanged(auth, (user) => {
    console.log("Estado de autenticación cambiado. Usuario:", user ? user.uid : 'Ninguno');
    renderMenu(user);

    if (user) {
      clearAppScreen('inicio');
      renderHomePage(appDiv);
    } else {
      clearAppScreen('login');
      renderLoginPage(appDiv);
    }
  });
} // Cierre de initializeApp

// Llama a la inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}