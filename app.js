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
    "35": "Jirafa", "36": "Culebra", "37": "Tortuga", "38": "Búfalo", "39": "Lechuza", "40": "Avispa",
    "41": "Canguro", "42": "Tucán", "43": "Mariposa", "44": "Chigüire", "45": "Garza", "46": "Puma",
    "47": "Pavo Real", "48": "Puercoespín", "49": "Pereza", "50": "Canario", "51": "Pelícano",
    "52": "Pulpo", "53": "Caracol", "54": "Grillo", "55": "Oso hormiguero", "56": "Tiburón",
    "57": "Pato", "58": "Hormiga", "59": "Pantera", "60": "Camaleón", "61": "Danta",
    "62": "Cachicamo", "63": "Cangrejo", "64": "Gavilán", "65": "Araña", "66": "Lobo",
    "67": "Avestruz", "68": "Jaguar", "69": "Conejo", "70": "Bisonte", "71": "Guacamaya",
    "72": "Gorila", "73": "Hipopótamo", "74": "Turpial", "75": "Guácharo"
};

const HORAS = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"];

let BaseDatos = {};
let ModeloPesos = { anclaje: 100, secuencial: 50, pool: 30, enjaulado: 10, totalRevisiones: 0, aciertos: 0 };

const selectLoteria = document.getElementById('select-loteria');
const fechaCarga = document.getElementById('fecha-carga');

// ==========================================
// TOAST SYSTEM
// ==========================================
function mostrarToast(mensaje, duracion = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.classList.add('mostrar');
    setTimeout(() => toast.classList.remove('mostrar'), duracion);
}

// ==========================================
// INICIALIZACIÓN CORREGIDA (DOMContentLoaded)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    cargarBaseDatos();
    construirGridInputs();
    actualizarEstadoDB();

    // NUEVO: Muestra el panel si hay una fecha seleccionada al cargar la página
    if (fechaCarga.value) {
        document.getElementById('panel-datos-dia').style.display = 'block';
        cargarDiaEspecifico(fechaCarga.value);
    }
});

// ==========================================
// EVENTOS DE CONFIGURACIÓN
// ==========================================
selectLoteria.addEventListener('change', () => {
    cargarBaseDatos();
    actualizarEstadoDB();
    if (fechaCarga.value) cargarDiaEspecifico(fechaCarga.value);
});

fechaCarga.addEventListener('change', (e) => {
    if (e.target.value) {
        cargarDiaEspecifico(e.target.value);
        document.getElementById('panel-datos-dia').style.display = 'block';
    }
});

// ==========================================
// FUNCIONES DE BASE DE DATOS
// ==========================================
function cargarBaseDatos() {
    const loteriaActiva = selectLoteria.value;
    const datosGuardados = localStorage.getItem(`db_animalitos_${loteriaActiva}`);
    BaseDatos = datosGuardados ? JSON.parse(datosGuardados) : {};

    const pesosGuardados = localStorage.getItem(`pesos_animalitos_${loteriaActiva}`);
    if (pesosGuardados) ModeloPesos = JSON.parse(pesosGuardados);
}

function actualizarEstadoDB() {
    const totalDias = Object.keys(BaseDatos).length;
    document.getElementById('db-status').innerText = `Historial Guardado: ${totalDias} días registrados`;

    const infoDias = document.getElementById('dias-disponibles-info');
    if (totalDias < 2) {
        infoDias.style.display = 'block';
        infoDias.textContent = `Necesitas al menos 2 días para generar predicciones. Actualmente tienes ${totalDias}.`;
    } else {
        infoDias.style.display = 'none';
    }
}

function construirGridInputs() {
    const container = document.getElementById('grid-horas-inputs');
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
    document.getElementById('titulo-fecha-activa').innerText = `Resultados del: ${fecha.split('-').reverse().join('/')}`;
    const resultadoDia = BaseDatos[fecha] || Array(12).fill("");
    HORAS.forEach((_, i) => {
        document.getElementById(`hora-inp-${i}`).value = resultadoDia[i] || "";
    });
}

