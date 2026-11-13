import { RenderizarTablero } from './ui/RenderizarTablero.js';
import { EstadoJuego } from './logic/EstadoJuego.js';
import { Unidad } from './logic/Unidad.js';
import { Minimax } from './logic/MinimaxPuro.js';

const matrizPrueba = [
    [0, 0, 2, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 2, 0],
    [0, 1, 0, 1, 0, 0, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 1, 1, 1, 0],
    [0, 2, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 2, 0, 0, 0],
    [0, 0, 0, 0, 2, 0, 0, 0]
];

function ejecutarSimulacion() {
    const hpIaInput = parseInt(document.getElementById('input-hp-ia').value);
    const hpJugadorInput = parseInt(document.getElementById('input-hp-jugador').value);
    const profundidadInput = parseInt(document.getElementById('input-profundidad').value);

    const pesosPersonalizados = {
        w1: parseFloat(document.getElementById('input-w1').value),
        w2: parseFloat(document.getElementById('input-w2').value),
        w3: parseFloat(document.getElementById('input-w3').value),
        w4: parseFloat(document.getElementById('input-w4').value)
    };

    const estadoActual = new EstadoJuego(matrizPrueba);
    const soldadoIA = new Unidad('ia-1', 'IA', hpIaInput, 2, 3, 4);
    const soldadoJugador = new Unidad('jug-1', 'JUGADOR', hpJugadorInput, 2, 3, 5);

    estadoActual.matriz[1][2].unidad = soldadoIA;      
    estadoActual.matriz[3][3].unidad = soldadoJugador; 

    const minimax = new Minimax(profundidadInput, pesosPersonalizados);
    
    const inicioTiempo = performance.now();
    // AQUÍ LA IA TOMA LA DECISIÓN REAL BUSCANDO EL MEJOR MOVIMIENTO
    const resultadoDecision = minimax.obtenerMejorMovimiento(estadoActual, profundidadInput);
    const finTiempo = performance.now();
    const tiempoEjecucion = (finTiempo - inicioTiempo).toFixed(4);

    const renderizador = new RenderizarTablero('tablero-juego');
    renderizador.renderizar(estadoActual.matriz);

    const panel = document.getElementById('panel-metricas');
    panel.innerHTML = `
        <h3>[DECISIÓN DEL MOTOR TÁCTICO - MINIMAX]</h3>
        <p><b>Acción Elegida por la IA:</b> <span style="color: #ffcc00;">${resultadoDecision.movimiento ? resultadoDecision.movimiento.descripcion : 'Ninguna'}</span></p>
        <p><b>Puntaje de la Decisión:</b> <span style="color: #00ffcc;">${resultadoDecision.puntaje}</span></p>
        <p><b>Indicadores de Complejidad:</b> ${minimax.nodosEvaluados} estados evaluados en ${tiempoEjecucion} ms</p>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    ejecutarSimulacion();
    document.getElementById('btn-calcular').addEventListener('click', ejecutarSimulacion);
});