import { RenderizarTablero } from './ui/RenderizarTablero.js';
import { EstadoJuego } from './logic/EstadoJuego.js';
import { Unidad } from './logic/Unidad.js';
import { GeometriaTactica } from './logic/GeometriaTactica.js';
import { Minimax } from './logic/MinimaxPuro.js';
import { MinimaxAlfaBeta } from './logic/MinimaxAlfaBeta.js';
import { GraficaPostPartida } from './ui/GraficaPostPartida.js';

const mapaBase = [
    [0, 0, 2, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 2, 0],
    [0, 1, 0, 1, 0, 0, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 1, 1, 1, 0],
    [0, 2, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 2, 0, 0, 0],
    [0, 0, 0, 0, 2, 0, 0, 0]
];

let estadoJuego = null;
let seleccionActual = null;
let casillasMovimiento = [];
let objetivosAtaque = [];
let lineaMira = [];
let celdaImpacto = null;
let renderizador = null;
let historialMetricas = [];

function agregarLog(mensaje, color = '#c8c8c8') {
    const contenedorLog = document.getElementById('log-combate');
    const p = document.createElement('p');
    p.style.color = color;
    p.textContent = `> ${mensaje}`;
    contenedorLog.prepend(p);
}

function obtenerPesosUI() {
    return {
        P1: parseFloat(document.getElementById('input-p1').value) || 1.0,
        P2: parseFloat(document.getElementById('input-p2').value) || 1.0,
        P3: parseFloat(document.getElementById('input-p3').value) || 0.5,
        P4: parseFloat(document.getElementById('input-p4').value) || 1.5
    };
}

function limpiarSeleccion() {
    seleccionActual = null;
    casillasMovimiento = [];
    objetivosAtaque = [];
    lineaMira = [];
    document.getElementById('info-unidad').textContent = 'Selecciona una unidad verde [FSL: Fusilero | TDR: Tirador | GRN: Granadero].';
}

function finalizarPartidaYMostrarGrafica() {
    limpiarSeleccion();
    actualizarVista();

    const ganoJugador = estadoJuego.jugadorEstaVivo();
    const profundidad = parseInt(document.getElementById('input-profundidad').value) || 2;

    GraficaPostPartida.mostrar('panel-postpartida', historialMetricas, ganoJugador, profundidad);
    document.getElementById('panel-postpartida').scrollIntoView({ behavior: 'smooth' });
}

function actualizarVista() {
    renderizador.renderizar(estadoJuego.matriz, {
        unidadSeleccionada: seleccionActual,
        casillasMovimiento,
        objetivosAtaque,
        lineaMira,
        celdaImpacto
    });

    const indicador = document.getElementById('indicador-turno');
    if (estadoJuego.esJuegoTerminado()) {
        const ganoJugador = estadoJuego.jugadorEstaVivo();
        indicador.textContent = ganoJugador ? 'VICTORIA IMPERIAL' : 'DERROTA TÁCTICA';
        indicador.style.color = ganoJugador ? '#4dff4d' : '#ff4444';
    } else {
        indicador.textContent = `TURNO: ${estadoJuego.turnoActual}`;
        indicador.style.color = estadoJuego.turnoActual === 'JUGADOR' ? '#00ffcc' : '#ff6666';
    }
}

function activarDestelloImpacto(x, y) {
    celdaImpacto = { x, y };
    actualizarVista();
    setTimeout(() => {
        celdaImpacto = null;
        actualizarVista();
    }, 360);
}

function pintarMiraEnDOM(celdasMira) {
    document.querySelectorAll('.casilla').forEach(el => {
        el.classList.remove('mira-despejada', 'mira-bloqueada');
    });
    for (const p of celdasMira) {
        const celdaEl = document.querySelector(`.casilla[data-x="${p.x}"][data-y="${p.y}"]`);
        if (celdaEl) {
            celdaEl.classList.add(p.bloqueada ? 'mira-bloqueada' : 'mira-despejada');
        }
    }
}

function calcularOpcionesUnidad(x, y) {
    const casilla = estadoJuego.matriz[y][x];
    const unidad = casilla.unidad;
    if (!unidad || unidad.faccion !== 'JUGADOR') return;

    seleccionActual = { x, y };
    lineaMira = [];
    document.getElementById('info-unidad').textContent = 
        `[${unidad.clase}] ${unidad.id} | HP: ${unidad.hpActual}/${unidad.hpMax} | PM: ${unidad.pmActual}/${unidad.pmMax} | Rango: ${unidad.rango} | Daño: ${unidad.dano}`;

    casillasMovimiento = unidad.pmActual > 0
        ? GeometriaTactica.obtenerCasillasAlcanzables(estadoJuego.matriz, x, y, unidad.pmActual)
        : [];

    objetivosAtaque = [];
    if (unidad.pmActual > 0) {
        const enemigos = estadoJuego.obtenerUnidades('IA');
        for (const enemigo of enemigos) {
            const dist = GeometriaTactica.calcularDistancia(x, y, enemigo.casilla.x, enemigo.casilla.y);
            if (dist <= unidad.rango && GeometriaTactica.tieneLineaDeVision(
                estadoJuego.matriz, x, y, enemigo.casilla.x, enemigo.casilla.y
            )) {
                objetivosAtaque.push({ x: enemigo.casilla.x, y: enemigo.casilla.y });
            }
        }
    }
}