// ==========================================
// GUARDADO DE DATOS Y EVALUACIÓN DE DESEMPEÑO
// ==========================================
document.getElementById('btnGuardarDia').addEventListener('click', () => {
    const fecha = fechaCarga.value;
    if (!fecha) return;

    let filaResultados = [];
    HORAS.forEach((_, i) => {
        let val = document.getElementById(`hora-inp-${i}`).value.trim();
        filaResultados.push(normalizarNumero(val) || "");
    });

    evaluarDesempeñoPredicciones(fecha, filaResultados);

    BaseDatos[fecha] = filaResultados;
    localStorage.setItem(`db_animalitos_${selectLoteria.value}`, JSON.stringify(BaseDatos));

    actualizarEstadoDB();
    mostrarToast(`🎉 Resultados del día ${fecha.split('-').reverse().join('/')} guardados correctamente.`);
});

// Función faltante para evaluar el desempeño de las predicciones
function evaluarDesempeñoPredicciones(fecha, resultadosReales) {
    const prediccionesGuardadas = localStorage.getItem(`predicciones_${selectLoteria.value}_${fecha}`);
    if (!prediccionesGuardadas) {
        ModeloPesos.totalRevisiones += 1;
    } else {
        try {
            const predicciones = JSON.parse(prediccionesGuardadas);
            // Contar aciertos: si al menos una predicción está en los resultados reales
            const aciertos = resultadosReales.filter(val => val !== '' && predicciones.includes(val)).length;
            if (aciertos > 0) ModeloPesos.aciertos += 1;
            ModeloPesos.totalRevisiones += 1;
        } catch (e) {
            console.warn("Error al evaluar predicciones:", e);
        }
    }
    // Guardar el modelo actualizado
    localStorage.setItem(`pesos_animalitos_${selectLoteria.value}`, JSON.stringify(ModeloPesos));
}

// ==========================================
// VALIDACIÓN DE ENTRADA
// ==========================================
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('js-num-input')) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }
});

document.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('js-num-input') && e.target.value !== '') {
        let val = e.target.value;
        if (val === "0" || val === "00") return;
        let num = parseInt(val, 10);
        if (num >= 1 && num <= 75) {
            e.target.value = num < 10 ? '0' + num : num.toString();
        } else {
            e.target.value = '';
        }
    }
});

function normalizarNumero(val) {
    if (val === "00" || val === "0") return val;
    let num = parseInt(val, 10);
    return (num >= 1 && num <= 75) ? num.toString() : null;
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
            retrasos[n] = 30;
        } else {
            let diasSinSalir = Math.floor((hoy - ultimaAparicion[n]) / (1000 * 60 * 60 * 24));
            retrasos[n] = diasSinSalir;
        }
    });

    let maxRetraso = Math.max(...Object.values(retrasos), 1);
    return { retrasos, maxRetraso };
}

