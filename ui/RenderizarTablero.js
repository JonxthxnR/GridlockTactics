export class RenderizarTablero {
    constructor(idContenedor) {
        this.contenedor = document.getElementById(idContenedor);
    }

    renderizar(matrizLogica) {
        this.contenedor.innerHTML = '';
        
        const filas = matrizLogica.length;
        const columnas = matrizLogica[0].length;

        this.contenedor.style.gridTemplateColumns = `repeat(${columnas}, var(--tamano-celda))`;
        this.contenedor.style.gridTemplateRows = `repeat(${filas}, var(--tamano-celda))`;

        for (let y = 0; y < filas; y++) {
            for (let x = 0; x < columnas; x++) {
                const casillaLogica = matrizLogica[y][x];
                const divCasilla = document.createElement('div');
                
                divCasilla.classList.add('casilla');
                
                // Tipos de terreno
                if (casillaLogica.tipo === 0) divCasilla.classList.add('casilla-libre');
                else if (casillaLogica.tipo === 1) divCasilla.classList.add('casilla-trinchera');
                else if (casillaLogica.tipo === 2) divCasilla.classList.add('casilla-obstaculo');

                // Si hay una unidad parada aquí, la renderizamos visualmente
                if (casillaLogica.unidad) {
                    const ficha = document.createElement('div');
                    ficha.classList.add('unidad-ficha');
                    
                    if (casillaLogica.unidad.faccion === 'IA') {
                        ficha.classList.add('unidad-ia');
                        ficha.textContent = `IA(${casillaLogica.unidad.hpActual})`;
                    } else {
                        ficha.classList.add('unidad-jugador');
                        ficha.textContent = `P(${casillaLogica.unidad.hpActual})`;
                    }
                    divCasilla.appendChild(ficha);
                }

                divCasilla.dataset.x = x;
                divCasilla.dataset.y = y;

                this.contenedor.appendChild(divCasilla);
            }
        }
    }
}