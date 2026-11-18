export class Unidad {
    constructor(id, faccion, hp, pm, rango, dano, clase = 'FUSILERO') {
        this.id = id;
        this.faccion = faccion; // 'JUGADOR' o 'IA'
        this.clase = clase;     // 'FUSILERO' | 'TIRADOR' | 'GRANADERO'
        
        this.hpMax = hp;
        this.hpActual = hp;
        this.pmMax = pm;
        this.pmActual = pm;
        this.rango = rango;
        this.dano = dano;
    }

    static crearPorClase(id, faccion, clase) {
        const plantillas = {
            FUSILERO:  { hp: 10, pm: 3, rango: 4, dano: 4 },
            TIRADOR:   { hp: 7,  pm: 2, rango: 7, dano: 6 },
            GRANADERO: { hp: 12, pm: 4, rango: 2, dano: 7 }
        };
        const stats = plantillas[clase] || plantillas.FUSILERO;
        return new Unidad(id, faccion, stats.hp, stats.pm, stats.rango, stats.dano, clase);
    }

    estaViva() {
        return this.hpActual > 0;
    }

    recibirDano(cantidad, reduccionCobertura = 0) {
        // El Granadero ignora la mitad de la cobertura de trinchera (perforación de asalto)
        const coberturaEfectiva = this.clase === 'GRANADERO'
            ? Math.floor(reduccionCobertura / 2)
            : reduccionCobertura;
        const danoFinal = Math.max(0, cantidad - coberturaEfectiva);
        this.hpActual = Math.max(0, this.hpActual - danoFinal);
        return danoFinal;
    }

    restaurarPM() {
        this.pmActual = this.pmMax;
    }

    clonar() {
        const nuevaUnidad = new Unidad(
            this.id, 
            this.faccion, 
            this.hpMax, 
            this.pmMax, 
            this.rango, 
            this.dano,
            this.clase
        );
        nuevaUnidad.hpActual = this.hpActual;
        nuevaUnidad.pmActual = this.pmActual;
        return nuevaUnidad;
    }
}