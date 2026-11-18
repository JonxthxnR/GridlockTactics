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

                if (casillaLogica.unidad) {
                    const ficha = document.createElement('div');
                    ficha.classList.add('unidad-ficha');
                    const letra = siglasClase[casillaLogica.unidad.clase] || 'F';
                    
                    if (casillaLogica.unidad.faccion === 'IA') {
                        ficha.classList.add('unidad-ia');
                        ficha.textContent = `${letra}:${casillaLogica.unidad.hpActual}`;
                    } else {
                        ficha.classList.add('unidad-jugador');
                        ficha.textContent = `${letra}:${casillaLogica.unidad.hpActual}`;
                        if (casillaLogica.unidad.pmActual <= 0) {
                            ficha.style.opacity = '0.5';
                        }
                    }
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