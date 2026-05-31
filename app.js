/* ==========================================
   CONFIGURACIÓN Y DICCIONARIO
   ========================================== */
const DICCIONARIO = {
    "0": "Delfín", "00": "Ballena", "1": "Carnero", "2": "Toro", "3": "Ciempiés", "4": "Alacrán",
    "5": "León", "6": "Rana", "7": "Perico", "8": "Ratón", "9": "Águila", "10": "Tigre",
    "11": "Gato", "12": "Caballo", "13": "Mono", "14": "Paloma", "15": "Zorro", "16": "Oso",
    "17": "Pavo", "18": "Burro", "19": "Chivo", "20": "Cochino", "21": "Gallo", "22": "Camello",
    "23": "Cebra", "24": "Iguana", "25": "Gallina", "26": "Vaca", "27": "Perro", "28": "Zamuro",
    "29": "Elefante", "30": "Caimán", "31": "Lapa", "32": "Ardilla", "33": "Pescado", "34": "Venado",
    "35": "Jirafa", "36": "Culebra",
    // Los siguientes solo se usarán si la lotería activa es el Guácharo
    "37": "Tortuga", "38": "Búfalo", "39": "Lechuza", "40": "Avispa", "41": "Canguro", "42": "Tucán",
    "43": "Mariposa", "44": "Chigüire", "45": "Garza", "46": "Puma", "47": "Pavo Real", "48": "Puercoespín",
    "49": "Pereza", "50": "Canario", "51": "Pelícano", "52": "Pulpo", "53": "Caracol", "54": "Grillo",
    "55": "Oso hormiguero", "56": "Tiburón", "57": "Pato", "58": "Hormiga", "59": "Pantera", "60": "Camaleón",
    "61": "Danta", "62": "Cachicamo", "63": "Cangrejo", "64": "Gavilán", "65": "Araña", "66": "Lobo",
    "67": "Avestruz", "68": "Jaguar", "69": "Conejo", "70": "Bisonte", "71": "Guacamaya", "72": "Gorila",
    "73": "Hipopótamo", "74": "Turpial", "75": "Guácharo"
};

const HORAS = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"];

let BaseDatos = {};

/**
 * NUEVA MATRIZ DE APRENDIZAJE HORARIO (Feedback Loop)
 * Guarda la fuerza de cada estrategia por cada una de las 12 horas.
 * Valores base por defecto: Continuidad (Pool), Anclaje Histórico y Compensación (Ciclos/Vacíos).
 */
let MatrizEficienciaHoraria = {};

function inicializarMatrizEficiencia() {
    MatrizEficienciaHoraria = {};
    HORAS.forEach(hora => {
        MatrizEficienciaHoraria[hora] = {
            estrategiaA_pool: 100,      // Fuerza inicial Pool Caliente (Continuidad)
            estrategiaB_anclaje: 100,   // Fuerza inicial Anclaje Histórico
            estrategiaC_vacios: 100,    // Fuerza inicial Ciclos de Atraso
            totalAlertas: 0,
            aciertosReales: 0
        };
    });
}

const selectLoteria = document.getElementById('select-loteria');
const fechaCarga = document.getElementById('fecha-carga');

// ==========================================
// CONTROLADOR DE LÍMITES POR LOTERÍA
// ==========================================
function obtenerLimiteLoteria() {
    const loteriaActiva = selectLoteria ? selectLoteria.value.toLowerCase() : 'lotto-activo';
    if (loteriaActiva.includes('guacharo') || loteriaActiva.includes('chaima')) {
        return 75;
    }
    return 36;
}

// ==========================================
// TOAST SYSTEM
// ==========================================
function mostrarToast(mensaje, duracion = 3000) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = mensaje;
        toast.classList.add('mostrar');
        setTimeout(() => toast.classList.remove('mostrar'), duracion);
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    cargarBaseDatos();
    construirGridInputs();
    actualizarEstadoDB();

    // Setup de eventos para el sistema de modales y pestañas recién agregado
    inicializarEventosInterfaz();

    if (fechaCarga && fechaCarga.value) {
        const panelDatos = document.getElementById('panel-datos-dia');
        if (panelDatos) panelDatos.style.display = 'block';
        cargarDiaEspecifico(fechaCarga.value);
    }
});

// ==========================================
// EVENTOS DE CONFIGURACIÓN
// ==========================================
if (selectLoteria) {
    selectLoteria.addEventListener('change', () => {
        cargarBaseDatos();
        actualizarEstadoDB();
        HORAS.forEach((_, i) => {
            const inputElement = document.getElementById(`hora-inp-${i}`);
            if (inputElement) inputElement.value = "";
        });
        if (fechaCarga && fechaCarga.value) cargarDiaEspecifico(fechaCarga.value);
    });
}

