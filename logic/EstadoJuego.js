import { Casilla } from './Casilla.js';

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

    // ==========================================
    // MÉTODOS PUENTE PARA LA HEURÍSTICA MINIMAX
    // ==========================================

    /**
     * Escanea todo el tablero y devuelve un arreglo con las unidades de la facción solicitada
     * y la casilla en la que están paradas.
     */
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

    // W1: Total de vida de la IA
    calcularTotalHPIA() {
        return this.obtenerUnidades('IA').reduce((total, u) => total + u.unidad.hpActual, 0);
    }

    // W2: Total de vida del Jugador
    calcularTotalHPJugador() {
        return this.obtenerUnidades('JUGADOR').reduce((total, u) => total + u.unidad.hpActual, 0);
    }

    // W3: Cobertura de la IA
    calcularCoberturaIA() {
        return this.obtenerUnidades('IA').reduce((total, u) => {
            // Según tus reglas, la trinchera otorga una reducción plana de -2. 
            // Sumamos 2 a la heurística por cada unidad resguardada.
            return total + (u.casilla.tipo === 1 ? 2 : 0);
        }, 0);
    }

    // W4: Amenaza del Jugador
    calcularAmenazaJugador() {
        // La amenaza base es el daño plano que las unidades del jugador pueden infligir.
        return this.obtenerUnidades('JUGADOR').reduce((total, u) => total + u.unidad.dano, 0);
    }

    /**
     * Stub para el generador de ramas.
     * Minimax usará esto para saber qué jugadas legales existen.
     */
obtenerMovimientos(faccion) {
        if (faccion === 'IA') {
            return [
                { tipo: 'MANTENER_POSICION', descripcion: 'Fortalecer trinchera y recuperar estabilidad defensiva' },
                { tipo: 'ATACAR', descripcion: 'Disparar al objetivo enemigo' }
            ];
        } else {
            return [
                { tipo: 'ESPERAR', descripcion: 'El jugador aguarda' }
            ];
        }
    }

    aplicarMovimiento(movimiento) {
        if (movimiento && movimiento.tipo === 'ATACAR') {
            // Simula daño al jugador al atacar
            let unidadesJugador = this.obtenerUnidades('JUGADOR');
            if (unidadesJugador.length > 0) {
                unidadesJugador[0].unidad.hpActual = Math.max(0, unidadesJugador[0].unidad.hpActual - 3);
            }
        } 
        else if (movimiento && movimiento.tipo === 'MANTENER_POSICION') {
            // Simula que al mantener posición y fortificarse en la trinchera, 
            // la IA optimiza sus defensas (recupera 2 HP tácticos en la simulación)
            let unidadesIA = this.obtenerUnidades('IA');
            if (unidadesIA.length > 0) {
                unidadesIA[0].unidad.hpActual += 2; 
            }
        }
    }
}