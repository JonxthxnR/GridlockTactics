export class Unidad {
    constructor(id, faccion, hp, ap, rango, dano) {
        this.id = id;             // Identificador único (ej. 'soldado-1')
        this.faccion = faccion;   // 'JUGADOR' o 'IA'
        
        // Atributos biológicos y de combate
        this.hpMax = hp;
        this.hpActual = hp;
        this.apMax = ap;
        this.apActual = ap;
        this.rango = rango;       // Alcance del arma
        this.dano = dano;         // Daño plano que inflige
    }

    estaViva() {
        return this.hpActual > 0;
    }

    recibirDano(cantidad, reduccionCobertura = 0) {
        // El daño final no puede ser negativo
        const danoFinal = Math.max(0, cantidad - reduccionCobertura);
        this.hpActual = Math.max(0, this.hpActual - danoFinal);
    }

    restaurarAP() {
        this.apActual = this.apMax;
    }

    /**
     * Clonación profunda para el árbol Minimax.
     */
    clonar() {
        const nuevaUnidad = new Unidad(
            this.id, 
            this.faccion, 
            this.hpMax, 
            this.apMax, 
            this.rango, 
            this.dano
        );
        // Respetamos el estado actual de la unidad en la simulación
        nuevaUnidad.hpActual = this.hpActual;
        nuevaUnidad.apActual = this.apActual;
        
        return nuevaUnidad;
    }
}