if (fechaCarga) {
    fechaCarga.addEventListener('change', (e) => {
        if (e.target.value) {
            cargarDiaEspecifico(e.target.value);
            const panelDatos = document.getElementById('panel-datos-dia');
            if (panelDatos) panelDatos.style.display = 'block';
        }
    });
}

// ==========================================
// FUNCIONES DE BASE DE DATOS
// ==========================================
function cargarBaseDatos() {
    const loteriaActiva = selectLoteria ? selectLoteria.value : 'general';
    const datosGuardados = localStorage.getItem(`db_animalitos_${loteriaActiva}`);
    BaseDatos = datosGuardados ? JSON.parse(datosGuardados) : {};

    // Cargar la matriz auto-optimizada específica de esta lotería
    const matrizGuardada = localStorage.getItem(`matriz_eficiencia_${loteriaActiva}`);
    if (matrizGuardada) {
        MatrizEficienciaHoraria = JSON.parse(matrizGuardada);
    } else {
        inicializarMatrizEficiencia();
    }
}

function actualizarEstadoDB() {
    const totalDias = Object.keys(BaseDatos).length;
    const dbStatus = document.getElementById('db-status');
    if (dbStatus) dbStatus.innerText = `Historial Guardado: ${totalDias} días registrados`;

    const infoDias = document.getElementById('dias-disponibles-info');
    if (infoDias) {
        if (totalDias < 2) {
            infoDias.style.display = 'block';
            infoDias.textContent = `Necesitas al menos 2 días para generar predicciones. Actualmente tienes ${totalDias}.`;
        } else {
            infoDias.style.display = 'none';
        }
    }
}

function construirGridInputs() {
    const container = document.getElementById('grid-horas-inputs');
    if (!container) return;
    container.innerHTML = '';
    HORAS.forEach((h, i) => {
        container.innerHTML += `
            <div class="hora-bloque">
                <label for="hora-inp-${i}" class="hora-label">${h}</label>
                <input type="text" class="hora-input js-num-input" id="hora-inp-${i}" placeholder="--" aria-label="Número para las ${h}">
            </div>
        `;
    });
}

function cargarDiaEspecifico(fecha) {
    const tituloFecha = document.getElementById('titulo-fecha-activa');
    if (tituloFecha) tituloFecha.innerText = `Resultados del: ${fecha.split('-').reverse().join('/')}`;
   
    const resultadoDia = BaseDatos[fecha] || Array(12).fill("");
    HORAS.forEach((_, i) => {
        const inputElement = document.getElementById(`hora-inp-${i}`);
        if (inputElement) inputElement.value = resultadoDia[i] || "";
    });
}

// ==========================================
// GUARDADO DE DATOS Y MOTOR DEL FEEDBACK LOOP
// ==========================================
const btnGuardarDia = document.getElementById('btnGuardarDia');
if (btnGuardarDia) {
    btnGuardarDia.addEventListener('click', () => {
        const fecha = fechaCarga ? fechaCarga.value : null;
        if (!fecha) return;

        let filaResultados = [];
        HORAS.forEach((_, i) => {
            const inputElement = document.getElementById(`hora-inp-${i}`);
            let val = inputElement ? inputElement.value.trim() : "";
            filaResultados.push(normalizarNumero(val) || "");
        });

        // Disparar la auditoría matemática inteligente antes de consolidar en la persistencia local
        auditarYOptimizarEstrategias(fecha, filaResultados);

        const loteriaActiva = selectLoteria ? selectLoteria.value : 'general';
        BaseDatos[fecha] = filaResultados;
        localStorage.setItem(`db_animalitos_${loteriaActiva}`, JSON.stringify(BaseDatos));

        actualizarEstadoDB();
        mostrarToast(`🎉 Resultados guardados y estrategias re-calibradas con éxito.`);
    });
}

/**
 * SISTEMA FEEDBACK LOOP: Auditoría retroactiva profunda por cada hora
 */