function manejarHoverCasilla(x, y) {
    if (!seleccionActual || estadoJuego.turnoActual !== 'JUGADOR') return;

    const casillaHover = estadoJuego.matriz[y][x];
    const atacante = estadoJuego.matriz[seleccionActual.y][seleccionActual.x].unidad;
    if (!atacante) return;

    if (casillaHover.unidad && casillaHover.unidad.faccion === 'IA') {
        const bresenham = GeometriaTactica.obtenerLineaBresenham(
            estadoJuego.matriz, seleccionActual.x, seleccionActual.y, x, y
        );
        const dist = GeometriaTactica.calcularDistancia(seleccionActual.x, seleccionActual.y, x, y);
        lineaMira = bresenham.celdas;
        pintarMiraEnDOM(lineaMira);

        const infoEl = document.getElementById('info-unidad');
        if (!bresenham.despejada) {
            infoEl.textContent = `OBJETIVO BLOQUEADO POR OBSTÁCULO (Sin línea de visión)`;
        } else if (dist > atacante.rango) {
            infoEl.textContent = `FUERA DE RANGO (Distancia: ${dist} / Rango: ${atacante.rango})`;
        } else if (atacante.pmActual <= 0) {
            infoEl.textContent = `SIN PM DISPONIBLES PARA DISPARAR`;
        } else {
            const cobBase = casillaHover.tipo === 1 ? 2 : 0;
            const cobEfectiva = atacante.clase === 'GRANADERO' ? Math.floor(cobBase / 2) : cobBase;
            const danoFinal = Math.max(0, atacante.dano - cobEfectiva);
            infoEl.textContent = `TIRO LIMPIO -> Daño estimado: ${danoFinal} HP (${atacante.dano} base - ${cobEfectiva} cobertura)`;
        }
    } else if (lineaMira.length > 0) {
        lineaMira = [];
        pintarMiraEnDOM([]);
        document.getElementById('info-unidad').textContent = 
            `[${atacante.clase}] ${atacante.id} | HP: ${atacante.hpActual}/${atacante.hpMax} | PM: ${atacante.pmActual}/${atacante.pmMax} | Rango: ${atacante.rango} | Daño: ${atacante.dano}`;
    }
}

function manejarClicCasilla(x, y) {
    if (estadoJuego.turnoActual !== 'JUGADOR' || estadoJuego.esJuegoTerminado()) return;

    const casillaClic = estadoJuego.matriz[y][x];

    if (casillaClic.unidad && casillaClic.unidad.faccion === 'JUGADOR') {
        calcularOpcionesUnidad(x, y);
        actualizarVista();
        return;
    }

    if (seleccionActual) {
        const destinoMov = casillasMovimiento.find(c => c.x === x && c.y === y);
        if (destinoMov) {
            const mov = {
                tipo: 'MOVER',
                origen: { ...seleccionActual },
                destino: { x, y },
                costoPM: destinoMov.costo
            };
            const u = estadoJuego.matriz[seleccionActual.y][seleccionActual.x].unidad;
            estadoJuego.aplicarMovimiento(mov);
            agregarLog(`[${u.clase}] ${u.id} avanza a (${x},${y}) [-${destinoMov.costo} PM].`, '#a7ffeb');
            
            calcularOpcionesUnidad(x, y);
            actualizarVista();
            return;
        }

        const objetivoAtk = objetivosAtaque.find(o => o.x === x && o.y === y);
        if (objetivoAtk) {
            const atacante = estadoJuego.matriz[seleccionActual.y][seleccionActual.x].unidad;
            const objetivo = casillaClic.unidad;
            const enTrinchera = casillaClic.tipo === 1;

            const mov = {
                tipo: 'ATACAR',
                origen: { ...seleccionActual },
                destino: { x, y }
            };
            estadoJuego.aplicarMovimiento(mov);
            lineaMira = [];
            agregarLog(
                `[${atacante.clase}] ${atacante.id} abre fuego contra ${objetivo.id}${enTrinchera ? ' (en trinchera)' : ''}.`,
                '#ffcc00'
            );
            activarDestelloImpacto(x, y);

            if (estadoJuego.esJuegoTerminado()) {
                agregarLog('¡Sector asegurado! Todas las unidades enemigas eliminadas.', '#4dff4d');
                finalizarPartidaYMostrarGrafica();
                return;
            } else {
                calcularOpcionesUnidad(seleccionActual.x, seleccionActual.y);
            }
            actualizarVista();
            return;
        }
    }

    limpiarSeleccion();
    actualizarVista();
}

