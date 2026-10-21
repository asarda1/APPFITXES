/* =========================================================
   PLAN DE MANTENIMIENTO ROMERO POLO – MODELO ACUMULATIVO
   ========================================================= */

const mantenimientos = {

  /* =========================
     BASE – MANTENIMIENTO DIARIO
     ========================= */
  "diario": [
    "Inspección visual general de la máquina",
    "Revisión de fugas de aceite, combustible e hidráulico",
    "Comprobación de niveles (aceite motor, hidráulico, refrigerante)",
    "Revisión de señalización, luces y avisadores acústicos",
    "Comprobación de frenos, dirección y paradas de emergencia",
    "Revisión de protecciones, barandillas y accesos",
    "Limpieza básica de la máquina"
  ],

  /* =========================
     50 HORAS = DIARIO + 50 h
     ========================= */
  "50h": [
    // Diario
    "Inspección visual general de la máquina",
    "Revisión de fugas de aceite, combustible e hidráulico",
    "Comprobación de niveles (aceite motor, hidráulico, refrigerante)",
    "Revisión de señalización, luces y avisadores acústicos",
    "Comprobación de frenos, dirección y paradas de emergencia",
    "Revisión de protecciones, barandillas y accesos",
    "Limpieza básica de la máquina",

    // 50 h
    "Engrase de todos los puntos indicados por el fabricante",
    "Revisión de aprietes generales",
    "Revisión del estado de correas y manguitos",
    "Comprobación del estado de neumáticos u orugas",
    "Revisión básica del sistema eléctrico"
  ],

  /* =========================
     250 HORAS = 50 h + 250 h
     ========================= */
  "250h": [
    // 50 h
    "Inspección visual general de la máquina",
    "Revisión de fugas de aceite, combustible e hidráulico",
    "Comprobación de niveles (aceite motor, hidráulico, refrigerante)",
    "Revisión de señalización, luces y avisadores acústicos",
    "Comprobación de frenos, dirección y paradas de emergencia",
    "Revisión de protecciones, barandillas y accesos",
    "Limpieza básica de la máquina",
    "Engrase de todos los puntos indicados por el fabricante",
    "Revisión de aprietes generales",
    "Revisión del estado de correas y manguitos",
    "Comprobación del estado de neumáticos u orugas",
    "Revisión básica del sistema eléctrico",

    // 250 h
    "Limpieza o sustitución del filtro de aire",
    "Revisión del sistema de combustible",
    "Revisión del sistema hidráulico",
    "Inspección de elementos de trabajo (rodillos, reglas, fresas, cucharones)",
    "Comprobación de holguras y desgastes"
  ],

  /* =========================
     500 HORAS = 250 h + 500 h
     ========================= */
  "500h": [
    // 250 h (incluye diario + 50 h)
    "Inspección visual general de la máquina",
    "Revisión de fugas de aceite, combustible e hidráulico",
    "Comprobación de niveles (aceite motor, hidráulico, refrigerante)",
    "Revisión de señalización, luces y avisadores acústicos",
    "Comprobación de frenos, dirección y paradas de emergencia",
    "Revisión de protecciones, barandillas y accesos",
    "Limpieza básica de la máquina",
    "Engrase de todos los puntos indicados por el fabricante",
    "Revisión de aprietes generales",
    "Revisión del estado de correas y manguitos",
    "Comprobación del estado de neumáticos u orugas",
    "Revisión básica del sistema eléctrico",
    "Sustitución del filtro de aire",
    "Revisión del sistema de combustible",
    "Revisión del sistema hidráulico",
    "Inspección de elementos de trabajo",
    "Comprobación de holguras y desgastes",

    // 500 h
    "Cambio de aceite del motor",
    "Sustitución del filtro de aceite",
    "Revisión del sistema de refrigeración",
    "Revisión del sistema de frenos",
    "Inspección detallada de la transmisión"
  ],

  /* =========================
     1000 HORAS = 500 h + 1000 h
     ========================= */
  "1000h": [
    // 500 h
    "Inspección visual general de la máquina",
    "Revisión de fugas de aceite, combustible e hidráulico",
    "Comprobación de niveles (aceite motor, hidráulico, refrigerante)",
    "Revisión de señalización, luces y avisadores acústicos",
    "Comprobación de frenos, dirección y paradas de emergencia",
    "Revisión de protecciones, barandillas y accesos",
    "Limpieza básica de la máquina",
    "Engrase de todos los puntos indicados por el fabricante",
    "Revisión de aprietes generales",
    "Revisión del estado de correas y manguitos",
    "Comprobación del estado de neumáticos u orugas",
    "Revisión básica del sistema eléctrico",
    "Sustitución del filtro de aire",
    "Revisión del sistema de combustible",
    "Revisión del sistema hidráulico",
    "Inspección de elementos de trabajo",
    "Comprobación de holguras y desgastes",
    "Cambio de aceite del motor",
    "Sustitución del filtro de aceite",
    "Revisión del sistema de refrigeración",
    "Revisión del sistema de frenos",
    "Inspección detallada de la transmisión",

    // 1000 h
    "Sustitución de filtros hidráulicos",
    "Revisión de bombas y motores hidráulicos",
    "Revisión completa del sistema eléctrico",
    "Comprobación de sensores y sistemas electrónicos",
    "Revisión estructural del bastidor"
  ],

  /* =========================
     2000 HORAS = 1000 h + 2000 h
     ========================= */
  "2000h": [
    // 1000 h
    "Inspección visual general de la máquina",
    "Revisión de fugas de aceite, combustible e hidráulico",
    "Comprobación de niveles (aceite motor, hidráulico, refrigerante)",
    "Revisión de señalización, luces y avisadores acústicos",
    "Comprobación de frenos, dirección y paradas de emergencia",
    "Revisión de protecciones, barandillas y accesos",
    "Limpieza básica de la máquina",
    "Engrase de todos los puntos indicados por el fabricante",
    "Revisión de aprietes generales",
    "Revisión del estado de correas y manguitos",
    "Comprobación del estado de neumáticos u orugas",
    "Revisión básica del sistema eléctrico",
    "Sustitución del filtro de aire",
    "Revisión del sistema de combustible",
    "Revisión del sistema hidráulico",
    "Inspección de elementos de trabajo",
    "Comprobación de holguras y desgastes",
    "Cambio de aceite del motor",
    "Sustitución del filtro de aceite",
    "Revisión del sistema de refrigeración",
    "Revisión del sistema de frenos",
    "Inspección detallada de la transmisión",
    "Sustitución de filtros hidráulicos",
    "Revisión de bombas y motores hidráulicos",
    "Revisión completa del sistema eléctrico",
    "Comprobación de sensores y sistemas electrónicos",
    "Revisión estructural del bastidor",

    // 2000 h
    "Revisión profunda de transmisión y reductores",
    "Cambio de aceites de diferenciales y ejes",
    "Revisión de sistemas de tracción",
    "Inspección de chasis y soldaduras",
    "Evaluación del desgaste general"
  ],

  /* =========================
     3000 HORAS = 2000 h + 3000 h
     ========================= */
  "3000h": [
    // 2000 h
    "Inspección visual general de la máquina",
    "Revisión de fugas de aceite, combustible e hidráulico",
    "Comprobación de niveles (aceite motor, hidráulico, refrigerante)",
    "Revisión de señalización, luces y avisadores acústicos",
    "Comprobación de frenos, dirección y paradas de emergencia",
    "Revisión de protecciones, barandillas y accesos",
    "Limpieza básica de la máquina",
    "Engrase de todos los puntos indicados por el fabricante",
    "Revisión de aprietes generales",
    "Revisión del estado de correas y manguitos",
    "Comprobación del estado de neumáticos u orugas",
    "Revisión básica del sistema eléctrico",
    "Sustitución del filtro de aire",
    "Revisión del sistema de combustible",
    "Revisión del sistema hidráulico",
    "Inspección de elementos de trabajo",
    "Comprobación de holguras y desgastes",
    "Cambio de aceite del motor",
    "Sustitución del filtro de aceite",
    "Revisión del sistema de refrigeración",
    "Revisión del sistema de frenos",
    "Inspección detallada de la transmisión",
    "Sustitución de filtros hidráulicos",
    "Revisión de bombas y motores hidráulicos",
    "Revisión completa del sistema eléctrico",
    "Comprobación de sensores y sistemas electrónicos",
    "Revisión estructural del bastidor",
    "Revisión profunda de transmisión y reductores",
    "Cambio de aceites de diferenciales y ejes",
    "Revisión de sistemas de tracción",
    "Inspección de chasis y soldaduras",
    "Evaluación del desgaste general",

    // 3000 h
    "Revisión integral completa de la máquina",
    "Evaluación para gran reparación o reconstrucción",
    "Revisión completa de seguridad",
    "Planificación de sustituciones mayores",
    "Emisión de informe técnico de estado"
  ],

  /* =========================
     60.000 KM (placeholder)
     ========================= */
  "60000km": [],

  /* =========================
     MANTENIMIENTO ANUAL
     ========================= */
"anual": [
  "Revisar estado general de la maquina y su engrase",
  "Revisar avisador acústico (pito/claxon)",
  "Revisar señalización, iluminación y rotativos",
  "Revisar frenos de servicio, estacionamiento y paros de emergencia",
  "Revisar elementos de seguridad y protecciones",
  "Revisar accesos, pasarelas y barandillas (si procede)",
  "Revisar estado de filtros (aire, aceite, combustible)",
  "Revisar niveles de aceite motor",
  "Revisar niveles de aceite hidráulico",
  "Revisar nivel del refrigerante",
  "Revisar posibles fugas de aceite, combustible o hidráulico",
  "Revisar estado de manguitos y correas",
  "Revisar sistemas de avance o traslación",
  "Revisar sistema de riego/aspersión (si procede)",
  "Revisar sistema de nivelación y sensores de altura (si procede)",
  "Revisar sistema de nivelación y sensores de altura (si procede)",
  "Revisar cintas transportadoras (si procede)",
  "Revisar estado de los implementos (si procede)"
]

};
