export class Casilla {
    constructor(x, y, tipo) {
        this.x = x;
        this.y = y;
        this.tipo = tipo;   // 0: Libre, 1: Trinchera, 2: Obstáculo
        this.unidad = null; // Instancia del soldado
    }

    /**
     * Clonación profunda (Deep Copy) corregida para no evaporar las unidades
     */
    clonar() {
        const nuevaCasilla = new Casilla(this.x, this.y, this.tipo);
        
        // ¡Aquí estaba el detalle! Descomentamos esto para clonar la unidad junto con la casilla
        if (this.unidad) {
            nuevaCasilla.unidad = this.unidad.clonar();
        }
        
        return nuevaCasilla;
    }
}