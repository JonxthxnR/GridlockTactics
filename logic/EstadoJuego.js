import { Casilla } from './Casilla.js';
import { GeometriaTactica } from './GeometriaTactica.js';

export class EstadoJuego {
    constructor(matrizNumerica) {
        this.filas = matrizNumerica.length;
        this.columnas = matrizNumerica[0].length;
        this.turnoActual = 'JUGADOR';
        this.matriz = this.inicializarTablero(matrizNumerica);
    }

    inicializarTablero(matrizNumerica) {
        let nuevaMatriz = [];
        for (let y = 0; y < this.filas; y++) {
            let fila = [];
            for (let x = 0; x < this.columnas; x++) {
                fila.push(new Casilla(x, y, matrizNumerica[y][x]));
            }
            nuevaMatriz.push(fila);
        }
        return nuevaMatriz;
    }

    clonar() {
        let nuevoEstado = new EstadoJuego([[0]]); 
        nuevoEstado.filas = this.filas;
        nuevoEstado.columnas = this.columnas;
        nuevoEstado.turnoActual = this.turnoActual;
        
        nuevoEstado.matriz = this.matriz.map(fila => 
            fila.map(casilla => casilla.clonar())
        );
        
        return nuevoEstado;
    }

    obtenerUnidades(faccion) {
        let unidadesEncontradas = [];
        for (let y = 0; y < this.filas; y++) {
            for (let x = 0; x < this.columnas; x++) {
                const casilla = this.matriz[y][x];
                if (casilla.unidad && casilla.unidad.faccion === faccion && casilla.unidad.estaViva()) {
                    unidadesEncontradas.push({ unidad: casilla.unidad, casilla: casilla });
                }
            }
        }
        return unidadesEncontradas;
    }

    iaEstaViva() {
        return this.obtenerUnidades('IA').length > 0;
    }

    jugadorEstaVivo() {
        return this.obtenerUnidades('JUGADOR').length > 0;
    }

    esJuegoTerminado() {
        return !this.iaEstaViva() || !this.jugadorEstaVivo();
    }

    calcularTotalHPIA() {
        return this.obtenerUnidades('IA').reduce((total, u) => total + u.unidad.hpActual, 0);
    }

    calcularTotalHPJugador() {
        return this.obtenerUnidades('JUGADOR').reduce((total, u) => total + u.unidad.hpActual, 0);
    }

    calcularCoberturaIA() {
        return this.obtenerUnidades('IA').reduce((total, u) => {
            return total + (u.casilla.tipo === 1 ? 2 : 0);
        }, 0);
    }

    calcularAmenazaJugador() {
        const unidadesJugador = this.obtenerUnidades('JUGADOR');
        const unidadesIA = this.obtenerUnidades('IA');
        let amenazaTotal = 0;

        for (const jug of unidadesJugador) {
            for (const ia of unidadesIA) {
                const dist = GeometriaTactica.calcularDistancia(
                    jug.casilla.x, jug.casilla.y,
                    ia.casilla.x, ia.casilla.y
                );
                if (dist <= jug.unidad.rango && GeometriaTactica.tieneLineaDeVision(
                    this.matriz, jug.casilla.x, jug.casilla.y, ia.casilla.x, ia.casilla.y
                )) {
                    amenazaTotal += jug.unidad.dano;
                }
            }
        }
        return amenazaTotal;
    }

    /**
     * Incentivo de avance: premia que la IA cierre distancia hacia enemigos si está fuera de rango
     */
    calcularProximidadIA() {
        const unidadesIA = this.obtenerUnidades('IA');
        const unidadesJugador = this.obtenerUnidades('JUGADOR');
        if (unidadesIA.length === 0 || unidadesJugador.length === 0) return 0;

        let bonoProximidad = 0;
        for (const ia of unidadesIA) {
            let minDist = Infinity;
            for (const jug of unidadesJugador) {
                const d = GeometriaTactica.calcularDistancia(ia.casilla.x, ia.casilla.y, jug.casilla.x, jug.casilla.y);
                if (d < minDist) minDist = d;
            }
            // Mientras más cerca de su rango óptimo, mayor puntaje
            bonoProximidad += Math.max(0, 12 - minDist) * 0.25;
        }
        return bonoProximidad;
    }