function auditarYOptimizarEstrategias(fecha, resultadosReales) {
    const loteriaActiva = selectLoteria ? selectLoteria.value : 'general';
    const logsEjecucionGuardados = localStorage.getItem(`log_motor_${loteriaActiva}_${fecha}`);
    
    if (!logsEjecucionGuardados) return; // Si no hay predicciones calculadas para este día, no hay nada que auditar.

    try {
        const logsDia = JSON.parse(logsEjecucionGuardados);

        HORAS.forEach((hora, i) => {
            const resultadoReal = resultadosReales[i];
            if (!resultadoReal) return; // Si esta hora no se ingresó, saltar

            const logHora = logsDia[hora];
            if (!logHora) return;

            MatrizEficienciaHoraria[hora].totalAlertas += 1;

            // Verificar si el conjunto unificado de predicciones de esta hora acertó
            if (logHora.prediccionesGeneradas.includes(resultadoReal)) {
                MatrizEficienciaHoraria[hora].aciertosReales += 1;
            }

            // --- ESCANEO DE ESTRATEGIA GANADORA EN LA HORA ---
            // Revisamos qué bloques lógicos individuales contenían el número ganador para subirles o bajarles el peso
            
            // Estrategia A: Pool Caliente de 48 horas
            if (logHora.componentes.poolCaliente.includes(resultadoReal)) {
                MatrizEficienciaHoraria[hora].estrategiaA_pool += 15; // Recompensa por acierto inmediato
            } else {
                MatrizEficienciaHoraria[hora].estrategiaA_pool = Math.max(10, MatrizEficienciaHoraria[hora].estrategiaA_pool - 3);
            }

            // Estrategia B: Anclajes y cruces históricos
            if (logHora.componentes.poolAnclaje.includes(resultadoReal)) {
                MatrizEficienciaHoraria[hora].estrategiaB_anclaje += 25; // Los cruces son más difíciles, merecen más premio
            } else {
                MatrizEficienciaHoraria[hora].estrategiaB_anclaje = Math.max(10, MatrizEficienciaHoraria[hora].estrategiaB_anclaje - 4);
            }

            // Estrategia C: Ciclos de atraso / Espacios fríos
            if (logHora.componentes.ciclosRetraso.includes(resultadoReal)) {
                MatrizEficienciaHoraria[hora].estrategiaC_vacios += 20;
            } else {
                MatrizEficienciaHoraria[hora].estrategiaC_vacios = Math.max(10, MatrizEficienciaHoraria[hora].estrategiaC_vacios - 3);
            }
        });

        // Guardar los pesos adaptados en LocalStorage
        localStorage.setItem(`matriz_eficiencia_${loteriaActiva}`, JSON.stringify(MatrizEficienciaHoraria));

    } catch (e) {
        console.warn("Fallo crítico en el circuito del Feedback Loop:", e);
    }
}

// ==========================================
// VALIDACIÓN DE ENTRADA CON LÍMITES DINÁMICOS
// ==========================================
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('js-num-input')) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }
});

document.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('js-num-input')) {
        let val = e.target.value.trim();
        if (val === '') return;
       
        if (val === "0" || val === "00") return;
       
        let num = parseInt(val, 10);
        let limiteMaximo = obtenerLimiteLoteria();

        if (!isNaN(num) && num >= 1 && num <= limiteMaximo) {
            e.target.value = num < 10 ? '0' + num : num.toString();
        } else {
            e.target.value = '';
            mostrarToast(`⚠️ El límite para este juego es el número ${limiteMaximo}`);
        }
    }
});

function normalizarNumero(val) {
    if (val === "00" || val === "0") return val;
    let num = parseInt(val, 10);
    let limiteMaximo = obtenerLimiteLoteria();
    return (!isNaN(num) && num >= 1 && num <= limiteMaximo) ? num.toString() : null;
}

// ==========================================
// ANÁLISIS HISTÓRICO
// ==========================================
function calcularCiclosRetrasados(fechasOrdenadas, universo, fechaActual) {
    let ultimaAparicion = {};
    universo.forEach(n => ultimaAparicion[n] = Infinity);

    fechasOrdenadas.forEach(f => {
        (BaseDatos[f] || []).forEach(n => {
            if (n !== '') {
                ultimaAparicion[n] = Math.min(ultimaAparicion[n] || Infinity, new Date(f).getTime());
            }
        });
    });

    const hoy = new Date(fechaActual).getTime();
    let retrasos = {};

    universo.forEach(n => {
        if (ultimaAparicion[n] === Infinity) {
            retrasos[n] = 30; // Ventana penalizada estándar por defecto
        } else {
            let diasSinSalir = Math.floor((hoy - ultimaAparicion[n]) / (1000 * 60 * 60 * 24));
            retrasos[n] = diasSinSalir;
        }
    });

    let maxRetraso = Math.max(...Object.values(retrasos), 1);
    return { retrasos, maxRetraso };
}