function ejecutarTurnoIA() {
    if (estadoJuego.esJuegoTerminado()) return;

    estadoJuego.iniciarTurno('IA');
    limpiarSeleccion();
    actualizarVista();

    const profundidad = parseInt(document.getElementById('input-profundidad').value) || 2;
    const pesos = obtenerPesosUI();
    const motorPuro = new Minimax(profundidad, pesos);
    const motorAlfaBeta = new MinimaxAlfaBeta(profundidad, pesos);

    const unidadesIA = estadoJuego.obtenerUnidades('IA');
    let indice = 0;

    function actuarSiguienteUnidad() {
        if (indice >= unidadesIA.length || estadoJuego.esJuegoTerminado()) {
            if (!estadoJuego.esJuegoTerminado()) {
                estadoJuego.iniciarTurno('JUGADOR');
                agregarLog('--- Turno del Jugador (PM restaurados) ---', '#00ffcc');
                actualizarVista();
            } else {
                agregarLog('Tu escuadra ha sido aniquilada en tierra de nadie.', '#ff4444');
                finalizarPartidaYMostrarGrafica();
            }
            return;
        }

        // 1. Medir Minimax Puro sobre una copia exacta del tablero actual
        const t0Puro = performance.now();
        const resPuro = motorPuro.obtenerMejorMovimiento(estadoJuego.clonar(), profundidad);
        const tiempoPuro = performance.now() - t0Puro;

        // 2. Medir Minimax con Poda Alfa-Beta sobre el mismo estado
        const t0AB = performance.now();
        const decisionAB = motorAlfaBeta.obtenerMejorMovimiento(estadoJuego, profundidad);
        const tiempoAB = performance.now() - t0AB;

        historialMetricas.push({
            jugada: historialMetricas.length + 1,
            nodosPuro: motorPuro.nodosEvaluados,
            nodosAB: motorAlfaBeta.nodosEvaluados,
            tiempoPuro,
            tiempoAB,
            puntaje: decisionAB.puntaje
        });

        if (decisionAB && decisionAB.movimiento) {
            estadoJuego.aplicarMovimiento(decisionAB.movimiento);
            agregarLog(
                `[IA] ${decisionAB.movimiento.descripcion} | Puro: ${motorPuro.nodosEvaluados} nodos (${tiempoPuro.toFixed(1)}ms) vs Alfa-Beta: ${motorAlfaBeta.nodosEvaluados} nodos (${tiempoAB.toFixed(1)}ms)`,
                '#ff9999'
            );
            if (decisionAB.movimiento.tipo === 'ATACAR') {
                activarDestelloImpacto(decisionAB.movimiento.destino.x, decisionAB.movimiento.destino.y);
            }
        }

        actualizarVista();
        indice++;
        setTimeout(actuarSiguienteUnidad, 500);
    }

    setTimeout(actuarSiguienteUnidad, 350);
}

function iniciarPartida() {
    document.getElementById('log-combate').innerHTML = '';
    const panelPost = document.getElementById('panel-postpartida');
    if (panelPost) panelPost.style.display = 'none';

    historialMetricas = [];
    estadoJuego = new EstadoJuego(mapaBase);

    estadoJuego.matriz[0][4].unidad = Unidad.crearPorClase('krieg-tirador', 'IA', 'TIRADOR');
    estadoJuego.matriz[1][2].unidad = Unidad.crearPorClase('krieg-fusilero', 'IA', 'FUSILERO');
    estadoJuego.matriz[2][5].unidad = Unidad.crearPorClase('krieg-granadero', 'IA', 'GRANADERO');

    estadoJuego.matriz[5][5].unidad = Unidad.crearPorClase('escuadra-fusilero', 'JUGADOR', 'FUSILERO');
    estadoJuego.matriz[5][2].unidad = Unidad.crearPorClase('escuadra-granadero', 'JUGADOR', 'GRANADERO');
    estadoJuego.matriz[7][1].unidad = Unidad.crearPorClase('escuadra-tirador', 'JUGADOR', 'TIRADOR');

    estadoJuego.iniciarTurno('JUGADOR');
    limpiarSeleccion();
    agregarLog('Escuadras desplegadas. Al finalizar la partida se generará el reporte gráfico de Minimax Puro vs Alfa-Beta.', '#00ffcc');
    actualizarVista();
}

document.addEventListener('DOMContentLoaded', () => {
    renderizador = new RenderizarTablero('tablero-juego', manejarClicCasilla, manejarHoverCasilla);
    iniciarPartida();

    document.getElementById('btn-fin-turno').addEventListener('click', () => {
        if (estadoJuego.turnoActual === 'JUGADOR' && !estadoJuego.esJuegoTerminado()) {
            ejecutarTurnoIA();
        }
    });

    document.getElementById('btn-reiniciar').addEventListener('click', iniciarPartida);
});