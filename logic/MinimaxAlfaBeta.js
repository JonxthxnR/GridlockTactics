export class MinimaxAlfaBeta {
    constructor(profundidadMaxima, pesosPersonalizados = null) {
        this.profundidadMaxima = profundidadMaxima;
        this.nodosEvaluados = 0; // Contador de complejidad para comparar con el Minimax Puro
        
        this.pesos = pesosPersonalizados || {
            P1: 1.0, // HP IA
            P2: 1.0, // HP Jugador
            P3: 0.5, // Cobertura IA
            P4: 1.5  // Amenaza Jugador
        };
    }

    /**
     * Función Heurística f(s) - Idéntica a la del Minimax Puro
     */
    evaluarEstado(estado) {
        this.nodosEvaluados++;

        if (!estado.iaEstaViva()) return -99999; 
        if (!estado.jugadorEstaVivo()) return 99999; 

        const hpIA = estado.calcularTotalHPIA();
        const hpJugador = estado.calcularTotalHPJugador();
        const coberturaIA = estado.calcularCoberturaIA();
        const amenazaJugador = estado.calcularAmenazaJugador();
        const proximidad = estado.calcularProximidadIA();

        return (this.pesos.P1 * hpIA) 
              - (this.pesos.P2 * hpJugador) 
              + (this.pesos.P3 * coberturaIA) 
              - (this.pesos.P4 * amenazaJugador)
              + proximidad;
    }

    /**
     * Motor de búsqueda con Poda Alfa-Beta
     */
    obtenerMejorMovimiento(estado, profundidad) {
        this.nodosEvaluados = 0;
        let mejorPuntaje = -Infinity;
        let mejorMovimiento = null;
        
        const movimientos = estado.obtenerMovimientos('IA');

        if (movimientos.length === 0) {
            return { movimiento: null, puntaje: this.evaluarEstado(estado) };
        }

        let alfa = -Infinity;
        let beta = Infinity;

        for (let movimiento of movimientos) {
            const estadoSimulado = estado.clonar();
            estadoSimulado.aplicarMovimiento(movimiento);
            
            // Llamada recursiva con Alfa-Beta (el turno siguiente minimiza -> false)
            const puntaje = this.ejecutarAlfaBeta(estadoSimulado, profundidad - 1, alfa, beta, false);

            if (puntaje > mejorPuntaje) {
                mejorPuntaje = puntaje;
                mejorMovimiento = movimiento;
            }
            alfa = Math.max(alfa, puntaje);
        }

        return { movimiento: mejorMovimiento, puntaje: mejorPuntaje };
    }

    ejecutarAlfaBeta(estado, profundidad, alfa, beta, esMaximizador) {
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
                
                const evaluacion = this.ejecutarAlfaBeta(estadoSimulado, profundidad - 1, alfa, beta, false);
                maxEval = Math.max(maxEval, evaluacion);
                alfa = Math.max(alfa, evaluacion);
                
                // Condición de Poda Alfa-Beta
                if (beta <= alfa) {
                    break; // Corta la rama
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let movimiento of movimientos) {
                const estadoSimulado = estado.clonar();
                estadoSimulado.aplicarMovimiento(movimiento);
                
                const evaluacion = this.ejecutarAlfaBeta(estadoSimulado, profundidad - 1, alfa, beta, true);
                minEval = Math.min(minEval, evaluacion);
                beta = Math.min(beta, evaluacion);
                
                // Condición de Poda Alfa-Beta
                if (beta <= alfa) {
                    break; // Corta la rama
                }
            }
            return minEval;
        }
    }
}