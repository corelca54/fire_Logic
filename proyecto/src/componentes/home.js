// src/componentes/home.js
// Esta página ahora mostrará todas las cartas y filtros.

// Estas variables deben estar a nivel de módulo para que persistan entre llamadas a aplicarFiltros
let todasLasCartasOriginales = []; 
let mazoIdActual = null; 

const VALORES_CARTAS = ["ACE", "2", "3", "4", "5", "6", "7", "8", "9", "10", "JACK", "QUEEN", "KING"];
const PALOS_CARTAS = ["SPADES", "DIAMONDS", "CLUBS", "HEARTS"]; // Picas, Diamantes, Tréboles, Corazones
const PALOS_TRADUCIDOS = {
    "SPADES": "Picas ♠️",
    "DIAMONDS": "Diamantes ♦️",
    "CLUBS": "Tréboles ♣️",
    "HEARTS": "Corazones ♥️"
};

async function fetchMazoCompleto() {
    try {
        // Siempre creamos un mazo nuevo para esta vista para asegurar 52 cartas frescas
        // Podrías optimizar esto para reusar un mazo si mazoIdActual ya existe y tiene cartas.
        console.log("Fetching new deck...");
        const newDeckResponse = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        const newDeckData = await newDeckResponse.json();
        if (!newDeckData.success) {
            console.error("API Error (new deck):", newDeckData);
            throw new Error('No se pudo crear un nuevo mazo desde la API.');
        }
        mazoIdActual = newDeckData.deck_id;
        console.log("Nuevo mazo ID:", mazoIdActual);

        const drawAllResponse = await fetch(`https://deckofcardsapi.com/api/deck/${mazoIdActual}/draw/?count=52`);
        const drawAllData = await drawAllResponse.json();

        if (!drawAllData.success || !drawAllData.cards || drawAllData.cards.length !== 52) {
            console.error("API Error (draw cards):", drawAllData);
            throw new Error('No se pudieron sacar las 52 cartas del mazo.');
        }
        todasLasCartasOriginales = drawAllData.cards;
        console.log("Cartas obtenidas:", todasLasCartasOriginales.length);
        return todasLasCartasOriginales;
    } catch (error) {
        console.error("Error detallado en fetchMazoCompleto:", error);
        // Mostrar error en la UI
        const errorDiv = document.getElementById('mazos-error');
        if(errorDiv) {
            errorDiv.textContent = `Error al cargar el mazo: ${error.message}. Intenta recargar.`;
            errorDiv.style.display = 'block';
        }
        const spinner = document.getElementById('mazos-spinner');
        if(spinner) spinner.style.display = 'none';
        return null;
    }
}

function renderizarCartas(cartasParaMostrar, containerElement) {
    if (!containerElement) {
        console.error("Contenedor de cartas no encontrado para renderizar.");
        return;
    }
    containerElement.innerHTML = ''; // Limpiar antes de añadir nuevas cartas
    if (cartasParaMostrar && cartasParaMostrar.length > 0) {
        cartasParaMostrar.forEach(carta => {
            const cartaElement = document.createElement('div');
            // Aplicar la clase .card para que los estilos CSS tomen efecto
            cartaElement.className = 'card animate__animated animate__fadeIn'; 
            cartaElement.dataset.value = carta.value;
            cartaElement.dataset.suit = carta.suit;
            cartaElement.innerHTML = `<img src="${carta.image}" alt="${carta.value} of ${carta.suit}" title="${carta.value} de ${PALOS_TRADUCIDOS[carta.suit] || carta.suit}">`;
            containerElement.appendChild(cartaElement);
        });
    } else {
        containerElement.innerHTML = '<p class="info-mensaje">No se encontraron cartas que coincidan con tu filtro.</p>';
    }
}