    /**
     * Generador con Move Ordering para maximizar la poda Alfa-Beta
     */
    obtenerMovimientos(faccion) {
        const movimientos = [];
        const faccionEnemiga = faccion === 'IA' ? 'JUGADOR' : 'IA';
        const aliados = this.obtenerUnidades(faccion);
        const enemigos = this.obtenerUnidades(faccionEnemiga);

        for (const aliado of aliados) {
            const { unidad, casilla } = aliado;

            // Prioridad 1: Ataques legales
            for (const enemigo of enemigos) {
                const distancia = GeometriaTactica.calcularDistancia(
                    casilla.x, casilla.y,
                    enemigo.casilla.x, enemigo.casilla.y
                );

                if (distancia <= unidad.rango && GeometriaTactica.tieneLineaDeVision(
                    this.matriz, casilla.x, casilla.y, enemigo.casilla.x, enemigo.casilla.y
                )) {
                    movimientos.push({
                        tipo: 'ATACAR',
                        prioridad: 100,
                        origen: { x: casilla.x, y: casilla.y },
                        destino: { x: enemigo.casilla.x, y: enemigo.casilla.y },
                        descripcion: `[${unidad.clase}] ${unidad.id} dispara a ${enemigo.unidad.id}`
                    });
                }
            }

            // Prioridad 2 y 3: Desplazamientos (trincheras primero)
            if (unidad.pmActual > 0) {
                const celdas = GeometriaTactica.obtenerCasillasAlcanzables(
                    this.matriz, casilla.x, casilla.y, unidad.pmActual
                );

                for (const c of celdas) {
                    const esTrinchera = this.matriz[c.y][c.x].tipo === 1;
                    movimientos.push({
                        tipo: 'MOVER',
                        prioridad: esTrinchera ? 60 : 30,
                        origen: { x: casilla.x, y: casilla.y },
                        destino: { x: c.x, y: c.y },
                        costoPM: c.costo,
                        descripcion: `[${unidad.clase}] ${unidad.id} avanza a (${c.x},${c.y})${esTrinchera ? ' [TRINCHERA]' : ''}`
                    });
                }
            }

            // Prioridad 4: Mantener posición
            movimientos.push({
                tipo: 'MANTENER_POSICION',
                prioridad: 10,
                origen: { x: casilla.x, y: casilla.y },
                descripcion: `[${unidad.clase}] ${unidad.id} mantiene posición`
            });
        }

        // Ordenar de mayor a menor prioridad para cortar ramas temprano en Alfa-Beta
        return movimientos.sort((a, b) => b.prioridad - a.prioridad);
    }

    aplicarMovimiento(movimiento) {
        if (!movimiento) return;

        if (movimiento.tipo === 'MOVER') {
            const casillaOrigen = this.matriz[movimiento.origen.y][movimiento.origen.x];
            const casillaDestino = this.matriz[movimiento.destino.y][movimiento.destino.x];
            const unidad = casillaOrigen.unidad;

            if (unidad) {
                unidad.pmActual = Math.max(0, unidad.pmActual - movimiento.costoPM);
                casillaDestino.unidad = unidad;
                casillaOrigen.unidad = null;
            }
        } else if (movimiento.tipo === 'ATACAR') {
            const atacante = this.matriz[movimiento.origen.y][movimiento.origen.x].unidad;
            const casillaObjetivo = this.matriz[movimiento.destino.y][movimiento.destino.x];
            const objetivo = casillaObjetivo.unidad;

            if (atacante && objetivo) {
                const reduccionCobertura = casillaObjetivo.tipo === 1 ? 2 : 0;
                // Pasamos atacante como referencia usando su propia perforación si es Granadero
                const coberturaFinal = atacante.clase === 'GRANADERO'
                    ? Math.floor(reduccionCobertura / 2)
                    : reduccionCobertura;
                objetivo.recibirDano(atacante.dano, coberturaFinal);
                atacante.pmActual = 0;

                if (!objetivo.estaViva()) {
                    casillaObjetivo.unidad = null;
                }
            }
        } else if (movimiento.tipo === 'MANTENER_POSICION') {
            const unidad = this.matriz[movimiento.origen.y][movimiento.origen.x].unidad;
            if (unidad) {
                unidad.pmActual = 0;
            }
        }
    }

    iniciarTurno(faccion) {
        this.turnoActual = faccion;
        const unidades = this.obtenerUnidades(faccion);
        for (const u of unidades) {
            u.unidad.restaurarPM();
        }
    }
}