export class GeometriaTactica {
    static obtenerCasillasAlcanzables(matriz, origenX, origenY, pmDisponibles) {
        const filas = matriz.length;
        const columnas = matriz[0].length;
        const alcanzables = [];
        
        if (pmDisponibles <= 0) return alcanzables;

        const visitados = Array.from({ length: filas }, () => Array(columnas).fill(false));
        const cola = [{ x: origenX, y: origenY, costo: 0 }];
        visitados[origenY][origenX] = true;

        const direcciones = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        while (cola.length > 0) {
            const actual = cola.shift();

            if (actual.costo > 0) {
                alcanzables.push({ x: actual.x, y: actual.y, costo: actual.costo });
            }

            if (actual.costo === pmDisponibles) continue;

            for (const dir of direcciones) {
                const nx = actual.x + dir.dx;
                const ny = actual.y + dir.dy;

                if (nx >= 0 && nx < columnas && ny >= 0 && ny < filas && !visitados[ny][nx]) {
                    const celdaDestino = matriz[ny][nx];
                    if (celdaDestino.tipo !== 2 && celdaDestino.unidad === null) {
                        visitados[ny][nx] = true;
                        cola.push({ x: nx, y: ny, costo: actual.costo + 1 });
                    }
                }
            }
        }

        return alcanzables;
    }

    static calcularDistancia(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    /**
     * Devuelve el trazado completo de Bresenham y si la trayectoria está despejada
     */
    static obtenerLineaBresenham(matriz, x0, y0, x1, y1) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        let xActual = x0;
        let yActual = y0;
        const celdas = [];
        let despejada = true;

        while (true) {
            if (!(xActual === x0 && yActual === y0)) {
                const bloqueada = matriz[yActual][xActual].tipo === 2;
                celdas.push({ x: xActual, y: yActual, bloqueada });
                if (bloqueada) {
                    despejada = false;
                    break;
                }
            }

            if (xActual === x1 && yActual === y1) break;

            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                xActual += sx;
            }
            if (e2 < dx) {
                err += dx;
                yActual += sy;
            }
        }

        return { celdas, despejada };
    }

    static tieneLineaDeVision(matriz, x0, y0, x1, y1) {
        return this.obtenerLineaBresenham(matriz, x0, y0, x1, y1).despejada;
    }
}