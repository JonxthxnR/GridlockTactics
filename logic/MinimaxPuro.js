export class Minimax {
    constructor(profundidadMaxima, pesosPersonalizados = null) {
        this.profundidadMaxima = profundidadMaxima;
        this.nodosEvaluados = 0;
        this.pesos = pesosPersonalizados || {
            w1: 1.0, w2: 1.0, w3: 0.5, w4: 1.5
        };
    }

    evaluarEstado(estado) {
        this.nodosEvaluados++;
        if (!estado.iaEstaViva()) return -99999; 
        if (!estado.jugadorEstaVivo()) return 99999; 

        const hpIA = estado.calcularTotalHPIA();
        const hpJugador = estado.calcularTotalHPJugador();
        const coberturaIA = estado.calcularCoberturaIA();
        const amenazaJugador = estado.calcularAmenazaJugador();

        return (this.pesos.w1 * hpIA) - (this.pesos.w2 * hpJugador) + (this.pesos.w3 * coberturaIA) - (this.pesos.w4 * amenazaJugador);
    }

    /**
     * NUEVO: El algoritmo principal que toma la decisión.
     * Evalúa los movimientos posibles de la IA y elige el que tiene mayor evaluación.
     */
    obtenerMejorMovimiento(estado, profundidad) {
        this.nodosEvaluados = 0;
        let mejorPuntaje = -Infinity;
        let mejorMovimiento = null;
        
        const movimientos = estado.obtenerMovimientos('IA');

        // Si no hay movimientos posibles definidos aún, devuelve null
        if (movimientos.length === 0) {
            return { movimiento: null, puntaje: this.evaluarEstado(estado) };
        }

        for (let movimiento of movimientos) {
            const estadoSimulado = estado.clonar();
            estadoSimulado.aplicarMovimiento(movimiento);
            
            // Llama al minimax recursivo para el turno del jugador (false)
            const puntaje = this.ejecutar(estadoSimulado, profundidad - 1, false);

            if (puntaje > mejorPuntaje) {
                mejorPuntaje = puntaje;
                mejorMovimiento = movimiento;
            }
        }

        return { movimiento: mejorMovimiento, puntaje: mejorPuntaje };
    }

    ejecutar(estado, profundidad, esMaximizador) {
        const faccionActual = esMaximizador ? 'IA' : 'JUGADOR';
        const movimientos = estado.obtenerMovimientos(faccionActual);

        if (profundidad === 0 || estado.esJuegoTerminado() || movimientos.length === 0) {
            return this.evaluarEstado(estado);
        }

        if (esMaximizador) {
            let maxEval = -Infinity;
            for (let movimiento of movimientos) {
                const estadoSimulado = estado.clonar();
                estadoSimulado.aplicarMovimiento(movimiento);
                const evaluacion = this.ejecutar(estadoSimulado, profundidad - 1, false);
                maxEval = Math.max(maxEval, evaluacion);
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let movimiento of movimientos) {
                const estadoSimulado = estado.clonar();
                estadoSimulado.aplicarMovimiento(movimiento);
                const evaluacion = this.ejecutar(estadoSimulado, profundidad - 1, true);
                minEval = Math.min(minEval, evaluacion);
            }
            return minEval;
        }
    }
}