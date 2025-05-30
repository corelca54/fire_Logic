// src/componentes/perfil.js
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

export async function renderProfilePage(container, currentUser, navigateTo) {
    const db = getFirestore();

    if (!currentUser) {
        container.innerHTML = `<p class="error-mensaje">No se pudo cargar el perfil. Usuario no definido.</p>`;
        return;
    }

    container.setAttribute('data-pantalla', 'perfil');
    container.innerHTML = `
        <div class="perfil-container animate__animated animate__fadeInUp">
            <header class="perfil-header">
                <img src="${currentUser.photoURL || './componentes/assets/img/iconos/avatar_default.png'}" alt="Avatar" class="avatar-perfil">
                <h2>${currentUser.displayName || currentUser.email.split('@')[0]}</h2>
                <p class="email-perfil">${currentUser.email}</p>
            </header>

            <section class="seccion-puntajes-perfil">
                <h3><i class="fas fa-medal"></i> Mis Mejores Puntajes</h3>
                
                <div class="puntajes-juego-especifico">
                    <h4>🃏 Operaciones con Cartas:</h4>
                    <div id="spinner-puntajes-cartas" class="spinner" style="font-size:0.9em; padding:5px;">Cargando...</div>
                    <ul id="lista-puntajes-cartas" class="leaderboard-lista leaderboard-perfil"></ul>
                </div>

                <div class="puntajes-juego-especifico">
                    <h4>🧠 Lógica y Acertijos:</h4>
                    <div id="spinner-puntajes-logica" class="spinner" style="font-size:0.9em; padding:5px;">Cargando...</div>
                    <ul id="lista-puntajes-logica" class="leaderboard-lista leaderboard-perfil"></ul>
                </div>

                <div class="puntajes-juego-especifico">
                    <h4>⚛️ Ciencia Divertida:</h4>
                    <div id="spinner-puntajes-ciencia" class="spinner" style="font-size:0.9em; padding:5px;">Cargando...</div>
                    <ul id="lista-puntajes-ciencia" class="leaderboard-lista leaderboard-perfil"></ul>
                </div>
            </section>
        </div>
    `;

    // Función para cargar puntajes de un juego específico
    async function cargarPuntajesUsuario(juegoId, ulElementId, spinnerId) {
        const ulElement = document.getElementById(ulElementId);
        const spinnerElement = document.getElementById(spinnerId);
        if (!ulElement || !spinnerElement) return;

        try {
            const q = query(
                collection(db, "puntajes"),
                where("userId", "==", currentUser.uid),
                where("juego", "==", juegoId), // Filtra por el juego específico
                orderBy("puntaje", "desc"),
                limit(5) // Mostrar los 5 mejores del usuario para este juego
            );
            const querySnapshot = await getDocs(q);
            spinnerElement.style.display = 'none';

            if (querySnapshot.empty) {
                ulElement.innerHTML = '<li>Aún no tienes puntajes registrados.</li>';
            } else {
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const li = document.createElement('li');
                    const fechaFormat = data.fecha ? new Date(data.fecha.seconds * 1000).toLocaleDateString() : '-';
                    li.innerHTML = `<span class="date">${fechaFormat}</span> - <strong class="score">${data.puntaje} puntos</strong>`;
                    ulElement.appendChild(li);
                });
            }
        } catch (error) {
            console.error(`Error cargando puntajes para ${juegoId}:`, error);
            spinnerElement.style.display = 'none';
            ulElement.innerHTML = '<li>Error al cargar puntajes.</li>';
        }
    }

    // Cargar puntajes para cada juego
    cargarPuntajesUsuario("Operaciones con Cartas", "lista-puntajes-cartas", "spinner-puntajes-cartas");
    cargarPuntajesUsuario("Lógica y Acertijos", "lista-puntajes-logica", "spinner-puntajes-logica");
    cargarPuntajesUsuario("Ciencia Divertida", "lista-puntajes-ciencia", "spinner-puntajes-ciencia");
}