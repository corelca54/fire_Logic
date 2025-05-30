// src/componentes/perfil.js
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
// No necesitas getAuth aquí si currentUser se pasa como argumento

export async function renderProfilePage(container, currentUser, navigateTo) {
    const db = getFirestore(); // Obtener instancia de Firestore

    // Asegúrate de que currentUser no sea null
    if (!currentUser) {
        container.innerHTML = `<p class="error-mensaje">No se pudo cargar el perfil. Usuario no definido.</p>`;
        // Podrías añadir un botón para reintentar el login o ir a home
        // setTimeout(() => navigateTo('login'), 2000);
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
                <h3><i class="fas fa-star"></i> Mis Mejores Puntajes (Operaciones con Cartas) <i class="fas fa-star"></i></h3>
                <div id="spinner-mis-puntajes" class="spinner">Cargando tus hazañas...</div>
                <ul id="lista-mis-puntajes-perfil" class="leaderboard-lista">
                    {/* Los puntajes se cargarán aquí */}
                </ul>
            </section>
            
            {/* Puedes añadir más secciones aquí: cambiar nombre, etc. */}
            {/* <button id="btn-editar-perfil" class="btn btn-primario" style="margin-top:1.5rem;">Editar Perfil (Próximamente)</button> */}
        </div>
    `;

    const puntajesUl = document.getElementById('lista-mis-puntajes-perfil');
    const spinner = document.getElementById('spinner-mis-puntajes');

    try {
        const q = query(
            collection(db, "puntajes"),
            where("userId", "==", currentUser.uid),
            where("juego", "==", "Operaciones con Cartas"),
            orderBy("puntaje", "desc"),
            limit(10) // Mostrar hasta 10 mejores puntajes del usuario para este juego
        );
        const querySnapshot = await getDocs(q);

        if (spinner) spinner.style.display = 'none';

        if (querySnapshot.empty) {
            puntajesUl.innerHTML = '<li>Aún no has registrado puntajes en "Operaciones con Cartas". ¡A jugar!</li>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement('li');
                const fechaFormat = data.fecha ? new Date(data.fecha.seconds * 1000).toLocaleDateString() : '-';
                li.innerHTML = `<span class="date">${fechaFormat}</span> - <strong class="score">${data.puntaje} puntos</strong>`;
                puntajesUl.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Error cargando puntajes del usuario para el perfil:", error);
        if (spinner) spinner.style.display = 'none';
        puntajesUl.innerHTML = '<li>Hubo un error al cargar tus puntajes.</li>';
    }
}