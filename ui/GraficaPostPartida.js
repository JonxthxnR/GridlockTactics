export class GraficaPostPartida {
    static mostrar(contenedorId, historialMetricas, ganoJugador, profundidadUsada) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;

        const totalNodosPuro = historialMetricas.reduce((acc, m) => acc + m.nodosPuro, 0);
        const totalNodosAB = historialMetricas.reduce((acc, m) => acc + m.nodosAB, 0);
        const totalTiempoPuro = historialMetricas.reduce((acc, m) => acc + m.tiempoPuro, 0);
        const totalTiempoAB = historialMetricas.reduce((acc, m) => acc + m.tiempoAB, 0);

        const ahorroNodos = totalNodosPuro > 0
            ? (((totalNodosPuro - totalNodosAB) / totalNodosPuro) * 100).toFixed(1)
            : 0;

        const tituloResultado = ganoJugador
            ? 'VICTORIA IMPERIAL — REPORTE DE INTELIGENCIA TÁCTICA'
            : 'DERROTA EN TRINCHERA — REPORTE DE INTELIGENCIA TÁCTICA';

        contenedor.style.display = 'block';
        contenedor.innerHTML = `
            <h2 style="color: ${ganoJugador ? '#4dff4d' : '#ff4444'}; margin-top: 0; border-bottom: 1px solid #3b3530; padding-bottom: 8px;">
                ${tituloResultado}
            </h2>
            <p style="font-size: 0.85rem; color: #aaa;">
                Profundidad de búsqueda configurada: <b style="color:#fff;">d = ${profundidadUsada}</b> | 
                Total decisiones IA ejecutadas: <b style="color:#fff;">${historialMetricas.length}</b>
            </p>

            <div class="resumen-kpi">
                <div class="kpi-card">
                    <span>NODOS MINIMAX PURO</span>
                    <strong style="color: #ff6b6b;">${totalNodosPuro.toLocaleString()}</strong>
                    <small>Tiempo total: ${totalTiempoPuro.toFixed(2)} ms</small>
                </div>
                <div class="kpi-card">
                    <span>NODOS PODA ALFA-BETA</span>
                    <strong style="color: #4dff4d;">${totalNodosAB.toLocaleString()}</strong>
                    <small>Tiempo total: ${totalTiempoAB.toFixed(2)} ms</small>
                </div>
                <div class="kpi-card">
                    <span>EFICIENCIA DE PODA</span>
                    <strong style="color: #00ffcc;">-${ahorroNodos}%</strong>
                    <small>Nodos inútiles descartados</small>
                </div>
            </div>

            <div style="margin-top: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #dfdfdf;">[COMPARATIVA DE NODOS EVALUADOS POR JUGADA DE LA IA]</h4>
                <div style="display: flex; gap: 15px; font-size: 0.78rem; margin-bottom: 6px;">
                    <span><span style="display:inline-block;width:12px;height:12px;background:#ff5252;margin-right:5px;"></span>Minimax Puro</span>
                    <span><span style="display:inline-block;width:12px;height:12px;background:#00e676;margin-right:5px;"></span>Minimax + Poda Alfa-Beta</span>
                </div>
                <canvas id="canvas-estadisticas" width="720" height="260" style="width: 100%; background: #121212; border: 1px solid #3b3530;"></canvas>
            </div>
        `;

        this.dibujarBarras('canvas-estadisticas', historialMetricas);
    }

    static dibujarBarras(canvasId, datos) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || datos.length === 0) return;

        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const padIzq = 55;
        const padDer = 20;
        const padSup = 25;
        const padInf = 35;

        ctx.clearRect(0, 0, W, H);

        const maxNodos = Math.max(...datos.map(d => Math.max(d.nodosPuro, d.nodosAB)), 10);
        const areaW = W - padIzq - padDer;
        const areaH = H - padSup - padInf;

        // Líneas horizontales de guía y eje Y
        ctx.strokeStyle = '#2c2c2c';
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';

        const pasosY = 4;
        for (let i = 0; i <= pasosY; i++) {
            const valor = Math.round((maxNodos / pasosY) * i);
            const y = padSup + areaH - (areaH * (i / pasosY));
            ctx.beginPath();
            ctx.moveTo(padIzq, y);
            ctx.lineTo(W - padDer, y);
            ctx.stroke();
            ctx.fillText(valor, padIzq - 8, y + 4);
        }

        // Dibujar pares de barras por cada decisión de la IA
        const anchoGrupo = areaW / datos.length;
        const anchoBarra = Math.min(24, (anchoGrupo * 0.7) / 2);

        datos.forEach((d, idx) => {
            const centroX = padIzq + anchoGrupo * idx + anchoGrupo / 2;

            // Barra Minimax Puro
            const hPuro = (d.nodosPuro / maxNodos) * areaH;
            ctx.fillStyle = '#ff5252';
            ctx.fillRect(centroX - anchoBarra - 2, padSup + areaH - hPuro, anchoBarra, hPuro);

            // Barra Alfa-Beta
            const hAB = (d.nodosAB / maxNodos) * areaH;
            ctx.fillStyle = '#00e676';
            ctx.fillRect(centroX + 2, padSup + areaH - hAB, anchoBarra, hAB);

            // Etiqueta eje X (J1, J2, ...)
            ctx.fillStyle = '#ccc';
            ctx.textAlign = 'center';
            ctx.fillText(`J${idx + 1}`, centroX, H - 12);
        });
    }
}