function analizarSumaHistorica(fechasOrdenadas) {
    let limiteMaximo = obtenerLimiteLoteria();
    let promedioBase = limiteMaximo === 36 ? 220 : 450;
    let rangoBase = limiteMaximo === 36 ? 50 : 100;

    if (fechasOrdenadas.length < 3) return { promedio: promedioBase, rango: rangoBase };

    let sumas = fechasOrdenadas.map(f => {
        return (BaseDatos[f] || []).reduce((acc, n) => {
            let val = parseInt(n);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
    }).filter(s => s > 0);

    if (sumas.length === 0) return { promedio: promedioBase, rango: rangoBase };

    let promedio = sumas.reduce((a, b) => a + b, 0) / sumas.length;
    let rango = Math.max(...sumas) - Math.min(...sumas);
    return { promedio, rango: Math.max(rango, rangoBase) };
}

function obtenerTecnicaDominante(num, contribuciones) {
    if (!contribuciones[num]) return 'Combinado';
    const c = contribuciones[num];
    let maxTecnica = Object.keys(c).reduce((a, b) => c[a] > c[b] ? a : b);
    const mapa = {
        anclaje: '⚓ Anclaje Horario',
        secuencial: '🔗 Cadena de Transición',
        pool: '🔥 Pool Caliente 48h',
        ciclos: '🔄 Ciclo de Atraso',
        suma: '⚖️ Equilibrio de Suma',
        enjaulado: '🔒 Enjaulado del Mes'
    };
    return mapa[maxTecnica] || 'Combinado';
}

// ==========================================
// INTERFAZ: MANEJO DEL MODAL DE AUDITORÍA
// ==========================================
function inicializarEventosInterfaz() {
    const btnStats = document.getElementById('btn-abrir-stats');
    const modal = document.getElementById('modal-auditoria');
    const btnCerrar = document.getElementById('btn-cerrar-modal');

    if (btnStats && modal) {
        btnStats.addEventListener('click', () => {
            renderizarDatosPanelAuditoria();
            modal.style.display = 'flex';
        });
    }

    if (btnCerrar && modal) {
        btnCerrar.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Lógica para cambiar de pestañas (Tabs) dentro de la auditoría
    const tabBotones = document.querySelectorAll('.tab-btn');
    tabBotones.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBotones.forEach(b => b.classList.remove('activo'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('activo'));

            btn.classList.add('activo');
            const tabId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(`tab-${tabId}`);
            if (targetContent) targetContent.classList.add('activo');
        });
    });
}

/**
 * Agrupa la información de la matriz autoadaptativa y la pinta en el Modal
 */
function renderizarDatosPanelAuditoria() {
    const podioContainer = document.getElementById('podio-dinamico');
    const listaHoras = document.getElementById('lista-eficiencia-horas');
    if (!listaHoras) return;

    // 1. Calcular eficiencia horaria para la lista
    let htmlHoras = '';
    let ordenHoras = [...HORAS];

    // Ordenar horas de mayor a menor precisión calculada por el loop
    ordenHoras.sort((a,b) => {
        let efA = MatrizEficienciaHoraria[a].totalAlertas > 0 ? (MatrizEficienciaHoraria[a].aciertosReales / MatrizEficienciaHoraria[a].totalAlertas) : 0;
        let efB = MatrizEficienciaHoraria[b].totalAlertas > 0 ? (MatrizEficienciaHoraria[b].aciertosReales / MatrizEficienciaHoraria[b].totalAlertas) : 0;
        return efB - efA;
    });

    ordenHoras.forEach(h => {
        let m = MatrizEficienciaHoraria[h];
        let porcentaje = m.totalAlertas > 0 ? Math.round((m.aciertosReales / m.totalAlertas) * 100) : 100;
        let claseBadge = porcentaje > 60 ? 'badge-top' : (porcentaje < 35 ? 'badge-low' : '');

        htmlHoras += `
            <div class="item-lista">
                <span>⏰ ${h} <small style="color:#777; font-weight:normal;">(${m.totalAlertas} eval.)</small></span>
                <span class="${claseBadge}">${porcentaje}% acierto</span>
            </div>
        `;
    });
    listaHoras.innerHTML = htmlHoras;

    // 2. Renderizar el Podio de Estrategias Dominantes
    if (podioContainer) {
        // Acumular valores globales para ver cuál va ganando en toda la jornada
        let totales = { pool: 0, anclaje: 0, vacios: 0 };
        HORAS.forEach(h => {
            totales.pool += MatrizEficienciaHoraria[h].estrategiaA_pool;
            totales.anclaje += MatrizEficienciaHoraria[h].estrategiaB_anclaje;
            totales.vacios += MatrizEficienciaHoraria[h].estrategiaC_vacios;
        });

        let arrEstrategias = [
            { id: 'pool', nombre: '🔥 Ráfaga 48h', puntos: totales.pool, h: 70 },
            { id: 'anclaje', nombre: '⚓ Histórico', puntos: totales.anclaje, h: 110 },
            { id: 'vacios', nombre: '🔄 C. Atraso', puntos: totales.vacios, h: 50 }
        ];
        
        // Ordenar para el podio (Puesto 1 en el centro, 2 izquierda, 3 derecha)
        arrEstrategias.sort((a,b) => b.puntos - a.puntos);

        podioContainer.innerHTML = `
            <div class="podio-item">
                <span class="podio-nombre">${arrEstrategias[1].nombre}</span>
                <div class="podio-numero">2°</div>
                <div class="podio-barra" style="height: 65px;">${arrEstrategias[1].puntos}</div>
            </div>
            <div class="podio-item">
                <span class="podio-nombre" style="font-weight:bold; color: #b38728;">${arrEstrategias[0].nombre}</span>
                <div class="podio-numero" style="font-size:24px;">👑</div>
                <div class="podio-barra" style="height: 95px; background: linear-gradient(to top, #bf953f, #fcf6ba);">${arrEstrategias[0].puntos}</div>
            </div>
            <div class="podio-item">
                <span class="podio-nombre">${arrEstrategias[2].nombre}</span>
                <div class="podio-numero">3°</div>
                <div class="podio-barra" style="height: 45px;">${arrEstrategias[2].puntos}</div>
            </div>
        `;
    }
}

