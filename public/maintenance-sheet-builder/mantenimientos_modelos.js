// Base de datos (skeleton) de mantenimiento por MODELO (no por máquina).
// Objetivo: reutilizar operaciones/materiales entre máquinas del mismo modelo.
// Nota: este archivo define estructura y helpers; los datos reales se irán completando.

(function () {
  "use strict";

  function normalizeMarcaModelo(raw) {
    return String(raw || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^BAJA\s+/i, "") // "BAJA WIRTGEN - W350" -> "WIRTGEN - W350"
      .toUpperCase();
  }

  // Convierte "VOGELE - S1900-5 X" -> "VOGELE_S1900_5X"
  function marcaModeloToModelId(marcaModelo) {
    const norm = normalizeMarcaModelo(marcaModelo);
    if (!norm) return "";

    // Separador por guion si existe, si no usamos el texto tal cual.
    let brand = "";
    let model = "";
    const m = norm.match(/^(.+?)\s*-\s*(.+)$/);
    if (m) {
      brand = m[1].trim();
      model = m[2].trim();
    } else {
      model = norm;
    }

    // Limpieza de modelo: quitar espacios y caracteres raros, unificar guiones.
    model = model
      .replace(/\s+/g, "")
      .replace(/-/g, "_")
      .replace(/[^A-Z0-9_]/g, "");

    brand = brand.replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    const out = (brand ? brand + "_" : "") + model;
    return out.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  }

  function getModelIdForCodigo(codigo) {
    const c = String(codigo || "").trim();
    const maq = (typeof maquinaria !== "undefined" ? maquinaria : window.maquinaria);
    if (!c || !maq || !maq[c]) return "";
    return marcaModeloToModelId(maq[c].marcaModelo || maq[c].maquina || "");
  }

  // Intervalos (opción A): diario, horas, años, etc.
  // Claves estables para la BD; etiquetas se generan en UI.
  // Ejemplos: daily, h8, h50_post, h500, h1000, h1500, h3000, h4500, h6000, y1, y6

  window.MANTENIMIENTOS_MODELOS = {
    version: "skeleton-2026-02-11",

    // Catálogo global de operaciones: opId -> { text, sistema?, accion?, fuente? }
    opsCatalog: {},

    // Catálogo global de consumibles: matId -> { name, spec?, unit?, ref? }
    materialsCatalog: {},

    // Plantillas por modelo: modelId -> { intervals: { [intervalKey]: { ops:[opId], materials:[{matId, qty?, note?}], torques:[{where, nm, note?}] } } }
    templatesByModel: {},

    // Asignación por máquina (si se quiere forzar modelo distinto al detectado)
    // codigo -> { modelId, overrides? }
    machines: {},

    // Helpers (para debugging / uso futuro)
    normalizeMarcaModelo,
    marcaModeloToModelId,
    getModelIdForCodigo
  };

  // =========================
  // CONVENCIONES (IMPORTANTE)
  // =========================
  // A partir de ahora, para que la app mantenga el mismo formato y comportamiento:
  //
  // 1) Intervalos (opción A) - claves esperadas por la UI:
  //    - daily
  //    - h8, h500, h1000, ...
  //    - h50_post (solo "puesta en servicio")
  //    - y1, y6, ...
  //
  // 2) Operaciones (opsCatalog):
  //    addOp(opId, "texto...", {
  //      fuente?: "manual.pdf",
  //      action?: "comprobar" | "revisar" | "limpiar" | "cambiar" | "sustituir",
  //      groupKey?: "sistema.componente"  // CLAVE para que los intervalos acumulativos no eliminen cosas incorrectas
  //      supersedes?: ["opId.antiguo"]     // Opcional: supresión explícita (más segura aún)
  //    })
  //
  //    - Usa groupKey SOLO cuando sea el mismo componente (p.ej. filtros distintos => groupKey distinto).
  //
  // 3) Materiales (materialsCatalog + intervals.materials):
  //    - Define el material en materialsCatalog con su unidad (unit) y, si aplica, qty/note.
  //    - En la plantilla del intervalo (intervals[...].materials) usa:
  //        { matId, qty?, unit?, note? }
  //    - La UI mostrará:
  //        - Columna "Tipo de filtro/material": name + note
  //        - Columna "Cantidad / unidad": "qty unit" (texto libre, editable)
  //
  //    Recomendación: NO metas la unidad dentro del name (para evitar duplicados).
  //
  // 4) Validación rápida (opcional): en consola puedes llamar a
  //    window.MANTENIMIENTOS_MODELOS_VALIDATE()
  //    para ver referencias rotas (opId/matId que no existan).

  // =========================
  // Datos iniciales (56011 - VOGELE S1900-5X)
  // =========================

  const DB = window.MANTENIMIENTOS_MODELOS;

  function addOp(opId, text, meta = {}) {
    if (!opId || !text) return;
    DB.opsCatalog[opId] = { text: String(text), ...meta };
  }

  function addMat(matId, name, meta = {}) {
    if (!matId || !name) return;
    DB.materialsCatalog[matId] = { name: String(name), ...meta };
  }

  // Modelo detectado desde maquinaria_completa.js:
  // "VOGELE - S1900-5 X" -> modelId "VOGELE_S1900_5X"
  const MODEL_VOGELE_S1900_5X = "VOGELE_S1900_5X";

  // Modelo detectado desde maquinaria_completa.js:
  // "VOGELE - MT 300-3i" -> modelId "VOGELE_MT300_3I"
  const MODEL_VOGELE_MT300_3I = "VOGELE_MT300_3I";

  // Modelo detectado desde maquinaria_completa.js:
  // "VOGELE - S2100-5I" -> modelId "VOGELE_S2100_5I"
  const MODEL_VOGELE_S2100_5I = "VOGELE_S2100_5I";

  // Modelo detectado desde maquinaria_completa.js:
  // "VOGELE - S1300-3I" -> modelId "VOGELE_S1300_3I"
  const MODEL_VOGELE_S1300_3I = "VOGELE_S1300_3I";

  // Modelo detectado desde maquinaria_completa.js:
  // "VOGELE - S1800-3I" -> modelId "VOGELE_S1800_3I"
  const MODEL_VOGELE_S1800_3I = "VOGELE_S1800_3I";

  // Modelo detectado desde maquinaria_completa.js:
  // "VOGELE - S1900-3" -> modelId "VOGELE_S1900_3"
  const MODEL_VOGELE_S1900_3 = "VOGELE_S1900_3";

  // Modelo detectado desde maquinaria_completa.js:
  // "VOGELE - S1900-2" -> modelId "VOGELE_S1900_2"
  const MODEL_VOGELE_S1900_2 = "VOGELE_S1900_2";

  // Modelo detectado desde maquinaria_completa.js:
  // "WIRTGEN - W350" / "BAJA WIRTGEN - W350" -> modelId "WIRTGEN_W350"
  const MODEL_WIRTGEN_W350 = "WIRTGEN_W350";

  // Modelo detectado desde maquinaria_completa.js:
  // "WIRTGEN - W130F" -> modelId "WIRTGEN_W130F"
  const MODEL_WIRTGEN_W130F = "WIRTGEN_W130F";

  // Modelo detectado desde maquinaria_completa.js:
  // "WIRTGEN - W2000" -> modelId "WIRTGEN_W2000"
  const MODEL_WIRTGEN_W2000 = "WIRTGEN_W2000";

  // Modelo detectado desde maquinaria_completa.js:
  // "WM1000" -> modelId "WM1000"
  const MODEL_WM1000 = "WM1000";

  // Modelo detectado desde maquinaria_completa.js:
  // "HAMM HP 280i" -> modelId "HAMMHP280I"
  const MODEL_HAMMHP280I = "HAMMHP280I";

  // Modelo detectado desde maquinaria_completa.js:
  // "HAMM - HD 14TT" -> modelId "HAMM_HD14TT"
  const MODEL_HAMM_HD14TT = "HAMM_HD14TT";

  // Modelo detectado desde maquinaria_completa.js:
  // "HAMM - GRW24" -> modelId "HAMM_GRW24"
  const MODEL_HAMM_GRW24 = "HAMM_GRW24";

  // Modelo detectado desde maquinaria_completa.js:
  // "HAMM - GRW18" -> modelId "HAMM_GRW18"
  const MODEL_HAMM_GRW18 = "HAMM_GRW18";

  // Modelo detectado desde maquinaria_completa.js:
  // "HAMM - GRW15" -> modelId "HAMM_GRW15"
  const MODEL_HAMM_GRW15 = "HAMM_GRW15";

  // Modelo detectado desde maquinaria_completa.js:
  // "HAMM - HD+ 120iVO" -> modelId "HAMM_HD120IVO"
  const MODEL_HAMM_HD120IVO = "HAMM_HD120IVO";

  // Modelo detectado desde maquinaria_completa.js:
  // "BOMAG - BW161" -> modelId "BOMAG_BW161"
  const MODEL_BOMAG_BW161 = "BOMAG_BW161";

  // Modelo detectado desde maquinaria_completa.js:
  // "HAMM - HD110+" -> modelId "HAMM_HD110"
  const MODEL_HAMM_HD110 = "HAMM_HD110";

  // Modelo detectado desde maquinaria_completa.js:
  // "HAMM - 3520" -> modelId "HAMM_3520"
  const MODEL_HAMM_3520 = "HAMM_3520";

  // Modelo detectado desde maquinaria_completa.js:
  // "CASE - SR175B" -> modelId "CASE_SR175B"
  const MODEL_CASE_SR175B = "CASE_SR175B";
  // "CASE SR210B" -> modelId "CASE_SR210B"
  const MODEL_CASE_SR210B = "CASE_SR210B";
  // "CASE - SR175" -> modelId "CASE_SR175"
  const MODEL_CASE_SR175 = "CASE_SR175";
  // "WIRTGEN WR2400" -> modelId "WIRTGEN_WR2400"
  const MODEL_WIRTGEN_WR2400 = "WIRTGEN_WR2400";
  // "PRECRIBADOR MOVIL KLEEMANN" -> modelId "PRECRIBADORMOVILKLEEMANN"
  const MODEL_PRECRIBADOR_MOVIL_KLEEMANN = "PRECRIBADORMOVILKLEEMANN";
  // "JCB 3CX-4T" -> modelId "JCB_3CX_4T"
  const MODEL_JCB_3CX_4T = "JCB_3CX_4T";
  // "CASE WX188" -> modelId "CASE_WX188"
  const MODEL_CASE_WX188 = "CASE_WX188";

  // --- Operaciones (50 h tras puesta en servicio)
  addOp("op.vogele_s1900_5x.h50_post.cinta_fuerza_motor_comprobar", "Cinta de fuerza (motor): comprobar", { action: "comprobar", groupKey: "motor.cinta_fuerza", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.filtro_aceite_fuga_hid_sustituir", "Filtro de aceite de fuga (hidráulico): sustituir", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.filtro_asp_retorno_hid_sustituir", "Filtro de aspiración de retorno (hidráulico): sustituir", { action: "sustituir", groupKey: "hidraulico.filtro_asp_retorno", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.aceite_distribuidor_bomba_cambiar", "Aceite de engranaje del distribuidor de bomba: cambiar", { action: "cambiar", groupKey: "hidraulico.aceite_distribuidor_bomba", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.oruga_traslacion_comprobar_tensar", "Oruga del mecanismo de traslación: comprobar / tensar", { action: "comprobar", groupKey: "traslacion.oruga", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.aceite_traslacion_izq_dcha_cambiar", "Aceite engranaje traslación izq./dcha.: cambiar", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.cadena_cinta_rascadora_comprobar_tensar_aceitar", "Cadena de cinta rascadora: comprobar / tensar / aceitar", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar_engrasar", "Cadenas accionamiento cinta rascadora: comprobar / tensar / engrasar", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.cadenas_acc_sinfin_distrib_comprobar_tensar", "Cadenas accionamiento sinfín distribución: comprobar / tensar", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h50_post.tension_todas_cadenas_comprobar", "Tensión de todas las cadenas: comprobar", { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "BAL_1119_3078925_02_00_02_es" });

  // --- Operaciones (Diario)
  addOp("op.vogele_s1900_5x.daily.seguridad_puesto_comprobar_limpiar", "Seguridad/puesto: comprobar/limpiar; agua limpieza comprobar/rellenar", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.daily.motor_ruidos_estanqueidad_correa_escape_combustible_aire_refrigeracion", "Motor: ruidos/estanqueidad; correa alternador; escape; combustible; aspiración aire; refrigeración; refrigerante; DEF (si aplica)", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.daily.hidraulico_nivel_aceite_hid_distrib_bomba", "Hidráulico: nivel aceite hidráulico; aceite engranaje distribuidor de bomba (comprobar/rellenar)", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.daily.electrico_cajas_enchufe_controlador_aislamiento", "Eléctrico: cajas enchufe; controlador aislamiento", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.daily.transporte_limpiar_tolva_rodillos_cintas_sinfines_engrase_power_tunnel_cadenas", "Transporte material: limpiar tolva/rodillos/cintas/sinfines; comprobar engrase sinfines; limpiar/lubricar Power Tunnel; engrasar cadenas cinta rascadora", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.daily.limpieza_tablon_lub_central", "Instalación limpieza / tablón / lubricación central: agente separador comprobar/rellenar; bloqueo tablón comprobar/limpiar; lubricación central rellenar/comprobar", { fuente: "BAL_1119_3078925_02_00_02_es" });

  // --- Operaciones (Cada 8 horas)
  addOp("op.vogele_s1900_5x.h8.espejo_limpiar_sustituir", "Espejo: limpiar / sustituir si es preciso", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h8.dispositivos_ascenso_limpiar", "Dispositivos de ascenso: limpiar", { action: "limpiar", groupKey: "acceso.dispositivos_ascenso", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h8.aceite_motor_comprobar_rellenar", "Aceite del motor: comprobar / rellenar", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h8.valvula_descarga_polvo_limpiar", "Válvula de descarga de polvo: limpiar", { action: "limpiar", groupKey: "motor.valvula_descarga_polvo", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h8.sistema_nivelacion_limpiar", "Sistema de nivelación: limpiar", { action: "limpiar", groupKey: "sistema_nivelacion", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h8.bloqueo_tablon_comprobar_limpiar", "Bloqueo del tablón: comprobar / limpiar", { fuente: "BAL_1119_3078925_02_00_02_es" });

  // --- Operaciones (Cada 500 horas) (resumen)
  addOp("op.vogele_s1900_5x.h500.motor_aceite_y_filtro_filtros_combustible_filtro_aire_abrazaderas", "Motor: cambiar aceite + filtro aceite; sustituir filtros combustible; desairear; limpiar filtro aire principal; revisar abrazaderas/uniones; etc.", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h500.hidraulico_filtro_bypass_sustituir", "Hidráulico: filtro de aceite en desvío (by-pass): sustituir", { action: "sustituir", groupKey: "hidraulico.filtro_bypass", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h500.traslacion_oruga_comprobar_tensar", "Traslación: oruga comprobar/tensar", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h500.transporte_cadenas_aceites_engranajes_lub_guias", "Transporte material: comprobar/tensar/engrasar cadenas; comprobar/rellenar aceites engranajes; lubricar guías/deslizaderas; etc.", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h500.tablon_cilindro_nivelacion_lub_tension_cadenas", "Conexión tablones/general: cilindro nivelación lubricar; tensión cadenas comprobar", { fuente: "BAL_1119_3078925_02_00_02_es" });

  // --- Operaciones (Cada 1000 horas) (resumen)
  addOp("op.vogele_s1900_5x.h1000.hidraulico_cambiar_aceite_limpiar_tamiz_sustituir_filtros_desairear", "Hidráulico: cambiar aceite hidráulico; limpiar tamiz/tubuladura/depósito; sustituir filtro de fuga + filtro aspiración/retorno; desairear; cambiar aceite engranaje distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h1000.traslacion_cambiar_aceite_engranaje", "Traslación: cambiar aceite engranaje traslación izq./dcha.", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h1000.transporte_cambiar_aceites_cinta_rascadora_sinfines", "Transporte: cambiar aceites engranajes cinta rascadora y sinfines", { action: "cambiar", groupKey: "transporte.aceites_engranajes", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h1000.instalacion_limpieza_limpiar_tamiz_deposito_agente_separador", "Instalación limpieza: limpiar tamiz/tubuladura/depósito agente separador", { action: "limpiar", groupKey: "instalacion_limpieza.agente_separador_deposito", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h1000.motor_operaciones_adicionales_aplican", "Motor: además, operaciones que también aplican en 1000 h (aceite/filtros/combustible/aire, etc.)", { fuente: "BAL_1119_3078925_02_00_02_es" });

  // --- Operaciones extra
  addOp("op.vogele_s1900_5x.h1500.amortiguador_vibraciones_ciguenal_comprobar", "Amortiguador vibraciones cigüeñal: comprobar (1500 h)", { action: "comprobar", groupKey: "motor.amortiguador_vibraciones_ciguenal", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h1500.filtro_ventilacion_carcasa_ciguenal_sustituir", "Filtro ventilación carcasa cigüeñal: sustituir (1500 h)", { action: "sustituir", groupKey: "motor.filtro_ventilacion_carcasa_ciguenal", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.y1.refrigerador_aire_carga_limpiar", "Refrigerador de aire de carga: limpiar (1 vez al año)", { action: "limpiar", groupKey: "motor.refrigerador_aire_carga", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h3000.juego_valvulas_comprobar_ajustar_sat", "Juego de válvulas: comprobar/ajustar (3000 h, servicio técnico)", { fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h3000.filtro_conducto_def_sustituir", "Filtro del conducto de DEF: sustituir (3000 h)", { action: "sustituir", groupKey: "motor.filtro_conducto_def", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h4500.amortiguador_vibraciones_elastomero_sustituir", "Amortiguador vibraciones elastómero cigüeñal: sustituir (4500 h)", { action: "sustituir", groupKey: "motor.amortiguador_vibraciones_elastomero", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h4500.filtro_unidad_dosificacion_def_sustituir", "Filtro unidad dosificación DEF: sustituir (4500 h)", { action: "sustituir", groupKey: "motor.filtro_unidad_dosificacion_def", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h6000.sistema_refrigeracion_lavar", "Sistema de refrigeración: lavar (6000 h)", { action: "limpiar", groupKey: "motor.sistema_refrigeracion", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.h6000.termostatos_comprobar", "Termostatos: comprobar (6000 h)", { action: "comprobar", groupKey: "motor.termostatos", fuente: "BAL_1119_3078925_02_00_02_es" });
  addOp("op.vogele_s1900_5x.y6.refrigerante_cambiar_6_anos", "Refrigerante (hasta -25 ºC): cambiar cada 6 años", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "BAL_1119_3078925_02_00_02_es" });

  // Materiales básicos (no usados aún por la UI, pero dejamos estructura lista)
  addMat("mat.separador_30l", "Agente separador", { unit: "L", qty: 30, fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.grasa_s21", "Grasa lubricante especial S21", { unit: "", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.aceite_motor_10w30_low_saps", "Aceite motor SAE 10W-30 Low SAPS (Plus-50 II / WG Engine Oil)", { unit: "L", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.refrigerante_cool_gard_ii", "Refrigerante/anticongelante (COOL-GARD II / WG30)", { unit: "L", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.def_adblue", "DEF/AdBlue", { unit: "L", note: "Depósito 21,6 L", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.hidraulico_iso_vg46_hvlp", "Aceite hidráulico ISO VG 46 HVLP (DIN 51524-2)", { unit: "L", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.aceite_engranajes_std", "Aceite engranajes (especificación estándar, p.ej. SAE 80W-90 API GL-5)", { unit: "L", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.aceite_engranajes_esp", "Aceite engranajes (especificación especial, p.ej. SAE 75W-90 API GL-4/GL-5)", { unit: "L", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.filtro_asp_retorno_hid_elemento", "Filtro aspiración/retorno (hidráulico) - elemento filtrante", { unit: "ud", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.filtro_aceite_fuga_hid", "Filtro de aceite de fuga (hidráulico)", { unit: "ud", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.filtro_hid_bypass", "Filtro de aceite en desvío (by-pass) hidráulico", { unit: "ud", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.filtro_aceite_motor", "Filtro de aceite motor", { unit: "ud", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.filtro_combustible", "Filtro(s) de combustible", { unit: "ud", fuente: "BAL_1119_3078925_02_00_02_es" });
  addMat("mat.filtro_aire_principal", "Filtro de aire principal", { unit: "ud", fuente: "BAL_1119_3078925_02_00_02_es" });

  // Plantilla por modelo (intervalos -> listas de opId)
  DB.templatesByModel[MODEL_VOGELE_S1900_5X] = {
    modelId: MODEL_VOGELE_S1900_5X,
    intervals: {
      daily: {
        ops: [
          "op.vogele_s1900_5x.daily.seguridad_puesto_comprobar_limpiar",
          "op.vogele_s1900_5x.daily.motor_ruidos_estanqueidad_correa_escape_combustible_aire_refrigeracion",
          "op.vogele_s1900_5x.daily.hidraulico_nivel_aceite_hid_distrib_bomba",
          "op.vogele_s1900_5x.daily.electrico_cajas_enchufe_controlador_aislamiento",
          "op.vogele_s1900_5x.daily.transporte_limpiar_tolva_rodillos_cintas_sinfines_engrase_power_tunnel_cadenas",
          "op.vogele_s1900_5x.daily.limpieza_tablon_lub_central"
        ],
        materials: [
          { matId: "mat.separador_30l", qty: 30, unit: "L" },
          { matId: "mat.grasa_s21" },
          { matId: "mat.aceite_motor_10w30_low_saps", note: "Rellenar si procede" },
          { matId: "mat.refrigerante_cool_gard_ii", note: "Rellenar si procede" },
          { matId: "mat.def_adblue", note: "Si aplica / rellenar si procede" }
        ],
        torques: []
      },
      h8: {
        ops: [
          "op.vogele_s1900_5x.h8.espejo_limpiar_sustituir",
          "op.vogele_s1900_5x.h8.dispositivos_ascenso_limpiar",
          "op.vogele_s1900_5x.h8.aceite_motor_comprobar_rellenar",
          "op.vogele_s1900_5x.h8.valvula_descarga_polvo_limpiar",
          "op.vogele_s1900_5x.h8.sistema_nivelacion_limpiar",
          "op.vogele_s1900_5x.h8.bloqueo_tablon_comprobar_limpiar"
        ],
        materials: [{ matId: "mat.aceite_motor_10w30_low_saps", note: "Rellenar si procede" }],
        torques: []
      },
      h50_post: {
        ops: [
          "op.vogele_s1900_5x.h50_post.cinta_fuerza_motor_comprobar",
          "op.vogele_s1900_5x.h50_post.filtro_aceite_fuga_hid_sustituir",
          "op.vogele_s1900_5x.h50_post.filtro_asp_retorno_hid_sustituir",
          "op.vogele_s1900_5x.h50_post.aceite_distribuidor_bomba_cambiar",
          "op.vogele_s1900_5x.h50_post.oruga_traslacion_comprobar_tensar",
          "op.vogele_s1900_5x.h50_post.aceite_traslacion_izq_dcha_cambiar",
          "op.vogele_s1900_5x.h50_post.cadena_cinta_rascadora_comprobar_tensar_aceitar",
          "op.vogele_s1900_5x.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar_engrasar",
          "op.vogele_s1900_5x.h50_post.cadenas_acc_sinfin_distrib_comprobar_tensar",
          "op.vogele_s1900_5x.h50_post.tension_todas_cadenas_comprobar"
        ],
        materials: [
          { matId: "mat.filtro_asp_retorno_hid_elemento", qty: 1 },
          { matId: "mat.filtro_aceite_fuga_hid", qty: 1 },
          { matId: "mat.aceite_engranajes_std", note: "Según especificación manual" },
          { matId: "mat.aceite_engranajes_esp", note: "Según especificación manual" }
        ],
        torques: [{ where: "Tapa filtro aspiración/retorno hidráulico", nm: 40, note: "Tornillos en cruz" }]
      },
      h500: {
        ops: [
          "op.vogele_s1900_5x.h500.motor_aceite_y_filtro_filtros_combustible_filtro_aire_abrazaderas",
          "op.vogele_s1900_5x.h500.hidraulico_filtro_bypass_sustituir",
          "op.vogele_s1900_5x.h500.traslacion_oruga_comprobar_tensar",
          "op.vogele_s1900_5x.h500.transporte_cadenas_aceites_engranajes_lub_guias",
          "op.vogele_s1900_5x.h500.tablon_cilindro_nivelacion_lub_tension_cadenas"
        ],
        materials: [
          { matId: "mat.aceite_motor_10w30_low_saps", qty: 27.5, unit: "L", note: "Cantidad de llenado (según manual)" },
          { matId: "mat.filtro_aceite_motor", qty: 1 },
          { matId: "mat.filtro_combustible", qty: 1, note: "Cantidad exacta según catálogo de repuestos" },
          { matId: "mat.filtro_aire_principal", qty: 1, note: "Limpiar/sustituir según proceda" },
          { matId: "mat.filtro_hid_bypass", qty: 1 }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.vogele_s1900_5x.h1000.hidraulico_cambiar_aceite_limpiar_tamiz_sustituir_filtros_desairear",
          "op.vogele_s1900_5x.h1000.traslacion_cambiar_aceite_engranaje",
          "op.vogele_s1900_5x.h1000.transporte_cambiar_aceites_cinta_rascadora_sinfines",
          "op.vogele_s1900_5x.h1000.instalacion_limpieza_limpiar_tamiz_deposito_agente_separador",
          "op.vogele_s1900_5x.h1000.motor_operaciones_adicionales_aplican"
        ],
        materials: [
          { matId: "mat.hidraulico_iso_vg46_hvlp", note: "Tipo según manual" },
          { matId: "mat.filtro_asp_retorno_hid_elemento", qty: 1 },
          { matId: "mat.filtro_aceite_fuga_hid", qty: 1 },
          { matId: "mat.aceite_engranajes_std", note: "Según especificación manual" },
          { matId: "mat.aceite_engranajes_esp", note: "Según especificación manual" },
          { matId: "mat.grasa_s21" }
        ],
        torques: [{ where: "Tapa filtro aspiración/retorno hidráulico", nm: 40 }]
      },
      h1500: { ops: ["op.vogele_s1900_5x.h1500.amortiguador_vibraciones_ciguenal_comprobar", "op.vogele_s1900_5x.h1500.filtro_ventilacion_carcasa_ciguenal_sustituir"], materials: [], torques: [] },
      y1: { ops: ["op.vogele_s1900_5x.y1.refrigerador_aire_carga_limpiar"], materials: [], torques: [] },
      h3000: { ops: ["op.vogele_s1900_5x.h3000.juego_valvulas_comprobar_ajustar_sat", "op.vogele_s1900_5x.h3000.filtro_conducto_def_sustituir"], materials: [], torques: [] },
      h4500: { ops: ["op.vogele_s1900_5x.h4500.amortiguador_vibraciones_elastomero_sustituir", "op.vogele_s1900_5x.h4500.filtro_unidad_dosificacion_def_sustituir"], materials: [], torques: [] },
      h6000: { ops: ["op.vogele_s1900_5x.h6000.sistema_refrigeracion_lavar", "op.vogele_s1900_5x.h6000.termostatos_comprobar"], materials: [], torques: [] },
      y6: { ops: ["op.vogele_s1900_5x.y6.refrigerante_cambiar_6_anos"], materials: [], torques: [] }
    }
  };

  // =========================
  // Datos (56012 - VOGELE MT 300-3i)
  // =========================

  // --- Operaciones A (Diario - antes de comenzar el trabajo)
  addOp("op.vogele_mt300_3i.daily.dispositivos_seguridad_comprobar_limpiar", "Dispositivos de seguridad: comprobar / limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.agua_limpieza_comprobar_rellenar", "Agua de limpieza: comprobar / rellenar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.motor_estanqueidad_visual", "Motor: comprobación visual de estanqueidad", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.aceite_motor_comprobar_rellenar", "Nivel de aceite del motor: comprobar / rellenar", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.deposito_carburante_comprobar", "Depósito de carburante: comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.filtro_previo_carburante_comprobar_limpiar", "Filtro previo de carburante: comprobar / limpiar", { action: "comprobar", groupKey: "motor.filtro_previo_carburante", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.deposito_def_comprobar", "Depósito de DEF (AdBlue): comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.refrigerante_motor_comprobar_rellenar", "Refrigerante motor hasta -28 °C: comprobar / rellenar", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.aceite_hidraulico_comprobar", "Aceite hidráulico: comprobar", { action: "comprobar", groupKey: "hidraulico.aceite_hidraulico", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.sistema_refrigeracion_hidraulico_comprobar", "Sistema de refrigeración (sistema hidráulico): comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.cajas_enchufe_comprobar", "Cajas de enchufe: comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.controlador_aislamiento_comprobar", "Controlador de aislamiento: comprobar (prueba de funcionamiento)", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.cadenas_acc_sinfines_lubricar", "Cadenas de accionamiento de sinfines de transporte: lubricar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.tambor_inversion_lubricar", "Tambor de inversión: lubricar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.soporte_consola_cinta_oscilante_lubricar", "Soporte de consola de cinta transportadora oscilante: lubricar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.daily.deposito_agente_separador_comprobar", "Depósito de agente separador: comprobar", { fuente: "manual_mt300_3i" });

  // --- Operaciones B (Cada 8 horas - se añaden a A)
  addOp("op.vogele_mt300_3i.h8.pasarelas_dispositivos_ascenso_comprobar_limpiar", "Pasarelas y dispositivos de ascenso: comprobar / limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.puesto_mando_asiento_comprobar_limpiar", "Puesto de mando / asiento del conductor: comprobar / limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.valvula_descarga_polvo_limpiar", "Válvula de descarga de polvo: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.rodillos_empuje_limpiar", "Rodillos de empuje: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.tolva_mezcla_limpiar", "Tolva de la mezcla: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.zona_compuerta_entrada_limpiar", "Zona debajo de la compuerta de entrada: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.sinfines_transporte_limpiar", "Sinfines de transporte: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.cintas_transportadoras_limpiar", "Cintas transportadoras: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.soportes_cinta_primaria_chasis_limpiar", "Soportes de la cinta primaria en el chasis: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.tambor_inversion_limpiar", "Tambor de inversión: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.estaciones_festones_rodillos_guias_limpiar", "Estaciones de festones / rodillo de control / rodillos guía laterales: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.rascador_banda_limpiar", "Rascador de banda: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.soportes_cinta_limpiar", "Soportes de cinta: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.sensor_marcha_cinta_limpiar", "Sensor de marcha de cinta: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.tolva_descarga_transferencia_cinta_oscilante_limpiar", "Tolva de descarga / transferencia / cinta transportadora oscilante: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h8.cadenas_acc_sinfines_lubricar_si_procede", "Cadenas de accionamiento de sinfines de transporte: lubricar (si procede en este intervalo)", { fuente: "manual_mt300_3i" });

  // --- Operaciones 50 h (puesta en servicio - único)
  addOp("op.vogele_mt300_3i.h50_post.cinta_fuerza_alternador_comprobar_tensar", "Cinta de fuerza del accionamiento del alternador: comprobar / tensar (ajuste: 15 mm con 50 ± 5 N)", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h50_post.filtro_aceite_fuga_hid_sustituir", "Filtro de aceite de fuga (hidráulico): sustituir", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h50_post.filtro_asp_retorno_hid_sustituir_desairear", "Filtro de aspiración de retorno (hidráulico): sustituir / desairear", { action: "sustituir", groupKey: "hidraulico.filtro_asp_retorno", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h50_post.filtro_aceite_hid_desairear", "Filtro de aceite hidráulico: desairear", { action: "comprobar", groupKey: "hidraulico.filtro_aceite_hid", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h50_post.aceite_distribuidor_bomba_cambiar", "Aceite de engranaje del distribuidor de bomba: cambiar", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h50_post.orugas_traslacion_comprobar_tensar", "Orugas del mecanismo de traslación: comprobar / tensar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h50_post.aceite_traslacion_izq_dcha_cambiar", "Aceite de engranaje del mecanismo de traslación izq./dcha.: cambiar", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "manual_mt300_3i" });

  // --- Operaciones C (Cada 500 horas - se añaden a A+B)
  addOp("op.vogele_mt300_3i.h500.aceite_motor_cambiar", "Aceite del motor: cambiar", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.filtro_aceite_motor_sustituir", "Filtro de aceite del motor: sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.cinta_fuerza_alternador_comprobar_tensar", "Cinta de fuerza alternador: comprobar / tensar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.sistema_carburante_ventilar_si_necesario", "Sistema de carburante: ventilar / en caso necesario", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.filtro_aire_principal_limpiar", "Filtro de aire (principal): limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.filtro_aire_principal_sustituir_si_necesario", "Filtro de aire (principal): sustituir en caso necesario", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.aceite_distribucion_bombas_comprobar", "Aceite de engranaje de distribución de bombas: comprobar", { action: "comprobar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.filtro_bypass_sustituir", "Filtro de aceite en desvío (by-pass): sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.orugas_traslacion_comprobar_tensar", "Orugas del mecanismo de traslación: comprobar / tensar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.deflector_material_ajustar", "Deflector de material: ajustar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.aceite_traslacion_izq_dcha_comprobar", "Aceite engranaje traslación izq./dcha.: comprobar", { action: "comprobar", groupKey: "traslacion.aceite_engranaje", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.filo_rascador_cinta_resistencia_comprobar", "Filo de rascador de cinta y resistencia eléctrica: comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.chapas_ajuste_carril_plastico_sustituir", "Chapas de ajuste / carril de plástico: sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.holgura_rodamientos_sinfin_ajustar", "Holgura de rodamientos del sinfín de transporte: ajustar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.filtro_calefaccion_cinta_sustituir", "Filtro de calefacción de cinta transportadora: sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.calefaccion_cinta_limpiar_comprobar_ajustar", "Calefacción de cinta transportadora: limpiar / comprobar / ajustar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.lubricacion_central_lubricar", "Puntos de lubricación centrales: lubricar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h500.tension_todas_cadenas_comprobar", "Tensión de todas las cadenas: comprobar", { fuente: "manual_mt300_3i" });

  // --- Operaciones D (Cada 1000 horas - se añaden a A+B+C)
  addOp("op.vogele_mt300_3i.h1000.filtro_previo_carburante_desaguar_sustituir", "Filtro previo de carburante: desaguar / sustituir", { action: "sustituir", groupKey: "motor.filtro_previo_carburante", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.filtro_carburante_sustituir", "Filtro de carburante: sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.filtro_def_dosificacion_sustituir", "Filtro unidad dosificación DEF: sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.filtro_aire_secundario_sustituir_si_necesario", "Filtro de aire (secundario): sustituir en caso necesario", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.soporte_radiador_comprobar", "Soporte de radiador: comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.alojamiento_motor_comprobar", "Alojamiento del motor: comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.abrazaderas_mangueras_motor_comprobar", "Motor (abrazaderas / acoplamientos de mangueras): comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.refrigerante_motor_cambiar", "Refrigerante motor hasta -28 °C: cambiar (según intervalo específico del manual)", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.aceite_hidraulico_cambiar", "Aceite hidráulico: cambiar", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.tapa_llenado_hidraulico_sustituir", "Tapa de llenado depósito hidráulico: sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.tamiz_tubuladura_deposito_hidraulico_limpiar", "Tamiz de filtro / tubuladura de llenado / depósito hidráulico: limpiar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.filtro_aceite_fuga_hid_sustituir", "Filtro de aceite de fuga (hidráulico): sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.filtro_asp_retorno_hid_sustituir_desairear", "Filtro de aspiración de retorno (hidráulico): sustituir / desairear", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.filtro_aceite_hid_desairear", "Filtro de aceite hidráulico: desairear", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.aceite_distribucion_bombas_cambiar", "Aceite de engranaje de distribución de bombas: cambiar (también anual / cada 2500 h)", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.conexiones_cables_comprobar", "Conexiones de cables: comprobar", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.aceite_traslacion_izq_dcha_cambiar", "Aceite engranaje traslación izq./dcha.: cambiar", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.rotor_ventilador_calefaccion_cinta_sustituir", "Rotor de ventilador (calefacción cinta transportadora): sustituir", { fuente: "manual_mt300_3i" });
  addOp("op.vogele_mt300_3i.h1000.goma_obturacion_comprobar_ajustar_sustituir", "Goma de obturación: comprobar / ajustar / sustituir", { fuente: "manual_mt300_3i" });

  // Materiales (56012 - MT 300-3i)
  addMat("mat.agua_limpiaparabrisas", "Agua para limpiaparabrisas", { fuente: "manual_mt300_3i" });
  addMat("mat.diesel", "Diésel", { fuente: "manual_mt300_3i" });
  addMat("mat.def_adblue_cap", "DEF / AdBlue", { fuente: "manual_mt300_3i" });
  addMat("mat.refrigerante_menos28", "Refrigerante motor hasta -28 °C", { fuente: "manual_mt300_3i" });
  addMat("mat.agente_separador", "Agente separador", { fuente: "manual_mt300_3i" });
  addMat("mat.grasa_s21_mt", "Grasa lubricante especial S2 (S21)", { fuente: "manual_mt300_3i" });
  addMat("mat.aceite_motor_engine_oil", "Aceite motor (Engine Oil)", { fuente: "manual_mt300_3i" });
  addMat("mat.aceite_hidraulico_iso_vg46_hvlp", "Aceite hidráulico HVLP ISO VG 46", { fuente: "manual_mt300_3i" });
  addMat("mat.aceite_engranaje_especial_distrib_bomba", "Aceite de engranaje especial (distribuidor de bomba)", { fuente: "manual_mt300_3i" });
  addMat("mat.aceite_engranaje_especial_traslacion", "Aceite de engranaje especial (traslación izq./dcha.)", { fuente: "manual_mt300_3i" });
  addMat("mat.filtro_aceite_fuga_hid_mt", "Filtro aceite de fuga hidráulico", { unit: "ud", fuente: "manual_mt300_3i" });
  addMat("mat.filtro_asp_retorno_hid_mt", "Filtro aspiración/retorno hidráulico", { unit: "ud", fuente: "manual_mt300_3i" });
  addMat("mat.filtro_aceite_hid_mt", "Filtro de aceite hidráulico", { unit: "ud", fuente: "manual_mt300_3i" });
  addMat("mat.filtro_aceite_motor_mt", "Filtro aceite motor", { unit: "ud", fuente: "manual_mt300_3i" });
  addMat("mat.filtro_bypass_hid_mt", "Filtro aceite hidráulico en desvío (by-pass)", { unit: "ud", fuente: "manual_mt300_3i" });
  addMat("mat.filtro_previo_carburante_mt", "Filtro previo carburante", { unit: "ud", fuente: "manual_mt300_3i" });
  addMat("mat.filtro_carburante_mt", "Filtro carburante", { unit: "ud", fuente: "manual_mt300_3i" });
  addMat("mat.filtro_def_dosificacion_mt", "Filtro unidad dosificación DEF", { unit: "ud", fuente: "manual_mt300_3i" });
  addMat("mat.tapa_llenado_hid_mt", "Tapa de llenado depósito hidráulico", { unit: "ud", fuente: "manual_mt300_3i" });

  DB.templatesByModel[MODEL_VOGELE_MT300_3I] = {
    modelId: MODEL_VOGELE_MT300_3I,
    intervals: {
      daily: {
        ops: [
          "op.vogele_mt300_3i.daily.dispositivos_seguridad_comprobar_limpiar",
          "op.vogele_mt300_3i.daily.agua_limpieza_comprobar_rellenar",
          "op.vogele_mt300_3i.daily.motor_estanqueidad_visual",
          "op.vogele_mt300_3i.daily.aceite_motor_comprobar_rellenar",
          "op.vogele_mt300_3i.daily.deposito_carburante_comprobar",
          "op.vogele_mt300_3i.daily.filtro_previo_carburante_comprobar_limpiar",
          "op.vogele_mt300_3i.daily.deposito_def_comprobar",
          "op.vogele_mt300_3i.daily.refrigerante_motor_comprobar_rellenar",
          "op.vogele_mt300_3i.daily.aceite_hidraulico_comprobar",
          "op.vogele_mt300_3i.daily.sistema_refrigeracion_hidraulico_comprobar",
          "op.vogele_mt300_3i.daily.cajas_enchufe_comprobar",
          "op.vogele_mt300_3i.daily.controlador_aislamiento_comprobar",
          "op.vogele_mt300_3i.daily.cadenas_acc_sinfines_lubricar",
          "op.vogele_mt300_3i.daily.tambor_inversion_lubricar",
          "op.vogele_mt300_3i.daily.soporte_consola_cinta_oscilante_lubricar",
          "op.vogele_mt300_3i.daily.deposito_agente_separador_comprobar"
        ],
        materials: [
          { matId: "mat.agua_limpiaparabrisas", cantidad: "1.9 L" },
          { matId: "mat.diesel", cantidad: "450 L (capacidad depósito)" },
          { matId: "mat.def_adblue_cap", cantidad: "18.2 L (capacidad depósito)" },
          { matId: "mat.refrigerante_menos28", cantidad: "UE 3A/Tier 3: Agua 16 L + Anticongelante 10.5 L; UE 5/Tier 4f: Agua 16 L + Anticongelante 13 L" },
          { matId: "mat.agente_separador", cantidad: "57 L (capacidad depósito)" },
          { matId: "mat.grasa_s21_mt", note: "Para puntos indicados" },
          { matId: "mat.aceite_motor_engine_oil", note: "Rellenar si procede (según tabla lubricantes)" },
          { matId: "mat.aceite_hidraulico_iso_vg46_hvlp", note: "Solo control de nivel (o biológico equivalente si aplica)" }
        ],
        torques: []
      },
      h8: {
        ops: [
          "op.vogele_mt300_3i.h8.pasarelas_dispositivos_ascenso_comprobar_limpiar",
          "op.vogele_mt300_3i.h8.puesto_mando_asiento_comprobar_limpiar",
          "op.vogele_mt300_3i.h8.valvula_descarga_polvo_limpiar",
          "op.vogele_mt300_3i.h8.rodillos_empuje_limpiar",
          "op.vogele_mt300_3i.h8.tolva_mezcla_limpiar",
          "op.vogele_mt300_3i.h8.zona_compuerta_entrada_limpiar",
          "op.vogele_mt300_3i.h8.sinfines_transporte_limpiar",
          "op.vogele_mt300_3i.h8.cintas_transportadoras_limpiar",
          "op.vogele_mt300_3i.h8.soportes_cinta_primaria_chasis_limpiar",
          "op.vogele_mt300_3i.h8.tambor_inversion_limpiar",
          "op.vogele_mt300_3i.h8.estaciones_festones_rodillos_guias_limpiar",
          "op.vogele_mt300_3i.h8.rascador_banda_limpiar",
          "op.vogele_mt300_3i.h8.soportes_cinta_limpiar",
          "op.vogele_mt300_3i.h8.sensor_marcha_cinta_limpiar",
          "op.vogele_mt300_3i.h8.tolva_descarga_transferencia_cinta_oscilante_limpiar"
        ],
        materials: [
          { matId: "mat.agente_separador", note: "Para limpieza (según necesidad)" },
          { matId: "mat.grasa_s21_mt", note: "Si se lubrica en este intervalo" }
        ],
        torques: []
      },
      h50_post: {
        ops: [
          "op.vogele_mt300_3i.h50_post.cinta_fuerza_alternador_comprobar_tensar",
          "op.vogele_mt300_3i.h50_post.filtro_aceite_fuga_hid_sustituir",
          "op.vogele_mt300_3i.h50_post.filtro_asp_retorno_hid_sustituir_desairear",
          "op.vogele_mt300_3i.h50_post.filtro_aceite_hid_desairear",
          "op.vogele_mt300_3i.h50_post.aceite_distribuidor_bomba_cambiar",
          "op.vogele_mt300_3i.h50_post.orugas_traslacion_comprobar_tensar",
          "op.vogele_mt300_3i.h50_post.aceite_traslacion_izq_dcha_cambiar"
        ],
        materials: [
          { matId: "mat.aceite_engranaje_especial_distrib_bomba", cantidad: "4.2 L" },
          { matId: "mat.aceite_engranaje_especial_traslacion", cantidad: "3.5 L" },
          { matId: "mat.grasa_s21_mt", note: "Orugas / puntos indicados" },
          { matId: "mat.filtro_aceite_fuga_hid_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.filtro_asp_retorno_hid_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.vogele_mt300_3i.h500.aceite_motor_cambiar",
          "op.vogele_mt300_3i.h500.filtro_aceite_motor_sustituir",
          "op.vogele_mt300_3i.h500.cinta_fuerza_alternador_comprobar_tensar",
          "op.vogele_mt300_3i.h500.sistema_carburante_ventilar_si_necesario",
          "op.vogele_mt300_3i.h500.filtro_aire_principal_limpiar",
          "op.vogele_mt300_3i.h500.filtro_aire_principal_sustituir_si_necesario",
          "op.vogele_mt300_3i.h500.aceite_distribucion_bombas_comprobar",
          "op.vogele_mt300_3i.h500.filtro_bypass_sustituir",
          "op.vogele_mt300_3i.h500.orugas_traslacion_comprobar_tensar",
          "op.vogele_mt300_3i.h500.deflector_material_ajustar",
          "op.vogele_mt300_3i.h500.aceite_traslacion_izq_dcha_comprobar",
          "op.vogele_mt300_3i.h500.filo_rascador_cinta_resistencia_comprobar",
          "op.vogele_mt300_3i.h500.chapas_ajuste_carril_plastico_sustituir",
          "op.vogele_mt300_3i.h500.holgura_rodamientos_sinfin_ajustar",
          "op.vogele_mt300_3i.h500.filtro_calefaccion_cinta_sustituir",
          "op.vogele_mt300_3i.h500.calefaccion_cinta_limpiar_comprobar_ajustar",
          "op.vogele_mt300_3i.h500.lubricacion_central_lubricar",
          "op.vogele_mt300_3i.h500.tension_todas_cadenas_comprobar"
        ],
        materials: [
          { matId: "mat.aceite_motor_engine_oil", cantidad: "≈ 18 L (cambio; tipo según tabla lubricantes)" },
          { matId: "mat.filtro_aceite_motor_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.filtro_bypass_hid_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.grasa_s21_mt", note: "Lubricación central/puntos" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.vogele_mt300_3i.h1000.filtro_previo_carburante_desaguar_sustituir",
          "op.vogele_mt300_3i.h1000.filtro_carburante_sustituir",
          "op.vogele_mt300_3i.h1000.filtro_def_dosificacion_sustituir",
          "op.vogele_mt300_3i.h1000.filtro_aire_secundario_sustituir_si_necesario",
          "op.vogele_mt300_3i.h1000.soporte_radiador_comprobar",
          "op.vogele_mt300_3i.h1000.alojamiento_motor_comprobar",
          "op.vogele_mt300_3i.h1000.abrazaderas_mangueras_motor_comprobar",
          "op.vogele_mt300_3i.h1000.refrigerante_motor_cambiar",
          "op.vogele_mt300_3i.h1000.aceite_hidraulico_cambiar",
          "op.vogele_mt300_3i.h1000.tapa_llenado_hidraulico_sustituir",
          "op.vogele_mt300_3i.h1000.tamiz_tubuladura_deposito_hidraulico_limpiar",
          "op.vogele_mt300_3i.h1000.filtro_aceite_fuga_hid_sustituir",
          "op.vogele_mt300_3i.h1000.filtro_asp_retorno_hid_sustituir_desairear",
          "op.vogele_mt300_3i.h1000.filtro_aceite_hid_desairear",
          "op.vogele_mt300_3i.h1000.aceite_distribucion_bombas_cambiar",
          "op.vogele_mt300_3i.h1000.conexiones_cables_comprobar",
          "op.vogele_mt300_3i.h1000.aceite_traslacion_izq_dcha_cambiar",
          "op.vogele_mt300_3i.h1000.rotor_ventilador_calefaccion_cinta_sustituir",
          "op.vogele_mt300_3i.h1000.goma_obturacion_comprobar_ajustar_sustituir"
        ],
        materials: [
          { matId: "mat.aceite_hidraulico_iso_vg46_hvlp", cantidad: "230 L (cambio; o biológico equivalente si aplica)" },
          { matId: "mat.aceite_engranaje_especial_distrib_bomba", cantidad: "4.2 L" },
          { matId: "mat.aceite_engranaje_especial_traslacion", cantidad: "3.5 L" },
          { matId: "mat.filtro_previo_carburante_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.filtro_carburante_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.filtro_def_dosificacion_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.filtro_aceite_fuga_hid_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.filtro_asp_retorno_hid_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.filtro_bypass_hid_mt", qty: 1, unit: "ud", note: "Si aplica / según plan" },
          { matId: "mat.tapa_llenado_hid_mt", qty: 1, unit: "ud", note: "Referencia por catálogo" },
          { matId: "mat.grasa_s21_mt", note: "Si hay engrases en el servicio" }
        ],
        torques: []
      }
    }
  };

  // =========================
  // Datos (56010 - VOGELE S2100-5I)
  // =========================

  // Operaciones A (DIARIO)
  addOp("op.vogele_s2100_5i.daily.seguridad_elementos_comprobar_limpiar", "Seguridad/puesto: comprobar/limpiar elementos de seguridad y puesto", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.agua_limpieza_comprobar_rellenar", "Agua de limpieza: comprobar / rellenar (si aplica)", { fuente: "manual_s2100_5i" });

  addOp("op.vogele_s2100_5i.daily.motor_ruidos_estanqueidad_comprobar", "Motor: comprobar ruidos anómalos y estanqueidad", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.motor_correa_alternador_comprobar", "Motor: comprobar correa (alternador)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.motor_escape_comprobar", "Motor: comprobar sistema de escape", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.motor_combustible_comprobar", "Motor: comprobar combustible (nivel/estanqueidad)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.motor_aspiracion_aire_comprobar", "Motor: comprobar aspiración de aire", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.motor_refrigeracion_refrigerante_comprobar", "Motor: comprobar sistema de refrigeración y nivel de refrigerante", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.motor_def_adblue_comprobar", "Motor: comprobar DEF/AdBlue (si aplica)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.motor_aceite_comprobar_rellenar", "Nivel de aceite del motor: comprobar / rellenar", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "manual_s2100_5i" });

  addOp("op.vogele_s2100_5i.daily.hidraulico_nivel_aceite_comprobar", "Sistema hidráulico: comprobar nivel de aceite hidráulico", { action: "comprobar", groupKey: "hidraulico.aceite_hidraulico", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.hidraulico_aceite_distribuidor_bomba_comprobar_rellenar", "Sistema hidráulico: comprobar/rellenar aceite del engranaje del distribuidor de bomba (si aplica)", { action: "comprobar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "manual_s2100_5i" });

  addOp("op.vogele_s2100_5i.daily.electrico_cajas_enchufe_comprobar", "Sistema eléctrico: comprobar cajas de enchufe", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.electrico_controlador_aislamiento_comprobar", "Sistema eléctrico: comprobar controlador de aislamiento (si equipa)", { fuente: "manual_s2100_5i" });

  addOp("op.vogele_s2100_5i.daily.transporte_limpiar_tolva_rodillos_cintas_sinfines", "Transporte material: limpiar tolva, rodillos, cintas y sinfines", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.transporte_engrase_sinfines_comprobar", "Transporte material: comprobar engrase de sinfines", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.transporte_power_tunnel_limpiar_lubricar", "Transporte material: limpiar/lubricar Power Tunnel (si equipa)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.transporte_cadenas_cinta_rascadora_engrasar", "Transporte material: engrasar cadenas de la cinta rascadora", { fuente: "manual_s2100_5i" });

  addOp("op.vogele_s2100_5i.daily.limpieza_agente_separador_comprobar_rellenar", "Instalación limpieza/tablón/lubricación central: comprobar/rellenar agente separador", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.limpieza_bloqueo_tablon_comprobar_limpiar", "Instalación limpieza/tablón/lubricación central: comprobar/limpiar bloqueo del tablón", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.daily.lubricacion_central_comprobar_rellenar", "Instalación limpieza/tablón/lubricación central: comprobar/rellenar lubricación central", { fuente: "manual_s2100_5i" });

  // Operaciones B (Cada 8 horas) – añade a DIARIO
  addOp("op.vogele_s2100_5i.h8.espejo_limpiar_sustituir", "Espejo: limpiar / sustituir si es preciso", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h8.dispositivos_ascenso_limpiar", "Dispositivos de ascenso: limpiar", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h8.aceite_motor_comprobar_rellenar", "Aceite del motor: comprobar / rellenar", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h8.valvula_descarga_polvo_limpiar", "Válvula de descarga de polvo: limpiar", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h8.sistema_nivelacion_limpiar", "Sistema de nivelación: limpiar", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h8.bloqueo_tablon_comprobar_limpiar", "Bloqueo del tablón: comprobar / limpiar", { fuente: "manual_s2100_5i" });

  // 50 h (puesta en servicio) – único
  addOp("op.vogele_s2100_5i.h50_post.cinta_fuerza_motor_comprobar", "Cinta de fuerza (motor): comprobar", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.filtro_aceite_fuga_hid_sustituir", "Filtro de aceite de fuga (hidráulico): sustituir", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.filtro_asp_retorno_hid_sustituir", "Filtro de aspiración/retorno (hidráulico): sustituir", { action: "sustituir", groupKey: "hidraulico.filtro_asp_retorno", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.aceite_distribuidor_bomba_cambiar", "Aceite de engranaje del distribuidor de bomba: cambiar", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.orugas_traslacion_comprobar_tensar", "Orugas del mecanismo de traslación: comprobar / tensar", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.aceite_traslacion_izq_dcha_cambiar", "Aceite engranaje traslación izq./dcha.: cambiar", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.cadena_cinta_rascadora_comprobar_tensar_aceitar", "Cadena de cinta rascadora: comprobar / tensar / aceitar", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar_engrasar", "Cadenas accionamiento cinta rascadora: comprobar / tensar / engrasar", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.cadenas_acc_sinfin_distrib_comprobar_tensar", "Cadenas accionamiento sinfín distribución: comprobar / tensar", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h50_post.tension_todas_cadenas_comprobar", "Tensión de todas las cadenas: comprobar", { fuente: "manual_s2100_5i" });

  // 500 h (incluye todo lo anterior)
  addOp("op.vogele_s2100_5i.h500.motor_aceite_y_filtro_cambiar", "Motor: cambiar aceite motor y filtro de aceite", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.motor_filtros_combustible_sustituir_desairear", "Motor: sustituir filtros de combustible y desairear", { action: "sustituir", groupKey: "motor.filtros_combustible", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.motor_filtro_aire_principal_limpiar", "Motor: limpiar filtro de aire principal", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.motor_abrazaderas_uniones_revisar", "Motor: revisar abrazaderas/uniones (según plan)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.hidraulico_filtro_bypass_sustituir", "Hidráulico: sustituir filtro de aceite en desvío (by-pass)", { action: "sustituir", groupKey: "hidraulico.filtro_bypass", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.traslacion_orugas_comprobar_tensar", "Traslación: comprobar/tensar orugas", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.transporte_cadenas_comprobar_tensar_engrasar", "Transporte material: comprobar/tensar/engrasar cadenas (según puntos del plan)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.transporte_aceites_engranajes_comprobar_rellenar", "Transporte material: comprobar/rellenar aceites de engranajes (según proceda)", { action: "comprobar", groupKey: "transporte.aceites_engranajes", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.transporte_guias_deslizaderas_lubricar", "Transporte material: lubricar guías/deslizaderas (según plan)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.tablon_cilindro_nivelacion_lubricar", "Conexión tablones: lubricar cilindro de nivelación", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h500.tablon_tension_cadenas_comprobar", "Conexión tablones: comprobar tensión de cadenas (según plan)", { fuente: "manual_s2100_5i" });

  // 1000 h (incluye todo lo anterior)
  addOp("op.vogele_s2100_5i.h1000.hidraulico_aceite_cambiar", "Sistema hidráulico: cambiar aceite hidráulico", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h1000.hidraulico_tamiz_tubuladura_deposito_limpiar", "Sistema hidráulico: limpiar tamiz/tubuladura/depósito (según plan)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h1000.hidraulico_filtros_fuga_y_asp_retorno_sustituir", "Sistema hidráulico: sustituir filtro de fuga + filtro aspiración/retorno", { action: "sustituir", groupKey: "hidraulico.filtros_principales", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h1000.hidraulico_desairear", "Sistema hidráulico: desairear", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h1000.hidraulico_aceite_distribucion_bombas_cambiar", "Sistema hidráulico: cambiar aceite engranaje distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "manual_s2100_5i" });

  addOp("op.vogele_s2100_5i.h1000.traslacion_aceite_engranaje_cambiar", "Traslación: cambiar aceite engranaje traslación izq./dcha.", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h1000.transporte_aceites_engranajes_cambiar", "Transporte material: cambiar aceites de engranajes de cinta rascadora y sinfines (según proceda)", { action: "cambiar", groupKey: "transporte.aceites_engranajes", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h1000.limpieza_agente_separador_deposito_limpiar", "Instalación de limpieza: limpiar tamiz/tubuladura/depósito de agente separador", { action: "limpiar", groupKey: "instalacion_limpieza.agente_separador_deposito", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h1000.motor_aplicar_operaciones_relevantes", "Motor: aplicar también las tareas del bloque motor que correspondan (según plan)", { fuente: "manual_s2100_5i" });

  // Extra intervalos
  addOp("op.vogele_s2100_5i.h1500.amortiguador_vibraciones_ciguenal_comprobar", "Amortiguador vibraciones cigüeñal: comprobar (1500 h)", { action: "comprobar", groupKey: "motor.amortiguador_vibraciones_ciguenal", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h1500.filtro_ventilacion_carcasa_ciguenal_sustituir", "Filtro ventilación carcasa cigüeñal: sustituir (1500 h)", { action: "sustituir", groupKey: "motor.filtro_ventilacion_carcasa_ciguenal", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h3000.juego_valvulas_comprobar_ajustar_sat", "Juego de válvulas: comprobar/ajustar (3000 h, servicio técnico)", { fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h3000.filtro_conducto_def_sustituir", "Filtro del conducto de DEF: sustituir (3000 h)", { action: "sustituir", groupKey: "motor.filtro_conducto_def", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h4500.amortiguador_elastomero_ciguenal_sustituir", "Amortiguador vibraciones elastómero cigüeñal: sustituir (4500 h)", { action: "sustituir", groupKey: "motor.amortiguador_vibraciones_elastomero", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h4500.filtro_unidad_dosificacion_def_sustituir", "Filtro unidad dosificación DEF: sustituir (4500 h)", { action: "sustituir", groupKey: "motor.filtro_unidad_dosificacion_def", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h6000.sistema_refrigeracion_lavar", "Sistema de refrigeración: lavar (6000 h)", { action: "limpiar", groupKey: "motor.sistema_refrigeracion", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.h6000.termostatos_comprobar", "Termostatos: comprobar (6000 h)", { action: "comprobar", groupKey: "motor.termostatos", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.y1.refrigerador_aire_carga_limpiar", "Refrigerador de aire de carga: limpiar (1 vez al año)", { action: "limpiar", groupKey: "motor.refrigerador_aire_carga", fuente: "manual_s2100_5i" });
  addOp("op.vogele_s2100_5i.y6.refrigerante_cambiar_6_anos", "Refrigerante (hasta -25 ºC): cambiar cada 6 años", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "manual_s2100_5i" });

  // Materiales adicionales para S2100-5I (reutilizamos varios ya existentes)
  addMat("mat.panyo_celulosa", "Paño de celulosa", { unit: "ud", fuente: "manual_s2100_5i" });
  addMat("mat.filtro_ventilacion_carcasa_ciguenal", "Filtro ventilación carcasa cigüeñal", { unit: "ud", fuente: "manual_s2100_5i" });
  addMat("mat.filtro_conducto_def", "Filtro conducto DEF", { unit: "ud", fuente: "manual_s2100_5i" });
  addMat("mat.amortiguador_elastomero_ciguenal", "Amortiguador vibraciones elastómero cigüeñal", { unit: "ud", fuente: "manual_s2100_5i" });
  addMat("mat.filtro_unidad_dosificacion_def", "Filtro unidad dosificación DEF", { unit: "ud", fuente: "manual_s2100_5i" });

  DB.templatesByModel[MODEL_VOGELE_S2100_5I] = {
    modelId: MODEL_VOGELE_S2100_5I,
    intervals: {
      daily: {
        ops: [
          "op.vogele_s2100_5i.daily.seguridad_elementos_comprobar_limpiar",
          "op.vogele_s2100_5i.daily.agua_limpieza_comprobar_rellenar",
          "op.vogele_s2100_5i.daily.motor_ruidos_estanqueidad_comprobar",
          "op.vogele_s2100_5i.daily.motor_correa_alternador_comprobar",
          "op.vogele_s2100_5i.daily.motor_escape_comprobar",
          "op.vogele_s2100_5i.daily.motor_combustible_comprobar",
          "op.vogele_s2100_5i.daily.motor_aspiracion_aire_comprobar",
          "op.vogele_s2100_5i.daily.motor_refrigeracion_refrigerante_comprobar",
          "op.vogele_s2100_5i.daily.motor_def_adblue_comprobar",
          "op.vogele_s2100_5i.daily.motor_aceite_comprobar_rellenar",
          "op.vogele_s2100_5i.daily.hidraulico_nivel_aceite_comprobar",
          "op.vogele_s2100_5i.daily.hidraulico_aceite_distribuidor_bomba_comprobar_rellenar",
          "op.vogele_s2100_5i.daily.electrico_cajas_enchufe_comprobar",
          "op.vogele_s2100_5i.daily.electrico_controlador_aislamiento_comprobar",
          "op.vogele_s2100_5i.daily.transporte_limpiar_tolva_rodillos_cintas_sinfines",
          "op.vogele_s2100_5i.daily.transporte_engrase_sinfines_comprobar",
          "op.vogele_s2100_5i.daily.transporte_power_tunnel_limpiar_lubricar",
          "op.vogele_s2100_5i.daily.transporte_cadenas_cinta_rascadora_engrasar",
          "op.vogele_s2100_5i.daily.limpieza_agente_separador_comprobar_rellenar",
          "op.vogele_s2100_5i.daily.limpieza_bloqueo_tablon_comprobar_limpiar",
          "op.vogele_s2100_5i.daily.lubricacion_central_comprobar_rellenar"
        ],
        materials: [
          { matId: "mat.separador_30l", qty: 30, unit: "L", note: "Capacidad/sistema indicado" },
          { matId: "mat.grasa_s21", note: "Puntos indicados y lubricación central" },
          { matId: "mat.aceite_motor_10w30_low_saps", note: "Rellenar si procede" },
          { matId: "mat.refrigerante_cool_gard_ii", note: "Rellenar si procede" },
          { matId: "mat.def_adblue", note: "Rellenar si procede (capacidad 21,6 L; si aplica)" }
        ],
        torques: []
      },
      h8: {
        ops: [
          "op.vogele_s2100_5i.h8.espejo_limpiar_sustituir",
          "op.vogele_s2100_5i.h8.dispositivos_ascenso_limpiar",
          "op.vogele_s2100_5i.h8.aceite_motor_comprobar_rellenar",
          "op.vogele_s2100_5i.h8.valvula_descarga_polvo_limpiar",
          "op.vogele_s2100_5i.h8.sistema_nivelacion_limpiar",
          "op.vogele_s2100_5i.h8.bloqueo_tablon_comprobar_limpiar"
        ],
        materials: [{ matId: "mat.aceite_motor_10w30_low_saps", note: "Rellenar si procede" }],
        torques: []
      },
      h50_post: {
        ops: [
          "op.vogele_s2100_5i.h50_post.cinta_fuerza_motor_comprobar",
          "op.vogele_s2100_5i.h50_post.filtro_aceite_fuga_hid_sustituir",
          "op.vogele_s2100_5i.h50_post.filtro_asp_retorno_hid_sustituir",
          "op.vogele_s2100_5i.h50_post.aceite_distribuidor_bomba_cambiar",
          "op.vogele_s2100_5i.h50_post.orugas_traslacion_comprobar_tensar",
          "op.vogele_s2100_5i.h50_post.aceite_traslacion_izq_dcha_cambiar",
          "op.vogele_s2100_5i.h50_post.cadena_cinta_rascadora_comprobar_tensar_aceitar",
          "op.vogele_s2100_5i.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar_engrasar",
          "op.vogele_s2100_5i.h50_post.cadenas_acc_sinfin_distrib_comprobar_tensar",
          "op.vogele_s2100_5i.h50_post.tension_todas_cadenas_comprobar"
        ],
        materials: [
          { matId: "mat.filtro_asp_retorno_hid_elemento", qty: 1, unit: "ud", note: "Aceitar juntas/superficies + añadir aceite en carcasa (según necesidad)" },
          { matId: "mat.filtro_aceite_fuga_hid", qty: 1, unit: "ud" },
          { matId: "mat.aceite_engranajes_std", note: "Según especificación manual" },
          { matId: "mat.aceite_engranajes_esp", note: "Según especificación manual" }
        ],
        torques: [{ where: "Tapa filtro aspiración/retorno hidráulico", nm: 40, note: "Tornillos en cruz" }]
      },
      h500: {
        ops: [
          "op.vogele_s2100_5i.h500.motor_aceite_y_filtro_cambiar",
          "op.vogele_s2100_5i.h500.motor_filtros_combustible_sustituir_desairear",
          "op.vogele_s2100_5i.h500.motor_filtro_aire_principal_limpiar",
          "op.vogele_s2100_5i.h500.motor_abrazaderas_uniones_revisar",
          "op.vogele_s2100_5i.h500.hidraulico_filtro_bypass_sustituir",
          "op.vogele_s2100_5i.h500.traslacion_orugas_comprobar_tensar",
          "op.vogele_s2100_5i.h500.transporte_cadenas_comprobar_tensar_engrasar",
          "op.vogele_s2100_5i.h500.transporte_aceites_engranajes_comprobar_rellenar",
          "op.vogele_s2100_5i.h500.transporte_guias_deslizaderas_lubricar",
          "op.vogele_s2100_5i.h500.tablon_cilindro_nivelacion_lubricar",
          "op.vogele_s2100_5i.h500.tablon_tension_cadenas_comprobar"
        ],
        materials: [
          { matId: "mat.aceite_motor_10w30_low_saps", qty: 27.5, unit: "L", note: "Cambio" },
          { matId: "mat.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.filtro_combustible", cantidad: "1 juego" },
          { matId: "mat.filtro_hid_bypass", qty: 1, unit: "ud" },
          { matId: "mat.hidraulico_iso_vg46_hvlp", note: "Para reposiciones si procede" },
          { matId: "mat.grasa_s21", note: "Puntos indicados" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.vogele_s2100_5i.h1000.hidraulico_aceite_cambiar",
          "op.vogele_s2100_5i.h1000.hidraulico_tamiz_tubuladura_deposito_limpiar",
          "op.vogele_s2100_5i.h1000.hidraulico_filtros_fuga_y_asp_retorno_sustituir",
          "op.vogele_s2100_5i.h1000.hidraulico_desairear",
          "op.vogele_s2100_5i.h1000.hidraulico_aceite_distribucion_bombas_cambiar",
          "op.vogele_s2100_5i.h1000.traslacion_aceite_engranaje_cambiar",
          "op.vogele_s2100_5i.h1000.transporte_aceites_engranajes_cambiar",
          "op.vogele_s2100_5i.h1000.limpieza_agente_separador_deposito_limpiar",
          "op.vogele_s2100_5i.h1000.motor_aplicar_operaciones_relevantes"
        ],
        materials: [
          { matId: "mat.filtro_asp_retorno_hid_elemento", qty: 1, unit: "ud" },
          { matId: "mat.filtro_aceite_fuga_hid", qty: 1, unit: "ud" },
          { matId: "mat.hidraulico_iso_vg46_hvlp", note: "Cantidad según capacidad del sistema (no indicada en el plan)" },
          { matId: "mat.panyo_celulosa", note: "Para recoger aceite durante desaireación" },
          { matId: "mat.aceite_engranajes_std", note: "Según especificación" },
          { matId: "mat.aceite_engranajes_esp", note: "Según especificación" },
          { matId: "mat.separador_30l", note: "Hasta 30 L tras intervención (según nivel)" }
        ],
        torques: [{ where: "Tapa filtro aspiración/retorno hidráulico", nm: 40 }]
      },
      h1500: {
        ops: [
          "op.vogele_s2100_5i.h1500.amortiguador_vibraciones_ciguenal_comprobar",
          "op.vogele_s2100_5i.h1500.filtro_ventilacion_carcasa_ciguenal_sustituir"
        ],
        materials: [{ matId: "mat.filtro_ventilacion_carcasa_ciguenal", qty: 1, unit: "ud" }],
        torques: []
      },
      h3000: {
        ops: ["op.vogele_s2100_5i.h3000.juego_valvulas_comprobar_ajustar_sat", "op.vogele_s2100_5i.h3000.filtro_conducto_def_sustituir"],
        materials: [{ matId: "mat.filtro_conducto_def", qty: 1, unit: "ud" }],
        torques: []
      },
      h4500: {
        ops: ["op.vogele_s2100_5i.h4500.amortiguador_elastomero_ciguenal_sustituir", "op.vogele_s2100_5i.h4500.filtro_unidad_dosificacion_def_sustituir"],
        materials: [
          { matId: "mat.amortiguador_elastomero_ciguenal", qty: 1, unit: "ud" },
          { matId: "mat.filtro_unidad_dosificacion_def", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h6000: {
        ops: ["op.vogele_s2100_5i.h6000.sistema_refrigeracion_lavar", "op.vogele_s2100_5i.h6000.termostatos_comprobar"],
        materials: [{ matId: "mat.refrigerante_cool_gard_ii", note: "Refrigerante/agua desmineralizada según procedimiento (cantidades no indicadas)" }],
        torques: []
      },
      y1: { ops: ["op.vogele_s2100_5i.y1.refrigerador_aire_carga_limpiar"], materials: [], torques: [] },
      y6: { ops: ["op.vogele_s2100_5i.y6.refrigerante_cambiar_6_anos"], materials: [{ matId: "mat.refrigerante_cool_gard_ii", note: "Cantidad según capacidad del sistema (no indicada)" }], torques: [] }
    }
  };

  // =========================
  // Datos (56009 - VOGELE S1300-3I)
  // =========================

  // Operaciones A (DIARIO)
  addOp("op.vogele_s1300_3i.daily.pupitre_mando_limpiar_si_necesario", "Pupitre de mando: limpiar si es necesario", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.techo_proteccion_comprobar", "Techo de protección: comprobar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.ventilacion_limpiar_si_necesario", "Sistema de ventilación: limpiar si es necesario", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  addOp("op.vogele_s1300_3i.daily.motor_ruidos_inusuales_comprobar", "Motor: comprobar ruidos inusuales", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.motor_estanqueidad_comprobar", "Motor: comprobar estanqueidad", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.motor_aceite_comprobar_rellenar", "Motor: comprobar nivel de aceite del motor y rellenar si procede", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.escape_estanqueidad_comprobar", "Motor: comprobar estanqueidad del sistema de gases de escape", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.aspiracion_aire_conducto_revisar_danos", "Motor: revisar conducto de aspiración de aire (daños)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  addOp("op.vogele_s1300_3i.daily.refrigeracion_comprobacion_visual", "Sistema de refrigeración: comprobación visual", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.refrigerante_comprobar_rellenar", "Sistema de refrigeración: comprobar/rellenar refrigerante", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  addOp("op.vogele_s1300_3i.daily.deposito_combustible_comprobar", "Combustible/AdBlue: comprobar depósito de combustible", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.filtro_previo_combustible_desaguar", "Combustible/AdBlue: desaguar filtro previo de combustible", { action: "limpiar", groupKey: "motor.filtro_previo_combustible", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.deposito_adblue_comprobar", "Combustible/AdBlue: comprobar depósito AdBlue®", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  addOp("op.vogele_s1300_3i.daily.sinfines_distribucion_lubricar", "Transporte/distribución: lubricar sinfines de distribución (puntos indicados)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.daily.hidraulico_aceite_comprobar_rellenar", "Hidráulico: comprobar aceite hidráulico (nivel/estado) y rellenar si procede", { action: "comprobar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  // Operaciones B (Cada 8 horas) – añade a DIARIO
  addOp("op.vogele_s1300_3i.h8.dispositivos_ascenso_limpiar", "Dispositivos de ascenso: limpiar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h8.paredes_tolva_limpiar", "Paredes de tolva: limpiar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h8.cintas_rascadoras_limpiar", "Cintas rascadoras: limpiar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h8.sinfines_distribucion_limpiar", "Sinfines de distribución: limpiar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h8.rodillos_empuje_limpiar", "Rodillos de empuje: limpiar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h8.refrigerante_proteccion_antiheladas_comprobar", "Protección antiheladas del refrigerante: comprobar", { action: "comprobar", groupKey: "motor.refrigerante_proteccion_antiheladas", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  // 50 h (puesta en servicio) – único
  addOp("op.vogele_s1300_3i.h50_post.tension_todas_cadenas_comprobar", "Tensión de todas las cadenas: comprobar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h50_post.hidraulico_filtro_asp_retorno_cambiar", "Hidráulico: cambiar filtro de aspiración/retorno", { action: "sustituir", groupKey: "hidraulico.filtro_asp_retorno", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h50_post.hidraulico_filtro_aceite_fuga_cambiar", "Hidráulico: cambiar filtro de aceite de fuga", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h50_post.traslacion_aceite_engranaje_cambiar", "Traslación: cambiar aceite de engranaje del mecanismo de traslación (izquierda y derecha)", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h50_post.cadena_cinta_rascadora_comprobar_tensar_lubricar", "Transporte/distribución: cadena de cinta rascadora: comprobar / tensar / lubricar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar_lubricar", "Transporte/distribución: cadenas de accionamiento de cinta rascadora: comprobar / tensar / lubricar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h50_post.cadenas_acc_sinfin_distrib_comprobar_tensar", "Transporte/distribución: cadenas de accionamiento del sinfín de distribución: comprobar / tensar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  // 500 h (incluye lo anterior; 50 h NO se acumula salvo que se seleccione "50 h")
  addOp("op.vogele_s1300_3i.h500.motor_aceite_cambiar", "Motor: cambiar aceite del motor (anual / cuando corresponda por plan)", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.motor_filtro_aceite_cambiar", "Motor: cambiar filtro de aceite del motor (en cada cambio de aceite)", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.correa_trapezoidal_nervada_comprobar", "Motor: correa trapezoidal nervada: comprobar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.filtro_previo_combustible_cartucho_cambiar", "Motor: filtro previo de combustible: cambiar cartucho (anual)", { action: "sustituir", groupKey: "motor.filtro_previo_combustible", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.filtro_aire_principal_cambiar", "Motor: filtro de aire (elemento principal): cambiar", { action: "sustituir", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.refrigerante_proteccion_antiheladas_comprobar", "Refrigeración: protección antiheladas: comprobar", { action: "comprobar", groupKey: "motor.refrigerante_proteccion_antiheladas", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.refrigerador_aire_carga_purgar_agua_condensados", "Refrigeración: refrigerador de aire de carga: purgar agua/condensados en superficie de entrada", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  addOp("op.vogele_s1300_3i.h500.hidraulico_aceite_cambiar", "Hidráulico: cambiar aceite hidráulico", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.hidraulico_filtro_asp_retorno_cambiar", "Hidráulico: cambiar filtro de aspiración/retorno", { action: "sustituir", groupKey: "hidraulico.filtro_asp_retorno", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.hidraulico_filtro_aceite_fuga_cambiar", "Hidráulico: cambiar filtro de aceite de fuga", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.hidraulico_filtro_bypass_cambiar", "Hidráulico: cambiar filtro de aceite en desvío (by-pass)", { action: "sustituir", groupKey: "hidraulico.filtro_bypass", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  addOp("op.vogele_s1300_3i.h500.electrico_correa_generador_comprobar_tensar", "Eléctrico: correa trapezoidal del generador: comprobar/tensar (según plan)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  addOp("op.vogele_s1300_3i.h500.aceite_distribucion_bombas_comprobar", "Traslación/transporte: aceite engranaje distribuidor de bomba: comprobar (en C; en D se cambia)", { action: "comprobar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.aceite_traslacion_izq_dcha_comprobar", "Traslación/transporte: aceite engranaje traslación izq./dcha.: comprobar (en C; en D se cambia)", { action: "comprobar", groupKey: "traslacion.aceite_engranaje", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  addOp("op.vogele_s1300_3i.h500.tension_todas_cadenas_comprobar", "General: tensión de todas las cadenas: comprobar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.cadena_cinta_rascadora_comprobar_tensar_lubricar", "Traslación/transporte: cadena cinta rascadora: comprobar / tensar / lubricar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.cadenas_acc_cinta_rascadora_comprobar_tensar", "Traslación/transporte: cadenas accionamiento cinta rascadora: comprobar / tensar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.cadenas_acc_sinfin_distrib_comprobar_tensar", "Traslación/transporte: cadenas accionamiento sinfín distribución: comprobar / tensar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h500.aberturas_cilindros_hidraulicos_lubricar", "Traslación/transporte: aberturas de cilindros hidráulicos: lubricar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  // 1000 h (incluye C + añade/sustituye)
  addOp("op.vogele_s1300_3i.h1000.hidraulico_tamiz_tubuladura_llenado_limpiar", "Hidráulico: limpiar tamiz tubuladura de llenado (tanque hidráulico)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.aceite_distribucion_bombas_cambiar", "Hidráulico: cambiar aceite de engranaje del distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.aceite_traslacion_izq_dcha_cambiar", "Traslación: cambiar aceite del engranaje de traslación izquierda/derecha", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.agente_separador_tamiz_tubuladura_llenado_limpiar", "Transporte/limpieza: limpiar tamiz tubuladura de llenado del depósito de agente separador", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.direccion_sistema_comprobar", "Dirección/eléctrico: sistema de dirección: comprobar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.conexiones_cables_bateria_comprobar", "Dirección/eléctrico: conexiones de cables/batería: comprobar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.alojamiento_motor_comprobar", "Motor/combustible/AdBlue: alojamiento del motor: comprobar", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.filtro_combustible_cambiar", "Motor/combustible/AdBlue: filtro de combustible: cambiar (anual)", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.sistema_combustible_desairear", "Motor/combustible/AdBlue: sistema de combustible: desairear", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addOp("op.vogele_s1300_3i.h1000.filtro_aspiracion_adblue_cambiar", "Motor/combustible/AdBlue: filtro de aspiración sistema AdBlue®: cambiar", { action: "sustituir", groupKey: "motor.filtro_aspiracion_adblue", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  // Extra: cambio correa generador cada 2000 h (según nota)
  addOp("op.vogele_s1300_3i.h2000.correa_generador_cambiar", "Correa trapezoidal del generador: cambiar (2000 h)", { action: "sustituir", groupKey: "electrico.correa_generador", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  // Extra: filtro bomba transporte AdBlue cada 2 años (según nota)
  addOp("op.vogele_s1300_3i.y2.filtro_bomba_transporte_adblue_sustituir", "Filtro bomba transporte AdBlue®: sustituir (cada 2 años)", { action: "sustituir", groupKey: "motor.filtro_bomba_transporte_adblue", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  // Materiales (S1300-3I)
  addMat("mat.vogele_s1300_3i.producto_limpieza_2050174", "Producto de limpieza (ref. 2050174)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.agente_separador", "Agente separador", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.aceite_motor", "Aceite de motor", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.refrigerante_mezcla", "Refrigerante (mezcla agua + anticongelante)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.diesel", "Diésel", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.adblue", "AdBlue®", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.grasa_especial", "Grasa lubricante especial", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.filtro_asp_retorno_hid", "Elemento filtrante filtro aspiración/retorno (hidráulico)", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.filtro_aceite_fuga_hid", "Elemento filtrante filtro aceite de fuga (hidráulico)", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.aceite_engranaje_std_traslacion", "Aceite engranaje estándar (traslación)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.aceite_hidraulico", "Aceite hidráulico (depósito)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.filtro_bypass_hid", "Filtro by-pass hidráulico", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.filtro_aceite_motor", "Filtro aceite motor", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.cartucho_filtro_previo_combustible", "Cartucho filtro previo combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.filtro_aire_principal", "Filtro de aire (elemento principal)", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.filtro_aspiracion_adblue", "Filtro aspiración AdBlue®", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.aceite_engranaje_especial_distrib_bomba", "Aceite engranaje especial (distribuidor de bomba)", { fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.correa_generador", "Correa trapezoidal del generador", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });
  addMat("mat.vogele_s1300_3i.filtro_bomba_transporte_adblue", "Filtro bomba transporte AdBlue®", { unit: "ud", fuente: "MANUAL DE SERVICIO VOGELE 1300-3" });

  DB.templatesByModel[MODEL_VOGELE_S1300_3I] = {
    modelId: MODEL_VOGELE_S1300_3I,
    intervals: {
      daily: {
        ops: [
          "op.vogele_s1300_3i.daily.pupitre_mando_limpiar_si_necesario",
          "op.vogele_s1300_3i.daily.techo_proteccion_comprobar",
          "op.vogele_s1300_3i.daily.ventilacion_limpiar_si_necesario",
          "op.vogele_s1300_3i.daily.motor_ruidos_inusuales_comprobar",
          "op.vogele_s1300_3i.daily.motor_estanqueidad_comprobar",
          "op.vogele_s1300_3i.daily.motor_aceite_comprobar_rellenar",
          "op.vogele_s1300_3i.daily.escape_estanqueidad_comprobar",
          "op.vogele_s1300_3i.daily.aspiracion_aire_conducto_revisar_danos",
          "op.vogele_s1300_3i.daily.refrigeracion_comprobacion_visual",
          "op.vogele_s1300_3i.daily.refrigerante_comprobar_rellenar",
          "op.vogele_s1300_3i.daily.deposito_combustible_comprobar",
          "op.vogele_s1300_3i.daily.filtro_previo_combustible_desaguar",
          "op.vogele_s1300_3i.daily.deposito_adblue_comprobar",
          "op.vogele_s1300_3i.daily.sinfines_distribucion_lubricar",
          "op.vogele_s1300_3i.daily.hidraulico_aceite_comprobar_rellenar"
        ],
        materials: [
          { matId: "mat.vogele_s1300_3i.producto_limpieza_2050174", note: "Según consumo" },
          { matId: "mat.vogele_s1300_3i.agente_separador", note: "Según consumo" },
          { matId: "mat.vogele_s1300_3i.aceite_motor", note: "Según necesidad de relleno" },
          { matId: "mat.vogele_s1300_3i.refrigerante_mezcla", cantidad: "Agua 7.8 L + anticongelante 5.2 L (si se repone por nivel)" },
          { matId: "mat.vogele_s1300_3i.diesel", cantidad: "110 L (capacidad depósito; solo si hay repostaje)" },
          { matId: "mat.vogele_s1300_3i.adblue", cantidad: "10 L (capacidad depósito; solo si hay rellenado)" },
          { matId: "mat.vogele_s1300_3i.grasa_especial", note: "Según puntos de engrase" }
        ],
        torques: []
      },
      h8: {
        ops: [
          "op.vogele_s1300_3i.h8.dispositivos_ascenso_limpiar",
          "op.vogele_s1300_3i.h8.paredes_tolva_limpiar",
          "op.vogele_s1300_3i.h8.cintas_rascadoras_limpiar",
          "op.vogele_s1300_3i.h8.sinfines_distribucion_limpiar",
          "op.vogele_s1300_3i.h8.rodillos_empuje_limpiar",
          "op.vogele_s1300_3i.h8.refrigerante_proteccion_antiheladas_comprobar"
        ],
        materials: [
          { matId: "mat.vogele_s1300_3i.agente_separador", note: "Según consumo (tolva/cintas/sinfines/rodillos/ascensos)" },
          { matId: "mat.vogele_s1300_3i.refrigerante_mezcla", cantidad: "Agua 7.8 L + anticongelante 5.2 L (si hay que corregir mezcla)" }
        ],
        torques: []
      },
      h50_post: {
        ops: [
          "op.vogele_s1300_3i.h50_post.tension_todas_cadenas_comprobar",
          "op.vogele_s1300_3i.h50_post.hidraulico_filtro_asp_retorno_cambiar",
          "op.vogele_s1300_3i.h50_post.hidraulico_filtro_aceite_fuga_cambiar",
          "op.vogele_s1300_3i.h50_post.traslacion_aceite_engranaje_cambiar",
          "op.vogele_s1300_3i.h50_post.cadena_cinta_rascadora_comprobar_tensar_lubricar",
          "op.vogele_s1300_3i.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar_lubricar",
          "op.vogele_s1300_3i.h50_post.cadenas_acc_sinfin_distrib_comprobar_tensar"
        ],
        materials: [
          { matId: "mat.vogele_s1300_3i.filtro_asp_retorno_hid", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.filtro_aceite_fuga_hid", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.aceite_engranaje_std_traslacion", cantidad: "1.1 ± 0.1 L por lado (≈ 2.2 L total)" },
          { matId: "mat.vogele_s1300_3i.grasa_especial", note: "Cadenas/puntos (según necesidad)" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.vogele_s1300_3i.h500.motor_aceite_cambiar",
          "op.vogele_s1300_3i.h500.motor_filtro_aceite_cambiar",
          "op.vogele_s1300_3i.h500.correa_trapezoidal_nervada_comprobar",
          "op.vogele_s1300_3i.h500.filtro_previo_combustible_cartucho_cambiar",
          "op.vogele_s1300_3i.h500.filtro_aire_principal_cambiar",
          "op.vogele_s1300_3i.h500.refrigerante_proteccion_antiheladas_comprobar",
          "op.vogele_s1300_3i.h500.refrigerador_aire_carga_purgar_agua_condensados",
          "op.vogele_s1300_3i.h500.hidraulico_aceite_cambiar",
          "op.vogele_s1300_3i.h500.hidraulico_filtro_asp_retorno_cambiar",
          "op.vogele_s1300_3i.h500.hidraulico_filtro_aceite_fuga_cambiar",
          "op.vogele_s1300_3i.h500.hidraulico_filtro_bypass_cambiar",
          "op.vogele_s1300_3i.h500.electrico_correa_generador_comprobar_tensar",
          "op.vogele_s1300_3i.h500.aceite_distribucion_bombas_comprobar",
          "op.vogele_s1300_3i.h500.aceite_traslacion_izq_dcha_comprobar",
          "op.vogele_s1300_3i.h500.tension_todas_cadenas_comprobar",
          "op.vogele_s1300_3i.h500.cadena_cinta_rascadora_comprobar_tensar_lubricar",
          "op.vogele_s1300_3i.h500.cadenas_acc_cinta_rascadora_comprobar_tensar",
          "op.vogele_s1300_3i.h500.cadenas_acc_sinfin_distrib_comprobar_tensar",
          "op.vogele_s1300_3i.h500.aberturas_cilindros_hidraulicos_lubricar"
        ],
        materials: [
          { matId: "mat.vogele_s1300_3i.aceite_motor", cantidad: "≈ 10 L (cambio)" },
          { matId: "mat.vogele_s1300_3i.filtro_aceite_motor", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.cartucho_filtro_previo_combustible", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.filtro_aire_principal", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.aceite_hidraulico", cantidad: "90 L (depósito; cambio/llenado del sistema)" },
          { matId: "mat.vogele_s1300_3i.filtro_asp_retorno_hid", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.filtro_aceite_fuga_hid", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.filtro_bypass_hid", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.aceite_engranaje_especial_distrib_bomba", cantidad: "1.0 ± 0.1 L (solo control en 500 h)" },
          { matId: "mat.vogele_s1300_3i.grasa_especial", note: "Cadenas/cilindros (según puntos)" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.vogele_s1300_3i.h1000.hidraulico_tamiz_tubuladura_llenado_limpiar",
          "op.vogele_s1300_3i.h1000.aceite_distribucion_bombas_cambiar",
          "op.vogele_s1300_3i.h1000.aceite_traslacion_izq_dcha_cambiar",
          "op.vogele_s1300_3i.h1000.agente_separador_tamiz_tubuladura_llenado_limpiar",
          "op.vogele_s1300_3i.h1000.direccion_sistema_comprobar",
          "op.vogele_s1300_3i.h1000.conexiones_cables_bateria_comprobar",
          "op.vogele_s1300_3i.h1000.alojamiento_motor_comprobar",
          "op.vogele_s1300_3i.h1000.filtro_combustible_cambiar",
          "op.vogele_s1300_3i.h1000.sistema_combustible_desairear",
          "op.vogele_s1300_3i.h1000.filtro_aspiracion_adblue_cambiar"
        ],
        materials: [
          { matId: "mat.vogele_s1300_3i.aceite_engranaje_especial_distrib_bomba", cantidad: "1.0 ± 0.1 L" },
          { matId: "mat.vogele_s1300_3i.aceite_engranaje_std_traslacion", cantidad: "1.1 ± 0.1 L por lado (≈ 2.2 L total)" },
          { matId: "mat.vogele_s1300_3i.filtro_combustible", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.filtro_aspiracion_adblue", qty: 1, unit: "ud", note: "Catálogo repuestos" },
          { matId: "mat.vogele_s1300_3i.agente_separador", note: "Según consumo (tras limpieza y para rellenar si procede)" }
        ],
        torques: []
      },
      h2000: {
        ops: ["op.vogele_s1300_3i.h2000.correa_generador_cambiar"],
        materials: [{ matId: "mat.vogele_s1300_3i.correa_generador", qty: 1, unit: "ud", note: "Catálogo repuestos" }],
        torques: []
      },
      y2: {
        ops: ["op.vogele_s1300_3i.y2.filtro_bomba_transporte_adblue_sustituir"],
        materials: [{ matId: "mat.vogele_s1300_3i.filtro_bomba_transporte_adblue", qty: 1, unit: "ud", note: "Catálogo repuestos" }],
        torques: []
      }
    }
  };

  // =========================
  // VALIDACIÓN (opcional)
  // =========================

  // =========================
  // Datos (56008 - VOGELE S1800-3I)
  // =========================
  // Nota: entradas resumidas del plan. Intervalos acumulativos: daily + h8 + h50_post + h500 + h1000 + extras.

  // --- Operaciones (DIARIO)
  addOp("op.vogele_s1800_3i.daily.pupitre_mando_limpiar_si_necesario", "Pupitre de mando: limpiar (si es necesario)", { action: "limpiar", groupKey: "cabina.pupitre_mando", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.cojinete_giratorio_lubricar", "Cojinete giratorio: lubricar", { action: "lubricar", groupKey: "general.cojinete_giratorio", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.asiento_conductor_cristal_comprobar", "Asiento del conductor (cristal/daños): comprobar", { action: "comprobar", groupKey: "cabina.asiento_conductor", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.dispositivos_ascenso_limpiar", "Dispositivos de ascenso: limpiar", { action: "limpiar", groupKey: "seguridad.dispositivos_ascenso", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.agua_limpieza_comprobar_rellenar", "Deposito de agua de limpieza: comprobar / rellenar", { action: "comprobar", groupKey: "limpieza.agua_limpieza", fuente: "manual_s1800_3i" });
  addOp(
    "op.vogele_s1800_3i.daily.limpieza_tolva_cintas_sinfines_rodillos_barra_rociadora",
    "Limpiar: paredes de tolva, cintas rascadoras, sinfines de distribucion, rodillos de empuje, barra rociadora",
    { action: "limpiar", groupKey: "transporte.limpieza_general", fuente: "manual_s1800_3i" }
  );
  addOp("op.vogele_s1800_3i.daily.tension_todas_cadenas_comprobar", "Tension de todas las cadenas: comprobar", { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.techo_proteccion_comprobar", "Techo de proteccion: comprobar", { action: "comprobar", groupKey: "seguridad.techo_proteccion", fuente: "manual_s1800_3i" });
  addOp(
    "op.vogele_s1800_3i.daily.motor_ruidos_estanqueidad_mangueras_comprobar",
    "Motor: comprobar ruidos inusuales, estanqueidad y conexiones/abrazaderas de mangueras",
    { action: "comprobar", groupKey: "motor.inspeccion_visual", fuente: "manual_s1800_3i" }
  );
  addOp("op.vogele_s1800_3i.daily.motor_aceite_nivel_comprobar_rellenar", "Motor: comprobar / rellenar nivel de aceite", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.combustible_deposito_comprobar", "Combustible: comprobar deposito", { action: "comprobar", groupKey: "motor.combustible_deposito", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.filtro_previo_combustible_desaguar_si_aplica", "Filtro previo de combustible: desaguar (si aplica)", { action: "limpiar", groupKey: "motor.filtro_previo_combustible", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.filtro_aire_principal_limpiar_si_aplica", "Filtro de aire (principal): limpiar (si aplica por estado)", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.refrigeracion_comprobacion_visual", "Sistema de refrigeracion: comprobacion visual", { action: "comprobar", groupKey: "motor.sistema_refrigeracion", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.lubricacion_central_rellenar_comprobar", "Sistema de lubricacion central: rellenar / comprobacion visual", { action: "comprobar", groupKey: "lubricacion.lubricacion_central", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.aberturas_cilindros_hidraulicos_lubricar", "Aberturas de cilindros hidraulicos: lubricar", { action: "lubricar", groupKey: "hidraulico.cilindros_aberturas", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.daily.conexiones_bateria_comprobar", "Conexiones de cables de bateria: comprobar", { action: "comprobar", groupKey: "electrico.bateria_conexiones", fuente: "manual_s1800_3i" });

  // --- Operaciones (8 h)
  addOp(
    "op.vogele_s1800_3i.h8.plan_8h_realizar",
    "Plan por horas (8 h): realizar limpiezas/inspecciones recurrentes y tensiones segun plan",
    { fuente: "manual_s1800_3i" }
  );

  // --- Operaciones (50 h - una vez tras puesta en servicio)
  addOp("op.vogele_s1800_3i.h50_post.cinta_fuerza_comprobar", "Cinta de fuerza: comprobar", { action: "comprobar", groupKey: "motor.cinta_fuerza", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h50_post.filtro_asp_retorno_hid_sustituir", "Hidraulico: sustituir filtro aspiracion/retorno", { action: "sustituir", groupKey: "hidraulico.filtro_asp_retorno", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h50_post.filtro_aceite_fuga_hid_sustituir", "Hidraulico: sustituir filtro de aceite de fuga", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h50_post.aceite_distribuidor_bomba_cambiar", "Cambiar aceite engranaje del distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h50_post.orugas_comprobar_tensar", "Comprobar / tensar orugas", { action: "comprobar", groupKey: "traslacion.oruga", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h50_post.aceite_traslacion_cambiar", "Cambiar aceite engranaje traslacion izq./dcha.", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h50_post.cadena_cinta_rascadora_comprobar_tensar_lubricar", "Cadena de cinta rascadora: comprobar / tensar / lubricar", { fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar", "Cadenas accionamiento de cinta rascadora: comprobar / tensar (engrasar si procede)", { fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h50_post.cadenas_sinfin_distrib_comprobar_tensar", "Cadenas del sinfin de distribucion: comprobar / tensar", { fuente: "manual_s1800_3i" });

  // --- Operaciones (500 h)
  addOp("op.vogele_s1800_3i.h500.motor_aceite_cambiar", "Motor: cambiar aceite de motor", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h500.motor_filtro_aceite_sustituir", "Motor: cambiar filtro de aceite del motor", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h500.motor_filtro_combustible_sustituir", "Motor: cambiar filtro de combustible (y prefiltrado si aplica)", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h500.motor_filtro_aire_principal_limpiar_cambiar", "Motor: filtro de aire (principal): limpiar / cambiar segun plan/estado", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h500.hidraulico_filtro_bypass_sustituir", "Hidraulico: cambiar filtro de aceite en desvio (by-pass)", { action: "sustituir", groupKey: "hidraulico.filtro_bypass", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h500.traslacion_orugas_comprobar_tensar", "Traslacion: comprobar/tensar orugas", { action: "comprobar", groupKey: "traslacion.oruga", fuente: "manual_s1800_3i" });
  addOp(
    "op.vogele_s1800_3i.h500.transporte_cadenas_comprobar_tensar",
    "Transporte material: comprobar tension y estado de cadenas (cinta rascadora / sinfines), con engrase/lubricacion si procede",
    { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "manual_s1800_3i" }
  );

  // --- Operaciones (1000 h)
  addOp("op.vogele_s1800_3i.h1000.hidraulico_aceite_cambiar", "Hidraulico: cambiar aceite hidraulico", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h1000.hidraulico_tamiz_tubuladura_deposito_limpiar", "Hidraulico: limpiar tamiz/tubuladura/depÃ³sito hidraulico", { fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h1000.hidraulico_filtros_principales_sustituir", "Hidraulico: cambiar filtro aspiracion/retorno + filtro de fuga (y desairear si aplica)", { action: "sustituir", groupKey: "hidraulico.filtros_principales", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h1000.hidraulico_aceite_distribucion_bombas_cambiar", "Transmisiones: cambiar aceite engranaje del distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h1000.traslacion_aceite_engranaje_cambiar", "Transmisiones: cambiar aceite engranaje traslacion izq./dcha.", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h1000.limpieza_agente_separador_deposito_limpiar", "Sistema de limpieza: limpiar tamiz/tubuladura/depÃ³sito de agente separador (si aplica)", { action: "limpiar", groupKey: "instalacion_limpieza.agente_separador_deposito", fuente: "manual_s1800_3i" });

  // --- Operaciones extra
  addOp("op.vogele_s1800_3i.h1500.amortiguador_vibraciones_ciguenal_comprobar", "Amortiguador de vibraciones del cigÃ¼eÃ±al: comprobar (1500 h)", { action: "comprobar", groupKey: "motor.amortiguador_vibraciones_ciguenal", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h1500.filtro_ventilacion_carter_sustituir", "Filtro ventilacion carcasa de cigÃ¼eÃ±al: sustituir (1500 h)", { action: "sustituir", groupKey: "motor.filtro_ventilacion_carcasa_ciguenal", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h3000.juego_valvulas_comprobar_ajustar_sat", "Juego de valvulas: comprobar/ajustar (3000 h, servicio tecnico)", { fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h3000.filtro_conducto_def_sustituir", "Filtro del conducto de DEF: sustituir (3000 h, si aplica)", { action: "sustituir", groupKey: "motor.filtro_conducto_def", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h4500.amortiguador_vibraciones_elastomero_sustituir", "Amortiguador vibraciones (elastomero) del cigÃ¼eÃ±al: sustituir (4500 h)", { action: "sustituir", groupKey: "motor.amortiguador_vibraciones_elastomero", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h4500.filtro_unidad_dosificacion_def_sustituir", "Filtro unidad dosificacion DEF: sustituir (4500 h, si aplica)", { action: "sustituir", groupKey: "motor.filtro_unidad_dosificacion_def", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h5000.catalizador_oxidacion_mantenimiento_sat", "Mantenimiento catalizador de oxidacion (5000 h, servicio tecnico)", { fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h5000.cabeza_cilindro_mantenimiento_sat", "Mantenimiento grupo cabeza de cilindro (5000 h, servicio tecnico)", { fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h6000.sistema_refrigeracion_lavar", "Sistema de refrigeracion: lavar (6000 h)", { action: "limpiar", groupKey: "motor.sistema_refrigeracion", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.h6000.termostatos_comprobar", "Termostatos: comprobar (6000 h)", { action: "comprobar", groupKey: "motor.termostatos", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.y1.cartucho_seguridad_filtro_aire_cambiar", "Filtro de aire: cambiar cartucho de seguridad (1 vez al aÃ±o)", { action: "sustituir", groupKey: "motor.filtro_aire_cartucho_seguridad", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.y1.refrigerador_aire_carga_limpiar", "Refrigerador de aire de carga: limpiar (1 vez al aÃ±o)", { action: "limpiar", groupKey: "motor.refrigerador_aire_carga", fuente: "manual_s1800_3i" });
  addOp("op.vogele_s1800_3i.y6.refrigerante_cambiar", "Refrigerante: cambiar (cada 6 aÃ±os)", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "manual_s1800_3i" });

  // --- Materiales (S1800-3I)
  addMat("mat.vogele_s1800_3i.detergente_limpiacristales", "Detergente limpia-cristales", { unit: "L", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.producto_limpieza_2050174", "Producto de limpieza (ref. 2050174)", { fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.agente_separador", "Agente separador", { unit: "L", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.grasa_especial_lub_central", "Grasa especial (lubricacion central)", { unit: "kg", fuente: "manual_s1800_3i" });

  addMat("mat.vogele_s1800_3i.aceite_motor", "Aceite de motor", { unit: "L", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.filtro_aceite_motor", "Filtro de aceite del motor", { unit: "ud", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.filtro_aire_principal", "Filtro de aire (principal)", { unit: "ud", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.cartucho_seguridad_filtro_aire", "Cartucho de seguridad filtro de aire", { unit: "ud", fuente: "manual_s1800_3i" });

  addMat("mat.vogele_s1800_3i.filtro_hid_bypass", "Filtro de aceite en desvio (by-pass) hidraulico", { unit: "ud", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.filtro_hid_asp_retorno", "Filtro aspiracion/retorno hidraulico", { unit: "ud", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.filtro_hid_aceite_fuga", "Filtro de aceite de fuga hidraulico", { unit: "ud", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.aceite_hidraulico", "Aceite hidraulico", { unit: "L", fuente: "manual_s1800_3i" });

  addMat("mat.vogele_s1800_3i.aceite_engranaje_distribuidor_bomba_spezial", "Aceite engranaje distribuidor de bomba (Spezial)", { unit: "L", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.aceite_engranaje_traslacion_spezial", "Aceite engranaje traslacion izq./dcha. (Spezial)", { unit: "L", fuente: "manual_s1800_3i" });

  addMat("mat.vogele_s1800_3i.filtro_ventilacion_carter", "Filtro ventilacion carter", { unit: "ud", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.filtro_conducto_def", "Filtro del conducto de DEF", { unit: "ud", fuente: "manual_s1800_3i" });
  addMat("mat.vogele_s1800_3i.filtro_unidad_dosificacion_def", "Filtro unidad dosificacion DEF", { unit: "ud", fuente: "manual_s1800_3i" });

  addMat("mat.vogele_s1800_3i.refrigerante_mezcla_menos35", "Refrigerante (mezcla agua + anticongelante hasta -35 C)", { unit: "L", fuente: "manual_s1800_3i" });

  // Plantilla por modelo (S1800-3I)
  DB.templatesByModel[MODEL_VOGELE_S1800_3I] = {
    modelId: MODEL_VOGELE_S1800_3I,
    intervals: {
      daily: {
        ops: [
          "op.vogele_s1800_3i.daily.pupitre_mando_limpiar_si_necesario",
          "op.vogele_s1800_3i.daily.cojinete_giratorio_lubricar",
          "op.vogele_s1800_3i.daily.asiento_conductor_cristal_comprobar",
          "op.vogele_s1800_3i.daily.dispositivos_ascenso_limpiar",
          "op.vogele_s1800_3i.daily.agua_limpieza_comprobar_rellenar",
          "op.vogele_s1800_3i.daily.limpieza_tolva_cintas_sinfines_rodillos_barra_rociadora",
          "op.vogele_s1800_3i.daily.tension_todas_cadenas_comprobar",
          "op.vogele_s1800_3i.daily.techo_proteccion_comprobar",
          "op.vogele_s1800_3i.daily.motor_ruidos_estanqueidad_mangueras_comprobar",
          "op.vogele_s1800_3i.daily.motor_aceite_nivel_comprobar_rellenar",
          "op.vogele_s1800_3i.daily.combustible_deposito_comprobar",
          "op.vogele_s1800_3i.daily.filtro_previo_combustible_desaguar_si_aplica",
          "op.vogele_s1800_3i.daily.filtro_aire_principal_limpiar_si_aplica",
          "op.vogele_s1800_3i.daily.refrigeracion_comprobacion_visual",
          "op.vogele_s1800_3i.daily.lubricacion_central_rellenar_comprobar",
          "op.vogele_s1800_3i.daily.aberturas_cilindros_hidraulicos_lubricar",
          "op.vogele_s1800_3i.daily.conexiones_bateria_comprobar"
        ],
        materials: [
          { matId: "mat.vogele_s1800_3i.detergente_limpiacristales", cantidad: "1.9 L" },
          { matId: "mat.vogele_s1800_3i.producto_limpieza_2050174", note: "Si se limpia pupitre de mando" },
          { matId: "mat.vogele_s1800_3i.agente_separador", note: "Segun necesidad" },
          { matId: "mat.vogele_s1800_3i.grasa_especial_lub_central", cantidad: "2 kg (carga aprox.; rellenar segun necesidad)" }
        ],
        torques: []
      },
      h8: {
        ops: ["op.vogele_s1800_3i.h8.plan_8h_realizar"],
        materials: [
          { matId: "mat.vogele_s1800_3i.agente_separador", note: "Reposiciones segun necesidad" },
          { matId: "mat.vogele_s1800_3i.detergente_limpiacristales", note: "Reposiciones segun necesidad" },
          { matId: "mat.vogele_s1800_3i.grasa_especial_lub_central", note: "Reposiciones segun necesidad" }
        ],
        torques: []
      },
      h50_post: {
        ops: [
          "op.vogele_s1800_3i.h50_post.cinta_fuerza_comprobar",
          "op.vogele_s1800_3i.h50_post.filtro_asp_retorno_hid_sustituir",
          "op.vogele_s1800_3i.h50_post.filtro_aceite_fuga_hid_sustituir",
          "op.vogele_s1800_3i.h50_post.aceite_distribuidor_bomba_cambiar",
          "op.vogele_s1800_3i.h50_post.orugas_comprobar_tensar",
          "op.vogele_s1800_3i.h50_post.aceite_traslacion_cambiar",
          "op.vogele_s1800_3i.h50_post.cadena_cinta_rascadora_comprobar_tensar_lubricar",
          "op.vogele_s1800_3i.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar",
          "op.vogele_s1800_3i.h50_post.cadenas_sinfin_distrib_comprobar_tensar"
        ],
        materials: [
          { matId: "mat.vogele_s1800_3i.aceite_engranaje_distribuidor_bomba_spezial", cantidad: "6.0 L" },
          { matId: "mat.vogele_s1800_3i.aceite_engranaje_traslacion_spezial", cantidad: "3.5 L (por engranaje)" },
          { matId: "mat.vogele_s1800_3i.filtro_hid_asp_retorno", qty: 1, unit: "ud", note: "Catalogo repuestos" },
          { matId: "mat.vogele_s1800_3i.filtro_hid_aceite_fuga", qty: 1, unit: "ud", note: "Catalogo repuestos" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.vogele_s1800_3i.h500.motor_aceite_cambiar",
          "op.vogele_s1800_3i.h500.motor_filtro_aceite_sustituir",
          "op.vogele_s1800_3i.h500.motor_filtro_combustible_sustituir",
          "op.vogele_s1800_3i.h500.motor_filtro_aire_principal_limpiar_cambiar",
          "op.vogele_s1800_3i.h500.hidraulico_filtro_bypass_sustituir",
          "op.vogele_s1800_3i.h500.traslacion_orugas_comprobar_tensar",
          "op.vogele_s1800_3i.h500.transporte_cadenas_comprobar_tensar"
        ],
        materials: [
          { matId: "mat.vogele_s1800_3i.aceite_motor", cantidad: "≈ 23 L (cambio)" },
          { matId: "mat.vogele_s1800_3i.filtro_aceite_motor", qty: 1, unit: "ud", note: "Catalogo repuestos" },
          { matId: "mat.vogele_s1800_3i.filtro_combustible", note: "Catalogo repuestos" },
          { matId: "mat.vogele_s1800_3i.filtro_hid_bypass", qty: 1, unit: "ud", note: "Catalogo repuestos" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.vogele_s1800_3i.h1000.hidraulico_aceite_cambiar",
          "op.vogele_s1800_3i.h1000.hidraulico_tamiz_tubuladura_deposito_limpiar",
          "op.vogele_s1800_3i.h1000.hidraulico_filtros_principales_sustituir",
          "op.vogele_s1800_3i.h1000.hidraulico_aceite_distribucion_bombas_cambiar",
          "op.vogele_s1800_3i.h1000.traslacion_aceite_engranaje_cambiar",
          "op.vogele_s1800_3i.h1000.limpieza_agente_separador_deposito_limpiar"
        ],
        materials: [
          { matId: "mat.vogele_s1800_3i.aceite_hidraulico", cantidad: "≈ 300 L (segun especificacion del plan)" },
          { matId: "mat.vogele_s1800_3i.aceite_engranaje_distribuidor_bomba_spezial", cantidad: "6.0 L" },
          { matId: "mat.vogele_s1800_3i.aceite_engranaje_traslacion_spezial", cantidad: "3.5 L (por engranaje)" },
          { matId: "mat.vogele_s1800_3i.filtro_hid_asp_retorno", note: "Catalogo repuestos" },
          { matId: "mat.vogele_s1800_3i.filtro_hid_aceite_fuga", note: "Catalogo repuestos" },
          { matId: "mat.vogele_s1800_3i.aceite_motor", cantidad: "≈ 23 L (si coincide cambio 500 h)" }
        ],
        torques: []
      },
      h1500: {
        ops: ["op.vogele_s1800_3i.h1500.amortiguador_vibraciones_ciguenal_comprobar", "op.vogele_s1800_3i.h1500.filtro_ventilacion_carter_sustituir"],
        materials: [{ matId: "mat.vogele_s1800_3i.filtro_ventilacion_carter", qty: 1, unit: "ud", note: "Catalogo repuestos" }],
        torques: []
      },
      h3000: {
        ops: ["op.vogele_s1800_3i.h3000.juego_valvulas_comprobar_ajustar_sat", "op.vogele_s1800_3i.h3000.filtro_conducto_def_sustituir"],
        materials: [{ matId: "mat.vogele_s1800_3i.filtro_conducto_def", qty: 1, unit: "ud", note: "Si aplica; catalogo repuestos" }],
        torques: []
      },
      h4500: {
        ops: ["op.vogele_s1800_3i.h4500.amortiguador_vibraciones_elastomero_sustituir", "op.vogele_s1800_3i.h4500.filtro_unidad_dosificacion_def_sustituir"],
        materials: [{ matId: "mat.vogele_s1800_3i.filtro_unidad_dosificacion_def", qty: 1, unit: "ud", note: "Si aplica; catalogo repuestos" }],
        torques: []
      },
      h5000: { ops: ["op.vogele_s1800_3i.h5000.catalizador_oxidacion_mantenimiento_sat", "op.vogele_s1800_3i.h5000.cabeza_cilindro_mantenimiento_sat"], materials: [], torques: [] },
      h6000: {
        ops: ["op.vogele_s1800_3i.h6000.sistema_refrigeracion_lavar", "op.vogele_s1800_3i.h6000.termostatos_comprobar"],
        materials: [{ matId: "mat.vogele_s1800_3i.refrigerante_mezcla_menos35", note: "Segun procedimiento (cantidades segun capacidad)" }],
        torques: []
      },
      y1: {
        ops: ["op.vogele_s1800_3i.y1.cartucho_seguridad_filtro_aire_cambiar", "op.vogele_s1800_3i.y1.refrigerador_aire_carga_limpiar"],
        materials: [{ matId: "mat.vogele_s1800_3i.cartucho_seguridad_filtro_aire", qty: 1, unit: "ud", note: "Catalogo repuestos" }],
        torques: []
      },
      y6: {
        ops: ["op.vogele_s1800_3i.y6.refrigerante_cambiar"],
        materials: [{ matId: "mat.vogele_s1800_3i.refrigerante_mezcla_menos35", cantidad: "Agua 21 L + anticongelante 14 L" }],
        torques: []
      }
    }
  };

  // =========================
  // Datos (57010 - WIRTGEN W210FI)
  // =========================
  // Nota: en maquinaria_completa.js aparece como "WIRTGEN W210FI" (sin guion), por eso el modelId queda sin "_":
  // modelId detectado -> "WIRTGENW210FI"

  const MODEL_WIRTGEN_W210FI = "WIRTGENW210FI";

  // --- Operaciones (10 h - intervalo base)
  addOp("op.wirtgen_w210fi.h10.paro_emergencia_conmutador_comprobar", "Comprobar conmutador de PARO DE EMERGENCIA", { action: "comprobar", groupKey: "seguridad.paro_emergencia", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.avisadores_sistema_advertencia_comprobar", "Comprobar sistema de advertencia / avisadores", { action: "comprobar", groupKey: "seguridad.avisadores", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.iluminacion_zona_trabajo_comprobar", "Comprobar iluminacion de la zona de trabajo", { action: "comprobar", groupKey: "electrico.iluminacion_trabajo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.extintores_estado_disponibilidad_comprobar", "Comprobar estado / disponibilidad de extintores", { action: "comprobar", groupKey: "seguridad.extintores", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.dispositivos_ascenso_limpiar", "Limpiar dispositivos de ascenso (escalones, asideros, plataformas)", { action: "limpiar", groupKey: "seguridad.dispositivos_ascenso", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.motor_aceite_nivel_comprobar_rellenar", "Comprobar nivel de aceite del motor (rellenar si procede)", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.motor_refrigerante_nivel_comprobar_rellenar", "Comprobar nivel de refrigerante del motor (rellenar si procede)", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.hidraulico_aceite_nivel_comprobar_rellenar", "Comprobar nivel de aceite hidraulico (rellenar si procede)", { action: "comprobar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.combustible_separador_agua_purgar", "Comprobar separador de agua / filtro de combustible (purgar si procede)", { action: "comprobar", groupKey: "motor.separador_agua_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.rejillas_entradas_aire_comprobar_limpiar", "Comprobar / limpiar rejillas y entradas de aire (radiadores/enfriadores, zonas accesibles)", { action: "limpiar", groupKey: "motor.rejillas_entradas_aire", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h10.tambor_refrigerante_nivel_comprobar_si_aplica", "(Si aplica por configuracion) comprobar nivel de liquido refrigerante del tambor de fresado (rellenar si procede)", { action: "comprobar", groupKey: "tambor.refrigerante", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (50 h - rodaje) (incluye 10 h)
  addOp("op.wirtgen_w210fi.h50.correas_accionamiento_comprobar", "Comprobar correas/cintas de accionamiento (tension/estado segun equipo)", { action: "comprobar", groupKey: "motor.correas_accionamiento", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h50.uniones_abrazaderas_reapretar_si_procede", "Comprobar y reapretar (si procede) uniones/abrazaderas accesibles (motor/hidraulico/refrigeracion)", { action: "comprobar", groupKey: "general.abrazaderas_uniones", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h50.transmision_arrastre_comprobar", "Comprobar elementos de transmision/arrastre accesibles (tension/estado general)", { action: "comprobar", groupKey: "traslacion.transmision_arrastre", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (100 h) (incluye 50 h)
  addOp("op.wirtgen_w210fi.h100.puntos_engrase_comprobar_engrasar", "Comprobacion ampliada de puntos de engrase (engrasar donde aplique)", { action: "lubricar", groupKey: "general.engrase", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h100.tornilleria_accesible_revision_general", "Revision general de tornilleria accesible (zonas de vibracion/guardas)", { action: "comprobar", groupKey: "general.tornilleria", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (250 h) (incluye 100 h)
  addOp("op.wirtgen_w210fi.h250.motor_aceite_cambiar", "Cambiar aceite del motor", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h250.motor_filtro_aceite_sustituir", "Sustituir filtro de aceite del motor", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h250.admision_prefiltros_revisar_sustituir_si_procede", "Revisar/sustituir (segun estado) prefiltros/elementos de admision accesibles", { action: "comprobar", groupKey: "motor.admision_prefiltros", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h250.correas_revision_y_sustitucion_si_procede", "Revision de correas (estado/tension) y sustitucion si procede", { action: "comprobar", groupKey: "motor.correas_accionamiento", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (500 h) (incluye 250 h)
  addOp("op.wirtgen_w210fi.h500.filtros_combustible_sustituir", "Sustituir filtro(s) de combustible (segun configuracion)", { action: "sustituir", groupKey: "motor.filtros_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h500.filtro_aire_revisar_limpiar_sustituir", "Revisar/limpiar filtro de aire (o sustituir si lo marca el plan)", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h500.radiadores_enfriadores_limpieza_profunda", "Limpieza mas profunda de radiadores/enfriadores", { action: "limpiar", groupKey: "motor.radiadores_enfriadores", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (1000 h) (incluye 500 h)
  addOp("op.wirtgen_w210fi.h1000.filtros_hidraulicos_sustituir", "Sustituir filtro(s) hidraulico(s) segun plan", { action: "sustituir", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h1000.aceite_hidraulico_cambiar_si_procede", "Cambiar aceite hidraulico (si el plan lo establece a 1000 h)", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h1000.rodaje_traslacion_revision_general", "Revision general de componentes de traslacion/rodaje (estado, tensiones y desgaste)", { action: "comprobar", groupKey: "traslacion.rodaje", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (2000 h)
  addOp("op.wirtgen_w210fi.h2000.motor_intervalo_largo_operaciones", "Operaciones de motor de intervalo largo (segun tabla: inspecciones ampliadas admision/refrigeracion/auxiliares)", { fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w210fi.h2000.electrico_revision_ampliada", "Revision ampliada de sistemas electricos (cableado visible, fijaciones, protecciones)", { fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (2500 h)
  addOp("op.wirtgen_w210fi.h2500.operaciones_intervalo_largo_adicionales", "Operaciones adicionales de intervalo largo segun plan (segun tabla)", { fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (4000 h)
  addOp("op.wirtgen_w210fi.h4000.operaciones_mayores_programadas", "Operaciones mayores programadas (segun tabla: revisiones de conjuntos principales y sustituciones si aplican)", { fuente: "MANUAL DE SERVICIO" });

  // --- Materiales (W210FI)
  addMat("mat.wirtgen_w210fi.aceite_motor_15w40_low_saps", "Aceite motor WIRTGEN GROUP Engine Oil Low SAPS 15W-40", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.refrigerante_motor_mezcla", "Refrigerante motor (mezcla agua + WG30 + aditivo)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.aceite_hidraulico_hvlp46", "Aceite hidraulico WIRTGEN GROUP Hydraulic Oil HVLP 46", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.trapos_absorbente", "Trapos/absorbente (limpieza)", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.refrigerante_tambor_fresado", "Refrigerante tambor de fresado (segun tipo de tambor)", { unit: "L", fuente: "MANUAL DE SERVICIO" });

  addMat("mat.wirtgen_w210fi.grasa_molygrease", "WIRTGEN GROUP Multipurpose Molygrease", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.grasa_high_performance", "WIRTGEN GROUP High-Performance Grease", { fuente: "MANUAL DE SERVICIO" });

  addMat("mat.wirtgen_w210fi.filtro_aceite_motor", "Filtro aceite motor", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.filtros_combustible_juego", "Filtro(s) de combustible (juego segun configuracion)", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.filtro_aire", "Elemento filtro de aire (si aplica)", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.filtros_hidraulicos_juego", "Filtro(s) hidraulico(s) (juego segun configuracion)", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w210fi.juntas_estanqueidad", "Juntas/elementos de estanqueidad asociados (si aplica)", { fuente: "MANUAL DE SERVICIO" });

  // Plantilla por modelo (W210FI)
  DB.templatesByModel[MODEL_WIRTGEN_W210FI] = {
    modelId: MODEL_WIRTGEN_W210FI,
    intervals: {
      h10: {
        ops: [
          "op.wirtgen_w210fi.h10.paro_emergencia_conmutador_comprobar",
          "op.wirtgen_w210fi.h10.avisadores_sistema_advertencia_comprobar",
          "op.wirtgen_w210fi.h10.iluminacion_zona_trabajo_comprobar",
          "op.wirtgen_w210fi.h10.extintores_estado_disponibilidad_comprobar",
          "op.wirtgen_w210fi.h10.dispositivos_ascenso_limpiar",
          "op.wirtgen_w210fi.h10.motor_aceite_nivel_comprobar_rellenar",
          "op.wirtgen_w210fi.h10.motor_refrigerante_nivel_comprobar_rellenar",
          "op.wirtgen_w210fi.h10.hidraulico_aceite_nivel_comprobar_rellenar",
          "op.wirtgen_w210fi.h10.combustible_separador_agua_purgar",
          "op.wirtgen_w210fi.h10.rejillas_entradas_aire_comprobar_limpiar",
          "op.wirtgen_w210fi.h10.tambor_refrigerante_nivel_comprobar_si_aplica"
        ],
        materials: [
          { matId: "mat.wirtgen_w210fi.aceite_motor_15w40_low_saps", note: "Relleno segun necesidad (capacidad circuito 68.0 L)" },
          { matId: "mat.wirtgen_w210fi.refrigerante_motor_mezcla", note: "Relleno segun necesidad (capacidad total 99.0 L)" },
          { matId: "mat.wirtgen_w210fi.aceite_hidraulico_hvlp46", note: "Relleno segun necesidad (capacidad 100.0 L)" },
          { matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Segun necesidad" },
          {
            matId: "mat.wirtgen_w210fi.refrigerante_tambor_fresado",
            cantidad:
              "FB2000: 289 L (Agua 173 + WG30 116); FB2200: 335 L (Agua 201 + WG30 134); MCS FB2000: 145 L (Agua 87 + WG30 58); MCS FB2200: 173 L (Agua 104 + WG30 69); MCS FB2500: 215 L (Agua 129 + WG30 86)"
          }
        ],
        torques: []
      },
      h50: { ops: ["op.wirtgen_w210fi.h50.correas_accionamiento_comprobar", "op.wirtgen_w210fi.h50.uniones_abrazaderas_reapretar_si_procede", "op.wirtgen_w210fi.h50.transmision_arrastre_comprobar"], materials: [{ matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Segun necesidad" }], torques: [] },
      h100: {
        ops: ["op.wirtgen_w210fi.h100.puntos_engrase_comprobar_engrasar", "op.wirtgen_w210fi.h100.tornilleria_accesible_revision_general"],
        materials: [
          { matId: "mat.wirtgen_w210fi.grasa_molygrease", note: "Segun puntos" },
          { matId: "mat.wirtgen_w210fi.grasa_high_performance", note: "Segun puntos" },
          { matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Segun necesidad" }
        ],
        torques: []
      },
      h250: {
        ops: [
          "op.wirtgen_w210fi.h250.motor_aceite_cambiar",
          "op.wirtgen_w210fi.h250.motor_filtro_aceite_sustituir",
          "op.wirtgen_w210fi.h250.admision_prefiltros_revisar_sustituir_si_procede",
          "op.wirtgen_w210fi.h250.correas_revision_y_sustitucion_si_procede"
        ],
        materials: [
          { matId: "mat.wirtgen_w210fi.aceite_motor_15w40_low_saps", qty: 68.0, unit: "L" },
          { matId: "mat.wirtgen_w210fi.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Absorbente/bandeja drenaje + trapos" }
        ],
        torques: []
      },
      h500: {
        ops: ["op.wirtgen_w210fi.h500.filtros_combustible_sustituir", "op.wirtgen_w210fi.h500.filtro_aire_revisar_limpiar_sustituir", "op.wirtgen_w210fi.h500.radiadores_enfriadores_limpieza_profunda"],
        materials: [
          { matId: "mat.wirtgen_w210fi.filtros_combustible_juego", note: "1 juego (segun configuracion)" },
          { matId: "mat.wirtgen_w210fi.filtro_aire", qty: 1, unit: "ud", note: "Si aplica" },
          { matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Absorbente/trapos + aire a presion controlado/utiles de limpieza" }
        ],
        torques: []
      },
      h1000: {
        ops: ["op.wirtgen_w210fi.h1000.filtros_hidraulicos_sustituir", "op.wirtgen_w210fi.h1000.aceite_hidraulico_cambiar_si_procede", "op.wirtgen_w210fi.h1000.rodaje_traslacion_revision_general"],
        materials: [
          { matId: "mat.wirtgen_w210fi.aceite_hidraulico_hvlp46", cantidad: "100.0 L (si se realiza cambio completo)" },
          { matId: "mat.wirtgen_w210fi.filtros_hidraulicos_juego", note: "1 juego (segun configuracion)" },
          { matId: "mat.wirtgen_w210fi.juntas_estanqueidad", note: "Si aplica" },
          { matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Segun necesidad" }
        ],
        torques: []
      },
      h2000: { ops: ["op.wirtgen_w210fi.h2000.motor_intervalo_largo_operaciones", "op.wirtgen_w210fi.h2000.electrico_revision_ampliada"], materials: [{ matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Segun necesidad" }], torques: [] },
      h2500: { ops: ["op.wirtgen_w210fi.h2500.operaciones_intervalo_largo_adicionales"], materials: [{ matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Segun necesidad" }], torques: [] },
      h4000: { ops: ["op.wirtgen_w210fi.h4000.operaciones_mayores_programadas"], materials: [{ matId: "mat.wirtgen_w210fi.trapos_absorbente", note: "Segun necesidad" }], torques: [] }
    }
  };

  // =========================
  // Datos (WIRTGEN W350) (57002 / 57009)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.wirtgen_w350.h10.chasis_seguridad_funcionamiento_controlar", "Chasis / sistemas de seguridad: controlar funcionamiento antes de comenzar a trabajar", { action: "comprobar", groupKey: "seguridad.general", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.grupo_fresador.herramienta_controlar", "Grupo fresador: controlar herramienta de fresado (varias veces)", { action: "comprobar", groupKey: "fresador.herramienta", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.grupo_fresador.cajas_controlar", "Grupo fresador: controlar las cajas", { action: "comprobar", groupKey: "fresador.cajas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.motor_combustible_nivel_comprobar", "Motor: comprobar repetidas veces el nivel de combustible", { action: "comprobar", groupKey: "motor.combustible_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.motor_aceite_nivel_comprobar", "Motor: comprobar nivel de aceite del motor diesel", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.motor_filtros_aire_comprobar", "Motor: comprobar filtros de aire", { action: "comprobar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.motor_radiador_nervios_comprobar", "Motor: comprobar nervios del radiador", { action: "comprobar", groupKey: "motor.radiador_nervios", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.ruedas_revestimiento_goma_comprobar", "Motor/grupo accionador: comprobar revestimiento de goma (ruedas/neumaticos)", { action: "comprobar", groupKey: "rodaje.neumaticos", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w350.h10.hidraulico_aceite_nivel_comprobar", "Alimentacion aceite hidraulico: comprobar nivel de aceite hidraulico (tanque)", { action: "comprobar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.hidraulico_filtros_suciedad_comprobar", "Alimentacion aceite hidraulico: comprobar repetidas veces si hay suciedad (filtros)", { action: "comprobar", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.hidraulico_radiador_aceite_nervios_comprobar", "Alimentacion aceite hidraulico: comprobar nervios del radiador de aceite", { action: "comprobar", groupKey: "hidraulico.radiador_aceite", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w350.h10.agua_reserva_comprobar", "Sistema de agua: comprobar reserva de agua (varias veces)", { action: "comprobar", groupKey: "agua.reserva", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.agua_filtro_elemento_comprobar", "Sistema de agua: comprobar elemento filtrante (agua)", { action: "comprobar", groupKey: "agua.filtro", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h10.agua_toberas_pulverizadoras_comprobar", "Sistema de agua: comprobar toberas pulverizadoras", { action: "comprobar", groupKey: "agua.toberas", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w350.h10.lubricacion_puntos_lubricar", "Lubricacion: lubricar/engrasar puntos de lubricacion", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (50 h)
  addOp("op.wirtgen_w350.h50.iluminacion_avisos_contactos_comprobar", "Iluminacion / sistema de aviso: comprobar contactos", { action: "comprobar", groupKey: "electrico.iluminacion_contactos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h50.fresador_rodillos_engranaje_nivel_aceite_comprobar", "Grupo fresador: engranaje de los rodillos: comprobar nivel de aceite", { action: "comprobar", groupKey: "fresador.aceite_engranaje_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h50.motor_correa_trapezoidal_tension_comprobar", "Motor: comprobar tension de correa trapezoidal", { action: "comprobar", groupKey: "motor.correa_trapezoidal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h50.bomba_correa_trapezoidal_tension_comprobar", "Accionamiento de la bomba: controlar tension de correa trapezoidal", { action: "comprobar", groupKey: "hidraulico.bomba_correa_trapezoidal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h50.propulsor_engranaje_nivel_aceite_comprobar", "Accionamiento de avance: engranaje propulsor: comprobar nivel de aceite", { action: "comprobar", groupKey: "traslacion.aceite_engranaje_propulsor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h50.lubricacion_puntos_lubricar", "Lubricacion: lubricar/engrasar puntos de lubricacion", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (100 h - rodaje)
  addOp("op.wirtgen_w350.h100.fresador_rodillos_engranaje_aceite_cambiar", "Grupo fresador: engranaje de los rodillos: cambiar aceite (rodaje)", { action: "cambiar", groupKey: "fresador.aceite_engranaje_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h100.motor_aceite_cambiar", "Motor diesel: cambiar aceite (rodaje)", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h100.motor_filtro_aceite_cambiar", "Motor diesel: cambiar filtro(s) de aceite (rodaje)", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h100.motor_filtros_combustible_cambiar", "Motor diesel: cambiar filtros de combustible (rodaje)", { action: "sustituir", groupKey: "motor.filtros_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h100.hidraulico_filtro_elemento_cambiar", "Filtros (hidraulico): cambiar elemento filtrante (rodaje)", { action: "sustituir", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h100.propulsor_engranaje_aceite_cambiar", "Engranaje propulsor: cambiar aceite (rodaje)", { action: "cambiar", groupKey: "traslacion.aceite_engranaje_propulsor", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (250 h)
  addOp("op.wirtgen_w350.h250.motor_aceite_cambiar", "Motor diesel: cambiar aceite", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h250.motor_filtros_aceite_cambiar", "Motor diesel: cambiar filtros de aceite", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h250.motor_filtros_combustible_cambiar", "Motor diesel: cambiar filtros de combustible", { action: "sustituir", groupKey: "motor.filtros_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h250.motor_correa_trapezoidal_tension_comprobar", "Motor diesel: comprobar tension correa trapezoidal", { action: "comprobar", groupKey: "motor.correa_trapezoidal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h250.bateria_acido_nivel_comprobar", "Sistema electrico (baterias): comprobar nivel de acido", { action: "comprobar", groupKey: "electrico.bateria_acido", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h250.bateria_polos_engrasar", "Sistema electrico (baterias): engrasar polos de la bateria", { action: "lubricar", groupKey: "electrico.bateria_polos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h250.lubricacion_puntos_lubricar", "Lubricacion: lubricar/engrasar puntos de lubricacion", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (500 h)
  addOp("op.wirtgen_w350.h500.fresador_rodillos_engranaje_aceite_cambiar", "Grupo fresador: engranaje de los rodillos: cambiar aceite", { action: "cambiar", groupKey: "fresador.aceite_engranaje_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h500.hidraulico_elemento_filtrante_cambiar", "Filtros (hidraulico): cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h500.propulsor_engranaje_aceite_cambiar", "Engranaje propulsor: cambiar aceite", { action: "cambiar", groupKey: "traslacion.aceite_engranaje_propulsor", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (1000 h)
  addOp("op.wirtgen_w350.h1000.hidraulico_tanque_aceite_cambiar", "Aceite hidraulico: tanque: cambiar aceite", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.h1000.hidraulico_tanque_filtro_limpiar_cambiar", "Aceite hidraulico: tanque: limpiar/cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtro_tanque", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (anual)
  addOp("op.wirtgen_w350.y1.rodillos_engranaje_aceite_cambiar", "1x al aÃ±o: engranaje de los rodillos: cambiar aceite", { action: "cambiar", groupKey: "fresador.aceite_engranaje_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.y1.motor_aceite_y_filtros_cambiar", "1x al aÃ±o: motor diÃ©sel: cambiar aceite + filtros de aceite + filtros de combustible", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.y1.propulsor_engranaje_aceite_cambiar", "1x al aÃ±o: engranaje propulsor: cambiar aceite", { action: "cambiar", groupKey: "traslacion.aceite_engranaje_propulsor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w350.y1.hidraulico_tanque_aceite_y_filtro_cambiar", "1x al aÃ±o: tanque aceite hidraulico: cambiar aceite y limpiar/cambiar elemento filtrante", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });

  // --- Materiales (W350)
  addMat("mat.wirtgen_w350.grasa_engrase", "Grasa para engrase", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w350.agua_sistema", "Agua (sistema de agua)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w350.combustible", "Combustible", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w350.aceite_motor", "Aceite motor (cambio/reposicion)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w350.aceite_hidraulico", "Aceite hidraulico (cambio/reposicion)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w350.aceite_engranajes", "Aceite engranajes (rodillos/propulsor)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w350.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "0203 (W 350) ROMERO POLO" });
  addMat("mat.wirtgen_w350.cartucho_filtro_aceite_lubricacion", "Cartucho filtro aceite lubricacion", { unit: "ud", fuente: "0203 (W 350) ROMERO POLO" });
  addMat("mat.wirtgen_w350.kit_filtros_motor_193099", "Service kit engine filters 193099 (250 h)", { unit: "kit", fuente: "0203 (W 350) ROMERO POLO" });
  addMat("mat.wirtgen_w350.kit_filtros_motor_106519", "Service kit engine filters 106519 (500 h)", { unit: "kit", fuente: "0203 (W 350) ROMERO POLO" });

  addMat("mat.wirtgen_w350.kit_filtros_hidraulicos_106520", "Service kit hydraulic filters 106520", { unit: "kit", fuente: "0203 (W 350) ROMERO POLO" });
  addMat("mat.wirtgen_w350.filtro_aceite_hidraulico_74332", "Filtro aceite hidraulico 74332", { unit: "ud", fuente: "0203 (W 350) ROMERO POLO" });
  addMat("mat.wirtgen_w350.filtro_aceite_hidraulico_74334", "Filtro aceite hidraulico 74334", { unit: "ud", fuente: "0203 (W 350) ROMERO POLO" });
  addMat("mat.wirtgen_w350.filtro_llenado_desaireado_5068", "Filtro llenado/desaireado 5068", { unit: "ud", fuente: "0203 (W 350) ROMERO POLO" });

  // Plantilla por modelo (W350)
  DB.templatesByModel[MODEL_WIRTGEN_W350] = {
    modelId: MODEL_WIRTGEN_W350,
    intervals: {
      h10: {
        ops: [
          "op.wirtgen_w350.h10.chasis_seguridad_funcionamiento_controlar",
          "op.wirtgen_w350.h10.grupo_fresador.herramienta_controlar",
          "op.wirtgen_w350.h10.grupo_fresador.cajas_controlar",
          "op.wirtgen_w350.h10.motor_combustible_nivel_comprobar",
          "op.wirtgen_w350.h10.motor_aceite_nivel_comprobar",
          "op.wirtgen_w350.h10.motor_filtros_aire_comprobar",
          "op.wirtgen_w350.h10.motor_radiador_nervios_comprobar",
          "op.wirtgen_w350.h10.ruedas_revestimiento_goma_comprobar",
          "op.wirtgen_w350.h10.hidraulico_aceite_nivel_comprobar",
          "op.wirtgen_w350.h10.hidraulico_filtros_suciedad_comprobar",
          "op.wirtgen_w350.h10.hidraulico_radiador_aceite_nervios_comprobar",
          "op.wirtgen_w350.h10.agua_reserva_comprobar",
          "op.wirtgen_w350.h10.agua_filtro_elemento_comprobar",
          "op.wirtgen_w350.h10.agua_toberas_pulverizadoras_comprobar",
          "op.wirtgen_w350.h10.lubricacion_puntos_lubricar"
        ],
        materials: [
          { matId: "mat.wirtgen_w350.grasa_engrase", note: "Segun necesidad" },
          { matId: "mat.wirtgen_w350.agua_sistema", note: "Segun nivel" },
          { matId: "mat.wirtgen_w350.combustible", note: "Segun nivel" },
          { matId: "mat.wirtgen_w350.aceite_motor", note: "Reposicion segun nivel" },
          { matId: "mat.wirtgen_w350.aceite_hidraulico", note: "Reposicion segun nivel" }
        ],
        torques: []
      },
      h50: {
        ops: [
          "op.wirtgen_w350.h50.iluminacion_avisos_contactos_comprobar",
          "op.wirtgen_w350.h50.fresador_rodillos_engranaje_nivel_aceite_comprobar",
          "op.wirtgen_w350.h50.motor_correa_trapezoidal_tension_comprobar",
          "op.wirtgen_w350.h50.bomba_correa_trapezoidal_tension_comprobar",
          "op.wirtgen_w350.h50.propulsor_engranaje_nivel_aceite_comprobar",
          "op.wirtgen_w350.h50.lubricacion_puntos_lubricar"
        ],
        materials: [{ matId: "mat.wirtgen_w350.grasa_engrase", note: "Segun necesidad" }],
        torques: []
      },
      h100: {
        ops: [
          "op.wirtgen_w350.h100.fresador_rodillos_engranaje_aceite_cambiar",
          "op.wirtgen_w350.h100.motor_aceite_cambiar",
          "op.wirtgen_w350.h100.motor_filtro_aceite_cambiar",
          "op.wirtgen_w350.h100.motor_filtros_combustible_cambiar",
          "op.wirtgen_w350.h100.hidraulico_filtro_elemento_cambiar",
          "op.wirtgen_w350.h100.propulsor_engranaje_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wirtgen_w350.aceite_motor", note: "Cambio: cantidad segun capacidad" },
          { matId: "mat.wirtgen_w350.filtro_combustible", cantidad: "1 ud (min.; si monta 2, ajustar)" },
          { matId: "mat.wirtgen_w350.cartucho_filtro_aceite_lubricacion", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w350.aceite_hidraulico", note: "Rellenos tras cambio (segun nivel)" },
          { matId: "mat.wirtgen_w350.aceite_engranajes", note: "Rodillos/propulsor: cantidad segun capacidad" }
        ],
        torques: []
      },
      h250: {
        ops: [
          "op.wirtgen_w350.h250.motor_aceite_cambiar",
          "op.wirtgen_w350.h250.motor_filtros_aceite_cambiar",
          "op.wirtgen_w350.h250.motor_filtros_combustible_cambiar",
          "op.wirtgen_w350.h250.motor_correa_trapezoidal_tension_comprobar",
          "op.wirtgen_w350.h250.bateria_acido_nivel_comprobar",
          "op.wirtgen_w350.h250.bateria_polos_engrasar",
          "op.wirtgen_w350.h250.lubricacion_puntos_lubricar"
        ],
        materials: [
          { matId: "mat.wirtgen_w350.aceite_motor", note: "Cambio: cantidad segun capacidad" },
          { matId: "mat.wirtgen_w350.kit_filtros_motor_193099", qty: 1, unit: "kit" },
          { matId: "mat.wirtgen_w350.filtro_combustible", cantidad: "45287 (1 ud)" },
          { matId: "mat.wirtgen_w350.cartucho_filtro_aceite_lubricacion", cantidad: "10877 (1 ud)" },
          { matId: "mat.wirtgen_w350.grasa_engrase", note: "Bornes: segun necesidad" },
          { matId: "mat.wirtgen_w350.agua_sistema", note: "Agua destilada (bateria): segun nivel" }
        ],
        torques: []
      },
      h500: {
        ops: ["op.wirtgen_w350.h500.fresador_rodillos_engranaje_aceite_cambiar", "op.wirtgen_w350.h500.hidraulico_elemento_filtrante_cambiar", "op.wirtgen_w350.h500.propulsor_engranaje_aceite_cambiar"],
        materials: [
          { matId: "mat.wirtgen_w350.aceite_engranajes", note: "Rodillos/propulsor: cantidad segun capacidad" },
          { matId: "mat.wirtgen_w350.kit_filtros_hidraulicos_106520", qty: 1, unit: "kit" },
          { matId: "mat.wirtgen_w350.filtro_aceite_hidraulico_74332", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w350.filtro_aceite_hidraulico_74334", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w350.filtro_llenado_desaireado_5068", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w350.kit_filtros_motor_106519", qty: 1, unit: "kit", note: "Si aplica por planificacion interna" }
        ],
        torques: []
      },
      h1000: {
        ops: ["op.wirtgen_w350.h1000.hidraulico_tanque_aceite_cambiar", "op.wirtgen_w350.h1000.hidraulico_tanque_filtro_limpiar_cambiar"],
        materials: [
          { matId: "mat.wirtgen_w350.aceite_hidraulico", note: "Cambio: cantidad segun capacidad" },
          { matId: "mat.wirtgen_w350.kit_filtros_hidraulicos_106520", note: "Si corresponde" },
          { matId: "mat.wirtgen_w350.filtro_aceite_hidraulico_74332", note: "Si corresponde" },
          { matId: "mat.wirtgen_w350.filtro_aceite_hidraulico_74334", note: "Si corresponde" },
          { matId: "mat.wirtgen_w350.filtro_llenado_desaireado_5068", note: "Si corresponde" }
        ],
        torques: []
      },
      y1: {
        ops: [
          "op.wirtgen_w350.y1.rodillos_engranaje_aceite_cambiar",
          "op.wirtgen_w350.y1.motor_aceite_y_filtros_cambiar",
          "op.wirtgen_w350.y1.propulsor_engranaje_aceite_cambiar",
          "op.wirtgen_w350.y1.hidraulico_tanque_aceite_y_filtro_cambiar"
        ],
        materials: [
          { matId: "mat.wirtgen_w350.aceite_motor", note: "Cambio: cantidad segun capacidad" },
          { matId: "mat.wirtgen_w350.kit_filtros_motor_193099", note: "Si aplica (250 h)" },
          { matId: "mat.wirtgen_w350.kit_filtros_motor_106519", note: "Si aplica (500 h)" },
          { matId: "mat.wirtgen_w350.aceite_engranajes", note: "Rodillos + propulsor: cantidad segun capacidad" },
          { matId: "mat.wirtgen_w350.aceite_hidraulico", note: "Cambio: cantidad segun capacidad" },
          { matId: "mat.wirtgen_w350.kit_filtros_hidraulicos_106520", note: "Si corresponde" }
        ],
        torques: []
      }
    }
  };

  // =========================
  // Datos (57005 - WIRTGEN W130F)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.wirtgen_w130f.h10.seguridad_funcionamiento_controlar", "Chasis / sistemas de seguridad: controlar funcionamiento antes de comenzar a trabajar", { action: "comprobar", groupKey: "seguridad.general", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.tapa_cobertora_cierres_comprobar", "Tapa cobertora: comprobar los cierres", { action: "comprobar", groupKey: "chasis.tapa_cobertora", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.limpieza_maquina_completa", "Limpieza: maquina al completo", { action: "limpiar", groupKey: "general.limpieza", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w130f.h10.fresador_rodillos_engranaje_fugas_control_visual", "Grupo fresador: engranaje de los rodillos: control visual de fugas", { action: "comprobar", groupKey: "fresador.engranaje_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.fresador_rodillos_fcs_engranaje_fugas_control_visual", "Grupo fresador: engranaje de los rodillos (FCS): control visual de fugas", { action: "comprobar", groupKey: "fresador.engranaje_rodillos_fcs", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.fresador_picas_controlar", "Cambio de picas: controlar las picas varias veces", { action: "comprobar", groupKey: "fresador.picas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.fresador_portapicas_controlar", "Cambio de picas: controlar los porta picas varias veces", { action: "comprobar", groupKey: "fresador.portapicas", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w130f.h10.motor_combustible_nivel_comprobar", "Motor: tanque de combustible: comprobar repetidas veces el nivel de combustible", { action: "comprobar", groupKey: "motor.combustible_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.motor_aceite_nivel_comprobar", "Motor diésel: comprobar nivel de aceite", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.motor_separador_agua_vaciar", "Motor diésel: vaciar separador de agua", { action: "limpiar", groupKey: "motor.separador_agua_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.motor_separador_previo_polvo_controlar", "Motor diésel: controlar separador previo de polvo", { action: "comprobar", groupKey: "motor.separador_previo_polvo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.motor_filtro_aire_comprobar", "Motor diésel: comprobar filtro de aire", { action: "comprobar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.motor_refrigerante_nivel_comprobar", "Motor diésel: comprobar nivel de refrigerante", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.motor_radiador_nervios_comprobar", "Motor diésel: comprobar nervios del radiador", { action: "comprobar", groupKey: "motor.radiador_nervios", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.motor_radiador_aire_carga_comprobar", "Motor diésel: comprobar radiador del aire de carga", { action: "comprobar", groupKey: "motor.radiador_aire_carga", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w130f.h10.hidraulico_tanque_aceite_nivel_comprobar", "Alimentación aceite hidráulico: tanque: comprobar nivel de aceite", { action: "comprobar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.hidraulico_filtros_suciedad_comprobar", "Alimentación aceite hidráulico: filtros: comprobar repetidas veces si hay suciedad", { action: "comprobar", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.hidraulico_radiador_nervios_comprobar", "Alimentación aceite hidráulico: radiador aceite hidráulico: comprobar nervios (repetidas veces)", { action: "comprobar", groupKey: "hidraulico.radiador_aceite", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w130f.h10.traslacion_ruedas_neumaticos_revestimiento_comprobar", "Accionamiento de avance: ruedas/neumáticos: comprobar revestimiento de goma", { action: "comprobar", groupKey: "rodaje.neumaticos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.traslacion_trasladadoras_placas_basales_comprobar", "Accionamiento de avance: trasladadoras: comprobar placas basales", { action: "comprobar", groupKey: "traslacion.trasladadoras_placas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.traslacion_trasladadoras_rodillos_guia_comprobar", "Accionamiento de avance: trasladadoras: comprobar rodillos guía", { action: "comprobar", groupKey: "traslacion.trasladadoras_rodillos_guia", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w130f.h10.transporte_cinta_pandeo_comprobar", "Sistema de transporte: cinta de carga y descarga: comprobar pandeo", { action: "comprobar", groupKey: "transporte.cinta_pandeo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.transporte_cinta_rodillos_controlar", "Sistema de transporte: cinta de carga y descarga: controlar rodillos", { action: "comprobar", groupKey: "transporte.cinta_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.transporte_cinta_cables_acero_comprobar", "Sistema de transporte: cinta de carga y descarga: comprobar cables de acero", { action: "comprobar", groupKey: "transporte.cinta_cables_acero", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.vcs_valvula_descarga_polvo_controlar", "VCS: controlar válvula de descarga de polvo", { action: "comprobar", groupKey: "vcs.valvula_descarga_polvo", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w130f.h10.agua_tanque_reserva_comprobar", "Sistema de agua: tanque de agua: comprobar repetidas veces reserva de agua", { action: "comprobar", groupKey: "agua.reserva", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.agua_filtro_elemento_comprobar", "Sistema de agua: filtro de agua: comprobar elemento filtrante", { action: "comprobar", groupKey: "agua.filtro", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h10.agua_boquillas_pulverizadoras_comprobar", "Sistema de agua: boquillas pulverizadoras: comprobar", { action: "comprobar", groupKey: "agua.boquillas", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wirtgen_w130f.h10.lubricacion_puntos_lubricar", "Lubricación: puntos de lubricación: lubricar/engrasar", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (50 h) (incluye 10 h + añadidos + rodaje)
  addOp("op.wirtgen_w130f.h50.iluminacion_avisos_contactos_comprobar", "Iluminación / sistema de aviso: comprobar contactos", { action: "comprobar", groupKey: "electrico.iluminacion_contactos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50.fresador_rodillos_engranaje_nivel_aceite_comprobar", "Engranaje de los rodillos: comprobar nivel de aceite", { action: "comprobar", groupKey: "fresador.engranaje_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50.fresador_rodillos_fcs_nivel_aceite_comprobar", "Engranaje de los rodillos (FCS): comprobar nivel de aceite", { action: "comprobar", groupKey: "fresador.engranaje_rodillos_fcs", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50.cojinete_rodillo_nivel_aceite_comprobar", "Cojinete del rodillo: comprobar nivel de aceite", { action: "comprobar", groupKey: "fresador.cojinete_rodillo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50.bomba_hidraulica_nivel_aceite_comprobar", "Accionamiento bomba hidráulico: comprobar nivel de aceite", { action: "comprobar", groupKey: "hidraulico.bomba_aceite", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50.rodadura_engranaje_nivel_aceite_comprobar", "Engranaje de rodadura: comprobar nivel de aceite", { action: "comprobar", groupKey: "traslacion.engranaje_rodadura", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50.trasladadoras_tension_cadenas_comprobar", "Trasladadoras: comprobar tensión de cadenas", { action: "comprobar", groupKey: "traslacion.trasladadoras_cadenas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50.vcs_tuberias_mangueras_controlar", "VCS: controlar tuberías y mangueras", { action: "comprobar", groupKey: "vcs.tuberias_mangueras", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50.lubricacion_puntos_lubricar", "Lubricación: puntos de lubricación: lubricar/engrasar", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // Rodaje a 50 h (cambios)
  addOp("op.wirtgen_w130f.h50_post.fresador_rodillos_engranaje_aceite_cambiar", "Rodaje (50 h): engranaje de los rodillos: cambiar aceite", { action: "cambiar", groupKey: "fresador.engranaje_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.fresador_rodillos_fcs_aceite_cambiar", "Rodaje (50 h): engranaje de los rodillos (FCS): cambiar aceite", { action: "cambiar", groupKey: "fresador.engranaje_rodillos_fcs", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.cojinete_rodillo_aceite_cambiar", "Rodaje (50 h): cojinete del rodillo: cambiar aceite", { action: "cambiar", groupKey: "fresador.cojinete_rodillo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.fijacion_tornillo_reapretar", "Rodaje (50 h): fijación: reapretar el tornillo", { action: "comprobar", groupKey: "chasis.fijacion_tornillo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.motor_aceite_cambiar", "Rodaje (50 h): motor diésel: cambiar aceite", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.motor_filtros_aceite_cambiar", "Rodaje (50 h): motor diésel: cambiar filtros de aceite", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.motor_filtro_previo_combustible_cambiar", "Rodaje (50 h): motor diésel: cambiar filtro previo de combustible", { action: "sustituir", groupKey: "motor.filtro_previo_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.motor_filtro_combustible_cambiar", "Rodaje (50 h): motor diésel: cambiar filtro de combustible", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.bomba_hidraulica_aceite_cambiar", "Rodaje (50 h): accionamiento bomba hidráulico: cambiar aceite", { action: "cambiar", groupKey: "hidraulico.bomba_aceite", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h50_post.rodadura_engranaje_aceite_cambiar", "Rodaje (50 h): engranaje de rodadura: cambiar aceite", { action: "cambiar", groupKey: "traslacion.engranaje_rodadura", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (250 h)
  addOp("op.wirtgen_w130f.h250.cambio_rapido_sujeciones_cambiar", "Sistema de cambio rápido: cambiar las sujeciones", { action: "sustituir", groupKey: "fresador.cambio_rapido_sujeciones", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h250.cinta_arrastre_tope_rodillo_tensor_controlar", "Cinta de arrastre: controlar tope del rodillo tensor", { action: "comprobar", groupKey: "transporte.rodillo_tensor_tope", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h250.cinta_arrastre_cintas_transmision_controlar", "Cinta de arrastre: controlar cintas de transmisión", { action: "comprobar", groupKey: "transporte.cintas_transmision", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h250.poleas_cintas_arrastre_controlar", "Poleas de las cintas de arrastre: controlar poleas", { action: "comprobar", groupKey: "transporte.poleas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h250.lubricacion_puntos_lubricar", "Lubricación: puntos de lubricación: lubricar/engrasar", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (500 h)
  addOp("op.wirtgen_w130f.h500.fresador_rodillos_engranaje_aceite_cambiar", "Engranaje de los rodillos: cambiar aceite", { action: "cambiar", groupKey: "fresador.engranaje_rodillos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.fresador_rodillos_fcs_aceite_cambiar", "Engranaje de los rodillos (FCS): cambiar aceite", { action: "cambiar", groupKey: "fresador.engranaje_rodillos_fcs", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.cojinete_rodillo_aceite_cambiar", "Cojinete del rodillo: cambiar aceite", { action: "cambiar", groupKey: "fresador.cojinete_rodillo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.motor_aceite_cambiar", "Motor diésel: cambiar aceite", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.motor_filtros_aceite_cambiar", "Motor diésel: cambiar filtros de aceite", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.motor_filtro_previo_combustible_cambiar", "Motor diésel: cambiar filtro previo de combustible", { action: "sustituir", groupKey: "motor.filtro_previo_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.motor_filtro_combustible_cambiar", "Motor diésel: cambiar filtro de combustible", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.hidraulico_elemento_filtrante_cambiar", "Filtros hidráulicos: cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.bomba_hidraulica_aceite_cambiar", "Accionamiento bomba hidráulico: cambiar el aceite", { action: "cambiar", groupKey: "hidraulico.bomba_aceite", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.rodadura_engranaje_aceite_cambiar", "Engranaje de rodadura: cambiar aceite", { action: "cambiar", groupKey: "traslacion.engranaje_rodadura", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.motor_mangueras_controlar", "Motor diésel: controlar mangueras", { action: "comprobar", groupKey: "motor.mangueras", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.motor_abrazaderas_mangueras_controlar", "Motor diésel: controlar abrazaderas de mangueras", { action: "comprobar", groupKey: "motor.abrazaderas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.motor_correa_estado_controlar", "Motor diésel: controlar estado de la correa", { action: "comprobar", groupKey: "motor.correa", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.bateria_acido_nivel_comprobar", "Alimentación eléctrica: comprobar nivel de ácido (batería)", { action: "comprobar", groupKey: "electrico.bateria_acido", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h500.bateria_polos_engrasar", "Alimentación eléctrica: engrasar polos de la batería", { action: "lubricar", groupKey: "electrico.bateria_polos", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (1000 h)
  addOp("op.wirtgen_w130f.h1000.hidraulico_tanque_aceite_cambiar", "Tanque de aceite hidráulico: cambiar aceite", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h1000.hidraulico_tanque_elemento_filtrante_limpiar_cambiar", "Tanque de aceite hidráulico: limpiar/cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtro_tanque", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.h1000.agua_tanque_cartucho_protector_cambiar", "Sistema de agua (tanque): cambiar cartucho protector del tanque", { action: "sustituir", groupKey: "agua.cartucho_protector", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (ANUAL) (resumen de las marcadas en tabla)
  addOp("op.wirtgen_w130f.y1.motor_filtro_aire_insertos_limpiar_cambiar", "Anual: motor diésel: limpiar/cambiar insertos del filtro de aire", { action: "sustituir", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.y1.motor_refrigerante_cambiar", "Anual: motor diésel: cambiar refrigerante", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.y1.combustible_tanque_drenar", "Anual: tanque combustible: drenar tanque de combustible", { action: "limpiar", groupKey: "motor.combustible_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.y1.agua_tanque_cartucho_protector_cambiar", "Anual: tanque agua: cambiar cartucho protector del tanque", { action: "sustituir", groupKey: "agua.cartucho_protector", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.y1.hidraulico_tanque_aceite_y_filtro_cambiar", "Anual: hidráulico: en tanque: cambiar aceite / limpiar-cambiar elemento filtrante", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w130f.y1.engranajes_principales_aceite_cambiar", "Anual: engranajes (rodillos/FCS/cojinete/rodadura/bomba): cambiar aceite (según tabla)", { action: "cambiar", groupKey: "engranajes.anual", fuente: "MANUAL DE SERVICIO" });

  // --- Materiales (W130F)
  addMat("mat.wirtgen_w130f.grasa_engrase", "Grasa/engrase", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.aceite_motor", "Aceite motor diésel", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.filtro_aceite_motor", "Filtro(s) de aceite motor", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.filtro_previo_combustible", "Filtro previo de combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.aceite_hidraulico", "Aceite hidráulico", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.filtro_hidraulico_elemento", "Elemento filtrante hidráulico", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.aceite_engranajes", "Aceites de engranajes (rodillos/FCS/cojinete/rodadura/bomba)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.grasa_bornes_bateria", "Grasa para polos batería", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.cartucho_protector_tanque_agua", "Cartucho protector del tanque de agua", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.refrigerante_motor", "Refrigerante motor", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w130f.agua_destilada", "Agua destilada (batería)", { unit: "L", fuente: "MANUAL DE SERVICIO" });

  // Plantilla por modelo (W130F)
  DB.templatesByModel[MODEL_WIRTGEN_W130F] = {
    modelId: MODEL_WIRTGEN_W130F,
    intervals: {
      h10: {
        ops: [
          "op.wirtgen_w130f.h10.seguridad_funcionamiento_controlar",
          "op.wirtgen_w130f.h10.tapa_cobertora_cierres_comprobar",
          "op.wirtgen_w130f.h10.limpieza_maquina_completa",
          "op.wirtgen_w130f.h10.fresador_rodillos_engranaje_fugas_control_visual",
          "op.wirtgen_w130f.h10.fresador_rodillos_fcs_engranaje_fugas_control_visual",
          "op.wirtgen_w130f.h10.fresador_picas_controlar",
          "op.wirtgen_w130f.h10.fresador_portapicas_controlar",
          "op.wirtgen_w130f.h10.motor_combustible_nivel_comprobar",
          "op.wirtgen_w130f.h10.motor_aceite_nivel_comprobar",
          "op.wirtgen_w130f.h10.motor_separador_agua_vaciar",
          "op.wirtgen_w130f.h10.motor_separador_previo_polvo_controlar",
          "op.wirtgen_w130f.h10.motor_filtro_aire_comprobar",
          "op.wirtgen_w130f.h10.motor_refrigerante_nivel_comprobar",
          "op.wirtgen_w130f.h10.motor_radiador_nervios_comprobar",
          "op.wirtgen_w130f.h10.motor_radiador_aire_carga_comprobar",
          "op.wirtgen_w130f.h10.hidraulico_tanque_aceite_nivel_comprobar",
          "op.wirtgen_w130f.h10.hidraulico_filtros_suciedad_comprobar",
          "op.wirtgen_w130f.h10.hidraulico_radiador_nervios_comprobar",
          "op.wirtgen_w130f.h10.traslacion_ruedas_neumaticos_revestimiento_comprobar",
          "op.wirtgen_w130f.h10.traslacion_trasladadoras_placas_basales_comprobar",
          "op.wirtgen_w130f.h10.traslacion_trasladadoras_rodillos_guia_comprobar",
          "op.wirtgen_w130f.h10.transporte_cinta_pandeo_comprobar",
          "op.wirtgen_w130f.h10.transporte_cinta_rodillos_controlar",
          "op.wirtgen_w130f.h10.transporte_cinta_cables_acero_comprobar",
          "op.wirtgen_w130f.h10.vcs_valvula_descarga_polvo_controlar",
          "op.wirtgen_w130f.h10.agua_tanque_reserva_comprobar",
          "op.wirtgen_w130f.h10.agua_filtro_elemento_comprobar",
          "op.wirtgen_w130f.h10.agua_boquillas_pulverizadoras_comprobar",
          "op.wirtgen_w130f.h10.lubricacion_puntos_lubricar"
        ],
        materials: [{ matId: "mat.wirtgen_w130f.grasa_engrase", note: "Cantidad no indicada (puntos indicados)" }],
        torques: []
      },
      h50_post: {
        ops: [
          "op.wirtgen_w130f.h50.iluminacion_avisos_contactos_comprobar",
          "op.wirtgen_w130f.h50.fresador_rodillos_engranaje_nivel_aceite_comprobar",
          "op.wirtgen_w130f.h50.fresador_rodillos_fcs_nivel_aceite_comprobar",
          "op.wirtgen_w130f.h50.cojinete_rodillo_nivel_aceite_comprobar",
          "op.wirtgen_w130f.h50.bomba_hidraulica_nivel_aceite_comprobar",
          "op.wirtgen_w130f.h50.rodadura_engranaje_nivel_aceite_comprobar",
          "op.wirtgen_w130f.h50.trasladadoras_tension_cadenas_comprobar",
          "op.wirtgen_w130f.h50.vcs_tuberias_mangueras_controlar",
          "op.wirtgen_w130f.h50.lubricacion_puntos_lubricar",
          "op.wirtgen_w130f.h50_post.fresador_rodillos_engranaje_aceite_cambiar",
          "op.wirtgen_w130f.h50_post.fresador_rodillos_fcs_aceite_cambiar",
          "op.wirtgen_w130f.h50_post.cojinete_rodillo_aceite_cambiar",
          "op.wirtgen_w130f.h50_post.fijacion_tornillo_reapretar",
          "op.wirtgen_w130f.h50_post.motor_aceite_cambiar",
          "op.wirtgen_w130f.h50_post.motor_filtros_aceite_cambiar",
          "op.wirtgen_w130f.h50_post.motor_filtro_previo_combustible_cambiar",
          "op.wirtgen_w130f.h50_post.motor_filtro_combustible_cambiar",
          "op.wirtgen_w130f.h50_post.bomba_hidraulica_aceite_cambiar",
          "op.wirtgen_w130f.h50_post.rodadura_engranaje_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wirtgen_w130f.aceite_motor", note: "Rodaje (50 h): cantidad no indicada" },
          { matId: "mat.wirtgen_w130f.filtro_aceite_motor", cantidad: "1 ud (sin ref. en tabla)" },
          { matId: "mat.wirtgen_w130f.filtro_previo_combustible", cantidad: "1 ud (sin ref. en tabla)" },
          { matId: "mat.wirtgen_w130f.filtro_combustible", cantidad: "1 ud (sin ref. en tabla)" },
          { matId: "mat.wirtgen_w130f.aceite_engranajes", note: "Rodillos/FCS/cojinete/rodadura/bomba: cantidades no indicadas" },
          { matId: "mat.wirtgen_w130f.grasa_engrase", note: "Cantidad no indicada" }
        ],
        torques: []
      },
      h250: {
        ops: [
          "op.wirtgen_w130f.h250.cambio_rapido_sujeciones_cambiar",
          "op.wirtgen_w130f.h250.cinta_arrastre_tope_rodillo_tensor_controlar",
          "op.wirtgen_w130f.h250.cinta_arrastre_cintas_transmision_controlar",
          "op.wirtgen_w130f.h250.poleas_cintas_arrastre_controlar",
          "op.wirtgen_w130f.h250.lubricacion_puntos_lubricar"
        ],
        materials: [{ matId: "mat.wirtgen_w130f.grasa_engrase", note: "Cantidad no indicada" }],
        torques: []
      },
      h500: {
        ops: [
          "op.wirtgen_w130f.h500.fresador_rodillos_engranaje_aceite_cambiar",
          "op.wirtgen_w130f.h500.fresador_rodillos_fcs_aceite_cambiar",
          "op.wirtgen_w130f.h500.cojinete_rodillo_aceite_cambiar",
          "op.wirtgen_w130f.h500.motor_aceite_cambiar",
          "op.wirtgen_w130f.h500.motor_filtros_aceite_cambiar",
          "op.wirtgen_w130f.h500.motor_filtro_previo_combustible_cambiar",
          "op.wirtgen_w130f.h500.motor_filtro_combustible_cambiar",
          "op.wirtgen_w130f.h500.hidraulico_elemento_filtrante_cambiar",
          "op.wirtgen_w130f.h500.bomba_hidraulica_aceite_cambiar",
          "op.wirtgen_w130f.h500.rodadura_engranaje_aceite_cambiar",
          "op.wirtgen_w130f.h500.motor_mangueras_controlar",
          "op.wirtgen_w130f.h500.motor_abrazaderas_mangueras_controlar",
          "op.wirtgen_w130f.h500.motor_correa_estado_controlar",
          "op.wirtgen_w130f.h500.bateria_acido_nivel_comprobar",
          "op.wirtgen_w130f.h500.bateria_polos_engrasar"
        ],
        materials: [
          { matId: "mat.wirtgen_w130f.aceite_motor", note: "Cantidad no indicada" },
          { matId: "mat.wirtgen_w130f.filtro_aceite_motor", cantidad: "1 ud (sin ref. en tabla)" },
          { matId: "mat.wirtgen_w130f.filtro_previo_combustible", cantidad: "1 ud (sin ref. en tabla)" },
          { matId: "mat.wirtgen_w130f.filtro_combustible", cantidad: "1 ud (sin ref. en tabla)" },
          { matId: "mat.wirtgen_w130f.filtro_hidraulico_elemento", qty: 1, unit: "ud", note: "Sin ref. en tabla" },
          { matId: "mat.wirtgen_w130f.aceite_engranajes", note: "Rodillos/FCS/cojinete/rodadura/bomba: cantidades no indicadas" },
          { matId: "mat.wirtgen_w130f.grasa_bornes_bateria", note: "Cantidad no indicada" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.wirtgen_w130f.h1000.hidraulico_tanque_aceite_cambiar",
          "op.wirtgen_w130f.h1000.hidraulico_tanque_elemento_filtrante_limpiar_cambiar",
          "op.wirtgen_w130f.h1000.agua_tanque_cartucho_protector_cambiar"
        ],
        materials: [
          { matId: "mat.wirtgen_w130f.aceite_hidraulico", note: "Cambio: cantidad no indicada" },
          { matId: "mat.wirtgen_w130f.filtro_hidraulico_elemento", qty: 1, unit: "ud", note: "Sin ref. en tabla" },
          { matId: "mat.wirtgen_w130f.cartucho_protector_tanque_agua", qty: 1, unit: "ud", note: "Sin ref. en tabla" }
        ],
        torques: []
      },
      y1: {
        ops: [
          "op.wirtgen_w130f.y1.motor_filtro_aire_insertos_limpiar_cambiar",
          "op.wirtgen_w130f.y1.motor_refrigerante_cambiar",
          "op.wirtgen_w130f.y1.combustible_tanque_drenar",
          "op.wirtgen_w130f.y1.agua_tanque_cartucho_protector_cambiar",
          "op.wirtgen_w130f.y1.hidraulico_tanque_aceite_y_filtro_cambiar",
          "op.wirtgen_w130f.y1.engranajes_principales_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wirtgen_w130f.refrigerante_motor", note: "Cantidad no indicada" },
          { matId: "mat.wirtgen_w130f.cartucho_protector_tanque_agua", note: "1 ud (sin ref. en tabla)" },
          { matId: "mat.wirtgen_w130f.aceite_hidraulico", note: "Cantidad no indicada" },
          { matId: "mat.wirtgen_w130f.aceite_engranajes", note: "Cantidades no indicadas" }
        ],
        torques: []
      }
    }
  };

  // =========================
  // Datos (57006 - WIRTGEN W2000)
  // =========================

  // --- Operaciones (10 h)
  addOp(
    "op.wirtgen_w2000.h10.seguridad_limpieza_puesto",
    "Chasis/seguridad + limpieza general + puesto conductor: controlar sistemas de seguridad, limpiar máquina y controlar/limpiar recubrimiento antideslizante",
    { action: "comprobar", groupKey: "seguridad.general", fuente: "MANUAL DE SERVICIO" }
  );
  addOp(
    "op.wirtgen_w2000.h10.fresador_control_general",
    "Grupo fresador: control visual de fugas (rodillos standard/FCSLIGHT y FCS) + controlar picas y porta-picas",
    { action: "comprobar", groupKey: "fresador.control_general", fuente: "MANUAL DE SERVICIO" }
  );
  addOp(
    "op.wirtgen_w2000.h10.motor_niveles_y_radiadores",
    "Motor/combustible: comprobar nivel combustible; comprobar nivel aceite; comprobar filtro aire; comprobar nervios radiador; comprobar nivel refrigerante",
    { action: "comprobar", groupKey: "motor.inspeccion_basica", fuente: "MANUAL DE SERVICIO" }
  );
  addOp("op.wirtgen_w2000.h10.motor_separador_agua_filtro_cambiar", "Motor: cambiar filtro del separador de agua", { action: "sustituir", groupKey: "motor.separador_agua_filtro", fuente: "MANUAL DE SERVICIO" });
  addOp(
    "op.wirtgen_w2000.h10.hidraulico_niveles_y_radiador",
    "Aceite hidráulico: comprobar nivel depósito; comprobar nivel aceite en accionamiento de bomba; comprobar suciedad en filtros; comprobar nervios radiador aceite hidráulico",
    { action: "comprobar", groupKey: "hidraulico.inspeccion_basica", fuente: "MANUAL DE SERVICIO" }
  );
  addOp(
    "op.wirtgen_w2000.h10.cadenas_y_transporte",
    "Accionamiento de avance/cadenas y transporte: comprobar tensión cadenas/placas basales; comprobar pandeo/cables/obturaciones; controlar/limpiar rodillos y lado inferior (carga/descarga)",
    { action: "comprobar", groupKey: "transporte.control_general", fuente: "MANUAL DE SERVICIO" }
  );
  addOp(
    "op.wirtgen_w2000.h10.agua_sistema_comprobar",
    "Sistema de agua: comprobar reserva; controlar tamiz; comprobar elemento filtrante; comprobar boquillas pulverizadoras",
    { action: "comprobar", groupKey: "agua.sistema", fuente: "MANUAL DE SERVICIO" }
  );
  addOp("op.wirtgen_w2000.h10.aire_comprimido_condensado_evacuar", "Aire comprimido: evacuar agua de condensación (caldera)", { action: "limpiar", groupKey: "aire_comprimido.caldera", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h10.lubricacion_puntos_lubricar", "Lubricación: lubricar/engrasar puntos de lubricación", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (50 h) (acumula 10 h)
  addOp("op.wirtgen_w2000.h50.iluminacion_avisos_contactos_comprobar", "Iluminación/sistema de aviso: comprobar contactos", { action: "comprobar", groupKey: "electrico.iluminacion_contactos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h50.rodillos_std_fcslight_nivel_aceite_comprobar", "Grupo fresador: engranaje rodillos (standard y FCSLIGHT): comprobar nivel de aceite", { action: "comprobar", groupKey: "fresador.aceite_rodillos_std", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h50.rodillos_fcs_nivel_aceite_comprobar", "Grupo fresador: engranaje rodillos (FCS): comprobar nivel de aceite", { action: "comprobar", groupKey: "fresador.aceite_rodillos_fcs", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h50.cojinete_rodillo_nivel_aceite_comprobar", "Grupo fresador: cojinete del rodillo: comprobar nivel de aceite", { action: "comprobar", groupKey: "fresador.aceite_cojinete_rodillo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h50.rodadura_nivel_aceite_comprobar", "Accionamiento de avance: engranaje de rodadura: comprobar nivel de aceite", { action: "comprobar", groupKey: "traslacion.aceite_rodadura", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h50.bomba_agua_presion_aire_comprobar", "Sistema de agua: bomba de agua: comprobar presión del aire", { action: "comprobar", groupKey: "agua.bomba_presion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h50.bomba_agua_nivel_aceite_comprobar", "Sistema de agua: bomba de agua: comprobar nivel de aceite", { action: "comprobar", groupKey: "agua.bomba_aceite", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h50.lubricacion_puntos_lubricar", "Lubricación: lubricar/engrasar puntos de lubricación", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // --- Materiales (W2000)
  addMat("mat.wirtgen_w2000.grasa_engrase", "Grasa para puntos de lubricación", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.aceite_motor", "Aceite motor (cambio/reposición)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.aceite_hidraulico", "Aceite hidráulico (cambio/reposición)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.refrigerante_motor", "Refrigerante motor (cambio/reposición)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.agua_deposito", "Agua (depósito de agua)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.filtro_separador_agua", "Filtro separador de agua (combustible)", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.aceite_engranajes", "Aceite engranajes (rodillos/rodadura/cojinete/bomba agua)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.filtros_aceite_motor", "Filtro(s) aceite motor", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.prefiltro_combustible", "Prefiltro de combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.filtro_hidraulico_elemento", "Elemento filtrante hidráulico", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.aceite_bomba_hidraulica", "Aceite (bomba hidráulica)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.aceite_bomba_agua", "Aceite (bomba de agua)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.grasa_bornes_bateria", "Grasa para polos batería", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.agua_destilada_bateria", "Agua destilada (batería)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.alcohol_etilico", "Alcohol etílico (dispositivo anticongelante)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wirtgen_w2000.aceite_bomba_relleno_agua", "Aceite (bomba de relleno tanque de agua)", { unit: "L", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (100 h) (rodaje) (acumula 10 h + 50 h)
  addOp("op.wirtgen_w2000.h100.rodillos_std_fcslight_aceite_cambiar", "Rodaje (100 h): engranaje rodillos (standard y FCSLIGHT): cambiar aceite", { action: "cambiar", groupKey: "fresador.aceite_rodillos_std", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.rodillos_fcs_aceite_cambiar", "Rodaje (100 h): engranaje rodillos (FCS): cambiar aceite", { action: "cambiar", groupKey: "fresador.aceite_rodillos_fcs", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.cojinete_rodillo_aceite_cambiar", "Rodaje (100 h): cojinete del rodillo: cambiar aceite", { action: "cambiar", groupKey: "fresador.aceite_cojinete_rodillo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.cambio_rapido_sujeciones_cambiar", "Rodaje (100 h): sistema de cambio rápido: cambiar sujeciones", { action: "sustituir", groupKey: "fresador.cambio_rapido_sujeciones", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.fijacion_rodillo_tornillo_reapretar", "Rodaje (100 h): fijación del rodillo: reapretar tornillo", { action: "comprobar", groupKey: "fresador.fijacion_rodillo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.motor_aceite_cambiar", "Rodaje (100 h): motor diésel: cambiar aceite", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.motor_filtros_aceite_cambiar", "Rodaje (100 h): motor diésel: cambiar filtros de aceite", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.motor_prefiltro_combustible_cambiar", "Rodaje (100 h): motor diésel: cambiar prefiltro de combustible", { action: "sustituir", groupKey: "motor.filtro_previo_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.motor_filtro_combustible_cambiar", "Rodaje (100 h): motor diésel: cambiar filtro de combustible", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.motor_abrazaderas_mangueras_controlar", "Rodaje (100 h): motor diésel: controlar abrazaderas de mangueras", { action: "comprobar", groupKey: "motor.abrazaderas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.motor_correa_trapezoidal_tension_comprobar", "Rodaje (100 h): motor diésel: comprobar tensión de correa trapezoidal", { action: "comprobar", groupKey: "motor.correa_trapezoidal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.bomba_hidraulica_aceite_cambiar", "Rodaje (100 h): hidráulico: accionamiento bomba hidráulica: cambiar el aceite", { action: "cambiar", groupKey: "hidraulico.aceite_bomba", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.hidraulico_filtro_elemento_cambiar", "Rodaje (100 h): hidráulico: filtros: cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.rodadura_aceite_cambiar", "Rodaje (100 h): accionamiento de avance: engranaje de rodadura: cambiar aceite", { action: "cambiar", groupKey: "traslacion.aceite_rodadura", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h100.bomba_agua_aceite_cambiar", "Rodaje (100 h): sistema de agua: bomba de agua: cambiar aceite", { action: "cambiar", groupKey: "agua.bomba_aceite", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (250 h) (acumula 10 h + 50 h)
  addOp("op.wirtgen_w2000.h250.cambio_rapido_sujeciones_cambiar", "Grupo fresador: sistema de cambio rápido: cambiar sujeciones", { action: "sustituir", groupKey: "fresador.cambio_rapido_sujeciones", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.cinta_arrastre_tope_rodillo_tensor_controlar", "Cinta de arrastre: controlar tope del rodillo tensor", { action: "comprobar", groupKey: "transporte.rodillo_tensor_tope", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.cinta_arrastre_cintas_transmision_controlar", "Cinta de arrastre: controlar cintas de transmisión", { action: "comprobar", groupKey: "transporte.cintas_transmision", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.poleas_cintas_arrastre_controlar", "Poleas cintas de arrastre: controlar poleas", { action: "comprobar", groupKey: "transporte.poleas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.interruptor_fin_carrera_controlar", "Interruptor de final de carrera (placa del rodillo): controlar función de conmutación", { action: "comprobar", groupKey: "fresador.interruptor_fin_carrera", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.motor_servicio_cambiar", "Motor diésel: cambiar aceite + filtros aceite + prefiltro + filtro combustible", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.refrigerante_aditivo_concentracion_comprobar", "Motor diésel: comprobar concentración de aditivo de refrigerante", { action: "comprobar", groupKey: "motor.refrigerante_aditivo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.motor_mangueras_abrazaderas_correa_comprobar", "Motor diésel: controlar mangueras y abrazaderas; comprobar tensión correa trapezoidal", { action: "comprobar", groupKey: "motor.mangueras", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.bateria_acido_nivel_comprobar", "Sistema eléctrico: batería: comprobar nivel de ácido", { action: "comprobar", groupKey: "electrico.bateria_acido", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.bateria_polos_engrasar", "Sistema eléctrico: engrasar polos de la batería", { action: "lubricar", groupKey: "electrico.bateria_polos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.descarga_rodillos_inferior_controlar_limpiar", "Transporte: cinta de descarga: controlar/limpiar rodillos y lado inferior", { action: "limpiar", groupKey: "transporte.descarga_rodillos_inferior", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.aire_comprimido_anticongelante_activar", "Aire comprimido: dispositivo anticongelante: activar (verano/invierno)", { action: "comprobar", groupKey: "aire_comprimido.anticongelante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h250.lubricacion_puntos_lubricar", "Lubricación: lubricar/engrasar puntos de lubricación", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (500 h) (acumula 10 h + 50 h + 250 h)
  addOp("op.wirtgen_w2000.h500.rodillos_std_fcslight_aceite_cambiar", "Grupo fresador: engranaje rodillos (standard y FCSLIGHT): cambiar aceite", { action: "cambiar", groupKey: "fresador.aceite_rodillos_std", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h500.rodillos_fcs_aceite_cambiar", "Grupo fresador: engranaje rodillos (FCS): cambiar aceite", { action: "cambiar", groupKey: "fresador.aceite_rodillos_fcs", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h500.cojinete_rodillo_aceite_cambiar", "Grupo fresador: cojinete del rodillo: cambiar aceite", { action: "cambiar", groupKey: "fresador.aceite_cojinete_rodillo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h500.bomba_hidraulica_aceite_cambiar", "Hidráulico: accionamiento bomba hidráulica: cambiar el aceite", { action: "cambiar", groupKey: "hidraulico.aceite_bomba", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h500.hidraulico_filtro_elemento_cambiar", "Hidráulico: filtros hidráulicos: cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h500.rodadura_aceite_cambiar", "Accionamiento de avance: engranaje de rodadura: cambiar aceite", { action: "cambiar", groupKey: "traslacion.aceite_rodadura", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h500.bomba_agua_aceite_cambiar", "Sistema de agua: bomba de agua: cambiar aceite", { action: "cambiar", groupKey: "agua.bomba_aceite", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (1000 h)
  addOp("op.wirtgen_w2000.h1000.hidraulico_deposito_aceite_cambiar", "Hidráulico (depósito): cambiar aceite", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.h1000.hidraulico_deposito_filtro_limpiar_cambiar", "Hidráulico (depósito): limpiar/cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtro_tanque", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (ANUAL / cada 3 años)
  addOp("op.wirtgen_w2000.y1.radiadores_y_filtros_aire", "Anual: limpiar nervios radiador; limpiar/cambiar insertos filtro aire; controlar separador previo de ciclón; limpiar nervios radiador aceite hidráulico", { action: "limpiar", groupKey: "motor.radiadores", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.y1.combustible_tanque_drenar", "Anual: depósito combustible: drenar tanque", { action: "limpiar", groupKey: "motor.combustible_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.y1.enrollador_manguera_comprobar", "Anual: instalación de limpieza (enrollador de manguera): comprobar", { action: "comprobar", groupKey: "limpieza.enrollador_manguera", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.y1.anticongelante_mecha_limpiar", "Anual: dispositivo anticongelante: limpiar la mecha", { action: "limpiar", groupKey: "aire_comprimido.anticongelante_mecha", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.y1.bomba_relleno_agua_aceite_cambiar", "Anual: bomba de relleno del tanque de agua: cambiar aceite", { action: "cambiar", groupKey: "agua.bomba_relleno_aceite", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wirtgen_w2000.y3.refrigerante_cambiar", "Cada 3 años: cambiar refrigerante del motor", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });

  // Plantilla por modelo (W2000)
  DB.templatesByModel[MODEL_WIRTGEN_W2000] = {
    modelId: MODEL_WIRTGEN_W2000,
    intervals: {
      h10: {
        ops: [
          "op.wirtgen_w2000.h10.seguridad_limpieza_puesto",
          "op.wirtgen_w2000.h10.fresador_control_general",
          "op.wirtgen_w2000.h10.motor_niveles_y_radiadores",
          "op.wirtgen_w2000.h10.motor_separador_agua_filtro_cambiar",
          "op.wirtgen_w2000.h10.hidraulico_niveles_y_radiador",
          "op.wirtgen_w2000.h10.cadenas_y_transporte",
          "op.wirtgen_w2000.h10.agua_sistema_comprobar",
          "op.wirtgen_w2000.h10.aire_comprimido_condensado_evacuar",
          "op.wirtgen_w2000.h10.lubricacion_puntos_lubricar"
        ],
        materials: [
          { matId: "mat.wirtgen_w2000.grasa_engrase", note: "Segun aplicacion" },
          { matId: "mat.wirtgen_w2000.filtro_separador_agua", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w2000.aceite_motor", note: "Relleno si procede (segun nivel)" },
          { matId: "mat.wirtgen_w2000.aceite_hidraulico", note: "Relleno si procede (segun nivel)" },
          { matId: "mat.wirtgen_w2000.refrigerante_motor", note: "Relleno si procede (segun nivel)" },
          { matId: "mat.wirtgen_w2000.agua_deposito", note: "Segun nivel" }
        ],
        torques: []
      },
      h50: {
        ops: [
          "op.wirtgen_w2000.h50.iluminacion_avisos_contactos_comprobar",
          "op.wirtgen_w2000.h50.rodillos_std_fcslight_nivel_aceite_comprobar",
          "op.wirtgen_w2000.h50.rodillos_fcs_nivel_aceite_comprobar",
          "op.wirtgen_w2000.h50.cojinete_rodillo_nivel_aceite_comprobar",
          "op.wirtgen_w2000.h50.rodadura_nivel_aceite_comprobar",
          "op.wirtgen_w2000.h50.bomba_agua_presion_aire_comprobar",
          "op.wirtgen_w2000.h50.bomba_agua_nivel_aceite_comprobar",
          "op.wirtgen_w2000.h50.lubricacion_puntos_lubricar"
        ],
        materials: [
          { matId: "mat.wirtgen_w2000.aceite_engranajes", note: "Solo si hay que rellenar (segun nivel)" },
          { matId: "mat.wirtgen_w2000.grasa_engrase", note: "Segun aplicacion" }
        ],
        torques: []
      },
      h100: {
        ops: [
          "op.wirtgen_w2000.h100.rodillos_std_fcslight_aceite_cambiar",
          "op.wirtgen_w2000.h100.rodillos_fcs_aceite_cambiar",
          "op.wirtgen_w2000.h100.cojinete_rodillo_aceite_cambiar",
          "op.wirtgen_w2000.h100.cambio_rapido_sujeciones_cambiar",
          "op.wirtgen_w2000.h100.fijacion_rodillo_tornillo_reapretar",
          "op.wirtgen_w2000.h100.motor_aceite_cambiar",
          "op.wirtgen_w2000.h100.motor_filtros_aceite_cambiar",
          "op.wirtgen_w2000.h100.motor_prefiltro_combustible_cambiar",
          "op.wirtgen_w2000.h100.motor_filtro_combustible_cambiar",
          "op.wirtgen_w2000.h100.motor_abrazaderas_mangueras_controlar",
          "op.wirtgen_w2000.h100.motor_correa_trapezoidal_tension_comprobar",
          "op.wirtgen_w2000.h100.bomba_hidraulica_aceite_cambiar",
          "op.wirtgen_w2000.h100.hidraulico_filtro_elemento_cambiar",
          "op.wirtgen_w2000.h100.rodadura_aceite_cambiar",
          "op.wirtgen_w2000.h100.bomba_agua_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wirtgen_w2000.aceite_motor", note: "Cambio (cantidad segun capacidad del motor)" },
          { matId: "mat.wirtgen_w2000.filtros_aceite_motor", note: "1 juego (segun configuracion)" },
          { matId: "mat.wirtgen_w2000.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w2000.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w2000.filtro_hidraulico_elemento", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w2000.aceite_bomba_hidraulica", note: "Cantidad segun capacidad del alojamiento" },
          { matId: "mat.wirtgen_w2000.aceite_engranajes", note: "Rodillos/rodadura/cojinete/bomba agua: segun capacidad" }
        ],
        torques: []
      },
      h250: {
        ops: [
          "op.wirtgen_w2000.h250.cambio_rapido_sujeciones_cambiar",
          "op.wirtgen_w2000.h250.cinta_arrastre_tope_rodillo_tensor_controlar",
          "op.wirtgen_w2000.h250.cinta_arrastre_cintas_transmision_controlar",
          "op.wirtgen_w2000.h250.poleas_cintas_arrastre_controlar",
          "op.wirtgen_w2000.h250.interruptor_fin_carrera_controlar",
          "op.wirtgen_w2000.h250.motor_servicio_cambiar",
          "op.wirtgen_w2000.h250.refrigerante_aditivo_concentracion_comprobar",
          "op.wirtgen_w2000.h250.motor_mangueras_abrazaderas_correa_comprobar",
          "op.wirtgen_w2000.h250.bateria_acido_nivel_comprobar",
          "op.wirtgen_w2000.h250.bateria_polos_engrasar",
          "op.wirtgen_w2000.h250.descarga_rodillos_inferior_controlar_limpiar",
          "op.wirtgen_w2000.h250.aire_comprimido_anticongelante_activar",
          "op.wirtgen_w2000.h250.lubricacion_puntos_lubricar"
        ],
        materials: [
          { matId: "mat.wirtgen_w2000.aceite_motor", note: "Cambio (cantidades segun capacidad)" },
          { matId: "mat.wirtgen_w2000.filtros_aceite_motor", note: "Segun configuracion" },
          { matId: "mat.wirtgen_w2000.prefiltro_combustible", note: "Segun plan del equipo" },
          { matId: "mat.wirtgen_w2000.filtro_combustible", note: "Segun plan del equipo" },
          { matId: "mat.wirtgen_w2000.grasa_bornes_bateria", note: "Segun aplicacion" },
          { matId: "mat.wirtgen_w2000.grasa_engrase", note: "Segun aplicacion" },
          { matId: "mat.wirtgen_w2000.agua_destilada_bateria", note: "Segun nivel" },
          { matId: "mat.wirtgen_w2000.alcohol_etilico", note: "Segun nivel/llenado" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.wirtgen_w2000.h500.rodillos_std_fcslight_aceite_cambiar",
          "op.wirtgen_w2000.h500.rodillos_fcs_aceite_cambiar",
          "op.wirtgen_w2000.h500.cojinete_rodillo_aceite_cambiar",
          "op.wirtgen_w2000.h500.bomba_hidraulica_aceite_cambiar",
          "op.wirtgen_w2000.h500.hidraulico_filtro_elemento_cambiar",
          "op.wirtgen_w2000.h500.rodadura_aceite_cambiar",
          "op.wirtgen_w2000.h500.bomba_agua_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wirtgen_w2000.aceite_engranajes", note: "Para cambio (segun capacidad)" },
          { matId: "mat.wirtgen_w2000.aceite_bomba_hidraulica", note: "Para cambio (segun capacidad)" },
          { matId: "mat.wirtgen_w2000.filtro_hidraulico_elemento", qty: 1, unit: "ud" },
          { matId: "mat.wirtgen_w2000.aceite_bomba_agua", note: "Para cambio (segun capacidad)" }
        ],
        torques: []
      },
      h1000: {
        ops: ["op.wirtgen_w2000.h1000.hidraulico_deposito_aceite_cambiar", "op.wirtgen_w2000.h1000.hidraulico_deposito_filtro_limpiar_cambiar"],
        materials: [
          { matId: "mat.wirtgen_w2000.aceite_hidraulico", note: "Cambio completo (cantidad segun capacidad)" },
          { matId: "mat.wirtgen_w2000.filtro_hidraulico_elemento", qty: 1, unit: "ud", note: "Elemento del deposito (si aplica)" }
        ],
        torques: []
      },
      y1: {
        ops: [
          "op.wirtgen_w2000.y1.radiadores_y_filtros_aire",
          "op.wirtgen_w2000.y1.combustible_tanque_drenar",
          "op.wirtgen_w2000.y1.enrollador_manguera_comprobar",
          "op.wirtgen_w2000.y1.anticongelante_mecha_limpiar",
          "op.wirtgen_w2000.y1.bomba_relleno_agua_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wirtgen_w2000.refrigerante_motor", note: "Cada 3 años: cambio (cantidad segun capacidad)" },
          { matId: "mat.wirtgen_w2000.aceite_bomba_relleno_agua", note: "Para cambio (segun capacidad)" },
          { matId: "mat.wirtgen_w2000.alcohol_etilico", note: "Si se rellena" }
        ],
        torques: []
      },
      y3: {
        ops: ["op.wirtgen_w2000.y3.refrigerante_cambiar"],
        materials: [{ matId: "mat.wirtgen_w2000.refrigerante_motor", note: "Cambio (cantidad segun capacidad del circuito)" }],
        torques: []
      }
    }
  };

  // =========================
  // Datos (56006 - VOGELE S1900-2)
  // =========================

  // --- Operaciones (DIARIO)
  addOp("op.vogele_s1900_2.daily.seguridad_puesto_comprobar_limpiar", "Seguridad general del puesto: comprobar y limpiar", { action: "comprobar", groupKey: "seguridad.puesto", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.agua_limpieza_comprobar_rellenar", "Agua de limpieza: comprobar / rellenar (segun sistema)", { action: "comprobar", groupKey: "limpieza.agua_limpieza", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.motor_ruidos_anomalias_estanqueidad_comprobar", "Motor: comprobar ruidos/anomalias y estanqueidad", { action: "comprobar", groupKey: "motor.inspeccion_visual", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.motor_correa_alternador_comprobar", "Motor: comprobar correa del alternador", { action: "comprobar", groupKey: "motor.correa_alternador", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.motor_escape_comprobar", "Motor: comprobar sistema de escape (estado/fugas)", { action: "comprobar", groupKey: "motor.escape", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.motor_combustible_nivel_comprobar", "Motor: comprobar nivel de combustible", { action: "comprobar", groupKey: "motor.combustible_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.motor_aspiracion_aire_comprobar", "Motor: comprobar sistema de aspiracion de aire (estado general)", { action: "comprobar", groupKey: "motor.aspiracion_aire", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.motor_refrigeracion_manguitos_fugas_comprobar", "Motor: comprobar sistema de refrigeracion (manguitos/fugas/estado)", { action: "comprobar", groupKey: "motor.sistema_refrigeracion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.motor_refrigerante_nivel_comprobar", "Motor: comprobar nivel de refrigerante", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.def_adblue_nivel_comprobar", "DEF/AdBlue (si equipa): comprobar nivel", { action: "comprobar", groupKey: "motor.def_adblue", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.hidraulico_nivel_aceite_comprobar", "Hidraulico: comprobar nivel de aceite hidraulico", { action: "comprobar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp(
    "op.vogele_s1900_2.daily.hidraulico_aceite_distribuidor_bomba_comprobar_rellenar",
    "Engranaje distribuidor de bomba: comprobar/rellenar aceite (hasta cambio programado)",
    { action: "comprobar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "MANUAL DE SERVICIO" }
  );
  addOp("op.vogele_s1900_2.daily.electrico_cajas_enchufe_conectores_comprobar", "Electrico: comprobar cajas de enchufe/conectores", { action: "comprobar", groupKey: "electrico.cajas_enchufe", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.electrico_controlador_aislamiento_comprobar", "Electrico: comprobar controlador de aislamiento (si equipa)", { action: "comprobar", groupKey: "electrico.controlador_aislamiento", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.transporte_limpiar_tolva_rodillos_cintas_sinfines", "Transporte de material: limpiar tolva/rodillos/cintas/sinfines", { action: "limpiar", groupKey: "transporte.limpieza_general", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.transporte_engrase_sinfines_comprobar", "Transporte de material: comprobar engrase de sinfines", { action: "comprobar", groupKey: "transporte.engrase_sinfines", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.power_tunnel_limpiar_lubricar", "Power Tunnel: limpiar y lubricar", { action: "limpiar", groupKey: "transporte.power_tunnel", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.cadena_cinta_rascadora_engrasar", "Cadenas de cinta rascadora: engrasar", { action: "lubricar", groupKey: "transporte.cadena_cinta_rascadora", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.agente_separador_comprobar_rellenar", "Instalacion de limpieza/tablón: comprobar/rellenar agente separador", { action: "comprobar", groupKey: "instalacion_limpieza.agente_separador", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.tablon_bloqueo_comprobar_limpiar", "Tablón: comprobar/limpiar bloqueo del tablón", { action: "comprobar", groupKey: "tablon.bloqueo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.daily.lubricacion_central_comprobar_rellenar", "Lubricacion central: comprobar/rellenar", { action: "comprobar", groupKey: "lubricacion.lubricacion_central", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (8 h)
  addOp("op.vogele_s1900_2.h8.espejo_limpiar_sustituir", "Espejo: limpiar (sustituir si es necesario)", { action: "limpiar", groupKey: "cabina.espejo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h8.dispositivos_ascenso_limpiar", "Dispositivos de ascenso: limpiar", { action: "limpiar", groupKey: "seguridad.dispositivos_ascenso", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h8.aceite_motor_comprobar_rellenar", "Aceite del motor: comprobar/rellenar", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h8.valvula_descarga_polvo_limpiar", "Valvula de descarga de polvo: limpiar", { action: "limpiar", groupKey: "motor.valvula_descarga_polvo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h8.sistema_nivelacion_limpiar", "Sistema de nivelacion: limpiar", { action: "limpiar", groupKey: "tablon.sistema_nivelacion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h8.bloqueo_tablon_comprobar_limpiar", "Bloqueo del tablón: comprobar/limpiar", { action: "comprobar", groupKey: "tablon.bloqueo", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (50 h tras puesta en servicio)
  addOp("op.vogele_s1900_2.h50_post.correa_transmision_motor_comprobar", "Correa de transmision (motor): comprobar", { action: "comprobar", groupKey: "motor.cinta_fuerza", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.filtro_aceite_fuga_hid_sustituir", "Hidraulico: sustituir filtro de aceite de fuga", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.filtro_asp_retorno_hid_sustituir", "Hidraulico: sustituir filtro de aspiracion/retorno", { action: "sustituir", groupKey: "hidraulico.filtro_asp_retorno", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.aceite_distribuidor_bomba_cambiar", "Hidraulico: cambiar aceite engranaje del distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.oruga_traslacion_comprobar_tensar", "Oruga del mecanismo de traslacion: comprobar/tensar", { action: "comprobar", groupKey: "traslacion.oruga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.aceite_traslacion_izq_dcha_cambiar", "Traslacion: cambiar aceite engranaje traslacion izq./dcha.", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.cadena_cinta_rascadora_comprobar_tensar_aceitar", "Cadena de cinta rascadora: comprobar/tensar/aceitar", { action: "comprobar", groupKey: "transporte.cadena_cinta_rascadora", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar_engrasar", "Cadenas accionamiento cinta rascadora: comprobar/tensar/engrasar", { action: "comprobar", groupKey: "transporte.cadenas_acc_cinta_rascadora", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.cadenas_acc_sinfin_distrib_comprobar_tensar", "Cadenas accionamiento sinfin de distribucion: comprobar/tensar", { action: "comprobar", groupKey: "transporte.cadena_acc_sinfin_distribucion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h50_post.tension_todas_cadenas_comprobar", "Tension de todas las cadenas: comprobar", { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (500 h)
  addOp("op.vogele_s1900_2.h500.motor_aceite_cambiar", "Motor: cambiar aceite del motor", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.motor_filtro_aceite_sustituir", "Motor: sustituir filtro de aceite del motor", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.motor_filtros_combustible_sustituir_desairear", "Motor: sustituir filtros de combustible y purgar/desairear sistema", { action: "sustituir", groupKey: "motor.filtros_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.motor_filtro_aire_principal_limpiar", "Motor: limpiar filtro de aire principal (admision)", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.motor_abrazaderas_uniones_revisar", "Motor: revisar abrazaderas/uniones (segun plan)", { action: "comprobar", groupKey: "motor.mangueras", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.hidraulico_filtro_bypass_sustituir", "Hidraulico: sustituir filtro de aceite en desvio/by-pass", { action: "sustituir", groupKey: "hidraulico.filtro_bypass", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.traslacion_orugas_comprobar_tensar", "Traslacion: comprobar/tensar orugas", { action: "comprobar", groupKey: "traslacion.oruga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.transporte_cadenas_comprobar_tensar_engrasar", "Transporte: comprobar/tensar/engrasar cadenas", { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.transporte_aceites_engranajes_comprobar_rellenar", "Transporte: comprobar/rellenar aceites de engranajes (segun puntos)", { action: "comprobar", groupKey: "transporte.aceites_engranajes", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.transporte_guias_deslizaderas_lubricar", "Transporte: lubricar guias/deslizaderas (segun plan)", { action: "lubricar", groupKey: "transporte.guias_deslizaderas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.tablon_cilindro_nivelacion_lubricar", "Tablon/conexion: lubricar cilindro de nivelacion", { action: "lubricar", groupKey: "tablon.cilindro_nivelacion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h500.tension_cadenas_general_comprobar", "General: comprobar tension de cadenas", { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (1000 h)
  addOp("op.vogele_s1900_2.h1000.hidraulico_aceite_cambiar", "Hidraulico: cambiar aceite hidraulico", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1000.hidraulico_limpieza_tamiz_tuberias_deposito_desairear", "Hidraulico: limpiar tamiz/tuberias/depÃ³sito y desairear", { action: "limpiar", groupKey: "hidraulico.limpieza_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1000.hidraulico_filtro_aceite_fuga_sustituir", "Hidraulico: sustituir filtro de aceite de fuga", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1000.hidraulico_filtro_asp_retorno_sustituir", "Hidraulico: sustituir filtro de aspiracion/retorno", { action: "sustituir", groupKey: "hidraulico.filtro_asp_retorno", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1000.hidraulico_aceite_distribuidor_bomba_cambiar", "Hidraulico: cambiar aceite engranaje del distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1000.traslacion_aceite_engranaje_cambiar", "Traslacion: cambiar aceite engranaje traslacion izq./dcha.", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1000.transporte_aceites_engranajes_cinta_rascadora_y_sinfines_cambiar", "Transporte: cambiar aceites de engranajes de cinta rascadora y sinfines (segun plan)", { action: "cambiar", groupKey: "transporte.aceites_engranajes", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1000.limpieza_agente_separador_deposito_limpiar", "Instalacion de limpieza: limpiar tamiz/tuberias/depÃ³sito del agente separador", { action: "limpiar", groupKey: "instalacion_limpieza.agente_separador_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1000.motor_aplicar_operaciones_500h_si_procede", "Aplicar ademas operaciones de 500 h si corresponden en el ciclo", { fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones extra
  addOp("op.vogele_s1900_2.h1500.amortiguador_vibraciones_ciguenal_comprobar", "Amortiguador de vibraciones del cigÃ¼eÃ±al: comprobar (1500 h)", { action: "comprobar", groupKey: "motor.amortiguador_vibraciones_ciguenal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h1500.filtro_ventilacion_carcasa_ciguenal_sustituir", "Filtro ventilacion carcasa del cigÃ¼eÃ±al: sustituir (1500 h)", { action: "sustituir", groupKey: "motor.filtro_ventilacion_carcasa_ciguenal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h3000.juego_valvulas_comprobar_ajustar_sat", "Juego de valvulas: comprobar/ajustar (3000 h, servicio tecnico)", { fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h3000.filtro_conducto_def_sustituir", "Filtro del conducto de DEF/AdBlue: sustituir (3000 h)", { action: "sustituir", groupKey: "motor.filtro_conducto_def", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h4500.amortiguador_vibraciones_elastomero_sustituir", "Amortiguador de vibraciones elastomero (cigÃ¼eÃ±al): sustituir (4500 h)", { action: "sustituir", groupKey: "motor.amortiguador_vibraciones_elastomero", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h4500.filtro_unidad_dosificacion_def_sustituir", "Filtro unidad de dosificacion DEF/AdBlue: sustituir (4500 h)", { action: "sustituir", groupKey: "motor.filtro_unidad_dosificacion_def", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h6000.sistema_refrigeracion_lavar", "Sistema de refrigeracion: lavar (6000 h)", { action: "limpiar", groupKey: "motor.sistema_refrigeracion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.h6000.termostatos_comprobar", "Termostatos: comprobar (6000 h)", { action: "comprobar", groupKey: "motor.termostatos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.y1.refrigerador_aire_carga_limpiar", "Refrigerador de aire de carga: limpiar (1 vez al aÃ±o)", { action: "limpiar", groupKey: "motor.refrigerador_aire_carga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_2.y6.refrigerante_cambiar", "Refrigerante: cambiar (cada 6 aÃ±os, hasta -25 ÂºC)", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });

  // --- Materiales extra (S1900-2)
  addMat("mat.vogele_s1900_2.panos_absorbentes", "PaÃ±os absorbentes/celulosa", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_2.filtro_ventilacion_carcasa_ciguenal", "Filtro ventilacion carcasa cigÃ¼eÃ±al", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_2.filtro_conducto_def", "Filtro conducto DEF/AdBlue", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_2.amortiguador_elastomero_ciguenal", "Amortiguador elastomero cigÃ¼eÃ±al", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_2.filtro_unidad_dosificacion_def", "Filtro unidad dosificacion DEF/AdBlue", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_2.limpiador_circuito_refrigeracion", "Agua/limpiador circuito (segun procedimiento)", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_2.limpieza_anual_consumibles", "Aire a presion / agua / limpiador suave", { fuente: "MANUAL DE SERVICIO" });

  // Plantilla por modelo (S1900-2)
  DB.templatesByModel[MODEL_VOGELE_S1900_2] = {
    modelId: MODEL_VOGELE_S1900_2,
    intervals: {
      daily: {
        ops: [
          "op.vogele_s1900_2.daily.seguridad_puesto_comprobar_limpiar",
          "op.vogele_s1900_2.daily.agua_limpieza_comprobar_rellenar",
          "op.vogele_s1900_2.daily.motor_ruidos_anomalias_estanqueidad_comprobar",
          "op.vogele_s1900_2.daily.motor_correa_alternador_comprobar",
          "op.vogele_s1900_2.daily.motor_escape_comprobar",
          "op.vogele_s1900_2.daily.motor_combustible_nivel_comprobar",
          "op.vogele_s1900_2.daily.motor_aspiracion_aire_comprobar",
          "op.vogele_s1900_2.daily.motor_refrigeracion_manguitos_fugas_comprobar",
          "op.vogele_s1900_2.daily.motor_refrigerante_nivel_comprobar",
          "op.vogele_s1900_2.daily.def_adblue_nivel_comprobar",
          "op.vogele_s1900_2.daily.hidraulico_nivel_aceite_comprobar",
          "op.vogele_s1900_2.daily.hidraulico_aceite_distribuidor_bomba_comprobar_rellenar",
          "op.vogele_s1900_2.daily.electrico_cajas_enchufe_conectores_comprobar",
          "op.vogele_s1900_2.daily.electrico_controlador_aislamiento_comprobar",
          "op.vogele_s1900_2.daily.transporte_limpiar_tolva_rodillos_cintas_sinfines",
          "op.vogele_s1900_2.daily.transporte_engrase_sinfines_comprobar",
          "op.vogele_s1900_2.daily.power_tunnel_limpiar_lubricar",
          "op.vogele_s1900_2.daily.cadena_cinta_rascadora_engrasar",
          "op.vogele_s1900_2.daily.agente_separador_comprobar_rellenar",
          "op.vogele_s1900_2.daily.tablon_bloqueo_comprobar_limpiar",
          "op.vogele_s1900_2.daily.lubricacion_central_comprobar_rellenar"
        ],
        materials: [
          { matId: "mat.separador_30l", note: "Hasta 30 L (relleno segun necesidad)" },
          { matId: "mat.grasa_s21", note: "Segun necesidad" },
          { matId: "mat.aceite_motor_10w30_low_saps", note: "Relleno segun necesidad" },
          { matId: "mat.refrigerante_cool_gard_ii", note: "Relleno segun necesidad" },
          { matId: "mat.def_adblue", note: "Relleno segun necesidad (deposito aprox. 21.6 L; si equipa)" }
        ],
        torques: []
      },
      h8: {
        ops: [
          "op.vogele_s1900_2.h8.espejo_limpiar_sustituir",
          "op.vogele_s1900_2.h8.dispositivos_ascenso_limpiar",
          "op.vogele_s1900_2.h8.aceite_motor_comprobar_rellenar",
          "op.vogele_s1900_2.h8.valvula_descarga_polvo_limpiar",
          "op.vogele_s1900_2.h8.sistema_nivelacion_limpiar",
          "op.vogele_s1900_2.h8.bloqueo_tablon_comprobar_limpiar"
        ],
        materials: [{ matId: "mat.aceite_motor_10w30_low_saps", note: "Relleno segun necesidad" }],
        torques: []
      },
      h50_post: {
        ops: [
          "op.vogele_s1900_2.h50_post.correa_transmision_motor_comprobar",
          "op.vogele_s1900_2.h50_post.filtro_aceite_fuga_hid_sustituir",
          "op.vogele_s1900_2.h50_post.filtro_asp_retorno_hid_sustituir",
          "op.vogele_s1900_2.h50_post.aceite_distribuidor_bomba_cambiar",
          "op.vogele_s1900_2.h50_post.oruga_traslacion_comprobar_tensar",
          "op.vogele_s1900_2.h50_post.aceite_traslacion_izq_dcha_cambiar",
          "op.vogele_s1900_2.h50_post.cadena_cinta_rascadora_comprobar_tensar_aceitar",
          "op.vogele_s1900_2.h50_post.cadenas_acc_cinta_rascadora_comprobar_tensar_engrasar",
          "op.vogele_s1900_2.h50_post.cadenas_acc_sinfin_distrib_comprobar_tensar",
          "op.vogele_s1900_2.h50_post.tension_todas_cadenas_comprobar"
        ],
        materials: [
          { matId: "mat.filtro_asp_retorno_hid_elemento", qty: 1, unit: "ud" },
          { matId: "mat.filtro_aceite_fuga_hid", qty: 1, unit: "ud" },
          { matId: "mat.hidraulico_iso_vg46_hvlp", note: "Relleno tras intervencion (cantidad necesaria)" },
          { matId: "mat.aceite_engranajes_std", note: "Segun especificacion (cantidad necesaria)" },
          { matId: "mat.aceite_engranajes_esp", note: "Segun especificacion (cantidad necesaria)" },
          { matId: "mat.grasa_s21", note: "Cadenas: segun necesidad" }
        ],
        torques: [{ where: "Tapa filtro aspiracion/retorno hidraulico", nm: 40, note: "Par tapa (si aplica en este modelo)" }]
      },
      h500: {
        ops: [
          "op.vogele_s1900_2.h500.motor_aceite_cambiar",
          "op.vogele_s1900_2.h500.motor_filtro_aceite_sustituir",
          "op.vogele_s1900_2.h500.motor_filtros_combustible_sustituir_desairear",
          "op.vogele_s1900_2.h500.motor_filtro_aire_principal_limpiar",
          "op.vogele_s1900_2.h500.motor_abrazaderas_uniones_revisar",
          "op.vogele_s1900_2.h500.hidraulico_filtro_bypass_sustituir",
          "op.vogele_s1900_2.h500.traslacion_orugas_comprobar_tensar",
          "op.vogele_s1900_2.h500.transporte_cadenas_comprobar_tensar_engrasar",
          "op.vogele_s1900_2.h500.transporte_aceites_engranajes_comprobar_rellenar",
          "op.vogele_s1900_2.h500.transporte_guias_deslizaderas_lubricar",
          "op.vogele_s1900_2.h500.tablon_cilindro_nivelacion_lubricar",
          "op.vogele_s1900_2.h500.tension_cadenas_general_comprobar"
        ],
        materials: [
          { matId: "mat.aceite_motor_10w30_low_saps", qty: 27.5, unit: "L", note: "Cambio" },
          { matId: "mat.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.filtro_combustible", cantidad: "Juego segun configuracion" },
          { matId: "mat.filtro_hid_bypass", qty: 1, unit: "ud" },
          { matId: "mat.hidraulico_iso_vg46_hvlp", note: "Rellenos segun necesidad" },
          { matId: "mat.aceite_engranajes_std", note: "Segun especificacion (segun punto)" },
          { matId: "mat.aceite_engranajes_esp", note: "Segun especificacion (segun punto)" },
          { matId: "mat.grasa_s21", note: "Segun necesidad" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.vogele_s1900_2.h1000.hidraulico_aceite_cambiar",
          "op.vogele_s1900_2.h1000.hidraulico_limpieza_tamiz_tuberias_deposito_desairear",
          "op.vogele_s1900_2.h1000.hidraulico_filtro_aceite_fuga_sustituir",
          "op.vogele_s1900_2.h1000.hidraulico_filtro_asp_retorno_sustituir",
          "op.vogele_s1900_2.h1000.hidraulico_aceite_distribuidor_bomba_cambiar",
          "op.vogele_s1900_2.h1000.traslacion_aceite_engranaje_cambiar",
          "op.vogele_s1900_2.h1000.transporte_aceites_engranajes_cinta_rascadora_y_sinfines_cambiar",
          "op.vogele_s1900_2.h1000.limpieza_agente_separador_deposito_limpiar",
          "op.vogele_s1900_2.h1000.motor_aplicar_operaciones_500h_si_procede"
        ],
        materials: [
          { matId: "mat.hidraulico_iso_vg46_hvlp", note: "Cambio (cantidad segun capacidad)" },
          { matId: "mat.filtro_asp_retorno_hid_elemento", qty: 1, unit: "ud" },
          { matId: "mat.filtro_aceite_fuga_hid", qty: 1, unit: "ud" },
          { matId: "mat.vogele_s1900_2.panos_absorbentes", note: "Segun necesidad" },
          { matId: "mat.aceite_engranajes_std", note: "Traslacion/cintas/sinfines: cantidad necesaria (segun punto)" },
          { matId: "mat.aceite_engranajes_esp", note: "Traslacion/cintas/sinfines: cantidad necesaria (segun punto)" },
          { matId: "mat.separador_30l", note: "Relleno tras limpieza: hasta 30 L (segun necesidad)" }
        ],
        torques: [{ where: "Tapa filtro aspiracion/retorno hidraulico", nm: 40, note: "Par tapa (si aplica en este modelo)" }]
      },
      h1500: {
        ops: ["op.vogele_s1900_2.h1500.amortiguador_vibraciones_ciguenal_comprobar", "op.vogele_s1900_2.h1500.filtro_ventilacion_carcasa_ciguenal_sustituir"],
        materials: [{ matId: "mat.vogele_s1900_2.filtro_ventilacion_carcasa_ciguenal", qty: 1, unit: "ud" }],
        torques: []
      },
      h3000: {
        ops: ["op.vogele_s1900_2.h3000.juego_valvulas_comprobar_ajustar_sat", "op.vogele_s1900_2.h3000.filtro_conducto_def_sustituir"],
        materials: [{ matId: "mat.vogele_s1900_2.filtro_conducto_def", qty: 1, unit: "ud" }],
        torques: []
      },
      h4500: {
        ops: ["op.vogele_s1900_2.h4500.amortiguador_vibraciones_elastomero_sustituir", "op.vogele_s1900_2.h4500.filtro_unidad_dosificacion_def_sustituir"],
        materials: [
          { matId: "mat.vogele_s1900_2.amortiguador_elastomero_ciguenal", qty: 1, unit: "ud" },
          { matId: "mat.vogele_s1900_2.filtro_unidad_dosificacion_def", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h6000: {
        ops: ["op.vogele_s1900_2.h6000.sistema_refrigeracion_lavar", "op.vogele_s1900_2.h6000.termostatos_comprobar"],
        materials: [
          { matId: "mat.refrigerante_cool_gard_ii", note: "Reposicion segun capacidad (no indicada)" },
          { matId: "mat.vogele_s1900_2.limpiador_circuito_refrigeracion", note: "Segun procedimiento" }
        ],
        torques: []
      },
      y1: {
        ops: ["op.vogele_s1900_2.y1.refrigerador_aire_carga_limpiar"],
        materials: [{ matId: "mat.vogele_s1900_2.limpieza_anual_consumibles", note: "Segun necesidad" }],
        torques: []
      },
      y6: {
        ops: ["op.vogele_s1900_2.y6.refrigerante_cambiar"],
        materials: [{ matId: "mat.refrigerante_cool_gard_ii", note: "Cambio segun capacidad (no indicada)" }],
        torques: []
      }
    }
  };

  // =========================
  // Datos (56007 - VOGELE S1900-3)
  // =========================

  // --- Operaciones (DIARIO / antes de comenzar)
  addOp("op.vogele_s1900_3.daily.pupitre_mando_limpiar_si_necesario", "Pupitre de mando: limpiar (si es necesario)", { action: "limpiar", groupKey: "cabina.pupitre_mando", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.asiento_conductor_cristal_comprobar", "Cristal del asiento del conductor (daños): comprobar", { action: "comprobar", groupKey: "cabina.asiento_conductor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.escaleras_dispositivos_ascenso_limpiar", "Escaleras y dispositivos de ascenso: limpiar", { action: "limpiar", groupKey: "seguridad.dispositivos_ascenso", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.agua_limpieza_revisar_rellenar", "Deposito/recipiente de agua de limpieza: revisar / rellenar", { action: "comprobar", groupKey: "limpieza.agua_limpieza", fuente: "MANUAL DE SERVICIO" });
  addOp(
    "op.vogele_s1900_3.daily.limpieza_tolva_cintas_sinfines_rodillos_empuje",
    "Limpiar: paredes de tolva, cintas rascadoras, tornillos sinfin de distribucion y rodillos de empuje",
    { action: "limpiar", groupKey: "transporte.limpieza_general", fuente: "MANUAL DE SERVICIO" }
  );
  addOp("op.vogele_s1900_3.daily.tension_todas_cadenas_revisar", "Tension de todas las cadenas: revisar", { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.techo_proteccion_revisar", "Techo de proteccion: revisar", { action: "comprobar", groupKey: "seguridad.techo_proteccion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.motor_ruidos_estanqueidad_comprobar", "Motor: comprobar ruidos inusuales y estanqueidad", { action: "comprobar", groupKey: "motor.inspeccion_visual", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.motor_mangueras_abrazaderas_uniones_comprobar", "Motor: comprobar abrazaderas/uniones de mangueras (conexiones)", { action: "comprobar", groupKey: "motor.mangueras", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.motor_aceite_nivel_revisar_rellenar", "Motor: revisar/rellenar nivel de aceite", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.combustible_deposito_revisar", "Deposito de combustible: revisar", { action: "comprobar", groupKey: "motor.combustible_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.refrigeracion_control_visual", "Sistema de refrigeracion: control visual", { action: "comprobar", groupKey: "motor.sistema_refrigeracion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.refrigerante_revisar_rellenar", "Refrigerante motor: revisar / rellenar (segun version)", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.instalacion_limpieza_agente_separador", "Instalacion de limpieza (agente separador): operaciones de limpieza/chequeo del sistema segun plan", { action: "comprobar", groupKey: "instalacion_limpieza.agente_separador_sistema", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.daily.lubricacion_central_llenado_control_visual", "Lubricacion central: llenado / control visual", { action: "comprobar", groupKey: "lubricacion.lubricacion_central", fuente: "MANUAL DE SERVICIO" });
  addOp(
    "op.vogele_s1900_3.daily.sistema_nivelacion_tablon_puntos_lubricar",
    "Engrasar/lubricar puntos del sistema de nivelacion/tablón indicados en el plan",
    { action: "lubricar", groupKey: "tablon.nivelacion_lubricacion", fuente: "MANUAL DE SERVICIO" }
  );

  // --- Operaciones (8 h) (incluye DIARIO)
  addOp("op.vogele_s1900_3.h8.traslacion_orugas_revisar_tensar", "Orugas del mecanismo de traslacion: revisar / tensar", { action: "comprobar", groupKey: "traslacion.oruga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h8.cadena_cinta_rascadora_revisar_tensar_lubricar", "Cadena cinta rascadora: revisar / tensar / lubricar", { action: "comprobar", groupKey: "transporte.cadena_cinta_rascadora", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h8.cadenas_acc_cinta_rascadora_revisar_tensar_lubricar", "Cadenas de accionamiento cinta rascadora: revisar / tensar / lubricar", { action: "comprobar", groupKey: "transporte.cadenas_acc_cinta_rascadora", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h8.cadena_acc_sinfin_distrib_revisar_tensar", "Cadena accionamiento sinfin de distribucion: revisar / tensar", { action: "comprobar", groupKey: "transporte.cadena_acc_sinfin_distribucion", fuente: "MANUAL DE SERVICIO" });
  addOp(
    "op.vogele_s1900_3.h8.vias_deslizantes_ajuste_altura_sinfin_distrib_lubricar",
    "Vias deslizantes/ajuste altura/sinfin de distribucion: lubricar",
    { action: "lubricar", groupKey: "transporte.vias_deslizantes_ajuste_altura", fuente: "MANUAL DE SERVICIO" }
  );

  // --- Operaciones (50 h - unico tras puesta en servicio) (incluye 8 h)
  addOp("op.vogele_s1900_3.h50_post.cinta_fuerza_revisar", "Cinta de fuerza: revisar", { action: "comprobar", groupKey: "motor.cinta_fuerza", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.filtro_succion_reflujo_hid_recambiar", "Hidraulico: recambiar filtro de succion en el reflujo", { action: "sustituir", groupKey: "hidraulico.filtro_succion_reflujo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.filtro_aceite_fuga_hid_recambiar", "Hidraulico: recambiar filtro de aceite de fuga", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.aceite_distribuidor_bomba_recambiar", "Hidraulico: recambiar aceite engranaje del distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.orugas_traslacion_revisar_tensar", "Traslacion: revisar/tensar orugas del mecanismo de traslacion", { action: "comprobar", groupKey: "traslacion.oruga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.aceite_avance_izq_dcho_recambiar", "Traslacion: recambiar aceite engranajes accionamiento de avance izq./dcho.", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.cadena_cinta_rascadora_revisar_tensar_lubricar", "Cadena cinta rascadora: revisar/tensar/lubricar", { action: "comprobar", groupKey: "transporte.cadena_cinta_rascadora", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.cadenas_acc_cinta_rascadora_revisar_tensar_lubricar", "Cadenas accionamiento cinta rascadora: revisar/tensar/lubricar", { action: "comprobar", groupKey: "transporte.cadenas_acc_cinta_rascadora", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.cadena_acc_sinfin_distrib_revisar_tensar", "Cadena accionamiento sinfin de distribucion: revisar/tensar", { action: "comprobar", groupKey: "transporte.cadena_acc_sinfin_distribucion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h50_post.tension_todas_cadenas_revisar", "Tension de todas las cadenas: revisar", { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (500 h - acumulativo)
  addOp("op.vogele_s1900_3.h500.aceite_motor_recambiar", "Motor: recambiar aceite del motor", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h500.filtro_aceite_motor_recambiar", "Motor: recambiar filtro de aceite del motor", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h500.filtro_combustible_recambiar", "Motor: recambiar filtro de combustible", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h500.prefiltro_combustible_control_desaguar", "Motor: prefiltro combustible: control visual / desaguar (y recambio si procede segun plan)", { action: "comprobar", groupKey: "motor.filtro_previo_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h500.filtro_aire_principal_limpiar_sustituir", "Motor: filtro de aire (principal): limpiar / sustituir segun estado", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h500.cinta_fuerza_revisar", "Motor: revisar cinta de fuerza", { action: "comprobar", groupKey: "motor.cinta_fuerza", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h500.filtro_hid_bypass_recambiar", "Hidraulico: recambiar filtro de aceite en desvio (by-pass)", { action: "sustituir", groupKey: "hidraulico.filtro_bypass", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h500.orugas_revisar_tensar", "Traslacion: orugas: revisar / tensar", { action: "comprobar", groupKey: "traslacion.oruga", fuente: "MANUAL DE SERVICIO" });
  addOp(
    "op.vogele_s1900_3.h500.transporte_tension_cadenas_y_lubricaciones",
    "Transporte/distribucion: mantener/revisar tension cadenas y lubricaciones segun plan (cinta rascadora y sinfines)",
    { action: "comprobar", groupKey: "transporte.tension_cadenas", fuente: "MANUAL DE SERVICIO" }
  );
  addOp("op.vogele_s1900_3.h500.lubricaciones_tablon_vias_deslizantes", "Lubricaciones (vias deslizantes/ajustes/tablón) segun puntos del plan", { action: "lubricar", groupKey: "transporte.vias_deslizantes_ajuste_altura", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (1000 h - acumulativo)
  addOp(
    "op.vogele_s1900_3.h1000.aceite_hidraulico_recambiar_y_limpieza",
    "Hidraulico: recambiar aceite hidraulico y limpiar tamiz/tubuladura/depÃ³sito hidraulico",
    { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" }
  );
  addOp("op.vogele_s1900_3.h1000.filtro_succion_reflujo_hid_recambiar", "Hidraulico: recambiar filtro de succion en reflujo", { action: "sustituir", groupKey: "hidraulico.filtro_succion_reflujo", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h1000.filtro_aceite_fuga_hid_recambiar", "Hidraulico: recambiar filtro de aceite de fuga", { action: "sustituir", groupKey: "hidraulico.filtro_aceite_fuga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h1000.aceite_distribuidor_bomba_recambiar", "Hidraulico: recambiar aceite engranajes del distribuidor de bomba", { action: "cambiar", groupKey: "hidraulico.aceite_distribucion_bombas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h1000.aceite_avance_izq_dcho_recambiar", "Traslacion: recambiar aceite engranajes accionamiento avance izq./dcho.", { action: "cambiar", groupKey: "traslacion.aceite_engranaje", fuente: "MANUAL DE SERVICIO" });
  addOp(
    "op.vogele_s1900_3.h1000.aceite_engranajes_cinta_rascadora_izq_dcha_recambiar",
    "Transporte/distribucion: recambiar aceite engranajes cinta rascadora izq./dcha.",
    { action: "cambiar", groupKey: "transporte.aceite_engranaje_cinta_rascadora", fuente: "MANUAL DE SERVICIO" }
  );
  addOp(
    "op.vogele_s1900_3.h1000.aceite_engranajes_sinfin_distribucion_recambiar",
    "Transporte/distribucion: recambiar aceite engranajes tornillos sinfin de distribucion",
    { action: "cambiar", groupKey: "transporte.aceite_engranaje_sinfin_distribucion", fuente: "MANUAL DE SERVICIO" }
  );
  addOp(
    "op.vogele_s1900_3.h1000.instalacion_limpieza_agente_separador_limpiar",
    "Instalacion de limpieza (agente separador): limpiar tamiz/tubuladura/depÃ³sito del agente separador",
    { action: "limpiar", groupKey: "instalacion_limpieza.agente_separador_deposito", fuente: "MANUAL DE SERVICIO" }
  );

  // --- Operaciones extra del plan
  addOp("op.vogele_s1900_3.y1.radiador_aire_carga_limpiar", "Radiador de aire de carga: limpiar (anual)", { action: "limpiar", groupKey: "motor.refrigerador_aire_carga", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.y6.refrigerante_recambiar", "Refrigerante: recambiar (cada 6 aÃ±os, hasta -25 ÂºC)", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h3000.juego_valvulas_comprobar_ajustar_sat", "Juego de valvulas: comprobar/ajustar (3000 h, servicio tecnico)", { fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h3000.filtro_conducto_def_sustituir", "Filtro del conducto de DEF: sustituir (3000 h)", { action: "sustituir", groupKey: "motor.filtro_conducto_def", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h4500.amortiguador_vibraciones_elastomero_sustituir", "Amortiguador vibraciones elastomero cigÃ¼eÃ±al: sustituir (4500 h)", { action: "sustituir", groupKey: "motor.amortiguador_vibraciones_elastomero", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h4500.filtro_unidad_dosificacion_def_sustituir", "Filtro unidad dosificacion DEF: sustituir (4500 h)", { action: "sustituir", groupKey: "motor.filtro_unidad_dosificacion_def", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h6000.sistema_refrigeracion_lavar", "Sistema de refrigeracion: lavar (6000 h)", { action: "limpiar", groupKey: "motor.sistema_refrigeracion", fuente: "MANUAL DE SERVICIO" });
  addOp("op.vogele_s1900_3.h6000.termostatos_comprobar", "Termostatos: comprobar (6000 h)", { action: "comprobar", groupKey: "motor.termostatos", fuente: "MANUAL DE SERVICIO" });

  // --- Materiales (S1900-3)
  addMat("mat.vogele_s1900_3.producto_limpieza_2050174", "Producto de limpieza (ref. 2050174)", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.agente_separador", "Agente separador", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.detergente_limpiacristales", "Detergente de cristal adecuado", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.aceite_motor", "Aceite de motor", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.refrigerante_mezcla_menos35", "Refrigerante (mezcla agua + anticongelante hasta -35 ÂºC)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.grasa_especial", "Grasas lubricantes especiales", { fuente: "MANUAL DE SERVICIO" });

  addMat("mat.vogele_s1900_3.filtro_succion_reflujo_hid", "Elemento filtrante filtro succion en reflujo (hidraulico)", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.filtro_aceite_fuga_hid", "Elemento filtrante filtro aceite de fuga (hidraulico)", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.filtro_aceite_motor", "Filtro de aceite del motor", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.filtro_hid_bypass", "Filtro by-pass hidraulico", { unit: "ud", fuente: "MANUAL DE SERVICIO" });

  addMat("mat.vogele_s1900_3.aceite_hidraulico", "Aceite hidraulico", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.aceite_engranaje_especial_distrib_bomba", "Aceite engranajes especial (distribuidor de bomba)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.aceite_engranaje_especial_avance", "Aceite engranajes especial (avance izq./dcho.)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.vogele_s1900_3.aceite_engranaje_std_transporte", "Aceite engranajes estandar (cinta rascadora / sinfin distribucion)", { unit: "L", fuente: "MANUAL DE SERVICIO" });

  // Plantilla por modelo (S1900-3)
  DB.templatesByModel[MODEL_VOGELE_S1900_3] = {
    modelId: MODEL_VOGELE_S1900_3,
    intervals: {
      daily: {
        ops: [
          "op.vogele_s1900_3.daily.pupitre_mando_limpiar_si_necesario",
          "op.vogele_s1900_3.daily.asiento_conductor_cristal_comprobar",
          "op.vogele_s1900_3.daily.escaleras_dispositivos_ascenso_limpiar",
          "op.vogele_s1900_3.daily.agua_limpieza_revisar_rellenar",
          "op.vogele_s1900_3.daily.limpieza_tolva_cintas_sinfines_rodillos_empuje",
          "op.vogele_s1900_3.daily.tension_todas_cadenas_revisar",
          "op.vogele_s1900_3.daily.techo_proteccion_revisar",
          "op.vogele_s1900_3.daily.motor_ruidos_estanqueidad_comprobar",
          "op.vogele_s1900_3.daily.motor_mangueras_abrazaderas_uniones_comprobar",
          "op.vogele_s1900_3.daily.motor_aceite_nivel_revisar_rellenar",
          "op.vogele_s1900_3.daily.combustible_deposito_revisar",
          "op.vogele_s1900_3.daily.refrigeracion_control_visual",
          "op.vogele_s1900_3.daily.refrigerante_revisar_rellenar",
          "op.vogele_s1900_3.daily.instalacion_limpieza_agente_separador",
          "op.vogele_s1900_3.daily.lubricacion_central_llenado_control_visual",
          "op.vogele_s1900_3.daily.sistema_nivelacion_tablon_puntos_lubricar"
        ],
        materials: [],
        torques: []
      },
      h8: {
        ops: [
          "op.vogele_s1900_3.h8.traslacion_orugas_revisar_tensar",
          "op.vogele_s1900_3.h8.cadena_cinta_rascadora_revisar_tensar_lubricar",
          "op.vogele_s1900_3.h8.cadenas_acc_cinta_rascadora_revisar_tensar_lubricar",
          "op.vogele_s1900_3.h8.cadena_acc_sinfin_distrib_revisar_tensar",
          "op.vogele_s1900_3.h8.vias_deslizantes_ajuste_altura_sinfin_distrib_lubricar"
        ],
        materials: [
          { matId: "mat.vogele_s1900_3.producto_limpieza_2050174", note: "Segun necesidad (limpieza pupitre)" },
          { matId: "mat.vogele_s1900_3.agente_separador", note: "Segun necesidad (tolva/cintas/sinfines/rodillos)" },
          { matId: "mat.vogele_s1900_3.detergente_limpiacristales", cantidad: "1.9 L" },
          { matId: "mat.vogele_s1900_3.aceite_motor", note: "Segun necesidad (relleno nivel)" },
          {
            matId: "mat.vogele_s1900_3.refrigerante_mezcla_menos35",
            cantidad: "SUPER 1900-3 / 2100-3: Agua 16 L + Anticongelante 11 L; SUPER 1900-3i / 2100-3i: Agua 19 L + Anticongelante 13 L"
          },
          { matId: "mat.vogele_s1900_3.grasa_especial", note: "Segun engrase (orugas/cadenas/vias/lubricacion central...)" }
        ],
        torques: []
      },
      h50_post: {
        ops: [
          "op.vogele_s1900_3.h50_post.cinta_fuerza_revisar",
          "op.vogele_s1900_3.h50_post.filtro_succion_reflujo_hid_recambiar",
          "op.vogele_s1900_3.h50_post.filtro_aceite_fuga_hid_recambiar",
          "op.vogele_s1900_3.h50_post.aceite_distribuidor_bomba_recambiar",
          "op.vogele_s1900_3.h50_post.orugas_traslacion_revisar_tensar",
          "op.vogele_s1900_3.h50_post.aceite_avance_izq_dcho_recambiar",
          "op.vogele_s1900_3.h50_post.cadena_cinta_rascadora_revisar_tensar_lubricar",
          "op.vogele_s1900_3.h50_post.cadenas_acc_cinta_rascadora_revisar_tensar_lubricar",
          "op.vogele_s1900_3.h50_post.cadena_acc_sinfin_distrib_revisar_tensar",
          "op.vogele_s1900_3.h50_post.tension_todas_cadenas_revisar"
        ],
        materials: [
          { matId: "mat.vogele_s1900_3.filtro_succion_reflujo_hid", qty: 1, unit: "ud", note: "Ver catalogo repuestos" },
          { matId: "mat.vogele_s1900_3.filtro_aceite_fuga_hid", qty: 1, unit: "ud", note: "Ver catalogo repuestos" },
          { matId: "mat.vogele_s1900_3.aceite_engranaje_especial_distrib_bomba", cantidad: "6.0 L" },
          { matId: "mat.vogele_s1900_3.aceite_engranaje_especial_avance", cantidad: "3.5 L" },
          { matId: "mat.vogele_s1900_3.grasa_especial", note: "Segun engrase (cadenas/orugas)" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.vogele_s1900_3.h500.aceite_motor_recambiar",
          "op.vogele_s1900_3.h500.filtro_aceite_motor_recambiar",
          "op.vogele_s1900_3.h500.filtro_combustible_recambiar",
          "op.vogele_s1900_3.h500.prefiltro_combustible_control_desaguar",
          "op.vogele_s1900_3.h500.filtro_aire_principal_limpiar_sustituir",
          "op.vogele_s1900_3.h500.cinta_fuerza_revisar",
          "op.vogele_s1900_3.h500.filtro_hid_bypass_recambiar",
          "op.vogele_s1900_3.h500.orugas_revisar_tensar",
          "op.vogele_s1900_3.h500.transporte_tension_cadenas_y_lubricaciones",
          "op.vogele_s1900_3.h500.lubricaciones_tablon_vias_deslizantes"
        ],
        materials: [
          { matId: "mat.vogele_s1900_3.aceite_motor", cantidad: "SUPER 1900-3 / 1900-3i: ~23 L; SUPER 2100-3 / 2100-3i: ~24.5 L" },
          { matId: "mat.vogele_s1900_3.filtro_aceite_motor", qty: 1, unit: "ud", note: "Ver catalogo repuestos" },
          { matId: "mat.vogele_s1900_3.filtro_combustible", qty: 1, unit: "ud", note: "Ver catalogo repuestos" },
          { matId: "mat.vogele_s1900_3.filtro_hid_bypass", qty: 1, unit: "ud", note: "Ver catalogo repuestos" },
          { matId: "mat.vogele_s1900_3.grasa_especial", note: "Segun engrase" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.vogele_s1900_3.h1000.aceite_hidraulico_recambiar_y_limpieza",
          "op.vogele_s1900_3.h1000.filtro_succion_reflujo_hid_recambiar",
          "op.vogele_s1900_3.h1000.filtro_aceite_fuga_hid_recambiar",
          "op.vogele_s1900_3.h1000.aceite_distribuidor_bomba_recambiar",
          "op.vogele_s1900_3.h1000.aceite_avance_izq_dcho_recambiar",
          "op.vogele_s1900_3.h1000.aceite_engranajes_cinta_rascadora_izq_dcha_recambiar",
          "op.vogele_s1900_3.h1000.aceite_engranajes_sinfin_distribucion_recambiar",
          "op.vogele_s1900_3.h1000.instalacion_limpieza_agente_separador_limpiar"
        ],
        materials: [
          { matId: "mat.vogele_s1900_3.aceite_hidraulico", cantidad: "350 L" },
          { matId: "mat.vogele_s1900_3.filtro_succion_reflujo_hid", qty: 1, unit: "ud", note: "Ver catalogo repuestos" },
          { matId: "mat.vogele_s1900_3.filtro_aceite_fuga_hid", qty: 1, unit: "ud", note: "Ver catalogo repuestos" },
          { matId: "mat.vogele_s1900_3.aceite_engranaje_especial_distrib_bomba", cantidad: "6.0 L" },
          { matId: "mat.vogele_s1900_3.aceite_engranaje_especial_avance", cantidad: "3.5 L" },
          { matId: "mat.vogele_s1900_3.aceite_engranaje_std_transporte", cantidad: "Cinta rascadora izq./dcha.: 1.3 L; Tornillos sin fin distribucion: 1.3 L" },
          { matId: "mat.vogele_s1900_3.grasa_especial", note: "Segun engrase" }
        ],
        torques: []
      },
      y1: {
        ops: ["op.vogele_s1900_3.y1.radiador_aire_carga_limpiar"],
        materials: [],
        torques: []
      },
      y6: {
        ops: ["op.vogele_s1900_3.y6.refrigerante_recambiar"],
        materials: [],
        torques: []
      },
      h3000: {
        ops: ["op.vogele_s1900_3.h3000.juego_valvulas_comprobar_ajustar_sat", "op.vogele_s1900_3.h3000.filtro_conducto_def_sustituir"],
        materials: [],
        torques: []
      },
      h4500: {
        ops: [
          "op.vogele_s1900_3.h4500.amortiguador_vibraciones_elastomero_sustituir",
          "op.vogele_s1900_3.h4500.filtro_unidad_dosificacion_def_sustituir"
        ],
        materials: [],
        torques: []
      },
      h6000: {
        ops: ["op.vogele_s1900_3.h6000.sistema_refrigeracion_lavar", "op.vogele_s1900_3.h6000.termostatos_comprobar"],
        materials: [],
        torques: []
      }
    }
  };


  // =========================
  // Datos (57007 - WM1000)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.wm1000.h10.chasis_cierre_contenedor_comprobar", "Chasis: cierre del contenedor: comprobar que esté firmemente asentado", { action: "comprobar", groupKey: "chasis.cierre_contenedor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.rodaje_ruedas_forro_goma_comprobar", "Ruedas/bandajes: comprobar forro de goma", { action: "comprobar", groupKey: "rodaje.forro_goma", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.rodaje_presion_neumaticos_comprobar", "Ruedas/bandajes: comprobar presión de neumáticos", { action: "comprobar", groupKey: "rodaje.presion_neumaticos", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h10.combustible_nivel_comprobar", "Tanque de combustible: comprobar nivel (varias veces)", { action: "comprobar", groupKey: "motor.combustible_deposito", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.prefiltro_combustible_desaguar", "Prefiltro de combustible: desaguar", { action: "limpiar", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.motor_aceite_nivel_comprobar", "Motor: comprobar nivel de aceite", { action: "comprobar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.filtro_aire_comprobar", "Filtro de aire: comprobar", { action: "comprobar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.refrigerante_nivel_comprobar", "Refrigerante: comprobar nivel", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.radiador_motor_comprobar", "Radiador motor: comprobar", { action: "comprobar", groupKey: "motor.radiador_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.radiador_aire_cargado_controlar", "Radiador aire cargado: controlar", { action: "comprobar", groupKey: "motor.radiador_aire_carga", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h10.hidraulico_tanque_nivel_comprobar", "Hidráulico: tanque aceite hidráulico: comprobar nivel", { action: "comprobar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.hidraulico_filtros_ensuciamiento_comprobar", "Hidráulico: filtros hidráulicos: comprobar ensuciamiento (varias veces)", { action: "comprobar", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.hidraulico_radiador_aceite_nervios_comprobar", "Hidráulico: radiador de aceite: comprobar nervios (varias veces)", { action: "comprobar", groupKey: "hidraulico.radiador_aceite", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.hidraulico_accionamiento_bomba_nivel_aceite_comprobar", "Hidráulico: accionamiento de la bomba: comprobar nivel de aceite", { action: "comprobar", groupKey: "hidraulico.aceite_bomba", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h10.agua_tanque_nivel_comprobar", "Agua/lavado: tanque de agua: comprobar nivel (varias veces)", { action: "comprobar", groupKey: "agua.tanque_nivel", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.agua_filtros_elemento_filtrante_comprobar", "Agua/lavado: filtros (agua): comprobar elemento filtrante", { action: "comprobar", groupKey: "agua.filtro", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.lavado_alta_presion_filtro_comprobar", "Agua/lavado: sistema de lavado alta presión: comprobar elemento filtrante", { action: "comprobar", groupKey: "lavado_alta_presion.filtro", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h10.suspension_bomba_control_fugas", "Suspensión: bomba de suspensión: control de fugas", { action: "comprobar", groupKey: "suspension.bomba_fugas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.bomba_agua_control_fugas", "Suspensión: bomba de agua: control de fugas", { action: "comprobar", groupKey: "agua.bomba_fugas", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h10.lubricacion_puntos_lubricar", "Lubricación: puntos de lubricación (global): lubricar/engrasar", { action: "lubricar", groupKey: "lubricacion.puntos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h10.lubricacion_central_nivel_comprobar", "Lubricación: sistema de lubricación central: comprobar nivel", { action: "comprobar", groupKey: "lubricacion.central", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (50 h - rodaje) (incluye 10 h)
  addOp("op.wm1000.h50_post.motor_aceite_cambiar", "Rodaje (50 h): motor: cambiar aceite", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h50_post.motor_filtro_aceite_cambiar", "Rodaje (50 h): motor: cambiar filtro de aceite", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h50_post.prefiltro_combustible_limpiar_cambiar", "Rodaje (50 h): prefiltro combustible: limpiar / cambiar", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h50_post.filtro_combustible_cambiar", "Rodaje (50 h): filtro de combustible: cambiar", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h50_post.juego_valvulas_comprobar", "Rodaje (50 h): juego de válvulas: comprobar", { action: "comprobar", groupKey: "motor.juego_valvulas", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h50_post.correa_trapezoidal_tension_comprobar", "Rodaje (50 h): correa trapezoidal: comprobar tensión", { action: "comprobar", groupKey: "motor.correa_trapezoidal", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h50_post.hidraulico_filtro_elemento_cambiar", "Rodaje (50 h): hidráulico: filtros hidráulicos: cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h50_post.hidraulico_accionamiento_bomba_aceite_cambiar", "Rodaje (50 h): hidráulico: accionamiento de la bomba: cambiar aceite", { action: "cambiar", groupKey: "hidraulico.aceite_bomba", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h50_post.suspension_engranaje_aceite_cambiar", "Rodaje (50 h): suspensión: engranaje: cambiar aceite", { action: "cambiar", groupKey: "suspension.aceite_engranaje", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h50_post.mezcladora_aceite_cambiar", "Rodaje (50 h): mezcladora: cambiar aceite", { action: "cambiar", groupKey: "mezcladora.aceite", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (100 h)
  addOp("op.wm1000.h100.remolque_husillo_roscado_engrasar", "Lubricación (remolque): engrasar el husillo roscado", { action: "lubricar", groupKey: "remolque.husillo", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (250 h)
  addOp("op.wm1000.h250.correa_trapezoidal_tension_comprobar", "Correa trapezoidal: comprobar tensión", { action: "comprobar", groupKey: "motor.correa_trapezoidal", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (500 h)
  addOp("op.wm1000.h500.motor_aceite_cambiar", "Motor: cambiar aceite", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h500.motor_filtro_aceite_cambiar", "Motor: cambiar filtro de aceite", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h500.prefiltro_combustible_limpiar_cambiar", "Prefiltro combustible: limpiar / cambiar", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h500.filtro_combustible_cambiar", "Filtro de combustible: cambiar", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h500.hidraulico_tanque_aceite_cambiar", "Hidráulico: tanque aceite hidráulico: cambiar aceite", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h500.hidraulico_filtro_elemento_cambiar", "Hidráulico: filtros hidráulicos: cambiar elemento filtrante", { action: "sustituir", groupKey: "hidraulico.filtros_hidraulicos", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h500.hidraulico_accionamiento_bomba_aceite_cambiar", "Hidráulico: accionamiento de la bomba: cambiar aceite", { action: "cambiar", groupKey: "hidraulico.aceite_bomba", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h500.baterias_acido_nivel_comprobar", "Eléctrico: baterías: comprobar nivel de ácido", { action: "comprobar", groupKey: "electrico.bateria_acido", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h500.baterias_agua_destilada_rellenar", "Eléctrico: baterías: rellenar agua destilada", { action: "comprobar", groupKey: "electrico.bateria_agua_destilada", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h500.suspension_engranaje_aceite_cambiar", "Suspensión: engranaje: cambiar aceite", { action: "cambiar", groupKey: "suspension.aceite_engranaje", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h500.mezcladora_aceite_cambiar", "Mezcladora: cambiar aceite", { action: "cambiar", groupKey: "mezcladora.aceite", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (1000 h)
  addOp("op.wm1000.h1000.motor_aceite_cambiar", "Motor: cambiar aceite", { action: "cambiar", groupKey: "motor.aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h1000.motor_filtro_aceite_cambiar", "Motor: cambiar filtro de aceite", { action: "sustituir", groupKey: "motor.filtro_aceite_motor", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h1000.prefiltro_combustible_limpiar_cambiar", "Prefiltro combustible: limpiar / cambiar", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h1000.filtro_combustible_cambiar", "Filtro de combustible: cambiar", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h1000.refrigerante_cambiar", "Refrigerante: cambiar", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h1000.filtro_aire_limpiar_cambiar", "Elemento filtrante de aire: limpiar o cambiar", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO" });

  addOp("op.wm1000.h1000.hidraulico_tanque_aceite_cambiar", "Hidráulico: tanque aceite hidráulico: cambiar aceite", { action: "cambiar", groupKey: "hidraulico.aceite_hidraulico", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h1000.hidraulico_accionamiento_bomba_aceite_cambiar", "Hidráulico: accionamiento de la bomba: cambiar aceite", { action: "cambiar", groupKey: "hidraulico.aceite_bomba", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h1000.suspension_engranaje_aceite_cambiar", "Suspensión: engranaje: cambiar aceite", { action: "cambiar", groupKey: "suspension.aceite_engranaje", fuente: "MANUAL DE SERVICIO" });
  addOp("op.wm1000.h1000.mezcladora_aceite_cambiar", "Mezcladora: cambiar aceite", { action: "cambiar", groupKey: "mezcladora.aceite", fuente: "MANUAL DE SERVICIO" });

  // --- Operaciones (anual)
  addOp("op.wm1000.y1.dispositif_antigel_mecha_limpiar", "Dispositif antigel: limpieza de la mecha (1 vez al año)", { action: "limpiar", groupKey: "aire_comprimido.anticongelante_mecha", fuente: "MANUAL DE SERVICIO" });

  // --- Materiales (WM1000)
  addMat("mat.wm1000.grasa_lubricacion", "Grasa/aceite de lubricación", { fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.aceite_motor", "Aceite motor", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.filtro_aceite_motor", "Filtro de aceite motor", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.prefiltro_combustible", "Prefiltro combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.filtro_combustible", "Filtro combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.aceite_hidraulico", "Aceite hidráulico", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.filtro_hidraulico", "Elemento filtrante hidráulico", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.refrigerante", "Refrigerante", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.filtro_aire", "Elemento filtrante de aire", { unit: "ud", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.agua_destilada_bateria", "Agua destilada (baterías)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.aceite_accionamiento_bomba", "Aceite accionamiento de la bomba", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.aceite_engranaje_suspension", "Aceite engranaje (suspensión)", { unit: "L", fuente: "MANUAL DE SERVICIO" });
  addMat("mat.wm1000.aceite_mezcladora", "Aceite mezcladora", { unit: "L", fuente: "MANUAL DE SERVICIO" });

  // Plantilla por modelo (WM1000)
  DB.templatesByModel[MODEL_WM1000] = {
    modelId: MODEL_WM1000,
    intervals: {
      h10: {
        ops: [
          "op.wm1000.h10.chasis_cierre_contenedor_comprobar",
          "op.wm1000.h10.rodaje_ruedas_forro_goma_comprobar",
          "op.wm1000.h10.rodaje_presion_neumaticos_comprobar",
          "op.wm1000.h10.combustible_nivel_comprobar",
          "op.wm1000.h10.prefiltro_combustible_desaguar",
          "op.wm1000.h10.motor_aceite_nivel_comprobar",
          "op.wm1000.h10.filtro_aire_comprobar",
          "op.wm1000.h10.refrigerante_nivel_comprobar",
          "op.wm1000.h10.radiador_motor_comprobar",
          "op.wm1000.h10.radiador_aire_cargado_controlar",
          "op.wm1000.h10.hidraulico_tanque_nivel_comprobar",
          "op.wm1000.h10.hidraulico_filtros_ensuciamiento_comprobar",
          "op.wm1000.h10.hidraulico_radiador_aceite_nervios_comprobar",
          "op.wm1000.h10.hidraulico_accionamiento_bomba_nivel_aceite_comprobar",
          "op.wm1000.h10.agua_tanque_nivel_comprobar",
          "op.wm1000.h10.agua_filtros_elemento_filtrante_comprobar",
          "op.wm1000.h10.lavado_alta_presion_filtro_comprobar",
          "op.wm1000.h10.suspension_bomba_control_fugas",
          "op.wm1000.h10.bomba_agua_control_fugas",
          "op.wm1000.h10.lubricacion_puntos_lubricar",
          "op.wm1000.h10.lubricacion_central_nivel_comprobar"
        ],
        materials: [{ matId: "mat.wm1000.grasa_lubricacion", note: "Segun necesidad (cantidades no indicadas)" }],
        torques: []
      },
      h50_post: {
        ops: [
          "op.wm1000.h50_post.motor_aceite_cambiar",
          "op.wm1000.h50_post.motor_filtro_aceite_cambiar",
          "op.wm1000.h50_post.prefiltro_combustible_limpiar_cambiar",
          "op.wm1000.h50_post.filtro_combustible_cambiar",
          "op.wm1000.h50_post.juego_valvulas_comprobar",
          "op.wm1000.h50_post.correa_trapezoidal_tension_comprobar",
          "op.wm1000.h50_post.hidraulico_filtro_elemento_cambiar",
          "op.wm1000.h50_post.hidraulico_accionamiento_bomba_aceite_cambiar",
          "op.wm1000.h50_post.suspension_engranaje_aceite_cambiar",
          "op.wm1000.h50_post.mezcladora_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wm1000.aceite_motor", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.filtro_aceite_motor", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.prefiltro_combustible", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.filtro_combustible", note: "Cantidades no indicadas (segun configuracion)" },
          { matId: "mat.wm1000.filtro_hidraulico", qty: 1, unit: "ud", note: "Sin referencia en tabla" },
          { matId: "mat.wm1000.aceite_accionamiento_bomba", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.aceite_engranaje_suspension", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.aceite_mezcladora", note: "Cantidades no indicadas" }
        ],
        torques: []
      },
      h100: {
        ops: ["op.wm1000.h100.remolque_husillo_roscado_engrasar"],
        materials: [{ matId: "mat.wm1000.grasa_lubricacion", note: "Segun necesidad" }],
        torques: []
      },
      h250: { ops: ["op.wm1000.h250.correa_trapezoidal_tension_comprobar"], materials: [], torques: [] },
      h500: {
        ops: [
          "op.wm1000.h500.motor_aceite_cambiar",
          "op.wm1000.h500.motor_filtro_aceite_cambiar",
          "op.wm1000.h500.prefiltro_combustible_limpiar_cambiar",
          "op.wm1000.h500.filtro_combustible_cambiar",
          "op.wm1000.h500.hidraulico_tanque_aceite_cambiar",
          "op.wm1000.h500.hidraulico_filtro_elemento_cambiar",
          "op.wm1000.h500.hidraulico_accionamiento_bomba_aceite_cambiar",
          "op.wm1000.h500.baterias_acido_nivel_comprobar",
          "op.wm1000.h500.baterias_agua_destilada_rellenar",
          "op.wm1000.h500.suspension_engranaje_aceite_cambiar",
          "op.wm1000.h500.mezcladora_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wm1000.aceite_motor", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.filtro_aceite_motor", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.prefiltro_combustible", note: "Unidades segun configuracion" },
          { matId: "mat.wm1000.filtro_combustible", note: "Unidades segun configuracion" },
          { matId: "mat.wm1000.aceite_hidraulico", note: "Cantidad no indicada" },
          { matId: "mat.wm1000.filtro_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.wm1000.aceite_accionamiento_bomba", note: "Cantidad no indicada" },
          { matId: "mat.wm1000.aceite_engranaje_suspension", note: "Cantidad no indicada" },
          { matId: "mat.wm1000.aceite_mezcladora", note: "Cantidad no indicada" },
          { matId: "mat.wm1000.agua_destilada_bateria", note: "Segun nivel" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.wm1000.h1000.motor_aceite_cambiar",
          "op.wm1000.h1000.motor_filtro_aceite_cambiar",
          "op.wm1000.h1000.prefiltro_combustible_limpiar_cambiar",
          "op.wm1000.h1000.filtro_combustible_cambiar",
          "op.wm1000.h1000.refrigerante_cambiar",
          "op.wm1000.h1000.filtro_aire_limpiar_cambiar",
          "op.wm1000.h1000.hidraulico_tanque_aceite_cambiar",
          "op.wm1000.h1000.hidraulico_accionamiento_bomba_aceite_cambiar",
          "op.wm1000.h1000.suspension_engranaje_aceite_cambiar",
          "op.wm1000.h1000.mezcladora_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.wm1000.aceite_motor", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.filtro_aceite_motor", note: "Cantidades no indicadas" },
          { matId: "mat.wm1000.prefiltro_combustible", note: "Unidades segun configuracion" },
          { matId: "mat.wm1000.filtro_combustible", note: "Unidades segun configuracion" },
          { matId: "mat.wm1000.refrigerante", note: "Cantidad no indicada" },
          { matId: "mat.wm1000.filtro_aire", qty: 1, unit: "ud", note: "Si se sustituye" },
          { matId: "mat.wm1000.aceite_hidraulico", note: "Cantidad no indicada" },
          { matId: "mat.wm1000.aceite_accionamiento_bomba", note: "Cantidad no indicada" },
          { matId: "mat.wm1000.aceite_engranaje_suspension", note: "Cantidad no indicada" },
          { matId: "mat.wm1000.aceite_mezcladora", note: "Cantidad no indicada" }
        ],
        torques: []
      },
      y1: { ops: ["op.wm1000.y1.dispositif_antigel_mecha_limpiar"], materials: [], torques: [] }
    }
  };

  // =========================
  // Datos (55006/55007 - HAMM HP 280i) (mismo modelo)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.hamm_hp280i.h10.freno_estacionamiento_comprobar", "Comprobación de la función del freno de estacionamiento", {
    action: "comprobar",
    groupKey: "seguridad.freno_estacionamiento",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h10.freno_pedal_comprobar", "Comprobación del funcionamiento del freno de pedal", {
    action: "comprobar",
    groupKey: "seguridad.freno_pedal",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h10.asiento_interruptor_contacto_comprobar", "Comprobación de la función del interruptor de contacto del asiento", {
    action: "comprobar",
    groupKey: "seguridad.interruptor_asiento",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp(
    "op.hamm_hp280i.h10.apoyabrazos_interruptor_seguridad_comprobar",
    "Comprobar el funcionamiento del interruptor de seguridad del apoyabrazos multifuncional",
    { action: "comprobar", groupKey: "seguridad.interruptor_apoyabrazos", fuente: "Plan mantenimiento HAMM HP 280i" }
  );
  addOp(
    "op.hamm_hp280i.h10.emergencia_parada_maquina_parada_comprobar",
    "Comprobación del funcionamiento de PARADA DE EMERGENCIA con la máquina parada",
    { action: "comprobar", groupKey: "seguridad.emergency_stop_parada", fuente: "Plan mantenimiento HAMM HP 280i" }
  );
  addOp("op.hamm_hp280i.h10.hidraulico_nivel_aceite_comprobar", "Comprobación del nivel de llenado del aceite hidráulico", {
    action: "comprobar",
    groupKey: "hidraulico.aceite_hidraulico",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h10.motor_nivel_aceite_comprobar", "Comprobación del nivel de llenado del aceite del motor", {
    action: "comprobar",
    groupKey: "motor.aceite_motor",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h10.refrigerante_nivel_comprobar", "Comprobación del nivel de llenado del refrigerante", {
    action: "comprobar",
    groupKey: "motor.refrigerante",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h10.combustible_decantador_agua_drenar", "Drenar el sumidero de agua (decantador/agua en combustible)", {
    action: "limpiar",
    groupKey: "motor.decantador_agua_combustible",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h10.neumaticos_presion_comprobar", "Comprobación de la presión de los neumáticos", {
    action: "comprobar",
    groupKey: "rodaje.presion_neumaticos",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp(
    "op.hamm_hp280i.h10.filtro_aire_vaciado_polvo_comprobar_limpiar",
    "Comprobación y limpieza del filtro de aire / válvula de vaciado de polvo",
    { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "Plan mantenimiento HAMM HP 280i" }
  );
  addOp("op.hamm_hp280i.h10.boquillas_pulverizadoras_limpiar", "Limpieza de las boquillas pulverizadoras", {
    action: "limpiar",
    groupKey: "riego.boquillas",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h10.filtro_rociado_agua_limpiar", "Limpieza del filtro del rociado con agua", {
    action: "limpiar",
    groupKey: "riego.filtro_agua",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h10.filtro_rociado_aditivos_limpiar", "Limpieza del filtro de rociado con aditivos", {
    action: "limpiar",
    groupKey: "riego.filtro_aditivos",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });

  // --- Operaciones (250 h)
  addOp("op.hamm_hp280i.h250.rascadores_comprobar", "Comprobación de los rascadores", {
    action: "comprobar",
    groupKey: "rodillo.rascadores",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h250.correa_polyv_motor_tension_comprobar", "Comprobación de la tensión de la correa Poly-V (motor)", {
    action: "comprobar",
    groupKey: "motor.correa_polyv",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h250.correa_polyv_ac_tension_comprobar", "Comprobación de la tensión de la correa Poly-V del aire acondicionado", {
    action: "comprobar",
    groupKey: "clima.correa_polyv",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h250.transmision_marcha_nivel_aceite_comprobar", "Comprobación del nivel de llenado de aceite de la transmisión de marcha", {
    action: "comprobar",
    groupKey: "transmision.aceite_marcha",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h250.direccion_perno_cilindro_lubricar", "Lubricación del perno del cilindro de dirección", {
    action: "limpiar",
    groupKey: "direccion.perno_cilindro",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h250.direccion_cojinetes_barra_acoplamiento_lubricar", "Lubricación de los cojinetes de la barra de acoplamiento", {
    action: "limpiar",
    groupKey: "direccion.barra_acoplamiento",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h250.radiador_comprobar", "Comprobación del radiador", {
    action: "comprobar",
    groupKey: "motor.radiador",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h250.aire_acondicionado_comprobar", "Comprobación del aire acondicionado", {
    action: "comprobar",
    groupKey: "clima.aire_acondicionado",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });

  // --- Operaciones (500 h / al menos 1 vez al año)
  addOp("op.hamm_hp280i.h500.filtro_cabina_aire_fresco_cambiar", "Cambio del filtro de aire fresco de la cabina del conductor", {
    action: "sustituir",
    groupKey: "cabina.filtro_aire_fresco",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.filtro_cabina_recirculacion_cambiar", "Cambio del filtro de aire de circulación de la cabina del conductor", {
    action: "sustituir",
    groupKey: "cabina.filtro_recirculacion",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.ruedas_tornilleria_sujecion_comprobar", "Comprobación de la correcta sujeción de tuercas/tornillos de rueda", {
    action: "comprobar",
    groupKey: "rodaje.tornilleria_rueda",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.hidraulico_filtro_presion_cambiar", "Cambio del elemento del filtro de presión del sistema hidráulico", {
    action: "sustituir",
    groupKey: "hidraulico.filtro_presion",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.motor_aceite_cambiar", "Cambio del aceite del motor", {
    action: "cambiar",
    groupKey: "motor.aceite_motor",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.motor_filtro_aceite_cambiar", "Cambio del filtro de aceite lubricante del motor diésel", {
    action: "sustituir",
    groupKey: "motor.filtro_aceite_motor",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.combustible_filtro_principal_cambiar", "Cambio del cartucho del filtro de combustible", {
    action: "sustituir",
    groupKey: "motor.filtro_combustible",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.combustible_prefiltro_cambiar", "Cambio del cartucho del prefiltro de combustible", {
    action: "sustituir",
    groupKey: "motor.prefiltro_combustible",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.filtro_aire_cartuchos_cambiar", "Cambio de los cartuchos del filtro de aire", {
    action: "sustituir",
    groupKey: "motor.filtro_aire_principal",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.asiento_guias_comprobar_limpiar", "Comprobar/limpiar las guías de la regulación del asiento", {
    action: "limpiar",
    groupKey: "cabina.asiento_guias",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.def_bomba_filtro_cambiar", "Cambio del elemento del filtro de la bomba impulsora de AdBlue/DEF", {
    action: "sustituir",
    groupKey: "def.filtro_bomba",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h500.bateria_arranque_comprobar", "Comprobación de la batería de arranque", {
    action: "comprobar",
    groupKey: "electrico.bateria_arranque",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });

  // --- Operaciones (1000 h / al menos 1 vez al año)
  addOp("op.hamm_hp280i.h1000.emergencia_parada_modo_marcha_comprobar", "Comprobación del funcionamiento de parada de emergencia en modo de marcha", {
    action: "comprobar",
    groupKey: "seguridad.emergency_stop_marcha",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h1000.transmision_marcha_aceite_cambiar", "Cambio del aceite de la transmisión de marcha", {
    action: "cambiar",
    groupKey: "transmision.aceite_marcha",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });

  // --- Operaciones (2000 h / al menos cada 2 años)
  addOp("op.hamm_hp280i.h2000.riego_sistema_limpieza_agua_limpiar", "Limpieza del sistema de riego por rociado con agua", {
    action: "limpiar",
    groupKey: "riego.sistema",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h2000.hidraulico_aceite_cambiar", "Cambio del aceite hidráulico", {
    action: "cambiar",
    groupKey: "hidraulico.aceite_hidraulico",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h2000.hidraulico_filtro_ventilacion_deposito_cambiar", "Cambio del filtro de ventilación del depósito de aceite hidráulico", {
    action: "sustituir",
    groupKey: "hidraulico.filtro_ventilacion_deposito",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h2000.def_filtro_ventilacion_deposito_cambiar", "Cambio del filtro de ventilación del depósito de AdBlue/DEF", {
    action: "sustituir",
    groupKey: "def.filtro_ventilacion_deposito",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h2000.motor_correa_polyv_cambiar", "Cambio de la correa Poly-V (motor)", {
    action: "sustituir",
    groupKey: "motor.correa_polyv",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h2000.clima_correa_ac_cambiar", "Cambio de la correa trapezoidal del aire acondicionado", {
    action: "sustituir",
    groupKey: "clima.correa_polyv",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h2000.frenos_aceite_freno_cambiar", "Cambio del aceite de freno", {
    action: "cambiar",
    groupKey: "frenos.liquido",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h2000.refrigerante_cambiar", "Cambio del refrigerante", {
    action: "cambiar",
    groupKey: "motor.refrigerante",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });
  addOp("op.hamm_hp280i.h2000.filtro_aire_cartucho_seguridad_cambiar", "Cambio del cartucho de seguridad (filtro de aire)", {
    action: "sustituir",
    groupKey: "motor.filtro_aire_seguridad",
    fuente: "Plan mantenimiento HAMM HP 280i"
  });

  // --- Materiales (HAMM HP 280i)
  addMat("mat.hamm_hp280i.trapos_papel", "Trapos / papel industrial", { fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.cepillo_aire", "Cepillo + aire comprimido o aspiración (para filtro de aire)", { fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.agua_limpiador", "Agua (y/o limpiador suave) para boquillas y filtros de riego", { fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.grasa_multiusos", "Grasa multiusos", { fuente: "Plan mantenimiento HAMM HP 280i" });

  addMat("mat.hamm_hp280i.aceite_motor", "Aceite motor", { unit: "L", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.filtro_aceite_motor", "Filtro aceite motor", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.filtro_combustible", "Filtro combustible (principal)", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.prefiltro_combustible", "Prefiltro combustible", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.cartuchos_filtro_aire", "Cartuchos filtro de aire (juego)", { unit: "juego", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.cartucho_seguridad_filtro_aire", "Cartucho de seguridad (filtro de aire)", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });

  addMat("mat.hamm_hp280i.aceite_hidraulico", "Aceite hidráulico", { unit: "L", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.filtro_presion_hidraulico", "Filtro de presión hidráulico", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.filtro_ventilacion_deposito_hidraulico", "Filtro ventilación depósito hidráulico", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });

  addMat("mat.hamm_hp280i.filtro_bomba_def", "Filtro bomba AdBlue/DEF", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.filtro_ventilacion_deposito_def", "Filtro ventilación depósito AdBlue/DEF", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });

  addMat("mat.hamm_hp280i.filtros_cabina", "Filtros cabina (aire fresco + recirculación)", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.aceite_transmision_marcha", "Aceite transmisión de marcha", { unit: "L", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.correa_polyv_motor", "Correa Poly-V motor", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.correa_ac", "Correa A/A (trapezoidal)", { unit: "ud", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.liquido_freno", "Líquido/aceite de freno", { unit: "L", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.refrigerante", "Refrigerante", { unit: "L", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.juntas_tapon", "Juntas/arandelas de tapón (si aplica)", { unit: "juego", fuente: "Plan mantenimiento HAMM HP 280i" });
  addMat("mat.hamm_hp280i.limpiador_multiusos", "Limpiador multiusos + trapos", { fuente: "Plan mantenimiento HAMM HP 280i" });

  // Plantilla por modelo (HAMM HP 280i)
  DB.templatesByModel[MODEL_HAMMHP280I] = {
    modelId: MODEL_HAMMHP280I,
    intervals: {
      h10: {
        ops: [
          "op.hamm_hp280i.h10.freno_estacionamiento_comprobar",
          "op.hamm_hp280i.h10.freno_pedal_comprobar",
          "op.hamm_hp280i.h10.asiento_interruptor_contacto_comprobar",
          "op.hamm_hp280i.h10.apoyabrazos_interruptor_seguridad_comprobar",
          "op.hamm_hp280i.h10.emergencia_parada_maquina_parada_comprobar",
          "op.hamm_hp280i.h10.hidraulico_nivel_aceite_comprobar",
          "op.hamm_hp280i.h10.motor_nivel_aceite_comprobar",
          "op.hamm_hp280i.h10.refrigerante_nivel_comprobar",
          "op.hamm_hp280i.h10.combustible_decantador_agua_drenar",
          "op.hamm_hp280i.h10.neumaticos_presion_comprobar",
          "op.hamm_hp280i.h10.filtro_aire_vaciado_polvo_comprobar_limpiar",
          "op.hamm_hp280i.h10.boquillas_pulverizadoras_limpiar",
          "op.hamm_hp280i.h10.filtro_rociado_agua_limpiar",
          "op.hamm_hp280i.h10.filtro_rociado_aditivos_limpiar"
        ],
        materials: [
          { matId: "mat.hamm_hp280i.trapos_papel", note: "Según necesidad" },
          { matId: "mat.hamm_hp280i.cepillo_aire", note: "Según necesidad" },
          { matId: "mat.hamm_hp280i.agua_limpiador", note: "Según necesidad" },
          { matId: "mat.hamm_hp280i.aceite_motor", note: "Reposición si aplica (hasta nivel)" },
          { matId: "mat.hamm_hp280i.aceite_hidraulico", note: "Reposición si aplica (hasta nivel)" },
          { matId: "mat.hamm_hp280i.refrigerante", note: "Reposición si aplica (hasta nivel)" }
        ],
        torques: []
      },
      h250: {
        ops: [
          "op.hamm_hp280i.h250.rascadores_comprobar",
          "op.hamm_hp280i.h250.correa_polyv_motor_tension_comprobar",
          "op.hamm_hp280i.h250.correa_polyv_ac_tension_comprobar",
          "op.hamm_hp280i.h250.transmision_marcha_nivel_aceite_comprobar",
          "op.hamm_hp280i.h250.direccion_perno_cilindro_lubricar",
          "op.hamm_hp280i.h250.direccion_cojinetes_barra_acoplamiento_lubricar",
          "op.hamm_hp280i.h250.radiador_comprobar",
          "op.hamm_hp280i.h250.aire_acondicionado_comprobar"
        ],
        materials: [
          { matId: "mat.hamm_hp280i.grasa_multiusos", note: "Hasta purga/salida en puntos de engrase" },
          { matId: "mat.hamm_hp280i.limpiador_multiusos", note: "Radiador / zona de rascadores (según necesidad)" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.hamm_hp280i.h500.filtro_cabina_aire_fresco_cambiar",
          "op.hamm_hp280i.h500.filtro_cabina_recirculacion_cambiar",
          "op.hamm_hp280i.h500.ruedas_tornilleria_sujecion_comprobar",
          "op.hamm_hp280i.h500.hidraulico_filtro_presion_cambiar",
          "op.hamm_hp280i.h500.motor_aceite_cambiar",
          "op.hamm_hp280i.h500.motor_filtro_aceite_cambiar",
          "op.hamm_hp280i.h500.combustible_filtro_principal_cambiar",
          "op.hamm_hp280i.h500.combustible_prefiltro_cambiar",
          "op.hamm_hp280i.h500.filtro_aire_cartuchos_cambiar",
          "op.hamm_hp280i.h500.asiento_guias_comprobar_limpiar",
          "op.hamm_hp280i.h500.def_bomba_filtro_cambiar",
          "op.hamm_hp280i.h500.bateria_arranque_comprobar"
        ],
        materials: [
          { matId: "mat.hamm_hp280i.aceite_motor", note: "Cantidad según capacidad del motor" },
          { matId: "mat.hamm_hp280i.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.cartuchos_filtro_aire", note: "1 juego (según configuración)" },
          { matId: "mat.hamm_hp280i.filtro_presion_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.filtro_bomba_def", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.filtros_cabina", qty: 2, unit: "ud" },
          { matId: "mat.hamm_hp280i.limpiador_multiusos", note: "Según necesidad" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.hamm_hp280i.h1000.emergencia_parada_modo_marcha_comprobar",
          "op.hamm_hp280i.h1000.transmision_marcha_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.hamm_hp280i.aceite_transmision_marcha", note: "Cantidad según capacidad de la transmisión" },
          { matId: "mat.hamm_hp280i.juntas_tapon", qty: 1, unit: "juego", note: "Si aplica" }
        ],
        torques: []
      },
      h2000: {
        ops: [
          "op.hamm_hp280i.h2000.riego_sistema_limpieza_agua_limpiar",
          "op.hamm_hp280i.h2000.hidraulico_aceite_cambiar",
          "op.hamm_hp280i.h2000.hidraulico_filtro_ventilacion_deposito_cambiar",
          "op.hamm_hp280i.h2000.def_filtro_ventilacion_deposito_cambiar",
          "op.hamm_hp280i.h2000.motor_correa_polyv_cambiar",
          "op.hamm_hp280i.h2000.clima_correa_ac_cambiar",
          "op.hamm_hp280i.h2000.frenos_aceite_freno_cambiar",
          "op.hamm_hp280i.h2000.refrigerante_cambiar",
          "op.hamm_hp280i.h2000.filtro_aire_cartucho_seguridad_cambiar"
        ],
        materials: [
          { matId: "mat.hamm_hp280i.aceite_hidraulico", note: "Cantidad según capacidad del sistema" },
          { matId: "mat.hamm_hp280i.filtro_ventilacion_deposito_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.filtro_ventilacion_deposito_def", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.correa_polyv_motor", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.correa_ac", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.liquido_freno", note: "Cantidad según capacidad del circuito" },
          { matId: "mat.hamm_hp280i.refrigerante", note: "Cantidad según capacidad del circuito" },
          { matId: "mat.hamm_hp280i.cartucho_seguridad_filtro_aire", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hp280i.agua_limpiador", note: "Limpieza sistema riego (según necesidad)" }
        ],
        torques: []
      }
    }
  };

  // =========================
  // Datos (55005 - HAMM HD14 TT)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.hamm_hd14tt.h10.freno_estacionamiento_comprobar", "Comprobar freno de estacionamiento", {
    action: "comprobar",
    groupKey: "seguridad.freno_estacionamiento",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h10.emergencia_parada_maquina_parada_comprobar", "Comprobar funciÃ³n de PARADA DE EMERGENCIA (con la mÃ¡quina parada)", {
    action: "comprobar",
    groupKey: "seguridad.emergency_stop_parada",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h10.hidraulico_nivel_aceite_comprobar", "Comprobar nivel de aceite hidrÃ¡ulico", {
    action: "comprobar",
    groupKey: "hidraulico.aceite_hidraulico",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h10.boquillas_pulverizadoras_limpiar", "Limpiar boquillas pulverizadoras", {
    action: "limpiar",
    groupKey: "riego.boquillas",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h10.neumaticos_presion_comprobar", "Comprobar presiÃ³n de aire en los neumÃ¡ticos", {
    action: "comprobar",
    groupKey: "rodaje.presion_neumaticos",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h10.motor_nivel_aceite_comprobar", "Comprobar nivel de aceite del motor", {
    action: "comprobar",
    groupKey: "motor.aceite_motor",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h10.refrigerante_nivel_comprobar", "Comprobar nivel de refrigerante", {
    action: "comprobar",
    groupKey: "motor.refrigerante",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h10.filtro_aire_comprobar_limpiar_vaciado_polvo", "Comprobar y limpiar filtro de aire / vaciado de polvo", {
    action: "limpiar",
    groupKey: "motor.filtro_aire_principal",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h10.filtro_rociado_agua_limpiar", "Limpiar filtro de rociado de agua", {
    action: "limpiar",
    groupKey: "riego.filtro_agua",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });

  // --- Operaciones (50 h - rodaje) (una vez)
  addOp("op.hamm_hd14tt.h50_post.motor_aceite_cambiar", "Cambiar aceite del motor (rodaje)", {
    action: "cambiar",
    groupKey: "motor.aceite_motor",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h50_post.motor_filtro_aceite_cambiar", "Cambiar filtro de aceite del motor (rodaje)", {
    action: "sustituir",
    groupKey: "motor.filtro_aceite_motor",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h50_post.combustible_filtro_cambiar", "Cambiar filtro de combustible (rodaje)", {
    action: "sustituir",
    groupKey: "motor.filtro_combustible",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h50_post.combustible_prefiltro_cambiar", "Cambiar prefiltro de combustible (rodaje)", {
    action: "sustituir",
    groupKey: "motor.prefiltro_combustible",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h50_post.hidraulico_filtro_aceite_cambiar", "Cambiar filtro de aceite hidrÃ¡ulico (rodaje)", {
    action: "sustituir",
    groupKey: "hidraulico.filtro_aceite_hidraulico",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h50_post.ruedas_tornilleria_sujecion_comprobar", "Comprobar firme asiento de tuercas/tornillos de las ruedas", {
    action: "comprobar",
    groupKey: "rodaje.tornilleria_rueda",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });

  // --- Operaciones (250 h)
  addOp("op.hamm_hd14tt.h250.rascadores_bandaje_comprobar_lubricar", "Comprobar rascadores del bandaje y lubricar rascador", {
    action: "limpiar",
    groupKey: "rodillo.rascadores",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h250.motor_aceite_cambiar", "Cambiar aceite del motor", {
    action: "cambiar",
    groupKey: "motor.aceite_motor",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h250.motor_filtro_aceite_cambiar", "Cambiar filtro de aceite del motor", {
    action: "sustituir",
    groupKey: "motor.filtro_aceite_motor",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h250.correa_trapezoidal_tension_comprobar", "Comprobar tensiÃ³n de la correa trapezoidal", {
    action: "comprobar",
    groupKey: "motor.correa_trapezoidal",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h250.articulacion_cojinete_lubricar", "Lubricar cojinete de la articulaciÃ³n", {
    action: "limpiar",
    groupKey: "chasis.articulacion_cojinete",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h250.direccion_bulon_cilindro_lubricar", "Lubricar bulÃ³n del cilindro de direcciÃ³n", {
    action: "limpiar",
    groupKey: "direccion.bulon_cilindro",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h250.radiador_comprobar", "Comprobar radiador", {
    action: "comprobar",
    groupKey: "motor.radiador",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });

  // --- Operaciones (500 h)
  addOp("op.hamm_hd14tt.h500.cabina_filtro_aire_fresco_cambiar", "Cambiar filtro de aire fresco de cabina", {
    action: "sustituir",
    groupKey: "cabina.filtro_aire_fresco",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.hidraulico_filtro_presion_cambiar", "Cambiar elemento del filtro de presiÃ³n del sistema hidrÃ¡ulico", {
    action: "sustituir",
    groupKey: "hidraulico.filtro_presion",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.ruedas_tornilleria_sujecion_comprobar", "Comprobar firme asiento de tuercas/tornillos de las ruedas", {
    action: "comprobar",
    groupKey: "rodaje.tornilleria_rueda",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.motor_junta_tapa_valvula_cambiar", "Cambiar junta de la tapa de la vÃ¡lvula", {
    action: "sustituir",
    groupKey: "motor.junta_tapa_valvula",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.combustible_filtro_cartucho_cambiar", "Cambiar cartucho del filtro de combustible", {
    action: "sustituir",
    groupKey: "motor.filtro_combustible",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.combustible_prefiltro_sustituir", "Sustituir prefiltro de combustible", {
    action: "sustituir",
    groupKey: "motor.prefiltro_combustible",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.combustible_prefiltro_cartucho_sustituir", "Sustituir cartucho del prefiltro de combustible", {
    action: "sustituir",
    groupKey: "motor.cartucho_prefiltro_combustible",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.combustible_separador_agua_vaciar", "Vaciar separador de agua", {
    action: "limpiar",
    groupKey: "motor.separador_agua_combustible",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.filtro_aire_cartucho_sustituir", "Sustituir cartucho del filtro de aire", {
    action: "sustituir",
    groupKey: "motor.filtro_aire_principal",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h500.palanca_marcha_funcionamiento_comprobar", "Comprobar funcionamiento de la palanca de marcha", {
    action: "comprobar",
    groupKey: "transmision.palanca_marcha",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });

  // --- Operaciones (2000 h)
  addOp("op.hamm_hd14tt.h2000.emergencia_parada_modo_marcha_comprobar", "Comprobar funciÃ³n de PARADA DE EMERGENCIA en modo de marcha", {
    action: "comprobar",
    groupKey: "seguridad.emergency_stop_marcha",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h2000.riego_sistema_limpieza", "Limpieza del sistema de rociado de agua", {
    action: "limpiar",
    groupKey: "riego.sistema",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h2000.hidraulico_aceite_cambiar", "Cambiar aceite hidrÃ¡ulico", {
    action: "cambiar",
    groupKey: "hidraulico.aceite_hidraulico",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h2000.correa_trapezoidal_cambiar", "Cambiar correa trapezoidal", {
    action: "sustituir",
    groupKey: "motor.correa_trapezoidal",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h2000.refrigerante_cambiar", "Cambiar refrigerante", {
    action: "cambiar",
    groupKey: "motor.refrigerante",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h2000.filtro_aire_cartucho_seguridad_sustituir", "Sustituir cartucho de seguridad (filtro aire)", {
    action: "sustituir",
    groupKey: "motor.filtro_aire_seguridad",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });
  addOp("op.hamm_hd14tt.h2000.hidraulico_filtro_ventilacion_deposito_cambiar", "Cambiar filtro de ventilaciÃ³n del depÃ³sito de aceite hidrÃ¡ulico", {
    action: "sustituir",
    groupKey: "hidraulico.filtro_ventilacion_deposito",
    fuente: "Plan mantenimiento HAMM HD14 TT"
  });

  // --- Materiales (HAMM HD14 TT)
  addMat("mat.hamm_hd14tt.aceite_motor", "Aceite motor", { unit: "L", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.filtro_aceite_motor", "Filtro aceite motor", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.filtro_combustible", "Filtro combustible", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.prefiltro_combustible", "Prefiltro combustible", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.cartucho_prefiltro_combustible", "Cartucho del prefiltro de combustible", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.filtro_aceite_hidraulico", "Filtro aceite hidrÃ¡ulico", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.filtro_presion_hidraulico", "Elemento filtro presiÃ³n hidrÃ¡ulico", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.filtro_aire_cabina", "Filtro aire cabina", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.junta_tapa_valvula", "Junta tapa vÃ¡lvula", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.cartucho_filtro_aire", "Cartucho filtro de aire", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.cartucho_seguridad_filtro_aire", "Cartucho de seguridad (filtro aire)", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.aceite_hidraulico", "Aceite hidrÃ¡ulico", { unit: "L", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.correa_trapezoidal", "Correa trapezoidal", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.refrigerante", "Refrigerante", { unit: "L", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.filtro_ventilacion_deposito_hidraulico", "Filtro ventilaciÃ³n depÃ³sito hidrÃ¡ulico", { unit: "ud", fuente: "Plan mantenimiento HAMM HD14 TT" });
  addMat("mat.hamm_hd14tt.grasa", "Grasa (puntos de engrase)", { unit: "kg", fuente: "Plan mantenimiento HAMM HD14 TT" });

  // Plantilla por modelo (HAMM HD14 TT)
  DB.templatesByModel[MODEL_HAMM_HD14TT] = {
    modelId: MODEL_HAMM_HD14TT,
    intervals: {
      h10: {
        ops: [
          "op.hamm_hd14tt.h10.freno_estacionamiento_comprobar",
          "op.hamm_hd14tt.h10.emergencia_parada_maquina_parada_comprobar",
          "op.hamm_hd14tt.h10.hidraulico_nivel_aceite_comprobar",
          "op.hamm_hd14tt.h10.boquillas_pulverizadoras_limpiar",
          "op.hamm_hd14tt.h10.neumaticos_presion_comprobar",
          "op.hamm_hd14tt.h10.motor_nivel_aceite_comprobar",
          "op.hamm_hd14tt.h10.refrigerante_nivel_comprobar",
          "op.hamm_hd14tt.h10.filtro_aire_comprobar_limpiar_vaciado_polvo",
          "op.hamm_hd14tt.h10.filtro_rociado_agua_limpiar"
        ],
        materials: [],
        torques: []
      },
      h50_post: {
        ops: [
          "op.hamm_hd14tt.h50_post.motor_aceite_cambiar",
          "op.hamm_hd14tt.h50_post.motor_filtro_aceite_cambiar",
          "op.hamm_hd14tt.h50_post.combustible_filtro_cambiar",
          "op.hamm_hd14tt.h50_post.combustible_prefiltro_cambiar",
          "op.hamm_hd14tt.h50_post.hidraulico_filtro_aceite_cambiar",
          "op.hamm_hd14tt.h50_post.ruedas_tornilleria_sujecion_comprobar"
        ],
        materials: [
          { matId: "mat.hamm_hd14tt.aceite_motor", note: "1 carga (segÃºn capacidad/especificaciÃ³n)" },
          { matId: "mat.hamm_hd14tt.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.filtro_aceite_hidraulico", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h250: {
        ops: [
          "op.hamm_hd14tt.h250.rascadores_bandaje_comprobar_lubricar",
          "op.hamm_hd14tt.h250.motor_aceite_cambiar",
          "op.hamm_hd14tt.h250.motor_filtro_aceite_cambiar",
          "op.hamm_hd14tt.h250.correa_trapezoidal_tension_comprobar",
          "op.hamm_hd14tt.h250.articulacion_cojinete_lubricar",
          "op.hamm_hd14tt.h250.direccion_bulon_cilindro_lubricar",
          "op.hamm_hd14tt.h250.radiador_comprobar"
        ],
        materials: [
          { matId: "mat.hamm_hd14tt.aceite_motor", note: "1 carga (segÃºn capacidad/especificaciÃ³n)" },
          { matId: "mat.hamm_hd14tt.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.grasa", note: "SegÃºn engrase (articulaciÃ³n / bulÃ³n / rascador)" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.hamm_hd14tt.h500.cabina_filtro_aire_fresco_cambiar",
          "op.hamm_hd14tt.h500.hidraulico_filtro_presion_cambiar",
          "op.hamm_hd14tt.h500.ruedas_tornilleria_sujecion_comprobar",
          "op.hamm_hd14tt.h500.motor_junta_tapa_valvula_cambiar",
          "op.hamm_hd14tt.h500.combustible_filtro_cartucho_cambiar",
          "op.hamm_hd14tt.h500.combustible_prefiltro_sustituir",
          "op.hamm_hd14tt.h500.combustible_prefiltro_cartucho_sustituir",
          "op.hamm_hd14tt.h500.combustible_separador_agua_vaciar",
          "op.hamm_hd14tt.h500.filtro_aire_cartucho_sustituir",
          "op.hamm_hd14tt.h500.palanca_marcha_funcionamiento_comprobar"
        ],
        materials: [
          { matId: "mat.hamm_hd14tt.filtro_aire_cabina", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.filtro_presion_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.junta_tapa_valvula", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.cartucho_prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.cartucho_filtro_aire", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h2000: {
        ops: [
          "op.hamm_hd14tt.h2000.emergencia_parada_modo_marcha_comprobar",
          "op.hamm_hd14tt.h2000.riego_sistema_limpieza",
          "op.hamm_hd14tt.h2000.hidraulico_aceite_cambiar",
          "op.hamm_hd14tt.h2000.correa_trapezoidal_cambiar",
          "op.hamm_hd14tt.h2000.refrigerante_cambiar",
          "op.hamm_hd14tt.h2000.filtro_aire_cartucho_seguridad_sustituir",
          "op.hamm_hd14tt.h2000.hidraulico_filtro_ventilacion_deposito_cambiar"
        ],
        materials: [
          { matId: "mat.hamm_hd14tt.aceite_hidraulico", note: "1 carga (segÃºn capacidad/especificaciÃ³n)" },
          { matId: "mat.hamm_hd14tt.correa_trapezoidal", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.refrigerante", note: "1 carga (segÃºn capacidad/especificaciÃ³n)" },
          { matId: "mat.hamm_hd14tt.cartucho_seguridad_filtro_aire", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd14tt.filtro_ventilacion_deposito_hidraulico", qty: 1, unit: "ud" }
        ],
        torques: []
      }
    }
  };

  // =========================
  // Datos (55004 - HAMM GRW24)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.hamm_grw24.h10.filtro_aire_seco_comprobar_limpiar", "Filtro de aire seco: comprobar y limpiar (segÃºn indicaciÃ³n/estado)", {
    action: "limpiar",
    groupKey: "motor.filtro_aire_principal",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h10.caja_marchas_cambio_bajo_carga_nivel_aceite_comprobar", "Caja de marchas con cambio bajo carga: comprobar nivel de aceite", {
    action: "comprobar",
    groupKey: "transmision.caja_marchas_nivel_aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h10.freno_estacionamiento_funcionamiento_comprobar", "Freno de estacionamiento: comprobar funcionamiento", {
    action: "comprobar",
    groupKey: "seguridad.freno_estacionamiento",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h10.filtro_agua_limpiar", "Filtro de agua: limpiar", {
    action: "limpiar",
    groupKey: "agua.filtro_agua",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h10.liquido_frenos_nivel_comprobar", "LÃ­quido de frenos: comprobar nivel", {
    action: "comprobar",
    groupKey: "frenos.liquido",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h10.refrigerante_nivel_comprobar", "Refrigerante: comprobar nivel", {
    action: "comprobar",
    groupKey: "motor.refrigerante",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h10.rascador_comprobar", "Rascador: comprobar (estado/ajuste)", {
    action: "comprobar",
    groupKey: "rodillo.rascador_estado",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });

  // --- Operaciones (125 h)
  addOp("op.hamm_grw24.h125.rodamiento_oscilante_comprobar", "Rodamiento oscilante: comprobar", {
    action: "comprobar",
    groupKey: "chasis.rodamiento_oscilante",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h125.rodamiento_oscilante_lubricar", "Rodamiento oscilante: lubricar (engrasar)", {
    action: "limpiar",
    groupKey: "chasis.rodamiento_oscilante",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });

  // --- Operaciones (250 h)
  addOp("op.hamm_grw24.h250.direccion_mecanica_lubricar", "MecÃ¡nica de direcciÃ³n: lubricar", { action: "limpiar", groupKey: "direccion.mecanica", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw24.h250.rodamientos_rueda_lubricar", "Rodamientos de rueda: lubricar", { action: "limpiar", groupKey: "rodaje.rodamientos_rueda", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw24.h250.arbol_transmision_lubricar", "Ãrbol de transmisiÃ³n: lubricar", { action: "limpiar", groupKey: "transmision.arbol", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw24.h250.transmision_ruedas_nivel_aceite_comprobar", "TransmisiÃ³n de ruedas: comprobar nivel de aceite", {
    action: "comprobar",
    groupKey: "transmision_ruedas.aceite_nivel",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h250.diferencial_nivel_aceite_comprobar", "Diferencial: comprobar nivel de aceite", {
    action: "comprobar",
    groupKey: "transmision.diferencial_nivel",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h250.caja_marchas_cambio_bajo_carga_filtro_cartucho_sustituir", "Caja de marchas con cambio bajo carga: sustituir cartucho/filtro", {
    action: "sustituir",
    groupKey: "transmision.caja_marchas_filtro",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h250.radiador_comprobar_limpiar", "Radiador: comprobar/limpiar segÃºn estado", {
    action: "limpiar",
    groupKey: "motor.radiador",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });

  // --- Operaciones (500 h)
  addOp("op.hamm_grw24.h500.caja_marchas_cambio_bajo_carga_aceite_cambiar", "Caja de marchas con cambio bajo carga: cambiar aceite", {
    action: "cambiar",
    groupKey: "transmision.caja_marchas_aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h500.testigo_filtro_aire_comprobar", "Testigo/indicador del filtro de aire: comprobar", {
    action: "comprobar",
    groupKey: "motor.indicador_filtro_aire",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h500.prefiltro_combustible_cartucho_sustituir", "Prefiltro de combustible: sustituir cartucho/filtro", {
    action: "sustituir",
    groupKey: "motor.prefiltro_combustible",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h500.hidraulico_direccion_aceite_y_filtro_cambiar", "Sistema hidrÃ¡ulico (direcci unspecified): cambiar aceite hidrÃ¡ulico y sustituir el elemento de filtro", {
    action: "cambiar",
    groupKey: "hidraulico_direccion.aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });

  // --- Operaciones (2000 h)
  addOp("op.hamm_grw24.h2000.filtro_aire_cartucho_sustituir", "Filtro de aire: sustituir cartucho", {
    action: "sustituir",
    groupKey: "motor.filtro_aire_principal",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.filtro_aire_cartucho_seguridad_sustituir", "Cartucho de seguridad: sustituir (mÃ¡x. 2000 h o antes segÃºn condiciÃ³n)", {
    action: "sustituir",
    groupKey: "motor.filtro_aire_seguridad",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.diferencial_carrera_nivel_comprobar", "Diferencial de carrera: comprobar nivel", {
    action: "comprobar",
    groupKey: "transmision.diferencial_nivel",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.transmision_ruedas_aceite_cambiar", "TransmisiÃ³n de ruedas: cambiar aceite (izq. y dcha.)", {
    action: "cambiar",
    groupKey: "transmision_ruedas.aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.diferencial_aceite_cambiar", "Diferencial: cambiar aceite", {
    action: "cambiar",
    groupKey: "transmision.diferencial_aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.caja_marchas_cambio_bajo_carga_aceite_cambiar", "Caja de marchas con cambio bajo carga: cambiar aceite", {
    action: "cambiar",
    groupKey: "transmision.caja_marchas_aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.hidraulico_direccion_aceite_cambiar", "Sistema hidrÃ¡ulico (direcciÃ³n): cambiar aceite hidrÃ¡ulico", {
    action: "cambiar",
    groupKey: "hidraulico_direccion.aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.freno_servicio_comprobar", "Freno de servicio: comprobar", {
    action: "comprobar",
    groupKey: "frenos.freno_servicio",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.rociado_deposito_agua_mantenimiento", "Rociado/depÃ³sito de agua: limpieza/mantenimiento", {
    action: "limpiar",
    groupKey: "agua.deposito_mantenimiento",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h2000.secador_aire_cartucho_sustituir", "Secador de aire: sustituir cartucho", {
    action: "sustituir",
    groupKey: "aire_comprimido.secador_aire",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });

  // --- Rodaje (50/125/500 h) (una vez, además del plan normal)
  addOp("op.hamm_grw24.h50_post.motor_servicio_rodaje", "Motor diÃ©sel: cambiar aceite, cambiar filtro de aceite, cambiar filtros de combustible (incluye prefiltro) y comprobar holgura de vÃ¡lvulas (rodaje)", {
    action: "cambiar",
    groupKey: "motor.aceite_motor",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h50_post.hidraulico_filtro_aceite_sustituir", "Sistema hidrÃ¡ulico: cambiar el filtro de aceite hidrÃ¡ulico (rodaje)", {
    action: "sustituir",
    groupKey: "hidraulico_direccion.filtro_aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h125.rodaje_caja_marchas_filtro_sustituir", "Rodaje (125 h): sustituir el cartucho/filtro de la caja de marchas con cambio bajo carga", {
    action: "sustituir",
    groupKey: "transmision.caja_marchas_filtro",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h500.rodaje_diferencial_aceite_cambiar", "Rodaje (500 h): cambiar aceite en el diferencial", {
    action: "cambiar",
    groupKey: "transmision.diferencial_aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });
  addOp("op.hamm_grw24.h500.rodaje_transmision_ruedas_aceite_cambiar", "Rodaje (500 h): cambiar aceite en la transmisiÃ³n de las ruedas (izq./dcha.)", {
    action: "cambiar",
    groupKey: "transmision_ruedas.aceite",
    fuente: "MANUAL DE SERVICIO GRW 18-24"
  });

  // --- Materiales (GRW24)
  addMat("mat.hamm_grw24.aceite_motor", "Aceite motor", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.filtro_aceite_motor_234486", "Cartucho filtro aceite motor 234486", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.filtro_combustible_2036282", "Cartucho filtro combustible 2036282", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.prefiltro_combustible_1292404", "Cartucho prefiltro combustible 1292404", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.filtro_deposito_hidraulico_1243160", "Elemento filtro depÃ³sito aceite hidrÃ¡ulico 1243160", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.junta_tapa_valvula_2071552", "Junta tapa de vÃ¡lvula 2071552", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.filtro_caja_marchas_281875", "Cartucho filtro caja de marchas (cambio bajo carga) 281875", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.aceite_diferencial", "Aceite diferencial", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.aceite_transmision_ruedas", "Aceite transmisiÃ³n ruedas", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.grasa_lubricante", "Grasa lubricante", { unit: "kg", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.aceite_caja_marchas_bajo_carga", "Aceite caja de marchas (cambio bajo carga)", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.aceite_hidraulico_direccion", "Aceite hidrÃ¡ulico (direcciÃ³n)", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.refrigerante", "Refrigerante", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.filtro_secador_aire_1292951", "Cartucho filtro secador de aire 1292951", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.anillos_obturadores_576476", "Anillos obturadores cubierta limpieza depÃ³sito agua 576476", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.correa_polyv_1290991", "Correa Poly-V 1290991", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.correa_aa_201340", "Correa trapezoidal A/A 201340", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.filtro_aire_1209590", "Cartucho filtro aire 1209590", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw24.filtro_aire_seguridad_1209620", "Cartucho seguridad 1209620", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });

  // Plantilla por modelo (GRW24)
  DB.templatesByModel[MODEL_HAMM_GRW24] = {
    modelId: MODEL_HAMM_GRW24,
    intervals: {
      h10: {
        ops: [
          "op.hamm_grw24.h10.filtro_aire_seco_comprobar_limpiar",
          "op.hamm_grw24.h10.caja_marchas_cambio_bajo_carga_nivel_aceite_comprobar",
          "op.hamm_grw24.h10.freno_estacionamiento_funcionamiento_comprobar",
          "op.hamm_grw24.h10.filtro_agua_limpiar",
          "op.hamm_grw24.h10.liquido_frenos_nivel_comprobar",
          "op.hamm_grw24.h10.refrigerante_nivel_comprobar",
          "op.hamm_grw24.h10.rascador_comprobar"
        ],
        materials: [],
        torques: []
      },
      h50_post: {
        ops: ["op.hamm_grw24.h50_post.motor_servicio_rodaje", "op.hamm_grw24.h50_post.hidraulico_filtro_aceite_sustituir"],
        materials: [
          { matId: "mat.hamm_grw24.aceite_motor", qty: 9.5, unit: "L" },
          { matId: "mat.hamm_grw24.filtro_aceite_motor_234486", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.filtro_combustible_2036282", qty: 2, unit: "ud" },
          { matId: "mat.hamm_grw24.prefiltro_combustible_1292404", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.filtro_deposito_hidraulico_1243160", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.junta_tapa_valvula_2071552", qty: 1, unit: "ud", note: "Si aplica en ajuste de vÃ¡lvulas" }
        ],
        torques: []
      },
      h125: {
        ops: ["op.hamm_grw24.h125.rodamiento_oscilante_comprobar", "op.hamm_grw24.h125.rodamiento_oscilante_lubricar", "op.hamm_grw24.h125.rodaje_caja_marchas_filtro_sustituir"],
        materials: [{ matId: "mat.hamm_grw24.grasa_lubricante", note: "SegÃºn necesidad" }],
        torques: []
      },
      h250: {
        ops: [
          "op.hamm_grw24.h250.direccion_mecanica_lubricar",
          "op.hamm_grw24.h250.rodamientos_rueda_lubricar",
          "op.hamm_grw24.h250.arbol_transmision_lubricar",
          "op.hamm_grw24.h250.transmision_ruedas_nivel_aceite_comprobar",
          "op.hamm_grw24.h250.diferencial_nivel_aceite_comprobar",
          "op.hamm_grw24.h250.caja_marchas_cambio_bajo_carga_filtro_cartucho_sustituir",
          "op.hamm_grw24.h250.radiador_comprobar_limpiar"
        ],
        materials: [{ matId: "mat.hamm_grw24.filtro_caja_marchas_281875", qty: 1, unit: "ud" }],
        torques: []
      },
      h500: {
        ops: [
          "op.hamm_grw24.h500.caja_marchas_cambio_bajo_carga_aceite_cambiar",
          "op.hamm_grw24.h500.testigo_filtro_aire_comprobar",
          "op.hamm_grw24.h500.prefiltro_combustible_cartucho_sustituir",
          "op.hamm_grw24.h500.hidraulico_direccion_aceite_y_filtro_cambiar",
          "op.hamm_grw24.h500.rodaje_diferencial_aceite_cambiar",
          "op.hamm_grw24.h500.rodaje_transmision_ruedas_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.hamm_grw24.aceite_caja_marchas_bajo_carga", qty: 20.5, unit: "L" },
          { matId: "mat.hamm_grw24.aceite_hidraulico_direccion", qty: 5.0, unit: "L" },
          { matId: "mat.hamm_grw24.filtro_deposito_hidraulico_1243160", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.prefiltro_combustible_1292404", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h2000: {
        ops: [
          "op.hamm_grw24.h2000.filtro_aire_cartucho_sustituir",
          "op.hamm_grw24.h2000.filtro_aire_cartucho_seguridad_sustituir",
          "op.hamm_grw24.h2000.diferencial_carrera_nivel_comprobar",
          "op.hamm_grw24.h2000.transmision_ruedas_aceite_cambiar",
          "op.hamm_grw24.h2000.diferencial_aceite_cambiar",
          "op.hamm_grw24.h2000.caja_marchas_cambio_bajo_carga_aceite_cambiar",
          "op.hamm_grw24.h2000.hidraulico_direccion_aceite_cambiar",
          "op.hamm_grw24.h2000.freno_servicio_comprobar",
          "op.hamm_grw24.h2000.rociado_deposito_agua_mantenimiento",
          "op.hamm_grw24.h2000.secador_aire_cartucho_sustituir"
        ],
        materials: [
          { matId: "mat.hamm_grw24.aceite_caja_marchas_bajo_carga", qty: 20.5, unit: "L" },
          { matId: "mat.hamm_grw24.aceite_hidraulico_direccion", qty: 5.0, unit: "L" },
          { matId: "mat.hamm_grw24.aceite_diferencial", qty: 6.5, unit: "L" },
          { matId: "mat.hamm_grw24.aceite_transmision_ruedas", qty: 10.0, unit: "L", note: "5,0 L por lado" },
          { matId: "mat.hamm_grw24.refrigerante", qty: 14.0, unit: "L" },
          { matId: "mat.hamm_grw24.filtro_aire_1209590", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.filtro_aire_seguridad_1209620", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.filtro_caja_marchas_281875", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.filtro_deposito_hidraulico_1243160", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.filtro_secador_aire_1292951", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw24.anillos_obturadores_576476", qty: 2, unit: "ud" },
          { matId: "mat.hamm_grw24.correa_polyv_1290991", qty: 1, unit: "ud", note: "Si aplica por tabla" },
          { matId: "mat.hamm_grw24.correa_aa_201340", qty: 1, unit: "ud", note: "Opcional A/A" }
        ],
        torques: []
      }
    }
  };

  // =========================
  // Datos (55003 - HAMM GRW18)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.hamm_grw18.h10.vigilancia_general_controles_previos", "Vigilancia general (controles previos).", { action: "comprobar", groupKey: "seguridad.controles_previos", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h10.filtro_aire_seco_comprobar_limpiar", "Comprobar/limpiar filtro de aire seco.", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h10.caja_marchas_cambio_bajo_carga_nivel_aceite_comprobar", "Comprobar nivel de aceite en caja de marchas con cambio bajo carga.", { action: "comprobar", groupKey: "transmision.caja_marchas_nivel_aceite", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h10.freno_estacionamiento_comprobar", "Comprobar freno de estacionamiento.", { action: "comprobar", groupKey: "seguridad.freno_estacionamiento", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h10.filtro_agua_rociado_presion_limpiar_comprobar", "Limpiar/comprobar filtro de agua del rociado a presión.", { action: "limpiar", groupKey: "agua.filtro_agua_rociado", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h10.liquido_frenos_nivel_comprobar", "Comprobar nivel de líquido de frenos (rellenar si falta).", { action: "comprobar", groupKey: "frenos.liquido", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h10.refrigerante_motor_nivel_comprobar", "Comprobar nivel de refrigerante del motor (en frío; rellenar con mezcla correcta si falta).", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h10.rascador_comprobar_cambiar_cepillos_si_desgastados", "Comprobar rascador (cambiar cepillos si están desgastados).", { action: "comprobar", groupKey: "rodillo.rascador_estado", fuente: "MANUAL DE SERVICIO GRW 18-24" });

  // --- Operaciones (50 h - rodaje / puesta en servicio)
  addOp("op.hamm_grw18.h50_post.motor_servicio_rodaje", "Motor diésel (rodaje): cambiar aceite + filtro aceite + filtros combustible (x2) + prefiltro; comprobar holgura de válvulas; sustituir junta tapa de válvula.", { action: "cambiar", groupKey: "motor.servicio_rodaje_50h", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h50_post.hidraulico_filtro_deposito_sustituir", "Sistema hidráulico: sustituir elemento de filtro del depósito de aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_deposito", fuente: "MANUAL DE SERVICIO GRW 18-24" });

  // --- Operaciones (125 h)
  addOp("op.hamm_grw18.h125.hidraulico_nivel_aceite_deposito_comprobar", "Comprobar nivel de aceite hidráulico en el depósito (máquina en frío; rellenar si falta).", { action: "comprobar", groupKey: "hidraulico.nivel_aceite_deposito", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h125.rodamiento_oscilante_lubricar", "Lubricar rodamiento oscilante (punto indicado en el apartado 3.06.01).", { action: "limpiar", groupKey: "chasis.rodamiento_oscilante", fuente: "MANUAL DE SERVICIO GRW 18-24" });

  // --- Operaciones (250 h)
  addOp("op.hamm_grw18.h250.direccion_mecanica_lubricar", "Lubricar mecánica de dirección.", { action: "limpiar", groupKey: "direccion.mecanica", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h250.rodamiento_rueda_lubricar", "Lubricar rodamiento de la rueda.", { action: "limpiar", groupKey: "rodaje.rodamientos_rueda", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h250.arbol_transmision_lubricar", "Lubricar árbol de transmisión.", { action: "limpiar", groupKey: "transmision.arbol", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h250.transmision_ruedas_nivel_aceite_comprobar", "Comprobar nivel de aceite en transmisión de las ruedas.", { action: "comprobar", groupKey: "transmision_ruedas.aceite_nivel", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h250.diferencial_nivel_aceite_comprobar", "Comprobar nivel de aceite en diferencial.", { action: "comprobar", groupKey: "transmision.diferencial_nivel", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h250.diferencial_carrera_nivel_aceite_comprobar", "Comprobar nivel de aceite en diferencial de carrera (cada lado).", { action: "comprobar", groupKey: "transmision.diferencial_carrera_nivel", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h250.caja_marchas_cambio_bajo_carga_filtro_cartucho_sustituir", "Sustituir cartucho de filtro de la caja de marchas con cambio bajo carga (powershift).", { action: "sustituir", groupKey: "transmision.caja_marchas_filtro", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h250.radiador_comprobar_limpiar", "Comprobar/limpiar radiador (si está sucio, limpiar con alta presión).", { action: "limpiar", groupKey: "motor.radiador", fuente: "MANUAL DE SERVICIO GRW 18-24" });

  // --- Operaciones (500 h)
  addOp("op.hamm_grw18.h500.caja_marchas_cambio_bajo_carga_aceite_cambiar", "Cambio de aceite en la caja de marchas con cambio bajo carga.", { action: "cambiar", groupKey: "transmision.caja_marchas_aceite", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h500.hidraulico_direccion_aceite_y_filtro_cambiar", "Cambio de aceite hidráulico + sustitución del elemento filtrante del depósito de aceite.", { action: "cambiar", groupKey: "hidraulico_direccion.aceite", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h500.testigo_filtro_aire_comprobar", "Comprobar testigo de control del filtro de aire.", { action: "comprobar", groupKey: "motor.indicador_filtro_aire", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h500.prefiltro_combustible_cartucho_sustituir", "Sustituir cartucho de filtro del prefiltro de combustible.", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL DE SERVICIO GRW 18-24" });

  // --- Operaciones (2000 h)
  addOp("op.hamm_grw18.h2000.rodamiento_ruedas_delanteras_holgura_comprobar", "Comprobar holgura del rodamiento de ruedas delanteras (si hay holgura, reajuste por personal cualificado/servicio).", { action: "comprobar", groupKey: "rodaje.holgura_rodamientos_delanteros", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h2000.filtro_aire_cartucho_seguridad_sustituir", "Sustituir cartucho de seguridad del filtro de aire (máx. 2000 h o según criterio).", { action: "sustituir", groupKey: "motor.filtro_aire_seguridad", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h2000.transmision_ruedas_aceite_cambiar", "Cambiar aceite en transmisión de las ruedas (izquierda y derecha).", { action: "cambiar", groupKey: "transmision_ruedas.aceite", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h2000.diferencial_aceite_cambiar", "Cambiar aceite en el diferencial.", { action: "cambiar", groupKey: "transmision.diferencial", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h2000.freno_servicio_comprobar", "Comprobar freno de servicio (requiere personal cualificado/servicio técnico).", { action: "comprobar", groupKey: "frenos.servicio", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h2000.sistema_rociado_agua_limpieza", "Limpieza del sistema de rociado de agua (depósito, conductos, boquillas, etc.).", { action: "limpiar", groupKey: "agua.rociado_sistema", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addOp("op.hamm_grw18.h2000.secador_aire_cartucho_sustituir", "Sustituir cartucho del secador de aire.", { action: "sustituir", groupKey: "aire.secador", fuente: "MANUAL DE SERVICIO GRW 18-24" });

  // --- Materiales (GRW18)
  addMat("mat.hamm_grw18.aceite_motor", "Aceite motor", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.filtro_aceite_motor_234486", "Cartucho filtro aceite motor 234486", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.filtro_combustible_2036282", "Cartuchos filtro combustible 2036282", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.prefiltro_combustible_1292404", "Cartucho prefiltro combustible 1292404", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.filtro_deposito_hidraulico_1243160", "Elemento filtro depósito aceite hidráulico 1243160", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.junta_tapa_valvula_2071552", "Junta tapa de válvula 2071552", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.grasa_lubricante", "Grasa lubricante", { unit: "kg", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.aceite_hidraulico", "Aceite hidráulico", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.filtro_caja_marchas_281875", "Cartucho filtro caja de marchas (powershift) 281875", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.aceite_caja_marchas_bajo_carga", "Aceite caja de marchas (cambio bajo carga)", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.aceite_transmision_ruedas", "Aceite transmisión de ruedas", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.aceite_diferencial", "Aceite diferencial", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.refrigerante", "Refrigerante motor", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.filtro_aire_seguridad_1209620", "Cartucho de seguridad filtro aire 1209620", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.filtro_secador_aire_1292951", "Cartucho filtro secador de aire 1292951", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.anillos_obturadores_576476", "Anillos obturadores (cubiertas limpieza depósito agua) 576476", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 18-24" });
  addMat("mat.hamm_grw18.liquido_frenos", "Líquido de frenos", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 18-24" });

  // Plantilla por modelo (GRW18)
  DB.templatesByModel[MODEL_HAMM_GRW18] = {
    modelId: MODEL_HAMM_GRW18,
    intervals: {
      h10: {
        ops: [
          "op.hamm_grw18.h10.vigilancia_general_controles_previos",
          "op.hamm_grw18.h10.filtro_aire_seco_comprobar_limpiar",
          "op.hamm_grw18.h10.caja_marchas_cambio_bajo_carga_nivel_aceite_comprobar",
          "op.hamm_grw18.h10.freno_estacionamiento_comprobar",
          "op.hamm_grw18.h10.filtro_agua_rociado_presion_limpiar_comprobar",
          "op.hamm_grw18.h10.liquido_frenos_nivel_comprobar",
          "op.hamm_grw18.h10.refrigerante_motor_nivel_comprobar",
          "op.hamm_grw18.h10.rascador_comprobar_cambiar_cepillos_si_desgastados"
        ],
        materials: [],
        torques: []
      },
      h50_post: {
        ops: ["op.hamm_grw18.h50_post.motor_servicio_rodaje", "op.hamm_grw18.h50_post.hidraulico_filtro_deposito_sustituir"],
        materials: [
          { matId: "mat.hamm_grw18.aceite_motor", qty: 9.5, unit: "L" },
          { matId: "mat.hamm_grw18.filtro_aceite_motor_234486", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw18.filtro_combustible_2036282", qty: 2, unit: "ud" },
          { matId: "mat.hamm_grw18.prefiltro_combustible_1292404", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw18.filtro_deposito_hidraulico_1243160", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw18.junta_tapa_valvula_2071552", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h125: {
        ops: ["op.hamm_grw18.h125.hidraulico_nivel_aceite_deposito_comprobar", "op.hamm_grw18.h125.rodamiento_oscilante_lubricar"],
        materials: [{ matId: "mat.hamm_grw18.grasa_lubricante", note: "Según necesidad" }],
        torques: []
      },
      h250: {
        ops: [
          "op.hamm_grw18.h250.direccion_mecanica_lubricar",
          "op.hamm_grw18.h250.rodamiento_rueda_lubricar",
          "op.hamm_grw18.h250.arbol_transmision_lubricar",
          "op.hamm_grw18.h250.transmision_ruedas_nivel_aceite_comprobar",
          "op.hamm_grw18.h250.diferencial_nivel_aceite_comprobar",
          "op.hamm_grw18.h250.diferencial_carrera_nivel_aceite_comprobar",
          "op.hamm_grw18.h250.caja_marchas_cambio_bajo_carga_filtro_cartucho_sustituir",
          "op.hamm_grw18.h250.radiador_comprobar_limpiar"
        ],
        materials: [{ matId: "mat.hamm_grw18.filtro_caja_marchas_281875", qty: 1, unit: "ud" }],
        torques: []
      },
      h500: {
        ops: [
          "op.hamm_grw18.h500.caja_marchas_cambio_bajo_carga_aceite_cambiar",
          "op.hamm_grw18.h500.hidraulico_direccion_aceite_y_filtro_cambiar",
          "op.hamm_grw18.h500.testigo_filtro_aire_comprobar",
          "op.hamm_grw18.h500.prefiltro_combustible_cartucho_sustituir"
        ],
        materials: [
          { matId: "mat.hamm_grw18.aceite_caja_marchas_bajo_carga", qty: 20.5, unit: "L" },
          { matId: "mat.hamm_grw18.aceite_hidraulico", qty: 5.0, unit: "L" },
          { matId: "mat.hamm_grw18.filtro_deposito_hidraulico_1243160", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw18.prefiltro_combustible_1292404", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h2000: {
        ops: [
          "op.hamm_grw18.h2000.rodamiento_ruedas_delanteras_holgura_comprobar",
          "op.hamm_grw18.h2000.filtro_aire_cartucho_seguridad_sustituir",
          "op.hamm_grw18.h2000.transmision_ruedas_aceite_cambiar",
          "op.hamm_grw18.h2000.diferencial_aceite_cambiar",
          "op.hamm_grw18.h2000.freno_servicio_comprobar",
          "op.hamm_grw18.h2000.sistema_rociado_agua_limpieza",
          "op.hamm_grw18.h2000.secador_aire_cartucho_sustituir"
        ],
        materials: [
          { matId: "mat.hamm_grw18.aceite_transmision_ruedas", qty: 10.0, unit: "L" },
          { matId: "mat.hamm_grw18.aceite_diferencial", qty: 6.5, unit: "L" },
          { matId: "mat.hamm_grw18.refrigerante", qty: 14.0, unit: "L" },
          { matId: "mat.hamm_grw18.filtro_aire_seguridad_1209620", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw18.filtro_secador_aire_1292951", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw18.anillos_obturadores_576476", qty: 2, unit: "ud" },
          { matId: "mat.hamm_grw18.liquido_frenos", note: "Según purgado/cambio" }
        ],
        torques: []
      }
    }
  };

  // =========================
  // Datos (55002 - HAMM GRW15) - Motor DEUTZ DIESEL BF4M 2012C
  // =========================

  // --- Operaciones (10 h)
  addOp("op.hamm_grw15.h10.filtro_aire_seco_comprobar", "Comprobar filtro de aire seco.", { action: "comprobar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h10.power_shift_aceite_comprobar", "Comprobar aceite del power shift.", { action: "comprobar", groupKey: "transmision.power_shift_aceite", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h10.freno_estacionamiento_comprobar", "Comprobar freno de estacionamiento.", { action: "comprobar", groupKey: "seguridad.freno_estacionamiento", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h10.filtro_agua_comprobar", "Comprobar filtro de agua.", { action: "comprobar", groupKey: "agua.filtro_agua", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h10.liquido_frenos_comprobar", "Comprobar líquido de frenos.", { action: "comprobar", groupKey: "frenos.liquido", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h10.refrigerante_comprobar", "Comprobar refrigerante.", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h10.rascador_comprobar", "Comprobar rascador.", { action: "comprobar", groupKey: "rodillo.rascador_estado", fuente: "MANUAL DE SERVICIO GRW 15" });

  // --- Operaciones (50 h - rodaje / puesta en servicio)
  addOp("op.hamm_grw15.h50_post.filtro_aceite_motor_sustituir", "Sustituir cartucho del filtro de aceite de lubricación (motor).", { action: "sustituir", groupKey: "motor.filtro_aceite", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h50_post.filtro_combustible_sustituir", "Sustituir cartucho del filtro de combustible.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h50_post.prefiltro_combustible_sustituir", "Sustituir cartucho del prefiltro de combustible.", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h50_post.power_shift_filtro_sustituir", "Sustituir cartucho/filtro del power shift.", { action: "sustituir", groupKey: "transmision.power_shift_filtro", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h50_post.hidraulico_filtro_deposito_sustituir", "Sustituir cartucho/elemento filtrante del depósito de aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_deposito", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h50_post.secador_aire_cartucho_sustituir", "Sustituir cartucho del secador de aire.", { action: "sustituir", groupKey: "aire.secador", fuente: "MANUAL DE SERVICIO GRW 15" });

  // --- Operaciones (125 h)
  addOp("op.hamm_grw15.h125.hidraulico_aceite_comprobar", "Comprobar aceite hidráulico.", { action: "comprobar", groupKey: "hidraulico.aceite", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h125.cojiinetes_basculantes_engrasar", "Engrasar los cojinetes basculantes (pivoted bearing).", { action: "limpiar", groupKey: "chasis.cojinetes_basculantes", fuente: "MANUAL DE SERVICIO GRW 15" });

  // --- Operaciones (250 h)
  addOp("op.hamm_grw15.h250.aceite_engranaje_rueda_comprobar", "Comprobar aceite del engranaje de rueda.", { action: "comprobar", groupKey: "transmision_ruedas.aceite_nivel", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h250.aceite_grupo_diferencial_comprobar", "Comprobar aceite del grupo diferencial.", { action: "comprobar", groupKey: "transmision.diferencial_nivel", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h250.radiador_comprobar", "Comprobar radiador.", { action: "comprobar", groupKey: "motor.radiador", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h250.direccion_mecanismo_engrasar", "Engrasar mecanismo de dirección.", { action: "limpiar", groupKey: "direccion.mecanica", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h250.rodamientos_rueda_engrasar", "Engrasar rodamientos de rueda.", { action: "limpiar", groupKey: "rodaje.rodamientos_rueda", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h250.eje_articulado_engrasar", "Engrasar eje articulado (joint shaft).", { action: "limpiar", groupKey: "transmision.eje_articulado", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h250.cable_acelerador_freno_estacionamiento_engrasar", "Engrasar cable del acelerador / freno de estacionamiento.", { action: "limpiar", groupKey: "mandos.cables", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h250.power_shift_filtro_sustituir", "Sustituir cartucho/filtro del power shift.", { action: "sustituir", groupKey: "transmision.power_shift_filtro", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h250.correas_comprobar", "Comprobar correas: Correa V; Correa Poly-V; Correa A/A (opcional).", { action: "comprobar", groupKey: "motor.correas", fuente: "MANUAL DE SERVICIO GRW 15" });

  // --- Operaciones (500 h)
  addOp("op.hamm_grw15.h500.aceite_motor_cambiar", "Cambiar aceite del motor.", { action: "cambiar", groupKey: "motor.aceite", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h500.filtro_aceite_motor_sustituir", "Sustituir cartucho del filtro de aceite de lubricación (motor).", { action: "sustituir", groupKey: "motor.filtro_aceite", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h500.aceite_hidraulico_cambiar", "Cambiar aceite hidráulico.", { action: "cambiar", groupKey: "hidraulico.aceite", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h500.aceite_power_shift_cambiar", "Cambiar aceite del power shift.", { action: "cambiar", groupKey: "transmision.power_shift_aceite", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h500.filtro_aire_seco_sustituir", "Sustituir filtro de aire seco.", { action: "sustituir", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h500.filtro_combustible_sustituir", "Sustituir filtro de combustible.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h500.prefiltro_combustible_sustituir", "Sustituir prefiltro de combustible.", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h500.hidraulico_filtro_deposito_sustituir", "Sustituir elemento filtrante del depósito hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_deposito", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h500.limpiador_aire_comprobar", "Comprobar limpiador de aire (air cleaner).", { action: "comprobar", groupKey: "motor.limpiador_aire", fuente: "MANUAL DE SERVICIO GRW 15" });

  // --- Operaciones (1000 h)
  addOp("op.hamm_grw15.h1000.prefiltro_combustible_insert_limpiar", "Limpiar el insert del prefiltro de combustible.", { action: "limpiar", groupKey: "motor.prefiltro_combustible_insert", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h1000.secador_aire_cartucho_sustituir", "Sustituir cartucho del secador de aire.", { action: "sustituir", groupKey: "aire.secador", fuente: "MANUAL DE SERVICIO GRW 15" });

  // --- Operaciones (2000 h)
  addOp("op.hamm_grw15.h2000.refrigerante_cambiar", "Cambiar refrigerante.", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.aceite_engranaje_rueda_cambiar", "Cambiar aceite del engranaje de rueda (izq./dcha.).", { action: "cambiar", groupKey: "transmision_ruedas.aceite", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.aceite_grupo_diferencial_cambiar", "Cambiar aceite del grupo diferencial (izq./dcha.).", { action: "cambiar", groupKey: "transmision.diferencial", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.filtro_seguridad_sustituir", "Sustituir el cartucho del filtro de seguridad.", { action: "sustituir", groupKey: "motor.filtro_seguridad", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.stroke_adjustment_comprobar", "Comprobar ajuste de carrera (stroke adjustment).", { action: "comprobar", groupKey: "ajustes.stroke", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.freno_servicio_comprobar", "Comprobar freno de servicio.", { action: "comprobar", groupKey: "frenos.servicio", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.sistema_riego_agua_limpiar", "Limpiar el sistema de riego de agua (water-sprinkling system).", { action: "limpiar", groupKey: "agua.rociado_sistema", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.secador_aire_cartucho_sustituir", "Sustituir el cartucho del secador de aire.", { action: "sustituir", groupKey: "aire.secador", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.rodamientos_rueda_comprobar", "Comprobar rodamientos de rueda.", { action: "comprobar", groupKey: "rodaje.rodamientos_rueda", fuente: "MANUAL DE SERVICIO GRW 15" });
  addOp("op.hamm_grw15.h2000.correas_sustituir", "Sustituir correas: Correa V; Correa Poly-V; Correa A/A (opcional).", { action: "sustituir", groupKey: "motor.correas", fuente: "MANUAL DE SERVICIO GRW 15" });

  // --- Materiales (GRW15 - BF4M 2012C)
  addMat("mat.hamm_grw15.aceite_motor", "Aceite motor (BF4M 2012C)", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.aceite_hidraulico", "Aceite hidráulico", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.aceite_power_shift", "Aceite power shift", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.refrigerante", "Refrigerante", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.aceite_engranaje_rueda", "Aceite engranaje de rueda", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.aceite_grupo_diferencial", "Aceite grupo diferencial", { unit: "L", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.filtro_aceite_motor", "Filtro aceite lubricación (motor)", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.filtro_combustible", "Filtro combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.prefiltro_combustible", "Prefiltro combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.filtro_power_shift", "Filtro/cartucho power shift", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.filtro_deposito_hidraulico", "Elemento filtrante depósito hidráulico", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.filtro_aire", "Filtro aire seco (cartucho)", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.cartucho_secador_aire", "Cartucho secador de aire", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.junta_tapa_balancines", "Junta tapa de balancines", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.juntas_toricas", "Juntas tóricas (gasket ring)", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.filtro_seguridad", "Filtro de seguridad (cartucho)", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.correa_v", "Correa V", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.correa_polyv", "Correa Poly-V", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.correa_aa", "Correa A/A (opcional)", { unit: "ud", fuente: "MANUAL DE SERVICIO GRW 15" });
  addMat("mat.hamm_grw15.grasa", "Grasa", { unit: "kg", fuente: "MANUAL DE SERVICIO GRW 15" });

  // Plantilla por modelo (GRW15)
  DB.templatesByModel[MODEL_HAMM_GRW15] = {
    modelId: MODEL_HAMM_GRW15,
    intervals: {
      h10: {
        ops: [
          "op.hamm_grw15.h10.filtro_aire_seco_comprobar",
          "op.hamm_grw15.h10.power_shift_aceite_comprobar",
          "op.hamm_grw15.h10.freno_estacionamiento_comprobar",
          "op.hamm_grw15.h10.filtro_agua_comprobar",
          "op.hamm_grw15.h10.liquido_frenos_comprobar",
          "op.hamm_grw15.h10.refrigerante_comprobar",
          "op.hamm_grw15.h10.rascador_comprobar"
        ],
        materials: [],
        torques: []
      },
      h50_post: {
        ops: [
          "op.hamm_grw15.h50_post.filtro_aceite_motor_sustituir",
          "op.hamm_grw15.h50_post.filtro_combustible_sustituir",
          "op.hamm_grw15.h50_post.prefiltro_combustible_sustituir",
          "op.hamm_grw15.h50_post.power_shift_filtro_sustituir",
          "op.hamm_grw15.h50_post.hidraulico_filtro_deposito_sustituir",
          "op.hamm_grw15.h50_post.secador_aire_cartucho_sustituir"
        ],
        materials: [
          { matId: "mat.hamm_grw15.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.filtro_power_shift", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.filtro_deposito_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.cartucho_secador_aire", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.junta_tapa_balancines", qty: 1, unit: "ud", note: "Si se desmonta" },
          { matId: "mat.hamm_grw15.juntas_toricas", qty: 2, unit: "ud", note: "Según tabla" }
        ],
        torques: []
      },
      h125: {
        ops: ["op.hamm_grw15.h125.hidraulico_aceite_comprobar", "op.hamm_grw15.h125.cojiinetes_basculantes_engrasar"],
        materials: [{ matId: "mat.hamm_grw15.grasa", note: "Según necesidad" }],
        torques: []
      },
      h250: {
        ops: [
          "op.hamm_grw15.h250.aceite_engranaje_rueda_comprobar",
          "op.hamm_grw15.h250.aceite_grupo_diferencial_comprobar",
          "op.hamm_grw15.h250.radiador_comprobar",
          "op.hamm_grw15.h250.direccion_mecanismo_engrasar",
          "op.hamm_grw15.h250.rodamientos_rueda_engrasar",
          "op.hamm_grw15.h250.eje_articulado_engrasar",
          "op.hamm_grw15.h250.cable_acelerador_freno_estacionamiento_engrasar",
          "op.hamm_grw15.h250.power_shift_filtro_sustituir",
          "op.hamm_grw15.h250.correas_comprobar"
        ],
        materials: [
          { matId: "mat.hamm_grw15.grasa", note: "Según necesidad" },
          { matId: "mat.hamm_grw15.filtro_power_shift", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.hamm_grw15.h500.aceite_motor_cambiar",
          "op.hamm_grw15.h500.filtro_aceite_motor_sustituir",
          "op.hamm_grw15.h500.aceite_hidraulico_cambiar",
          "op.hamm_grw15.h500.aceite_power_shift_cambiar",
          "op.hamm_grw15.h500.filtro_aire_seco_sustituir",
          "op.hamm_grw15.h500.filtro_combustible_sustituir",
          "op.hamm_grw15.h500.prefiltro_combustible_sustituir",
          "op.hamm_grw15.h500.hidraulico_filtro_deposito_sustituir",
          "op.hamm_grw15.h500.limpiador_aire_comprobar"
        ],
        materials: [
          { matId: "mat.hamm_grw15.aceite_motor", qty: 9.5, unit: "L" },
          { matId: "mat.hamm_grw15.aceite_hidraulico", qty: 6.0, unit: "L" },
          { matId: "mat.hamm_grw15.aceite_power_shift", qty: 20.5, unit: "L" },
          { matId: "mat.hamm_grw15.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.filtro_aire", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.filtro_deposito_hidraulico", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h1000: {
        ops: ["op.hamm_grw15.h1000.prefiltro_combustible_insert_limpiar", "op.hamm_grw15.h1000.secador_aire_cartucho_sustituir"],
        materials: [
          { matId: "mat.hamm_grw15.aceite_motor", qty: 9.5, unit: "L" },
          { matId: "mat.hamm_grw15.aceite_hidraulico", qty: 6.0, unit: "L" },
          { matId: "mat.hamm_grw15.aceite_power_shift", qty: 20.5, unit: "L" },
          { matId: "mat.hamm_grw15.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.filtro_deposito_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.cartucho_secador_aire", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h2000: {
        ops: [
          "op.hamm_grw15.h2000.refrigerante_cambiar",
          "op.hamm_grw15.h2000.aceite_engranaje_rueda_cambiar",
          "op.hamm_grw15.h2000.aceite_grupo_diferencial_cambiar",
          "op.hamm_grw15.h2000.filtro_seguridad_sustituir",
          "op.hamm_grw15.h2000.stroke_adjustment_comprobar",
          "op.hamm_grw15.h2000.freno_servicio_comprobar",
          "op.hamm_grw15.h2000.sistema_riego_agua_limpiar",
          "op.hamm_grw15.h2000.secador_aire_cartucho_sustituir",
          "op.hamm_grw15.h2000.rodamientos_rueda_comprobar",
          "op.hamm_grw15.h2000.correas_sustituir"
        ],
        materials: [
          { matId: "mat.hamm_grw15.refrigerante", qty: 14.0, unit: "L" },
          { matId: "mat.hamm_grw15.aceite_engranaje_rueda", qty: 10.0, unit: "L" },
          { matId: "mat.hamm_grw15.aceite_grupo_diferencial", qty: 13.0, unit: "L" },
          { matId: "mat.hamm_grw15.filtro_seguridad", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.cartucho_secador_aire", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.correa_v", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.correa_polyv", qty: 1, unit: "ud" },
          { matId: "mat.hamm_grw15.correa_aa", qty: 1, unit: "ud", note: "Si equipa" }
        ],
        torques: []
      }
    }
  };

  // =========================
  // Datos (54016 - HAMM HD+ 120iVO)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.hamm_hd120ivo.h10.freno_estacionamiento_funcion_comprobar", "Comprobación de la función del freno de estacionamiento.", { action: "comprobar", groupKey: "seguridad.freno_estacionamiento", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.interruptor_asiento_comprobar", "Comprobación de la función del interruptor de contacto del asiento.", { action: "comprobar", groupKey: "seguridad.interruptor_asiento", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.interruptor_apoyabrazos_seguridad_comprobar", "Comprobar el funcionamiento del interruptor de seguridad del apoyabrazos multifuncional.", { action: "comprobar", groupKey: "seguridad.interruptor_apoyabrazos", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.parada_emergencia_comprobar_maquina_parada", "Comprobación del funcionamiento de la PARADA DE EMERGENCIA (con la máquina parada).", { action: "comprobar", groupKey: "seguridad.parada_emergencia", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.aceite_hidraulico_nivel_comprobar", "Comprobación del nivel de llenado del aceite hidráulico.", { action: "comprobar", groupKey: "hidraulico.nivel_aceite", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.aceite_motor_nivel_comprobar", "Comprobación del nivel de llenado del aceite del motor.", { action: "comprobar", groupKey: "motor.nivel_aceite", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.refrigerante_nivel_comprobar", "Comprobación del nivel de llenado del refrigerante.", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.sumidero_agua_drenar", "Drenar el sumidero de agua.", { action: "limpiar", groupKey: "combustible.decantador_agua", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.filtro_aire_comprobar_limpiar_valvula_polvo", "Comprobación y limpieza del filtro de aire / válvula de vaciado de polvo.", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.boquillas_pulverizadoras_limpiar", "Limpieza de las boquillas pulverizadoras.", { action: "limpiar", groupKey: "agua.boquillas", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h10.filtro_riego_agua_limpiar", "Limpieza del filtro del sistema de riego por rociado con agua.", { action: "limpiar", groupKey: "agua.filtro_riego", fuente: "HAMM HD+ 120iVO" });

  // --- Operaciones (250 h)
  addOp("op.hamm_hd120ivo.h250.rascador_comprobar_lubricar", "Comprobación del rascador / lubricación del rascador.", { action: "comprobar", groupKey: "rodillo.rascador_estado", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h250.correa_polyv_tension_comprobar", "Comprobación de la tensión de la correa Poly-V.", { action: "comprobar", groupKey: "motor.correa_polyv", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h250.correa_polyv_aa_tension_comprobar", "Comprobación de la tensión de la correa Poly-V del aire acondicionado.", { action: "comprobar", groupKey: "motor.correa_aa", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h250.aceite_vibrador_nivel_comprobar", "Comprobación del nivel de llenado del aceite del vibrador.", { action: "comprobar", groupKey: "tambor.vibrador_aceite", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h250.cojinete_articulacion_lubricar", "Lubricación del cojinete de la articulación.", { action: "limpiar", groupKey: "chasis.cojinete_articulacion", fuente: "HAMM HD+ 120iVO" });

  // --- Operaciones (500 h)
  addOp("op.hamm_hd120ivo.h500.filtro_cabina_aire_fresco_cambiar", "Cambio del filtro de aire fresco de la cabina del conductor.", { action: "cambiar", groupKey: "cabina.filtro_aire_fresco", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.elementos_amortiguadores_comprobar", "Comprobación de los elementos amortiguadores.", { action: "comprobar", groupKey: "tambor.amortiguadores", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.filtro_presion_hidraulico_cambiar", "Cambio del elemento del filtro de presión del sistema hidráulico.", { action: "cambiar", groupKey: "hidraulico.filtro_presion", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.aceite_motor_cambiar", "Cambio del aceite del motor.", { action: "cambiar", groupKey: "motor.aceite", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.filtro_aceite_motor_cambiar", "Cambio del filtro de aceite lubricante del motor diésel.", { action: "cambiar", groupKey: "motor.filtro_aceite", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.filtro_combustible_cambiar", "Cambio del cartucho del filtro de combustible.", { action: "cambiar", groupKey: "motor.filtro_combustible", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.prefiltro_combustible_cambiar", "Cambio del cartucho del prefiltro de combustible.", { action: "cambiar", groupKey: "motor.prefiltro_combustible", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.cartuchos_filtro_aire_cambiar", "Cambio de los cartuchos del filtro de aire.", { action: "cambiar", groupKey: "motor.filtro_aire_principal", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.guias_regulacion_asiento_comprobar_limpiar", "Comprobar/limpiar las guías de la regulación del asiento.", { action: "limpiar", groupKey: "cabina.guias_asiento", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.filtro_bomba_def_cambiar", "Cambio del elemento del filtro de la bomba impulsora de AdBlue®/DEF.", { action: "cambiar", groupKey: "motor.filtro_bomba_def", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h500.bateria_arranque_comprobar", "Comprobación de la batería de arranque.", { action: "comprobar", groupKey: "electrico.bateria_arranque", fuente: "HAMM HD+ 120iVO" });

  // --- Operaciones (1000 h)
  addOp("op.hamm_hd120ivo.h1000.parada_emergencia_modo_marcha_comprobar", "Comprobación del funcionamiento de parada de emergencia en modo de marcha.", { action: "comprobar", groupKey: "seguridad.parada_emergencia_marcha", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h1000.aceite_vibrador_cambiar", "Cambio del aceite del vibrador.", { action: "cambiar", groupKey: "tambor.vibrador_aceite", fuente: "HAMM HD+ 120iVO" });

  // --- Operaciones (2000 h)
  addOp("op.hamm_hd120ivo.h2000.sistema_riego_agua_limpiar", "Limpieza del sistema de riego por rociado con agua.", { action: "limpiar", groupKey: "agua.rociado_sistema", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h2000.correa_polyv_sustituir", "Sustituir correa Poly-V.", { action: "sustituir", groupKey: "motor.correa_polyv", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h2000.correa_aa_sustituir", "Sustituir correa trapezoidal del aire acondicionado (si equipa).", { action: "sustituir", groupKey: "motor.correa_aa", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h2000.cartucho_seguridad_aire_sustituir", "Sustituir cartucho de seguridad (aire).", { action: "sustituir", groupKey: "motor.filtro_aire_seguridad", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h2000.filtro_ventilacion_deposito_hidraulico_sustituir", "Sustituir filtro de ventilación del depósito de aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_ventilacion_deposito", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h2000.junta_tapa_valvula_sustituir", "Sustituir junta (tapa de la válvula).", { action: "sustituir", groupKey: "motor.junta_tapa_valvula", fuente: "HAMM HD+ 120iVO" });
  addOp("op.hamm_hd120ivo.h2000.secador_aa_sustituir", "Sustituir secador del aire acondicionado (si equipa).", { action: "sustituir", groupKey: "cabina.secador_aa", fuente: "HAMM HD+ 120iVO" });

  // --- Materiales (HD+ 120iVO)
  addMat("mat.hamm_hd120ivo.aceite_hidraulico", "Aceite hidráulico", { unit: "L", note: "Capacidad referencia 50,0 L", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.refrigerante", "Refrigerante", { unit: "L", note: "Capacidad referencia 22,0 L", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.aceite_motor", "Aceite del motor", { unit: "L", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.aceite_vibrador", "Aceite del vibrador (2 uds.)", { unit: "L", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.correa_polyv", "Correa Poly-V 2308767", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.correa_aa", "Correa A/A 2522122", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.cartucho_filtro_aire_2051200", "Cartucho filtro aire 2051200", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.cartucho_seguridad_2051202", "Cartucho de seguridad 2051202", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.filtro_aceite_motor_234486", "Cartucho filtro aceite lubricante 234486", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.filtro_combustible_2043673", "Cartucho filtro combustible 2043673", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.prefiltro_combustible_2175352", "Cartucho prefiltro combustible 2175352", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.filtro_bomba_def_2309124", "Elemento filtro bomba AdBlue/DEF 2309124", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.filtro_ventilacion_def_2494787", "Filtro ventilación depósito AdBlue/DEF 2494787", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.filtro_cabina_aire_fresco_2545574", "Elemento filtrante aire fresco cabina 2545574", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.cartucho_carcasa_calefactable_2146978", "Cartucho carcasa calefactable 2146978", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.amortiguadores_3064770", "Elementos amortiguadores suspensión del tambor 3064770", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.filtro_hidraulico_opcion", "Sistema hidráulico – elemento(s) filtro (1296396 o 2574029 según nº de serie)", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.filtro_ventilacion_hidraulico_1259334", "Filtro ventilación depósito aceite hidráulico 1259334", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.junta_tapa_valvula_2308768", "Junta tapa válvula 2308768", { unit: "ud", fuente: "HAMM HD+ 120iVO" });
  addMat("mat.hamm_hd120ivo.secador_aa_2463624", "Secador aire acondicionado 2463624", { unit: "ud", fuente: "HAMM HD+ 120iVO" });

  // Plantilla por modelo (HD+ 120iVO)
  DB.templatesByModel[MODEL_HAMM_HD120IVO] = {
    modelId: MODEL_HAMM_HD120IVO,
    intervals: {
      h10: {
        ops: [
          "op.hamm_hd120ivo.h10.freno_estacionamiento_funcion_comprobar",
          "op.hamm_hd120ivo.h10.interruptor_asiento_comprobar",
          "op.hamm_hd120ivo.h10.interruptor_apoyabrazos_seguridad_comprobar",
          "op.hamm_hd120ivo.h10.parada_emergencia_comprobar_maquina_parada",
          "op.hamm_hd120ivo.h10.aceite_hidraulico_nivel_comprobar",
          "op.hamm_hd120ivo.h10.aceite_motor_nivel_comprobar",
          "op.hamm_hd120ivo.h10.refrigerante_nivel_comprobar",
          "op.hamm_hd120ivo.h10.sumidero_agua_drenar",
          "op.hamm_hd120ivo.h10.filtro_aire_comprobar_limpiar_valvula_polvo",
          "op.hamm_hd120ivo.h10.boquillas_pulverizadoras_limpiar",
          "op.hamm_hd120ivo.h10.filtro_riego_agua_limpiar"
        ],
        materials: [],
        torques: []
      },
      h250: {
        ops: [
          "op.hamm_hd120ivo.h250.rascador_comprobar_lubricar",
          "op.hamm_hd120ivo.h250.correa_polyv_tension_comprobar",
          "op.hamm_hd120ivo.h250.correa_polyv_aa_tension_comprobar",
          "op.hamm_hd120ivo.h250.aceite_vibrador_nivel_comprobar",
          "op.hamm_hd120ivo.h250.cojinete_articulacion_lubricar"
        ],
        materials: [
          { matId: "mat.hamm_hd120ivo.correa_polyv", qty: 1, unit: "ud", note: "Control (sustitución a 2000 h)" },
          { matId: "mat.hamm_hd120ivo.correa_aa", qty: 1, unit: "ud", note: "Opcional; control (sustitución a 2000 h)" },
          { matId: "mat.hamm_hd120ivo.aceite_vibrador", qty: 10.7, unit: "L", note: "(2 uds.)" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.hamm_hd120ivo.h500.filtro_cabina_aire_fresco_cambiar",
          "op.hamm_hd120ivo.h500.elementos_amortiguadores_comprobar",
          "op.hamm_hd120ivo.h500.filtro_presion_hidraulico_cambiar",
          "op.hamm_hd120ivo.h500.aceite_motor_cambiar",
          "op.hamm_hd120ivo.h500.filtro_aceite_motor_cambiar",
          "op.hamm_hd120ivo.h500.filtro_combustible_cambiar",
          "op.hamm_hd120ivo.h500.prefiltro_combustible_cambiar",
          "op.hamm_hd120ivo.h500.cartuchos_filtro_aire_cambiar",
          "op.hamm_hd120ivo.h500.guias_regulacion_asiento_comprobar_limpiar",
          "op.hamm_hd120ivo.h500.filtro_bomba_def_cambiar",
          "op.hamm_hd120ivo.h500.bateria_arranque_comprobar"
        ],
        materials: [
          { matId: "mat.hamm_hd120ivo.aceite_motor", qty: 11.5, unit: "L" },
          { matId: "mat.hamm_hd120ivo.cartucho_filtro_aire_2051200", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.filtro_aceite_motor_234486", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.filtro_combustible_2043673", qty: 2, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.prefiltro_combustible_2175352", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.filtro_bomba_def_2309124", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.filtro_ventilacion_def_2494787", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.filtro_cabina_aire_fresco_2545574", qty: 2, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.cartucho_carcasa_calefactable_2146978", qty: 2, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.amortiguadores_3064770", qty: 24, unit: "ud", note: "Comprobar/sustituir si procede" },
          { matId: "mat.hamm_hd120ivo.filtro_hidraulico_opcion", qty: 2, unit: "ud", note: "1296396 o 2574029 según nº de serie" }
        ],
        torques: []
      },
      h1000: {
        ops: ["op.hamm_hd120ivo.h1000.parada_emergencia_modo_marcha_comprobar", "op.hamm_hd120ivo.h1000.aceite_vibrador_cambiar"],
        materials: [{ matId: "mat.hamm_hd120ivo.aceite_vibrador", qty: 10.7, unit: "L", note: "(2 uds.)" }],
        torques: []
      },
      h2000: {
        ops: [
          "op.hamm_hd120ivo.h2000.sistema_riego_agua_limpiar",
          "op.hamm_hd120ivo.h2000.correa_polyv_sustituir",
          "op.hamm_hd120ivo.h2000.correa_aa_sustituir",
          "op.hamm_hd120ivo.h2000.cartucho_seguridad_aire_sustituir",
          "op.hamm_hd120ivo.h2000.filtro_ventilacion_deposito_hidraulico_sustituir",
          "op.hamm_hd120ivo.h2000.junta_tapa_valvula_sustituir",
          "op.hamm_hd120ivo.h2000.secador_aa_sustituir"
        ],
        materials: [
          { matId: "mat.hamm_hd120ivo.correa_polyv", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.correa_aa", qty: 1, unit: "ud", note: "Si equipa" },
          { matId: "mat.hamm_hd120ivo.cartucho_seguridad_2051202", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.filtro_ventilacion_hidraulico_1259334", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.junta_tapa_valvula_2308768", qty: 1, unit: "ud" },
          { matId: "mat.hamm_hd120ivo.secador_aa_2463624", qty: 1, unit: "ud", note: "Si equipa" },
          { matId: "mat.hamm_hd120ivo.aceite_hidraulico", qty: 50.0, unit: "L", note: "Referencia si aplica por intervención" },
          { matId: "mat.hamm_hd120ivo.refrigerante", qty: 22.0, unit: "L", note: "Referencia si aplica por intervención" }
        ],
        torques: []
      }
    }
  };

  // Forzar asignación por máquina (por si el texto de marcaModelo varía en el Excel/maquinaria_completa)
  DB.machines["54016"] = { modelId: MODEL_HAMM_HD120IVO };

  // =========================
  // Datos (54015 - BOMAG BW161) (según plan BW 161 AD-5)
  // =========================

  // --- Operaciones (250 h) + Rodaje 250 h (puesta en servicio)
  addOp("op.bomag_bw161.h250.rodaje_reapriete_uniones_motor", "RODAJE (250 h): reapriete de uniones roscadas (aspiración/escape, cárter de aceite, fijación del motor).", { action: "comprobar", groupKey: "rodaje.reapriete_uniones_motor", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h250.rodaje_reapriete_uniones_maquina", "RODAJE (250 h): reapretar uniones roscadas de la máquina.", { action: "comprobar", groupKey: "rodaje.reapriete_uniones_maquina", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h250.rodaje_aceite_motor_y_filtro_cambiar", "RODAJE (250 h): cambiar aceite motor + cartucho filtrante.", { action: "cambiar", groupKey: "motor.aceite_y_filtro", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h250.rodaje_aceite_excitado_cambiar", "RODAJE (250 h): cambiar aceite en la caja del excitador.", { action: "cambiar", groupKey: "vibracion.excitado_aceite", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });

  addOp("op.bomag_bw161.h250.correas_estado_tension_comprobar", "Mantenimiento del accionamiento por correa: comprobar estado y tensión de las correas.", { action: "comprobar", groupKey: "motor.correa_trapezoidal", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h250.modulo_radiador_limpiar", "Limpieza del módulo radiador.", { action: "limpiar", groupKey: "motor.modulo_radiador", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h250.freno_estacionamiento_comprobar", "Comprobar el freno de estacionamiento.", { action: "comprobar", groupKey: "seguridad.freno_estacionamiento", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });

  // --- Operaciones (500 h)
  addOp("op.bomag_bw161.h500.aceite_motor_y_filtro_cambiar", "Cambiar aceite motor + cartucho filtrante de aceite.", { action: "cambiar", groupKey: "motor.aceite_y_filtro", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.filtro_combustible_sustituir_y_purgar", "Reemplazo del filtro de combustible + purga de aire del sistema de combustible.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.correa_trapezoidal_sustituir", "Reemplazo de la correa trapezoidal.", { action: "sustituir", groupKey: "motor.correa_trapezoidal", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.refrigerante_concentracion_y_estado_comprobar", "Comprobar concentración anticongelante y estado del refrigerante.", { action: "comprobar", groupKey: "motor.refrigerante_estado", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.tuberias_hidraulicas_comprobar", "Comprobación de tuberías hidráulicas.", { action: "comprobar", groupKey: "hidraulico.tuberias", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.bateria_mantenimiento_y_desconexion_principal_comprobar", "Mantenimiento de batería + comprobación de la desconexión principal.", { action: "comprobar", groupKey: "electrico.bateria_y_desconexion", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.caja_vibracion_nivel_aceite_comprobar", "Comprobar nivel de aceite en la caja de vibración.", { action: "comprobar", groupKey: "vibracion.caja_nivel_aceite", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.instalacion_aa_mantenimiento", "Mantenimiento de la instalación de aire acondicionado.", { action: "comprobar", groupKey: "cabina.aa_mantenimiento", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.filtro_cabina_aire_fresco_cambiar", "Cambio del filtro de aire fresco de la cabina del conductor.", { action: "cambiar", groupKey: "cabina.filtro_aire_fresco", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.elementos_amortiguadores_comprobar", "Comprobación de los elementos amortiguadores.", { action: "comprobar", groupKey: "suspension.amortiguadores", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.filtro_presion_hidraulico_cambiar", "Cambio del elemento del filtro de presión del sistema hidráulico.", { action: "cambiar", groupKey: "hidraulico.filtro_presion", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.filtro_aceite_motor_cambiar", "Cambio del filtro de aceite lubricante del motor diésel.", { action: "cambiar", groupKey: "motor.filtro_aceite", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.prefiltro_combustible_cambiar", "Cambio del cartucho del prefiltro de combustible.", { action: "cambiar", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.cartuchos_filtro_aire_cambiar", "Cambio de los cartuchos del filtro de aire.", { action: "cambiar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.guias_regulacion_asiento_comprobar_limpiar", "Comprobar/limpiar las guías de la regulación del asiento.", { action: "limpiar", groupKey: "cabina.guias_asiento", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.filtro_bomba_def_cambiar", "Cambio del elemento del filtro de la bomba impulsora de AdBlue®/DEF.", { action: "cambiar", groupKey: "motor.filtro_bomba_def", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h500.bateria_arranque_comprobar", "Comprobación de la batería de arranque.", { action: "comprobar", groupKey: "electrico.bateria_arranque", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });

  // --- Operaciones (1000 h) + Rodaje 1000 h
  addOp("op.bomag_bw161.h1000.filtro_def_sustituir", "Sustitución del filtro de AdBlue®/DEF.", { action: "sustituir", groupKey: "motor.filtro_def", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.regeneracion_parada_ejecutar", "Ejecución de regeneración en parada.", { action: "comprobar", groupKey: "motor.regeneracion_parada", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.fijaciones_motor_diesel_comprobar", "Comprobación de las fijaciones del motor diésel.", { action: "comprobar", groupKey: "motor.fijaciones", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.filtro_aceite_hidraulico_sustituir", "Reemplazo del filtro de aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_aceite", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.aceite_excitado_cambiar", "Cambiar aceite en la caja del excitador (rodillos).", { action: "cambiar", groupKey: "vibracion.excitado_aceite", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.rops_comprobar", "Comprobación de la ROPS.", { action: "comprobar", groupKey: "seguridad.rops", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.palanca_marcha_accionamiento_comprobar", "Comprobación del accionamiento de la palanca de marcha.", { action: "comprobar", groupKey: "mando.palanca_marcha", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.filtro_recirculacion_calefaccion_limpiar", "Limpieza del filtro de aire de recirculación de la calefacción (reemplazar si es necesario).", { action: "limpiar", groupKey: "cabina.filtro_recirculacion", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.filtro_aire_fresco_cabina_sustituir", "Reemplazo del filtro de aire fresco de la cabina.", { action: "sustituir", groupKey: "cabina.filtro_aire_fresco", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h1000.excitado_esparcidor_precision_aceite_cambiar", "Cambio del aceite en la caja del excitador del esparcidor de precisión (si equipa).", { action: "cambiar", groupKey: "accesorio.esparcidor_precision_excitado_aceite", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });

  // --- Operaciones (2000 h)
  addOp("op.bomag_bw161.h2000.aceite_hidraulico_cambiar_y_filtro", "Cambio del aceite hidráulico (con sustitución del filtro asociada).", { action: "cambiar", groupKey: "hidraulico.filtro_aceite", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addOp("op.bomag_bw161.h2000.refrigerante_cambiar", "Cambio del líquido refrigerante.", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });

  // --- Materiales (BW161)
  addMat("mat.bomag_bw161.aceite_motor_8l", "Aceite motor", { unit: "L", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.filtro_aceite_motor", "Cartucho filtrante de aceite motor", { unit: "ud", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.aceite_excitado_sae75w90", "Aceite caja excitador SAE 75W-90", { unit: "L", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.correa_trapezoidal", "Correa trapezoidal", { unit: "ud", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.filtro_def", "Filtro AdBlue®/DEF", { unit: "ud", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.filtro_aceite_hidraulico", "Filtro aceite hidráulico", { unit: "ud", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.aceite_hidraulico_hvlp46", "Aceite hidráulico HVLP 46", { unit: "L", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.refrigerante", "Líquido refrigerante (mezcla agua + anticongelante)", { unit: "L", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.filtro_cabina_aire_fresco", "Filtro aire fresco cabina", { unit: "ud", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });
  addMat("mat.bomag_bw161.aceite_excitado_esparcidor_precision", "Aceite caja excitador esparcidor de precisión (opcional)", { unit: "L", fuente: "MANUAL DE SERVICIO BW 161 AD-5" });

  // Plantilla por modelo (BW161)
  DB.templatesByModel[MODEL_BOMAG_BW161] = {
    modelId: MODEL_BOMAG_BW161,
    intervals: {
      h250: {
        ops: [
          "op.bomag_bw161.h250.rodaje_reapriete_uniones_motor",
          "op.bomag_bw161.h250.rodaje_reapriete_uniones_maquina",
          "op.bomag_bw161.h250.rodaje_aceite_motor_y_filtro_cambiar",
          "op.bomag_bw161.h250.rodaje_aceite_excitado_cambiar",
          "op.bomag_bw161.h250.correas_estado_tension_comprobar",
          "op.bomag_bw161.h250.modulo_radiador_limpiar",
          "op.bomag_bw161.h250.freno_estacionamiento_comprobar"
        ],
        materials: [
          { matId: "mat.bomag_bw161.aceite_motor_8l", qty: 8, unit: "L" },
          { matId: "mat.bomag_bw161.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.bomag_bw161.aceite_excitado_sae75w90", qty: 7.2, unit: "L", note: "3,6 L por caja (normalmente 2 cajas)" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.bomag_bw161.h500.aceite_motor_y_filtro_cambiar",
          "op.bomag_bw161.h500.filtro_combustible_sustituir_y_purgar",
          "op.bomag_bw161.h500.correa_trapezoidal_sustituir",
          "op.bomag_bw161.h500.refrigerante_concentracion_y_estado_comprobar",
          "op.bomag_bw161.h500.tuberias_hidraulicas_comprobar",
          "op.bomag_bw161.h500.bateria_mantenimiento_y_desconexion_principal_comprobar",
          "op.bomag_bw161.h500.caja_vibracion_nivel_aceite_comprobar",
          "op.bomag_bw161.h500.instalacion_aa_mantenimiento",
          "op.bomag_bw161.h500.filtro_cabina_aire_fresco_cambiar",
          "op.bomag_bw161.h500.elementos_amortiguadores_comprobar",
          "op.bomag_bw161.h500.filtro_presion_hidraulico_cambiar",
          "op.bomag_bw161.h500.filtro_aceite_motor_cambiar",
          "op.bomag_bw161.h500.prefiltro_combustible_cambiar",
          "op.bomag_bw161.h500.cartuchos_filtro_aire_cambiar",
          "op.bomag_bw161.h500.guias_regulacion_asiento_comprobar_limpiar",
          "op.bomag_bw161.h500.filtro_bomba_def_cambiar",
          "op.bomag_bw161.h500.bateria_arranque_comprobar"
        ],
        materials: [
          { matId: "mat.bomag_bw161.aceite_motor_8l", qty: 8, unit: "L" },
          { matId: "mat.bomag_bw161.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.bomag_bw161.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.bomag_bw161.correa_trapezoidal", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.bomag_bw161.h1000.filtro_def_sustituir",
          "op.bomag_bw161.h1000.regeneracion_parada_ejecutar",
          "op.bomag_bw161.h1000.fijaciones_motor_diesel_comprobar",
          "op.bomag_bw161.h1000.filtro_aceite_hidraulico_sustituir",
          "op.bomag_bw161.h1000.aceite_excitado_cambiar",
          "op.bomag_bw161.h1000.rops_comprobar",
          "op.bomag_bw161.h1000.palanca_marcha_accionamiento_comprobar",
          "op.bomag_bw161.h1000.filtro_recirculacion_calefaccion_limpiar",
          "op.bomag_bw161.h1000.filtro_aire_fresco_cabina_sustituir",
          "op.bomag_bw161.h1000.excitado_esparcidor_precision_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.bomag_bw161.filtro_def", qty: 1, unit: "ud" },
          { matId: "mat.bomag_bw161.filtro_aceite_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.bomag_bw161.aceite_excitado_sae75w90", qty: 7.2, unit: "L", note: "3,6 L por caja (normalmente 2 cajas)" },
          { matId: "mat.bomag_bw161.filtro_cabina_aire_fresco", qty: 1, unit: "ud" },
          { matId: "mat.bomag_bw161.aceite_excitado_esparcidor_precision", qty: 0.2, unit: "L", note: "Opcional" }
        ],
        torques: []
      },
      h2000: {
        ops: ["op.bomag_bw161.h2000.aceite_hidraulico_cambiar_y_filtro", "op.bomag_bw161.h2000.refrigerante_cambiar"],
        materials: [
          { matId: "mat.bomag_bw161.aceite_hidraulico_hvlp46", qty: 80, unit: "L" },
          { matId: "mat.bomag_bw161.filtro_aceite_hidraulico", qty: 1, unit: "ud", note: "Juego/ud según configuración" },
          { matId: "mat.bomag_bw161.refrigerante", qty: 21, unit: "L" }
        ],
        torques: []
      }
    }
  };

  // Forzar asignación por máquina
  DB.machines["54015"] = { modelId: MODEL_BOMAG_BW161 };

  // =========================
  // Datos (54012 - HAMM HD110+)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.hamm_hd110.h10.freno_estacionamiento_comprobar", "Comprobar freno de estacionamiento.", { action: "comprobar", groupKey: "seguridad.freno_estacionamiento", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.parada_emergencia_comprobar_maquina_parada", "Comprobar función de PARADA DE EMERGENCIA (con máquina parada).", { action: "comprobar", groupKey: "seguridad.parada_emergencia", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.aceite_hidraulico_nivel_comprobar", "Comprobar nivel de aceite hidráulico.", { action: "comprobar", groupKey: "hidraulico.nivel_aceite", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.boquillas_pulverizadoras_limpiar", "Limpiar boquillas pulverizadoras.", { action: "limpiar", groupKey: "agua.boquillas", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.neumaticos_presion_comprobar", "Comprobar presión de aire en neumáticos.", { action: "comprobar", groupKey: "rodaje.neumaticos_presion", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.aceite_motor_nivel_comprobar", "Comprobar nivel de aceite del motor.", { action: "comprobar", groupKey: "motor.nivel_aceite", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.refrigerante_nivel_comprobar", "Comprobar nivel de refrigerante.", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.filtro_aire_comprobar_limpiar_vaciado_polvo", "Comprobar y limpiar filtro de aire / vaciado de polvo.", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.filtro_rociado_agua_limpiar", "Limpiar filtro de rociado de agua.", { action: "limpiar", groupKey: "agua.filtro_riego", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h10.separador_agua_vaciar", "Vaciar separador de agua.", { action: "limpiar", groupKey: "combustible.separador_agua", fuente: "HAMM HD110+" });

  // --- Operaciones (50 h - rodaje)
  addOp("op.hamm_hd110.h50_post.tuercas_tornillos_ruedas_asiento_comprobar", "Comprobar el firme asiento de las tuercas/tornillos de las ruedas.", { action: "comprobar", groupKey: "rodaje.tornilleria_ruedas", fuente: "HAMM HD110+" });

  // --- Operaciones (250 h)
  addOp("op.hamm_hd110.h250.rascadores_bandaje_neumaticos_comprobar_lubricar", "Comprobar rascadores del bandaje / rascador de neumáticos / lubricar rascador.", { action: "comprobar", groupKey: "rodillo.rascadores", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h250.aceite_vibrador_nivel_comprobar", "Comprobar nivel de aceite del vibrador.", { action: "comprobar", groupKey: "tambor.vibrador_aceite", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h250.correa_trapezoidal_tension_comprobar", "Comprobar tensión de la correa trapezoidal.", { action: "comprobar", groupKey: "motor.correa_trapezoidal", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h250.correa_trapezoidal_aa_tension_comprobar", "Comprobar tensión de la correa trapezoidal del aire acondicionado.", { action: "comprobar", groupKey: "motor.correa_aa", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h250.cojinete_articulacion_lubricar", "Lubricación del cojinete de la articulación.", { action: "limpiar", groupKey: "chasis.cojinete_articulacion", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h250.bulon_cilindro_direccion_lubricar", "Lubricación del bulón del cilindro de dirección.", { action: "limpiar", groupKey: "direccion.bulon_cilindro", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h250.bisagras_puertas_motor_lubricar", "Lubricación de las bisagras de las puertas de la cámara del motor.", { action: "limpiar", groupKey: "carroceria.bisagras_motor", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h250.radiador_comprobar", "Comprobación del radiador.", { action: "comprobar", groupKey: "motor.radiador", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h250.aa_conectar_15min", "Conectar el aire acondicionado durante al menos 15 minutos.", { action: "comprobar", groupKey: "cabina.aa_funcionamiento", fuente: "HAMM HD110+" });

  // --- Operaciones (500 h)
  addOp("op.hamm_hd110.h500.filtro_cabina_aire_fresco_cambiar", "Cambiar filtro de aire fresco de la cabina del conductor.", { action: "cambiar", groupKey: "cabina.filtro_aire_fresco", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.filtro_presion_hidraulico_cambiar", "Cambiar elemento del filtro de presión del sistema hidráulico.", { action: "cambiar", groupKey: "hidraulico.filtro_presion", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.elementos_amortiguadores_comprobar", "Comprobación de los elementos amortiguadores.", { action: "comprobar", groupKey: "suspension.amortiguadores", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.tuercas_tornillos_ruedas_asiento_comprobar", "Comprobar firme asiento de tuercas/tornillos de las ruedas.", { action: "comprobar", groupKey: "rodaje.tornilleria_ruedas", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.aceite_motor_cambiar", "Cambiar aceite del motor.", { action: "cambiar", groupKey: "motor.aceite", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.filtro_aceite_motor_cambiar", "Cambiar filtro de aceite del motor diésel.", { action: "cambiar", groupKey: "motor.filtro_aceite", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.filtro_combustible_cambiar", "Cambiar cartucho del filtro de combustible.", { action: "cambiar", groupKey: "motor.filtro_combustible", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.separador_suciedad_agua_cartucho_limpieza_cambio", "Limpieza / cambio del cartucho del separador de suciedad y agua.", { action: "limpiar", groupKey: "combustible.separador_suciedad_agua", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.prefiltro_combustible_cartucho_cambiar", "Sustitución del cartucho del filtro para el prefiltro de combustible.", { action: "cambiar", groupKey: "motor.prefiltro_combustible", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.filtro_aire_cartucho_sustituir", "Sustituir el cartucho del filtro de aire.", { action: "sustituir", groupKey: "motor.filtro_aire_principal", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h500.guias_reglaje_asiento_comprobar_limpiar", "Comprobación / limpieza del estado de las guías de reglaje del asiento.", { action: "limpiar", groupKey: "cabina.guias_asiento", fuente: "HAMM HD110+" });

  // --- Operaciones (2000 h)
  addOp("op.hamm_hd110.h2000.parada_emergencia_modo_marcha_comprobar", "Comprobar función de PARADA DE EMERGENCIA en modo de marcha.", { action: "comprobar", groupKey: "seguridad.parada_emergencia_marcha", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.sistema_rociado_agua_limpiar", "Limpieza del sistema de rociado de agua.", { action: "limpiar", groupKey: "agua.rociado_sistema", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.junta_tapa_valvula_cambiar", "Cambiar la junta de la tapa de la válvula.", { action: "cambiar", groupKey: "motor.junta_tapa_valvula", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.aceite_vibrador_cambiar", "Cambiar aceite del vibrador.", { action: "cambiar", groupKey: "tambor.vibrador_aceite", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.aceite_hidraulico_cambiar", "Cambio de aceite hidráulico.", { action: "cambiar", groupKey: "hidraulico.aceite", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.correa_trapezoidal_sustituir", "Cambiar correa trapezoidal.", { action: "sustituir", groupKey: "motor.correa_trapezoidal", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.correa_aa_sustituir", "Cambiar correa trapezoidal del aire acondicionado.", { action: "sustituir", groupKey: "motor.correa_aa", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.correa_dentada_cambiar", "Cambiar correa dentada.", { action: "cambiar", groupKey: "motor.correa_dentada", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.refrigerante_cambiar", "Cambio de refrigerante.", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.cartucho_seguridad_sustituir", "Sustitución del cartucho de seguridad.", { action: "sustituir", groupKey: "motor.filtro_aire_seguridad", fuente: "HAMM HD110+" });
  addOp("op.hamm_hd110.h2000.filtro_ventilacion_deposito_aceite_sustituir", "Cambiar el filtro de ventilación del depósito de aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_ventilacion_deposito", fuente: "HAMM HD110+" });

  // --- Materiales (HD110+)
  addMat("mat.hamm_hd110.aceite_motor", "Aceite de motor", { unit: "L", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.filtro_aceite_motor", "Cartucho filtro de aceite (aceite lubricante)", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.filtro_combustible", "Cartuchos filtro de combustible", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.prefiltro_combustible", "Cartucho filtro para prefiltro de combustible", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.filtro_separador_suciedad_agua", "Elemento filtro separador de suciedad y agua", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.filtro_hidraulico_presion", "Elemento filtro sistema hidráulico (presión)", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.filtro_aire", "Cartucho filtro de aire", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.filtro_cabina_conductor", "Elemento filtro cabina conductor", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.amortiguadores_bandaje", "Elementos amortiguadores para envolvente del bandaje", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.aceite_hidraulico", "Aceite hidráulico", { unit: "L", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.refrigerante", "Refrigerante", { unit: "L", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.aceite_vibrador", "Aceite de vibrador (2 × 6,5 L)", { unit: "L", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.junta_tapa_valvula", "Junta tapa de válvula", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.cartucho_seguridad", "Cartucho de seguridad (filtro de aire)", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.filtro_ventilacion_deposito", "Filtro de ventilación depósito de aceite", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.correa_generador", "Correa trapezoidal (generador)", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.correa_bomba_refrigerante", "Correa trapezoidal (bomba de refrigerante)", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.correa_aa", "Correa trapezoidal aire acondicionado (opcional)", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.correa_dentada_oscilacion", "Correa dentada (accionamiento de oscilación)", { unit: "ud", fuente: "HAMM HD110+" });
  addMat("mat.hamm_hd110.secador_aa", "Secador sistema aire acondicionado", { unit: "ud", fuente: "HAMM HD110+" });

  DB.templatesByModel[MODEL_HAMM_HD110] = {
    modelId: MODEL_HAMM_HD110,
    intervals: {
      h10: { ops: [
        "op.hamm_hd110.h10.freno_estacionamiento_comprobar",
        "op.hamm_hd110.h10.parada_emergencia_comprobar_maquina_parada",
        "op.hamm_hd110.h10.aceite_hidraulico_nivel_comprobar",
        "op.hamm_hd110.h10.boquillas_pulverizadoras_limpiar",
        "op.hamm_hd110.h10.neumaticos_presion_comprobar",
        "op.hamm_hd110.h10.aceite_motor_nivel_comprobar",
        "op.hamm_hd110.h10.refrigerante_nivel_comprobar",
        "op.hamm_hd110.h10.filtro_aire_comprobar_limpiar_vaciado_polvo",
        "op.hamm_hd110.h10.filtro_rociado_agua_limpiar",
        "op.hamm_hd110.h10.separador_agua_vaciar"
      ], materials: [], torques: [] },
      h50_post: { ops: ["op.hamm_hd110.h50_post.tuercas_tornillos_ruedas_asiento_comprobar"], materials: [], torques: [] },
      h250: { ops: [
        "op.hamm_hd110.h250.rascadores_bandaje_neumaticos_comprobar_lubricar",
        "op.hamm_hd110.h250.aceite_vibrador_nivel_comprobar",
        "op.hamm_hd110.h250.correa_trapezoidal_tension_comprobar",
        "op.hamm_hd110.h250.correa_trapezoidal_aa_tension_comprobar",
        "op.hamm_hd110.h250.cojinete_articulacion_lubricar",
        "op.hamm_hd110.h250.bulon_cilindro_direccion_lubricar",
        "op.hamm_hd110.h250.bisagras_puertas_motor_lubricar",
        "op.hamm_hd110.h250.radiador_comprobar",
        "op.hamm_hd110.h250.aa_conectar_15min"
      ], materials: [
        { matId: "mat.hamm_hd110.aceite_vibrador", qty: 13.0, unit: "L", note: "2×6,5 L (solo si procede)" },
        { matId: "mat.hamm_hd110.correa_generador", qty: 1, unit: "ud", note: "Solo si procede" },
        { matId: "mat.hamm_hd110.correa_bomba_refrigerante", qty: 1, unit: "ud", note: "Solo si procede" },
        { matId: "mat.hamm_hd110.correa_aa", qty: 1, unit: "ud", note: "Opcional; solo si procede" }
      ], torques: [] },
      h500: { ops: [
        "op.hamm_hd110.h500.filtro_cabina_aire_fresco_cambiar",
        "op.hamm_hd110.h500.filtro_presion_hidraulico_cambiar",
        "op.hamm_hd110.h500.elementos_amortiguadores_comprobar",
        "op.hamm_hd110.h500.tuercas_tornillos_ruedas_asiento_comprobar",
        "op.hamm_hd110.h500.aceite_motor_cambiar",
        "op.hamm_hd110.h500.filtro_aceite_motor_cambiar",
        "op.hamm_hd110.h500.filtro_combustible_cambiar",
        "op.hamm_hd110.h500.separador_suciedad_agua_cartucho_limpieza_cambio",
        "op.hamm_hd110.h500.prefiltro_combustible_cartucho_cambiar",
        "op.hamm_hd110.h500.filtro_aire_cartucho_sustituir",
        "op.hamm_hd110.h500.guias_reglaje_asiento_comprobar_limpiar"
      ], materials: [
        { matId: "mat.hamm_hd110.aceite_motor", qty: 11.5, unit: "L" },
        { matId: "mat.hamm_hd110.filtro_aceite_motor", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.filtro_combustible", qty: 2, unit: "ud" },
        { matId: "mat.hamm_hd110.prefiltro_combustible", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.filtro_separador_suciedad_agua", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.filtro_hidraulico_presion", qty: 2, unit: "ud" },
        { matId: "mat.hamm_hd110.filtro_aire", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.filtro_cabina_conductor", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.amortiguadores_bandaje", qty: 24, unit: "ud", note: "Solo si procede" }
      ], torques: [] },
      h2000: { ops: [
        "op.hamm_hd110.h2000.parada_emergencia_modo_marcha_comprobar",
        "op.hamm_hd110.h2000.sistema_rociado_agua_limpiar",
        "op.hamm_hd110.h2000.junta_tapa_valvula_cambiar",
        "op.hamm_hd110.h2000.aceite_vibrador_cambiar",
        "op.hamm_hd110.h2000.aceite_hidraulico_cambiar",
        "op.hamm_hd110.h2000.correa_trapezoidal_sustituir",
        "op.hamm_hd110.h2000.correa_aa_sustituir",
        "op.hamm_hd110.h2000.correa_dentada_cambiar",
        "op.hamm_hd110.h2000.refrigerante_cambiar",
        "op.hamm_hd110.h2000.cartucho_seguridad_sustituir",
        "op.hamm_hd110.h2000.filtro_ventilacion_deposito_aceite_sustituir"
      ], materials: [
        { matId: "mat.hamm_hd110.aceite_hidraulico", qty: 40.0, unit: "L" },
        { matId: "mat.hamm_hd110.refrigerante", qty: 16.0, unit: "L" },
        { matId: "mat.hamm_hd110.aceite_vibrador", qty: 13.0, unit: "L" },
        { matId: "mat.hamm_hd110.junta_tapa_valvula", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.cartucho_seguridad", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.filtro_ventilacion_deposito", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.correa_generador", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.correa_bomba_refrigerante", qty: 1, unit: "ud" },
        { matId: "mat.hamm_hd110.correa_aa", qty: 1, unit: "ud", note: "Opcional" },
        { matId: "mat.hamm_hd110.correa_dentada_oscilacion", qty: 2, unit: "ud" },
        { matId: "mat.hamm_hd110.secador_aa", qty: 1, unit: "ud" }
      ], torques: [] }
    }
  };

  DB.machines["54012"] = { modelId: MODEL_HAMM_HD110 };

  // =========================
  // Datos (54010/54011 - HAMM 3520)
  // =========================

  // --- Operaciones (10 h)
  addOp("op.hamm_3520.h10.filtro_aire_seco_comprobar_limpiar", "Comprobar y limpiar filtro de aire seco (incl. válvula de descarga de polvo; sustituir cartucho si procede).", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h10.aceite_hidraulico_nivel_comprobar", "Comprobar nivel de aceite hidráulico.", { action: "comprobar", groupKey: "hidraulico.nivel_aceite", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h10.refrigerante_nivel_comprobar", "Comprobar nivel de refrigerante.", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h10.freno_estacionamiento_comprobar", "Comprobar freno de estacionamiento.", { action: "comprobar", groupKey: "seguridad.freno_estacionamiento", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h10.parada_emergencia_funcionamiento_comprobar", "Comprobar funcionamiento de la PARADA DE EMERGENCIA.", { action: "comprobar", groupKey: "seguridad.parada_emergencia", fuente: "HAMM 3520" });

  // --- Operaciones (50 h - rodaje / puesta en servicio)
  addOp("op.hamm_3520.h50_post.aceite_motor_cambiar", "Cambiar aceite de motor.", { action: "cambiar", groupKey: "motor.aceite", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h50_post.filtro_aceite_motor_sustituir", "Sustituir filtro de aceite del motor.", { action: "sustituir", groupKey: "motor.filtro_aceite", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h50_post.filtros_combustible_sustituir", "Sustituir filtros de combustible (2 uds).", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h50_post.prefiltro_combustible_cartucho_sustituir", "Sustituir cartucho del prefiltro de combustible.", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h50_post.filtro_direccion_sustituir", "Sustituir elemento de filtro de dirección.", { action: "sustituir", groupKey: "direccion.filtro_presion", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h50_post.filtro_hidraulico_sustituir", "Sustituir elemento de filtro del sistema hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_presion", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h50_post.aceite_reductor_bandaje_cambiar", "Cambiar aceite del reductor del bandaje.", { action: "cambiar", groupKey: "rodillo.reductor_bandaje_aceite", fuente: "HAMM 3520" });

  // --- Operaciones (250 h)
  addOp("op.hamm_3520.h250.cojinetes_articulacion_lubricar", "Lubricar cojinete(s) de la articulación.", { action: "limpiar", groupKey: "chasis.cojinete_articulacion", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h250.puntos_articulacion_lubricar", "Lubricar puntos de articulación.", { action: "limpiar", groupKey: "chasis.puntos_articulacion", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h250.correa_polyv_estado_comprobar", "Comprobar estado de la correa Poly-V (sustituir si procede).", { action: "comprobar", groupKey: "motor.correa_polyv", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h250.radiador_comprobar_limpiar", "Comprobar radiador (limpieza si procede).", { action: "limpiar", groupKey: "motor.radiador", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h250.aceite_vibrador_nivel_comprobar", "Comprobar nivel de aceite en vibrador (en ambos lados si hay dos carcasas).", { action: "comprobar", groupKey: "tambor.vibrador_aceite", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h250.aceite_reductor_bandaje_nivel_comprobar", "Comprobar nivel de aceite en reductor del bandaje.", { action: "comprobar", groupKey: "rodillo.reductor_bandaje_aceite", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h250.aceite_diferencial_nivel_comprobar", "Comprobar nivel de aceite en diferencial.", { action: "comprobar", groupKey: "transmision.diferencial_nivel", fuente: "HAMM 3520" });

  // --- Operaciones (500 h)
  addOp("op.hamm_3520.h500.filtro_hidraulico_presion_sustituir", "Sustituir elemento de filtro de presión del sistema hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_presion", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h500.filtro_direccion_presion_sustituir", "Sustituir elemento de filtro de presión de la dirección.", { action: "sustituir", groupKey: "direccion.filtro_presion", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h500.prefiltro_combustible_cartucho_sustituir", "Sustituir cartucho del prefiltro de combustible (y purgar/verificar estanqueidad).", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "HAMM 3520" });

  // --- Operaciones (1000 h)
  addOp("op.hamm_3520.h1000.aceite_vibrador_cambiar", "Cambiar aceite en el vibrador (en ambos lados si hay dos carcasas).", { action: "cambiar", groupKey: "tambor.vibrador_aceite", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h1000.aceite_diferencial_cambiar", "Cambiar aceite en el diferencial.", { action: "cambiar", groupKey: "transmision.diferencial", fuente: "HAMM 3520" });

  // --- Operaciones (2000 h)
  addOp("op.hamm_3520.h2000.aceite_hidraulico_sustituir_y_filtro_ventilacion", "Sustituir aceite hidráulico y filtro de ventilación.", { action: "cambiar", groupKey: "hidraulico.aceite", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h2000.refrigerante_cambiar", "Cambiar refrigerante.", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h2000.cartucho_seguridad_filtro_aire_sustituir", "Sustituir cartucho de seguridad (filtro de aire).", { action: "sustituir", groupKey: "motor.filtro_aire_seguridad", fuente: "HAMM 3520" });
  addOp("op.hamm_3520.h2000.aceite_reductor_bandaje_cambiar", "Cambiar aceite en el reductor del bandaje.", { action: "cambiar", groupKey: "rodillo.reductor_bandaje_aceite", fuente: "HAMM 3520" });

  // --- Materiales (HAMM 3520)
  addMat("mat.hamm_3520.aceite_motor", "Aceite de motor", { unit: "L", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.filtro_aceite_motor_234486", "Cartucho filtro aceite motor 234486", { unit: "ud", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.filtro_combustible_2043673", "Cartuchos filtro combustible 2043673", { unit: "ud", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.prefiltro_combustible_1292404", "Cartucho prefiltro combustible 1292404", { unit: "ud", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.filtro_direccion_2031492", "Elemento filtro dirección 2031492", { unit: "ud", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.filtro_hidraulico_1285491", "Elemento filtro sistema hidráulico 1285491", { unit: "ud", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.aceite_reductor_bandaje", "Aceite reductor del bandaje", { unit: "L", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.cartucho_filtro_aire_1266748", "Cartucho filtro de aire 1266748", { unit: "ud", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.correa_polyv_1290991", "Correa Poly-V 1290991", { unit: "ud", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.aceite_diferencial", "Aceite del diferencial", { unit: "L", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.aceite_vibrador", "Aceite del vibrador", { unit: "L", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.aceite_hidraulico", "Aceite hidráulico", { unit: "L", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.filtro_ventilacion_1259334", "Filtro ventilación (depósito aceite / depósito combustible) 1259334", { unit: "ud", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.refrigerante", "Refrigerante", { unit: "L", fuente: "HAMM 3520" });
  addMat("mat.hamm_3520.cartucho_seguridad_1266721", "Cartucho de seguridad 1266721", { unit: "ud", fuente: "HAMM 3520" });

  DB.templatesByModel[MODEL_HAMM_3520] = {
    modelId: MODEL_HAMM_3520,
    intervals: {
      h10: { ops: [
        "op.hamm_3520.h10.filtro_aire_seco_comprobar_limpiar",
        "op.hamm_3520.h10.aceite_hidraulico_nivel_comprobar",
        "op.hamm_3520.h10.refrigerante_nivel_comprobar",
        "op.hamm_3520.h10.freno_estacionamiento_comprobar",
        "op.hamm_3520.h10.parada_emergencia_funcionamiento_comprobar"
      ], materials: [], torques: [] },
      h50_post: { ops: [
        "op.hamm_3520.h50_post.aceite_motor_cambiar",
        "op.hamm_3520.h50_post.filtro_aceite_motor_sustituir",
        "op.hamm_3520.h50_post.filtros_combustible_sustituir",
        "op.hamm_3520.h50_post.prefiltro_combustible_cartucho_sustituir",
        "op.hamm_3520.h50_post.filtro_direccion_sustituir",
        "op.hamm_3520.h50_post.filtro_hidraulico_sustituir",
        "op.hamm_3520.h50_post.aceite_reductor_bandaje_cambiar"
      ], materials: [
        { matId: "mat.hamm_3520.aceite_motor", qty: 15.5, unit: "L" },
        { matId: "mat.hamm_3520.filtro_aceite_motor_234486", qty: 1, unit: "ud" },
        { matId: "mat.hamm_3520.filtro_combustible_2043673", qty: 2, unit: "ud" },
        { matId: "mat.hamm_3520.prefiltro_combustible_1292404", qty: 1, unit: "ud" },
        { matId: "mat.hamm_3520.filtro_direccion_2031492", qty: 1, unit: "ud" },
        { matId: "mat.hamm_3520.filtro_hidraulico_1285491", qty: 1, unit: "ud" },
        { matId: "mat.hamm_3520.aceite_reductor_bandaje", qty: 4.0, unit: "L" }
      ], torques: [] },
      h250: { ops: [
        "op.hamm_3520.h250.cojinetes_articulacion_lubricar",
        "op.hamm_3520.h250.puntos_articulacion_lubricar",
        "op.hamm_3520.h250.correa_polyv_estado_comprobar",
        "op.hamm_3520.h250.radiador_comprobar_limpiar",
        "op.hamm_3520.h250.aceite_vibrador_nivel_comprobar",
        "op.hamm_3520.h250.aceite_reductor_bandaje_nivel_comprobar",
        "op.hamm_3520.h250.aceite_diferencial_nivel_comprobar"
      ], materials: [
        { matId: "mat.hamm_3520.correa_polyv_1290991", qty: 1, unit: "ud", note: "Solo si procede" }
      ], torques: [] },
      h500: { ops: [
        "op.hamm_3520.h500.filtro_hidraulico_presion_sustituir",
        "op.hamm_3520.h500.filtro_direccion_presion_sustituir",
        "op.hamm_3520.h500.prefiltro_combustible_cartucho_sustituir"
      ], materials: [
        { matId: "mat.hamm_3520.filtro_hidraulico_1285491", qty: 1, unit: "ud" },
        { matId: "mat.hamm_3520.filtro_direccion_2031492", qty: 1, unit: "ud" },
        { matId: "mat.hamm_3520.prefiltro_combustible_1292404", qty: 1, unit: "ud" },
        { matId: "mat.hamm_3520.aceite_diferencial", qty: 14.0, unit: "L" }
      ], torques: [] },
      h1000: { ops: [
        "op.hamm_3520.h1000.aceite_vibrador_cambiar",
        "op.hamm_3520.h1000.aceite_diferencial_cambiar"
      ], materials: [
        { matId: "mat.hamm_3520.aceite_vibrador", qty: 3.6, unit: "L", note: "2×1,8 L" },
        { matId: "mat.hamm_3520.aceite_diferencial", qty: 14.0, unit: "L" },
        { matId: "mat.hamm_3520.aceite_reductor_bandaje", qty: 4.0, unit: "L" }
      ], torques: [] },
      h2000: { ops: [
        "op.hamm_3520.h2000.aceite_hidraulico_sustituir_y_filtro_ventilacion",
        "op.hamm_3520.h2000.refrigerante_cambiar",
        "op.hamm_3520.h2000.cartucho_seguridad_filtro_aire_sustituir",
        "op.hamm_3520.h2000.aceite_reductor_bandaje_cambiar"
      ], materials: [
        { matId: "mat.hamm_3520.aceite_hidraulico", qty: 50.0, unit: "L" },
        { matId: "mat.hamm_3520.filtro_ventilacion_1259334", qty: 2, unit: "ud" },
        { matId: "mat.hamm_3520.refrigerante", qty: 22.0, unit: "L" },
        { matId: "mat.hamm_3520.cartucho_seguridad_1266721", qty: 1, unit: "ud" },
        { matId: "mat.hamm_3520.aceite_reductor_bandaje", qty: 4.0, unit: "L" }
      ], torques: [] }
    }
  };

  DB.machines["54010"] = { modelId: MODEL_HAMM_3520 };
  DB.machines["54011"] = { modelId: MODEL_HAMM_3520 };

  // =========================
  // Datos (52011/52012/52013/52014 - CASE SR175B)
  // =========================

  // --- Operaciones (10 h / diario - rutina)
  addOp("op.case_sr175b.h10.limpiar_orugas_y_componentes", "Limpiar orugas y componentes.", { action: "limpiar", groupKey: "rodaje.orugas_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h10.limpiar_refrigeradores_motor_hidraulico", "Limpiar refrigerador del motor y refrigerador hidráulico.", { action: "limpiar", groupKey: "motor.refrigeradores_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h10.refrigerante_motor_nivel_comprobar", "Comprobar nivel de refrigerante del motor.", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h10.aceite_motor_nivel_comprobar", "Comprobar nivel de aceite del motor.", { action: "comprobar", groupKey: "motor.nivel_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h10.engrasar_articulaciones_brazos_acoplador_cilindros", "Engrasar puntos de articulación de brazos del cargador, pasadores del acoplador y pasadores de cilindros (según elevación radial/vertical).", { action: "limpiar", groupKey: "chasis.engrase_articulaciones", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h10.aceite_hidraulico_nivel_comprobar", "Comprobar nivel de aceite hidráulico.", { action: "comprobar", groupKey: "hidraulico.nivel_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h10.interbloqueo_hidraulico_cuchara_brazo_comprobar", "Comprobar interbloqueo hidráulico de cuchara y brazo del cargador.", { action: "comprobar", groupKey: "hidraulico.interbloqueo_cuchara_brazo", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (primeras 10 h - una sola vez)
  addOp("op.case_sr175b.h10.primera_10h.oruga_tension_comprobar_ajustar", "Primeras 10 h (solo una vez): comprobar y ajustar la tensión de la oruga.", { action: "comprobar", groupKey: "rodaje.oruga_tension", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h10.primera_10h.neumaticos_presion_y_par_ruedas_comprobar", "Primeras 10 h (solo una vez): comprobar presión de neumáticos y par de apriete de la tornillería de las ruedas.", { action: "comprobar", groupKey: "rodaje.ruedas_par_apriete", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h10.primera_10h.correa_alternador_compresor_aa_tension_comprobar", "Primeras 10 h (solo una vez): comprobar tensión de la correa del alternador y compresor A/A (según equipamiento).", { action: "comprobar", groupKey: "motor.correas_alternador_aa", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (primeras 50 h - una sola vez)
  addOp("op.case_sr175b.h50_post.rops_mecanismo_tornilleria_comprobar", "Primeras 50 h (solo una vez): comprobar el mecanismo y la tornillería ROPS (estructura protectora antivuelcos).", { action: "comprobar", groupKey: "seguridad.rops", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (cada 50 h)
  addOp("op.case_sr175b.h50.oruga_tension_comprobar_ajustar", "Cada 50 h: comprobar y ajustar tensión de la oruga.", { action: "comprobar", groupKey: "rodaje.oruga_tension", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h50.neumaticos_presion_y_par_ruedas_comprobar", "Cada 50 h: comprobar presión de neumáticos y par de apriete de la tornillería de las ruedas.", { action: "comprobar", groupKey: "rodaje.ruedas_par_apriete", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h50.filtro_admision_cabina_mantener", "Cada 50 h: revisar / mantener filtro de admisión de cabina.", { action: "limpiar", groupKey: "cabina.filtro_admision", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h50.sujeciones_asiento_comprobar", "Cada 50 h: comprobar sujeciones del asiento.", { action: "comprobar", groupKey: "cabina.asiento_sujeciones", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (primeras 100 h - una sola vez)
  addOp("op.case_sr175b.h100.primera_100h.transmision_final_servicio_aceite", "Primeras 100 h (solo una vez): servicio de aceite de la transmisión final (modelos con orugas).", { action: "cambiar", groupKey: "rodaje.transmision_final_aceite", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (250 h)
  addOp("op.case_sr175b.h250.separador_combustible_agua_drenar", "Cada 250 h: drenar líquido del separador de combustible/agua.", { action: "limpiar", groupKey: "combustible.separador_agua", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h250.cadena_transmision_tension_comprobar", "Cada 250 h: comprobar tensión de la cadena de transmisión.", { action: "comprobar", groupKey: "rodaje.cadena_transmision_tension", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (500 h)
  addOp("op.case_sr175b.h500.aceite_motor_y_filtro_cambiar", "Cada 500 h: cambiar aceite y filtro del motor.", { action: "cambiar", groupKey: "motor.aceite_y_filtro", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h500.separador_agua_combustible_cartucho_sustituir", "Cada 500 h: sustituir cartucho del filtro separador de combustible/agua.", { action: "sustituir", groupKey: "combustible.separador_agua_cartucho", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h500.filtro_combustible_sustituir", "Cada 500 h: sustituir filtro de combustible.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h500.filtro_aceite_hidraulico_sustituir", "Cada 500 h: sustituir filtro de aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h500.deposito_aceite_cadena_final_nivel_comprobar", "Cada 500 h: comprobar (nivel) depósito de aceite de la cadena de transmisión final.", { action: "comprobar", groupKey: "rodaje.deposito_cadena_final_nivel", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h500.filtro_aire_mantenimiento", "Cada 500 h: mantenimiento de elementos del filtro de aire.", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h500.transmision_final_aceite_cambiar", "Cada 500 h: cambiar aceite de la transmisión final (modelos con orugas).", { action: "cambiar", groupKey: "rodaje.transmision_final_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h500.rops_mecanismo_tornilleria_comprobar", "Cada 500 h: comprobar mecanismo y tornillería ROPS.", { action: "comprobar", groupKey: "seguridad.rops", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h500.puerta_cabina_engrasar", "Cada 500 h: engrasar puerta de la cabina.", { action: "limpiar", groupKey: "cabina.puerta_engrase", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (1000 h)
  addOp("op.case_sr175b.h1000.aceite_hidraulico_y_filtro_cambiar", "Cada 1000 h: cambiar aceite y filtro hidráulico.", { action: "cambiar", groupKey: "hidraulico.aceite_y_filtro", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h1000.deposito_cadena_final_aceite_cambiar", "Cada 1000 h: cambiar aceite del depósito de la cadena de transmisión final.", { action: "cambiar", groupKey: "rodaje.deposito_cadena_final_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h1000.filtro_oms_sustituir", "Cada 1000 h: sustituir filtro separador de neblina de aceite (OMS).", { action: "sustituir", groupKey: "motor.filtro_oms", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (4000 h)
  addOp("op.case_sr175b.h4000.dpf_limpieza", "Cada 4000 h: DPF: limpieza.", { action: "limpiar", groupKey: "motor.dpf_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175b.h4000.refrigerante_motor_cambio_completo", "Cada 4000 h: sistema de refrigeración del motor: cambio de líquido.", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Materiales (SR175B)
  addMat("mat.case_sr175b.grasa", "Grasa (puntos de engrase)", { unit: "kg", note: "Según necesidad", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.refrigerante", "Refrigerante", { unit: "L", note: "Capacidad 15,6 L", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.aceite_motor", "Aceite motor (con filtro)", { unit: "L", note: "7,0 L (cambio con filtro)", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.aceite_hidraulico", "Aceite hidráulico", { unit: "L", note: "Capacidad 38,1 L", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.filtro_aceite_motor", "Filtro de aceite motor", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.cartucho_separador_agua_combustible", "Cartucho separador agua/combustible", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.filtro_hidraulico", "Filtro de aceite hidráulico", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.aceite_transmision_final", "Aceite transmisión final / compartimentos de cadena", { unit: "L", note: "7,4 L por lado (referencia)", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.sellador_roscas_loctite_545", "Sellador de roscas (LOCTITE 545 o equivalente)", { unit: "", note: "Según necesidad", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.filtro_oms", "Filtro OMS (separador de neblina de aceite)", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175b.filtro_admision_cabina", "Filtro admisión cabina", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });

  // Plantilla por modelo (SR175B)
  DB.templatesByModel[MODEL_CASE_SR175B] = {
    modelId: MODEL_CASE_SR175B,
    intervals: {
      // Primeras 10 h (puesta en servicio) - SOLO una vez
      h10_post: {
        ops: [
          "op.case_sr175b.h10.primera_10h.oruga_tension_comprobar_ajustar",
          "op.case_sr175b.h10.primera_10h.neumaticos_presion_y_par_ruedas_comprobar",
          "op.case_sr175b.h10.primera_10h.correa_alternador_compresor_aa_tension_comprobar"
        ],
        materials: [],
        torques: []
      },
      // Cada 10 h / diario (rutina)
      h10: {
        ops: [
          "op.case_sr175b.h10.limpiar_orugas_y_componentes",
          "op.case_sr175b.h10.limpiar_refrigeradores_motor_hidraulico",
          "op.case_sr175b.h10.refrigerante_motor_nivel_comprobar",
          "op.case_sr175b.h10.aceite_motor_nivel_comprobar",
          "op.case_sr175b.h10.engrasar_articulaciones_brazos_acoplador_cilindros",
          "op.case_sr175b.h10.aceite_hidraulico_nivel_comprobar",
          "op.case_sr175b.h10.interbloqueo_hidraulico_cuchara_brazo_comprobar"
        ],
        materials: [{ matId: "mat.case_sr175b.grasa", note: "Según necesidad" }],
        torques: []
      },
      h50_post: {
        ops: ["op.case_sr175b.h50_post.rops_mecanismo_tornilleria_comprobar"],
        materials: [],
        torques: []
      },
      h50: {
        ops: [
          "op.case_sr175b.h50.oruga_tension_comprobar_ajustar",
          "op.case_sr175b.h50.neumaticos_presion_y_par_ruedas_comprobar",
          "op.case_sr175b.h50.filtro_admision_cabina_mantener",
          "op.case_sr175b.h50.sujeciones_asiento_comprobar"
        ],
        materials: [{ matId: "mat.case_sr175b.filtro_admision_cabina", qty: 1, unit: "ud", note: "Si se sustituye" }],
        torques: []
      },
      // Primeras 100 h (puesta en servicio) - SOLO una vez
      h100_post: {
        ops: ["op.case_sr175b.h100.primera_100h.transmision_final_servicio_aceite"],
        materials: [{ matId: "mat.case_sr175b.aceite_transmision_final", qty: 14.8, unit: "L", note: "7,4 L por lado (referencia)" }],
        torques: []
      },
      h250: {
        ops: ["op.case_sr175b.h250.separador_combustible_agua_drenar", "op.case_sr175b.h250.cadena_transmision_tension_comprobar"],
        materials: [],
        torques: []
      },
      h500: {
        ops: [
          "op.case_sr175b.h500.aceite_motor_y_filtro_cambiar",
          "op.case_sr175b.h500.separador_agua_combustible_cartucho_sustituir",
          "op.case_sr175b.h500.filtro_combustible_sustituir",
          "op.case_sr175b.h500.filtro_aceite_hidraulico_sustituir",
          "op.case_sr175b.h500.deposito_aceite_cadena_final_nivel_comprobar",
          "op.case_sr175b.h500.filtro_aire_mantenimiento",
          "op.case_sr175b.h500.transmision_final_aceite_cambiar",
          "op.case_sr175b.h500.rops_mecanismo_tornilleria_comprobar",
          "op.case_sr175b.h500.puerta_cabina_engrasar"
        ],
        materials: [
          { matId: "mat.case_sr175b.aceite_motor", qty: 7.0, unit: "L" },
          { matId: "mat.case_sr175b.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.case_sr175b.cartucho_separador_agua_combustible", qty: 1, unit: "ud" },
          { matId: "mat.case_sr175b.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.case_sr175b.filtro_hidraulico", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h1000: {
        ops: ["op.case_sr175b.h1000.aceite_hidraulico_y_filtro_cambiar", "op.case_sr175b.h1000.deposito_cadena_final_aceite_cambiar", "op.case_sr175b.h1000.filtro_oms_sustituir"],
        materials: [
          { matId: "mat.case_sr175b.aceite_hidraulico", qty: 38.1, unit: "L" },
          { matId: "mat.case_sr175b.filtro_hidraulico", qty: 1, unit: "ud", note: "Si aplica en el cambio" },
          { matId: "mat.case_sr175b.aceite_transmision_final", qty: 14.8, unit: "L", note: "Cambio depósito cadena final" },
          { matId: "mat.case_sr175b.sellador_roscas_loctite_545", note: "Según necesidad" },
          { matId: "mat.case_sr175b.filtro_oms", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h4000: {
        ops: ["op.case_sr175b.h4000.dpf_limpieza", "op.case_sr175b.h4000.refrigerante_motor_cambio_completo"],
        materials: [{ matId: "mat.case_sr175b.refrigerante", qty: 15.6, unit: "L" }],
        torques: []
      }
    }
  };

  // Forzar asignación por máquina (todas iguales)
  DB.machines["52011"] = { modelId: MODEL_CASE_SR175B };
  DB.machines["52012"] = { modelId: MODEL_CASE_SR175B };
  DB.machines["52013"] = { modelId: MODEL_CASE_SR175B };
  DB.machines["52014"] = { modelId: MODEL_CASE_SR175B };
  
  // =========================
  // Datos (52015/52016 - CASE SR210B)
  // =========================

  // --- Operaciones (10 h / diario - rutina)
  addOp("op.case_sr210b.h10.limpiar_orugas_y_componentes", "Limpiar orugas y componentes.", { action: "limpiar", groupKey: "rodaje.orugas_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h10.limpiar_radiador_motor_y_refrigerador_hidraulico", "Limpiar radiador motor y refrigerador hidráulico.", { action: "limpiar", groupKey: "motor.refrigeradores_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h10.refrigerante_motor_nivel_comprobar", "Comprobar nivel de refrigerante del motor.", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h10.aceite_motor_nivel_comprobar", "Comprobar nivel de aceite del motor.", { action: "comprobar", groupKey: "motor.nivel_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h10.engrasar_articulaciones_brazos_acoplador_cilindros", "Engrasar puntos de articulación (brazos cargador, pasadores acoplador y pasadores de cilindros) según tipo de elevación (radial/vertical).", { action: "engrasar", groupKey: "chasis.engrase_articulaciones", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h10.aceite_hidraulico_nivel_comprobar", "Comprobar nivel de aceite hidráulico.", { action: "comprobar", groupKey: "hidraulico.nivel_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h10.interbloqueo_hidraulico_cuchara_brazo_comprobar", "Comprobar interbloqueo hidráulico de cuchara y brazos.", { action: "comprobar", groupKey: "hidraulico.interbloqueo_cuchara_brazo", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (primeras 10 h - una sola vez)
  addOp("op.case_sr210b.h10.primera_10h.oruga_tension_comprobar_ajustar", "Primeras 10 h (solo una vez): comprobar y ajustar tensión de la oruga (tras las primeras 10 h en máquina nueva o con cadenas nuevas).", { action: "comprobar", groupKey: "rodaje.oruga_tension", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (primeras 50 h - una sola vez)
  addOp("op.case_sr210b.h50_post.rops_mecanismo_tornilleria_comprobar", "Primeras 50 h (solo una vez): comprobar mecanismo y tornillería de la estructura ROPS.", { action: "comprobar", groupKey: "seguridad.rops", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (cada 50 h)
  addOp("op.case_sr210b.h50.oruga_tension_comprobar_ajustar", "Cada 50 h: comprobar y ajustar tensión de la oruga.", { action: "comprobar", groupKey: "rodaje.oruga_tension", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (primeras 100 h - una sola vez)
  addOp("op.case_sr210b.h100.primera_100h.transmision_final_aceite_cambiar", "Primeras 100 h (solo una vez): cambiar aceite de la transmisión final (modelos con orugas).", { action: "cambiar", groupKey: "rodaje.transmision_final_aceite", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (250 h)
  addOp("op.case_sr210b.h250.separador_combustible_agua_drenar", "Cada 250 h: drenar líquido del filtro separador de combustible/agua.", { action: "drenar", groupKey: "motor.separador_agua_combustible", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h250.cadena_transmision_tension_comprobar", "Cada 250 h: comprobar tensión de la cadena de transmisión.", { action: "comprobar", groupKey: "rodaje.cadena_transmision_tension", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (500 h)
  addOp("op.case_sr210b.h500.aceite_motor_y_filtro_cambiar", "Cada 500 h: cambiar aceite y filtro del motor.", { action: "cambiar", groupKey: "motor.aceite_y_filtro", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h500.separador_agua_combustible_cartucho_sustituir", "Cada 500 h: sustituir cartucho del filtro separador de combustible/agua.", { action: "sustituir", groupKey: "motor.separador_agua_combustible", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h500.filtro_combustible_sustituir", "Cada 500 h: sustituir filtro de combustible.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h500.filtro_hidraulico_sustituir", "Cada 500 h: sustituir filtro de aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h500.deposito_aceite_cadena_final_nivel_comprobar", "Cada 500 h: comprobar depósito de aceite de la cadena de transmisión final.", { action: "comprobar", groupKey: "rodaje.deposito_cadena_final_nivel", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h500.filtros_aire_principal_secundario_sustituir", "Cada 500 h: sustituir filtros de aire (principal + secundario).", { action: "sustituir", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h500.transmision_final_aceite_cambiar", "Cada 500 h: cambiar aceite de la transmisión final (modelos con orugas).", { action: "cambiar", groupKey: "rodaje.transmision_final_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h500.rops_mecanismo_tornilleria_comprobar", "Cada 500 h: comprobar mecanismo y tornillería ROPS.", { action: "comprobar", groupKey: "seguridad.rops", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h500.puerta_cabina_bisagras_engrasar", "Cada 500 h: engrasar bisagras de la puerta de cabina.", { action: "engrasar", groupKey: "cabina.puerta_engrase", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (1000 h)
  addOp("op.case_sr210b.h1000.aceite_hidraulico_y_filtro_cambiar", "Cada 1000 h: cambiar aceite y filtro hidráulico.", { action: "cambiar", groupKey: "hidraulico.aceite_y_filtro", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h1000.deposito_cadena_final_nivel_comprobar", "Cada 1000 h: comprobar depósito de aceite de la cadena de transmisión final.", { action: "comprobar", groupKey: "rodaje.deposito_cadena_final_nivel", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (1500 h - SR210B)
  addOp("op.case_sr210b.h1500.egr_mantenimiento", "Cada 1500 h (SR210B): mantenimiento del sistema de recirculación de escape (EGR).", { action: "comprobar", groupKey: "motor.egr_mantenimiento", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Operaciones (4000 h)
  addOp("op.case_sr210b.h4000.dpf_limpieza", "Cada 4000 h: limpieza de filtros de partículas diésel (DPF).", { action: "limpiar", groupKey: "motor.dpf_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr210b.h4000.refrigerante_motor_cambio_completo", "Cada 4000 h: cambiar líquido del sistema de refrigeración del motor.", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL OPERADOR SR-175 B" });

  // --- Materiales (SR210B)
  addMat("mat.case_sr210b.grasa", "Grasa (puntos de engrase)", { unit: "", note: "Según necesidad", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.refrigerante", "Refrigerante (CASE AKCELA ACTIFULL OT ELC o equivalente)", { unit: "L", note: "Capacidad 17,0 L", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.aceite_motor", "Aceite motor (cárter, con cambio de filtro)", { unit: "L", note: "8,5 L (SR210B)", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.aceite_hidraulico", "Aceite hidráulico (sistema)", { unit: "L", note: "Capacidad sistema 38,1 L (depósito 15,0 L)", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.filtro_aceite_motor", "Filtro de aceite motor", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.cartucho_separador_agua_combustible", "Cartucho filtro separador combustible/agua", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.filtro_hidraulico", "Filtro de aceite hidráulico", { unit: "ud", note: "Instalación: junta tórica aceitada y apriete a mano", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.filtro_aire_principal", "Filtro de aire principal", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.filtro_aire_secundario", "Filtro de aire secundario", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.aceite_transmision_final", "Aceite transmisión final (orugas)", { unit: "L", note: "1,0 L por lado (±0,1 L)", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.aceite_cadena_compartimentos", "Aceite compartimentos/depósito cadena (SR210B)", { unit: "L", note: "Capacidad orientativa 26,0 L por lado (hasta nivel)", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr210b.grasa_puerta_cabina", "Grasa bisagras puerta cabina (TUTELA MOLY GREASE GR-75 o equivalente)", { unit: "", note: "Según necesidad", fuente: "MANUAL OPERADOR SR-175 B" });

  // Plantilla por modelo (SR210B)
  DB.templatesByModel[MODEL_CASE_SR210B] = {
    modelId: MODEL_CASE_SR210B,
    intervals: {
      // Primeras 10 h (puesta en servicio) - SOLO una vez
      h10_post: {
        ops: ["op.case_sr210b.h10.primera_10h.oruga_tension_comprobar_ajustar"],
        materials: [],
        torques: []
      },
      // Cada 10 h / diario (rutina)
      h10: {
        ops: [
          "op.case_sr210b.h10.limpiar_orugas_y_componentes",
          "op.case_sr210b.h10.limpiar_radiador_motor_y_refrigerador_hidraulico",
          "op.case_sr210b.h10.refrigerante_motor_nivel_comprobar",
          "op.case_sr210b.h10.aceite_motor_nivel_comprobar",
          "op.case_sr210b.h10.engrasar_articulaciones_brazos_acoplador_cilindros",
          "op.case_sr210b.h10.aceite_hidraulico_nivel_comprobar",
          "op.case_sr210b.h10.interbloqueo_hidraulico_cuchara_brazo_comprobar"
        ],
        materials: [{ matId: "mat.case_sr210b.grasa", note: "Según necesidad" }],
        torques: []
      },
      // Primeras 50 h (puesta en servicio) - SOLO una vez
      h50_post: {
        ops: ["op.case_sr210b.h50_post.rops_mecanismo_tornilleria_comprobar"],
        materials: [],
        torques: []
      },
      // Cada 50 h
      h50: {
        ops: ["op.case_sr210b.h50.oruga_tension_comprobar_ajustar"],
        materials: [],
        torques: []
      },
      // Primeras 100 h (puesta en servicio) - SOLO una vez
      h100_post: {
        ops: ["op.case_sr210b.h100.primera_100h.transmision_final_aceite_cambiar"],
        materials: [{ matId: "mat.case_sr210b.aceite_transmision_final", qty: 2.0, unit: "L", note: "1,0 L por lado (±0,1 L)" }],
        torques: []
      },
      h250: {
        ops: ["op.case_sr210b.h250.separador_combustible_agua_drenar", "op.case_sr210b.h250.cadena_transmision_tension_comprobar"],
        materials: [],
        torques: []
      },
      h500: {
        ops: [
          "op.case_sr210b.h500.aceite_motor_y_filtro_cambiar",
          "op.case_sr210b.h500.separador_agua_combustible_cartucho_sustituir",
          "op.case_sr210b.h500.filtro_combustible_sustituir",
          "op.case_sr210b.h500.filtro_hidraulico_sustituir",
          "op.case_sr210b.h500.deposito_aceite_cadena_final_nivel_comprobar",
          "op.case_sr210b.h500.filtros_aire_principal_secundario_sustituir",
          "op.case_sr210b.h500.transmision_final_aceite_cambiar",
          "op.case_sr210b.h500.rops_mecanismo_tornilleria_comprobar",
          "op.case_sr210b.h500.puerta_cabina_bisagras_engrasar"
        ],
        materials: [
          { matId: "mat.case_sr210b.aceite_motor", qty: 8.5, unit: "L" },
          { matId: "mat.case_sr210b.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.case_sr210b.cartucho_separador_agua_combustible", qty: 1, unit: "ud" },
          { matId: "mat.case_sr210b.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.case_sr210b.filtro_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.case_sr210b.filtro_aire_principal", qty: 1, unit: "ud" },
          { matId: "mat.case_sr210b.filtro_aire_secundario", qty: 1, unit: "ud" },
          { matId: "mat.case_sr210b.aceite_transmision_final", qty: 2.0, unit: "L", note: "1,0 L por lado (±0,1 L)" },
          { matId: "mat.case_sr210b.grasa_puerta_cabina", note: "Según necesidad" }
        ],
        torques: []
      },
      h1000: {
        ops: ["op.case_sr210b.h1000.aceite_hidraulico_y_filtro_cambiar", "op.case_sr210b.h1000.deposito_cadena_final_nivel_comprobar"],
        materials: [
          { matId: "mat.case_sr210b.aceite_hidraulico", qty: 38.1, unit: "L" },
          { matId: "mat.case_sr210b.filtro_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.case_sr210b.aceite_cadena_compartimentos", note: "Hasta nivel" }
        ],
        torques: []
      },
      h1500: {
        ops: ["op.case_sr210b.h1500.egr_mantenimiento"],
        materials: [],
        torques: []
      },
      h4000: {
        ops: ["op.case_sr210b.h4000.dpf_limpieza", "op.case_sr210b.h4000.refrigerante_motor_cambio_completo"],
        materials: [{ matId: "mat.case_sr210b.refrigerante", qty: 17.0, unit: "L" }],
        torques: []
      }
    }
  };

  DB.machines["52015"] = { modelId: MODEL_CASE_SR210B };
  DB.machines["52016"] = { modelId: MODEL_CASE_SR210B };
  
  // =========================
  // Datos (52008/52009 - CASE SR175)
  // =========================
  
  // --- Operaciones (10 h / diario - rutina)
  addOp("op.case_sr175.h10.limpiar_cadenas_y_componentes", "Limpiar cadenas y componentes (orugas/rodillos/ruedas/piñón), especialmente si se ha trabajado en barro.", { action: "limpiar", groupKey: "rodaje.cadenas_y_componentes_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h10.limpiar_inspeccionar_refrigeradores_motor_hidraulico", "Limpiar/inspeccionar refrigerador del motor y refrigerador hidráulico (aire comprimido o agua a presión moderada; no usar hidrolimpiadora).", { action: "limpiar", groupKey: "motor.refrigeradores_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h10.refrigerante_motor_nivel_comprobar", "Comprobar nivel de refrigerante del motor.", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h10.aceite_motor_nivel_comprobar", "Comprobar nivel de aceite del motor.", { action: "comprobar", groupKey: "motor.nivel_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h10.engrasar_brazo_puntos_pivotantes_pasadores", "Engrasar: brazo de elevación, puntos pivotantes, pasadores de acoplamiento y pasadores de los cilindros.", { action: "engrasar", groupKey: "chasis.engrase_articulaciones", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h10.aceite_hidraulico_nivel_comprobar", "Comprobar nivel de aceite de la instalación hidráulica.", { action: "comprobar", groupKey: "hidraulico.nivel_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h10.seguridad_cinturon_barra_bloqueo_asiento_comprobar", "Comprobar funcionamiento del cinturón y la barra de seguridad, y el bloqueo del asiento.", { action: "comprobar", groupKey: "seguridad.cinturon_barra_asiento", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // --- Operaciones (primeras 10 h - una sola vez)
  addOp("op.case_sr175.h10.primera_10h.oruga_tension_comprobar_ajustar", "Primeras 10 h (solo una vez): comprobar y ajustar tensión de la oruga (máquina nueva / orugas nuevas).", { action: "comprobar", groupKey: "rodaje.oruga_tension", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // --- Operaciones (cada 50 h)
  addOp("op.case_sr175.h50.filtro_admision_cabina_inspeccionar_limpiar", "Cada 50 h: inspeccionar/limpiar (y sustituir si procede) el filtro de admisión de la cabina.", { action: "limpiar", groupKey: "cabina.filtro_admision", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h50.correa_aa_y_alternador_tension_comprobar", "Cada 50 h: comprobar tensión de la correa del compresor del A/A y del alternador (si equipa).", { action: "comprobar", groupKey: "motor.correas_alternador_aa", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h50.rops_mecanismo_tornilleria_comprobar", "Cada 50 h: comprobar mecanismo y tornillería de la estructura ROPS.", { action: "comprobar", groupKey: "seguridad.rops", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h50.oruga_tension_comprobar_ajustar", "Cada 50 h: comprobar tensión de oruga.", { action: "comprobar", groupKey: "rodaje.oruga_tension", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // --- Operaciones (250 h)
  addOp("op.case_sr175.h250.filtro_combustible_en_linea_sustituir", "Cada 250 h: sustituir filtro de combustible en línea.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h250.prefiltro_combustible_comprobar_drenar_agua", "Cada 250 h: prefiltro de combustible: comprobar/drenar para ver si hay agua.", { action: "drenar", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h250.cadena_transmision_tension_comprobar", "Cada 250 h: comprobar tensión de la cadena de transmisión (primera a 250 h y luego cada 500 h).", { action: "comprobar", groupKey: "rodaje.cadena_transmision_tension", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // --- Operaciones (500 h)
  addOp("op.case_sr175.h500.aceite_motor_y_filtro_cambiar", "Cada 500 h: cambiar aceite y filtro del motor.", { action: "cambiar", groupKey: "motor.aceite_y_filtro", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h500.prefiltro_combustible_sustituir", "Cada 500 h: sustituir prefiltro de combustible.", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h500.filtro_combustible_sustituir", "Cada 500 h: sustituir filtro de combustible.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h500.deposito_aceite_cadena_final_nivel_comprobar", "Cada 500 h: comprobar nivel del aceite del depósito de la cadena de transmisión final (rellenar si procede).", { action: "comprobar", groupKey: "rodaje.deposito_cadena_final_nivel", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h500.cadena_transmision_tension_comprobar", "Cada 500 h: comprobar tensión de cadena de transmisión.", { action: "comprobar", groupKey: "rodaje.cadena_transmision_tension", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // --- Operaciones (1000 h)
  addOp("op.case_sr175.h1000.aceite_hidraulico_y_filtro_cambiar", "Cada 1000 h: cambiar aceite hidráulico y filtro hidráulico.", { action: "cambiar", groupKey: "hidraulico.aceite_y_filtro", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h1000.depositos_cadenas_aceite_cambiar", "Cada 1000 h: cambiar aceite de los depósitos de las cadenas (cadena de transmisión final).", { action: "cambiar", groupKey: "rodaje.deposito_cadena_final_aceite", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h1000.filtro_oms_sustituir", "Cada 1000 h: sustituir filtro separador de niebla de aceite (OMS) (cartucho; junta tórica si está dañada).", { action: "sustituir", groupKey: "motor.filtro_oms", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // --- Operaciones (2000 h)
  addOp("op.case_sr175.h2000.refrigerante_motor_drenar_descargar", "Cada 2000 h: drenaje y descarga del refrigerante del motor.", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL OPERADOR SR-175 B" });
  addOp("op.case_sr175.h2000.filtro_recirculacion_gases_escape_sustituir", "Cada 2000 h: sustituir filtro de recirculación de los gases de escape.", { action: "sustituir", groupKey: "motor.filtro_recirculacion_gases_escape", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // --- Operaciones (4000 h)
  addOp("op.case_sr175.h4000.dpf_servicio", "Cada 4000 h: servicio del filtro de partículas diésel (DPF).", { action: "limpiar", groupKey: "motor.dpf_limpieza", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // --- Materiales (SR175)
  addMat("mat.case_sr175.grasa_molibdisulfuro", "Grasa de molibdisulfuro (racores de engrase)", { unit: "", note: "Según necesidad", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.refrigerante", "Refrigerante (mezcla 50% agua destilada / 50% etilenglicol)", { unit: "L", note: "Capacidad 15,6 L", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.aceite_motor", "Aceite motor (cambio con filtro)", { unit: "L", note: "7,0 L", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.filtro_aceite_motor", "Filtro de aceite motor", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.prefiltro_combustible", "Prefiltro de combustible", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.filtro_combustible", "Filtro de combustible", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.aceite_deposito_cadena_final", "Aceite depósito cadena transmisión final (CASE AKCELA SUPER UNIVERSAL 10W-30 o equivalente)", { unit: "L", note: "Relleno según nivel", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.sellador_roscas_loctite_545", "Sellador de roscas (LOCTITE 545 o equivalente)", { unit: "", note: "Según uso", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.aceite_hidraulico", "Aceite hidráulico (sistema)", { unit: "L", note: "Capacidad sistema 38,1 L", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.filtro_hidraulico", "Filtro hidráulico", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.aceite_depositos_cadenas", "Aceite depósitos de cadenas (CASE AKCELA ENGINE OIL 10W-30 o equivalente)", { unit: "L", note: "7,4 L por lado (14,8 L total)", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.filtro_oms", "Filtro OMS (separador de niebla de aceite)", { unit: "ud", note: "Incluye junta tórica si procede", fuente: "MANUAL OPERADOR SR-175 B" });
  addMat("mat.case_sr175.filtro_recirculacion_gases_escape", "Filtro recirculación de gases de escape", { unit: "ud", fuente: "MANUAL OPERADOR SR-175 B" });
  
  // Plantilla por modelo (SR175)
  DB.templatesByModel[MODEL_CASE_SR175] = {
    modelId: MODEL_CASE_SR175,
    intervals: {
      // Primeras 10 h (puesta en servicio) - SOLO una vez
      h10_post: {
        ops: ["op.case_sr175.h10.primera_10h.oruga_tension_comprobar_ajustar"],
        materials: [],
        torques: []
      },
      // Cada 10 h / diario (rutina)
      h10: {
        ops: [
          "op.case_sr175.h10.limpiar_cadenas_y_componentes",
          "op.case_sr175.h10.limpiar_inspeccionar_refrigeradores_motor_hidraulico",
          "op.case_sr175.h10.refrigerante_motor_nivel_comprobar",
          "op.case_sr175.h10.aceite_motor_nivel_comprobar",
          "op.case_sr175.h10.engrasar_brazo_puntos_pivotantes_pasadores",
          "op.case_sr175.h10.aceite_hidraulico_nivel_comprobar",
          "op.case_sr175.h10.seguridad_cinturon_barra_bloqueo_asiento_comprobar"
        ],
        materials: [{ matId: "mat.case_sr175.grasa_molibdisulfuro", note: "Según necesidad" }],
        torques: []
      },
      // Cada 50 h
      h50: {
        ops: [
          "op.case_sr175.h50.filtro_admision_cabina_inspeccionar_limpiar",
          "op.case_sr175.h50.correa_aa_y_alternador_tension_comprobar",
          "op.case_sr175.h50.rops_mecanismo_tornilleria_comprobar",
          "op.case_sr175.h50.oruga_tension_comprobar_ajustar"
        ],
        materials: [],
        torques: []
      },
      h250: {
        ops: [
          "op.case_sr175.h250.filtro_combustible_en_linea_sustituir",
          "op.case_sr175.h250.prefiltro_combustible_comprobar_drenar_agua",
          "op.case_sr175.h250.cadena_transmision_tension_comprobar"
        ],
        materials: [{ matId: "mat.case_sr175.filtro_combustible", qty: 1, unit: "ud", note: "Filtro en línea" }],
        torques: []
      },
      h500: {
        ops: [
          "op.case_sr175.h500.aceite_motor_y_filtro_cambiar",
          "op.case_sr175.h500.prefiltro_combustible_sustituir",
          "op.case_sr175.h500.filtro_combustible_sustituir",
          "op.case_sr175.h500.deposito_aceite_cadena_final_nivel_comprobar",
          "op.case_sr175.h500.cadena_transmision_tension_comprobar"
        ],
        materials: [
          { matId: "mat.case_sr175.aceite_motor", qty: 7.0, unit: "L" },
          { matId: "mat.case_sr175.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.case_sr175.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.case_sr175.filtro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.case_sr175.sellador_roscas_loctite_545", note: "Según uso" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.case_sr175.h1000.aceite_hidraulico_y_filtro_cambiar",
          "op.case_sr175.h1000.depositos_cadenas_aceite_cambiar",
          "op.case_sr175.h1000.filtro_oms_sustituir"
        ],
        materials: [
          { matId: "mat.case_sr175.aceite_hidraulico", qty: 38.1, unit: "L" },
          { matId: "mat.case_sr175.filtro_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.case_sr175.aceite_depositos_cadenas", qty: 14.8, unit: "L" },
          { matId: "mat.case_sr175.sellador_roscas_loctite_545", note: "Según uso" },
          { matId: "mat.case_sr175.filtro_oms", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h2000: {
        ops: [
          "op.case_sr175.h2000.refrigerante_motor_drenar_descargar",
          "op.case_sr175.h2000.filtro_recirculacion_gases_escape_sustituir"
        ],
        materials: [
          { matId: "mat.case_sr175.refrigerante", qty: 15.6, unit: "L" },
          { matId: "mat.case_sr175.filtro_recirculacion_gases_escape", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h4000: {
        ops: ["op.case_sr175.h4000.dpf_servicio"],
        materials: [],
        torques: []
      }
    }
  };
  
  // Forzar asignación por máquina (todas iguales)
  DB.machines["52008"] = { modelId: MODEL_CASE_SR175 };
  DB.machines["52009"] = { modelId: MODEL_CASE_SR175 };
  
  // =========================
  // Datos (60002 - WIRTGEN WR2400)
  // =========================
  
  // --- Operaciones (10 h)
  addOp("op.wirtgen_wr2400.h10.seguridad_funcionamiento_previo", "Seguridad/estado general: controlar el funcionamiento antes de comenzar a trabajar y asegurarse del buen funcionamiento general.", { action: "comprobar", groupKey: "seguridad.funcionamiento_previo", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.limpieza_general_maquina", "Limpieza general: limpiar la máquina al completo.", { action: "limpiar", groupKey: "general.limpieza", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.rodillos_control_fugas", "Grupo fresador: engranaje de los rodillos: control visual de fugas.", { action: "comprobar", groupKey: "fresador.rodillos_fugas", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.rodillos_iman_tapon_llenado_comprobar", "Grupo fresador: engranaje de los rodillos: comprobar que el imán del tapón de llenado no esté sucio.", { action: "comprobar", groupKey: "fresador.rodillos_iman_tapon", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.picas_controlar", "Grupo fresador: cambio de picas: controlar picas varias veces.", { action: "comprobar", groupKey: "fresador.picas", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.porta_picas_controlar", "Grupo fresador: porta-picas: controlar porta-picas varias veces.", { action: "comprobar", groupKey: "fresador.porta_picas", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.bombas_aglutinante_fugas_controlar", "Grupo fresador: bombas de aglutinante: controlar fugas.", { action: "comprobar", groupKey: "fresador.bombas_aglutinante", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.toberas_pulverizadoras_controlar", "Grupo fresador: toberas pulverizadoras: controlar toberas / zona de la caja del rodillo.", { action: "comprobar", groupKey: "fresador.toberas", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.filtro_betun_elemento_comprobar", "Grupo fresador: filtro de betún: comprobar el elemento filtrante.", { action: "comprobar", groupKey: "fresador.filtro_betun", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.neumaticos_controlar", "Neumáticos: controlar neumáticos y comprobar presión.", { action: "comprobar", groupKey: "rodaje.neumaticos", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.agua_reserva_comprobar", "Sistema de agua: comprobar repetidas veces la reserva de agua.", { action: "comprobar", groupKey: "agua.reserva", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.agua_tamiz_filtro_controlar", "Sistema de agua: controlar el tamiz del filtro.", { action: "comprobar", groupKey: "agua.tamiz_filtro", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.agua_filtro_elemento_comprobar", "Sistema de agua: comprobar el elemento filtrante del filtro de agua.", { action: "comprobar", groupKey: "agua.filtro_elemento", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.aire_comprimido_conexion_controlar", "Caldera aire comprimido: controlar conexión de aire comprimido.", { action: "comprobar", groupKey: "airecomprimido.conexion", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.puntos_lubricacion_lubricar", "Lubricación: puntos de lubricación: lubricar o engrasar.", { action: "engrasar", groupKey: "general.lubricacion", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.motor_aceite_nivel_comprobar", "Motor diésel: comprobar nivel de aceite.", { action: "comprobar", groupKey: "motor.nivel_aceite", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.separador_agua_filtro_comprobar", "Motor diésel: comprobar filtro del separador de agua.", { action: "comprobar", groupKey: "motor.separador_agua_combustible", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.filtros_aire_comprobar", "Motor diésel: comprobar filtros de aire.", { action: "comprobar", groupKey: "motor.filtro_aire_principal", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.radiador_nervios_comprobar", "Motor diésel: comprobar nervios del radiador.", { action: "comprobar", groupKey: "motor.radiador_nervios", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.refrigerante_nivel_comprobar", "Motor diésel: comprobar nivel de refrigerante.", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.hidraulico_deposito_aceite_nivel_comprobar", "Depósito aceite hidráulico: comprobar nivel de aceite.", { action: "comprobar", groupKey: "hidraulico.nivel_aceite", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.hidraulico_filtros_suciedad_comprobar", "Filtros hidráulicos: comprobar repetidas veces si hay suciedad.", { action: "comprobar", groupKey: "hidraulico.filtros_suciedad", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.hidraulico_radiador_nervios_comprobar", "Radiador aceite hidráulico: comprobar repetidas veces nervios del radiador.", { action: "comprobar", groupKey: "hidraulico.radiador_nervios", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h10.combustible_deposito_nivel_comprobar", "Depósito de combustible: comprobar repetidas veces el nivel de combustible.", { action: "comprobar", groupKey: "motor.combustible_nivel", fuente: "WIRTGEN WR2400" });
  
  // --- Operaciones (50 h)
  addOp("op.wirtgen_wr2400.h50.calefaccion_elemento_filtrante_comprobar", "Cabina: calefacción: comprobar el elemento filtrante.", { action: "comprobar", groupKey: "cabina.calefaccion_filtro", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h50.limpiaparabrisas_agua_nivel_comprobar", "Cabina: limpiaparabrisas: comprobar el nivel de agua.", { action: "comprobar", groupKey: "cabina.limpiaparabrisas_agua", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h50.aire_acondicionado_conectar", "Cabina: aire acondicionado (según versión): conectar el sistema.", { action: "comprobar", groupKey: "cabina.aire_acondicionado", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h50.iluminacion_contactos_comprobar", "Iluminación/sistema de aviso: comprobar contactos.", { action: "comprobar", groupKey: "electrico.iluminacion_contactos", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h50.rodillos_aceite_nivel_comprobar", "Grupo fresador: engranaje de los rodillos: comprobar nivel de aceite.", { action: "comprobar", groupKey: "fresador.rodillos_aceite", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h50.cojinete_rodillo_derecha_aceite_nivel_comprobar", "Grupo fresador: cojinete del rodillo (derecha): comprobar nivel de aceite.", { action: "comprobar", groupKey: "fresador.cojinete_rodillo_derecha", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h50.rodadura_avance_aceite_nivel_comprobar", "Accionamiento de avance: engranaje de rodadura: comprobar nivel de aceite.", { action: "comprobar", groupKey: "rodaje.rodadura_aceite", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h50.bomba_agua_betun_aceite_nivel_comprobar", "Bomba de agua de betún: comprobar nivel de aceite.", { action: "comprobar", groupKey: "fresador.bomba_agua_betun_aceite", fuente: "WIRTGEN WR2400" });
  
  // --- Operaciones (100 h)
  addOp("op.wirtgen_wr2400.h100.motor_exterior_comprobar_si_sucio", "Motor/periféricos: comprobar el motor por fuera (si está sucio).", { action: "comprobar", groupKey: "motor.inspeccion_exterior", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.mangueras_controlar", "Motor/periféricos: controlar mangueras.", { action: "comprobar", groupKey: "motor.mangueras", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.abrazaderas_mangueras_controlar", "Motor/periféricos: controlar abrazaderas de mangueras.", { action: "comprobar", groupKey: "motor.abrazaderas_mangueras", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.correa_trapezoidal_tension_comprobar", "Motor/periféricos: comprobar la tensión de la correa trapezoidal.", { action: "comprobar", groupKey: "motor.correa_trapezoidal", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.cinta_arrastre_tope_rodillo_tensor_controlar", "Grupo fresador/transmisión: cinta de arrastre: controlar el tope del rodillo tensor.", { action: "comprobar", groupKey: "transmision.cinta_arrastre_tope", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.cinta_arrastre_cintas_transmision_controlar", "Grupo fresador/transmisión: cinta de arrastre: controlar las cintas de transmisión.", { action: "comprobar", groupKey: "transmision.cinta_arrastre_cintas", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.porta_picas_reapretar_tornillos", "Grupo fresador/transmisión: (porta-picas recambiables) reapretar tornillos de sujeción.", { action: "comprobar", groupKey: "fresador.porta_picas_tornilleria", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.bateria_nivel_acido_comprobar", "Eléctrico: batería: comprobar nivel de ácido.", { action: "comprobar", groupKey: "electrico.bateria_acido", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.bateria_engrasar_polos", "Eléctrico: batería: engrasar polos.", { action: "engrasar", groupKey: "electrico.bateria_polos", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h100.ac_esterilla_filtro_cambiar", "Aire acondicionado (según versión): cambiar la esterilla del filtro (si aplica).", { action: "cambiar", groupKey: "cabina.ac_esterilla_filtro", fuente: "WIRTGEN WR2400" });
  
  // --- Operaciones (250 h)
  addOp("op.wirtgen_wr2400.h250.juego_valvulas_comprobar_ajustar", "Motor: comprobar el juego de válvulas (ajustar si es necesario).", { action: "comprobar", groupKey: "motor.juego_valvulas", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h250.rodillos_aceite_cambiar_y_limpiar_filtro", "Aceites: engranaje de los rodillos: cambiar aceite / limpiar filtro.", { action: "cambiar", groupKey: "fresador.rodillos_aceite", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h250.cojinete_rodillo_derecha_aceite_cambiar", "Aceites: cojinete del rodillo (derecha): cambiar aceite.", { action: "cambiar", groupKey: "fresador.cojinete_rodillo_derecha", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h250.bomba_hidraulica_accionamiento_aceite_cambiar", "Aceites: accionamiento bomba hidráulico: cambiar aceite.", { action: "cambiar", groupKey: "hidraulico.bomba_accionamiento_aceite", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h250.hidraulico_filtro_elemento_cambiar", "Hidráulico: filtros hidráulicos: cambiar elemento filtrante.", { action: "cambiar", groupKey: "hidraulico.filtros_suciedad", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h250.rodadura_avance_aceite_cambiar", "Aceites: engranaje de rodadura (avance): cambiar aceite.", { action: "cambiar", groupKey: "rodaje.rodadura_aceite", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h250.bomba_agua_betun_aceite_cambiar", "Aceites: bomba de agua de betún: cambiar aceite.", { action: "cambiar", groupKey: "fresador.bomba_agua_betun_aceite", fuente: "WIRTGEN WR2400" });
  
  // --- Operaciones (500 h)
  addOp("op.wirtgen_wr2400.h500.agua_tanque_cartucho_protector_cambiar", "Sistema de agua: cambiar cartucho protector del tanque.", { action: "cambiar", groupKey: "agua.cartucho_protector", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h500.hidraulico_deposito_aceite_cambiar", "Depósito aceite hidráulico: cambiar aceite.", { action: "cambiar", groupKey: "hidraulico.deposito_aceite", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h500.hidraulico_deposito_elemento_filtrante_cambiar", "Depósito aceite hidráulico: cambiar elemento filtrante.", { action: "cambiar", groupKey: "hidraulico.deposito_filtro", fuente: "WIRTGEN WR2400" });
  
  // --- Operaciones (1000 h)
  addOp("op.wirtgen_wr2400.h1000.calefaccion_elemento_filtrante_limpiar_o_cambiar", "Calefacción: limpiar o cambiar el elemento filtrante.", { action: "limpiar", groupKey: "cabina.calefaccion_filtro", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h1000.ac_filtro_aire_cambiar", "Aire acondicionado (según versión): cambiar filtro de aire.", { action: "cambiar", groupKey: "cabina.ac_filtro_aire", fuente: "WIRTGEN WR2400" });
  addOp("op.wirtgen_wr2400.h1000.ac_secadora_cambiar_servicio", "Aire acondicionado (según versión): cambiar secadora (empresa especializada).", { action: "cambiar", groupKey: "cabina.ac_secadora", fuente: "WIRTGEN WR2400" });
  
  // --- Materiales (WR2400)
  addMat("mat.wirtgen_wr2400.grasa", "Grasa para puntos de engrase", { unit: "", note: "Según puntos", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.agua_limpiaparabrisas", "Agua limpiaparabrisas", { unit: "", note: "Rellenar si procede", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.agua_sistema", "Agua (sistema de agua)", { unit: "", note: "Rellenar hasta nivel si procede", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.utiles_limpieza", "Útiles/consumibles de limpieza (trapos, desengrasante, soplado)", { unit: "", note: "Según necesidad", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.esterilla_filtro_ac", "Esterilla filtro A/C", { unit: "ud", note: "Si aplica", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.elemento_filtrante_hidraulico", "Elemento filtrante hidráulico (depósito)", { unit: "ud", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.aceite_hidraulico_deposito", "Aceite hidráulico (depósito)", { unit: "", note: "Según capacidad", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.cartucho_protector_tanque_agua", "Cartucho protector tanque de agua", { unit: "ud", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.filtro_aire_ac", "Filtro de aire A/C", { unit: "ud", fuente: "WIRTGEN WR2400" });
  addMat("mat.wirtgen_wr2400.secadora_ac", "Secadora A/C", { unit: "ud", note: "Servicio especializado", fuente: "WIRTGEN WR2400" });
  
  DB.templatesByModel[MODEL_WIRTGEN_WR2400] = {
    modelId: MODEL_WIRTGEN_WR2400,
    intervals: {
      h10: { ops: [
        "op.wirtgen_wr2400.h10.seguridad_funcionamiento_previo",
        "op.wirtgen_wr2400.h10.limpieza_general_maquina",
        "op.wirtgen_wr2400.h10.rodillos_control_fugas",
        "op.wirtgen_wr2400.h10.rodillos_iman_tapon_llenado_comprobar",
        "op.wirtgen_wr2400.h10.picas_controlar",
        "op.wirtgen_wr2400.h10.porta_picas_controlar",
        "op.wirtgen_wr2400.h10.bombas_aglutinante_fugas_controlar",
        "op.wirtgen_wr2400.h10.toberas_pulverizadoras_controlar",
        "op.wirtgen_wr2400.h10.filtro_betun_elemento_comprobar",
        "op.wirtgen_wr2400.h10.neumaticos_controlar",
        "op.wirtgen_wr2400.h10.agua_reserva_comprobar",
        "op.wirtgen_wr2400.h10.agua_tamiz_filtro_controlar",
        "op.wirtgen_wr2400.h10.agua_filtro_elemento_comprobar",
        "op.wirtgen_wr2400.h10.aire_comprimido_conexion_controlar",
        "op.wirtgen_wr2400.h10.puntos_lubricacion_lubricar",
        "op.wirtgen_wr2400.h10.motor_aceite_nivel_comprobar",
        "op.wirtgen_wr2400.h10.separador_agua_filtro_comprobar",
        "op.wirtgen_wr2400.h10.filtros_aire_comprobar",
        "op.wirtgen_wr2400.h10.radiador_nervios_comprobar",
        "op.wirtgen_wr2400.h10.refrigerante_nivel_comprobar",
        "op.wirtgen_wr2400.h10.hidraulico_deposito_aceite_nivel_comprobar",
        "op.wirtgen_wr2400.h10.hidraulico_filtros_suciedad_comprobar",
        "op.wirtgen_wr2400.h10.hidraulico_radiador_nervios_comprobar",
        "op.wirtgen_wr2400.h10.combustible_deposito_nivel_comprobar"
      ], materials: [
        { matId: "mat.wirtgen_wr2400.grasa", note: "Según puntos" },
        { matId: "mat.wirtgen_wr2400.agua_sistema", note: "Rellenar si procede" },
        { matId: "mat.wirtgen_wr2400.utiles_limpieza", note: "Según necesidad" }
      ], torques: [] },
      h50: { ops: [
        "op.wirtgen_wr2400.h50.calefaccion_elemento_filtrante_comprobar",
        "op.wirtgen_wr2400.h50.limpiaparabrisas_agua_nivel_comprobar",
        "op.wirtgen_wr2400.h50.aire_acondicionado_conectar",
        "op.wirtgen_wr2400.h50.iluminacion_contactos_comprobar",
        "op.wirtgen_wr2400.h50.rodillos_aceite_nivel_comprobar",
        "op.wirtgen_wr2400.h50.cojinete_rodillo_derecha_aceite_nivel_comprobar",
        "op.wirtgen_wr2400.h50.rodadura_avance_aceite_nivel_comprobar",
        "op.wirtgen_wr2400.h50.bomba_agua_betun_aceite_nivel_comprobar"
      ], materials: [
        { matId: "mat.wirtgen_wr2400.agua_limpiaparabrisas", note: "Rellenar si procede" }
      ], torques: [] },
      h100: { ops: [
        "op.wirtgen_wr2400.h100.motor_exterior_comprobar_si_sucio",
        "op.wirtgen_wr2400.h100.mangueras_controlar",
        "op.wirtgen_wr2400.h100.abrazaderas_mangueras_controlar",
        "op.wirtgen_wr2400.h100.correa_trapezoidal_tension_comprobar",
        "op.wirtgen_wr2400.h100.cinta_arrastre_tope_rodillo_tensor_controlar",
        "op.wirtgen_wr2400.h100.cinta_arrastre_cintas_transmision_controlar",
        "op.wirtgen_wr2400.h100.porta_picas_reapretar_tornillos",
        "op.wirtgen_wr2400.h100.bateria_nivel_acido_comprobar",
        "op.wirtgen_wr2400.h100.bateria_engrasar_polos",
        "op.wirtgen_wr2400.h100.ac_esterilla_filtro_cambiar"
      ], materials: [
        { matId: "mat.wirtgen_wr2400.esterilla_filtro_ac", qty: 1, unit: "ud", note: "Si aplica" }
      ], torques: [] },
      h250: { ops: [
        "op.wirtgen_wr2400.h250.juego_valvulas_comprobar_ajustar",
        "op.wirtgen_wr2400.h250.rodillos_aceite_cambiar_y_limpiar_filtro",
        "op.wirtgen_wr2400.h250.cojinete_rodillo_derecha_aceite_cambiar",
        "op.wirtgen_wr2400.h250.bomba_hidraulica_accionamiento_aceite_cambiar",
        "op.wirtgen_wr2400.h250.hidraulico_filtro_elemento_cambiar",
        "op.wirtgen_wr2400.h250.rodadura_avance_aceite_cambiar",
        "op.wirtgen_wr2400.h250.bomba_agua_betun_aceite_cambiar"
      ], materials: [], torques: [] },
      h500: { ops: [
        "op.wirtgen_wr2400.h500.agua_tanque_cartucho_protector_cambiar",
        "op.wirtgen_wr2400.h500.hidraulico_deposito_aceite_cambiar",
        "op.wirtgen_wr2400.h500.hidraulico_deposito_elemento_filtrante_cambiar"
      ], materials: [
        { matId: "mat.wirtgen_wr2400.cartucho_protector_tanque_agua", qty: 1, unit: "ud" },
        { matId: "mat.wirtgen_wr2400.aceite_hidraulico_deposito", note: "Según capacidad" },
        { matId: "mat.wirtgen_wr2400.elemento_filtrante_hidraulico", qty: 1, unit: "ud" }
      ], torques: [] },
      h1000: { ops: [
        "op.wirtgen_wr2400.h1000.calefaccion_elemento_filtrante_limpiar_o_cambiar",
        "op.wirtgen_wr2400.h1000.ac_filtro_aire_cambiar",
        "op.wirtgen_wr2400.h1000.ac_secadora_cambiar_servicio"
      ], materials: [
        { matId: "mat.wirtgen_wr2400.filtro_aire_ac", qty: 1, unit: "ud" },
        { matId: "mat.wirtgen_wr2400.secadora_ac", qty: 1, unit: "ud" }
      ], torques: [] }
    }
  };
  
  DB.machines["60002"] = { modelId: MODEL_WIRTGEN_WR2400 };

  // =========================
  // Datos (58005 - PRECRIBADOR MOVIL KLEEMANN) - MOBIREX MR 130 Z
  // =========================

  // --- Operaciones (puesta en marcha 0 h)
  addOp("op.kleemann_mr130z.h0_post.machacadora_chapas_deflectoras_fijacion_comprobar", "Puesta en marcha (0 h): machacadora: comprobar fijación de las chapas deflectoras.", { action: "comprobar", groupKey: "machacadora.chapas_deflectoras", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h0_post.criba_amplitud_oscilacion_controlar", "Puesta en marcha (0 h): criba vibratoria: controlar amplitud de oscilación.", { action: "comprobar", groupKey: "criba.amplitud_oscilacion", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (50 h)
  addOp("op.kleemann_mr130z.h50.machacadora_laberintos_reengrasar", "50 h: machacadora: reengrasar laberintos.", { action: "engrasar", groupKey: "machacadora.laberintos", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h50.machacadora_correa_trapezoidal_comprobar_tensar", "50 h: machacadora: comprobar correa trapezoidal y, si procede, tensar.", { action: "comprobar", groupKey: "machacadora.correa_trapezoidal", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h50.criba_lubricar_grasa", "50 h: criba vibratoria: lubricar cribadora (grasa).", { action: "engrasar", groupKey: "criba.lubricacion", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h50.arbol_cardan_tornillos_reapretar", "50 h: árbol cardán: reapretar tornillos.", { action: "comprobar", groupKey: "transmision.arbol_cardan_tornillos", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h50.arbol_cardan_engrasar", "50 h: árbol cardán: engrasar.", { action: "engrasar", groupKey: "transmision.arbol_cardan_lubricacion", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h50.cojinete_criba_tornillos_reapretar", "50 h: cojinete de criba: reapretar tornillos.", { action: "comprobar", groupKey: "criba.cojinete_tornillos", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h50.canaletas_transportador_motores_vibratorios_sujecion_comprobar", "50 h: canaletas del transportador vibratorio: comprobar sujeción de los motores vibratorios.", { action: "comprobar", groupKey: "transportador_vibratorio.motores_sujecion", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h50.cinta_descarga_principal_tambor_inversion_lubricar", "50 h: transportador de cinta: lubricar cinta de descarga principal (tambor de inversión).", { action: "engrasar", groupKey: "cintas.tambor_inversion_lubricacion", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (100 h)
  addOp("op.kleemann_mr130z.h100.machacadora_rodamientos_reengrasar", "100 h: machacadora: reengrasar rodamientos.", { action: "engrasar", groupKey: "machacadora.rodamientos", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h100.canaletas_transportador_cajas_terminales_estanqueidad_comprobar", "100 h: canaletas del transportador vibratorio: comprobar estanqueidad de las cajas de terminales.", { action: "comprobar", groupKey: "transportador_vibratorio.cajas_terminales", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h100.hidraulico_conducciones_fugas_danos_comprobar", "100 h: sistema hidráulico: comprobar conducciones hidráulicas frente a fugas o daños.", { action: "comprobar", groupKey: "hidraulico.conducciones", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (125 h)
  addOp("op.kleemann_mr130z.h125.machacadora_chapas_deflectoras_fijacion_comprobar", "125 h: machacadora: comprobar fijación de chapas deflectoras (revisión tras puesta en marcha).", { action: "comprobar", groupKey: "machacadora.chapas_deflectoras", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (200 h)
  addOp("op.kleemann_mr130z.h200.orugas_engranaje_planetario_aceite_cambiar_primera_vez", "200 h: mecanismo de desplazamiento por orugas: cambio de aceite del engranaje planetario (primera vez).", { action: "cambiar", groupKey: "orugas.engranaje_planetario_aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h200.generador_cojinete_transmision_lubricar", "200 h: generador diésel: lubricar cojinete de transmisión.", { action: "engrasar", groupKey: "generador.cojinete_transmision", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h200.generador_correas_dentadas_comprobar_tensar", "200 h: generador diésel: comprobar/tensar correas dentadas del generador.", { action: "comprobar", groupKey: "generador.correas_dentadas", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (250 h)
  addOp("op.kleemann_mr130z.h250.machacadora_chapas_desgaste_comprobar", "250 h: machacadora: comprobar chapas de desgaste.", { action: "comprobar", groupKey: "machacadora.chapas_desgaste", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (500 h)
  addOp("op.kleemann_mr130z.h500.criba_aceite_cambiar", "500 h: criba vibratoria: cambio de aceite.", { action: "cambiar", groupKey: "criba.aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h500.canaletas_transportador_motores_vibratorios_sujecion_comprobar", "500 h: canaletas del transportador vibratorio: comprobar sujeción de motores vibratorios.", { action: "comprobar", groupKey: "transportador_vibratorio.motores_sujecion", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h500.cintas_accionamientos_aceite_cambiar_primera_vez", "500 h: transportador de cinta: cambio de aceite de los accionamientos de cinta (primera vez).", { action: "cambiar", groupKey: "cintas.accionamientos_aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h500.hidraulico_filtro_retorno_cambiar", "500 h: sistema hidráulico: cambiar filtro de retorno.", { action: "sustituir", groupKey: "hidraulico.filtro_retorno", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h500.hidraulico_filtro_aspiracion_cambiar", "500 h: sistema hidráulico: cambiar filtro de aspiración.", { action: "sustituir", groupKey: "hidraulico.filtro_aspiracion", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h500.hidraulico_aceite_cambiar_o_controlar_estado", "500 h: sistema hidráulico: cambio de aceite o control de estado del aceite.", { action: "comprobar", groupKey: "hidraulico.aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (1000 h)
  addOp("op.kleemann_mr130z.h1000.criba_aceite_cambiar", "1000 h: criba vibratoria: cambio de aceite.", { action: "cambiar", groupKey: "criba.aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h1000.hidraulico_filtro_retorno_cambiar", "1000 h: sistema hidráulico: cambiar filtro de retorno.", { action: "sustituir", groupKey: "hidraulico.filtro_retorno", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h1000.hidraulico_filtro_aspiracion_cambiar", "1000 h: sistema hidráulico: cambiar filtro de aspiración.", { action: "sustituir", groupKey: "hidraulico.filtro_aspiracion", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (2000 h)
  addOp("op.kleemann_mr130z.h2000.cintas_accionamientos_aceite_cambiar", "2000 h: transportador de cinta: cambio de aceite de los accionamientos de cinta.", { action: "cambiar", groupKey: "cintas.accionamientos_aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h2000.cintas_tornillo_purga_filtro_magnetico_limpiar", "2000 h: transportador de cinta: limpiar tornillo de purga con filtro magnético (en cada cambio de aceite).", { action: "limpiar", groupKey: "cintas.tornillo_magnetico", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h2000.cintas_apoyo_cojinete_grasa_cambiar", "2000 h: transportador de cinta: cambiar grasa del apoyo con cojinete (cinta descarga lateral / accionamiento cinta descarga principal).", { action: "cambiar", groupKey: "cintas.apoyo_cojinete_grasa", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h2000.hidraulico_aceite_cambiar_o_controlar_estado", "2000 h: sistema hidráulico: cambio de aceite o control de estado del aceite.", { action: "comprobar", groupKey: "hidraulico.aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h2000.orugas_engranaje_planetario_aceite_cambiar", "2000 h: mecanismo de desplazamiento por orugas: cambio de aceite del engranaje planetario.", { action: "cambiar", groupKey: "orugas.engranaje_planetario_aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Operaciones (10.000 h)
  addOp("op.kleemann_mr130z.h10000.criba_engranaje_conico_aceite_cambiar", "10.000 h: criba vibratoria: cambio de aceite del engranaje cónico.", { action: "cambiar", groupKey: "criba.engranaje_conico_aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h10000.unidad_cribado_posterior_engranaje_conico_aceite_cambiar", "10.000 h: unidad de cribado posterior (opcional): cambio de aceite del engranaje cónico.", { action: "cambiar", groupKey: "criba_posterior.engranaje_conico_aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h10000.cintas_motor_tambor_aceite_cambiar", "10.000 h: transportador de cinta: cambio de aceite del motor de tambor de los accionamientos de cinta.", { action: "cambiar", groupKey: "cintas.motor_tambor_aceite", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addOp("op.kleemann_mr130z.h10000.cintas_tornillo_purga_filtro_magnetico_limpiar", "10.000 h: transportador de cinta: limpiar tornillo de purga con filtro magnético (en cada cambio de aceite).", { action: "limpiar", groupKey: "cintas.tornillo_magnetico", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  // --- Materiales (KLEEMANN MR130Z)
  addMat("mat.kleemann_mr130z.grasa_general", "Grasa (puntos de engrase / cribadora / cardán)", { unit: "", note: "Cantidad N/D (según engrasadores)", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.grasa_generador_cojinete_30g", "Grasa cojinete transmisión generador", { unit: "g", note: "~30 g por cojinete", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.aceite_planetario_orugas", "Aceite engranaje planetario (orugas)", { unit: "", note: "ISO VG 150/220 según temperatura; llenado por nivel (cantidad N/D)", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.aceite_criba_vibratoria", "Aceite criba vibratoria", { unit: "", note: "Cantidad N/D", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.aceite_accionamientos_cinta", "Aceite accionamientos de cinta", { unit: "", note: "Cantidad N/D (según reductor/motor)", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.filtro_hidraulico_retorno", "Filtro hidráulico de retorno", { unit: "ud", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.filtro_hidraulico_aspiracion", "Filtro hidráulico de aspiración", { unit: "ud", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.aceite_hidraulico", "Aceite hidráulico (sistema)", { unit: "", note: "Tipo según tabla del manual; cantidad N/D", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.grasa_apoyo_cojinete", "Grasa apoyo con cojinete (cintas)", { unit: "", note: "Cantidad N/D", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.absorbente_limpieza", "Material absorbente / trapos (limpieza tornillo magnético, etc.)", { unit: "", note: "Cantidad N/D", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.aceite_engranaje_conico", "Aceite engranaje cónico (criba/unidad posterior)", { unit: "", note: "Cantidad N/D", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });
  addMat("mat.kleemann_mr130z.aceite_motor_tambor", "Aceite motor de tambor (accionamientos de cinta)", { unit: "", note: "Cantidad según placa/tamaño (N/D)", fuente: "Instrucciones de servicio MOBIREX MR 130 Z (16/01/2009)" });

  DB.templatesByModel[MODEL_PRECRIBADOR_MOVIL_KLEEMANN] = {
    modelId: MODEL_PRECRIBADOR_MOVIL_KLEEMANN,
    intervals: {
      h0_post: { ops: [
        "op.kleemann_mr130z.h0_post.machacadora_chapas_deflectoras_fijacion_comprobar",
        "op.kleemann_mr130z.h0_post.criba_amplitud_oscilacion_controlar"
      ], materials: [], torques: [] },
      h50: { ops: [
        "op.kleemann_mr130z.h50.machacadora_laberintos_reengrasar",
        "op.kleemann_mr130z.h50.machacadora_correa_trapezoidal_comprobar_tensar",
        "op.kleemann_mr130z.h50.criba_lubricar_grasa",
        "op.kleemann_mr130z.h50.arbol_cardan_tornillos_reapretar",
        "op.kleemann_mr130z.h50.arbol_cardan_engrasar",
        "op.kleemann_mr130z.h50.cojinete_criba_tornillos_reapretar",
        "op.kleemann_mr130z.h50.canaletas_transportador_motores_vibratorios_sujecion_comprobar",
        "op.kleemann_mr130z.h50.cinta_descarga_principal_tambor_inversion_lubricar"
      ], materials: [{ matId: "mat.kleemann_mr130z.grasa_general", note: "Cantidad N/D" }], torques: [] },
      h100: { ops: [
        "op.kleemann_mr130z.h100.machacadora_rodamientos_reengrasar",
        "op.kleemann_mr130z.h100.canaletas_transportador_cajas_terminales_estanqueidad_comprobar",
        "op.kleemann_mr130z.h100.hidraulico_conducciones_fugas_danos_comprobar"
      ], materials: [{ matId: "mat.kleemann_mr130z.grasa_general", note: "Cantidad N/D" }, { matId: "mat.kleemann_mr130z.absorbente_limpieza", note: "Cantidad N/D" }], torques: [] },
      h125: { ops: [
        "op.kleemann_mr130z.h125.machacadora_chapas_deflectoras_fijacion_comprobar"
      ], materials: [], torques: [] },
      h200: { ops: [
        "op.kleemann_mr130z.h200.orugas_engranaje_planetario_aceite_cambiar_primera_vez",
        "op.kleemann_mr130z.h200.generador_cojinete_transmision_lubricar",
        "op.kleemann_mr130z.h200.generador_correas_dentadas_comprobar_tensar"
      ], materials: [
        { matId: "mat.kleemann_mr130z.aceite_planetario_orugas", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.grasa_generador_cojinete_30g", qty: 30, unit: "g", note: "Por cojinete" }
      ], torques: [] },
      h250: { ops: [
        "op.kleemann_mr130z.h250.machacadora_chapas_desgaste_comprobar"
      ], materials: [], torques: [] },
      h500: { ops: [
        "op.kleemann_mr130z.h500.criba_aceite_cambiar",
        "op.kleemann_mr130z.h500.canaletas_transportador_motores_vibratorios_sujecion_comprobar",
        "op.kleemann_mr130z.h500.cintas_accionamientos_aceite_cambiar_primera_vez",
        "op.kleemann_mr130z.h500.hidraulico_filtro_retorno_cambiar",
        "op.kleemann_mr130z.h500.hidraulico_filtro_aspiracion_cambiar",
        "op.kleemann_mr130z.h500.hidraulico_aceite_cambiar_o_controlar_estado"
      ], materials: [
        { matId: "mat.kleemann_mr130z.aceite_criba_vibratoria", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.aceite_accionamientos_cinta", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.filtro_hidraulico_retorno", qty: 1, unit: "ud" },
        { matId: "mat.kleemann_mr130z.filtro_hidraulico_aspiracion", qty: 1, unit: "ud" },
        { matId: "mat.kleemann_mr130z.aceite_hidraulico", note: "Cantidad N/D" }
      ], torques: [] },
      h1000: { ops: [
        "op.kleemann_mr130z.h1000.criba_aceite_cambiar",
        "op.kleemann_mr130z.h1000.hidraulico_filtro_retorno_cambiar",
        "op.kleemann_mr130z.h1000.hidraulico_filtro_aspiracion_cambiar"
      ], materials: [
        { matId: "mat.kleemann_mr130z.aceite_criba_vibratoria", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.filtro_hidraulico_retorno", qty: 1, unit: "ud" },
        { matId: "mat.kleemann_mr130z.filtro_hidraulico_aspiracion", qty: 1, unit: "ud" }
      ], torques: [] },
      h2000: { ops: [
        "op.kleemann_mr130z.h2000.cintas_accionamientos_aceite_cambiar",
        "op.kleemann_mr130z.h2000.cintas_tornillo_purga_filtro_magnetico_limpiar",
        "op.kleemann_mr130z.h2000.cintas_apoyo_cojinete_grasa_cambiar",
        "op.kleemann_mr130z.h2000.hidraulico_aceite_cambiar_o_controlar_estado",
        "op.kleemann_mr130z.h2000.orugas_engranaje_planetario_aceite_cambiar"
      ], materials: [
        { matId: "mat.kleemann_mr130z.aceite_accionamientos_cinta", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.absorbente_limpieza", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.grasa_apoyo_cojinete", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.aceite_hidraulico", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.aceite_planetario_orugas", note: "Cantidad N/D" }
      ], torques: [] },
      h10000: { ops: [
        "op.kleemann_mr130z.h10000.criba_engranaje_conico_aceite_cambiar",
        "op.kleemann_mr130z.h10000.unidad_cribado_posterior_engranaje_conico_aceite_cambiar",
        "op.kleemann_mr130z.h10000.cintas_motor_tambor_aceite_cambiar",
        "op.kleemann_mr130z.h10000.cintas_tornillo_purga_filtro_magnetico_limpiar"
      ], materials: [
        { matId: "mat.kleemann_mr130z.aceite_engranaje_conico", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.aceite_motor_tambor", note: "Cantidad N/D" },
        { matId: "mat.kleemann_mr130z.absorbente_limpieza", note: "Cantidad N/D" }
      ], torques: [] }
    }
  };

  // NOTA: este mantenimiento corresponde a la KLEEMANN (58004), no al precribador (58005).
  DB.machines["58004"] = { modelId: MODEL_PRECRIBADOR_MOVIL_KLEEMANN };
  
  // =========================
  // Datos (51011 - JCB 3CX-4T)
  // =========================
  
  // --- Operaciones (10 h / diario)
  addOp("op.jcb_3cx_4t.h10.agua_calidad_nivel_comprobar", "Motor: comprobar calidad/nivel del agua.", { action: "comprobar", groupKey: "motor.agua_calidad_nivel", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.separador_agua_filtro_combustible_vaciar", "Motor: vaciar separador de agua / filtro de combustible.", { action: "drenar", groupKey: "motor.separador_agua_combustible", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.transmision_prefiltro_limpiar", "Transmisión: limpiar prefiltro de la transmisión.", { action: "limpiar", groupKey: "transmision.prefiltro", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.neumaticos_presion_estado_comprobar", "Transmisión/puentes/dirección: comprobar presiones/estado de neumáticos.", { action: "comprobar", groupKey: "rodaje.neumaticos", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.semiejes_seguridad_engrase", "Transmisión/puentes/dirección: semiejes: seguridad y engrase.", { action: "engrasar", groupKey: "transmision.semiejes_engrase", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.puente_direccion_movimiento_acunamiento_comprobar", "Transmisión/puentes/dirección: comprobar movimiento/acuñamiento del puente de dirección.", { action: "comprobar", groupKey: "direccion.puente_movimiento", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.puente_direccion_pivotes_varillajes_engrasar", "Transmisión/puentes/dirección: engrasar pivotes/varillajes del puente de dirección y pivote principal puente delantero.", { action: "engrasar", groupKey: "direccion.pivotes_varillajes_engrase", fuente: "manual-operacion-retroexcavador" });
  
  addOp("op.jcb_3cx_4t.h10.hidraulico_aceite_nivel_comprobar", "Sistema hidráulico: comprobar nivel de aceite hidráulico.", { action: "comprobar", groupKey: "hidraulico.nivel_aceite", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.hidraulico_filtro_aceite_cambiar", "Sistema hidráulico: cambiar filtro de aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.cilindros_partes_cromadas_estado_comprobar", "Sistema hidráulico: comprobar estado de partes cromadas en cilindros.", { action: "comprobar", groupKey: "hidraulico.cilindros_partes_cromadas", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.hidraulico_prefiltro_limpiar", "Sistema hidráulico: limpiar prefiltro de aceite hidráulico.", { action: "limpiar", groupKey: "hidraulico.prefiltro", fuente: "manual-operacion-retroexcavador" });
  
  addOp("op.jcb_3cx_4t.h10.general_pintura_y_limpieza_comprobar", "General/chasis/accesorios: comprobar estado de pintura, y comprobar/limpiar máquina en general.", { action: "limpiar", groupKey: "general.limpieza", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.estabilizadores_patas_comprobar_ajustar", "General/chasis/accesorios: comprobar/ajustar patas de estabilizadores (desplazamiento lateral).", { action: "comprobar", groupKey: "chasis.estabilizadores", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.desplazamiento_lateral_pastillas_desgaste_engrasar_y_cadena_lubricar", "General/chasis/accesorios: engrasar pastillas de desgaste (desplazamiento lateral hidráulico) y lubricar cadena de desplazamiento lateral.", { action: "engrasar", groupKey: "chasis.desplazamiento_lateral", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h10.pala_6en1_y_quickhitch_engrasar", "General/chasis/accesorios: engrasar pala 6 en 1 (si aplica) y enganches Quickhitch.", { action: "engrasar", groupKey: "chasis.pala_quickhitch", fuente: "manual-operacion-retroexcavador" });
  
  // --- Operaciones (50 h / semanal)
  addOp("op.jcb_3cx_4t.h50.motor_aceite_nivel_comprobar", "50 h: motor: comprobar nivel de aceite.", { action: "comprobar", groupKey: "motor.nivel_aceite", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h50.separador_agua_filtro_cambiar", "50 h: motor: cambiar filtro del separador de agua.", { action: "sustituir", groupKey: "motor.separador_agua_combustible", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h50.correa_fead_comprobar", "50 h: motor: comprobar correa FEAD (transmisión frontal accesorios).", { action: "comprobar", groupKey: "motor.correa_fead", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h50.pernos_motor_y_mangueras_comprobar", "50 h: motor: comprobar apriete pernos de montaje del motor y estado de mangueras.", { action: "comprobar", groupKey: "motor.pernos_y_mangueras", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h50.radiador_limpiar", "50 h: motor: limpiar radiador.", { action: "limpiar", groupKey: "motor.radiador_nervios", fuente: "manual-operacion-retroexcavador" });
  
  addOp("op.jcb_3cx_4t.h50.transmision_aceite_nivel_comprobar", "50 h: transmisión/puentes: comprobar nivel de aceite de la transmisión.", { action: "comprobar", groupKey: "transmision.aceite", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h50.transmision_filtro_cambiar", "50 h: transmisión/puentes: cambiar filtro de la transmisión.", { action: "sustituir", groupKey: "transmision.filtro", fuente: "manual-operacion-retroexcavador" });
  
  addOp("op.jcb_3cx_4t.h50.hidraulico_enfriador_limpiar", "50 h: hidráulico: limpiar enfriador de aceite hidráulico.", { action: "limpiar", groupKey: "hidraulico.enfriador", fuente: "manual-operacion-retroexcavador" });
  
  addOp("op.jcb_3cx_4t.h50.bateria_terminales_y_electrolito_revisar", "50 h: eléctrico/cabina: revisar terminales batería (estado y apriete) y nivel electrólito si procede.", { action: "comprobar", groupKey: "electrico.bateria", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h50.lavaparabrisas_nivel_comprobar", "50 h: eléctrico/cabina: comprobar nivel lavaparabrisas.", { action: "comprobar", groupKey: "cabina.lavaparabrisas", fuente: "manual-operacion-retroexcavador" });
  
  // --- Operaciones (primeras 100 h - una sola vez)
  addOp("op.jcb_3cx_4t.h100.primera_100h.aceite_y_filtro_motor_cambiar", "Primeras 100 h (solo una vez): motor: cambiar aceite y filtro de motor.", { action: "cambiar", groupKey: "motor.aceite_y_filtro", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h100.primera_100h.filtro_combustible_motor_cambiar", "Primeras 100 h (solo una vez): motor: cambiar filtro de combustible del motor.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h100.primera_100h.filtro_aire_externo_cambiar", "Primeras 100 h (solo una vez): motor: cambiar elemento externo del filtro de aire (si aplica según ambiente).", { action: "sustituir", groupKey: "motor.filtro_aire_principal", fuente: "manual-operacion-retroexcavador" });
  
  // --- Operaciones (500 h)
  addOp("op.jcb_3cx_4t.h500.aceite_y_filtro_motor_cambiar", "Cada 500 h: motor: cambiar aceite y filtro de motor.", { action: "cambiar", groupKey: "motor.aceite_y_filtro", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h500.filtro_aire_externo_cambiar", "Cada 500 h: motor: cambiar elemento externo filtro aire.", { action: "sustituir", groupKey: "motor.filtro_aire_principal", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h500.separador_agua_y_filtro_combustible_motor_cambiar", "Cada 500 h: motor: cambiar filtro separador de agua y filtro combustible motor.", { action: "sustituir", groupKey: "motor.separador_agua_y_filtro_combustible", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h500.correa_fead_pernos_mangueras_y_radiador", "Cada 500 h: motor: comprobar correa FEAD, pernos motor, mangueras, y limpiar radiador.", { action: "comprobar", groupKey: "motor.fead_pernos_mangueras_radiador", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h500.transmision_aceite_y_filtro_cambiar", "Cada 500 h: transmisión/puentes: cambiar aceite (si aplica) y cambiar filtro de la transmisión.", { action: "cambiar", groupKey: "transmision.aceite_y_filtro", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h500.diferencial_lsd_aceite_cambiar_si_equipa", "Cada 500 h: (si equipa diferencial LSD) cambiar aceite de diferencial de patinamiento limitado.", { action: "cambiar", groupKey: "puentes.diferencial_lsd", fuente: "manual-operacion-retroexcavador" });
  
  // --- Operaciones (1000 h)
  addOp("op.jcb_3cx_4t.h1000.transmision_aceite_y_filtro_cambiar", "Cada 1000 h: transmisión/puentes: cambiar aceite de transmisión (si aplica) y cambiar filtro de transmisión.", { action: "cambiar", groupKey: "transmision.aceite_y_filtro", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h1000.puentes_cubos_niveles_comprobar", "Cada 1000 h: transmisión/puentes: comprobar niveles de aceite de puentes/cubos (si procede).", { action: "comprobar", groupKey: "puentes.niveles", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h1000.puentes_cubos_aceite_cambiar_si_aplica", "Cada 1000 h: transmisión/puentes: cambiar aceite de puentes (incl. cubos si procede) (si aplica en tu configuración).", { action: "cambiar", groupKey: "puentes.aceite", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h1000.hidraulico_aceite_muestrear_o_cambiar", "Cada 1000 h: hidráulico: muestrear/cambiar aceite hidráulico (según programa) y mantener cambio de filtros.", { action: "comprobar", groupKey: "hidraulico.aceite_programa", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h1000.frenos_nivel_comprobar_y_cambiar_cuando_corresponda", "Cada 1000 h: frenos: comprobar nivel aceite sistema de frenos y (cuando corresponda) cambiar aceite del sistema de frenos.", { action: "comprobar", groupKey: "frenos.aceite", fuente: "manual-operacion-retroexcavador" });
  
  // --- Operaciones (2000 h)
  addOp("op.jcb_3cx_4t.h2000.refrigeracion_sistema_vaciar_llenar", "Cada 2000 h: motor: vaciar y llenar sistema de refrigeración (si aplica por programa).", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h2000.correa_fead_cambiar_si_corresponde", "Cada 2000 h: motor: cambiar correa FEAD (cuando toca).", { action: "cambiar", groupKey: "motor.correa_fead", fuente: "manual-operacion-retroexcavador" });
  addOp("op.jcb_3cx_4t.h2000.operaciones_especialista_valvulas_y_otras", "Cada 2000 h: operaciones de especialista (p. ej. separación/juego de válvulas) según programa.", { action: "comprobar", groupKey: "motor.especialista", fuente: "manual-operacion-retroexcavador" });
  
  // --- Operaciones (6000 h)
  addOp("op.jcb_3cx_4t.h6000.tareas_mayores_según_columna_6000h", "Cada 6000 h: ejecutar tareas marcadas en la columna 6000 h del plan (incluyendo refrigeración/aceites y tareas de especialista cuando proceda).", { action: "comprobar", groupKey: "general.programa_6000h", fuente: "manual-operacion-retroexcavador" });
  
  // --- Materiales (JCB 3CX-4T)
  addMat("mat.jcb_3cx_4t.grasa_hp", "Grasa (JCB HP Grease o JCB Special MPL-EP Grease)", { unit: "", note: "Según necesidad", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.lubricante_cadena", "Lubricante de cadena (JCB Chain Lubricant)", { unit: "", note: "Si aplica en cadenas", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.aceite_hidraulico", "Aceite hidráulico (ISO VG 32/46)", { unit: "L", note: "Reposición según necesidad (HP32 <38°C / ISO VG46 >38°C)", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.aceite_motor", "Aceite motor", { unit: "L", note: "Capacidad aprox. 12–15 L", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.refrigerante", "Refrigerante motor", { unit: "L", note: "Capacidad 17,5 L (seco) / 18,5 L (húmedo)", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.filtro_separador_agua", "Filtro separador de agua", { unit: "ud", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.filtro_aceite_motor", "Filtro de aceite motor", { unit: "ud", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.filtro_combustible_motor", "Filtro combustible motor", { unit: "ud", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.filtro_aire_externo", "Elemento externo filtro de aire", { unit: "ud", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.filtro_transmision", "Filtro de transmisión", { unit: "ud", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.aceite_transmision", "Aceite transmisión (Syncro Shuttle / Powershift)", { unit: "", note: "Capacidad según configuración", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.aceite_frenos", "Aceite sistema de frenos (no DOT)", { unit: "L", note: "Capacidad aprox. 1,4 L", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.aceite_hidraulico_total", "Aceite hidráulico (capacidad sistema)", { unit: "L", note: "Capacidad aprox. 130 L (varía con accesorios)", fuente: "manual-operacion-retroexcavador" });
  addMat("mat.jcb_3cx_4t.correa_fead", "Correa FEAD", { unit: "ud", fuente: "manual-operacion-retroexcavador" });
  
  DB.templatesByModel[MODEL_JCB_3CX_4T] = {
    modelId: MODEL_JCB_3CX_4T,
    intervals: {
      h10: {
        ops: [
          "op.jcb_3cx_4t.h10.agua_calidad_nivel_comprobar",
          "op.jcb_3cx_4t.h10.separador_agua_filtro_combustible_vaciar",
          "op.jcb_3cx_4t.h10.transmision_prefiltro_limpiar",
          "op.jcb_3cx_4t.h10.neumaticos_presion_estado_comprobar",
          "op.jcb_3cx_4t.h10.semiejes_seguridad_engrase",
          "op.jcb_3cx_4t.h10.puente_direccion_movimiento_acunamiento_comprobar",
          "op.jcb_3cx_4t.h10.puente_direccion_pivotes_varillajes_engrasar",
          "op.jcb_3cx_4t.h10.hidraulico_aceite_nivel_comprobar",
          "op.jcb_3cx_4t.h10.hidraulico_filtro_aceite_cambiar",
          "op.jcb_3cx_4t.h10.cilindros_partes_cromadas_estado_comprobar",
          "op.jcb_3cx_4t.h10.hidraulico_prefiltro_limpiar",
          "op.jcb_3cx_4t.h10.general_pintura_y_limpieza_comprobar",
          "op.jcb_3cx_4t.h10.estabilizadores_patas_comprobar_ajustar",
          "op.jcb_3cx_4t.h10.desplazamiento_lateral_pastillas_desgaste_engrasar_y_cadena_lubricar",
          "op.jcb_3cx_4t.h10.pala_6en1_y_quickhitch_engrasar"
        ],
        materials: [
          { matId: "mat.jcb_3cx_4t.grasa_hp", note: "Según necesidad" },
          { matId: "mat.jcb_3cx_4t.lubricante_cadena", note: "Si aplica" },
          { matId: "mat.jcb_3cx_4t.aceite_hidraulico", note: "Reposición si procede" }
        ],
        torques: []
      },
      h50: {
        ops: [
          "op.jcb_3cx_4t.h50.motor_aceite_nivel_comprobar",
          "op.jcb_3cx_4t.h50.separador_agua_filtro_cambiar",
          "op.jcb_3cx_4t.h50.correa_fead_comprobar",
          "op.jcb_3cx_4t.h50.pernos_motor_y_mangueras_comprobar",
          "op.jcb_3cx_4t.h50.radiador_limpiar",
          "op.jcb_3cx_4t.h50.transmision_aceite_nivel_comprobar",
          "op.jcb_3cx_4t.h50.transmision_filtro_cambiar",
          "op.jcb_3cx_4t.h50.hidraulico_enfriador_limpiar",
          "op.jcb_3cx_4t.h50.bateria_terminales_y_electrolito_revisar",
          "op.jcb_3cx_4t.h50.lavaparabrisas_nivel_comprobar"
        ],
        materials: [{ matId: "mat.jcb_3cx_4t.filtro_separador_agua", qty: 1, unit: "ud" }],
        torques: []
      },
      h100_post: {
        ops: [
          "op.jcb_3cx_4t.h100.primera_100h.aceite_y_filtro_motor_cambiar",
          "op.jcb_3cx_4t.h100.primera_100h.filtro_combustible_motor_cambiar",
          "op.jcb_3cx_4t.h100.primera_100h.filtro_aire_externo_cambiar"
        ],
        materials: [
          { matId: "mat.jcb_3cx_4t.aceite_motor", note: "12–15 L (según nivel real)" },
          { matId: "mat.jcb_3cx_4t.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.jcb_3cx_4t.filtro_combustible_motor", qty: 1, unit: "ud" },
          { matId: "mat.jcb_3cx_4t.filtro_aire_externo", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h500: {
        ops: [
          "op.jcb_3cx_4t.h500.aceite_y_filtro_motor_cambiar",
          "op.jcb_3cx_4t.h500.filtro_aire_externo_cambiar",
          "op.jcb_3cx_4t.h500.separador_agua_y_filtro_combustible_motor_cambiar",
          "op.jcb_3cx_4t.h500.correa_fead_pernos_mangueras_y_radiador",
          "op.jcb_3cx_4t.h500.transmision_aceite_y_filtro_cambiar",
          "op.jcb_3cx_4t.h500.diferencial_lsd_aceite_cambiar_si_equipa"
        ],
        materials: [
          { matId: "mat.jcb_3cx_4t.aceite_motor", note: "12–15 L" },
          { matId: "mat.jcb_3cx_4t.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.jcb_3cx_4t.filtro_separador_agua", qty: 1, unit: "ud" },
          { matId: "mat.jcb_3cx_4t.filtro_combustible_motor", qty: 1, unit: "ud" },
          { matId: "mat.jcb_3cx_4t.aceite_transmision", note: "Según configuración" },
          { matId: "mat.jcb_3cx_4t.filtro_transmision", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.jcb_3cx_4t.h1000.transmision_aceite_y_filtro_cambiar",
          "op.jcb_3cx_4t.h1000.puentes_cubos_niveles_comprobar",
          "op.jcb_3cx_4t.h1000.puentes_cubos_aceite_cambiar_si_aplica",
          "op.jcb_3cx_4t.h1000.hidraulico_aceite_muestrear_o_cambiar",
          "op.jcb_3cx_4t.h1000.frenos_nivel_comprobar_y_cambiar_cuando_corresponda"
        ],
        materials: [
          { matId: "mat.jcb_3cx_4t.aceite_hidraulico_total", note: "Hasta 130 L si cambio completo" },
          { matId: "mat.jcb_3cx_4t.aceite_frenos", note: "Aprox. 1,4 L" }
        ],
        torques: []
      },
      h2000: {
        ops: [
          "op.jcb_3cx_4t.h2000.refrigeracion_sistema_vaciar_llenar",
          "op.jcb_3cx_4t.h2000.correa_fead_cambiar_si_corresponde",
          "op.jcb_3cx_4t.h2000.operaciones_especialista_valvulas_y_otras"
        ],
        materials: [
          { matId: "mat.jcb_3cx_4t.refrigerante", note: "17,5–18,5 L" },
          { matId: "mat.jcb_3cx_4t.correa_fead", qty: 1, unit: "ud", note: "Si corresponde" }
        ],
        torques: []
      },
      h6000: {
        ops: ["op.jcb_3cx_4t.h6000.tareas_mayores_según_columna_6000h"],
        materials: [
          { matId: "mat.jcb_3cx_4t.refrigerante", note: "17,5–18,5 L (si aplica cambio)" },
          { matId: "mat.jcb_3cx_4t.aceite_hidraulico_total", note: "Hasta 130 L (si aplica cambio completo)" }
        ],
        torques: []
      }
    }
  };
  
  DB.machines["51011"] = { modelId: MODEL_JCB_3CX_4T };
  
  // =========================
  // Datos (51005 - CASE WX188)
  // =========================
  
  // --- Operaciones (rodaje: primeras 50 h - SOLO una vez)
  addOp("op.case_wx188.h50_post.rodaje.engrasadores_cuchara_engrasar", "Rodaje (primeras 50 h - solo una vez): engrasar engrasadores de cuchara.", { action: "engrasar", groupKey: "implemento.cuchara_engrase", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h50_post.rodaje.accesorio_puntos_engrase_engrasar", "Rodaje (primeras 50 h - solo una vez): engrasar accesorio (puntos de engrase del implemento/varillaje).", { action: "engrasar", groupKey: "implemento.accesorio_engrase", fuente: "MANUAL OPERADOR WX-188" });
  
  // --- Operaciones (rodaje: primeras 500 h - SOLO una vez)
  addOp("op.case_wx188.h500_post.rodaje.engrasadores_cuchara_engrasar", "Rodaje (primeras 500 h - solo una vez): engrasar engrasadores de cuchara.", { action: "engrasar", groupKey: "implemento.cuchara_engrase", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500_post.rodaje.accesorio_puntos_engrase_engrasar", "Rodaje (primeras 500 h - solo una vez): engrasar accesorio.", { action: "engrasar", groupKey: "implemento.accesorio_engrase", fuente: "MANUAL OPERADOR WX-188" });
  
  // --- Operaciones (cada 50 h)
  addOp("op.case_wx188.h50.cojinete_giro_engrasar", "Cada 50 h: engrasar cojinete de giro.", { action: "engrasar", groupKey: "chasis.cojinete_giro", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h50.eje_delantero_racores_pasadores_flotantes_engrasar", "Cada 50 h: engrasar racores eje delantero / pasadores flotantes de los ejes.", { action: "engrasar", groupKey: "rodaje.eje_delantero_engrase", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h50.unidad_reductora_giro_aceite_nivel_comprobar", "Cada 50 h: comprobar nivel de aceite de la unidad reductora de giro/oscilación (rellenar si procede).", { action: "comprobar", groupKey: "transmision.unidad_reductora_giro", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h50.filtro_aire_cabina_exterior_limpiar", "Cada 50 h: limpiar filtro de aire exterior de cabina.", { action: "limpiar", groupKey: "cabina.filtro_exterior", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h50.filtro_recirculacion_cabina_limpiar", "Cada 50 h: limpiar filtro de recirculación de aire de cabina.", { action: "limpiar", groupKey: "cabina.filtro_recirculacion", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h50.refrigeracion_motor_sistema_comprobar", "Cada 50 h: comprobar sistema de refrigeración del motor (nivel en vaso de expansión, etc.).", { action: "comprobar", groupKey: "motor.refrigerante", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h50.ruedas_neumaticos_revisar", "Cada 50 h: revisar ruedas y neumáticos.", { action: "comprobar", groupKey: "rodaje.ruedas_neumaticos", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h50.luces_revisar", "Cada 50 h: revisar luces.", { action: "comprobar", groupKey: "electrico.luces", fuente: "MANUAL OPERADOR WX-188" });
  
  // --- Operaciones (cada 250 h)
  addOp("op.case_wx188.h250.cuchara_engrasadores_engrasar", "Cada 250 h: engrasar engrasadores de cuchara.", { action: "engrasar", groupKey: "implemento.cuchara_engrase", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h250.pala_estabilizadores_articulaciones_engrasar", "Cada 250 h: engrasar articulaciones de pala y estabilizadores.", { action: "engrasar", groupKey: "implemento.pala_estabilizadores", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h250.eje_cardanico_y_pasadores_direccion_engrasar", "Cada 250 h: engrasar eje cardánico y pasadores de dirección.", { action: "engrasar", groupKey: "transmision.cardan_direccion", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h250.cilindros_bloqueo_oscilacion_superficies_apoyo_engrasar", "Cada 250 h: engrasar superficies de apoyo de cilindros de bloqueo de oscilación.", { action: "engrasar", groupKey: "transmision.bloqueo_oscilacion", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h250.filtro_aire_motor_externo_limpiar_inspeccionar", "Cada 250 h: limpiar/inspeccionar elemento exterior del filtro de aire del motor.", { action: "limpiar", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h250.deposito_combustible_revisar_limpiar", "Cada 250 h: revisar/limpiar depósito de combustible.", { action: "limpiar", groupKey: "motor.deposito_combustible", fuente: "MANUAL OPERADOR WX-188" });
  
  // --- Operaciones (cada 500 h)
  addOp("op.case_wx188.h500.accesorio_engrasar", "Cada 500 h: engrasar accesorio.", { action: "engrasar", groupKey: "implemento.accesorio_engrase", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.prefiltro_combustible_sustituir", "Cada 500 h: sustituir prefiltro de combustible.", { action: "sustituir", groupKey: "motor.prefiltro_combustible", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.filtros_combustible_sustituir", "Cada 500 h: sustituir filtros de combustible.", { action: "sustituir", groupKey: "motor.filtro_combustible", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.aceite_motor_y_filtro_aceite_cambiar", "Cada 500 h: cambiar aceite de motor y sustituir filtro de aceite de motor.", { action: "cambiar", groupKey: "motor.aceite_y_filtro", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.eje_delantero_liquido_nivel_comprobar", "Cada 500 h: comprobar nivel de líquido del eje delantero.", { action: "comprobar", groupKey: "rodaje.eje_delantero_liquido", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.caja_transmision_aceite_nivel_comprobar", "Cada 500 h: comprobar nivel de aceite de la caja de transmisión.", { action: "comprobar", groupKey: "transmision.caja_transmision_aceite", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.eje_trasero_liquido_nivel_comprobar", "Cada 500 h: comprobar nivel de líquido del eje trasero.", { action: "comprobar", groupKey: "rodaje.eje_trasero_liquido", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.filtro_aire_cabina_exterior_limpiar", "Cada 500 h: limpiar filtro exterior cabina.", { action: "limpiar", groupKey: "cabina.filtro_exterior", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.filtro_recirculacion_cabina_limpiar", "Cada 500 h: limpiar filtro recirculación cabina.", { action: "limpiar", groupKey: "cabina.filtro_recirculacion", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.cojinete_giro_engrasar", "Cada 500 h: engrasar cojinete de giro.", { action: "engrasar", groupKey: "chasis.cojinete_giro", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h500.pares_apriete_y_correas_comprobar", "Cada 500 h: comprobaciones de pares de apriete y correas del motor (según plan).", { action: "comprobar", groupKey: "motor.pares_y_correas", fuente: "MANUAL OPERADOR WX-188" });
  
  // --- Operaciones (cada 1000 h)
  addOp("op.case_wx188.h1000.filtros_aire_motor_sustituir", "Cada 1.000 h: sustituir filtros de aire del motor (juego según máquina).", { action: "sustituir", groupKey: "motor.filtro_aire_principal", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h1000.eje_delantero_liquido_cambiar", "Cada 1.000 h: cambiar líquido del eje delantero.", { action: "cambiar", groupKey: "rodaje.eje_delantero_liquido", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h1000.caja_transmision_aceite_cambiar", "Cada 1.000 h: cambiar aceite de la caja de transmisión.", { action: "cambiar", groupKey: "transmision.caja_transmision_aceite", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h1000.eje_trasero_liquido_cambiar", "Cada 1.000 h: cambiar líquido del eje trasero.", { action: "cambiar", groupKey: "rodaje.eje_trasero_liquido", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h1000.hidraulico_filtros_retorno_sustituir", "Cada 1.000 h: sustituir filtros de retorno del aceite hidráulico.", { action: "sustituir", groupKey: "hidraulico.filtro_retorno", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h1000.hidraulico_respiradero_deposito_sustituir", "Cada 1.000 h: sustituir respiradero del depósito hidráulico.", { action: "sustituir", groupKey: "hidraulico.respiradero", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h1000.filtro_mando_piloto_sustituir", "Cada 1.000 h: sustituir filtro mando piloto.", { action: "sustituir", groupKey: "hidraulico.filtro_piloto", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h1000.unidad_reductora_giro_aceite_cambiar", "Cada 1.000 h: cambiar aceite de la unidad reductora de giro/oscilación.", { action: "cambiar", groupKey: "transmision.unidad_reductora_giro", fuente: "MANUAL OPERADOR WX-188" });
  
  // --- Operaciones (cada 1500 h)
  addOp("op.case_wx188.h1500.correa_alternador_sustituir", "Cada 1.500 h: sustituir correa de transmisión del alternador.", { action: "sustituir", groupKey: "motor.correa_alternador", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h1500.correa_compresor_aa_sustituir", "Cada 1.500 h: sustituir correa del compresor del aire acondicionado.", { action: "sustituir", groupKey: "motor.correa_aa", fuente: "MANUAL OPERADOR WX-188" });
  
  // --- Operaciones (cada 3000 h)
  addOp("op.case_wx188.h3000.aceite_hidraulico_cambiar", "Cada 3.000 h: cambiar aceite hidráulico (incluye drenaje, montaje y purga según procedimiento).", { action: "cambiar", groupKey: "hidraulico.aceite", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h3000.refrigerante_motor_cambiar", "Cada 3.000 h: cambiar refrigerante del motor.", { action: "cambiar", groupKey: "motor.refrigerante", fuente: "MANUAL OPERADOR WX-188" });
  addOp("op.case_wx188.h3000.electrico_fusibles_reles_revisar", "Cada 3.000 h: sistema eléctrico: revisar/sustituir fusibles y relés si procede.", { action: "comprobar", groupKey: "electrico.fusibles_reles", fuente: "MANUAL OPERADOR WX-188" });
  
  // --- Materiales (WX188)
  addMat("mat.case_wx188.grasa_ep2", "Grasa CASE AKCELA PREMIUM EP-2", { unit: "", note: "Según necesidad", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.aceite_transaxle_80w140", "Aceite CASE AKCELA TRANSAXLE FLUID 80W-140", { unit: "L", note: "Según necesidad/capacidades", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.aceite_motor", "Aceite motor", { unit: "L", note: "16 L (cambio)", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.filtro_aceite_motor", "Filtro de aceite motor", { unit: "ud", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.prefiltro_combustible", "Prefiltro de combustible", { unit: "ud", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.filtros_combustible_juego", "Filtros de combustible (juego)", { unit: "ud", note: "Según configuración", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.filtros_aire_motor_juego", "Filtros de aire motor (juego)", { unit: "ud", note: "Según configuración", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.filtros_retorno_hidraulico_juego", "Filtros retorno hidráulico (juego)", { unit: "ud", note: "Según configuración", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.respiradero_deposito_hidraulico", "Respiradero depósito hidráulico", { unit: "ud", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.filtro_mando_piloto", "Filtro mando piloto", { unit: "ud", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.aceite_hidraulico", "Aceite hidráulico (CASE AKCELA AW HYDRAULIC FLUID 68 HV)", { unit: "L", note: "Depósito 87 L / sistema 235 L", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.aditivo_panolin", "Aditivo hidráulico Panolin (si equipa aceite biodegradable)", { unit: "L", note: "3 L", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.refrigerante", "Refrigerante motor (CASE AKCELA ACTIFULL OT ELC)", { unit: "L", note: "22 L", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.correa_alternador", "Correa alternador", { unit: "ud", fuente: "MANUAL OPERADOR WX-188" });
  addMat("mat.case_wx188.correa_compresor_aa", "Correa compresor A/A", { unit: "ud", fuente: "MANUAL OPERADOR WX-188" });
  
  DB.templatesByModel[MODEL_CASE_WX188] = {
    modelId: MODEL_CASE_WX188,
    intervals: {
      h50_post: {
        ops: [
          "op.case_wx188.h50_post.rodaje.engrasadores_cuchara_engrasar",
          "op.case_wx188.h50_post.rodaje.accesorio_puntos_engrase_engrasar"
        ],
        materials: [{ matId: "mat.case_wx188.grasa_ep2", note: "Según necesidad" }],
        torques: []
      },
      h500_post: {
        ops: [
          "op.case_wx188.h500_post.rodaje.engrasadores_cuchara_engrasar",
          "op.case_wx188.h500_post.rodaje.accesorio_puntos_engrase_engrasar"
        ],
        materials: [{ matId: "mat.case_wx188.grasa_ep2", note: "Según necesidad" }],
        torques: []
      },
      h50: {
        ops: [
          "op.case_wx188.h50.cojinete_giro_engrasar",
          "op.case_wx188.h50.eje_delantero_racores_pasadores_flotantes_engrasar",
          "op.case_wx188.h50.unidad_reductora_giro_aceite_nivel_comprobar",
          "op.case_wx188.h50.filtro_aire_cabina_exterior_limpiar",
          "op.case_wx188.h50.filtro_recirculacion_cabina_limpiar",
          "op.case_wx188.h50.refrigeracion_motor_sistema_comprobar",
          "op.case_wx188.h50.ruedas_neumaticos_revisar",
          "op.case_wx188.h50.luces_revisar"
        ],
        materials: [{ matId: "mat.case_wx188.grasa_ep2", note: "Según necesidad" }, { matId: "mat.case_wx188.aceite_transaxle_80w140", note: "Solo si hay que rellenar reductora" }],
        torques: []
      },
      h250: {
        ops: [
          "op.case_wx188.h250.cuchara_engrasadores_engrasar",
          "op.case_wx188.h250.pala_estabilizadores_articulaciones_engrasar",
          "op.case_wx188.h250.eje_cardanico_y_pasadores_direccion_engrasar",
          "op.case_wx188.h250.cilindros_bloqueo_oscilacion_superficies_apoyo_engrasar",
          "op.case_wx188.h250.filtro_aire_motor_externo_limpiar_inspeccionar",
          "op.case_wx188.h250.deposito_combustible_revisar_limpiar"
        ],
        materials: [{ matId: "mat.case_wx188.grasa_ep2", note: "Según necesidad" }],
        torques: []
      },
      h500: {
        ops: [
          "op.case_wx188.h500.accesorio_engrasar",
          "op.case_wx188.h500.prefiltro_combustible_sustituir",
          "op.case_wx188.h500.filtros_combustible_sustituir",
          "op.case_wx188.h500.aceite_motor_y_filtro_aceite_cambiar",
          "op.case_wx188.h500.eje_delantero_liquido_nivel_comprobar",
          "op.case_wx188.h500.caja_transmision_aceite_nivel_comprobar",
          "op.case_wx188.h500.eje_trasero_liquido_nivel_comprobar",
          "op.case_wx188.h500.filtro_aire_cabina_exterior_limpiar",
          "op.case_wx188.h500.filtro_recirculacion_cabina_limpiar",
          "op.case_wx188.h500.cojinete_giro_engrasar",
          "op.case_wx188.h500.pares_apriete_y_correas_comprobar"
        ],
        materials: [
          { matId: "mat.case_wx188.aceite_motor", qty: 16, unit: "L" },
          { matId: "mat.case_wx188.filtro_aceite_motor", qty: 1, unit: "ud" },
          { matId: "mat.case_wx188.prefiltro_combustible", qty: 1, unit: "ud" },
          { matId: "mat.case_wx188.filtros_combustible_juego", qty: 1, unit: "ud" },
          { matId: "mat.case_wx188.grasa_ep2", note: "Según necesidad" }
        ],
        torques: []
      },
      h1000: {
        ops: [
          "op.case_wx188.h1000.filtros_aire_motor_sustituir",
          "op.case_wx188.h1000.eje_delantero_liquido_cambiar",
          "op.case_wx188.h1000.caja_transmision_aceite_cambiar",
          "op.case_wx188.h1000.eje_trasero_liquido_cambiar",
          "op.case_wx188.h1000.hidraulico_filtros_retorno_sustituir",
          "op.case_wx188.h1000.hidraulico_respiradero_deposito_sustituir",
          "op.case_wx188.h1000.filtro_mando_piloto_sustituir",
          "op.case_wx188.h1000.unidad_reductora_giro_aceite_cambiar"
        ],
        materials: [
          { matId: "mat.case_wx188.filtros_aire_motor_juego", qty: 1, unit: "ud" },
          { matId: "mat.case_wx188.aceite_transaxle_80w140", note: "Eje delantero 12,0–12,4 L + laterales 2,5 L/caja (si aplica)" },
          { matId: "mat.case_wx188.filtros_retorno_hidraulico_juego", qty: 1, unit: "ud" },
          { matId: "mat.case_wx188.respiradero_deposito_hidraulico", qty: 1, unit: "ud" },
          { matId: "mat.case_wx188.filtro_mando_piloto", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h1500: {
        ops: ["op.case_wx188.h1500.correa_alternador_sustituir", "op.case_wx188.h1500.correa_compresor_aa_sustituir"],
        materials: [
          { matId: "mat.case_wx188.correa_alternador", qty: 1, unit: "ud" },
          { matId: "mat.case_wx188.correa_compresor_aa", qty: 1, unit: "ud" }
        ],
        torques: []
      },
      h3000: {
        ops: ["op.case_wx188.h3000.aceite_hidraulico_cambiar", "op.case_wx188.h3000.refrigerante_motor_cambiar", "op.case_wx188.h3000.electrico_fusibles_reles_revisar"],
        materials: [
          { matId: "mat.case_wx188.aceite_hidraulico", note: "Depósito 87 L / sistema 235 L" },
          { matId: "mat.case_wx188.aditivo_panolin", qty: 3, unit: "L", note: "Solo si Panolin" },
          { matId: "mat.case_wx188.refrigerante", qty: 22, unit: "L" }
        ],
        torques: []
      }
    }
  };
  
  DB.machines["51005"] = { modelId: MODEL_CASE_WX188 };

  function validateDb() {
    const errors = [];

    const tplByModel = DB.templatesByModel || {};
    for (const [modelId, tpl] of Object.entries(tplByModel)) {
      const intervals = tpl?.intervals || {};
      for (const [intervalKey, rec] of Object.entries(intervals)) {
        const ops = Array.isArray(rec?.ops) ? rec.ops : [];
        ops.forEach((opId) => {
          if (!DB.opsCatalog?.[opId]) errors.push(`Missing opId in opsCatalog: ${modelId} / ${intervalKey} -> ${opId}`);
        });

        const mats = Array.isArray(rec?.materials) ? rec.materials : [];
        mats.forEach((m) => {
          const matId = String(m?.matId || "").trim();
          if (!matId) errors.push(`Empty matId: ${modelId} / ${intervalKey}`);
          else if (!DB.materialsCatalog?.[matId]) errors.push(`Missing matId in materialsCatalog: ${modelId} / ${intervalKey} -> ${matId}`);
        });
      }
    }

    return { ok: errors.length === 0, errors };
  }

  window.MANTENIMIENTOS_MODELOS_VALIDATE = function () {
    try {
      const r = validateDb();
      if (r.ok) {
        console.log("[MANTENIMIENTOS_MODELOS] OK - sin errores de referencias.");
      } else {
        console.warn("[MANTENIMIENTOS_MODELOS] Errores:", r.errors);
      }
      return r;
    } catch (e) {
      console.error("[MANTENIMIENTOS_MODELOS] validate error", e);
      return { ok: false, errors: [String(e)] };
    }
  };
})();
