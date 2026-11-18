export class Minimax {
    constructor(profundidadMaxima, pesosPersonalizados = null) {
        this.profundidadMaxima = profundidadMaxima;
        this.nodosEvaluados = 0;
        this.pesos = pesosPersonalizados || {
            P1: 1.0,
            P2: 1.0,
            P3: 0.5,
            P4: 1.5
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
        const proximidad = estado.calcularProximidadIA();

        return (this.pesos.P1 * hpIA) 
             - (this.pesos.P2 * hpJugador) 
             + (this.pesos.P3 * coberturaIA) 
             - (this.pesos.P4 * amenazaJugador)
             + proximidad;
    }

    obtenerMejorMovimiento(estado, profundidad) {
        this.nodosEvaluados = 0;
        let mejorPuntaje = -Infinity;
        let mejorMovimiento = null;
        
        const movimientos = estado.obtenerMovimientos('IA');

        if (movimientos.length === 0) {
            return { movimiento: null, puntaje: this.evaluarEstado(estado) };
        }

        for (let movimiento of movimientos) {
            const estadoSimulado = estado.clonar();
            estadoSimulado.aplicarMovimiento(movimiento);
            
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