// src/componentes/home.js
// Esta página ahora mostrará todas las cartas y filtros.

let todasLasCartasOriginales = []; 
let mazoIdActual = null; 

const VALORES_CARTAS = ["ACE", "2", "3", "4", "5", "6", "7", "8", "9", "10", "JACK", "QUEEN", "KING"];
const PALOS_CARTAS = ["SPADES", "DIAMONDS", "CLUBS", "HEARTS"];
const PALOS_TRADUCIDOS = {
    "SPADES": "Picas ♠️", "DIAMONDS": "Diamantes ♦️",
    "CLUBS": "Tréboles ♣️", "HEARTS": "Corazones ♥️"
};

async function fetchMazoCompleto() {
    try {
        const newDeckResponse = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        const newDeckData = await newDeckResponse.json();
        if (!newDeckData.success) throw new Error('No se pudo crear un nuevo mazo.');
        mazoIdActual = newDeckData.deck_id;
        const drawAllResponse = await fetch(`https://deckofcardsapi.com/api/deck/${mazoIdActual}/draw/?count=52`);
        const drawAllData = await drawAllResponse.json();
        if (!drawAllData.success || drawAllData.cards.length !== 52) throw new Error('No se pudieron sacar las 52 cartas.');
        todasLasCartasOriginales = drawAllData.cards;
        return todasLasCartasOriginales;
    } catch (error) {
        console.error("Error obteniendo el mazo completo:", error);
        return null;
    }
}

function renderizarCartas(cartasParaMostrar, container) {
    container.innerHTML = '';
    if (cartasParaMostrar && cartasParaMostrar.length > 0) {
        cartasParaMostrar.forEach(carta => {
            const cartaElement = document.createElement('div');
            cartaElement.className = 'card animate__animated animate__fadeIn'; // Añadir animación
            cartaElement.dataset.value = carta.value;
            cartaElement.dataset.suit = carta.suit;
            cartaElement.innerHTML = `<img src="${carta.image}" alt="${carta.value} of ${carta.suit}" title="${carta.value} de ${PALOS_TRADUCIDOS[carta.suit] || carta.suit}">`;
            container.appendChild(cartaElement);
        });
    } else {
        container.innerHTML = '<p class="info-mensaje">No hay cartas que coincidan con tu filtro.</p>';
    }
}

function aplicarFiltros() {
    const filtroValorEl = document.getElementById('filtro-valor-mazos');
    const filtroPaloEl = document.getElementById('filtro-palo-mazos');
    const cartasContainer = document.getElementById('cartas-mazos-container');
    if (!filtroValorEl || !filtroPaloEl || !cartasContainer) return;
    const valorSeleccionado = filtroValorEl.value;
    const paloSeleccionado = filtroPaloEl.value;
    let cartasFiltradas = todasLasCartasOriginales;
    if (valorSeleccionado) cartasFiltradas = cartasFiltradas.filter(carta => carta.value === valorSeleccionado);
    if (paloSeleccionado) cartasFiltradas = cartasFiltradas.filter(carta => carta.suit === paloSeleccionado);
    renderizarCartas(cartasFiltradas, cartasContainer);
}

export default async function renderHomePage(appContainer, navigateTo) {
    appContainer.innerHTML = `
        <div class="mis-mazos-vista">
            <header class="mazos-header">
                <h1>Explorador de Mazos</h1>
                <p>Visualiza todas las cartas y fíltralas a tu gusto.</p>
                <button id="btn-ir-a-selector-juegos" class="btn-accion-home btn-primario">🎮 Ir a Juegos</button>
            </header>
            <div class="filtros-mazos-container">
                <select id="filtro-valor-mazos">
                    <option value="">-- Valor --</option>
                    ${VALORES_CARTAS.map(v => `<option value="${v}">${v}</option>`).join('')}
                </select>
                <select id="filtro-palo-mazos">
                    <option value="">-- Palo --</option>
                    ${PALOS_CARTAS.map(p => `<option value="${p}">${PALOS_TRADUCIDOS[p] || p}</option>`).join('')}
                </select>
                <button id="btn-reset-filtros-mazos" class="btn-accion-home btn-secundario">🔄 Reset</button>
            </div>
            <div id="mazos-spinner" class="spinner" style="display:block;">Cargando mazo...</div>
            <div id="mazos-error" class="error-mensaje" style="display:none;"></div>
            <div id="cartas-mazos-container" class="card-container" style="margin-top:20px;"></div>
        </div>
    `;
    const spinner = document.getElementById('mazos-spinner');
    const errorDiv = document.getElementById('mazos-error');
    const cartasContainer = document.getElementById('cartas-mazos-container');
    document.getElementById('btn-ir-a-selector-juegos').onclick = () => navigateTo('selectorJuegos');
    document.getElementById('filtro-valor-mazos').onchange = aplicarFiltros;
    document.getElementById('filtro-palo-mazos').onchange = aplicarFiltros;
    document.getElementById('btn-reset-filtros-mazos').onclick = () => {
        document.getElementById('filtro-valor-mazos').value = '';
        document.getElementById('filtro-palo-mazos').value = '';
        aplicarFiltros();
    };
    const cartas = await fetchMazoCompleto();
    spinner.style.display = 'none';
    if (cartas) {
        renderizarCartas(cartas, cartasContainer);
    } else {
        errorDiv.textContent = 'Error al cargar el mazo. Intenta recargar.';
        errorDiv.style.display = 'block';
        cartasContainer.innerHTML = '';
    }
}