function aplicarFiltros() {
    // Obtener los elementos cada vez que se llama, por si la UI se re-renderiza
    const filtroValorEl = document.getElementById('filtro-valor-mazos');
    const filtroPaloEl = document.getElementById('filtro-palo-mazos');
    const cartasContainerEl = document.getElementById('cartas-mazos-container'); // Asegúrate que este ID exista

    if (!filtroValorEl || !filtroPaloEl || !cartasContainerEl) {
        console.warn("Elementos de filtro o contenedor de cartas no encontrados al aplicar filtros.");
        return;
    }

    const valorSeleccionado = filtroValorEl.value;
    const paloSeleccionado = filtroPaloEl.value;
    let cartasFiltradas = todasLasCartasOriginales;

    if (valorSeleccionado) {
        cartasFiltradas = cartasFiltradas.filter(carta => carta.value === valorSeleccionado);
    }
    if (paloSeleccionado) {
        cartasFiltradas = cartasFiltradas.filter(carta => carta.suit === paloSeleccionado);
    }
    renderizarCartas(cartasFiltradas, cartasContainerEl);
}

// La función principal que se exporta y es llamada por main.js
export default async function renderHomePage(appContainer, navigateTo) {
    // Estructura HTML principal para la vista "Mis Mazos"
    // Usamos clases CSS que DEBEN estar definidas en tu archivo style.css
    appContainer.innerHTML = `
        <div class="mis-mazos-vista">
            <div class="mis-mazos-header-y-filtros">
                <header class="mazos-header">
                    <h1>Explorador de Mazos</h1>
                    <p>Visualiza todas las cartas y fíltralas a tu gusto.</p>
                    <button id="btn-ir-a-selector-juegos" class="btn-accion-home btn-primario">🎮 Ir a Juegos</button>
                </header>
                <div class="filtros-mazos-container">
                    <select id="filtro-valor-mazos">
                        <option value="">-- Todos los Valores --</option>
                        ${VALORES_CARTAS.map(v => `<option value="${v}">${v}</option>`).join('')}
                    </select>
                    <select id="filtro-palo-mazos">
                        <option value="">-- Todos los Palos --</option>
                        ${PALOS_CARTAS.map(p => `<option value="${p}">${PALOS_TRADUCIDOS[p] || p}</option>`).join('')}
                    </select>
                    <button id="btn-reset-filtros-mazos" class="btn-accion-home btn-secundario">🔄 Reset Filtros</button>
                </div>
            </div>

            <div id="mazos-spinner" class="spinner" style="display: block; text-align: center; padding: 20px;">Cargando mazo completo...</div>
            <div id="mazos-error" class="error-mensaje" style="display: none; text-align: center;"></div>
            
            {/* Este es el contenedor que queremos que sea full-width */}
            <div id="cartas-mazos-container" class="card-container-full-width" style="margin-top: 20px;">
                {/* Las cartas se insertarán aquí por renderizarCartas */}
            </div>
        </div>
    `;
    
    // Obtener referencias a los elementos recién creados
    const spinner = document.getElementById('mazos-spinner');
    const errorDiv = document.getElementById('mazos-error');
    const cartasContainer = document.getElementById('cartas-mazos-container'); // Este es el importante para las cartas
    
    // Añadir event listeners
    document.getElementById('btn-ir-a-selector-juegos').onclick = () => navigateTo('selectorJuegos');
    document.getElementById('filtro-valor-mazos').onchange = aplicarFiltros;
    document.getElementById('filtro-palo-mazos').onchange = aplicarFiltros;
    document.getElementById('btn-reset-filtros-mazos').onclick = () => {
        const filtroValorEl = document.getElementById('filtro-valor-mazos');
        const filtroPaloEl = document.getElementById('filtro-palo-mazos');
        if (filtroValorEl) filtroValorEl.value = '';
        if (filtroPaloEl) filtroPaloEl.value = '';
        aplicarFiltros();
    };

    // Cargar y mostrar las cartas
    const cartas = await fetchMazoCompleto();
    if (spinner) spinner.style.display = 'none';

    if (cartas) {
        if (cartasContainer) { // Asegurarse de que el contenedor exista
            renderizarCartas(cartas, cartasContainer);
        } else {
            console.error("El contenedor 'cartas-mazos-container' no fue encontrado en el DOM para renderizar cartas.");
            if(errorDiv) {
                 errorDiv.textContent = 'Error interno: No se pudo mostrar el mazo.';
                 errorDiv.style.display = 'block';
            }
        }
    } else {
        // fetchMazoCompleto ya debería haber manejado el errorDiv si falló
        if (cartasContainer) cartasContainer.innerHTML = ''; // Limpiar por si acaso
    }
}