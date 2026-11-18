export class RenderizarTablero {
    constructor(idContenedor, alHacerClicCasilla, alPasarMouseCasilla) {
        this.contenedor = document.getElementById(idContenedor);
        this.alHacerClicCasilla = alHacerClicCasilla;
        this.alPasarMouseCasilla = alPasarMouseCasilla;
    }

    renderizar(matrizLogica, estadoVisual = {}) {
        this.contenedor.innerHTML = '';
        
        const {
            unidadSeleccionada = null,
            casillasMovimiento = [],
            objetivosAtaque = [],
            lineaMira = [],
            celdaImpacto = null
        } = estadoVisual;

        const filas = matrizLogica.length;
        const columnas = matrizLogica[0].length;

        this.contenedor.style.gridTemplateColumns = `repeat(${columnas}, var(--tamano-celda))`;
        this.contenedor.style.gridTemplateRows = `repeat(${filas}, var(--tamano-celda))`;

        const siglasClase = { FUSILERO: 'F', TIRADOR: 'T', GRANADERO: 'G' };

        for (let y = 0; y < filas; y++) {
            for (let x = 0; x < columnas; x++) {
                const casillaLogica = matrizLogica[y][x];
                const divCasilla = document.createElement('div');
                
                divCasilla.classList.add('casilla');
                
                if (casillaLogica.tipo === 0) divCasilla.classList.add('casilla-libre');
                else if (casillaLogica.tipo === 1) divCasilla.classList.add('casilla-trinchera');
                else if (casillaLogica.tipo === 2) divCasilla.classList.add('casilla-obstaculo');

                if (casillasMovimiento.some(c => c.x === x && c.y === y)) {
                    divCasilla.classList.add('casilla-movimiento');
                }

                if (objetivosAtaque.some(o => o.x === x && o.y === y)) {
                    divCasilla.classList.add('casilla-ataque');
                }

                if (unidadSeleccionada && unidadSeleccionada.x === x && unidadSeleccionada.y === y) {
                    divCasilla.classList.add('casilla-seleccionada');
                }

                // Trazado visual de Bresenham al apuntar
                const puntoMira = lineaMira.find(p => p.x === x && p.y === y);
                if (puntoMira) {
                    divCasilla.classList.add(puntoMira.bloqueada ? 'mira-bloqueada' : 'mira-despejada');
                }

                if (celdaImpacto && celdaImpacto.x === x && celdaImpacto.y === y) {
                    divCasilla.classList.add('efecto-impacto');
                }

                // Renderizar ficha de unidad
                if (casillaLogica.unidad) {
                    const u = casillaLogica.unidad;
                    const ficha = document.createElement('div');
                    ficha.classList.add('unidad-ficha');
                    
                    // Configurar visuales por clase tipo Krieg
                    let icono = '⚔';
                    let sigla = 'FSL';
                    if (u.clase === 'TIRADOR') {
                        icono = '⌖';
                        sigla = 'TDR';
                    } else if (u.clase === 'GRANADERO') {
                        icono = '☠'; // Calavera imperial para los Breachers
                        sigla = 'GRN';
                    }

                    // Identificar facción para las barras y clases
                    const esIA = u.faccion === 'IA';
                    if (esIA) {
                        ficha.classList.add('unidad-ia');
                    } else {
                        ficha.classList.add('unidad-jugador');
                        if (u.pmActual <= 0) {
                            ficha.style.opacity = '0.45';
                        }
                    }

                    // Calcular el % de vida restante para la micro-barra de vida
                    const porcentajeHP = Math.max(0, (u.hpActual / u.hpMax) * 100);

                    // Estructurar la placa de asedio
                    ficha.innerHTML = `
                        <span class="unidad-clase-nombre">${sigla}</span>
                        <span class="unidad-simbolo">${icono}</span>
                        <div class="hud-vida">
                            <div class="hud-vida-barra" style="width: ${porcentajeHP}%;"></div>
                        </div>
                    `;

                    // Tooltip táctico flotante en miniatura (mouse hover)
                    ficha.title = `[KRIEG ${u.faccion}] ${u.clase} - HP: ${u.hpActual}/${u.hpMax}`;

                    divCasilla.appendChild(ficha);
                }

                divCasilla.dataset.x = x;
                divCasilla.dataset.y = y;

                divCasilla.addEventListener('click', () => {
                    if (this.alHacerClicCasilla) this.alHacerClicCasilla(x, y);
                });

                divCasilla.addEventListener('mouseenter', () => {
                    if (this.alPasarMouseCasilla) this.alPasarMouseCasilla(x, y);
                });

                this.contenedor.appendChild(divCasilla);
            }
        }
    }
}