// ==========================================
// MOTOR MATEMÁTICO ADAPTATIVO (btnGenerar)
// ==========================================
const btnGenerar = document.getElementById('btnGenerar');
if (btnGenerar) {
    btnGenerar.addEventListener('click', () => {
        try {
            const fechaActual = fechaCarga ? fechaCarga.value : '';
            const fechasOrdenadas = Object.keys(BaseDatos).sort((a, b) => new Date(a) - new Date(b));

            if (fechasOrdenadas.length < 2) {
                mostrarToast("⚠️ Se necesitan al menos 2 días de historial guardado.");
                return;
            }

            // CREACIÓN DEL UNIVERSO DINÁMICO SEGÚN EL JUEGO SELECCIONADO
            let universo = ["0", "00"];
            let limiteMaximo = obtenerLimiteLoteria();
            
            // FILTRO DE HISTORIAL CAMALEÓNICO: Si es Guácharo, expandimos la ventana de inspección
            const loteriaActiva = selectLoteria ? selectLoteria.value : 'general';
            const esJuegoExpandido = loteriaActiva.toLowerCase().includes('guacharo') || loteriaActiva.toLowerCase().includes('chaima');
            
            for (let i = 1; i <= limiteMaximo; i++) universo.push(i.toString());

            // 1. EXTRAER VALORES ACTUALES EN PANTALLA
            let numsHoyEnPantalla = [];
            HORAS.forEach((_, i) => {
                const inputElement = document.getElementById(`hora-inp-${i}`);
                let val = inputElement ? inputElement.value.trim() : "";
                let norm = normalizarNumero(val);
                if (norm) {
                    numsHoyEnPantalla.push({ hora: i, num: norm });
                }
            });

            // 2. OBTENER POOL CALIENTE (Ventana adaptativa según el azar del tablero)
            const fechaActualDate = new Date(fechaActual);
            let diasFiltrados = fechasOrdenadas.filter(f => new Date(f) < fechaActualDate);
            if (diasFiltrados.length === 0) {
                diasFiltrados = [...fechasOrdenadas];
            }

            // Si es un juego complejo como el Guácharo, duplicamos el historial analizado (30 días vs 15 días)
            const ventanaDias = esJuegoExpandido ? 30 : 15;
            let diasAInspecionar = diasFiltrados.slice(-ventanaDias);

            let ultimosNums = [];
            diasAInspecionar.forEach(f => {
                (BaseDatos[f] || []).forEach(n => {
                    if (n !== '') ultimosNums.push(n);
                });
            });

            let freq48 = {};
            ultimosNums.forEach(n => freq48[n] = (freq48[n] || 0) + 1);
            let poolCaliente = [...new Set(ultimosNums)].filter(n => universo.includes(n)).sort((a, b) => freq48[b] - freq48[a]);

            // 3. ALGORITMO DE ANCLAJE EN VIVO
            let numerosAncladosMatch = [];
            if (numsHoyEnPantalla.length > 0) {
                let soloNumerosHoy = numsHoyEnPantalla.map(x => x.num);

                fechasOrdenadas.forEach(f => {
                    if (f !== fechaActual) {
                        let resultadosEseDia = BaseDatos[f] || [];
                        let compartePatron = soloNumerosHoy.some(n => resultadosEseDia.includes(n));

                        if (compartePatron) {
                            resultadosEseDia.forEach(n => {
                                if (n !== '' && !soloNumerosHoy.includes(n) && universo.includes(n)) {
                                    numerosAncladosMatch.push(n);
                                }
                            });
                        }
                    }
                });
            }

            let poolAnclajeFinal = numerosAncladosMatch.filter(n => poolCaliente.includes(n));
            let freqAnclaje = {};
            poolAnclajeFinal.forEach(n => freqAnclaje[n] = (freqAnclaje[n] || 0) + 1);
            poolAnclajeFinal = [...new Set(poolAnclajeFinal)].sort((a, b) => freqAnclaje[b] - freqAnclaje[a]);

            // 4. ENJAULADOS GENERALES DEL MES
            let todosLosVistos = [];
            fechasOrdenadas.forEach(f => {
                if (f !== fechaActual) {
                    (BaseDatos[f] || []).forEach(n => {
                        if (n !== '' && universo.includes(n)) todosLosVistos.push(n);
                    });
                }
            });

            numsHoyEnPantalla.forEach(item => {
                if (universo.includes(item.num)) todosLosVistos.push(item.num);
            });

            let setVistos = new Set(todosLosVistos);
            let enjaulados = universo.filter(n => !setVistos.has(n));

            // 5. CADENA DE TRANSICIONES (Secuenciales)
            let transiciones = {};
            for (let i = 0; i < todosLosVistos.length - 1; i++) {
                let act = todosLosVistos[i];
                let sig = todosLosVistos[i + 1];
                if (!transiciones[act]) transiciones[act] = [];
                transiciones[act].push(sig);
            }

            // 6. ANÁLISIS ADICIONALES (CICLOS Y SUMA)
            const { retrasos, maxRetraso } = calcularCiclosRetrasados(fechasOrdenadas, universo, fechaActual);
            const { promedio: sumaPromedio, rango } = analizarSumaHistorica(fechasOrdenadas);

            let sumaParcialHoy = numsHoyEnPantalla.reduce((acc, item) => {
                let val = parseInt(item.num);
                return acc + (isNaN(val) ? 0 : val);
            }, 0);

            let numerosRestantes = 12 - numsHoyEnPantalla.length;
            let promedioPorHora = numerosRestantes > 0 ? (sumaPromedio - sumaParcialHoy) / numerosRestantes : 0;
            let rangoPorHora = rango / 12;

            // --- CONTENEDOR TEMPORAL PARA AUDITORÍA DE HORAS EN TIEMPO REAL ---
            let logsEstrategiasHoy = {};

            // 7. ASIGNACIÓN DINÁMICA DE PESOS BASADA EN EL HORARIO ACTIVO (Feedback Loop)
            let pesos = {};
            let tecnicasContribucion = {};

            function addPeso(num, cantidad, tecnica) {
                pesos[num] = (pesos[num] || 0) + cantidad;
                if (!tecnicasContribucion[num]) {
                    tecnicasContribucion[num] = { anclaje: 0, secuencial: 0, pool: 0, ciclos: 0, suma: 0, enjaulado: 0 };
                }
                tecnicasContribucion[num][tecnica] += cantidad;
            }

            // Calculamos las recomendaciones individualizadas por cada hora del tablero
            HORAS.forEach((horaActiva) => {
                // Extraer la configuración de pesos auto-optimizada para ESTA hora específica
                const configuracionHoraria = MatrizEficienciaHoraria[horaActiva];

                // Guardar una captura limpia de qué números sugiere cada bloque para auditar en el futuro
                logsEstrategiasHoy[horaActiva] = {
                    componentes: {
                        poolCaliente: poolCaliente.slice(0, 5),
                        poolAnclaje: poolAnclajeFinal.slice(0, 5),
                        ciclosRetraso: universo.filter(n => (retrasos[n] / maxRetraso) > 0.7)
                    },
                    prediccionesGeneradas: []
                };

                // Inyectar pesos modulados por la efectividad horaria real del Feedback loop
                // 7a. Anclaje
                poolAnclajeFinal.forEach((n, i) => {
                    let aporte = configuracionHoraria.estrategiaB_anclaje - (i * 5);
                    if (aporte > 0) addPeso(n, aporte, 'anclaje');
                });

                // 7b. Secuencial
                let ultimoNumeroGlobal = todosLosVistos[todosLosVistos.length - 1];
                if (ultimoNumeroGlobal && transiciones[ultimoNumeroGlobal]) {
                    transiciones[ultimoNumeroGlobal].forEach(n => {
                        if (universo.includes(n)) addPeso(n, 40, 'secuencial');
                    });
                }

                // 7c. Pool caliente (Continuidad de ráfagas cortas)
                poolCaliente.forEach((n, i) => {
                    let aporte = Math.max(configuracionHoraria.estrategiaA_pool - (i * 2), 2);
                    addPeso(n, aporte, 'pool');
                });

                // 7d. Enjaulados
                enjaulados.forEach(n => {
                    addPeso(n, 15, 'enjaulado');
                });

                // 7e. Ciclos de retraso (Compensación de vacíos)
                universo.forEach(n => {
                    let factorRetraso = (retrasos[n] / maxRetraso) * (configuracionHoraria.estrategiaC_vacios * 0.15);
                    addPeso(n, factorRetraso, 'ciclos');
                });

                // 7f. Equilibrio de suma
                if (numerosRestantes > 0) {
                    universo.forEach(n => {
                        let numVal = parseInt(n);
                        if (isNaN(numVal)) return;
                        let diferencia = Math.abs(numVal - promedioPorHora);
                        let bonusSuma = Math.max(0, 10 - (diferencia / rangoPorHora) * 10);
                        addPeso(n, bonusSuma, 'suma');
                    });
                }
            });

            // 8. FILTRADO Y RESOLUCIÓN DE UMBRALES
            let pesosArray = Object.values(pesos);
            let pesoMaximo = Math.max(...pesosArray, 1);
            let umbralConfianza = pesoMaximo * 0.7;

            const sugerencias = Object.keys(pesos).sort((a, b) => pesos[b] - pesos[a]);

            let prediccionesFuertes = Object.keys(pesos)
                .filter(n => pesos[n] >= umbralConfianza)
                .sort((a, b) => pesos[b] - pesos[a]);

            if (prediccionesFuertes.length === 0) {
                prediccionesFuertes = sugerencias.slice(0, 3);
            } else {
                prediccionesFuertes = prediccionesFuertes.slice(0, 4);
            }

            // Archivar el bloque de predicciones globales del día para la verificación tradicional
            localStorage.setItem(`predicciones_${loteriaActiva}_${fechaActual}`, JSON.stringify(prediccionesFuertes));

            // Cruzar predicciones con cada hora para rellenar la matriz de logs
            HORAS.forEach(h => {
                logsEstrategiasHoy[h].prediccionesGeneradas = prediccionesFuertes;
            });
            localStorage.setItem(`log_motor_${loteriaActiva}_${fechaActual}`, JSON.stringify(logsEstrategiasHoy));

            // 9. RENDERIZADO FINAL EN LA INTERFAZ DE USUARIO
            const fName = (n) => `[${n.padStart(2, '0')}] ${DICCIONARIO[n] || 'Animal'}`;

            // Calcular efectividad global sumando los análisis de todas las horas
            let totalAlertasGlobales = 0;
            let totalAciertosGlobales = 0;
            HORAS.forEach(h => {
                totalAlertasGlobales += MatrizEficienciaHoraria[h].totalAlertas;
                totalAciertosGlobales += MatrizEficienciaHoraria[h].aciertosReales;
            });

            let porcEficiencia = totalAlertasGlobales > 0
                ? Math.round((totalAciertosGlobales / totalAlertasGlobales) * 100)
                : 100;
               
            const txtEficiencia = document.getElementById('txt-eficiencia');
            if (txtEficiencia) txtEficiencia.innerText = `${porcEficiencia}%`;
           
            const txtAprendizajeLog = document.getElementById('txt-aprendizaje-log');
            if (txtAprendizajeLog) {
                txtAprendizajeLog.innerText = `Optimización Activa: Modo ${esJuegoExpandido ? 'Muestreo Extendido (30D)' : 'Ráfaga Dinámica (15D)'}.`;
            }

            // Construir Tarjetas Visuales de Predicción
            const tarjetaContainer = document.getElementById('tarjetas-prediccion-container');
            if (tarjetaContainer) {
                let tarjetasHTML = '';

                prediccionesFuertes.forEach((num, idx) => {
                    let nombreAnimal = fName(num);
                    let pesoRel = (pesos[num] / pesoMaximo) * 95;
                    let porcentajeEstimated = Math.min(95, Math.round(pesoRel)).toFixed(0);
                    let tecnica = obtenerTecnicaDominante(num, tecnicasContribucion);

                    let descripcion = idx === 0 ? 'Predicción Principal' : (idx === 1 ? 'Alta Probabilidad Secundaria' : 'Opción Complementaria');

                    tarjetasHTML += `
                        <div class="tarjeta-prediccion">
                            <div class="pred-info">
                                <h4>${nombreAnimal}</h4>
                                <p>${descripcion}</p>
                                <span class="badge-tecnica" style="font-size:12px; color: var(--texto-principal); background: var(--bg-app); padding:3px 10px; border-radius:12px; font-weight:bold; border:1px solid var(--borde-color); display:inline-block; margin-top:5px;">${tecnica}</span>
                            </div>
                            <div class="pred-porcentaje pred-verde">${porcentajeEstimated}%</div>
                        </div>
                    `;
                });

                if (prediccionesFuertes.length === 0) {
                    tarjetasHTML = '<p class="text-center">Historial analizado. Cargue más datos para ajustar el umbral.</p>';
                }
                tarjetaContainer.innerHTML = tarjetasHTML;
            }

            // Actualizar fila del Pool Caliente
            const poolBadges = document.getElementById('pool-badges');
            if (poolBadges) {
                poolBadges.innerHTML = poolCaliente.slice(0, 6).map(n => `<div class="badge-animalito">${fName(n)}</div>`).join('');
            }

            // Actualizar Conexión e Intersección Histórica
            const txtAnclaje = document.getElementById('txt-anclaje-info');
            const badgesAnclaje = document.getElementById('anclaje-badges');
            if (txtAnclaje && badgesAnclaje) {
                if (numsHoyEnPantalla.length > 0) {
                    txtAnclaje.innerText = `${numsHoyEnPantalla.length} sorteo(s) detectados hoy para cruce directo.`;
                    badgesAnclaje.innerHTML = poolAnclajeFinal.slice(0, 6).map(n => `<div class="badge-animalito">${fName(n)}</div>`).join('') || '<div class="badge-animalito">Buscando correlaciones...</div>';
                } else {
                    txtAnclaje.innerText = "Introduce al menos un resultado de hoy para activar.";
                    badgesAnclaje.innerHTML = '<div class="badge-animalito">Esperando sorteo inicial</div>';
                }
            }

            // Mapa de calor autoadaptativo al límite exacto de casillas
            const tableroGrid = document.getElementById('tablero-grid');
            if (tableroGrid) {
                let tableroHTML = '';
                universo.forEach(n => {
                    let extraClass = setVistos.has(n) ? 'activa' : 'fria';
                    tableroHTML += `<div class="celda-tablero ${extraClass}">${n === '00' ? '00' : n.padStart(2,'0')}</div>`;
                });
                tableroGrid.innerHTML = tableroHTML;
            }

            // Cronograma Predictivo Horario Inteligente
            const cronoContainer = document.getElementById('cronograma-horas-container');
            if (cronoContainer) {
                let cronoHTML = '';
                HORAS.forEach((h, i) => {
                    const inputElement = document.getElementById(`hora-inp-${i}`);
                    let inputVal = inputElement ? inputElement.value.trim() : '';
                    let normInput = normalizarNumero(inputVal);
                   
                    if (normInput) {
                        cronoHTML += `
                            <div class="cronograma-item" style="border-left: 4px solid var(--azul-guardar); background-color: rgba(37, 99, 235, 0.05)">
                                <span class="crono-hora">${h}</span>
                                <strong>✅ ${fName(normInput)}</strong>
                            </div>`;
                    } else {
                        let fav = sugerencias[i % sugerencias.length];
                        cronoHTML += `
                            <div class="cronograma-item">
                                <span class="crono-hora">${h}</span>
                                <strong style="color: #2e7d32;">🔮 ${fName(fav)}</strong>
                            </div>`;
                    }
                });
                cronoContainer.innerHTML = cronoHTML;
            }

            // Mostrar el contenedor general de resultados deslizando suavemente
            const panelResultados = document.getElementById('panelResultados');
            if (panelResultados) {
                panelResultados.style.display = 'block';
                window.scrollTo({ top: panelResultados.offsetTop, behavior: 'smooth' });
            }
           
            mostrarToast("✅ Análisis generado con éxito.");

        } catch (error) {
            console.error("Error crítico en ejecución:", error);
            mostrarToast("❌ Ocurrió un error en el motor matemático.");
        }
    });
}