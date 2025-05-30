function mostrarFavoritos() {
    const app = document.getElementById('app');
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    
    app.innerHTML = `
      <h1>❤️ Tus Cartas Favoritas</h1>
      
      ${favoritos.length === 0 ? `
        <div class="sin-favoritos">
          <p>Aún no tienes cartas favoritas.</p>
          <p>Agrega algunas desde la pantalla principal.</p>
          <button onclick="cargarPantalla('inicio')">Ir a Inicio</button>
        </div>
      ` : `
        <div class="card-container" id="lista-favoritos"></div>
        <button onclick="limpiarFavoritos()" class="btn-limpiar">Limpiar Todos</button>
      `}
    `;
    
    if (favoritos.length > 0) {
      const container = document.getElementById('lista-favoritos');
      container.innerHTML = favoritos.map(carta => `
        <div class="card">
          <img src="${carta.image}" alt="${carta.value} of ${carta.suit}">
          <button class="favorito" onclick="toggleFavorito('${carta.code}')">
            <img src="img/iconos/favorito-lleno.png" alt="Quitar de favoritos">
          </button>
        </div>
      `).join('');
    }
  }
  
  function limpiarFavoritos() {
    if (confirm('¿Estás seguro de que quieres eliminar todos tus favoritos?')) {
      localStorage.removeItem('favoritos');
      mostrarFavoritos();
      mostrarMensaje('Todos los favoritos fueron eliminados');
    }
  }
  
  window.mostrarFavoritos = mostrarFavoritos;
  window.limpiarFavoritos = limpiarFavoritos;