function analizarSumaHistorica(fechasOrdenadas) {
    if (fechasOrdenadas.length < 3) return { promedio: 450, rango: 100 };

    let sumas = fechasOrdenadas.map(f => {
        return (BaseDatos[f] || []).reduce((acc, n) => {
            let val = parseInt(n);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
    }).filter(s => s > 0);

    if (sumas.length === 0) return { promedio: 450, rango: 100 };

    let promedio = sumas.reduce((a, b) => a + b, 0) / sumas.length;
    let rango = Math.max(...sumas) - Math.min(...sumas);
    return { promedio, rango: Math.max(rango, 80) };
}

function obtenerTecnicaDominante(num, contribuciones) {
    if (!contribuciones[num]) return 'Combinado';
    const c = contribuciones[num];
    let maxTecnica = Object.keys(c).reduce((a, b) => c[a] > c[b] ? a : b);
    const mapa = {
        anclaje: '⚓ Anclaje Histórico',
        secuencial: '🔗 Cadena de Transición',
        pool: '🔥 Pool Caliente 48h',
        ciclos: '🔄 Ciclo de Atraso',
        suma: '⚖️ Equilibrio de Suma',
        enjaulado: '🔒 Enjaulado del Mes'
    };
    return mapa[maxTecnica] || 'Combinado';
}

// ==========================================
// MOTOR MATEMÁTICO CORREGIDO (btnGenerar)
// ==========================================
document.getElementById('btnGenerar').addEventListener('click', () => {
    try {
        const fechaActual = fechaCarga.value;
        const fechasOrdenadas = Object.keys(BaseDatos).sort((a, b) => new Date(a) - new Date(b));

        if (fechasOrdenadas.length < 2) {
            mostrarToast("⚠️ Se necesitan al menos 2 días de historial guardado.");
            return;
        }

        let universo = ["0", "00"];
        for (let i = 1; i <= 75; i++) universo.push(i.toString());

        // 1. EXTRAER VALORES ACTUALES EN PANTALLA
        let numsHoyEnPantalla = [];
        HORAS.forEach((_, i) => {
            let val = document.getElementById(`hora-inp-${i}`).value.trim();
            let norm = normalizarNumero(val);
            if (norm) {
                numsHoyEnPantalla.push({ hora: i, num: norm });
            }
        });

        // 2. OBTENER POOL CALIENTE (últimos 2 días anteriores a hoy)
        const fechaActualDate = new Date(fechaActual);
        let diasFiltrados = fechasOrdenadas.filter(f => new Date(f) < fechaActualDate);
        if (diasFiltrados.length === 0) {
            diasFiltrados = [...fechasOrdenadas];
        }

        let uDia1 = BaseDatos[diasFiltrados[diasFiltrados.length - 1]] || [];
        let uDia2 = diasFiltrados.length > 1 ? (BaseDatos[diasFiltrados[diasFiltrados.length - 2]] || []) : [];
        let ultimosNums = [...uDia1.filter(x => x !== ''), ...uDia2.filter(x => x !== '')];

        let freq48 = {};
        ultimosNums.forEach(n => freq48[n] = (freq48[n] || 0) + 1);
        let poolCaliente = [...new Set(ultimosNums)].sort((a, b) => freq48[b] - freq48[a]);

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
                            if (n !== '' && !soloNumerosHoy.includes(n)) {
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
                (BaseDatos[f] || []).forEach(n => { if (n !== '') todosLosVistos.push(n); });
            }
        });

        numsHoyEnPantalla.forEach(item => {
            todosLosVistos.push(item.num);
        });

        let setVistos = new Set(todosLosVistos);
        let enjaulados = universo.filter(n => !setVistos.has(n));

        // 5. CADENA DE TRANSICIONES
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

        // 7. ASIGNACIÓN DINÁMICA DE PESOS CON CONTRIBUCIONES
        let pesos = {};
        let tecnicasContribucion = {};

        function addPeso(num, cantidad, tecnica) {
            pesos[num] = (pesos[num] || 0) + cantidad;
            if (!tecnicasContribucion[num]) {
                tecnicasContribucion[num] = { anclaje: 0, secuencial: 0, pool: 0, ciclos: 0, suma: 0, enjaulado: 0 };
            }
            tecnicasContribucion[num][tecnica] += cantidad;
        }

        // 7a. Anclaje
        poolAnclajeFinal.forEach((n, i) => {
            let aporte = ModeloPesos.anclaje - (i * 5);
            if (aporte > 0) addPeso(n, aporte, 'anclaje');
        });

        // 7b. Secuencial (transiciones)
        let ultimoNumeroGlobal = todosLosVistos[todosLosVistos.length - 1];
        if (ultimoNumeroGlobal && transiciones[ultimoNumeroGlobal]) {
            transiciones[ultimoNumeroGlobal].forEach(n => {
                addPeso(n, ModeloPesos.secuencial, 'secuencial');
            });
        }

        // 7c. Pool caliente
        poolCaliente.forEach((n, i) => {
            let aporte = Math.max(ModeloPesos.pool - (i * 2), 2);
            addPeso(n, aporte, 'pool');
        });

        // 7d. Enjaulados
        enjaulados.forEach(n => {
            addPeso(n, ModeloPesos.enjaulado, 'enjaulado');
        });

        // 7e. Ciclos de retraso
        universo.forEach(n => {
            let factorRetraso = (retrasos[n] / maxRetraso) * 15;
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

        // 8. FILTRADO POR UMBRAL DE CONFIANZA
        let pesosArray = Object.values(pesos);
        let pesoMaximo = Math.max(...pesosArray, 1);
        let umbralConfianza = pesoMaximo * 0.7;

        let prediccionesFuertes = Object.keys(pesos)
            .filter(n => pesos[n] >= umbralConfianza)
            .sort((a, b) => pesos[b] - pesos[a]);

        if (prediccionesFuertes.length === 0) {
            // Fallback: top 3 de sugerencias generales
            let sugerencias = Object.keys(pesos).sort((a, b) => pesos[b] - pesos[a]);
            prediccionesFuertes = sugerencias.slice(0, 3);
        } else {
            prediccionesFuertes = prediccionesFuertes.slice(0, 4);
        }

        // Guardar predicciones para evaluación posterior
        localStorage.setItem(`predicciones_${selectLoteria.value}_${fechaActual}`, JSON.stringify(prediccionesFuertes));

        // 9. RENDERIZADO FINAL
        const fName = (n) => `[${n.padStart(2, '0')}] ${DICCIONARIO[n] || 'Animal'}`;

        let porcEficiencia = ModeloPesos.totalRevisiones > 0
            ? Math.round((ModeloPesos.aciertos / ModeloPesos.totalRevisiones) * 100)
            : 100;
        document.getElementById('txt-eficiencia').innerText = `${porcEficiencia}%`;
        document.getElementById('txt-aprendizaje-log').innerText = `Basado en ${ModeloPesos.totalRevisiones} evaluaciones. Peso de Anclaje: ${ModeloPesos.anclaje}pts.`;

        // Tarjetas de predicción
        const tarjetaContainer = document.getElementById('tarjetas-prediccion-container');
        let tarjetasHTML = '';

        prediccionesFuertes.forEach((num, idx) => {
            let nombreAnimal = fName(num);
            let pesoRel = (pesos[num] / pesoMaximo) * 95;
            let porcentajeEstimado = Math.min(95, Math.round(pesoRel)).toFixed(0);
            let tecnica = obtenerTecnicaDominante(num, tecnicasContribucion);

            let descripcion = idx === 0 ? 'Predicción principal' : (idx === 1 ? 'Alta probabilidad secundaria' : 'Opción complementaria');

            tarjetasHTML += `
                <div class="tarjeta-prediccion">
                    <div class="pred-info">
                        <h4>${nombreAnimal}</h4>
                        <p>${descripcion}</p>
                        <span class="badge-tecnica" style="font-size:12px; color: var(--texto-secundario); background: rgba(0,0,0,0.05); padding:2px 8px; border-radius:12px;">${tecnica}</span>
                    </div>
                    <div class="pred-porcentaje pred-verde">${porcentajeEstimado}%</div>
                </div>
            `;
        });

        if (prediccionesFuertes.length === 0) {
            tarjetasHTML = '<p class="text-center">No hay predicciones que superen el umbral de confianza hoy. Intenta con más datos históricos.</p>';
        }
        tarjetaContainer.innerHTML = tarjetasHTML;

        // Pool caliente
        document.getElementById('pool-badges').innerHTML = poolCaliente.slice(0, 6).map(n => `<div class="badge-animalito">${fName(n)}</div>`).join('');

        // Conexión histórica
        const txtAnclaje = document.getElementById('txt-anclaje-info');
        const badgesAnclaje = document.getElementById('anclaje-badges');
        if (txtAnclaje && badgesAnclaje) {
            if (numsHoyEnPantalla.length > 0) {
                txtAnclaje.innerText = `${numsHoyEnPantalla.length} sorteo(s) hoy para cruce dinámico.`;
                badgesAnclaje.innerHTML = poolAnclajeFinal.slice(0, 6).map(n => `<div class="badge-animalito">${fName(n)}</div>`).join('') || '<div class="badge-animalito">Buscando coincidencias...</div>';
            } else {
                txtAnclaje.innerText = "Introduce al menos un resultado de hoy para activar.";
                badgesAnclaje.innerHTML = '<div class="badge-animalito">Esperando sorteo inicial</div>';
            }
        }

        // Enjaulados
   