# Informe de l'aplicacio de fitxes

Aquest informe recull l'analisi del projecte actual de creacio de fitxes tecniques i fitxes de manteniment. No s'ha modificat cap fitxer de l'aplicacio, excepte la creacio d'aquest document.

## 1. Estructura del projecte

### Llenguatges utilitzats

- TypeScript / TSX
- JavaScript
- HTML
- CSS
- Fitxers estatics dins de `public`

Hi ha alguns scripts Python solts al projecte, pero no semblen formar part directa del flux actual de creacio de fitxes.

### Frameworks i llibreries principals

El projecte es una aplicacio Vite amb React.

Dependencies principals detectades a `package.json`:

- `react`
- `react-dom`
- `react-router-dom`
- `vite`
- `typescript`
- `tailwindcss`
- `lucide-react`
- `xlsx`
- `@tanstack/react-query`
- `@tanstack/react-table`
- `react-hook-form`
- `zod`

Tot i aixo, la funcionalitat concreta de creacio de fitxes tecniques i de manteniment esta implementada principalment com HTML + JavaScript dins de `public`, carregada des de React amb `iframe`.

### Com s'executa l'aplicacio

Segons `package.json`, l'aplicacio es pot executar amb:

```bash
npm run dev
```

Aixo executa:

```bash
vite
```

Altres scripts disponibles:

```bash
npm run build
npm run preview
npm run test
```

També hi ha fitxers `.bat`:

- `arrancar-app.bat`
- `arrancar-app-y-abrir.bat`
- `abrir-dist.bat`

### Fitxers d'entrada principals

- `index.html`
- `src/main.tsx`
- `src/App.tsx`

Flux inicial:

```txt
index.html
-> src/main.tsx
-> src/App.tsx
-> rutes React
-> iframes HTML dins de public/
```

### Arbre simplificat de carpetes i fitxers rellevants

```txt
appfichas/
├─ package.json
├─ index.html
├─ vite.config.ts
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ index.css
│  └─ pages/
│     ├─ MachineryTechnicalSheetBuilderPage.tsx
│     └─ MaintenanceSheetBuilderPage.tsx
├─ public/
│  ├─ machinery-spec-sheet-builder/
│  │  ├─ ficha-tecnica.html
│  │  ├─ maquinaria_completa.js
│  │  └─ logo_romero_polo.png
│  ├─ maintenance-sheet-builder/
│  │  ├─ fichas.html
│  │  ├─ fichas_patch.js
│  │  ├─ maquinaria_completa.js
│  │  ├─ mantenimientos.js
│  │  ├─ mantenimientos_modelos.js
│  │  └─ logo_romero_polo.png
│  └─ maintenance-sheets/
│     └─ EXC-001__250h.pdf
└─ dist/
   └─ sortida compilada
```

No caldria treballar directament sobre `dist/`, perque es sortida de build.

## 2. Pantalla inicial

La pantalla `"Propuesta taller: Fichas"` esta implementada a:

```txt
src/App.tsx
```

La genera la funcio:

```tsx
function Home()
```

Mostra dues opcions:

- `Crear ficha tecnica`
- `Crear ficha de mantenimiento`

### Rutes implicades

A `src/App.tsx` s'utilitza `react-router-dom`.

Rutes principals:

```tsx
<Route path="/" element={<Home />} />
<Route path="/ficha-tecnica" element={<MachineryTechnicalSheetBuilderPage />} />
<Route path="/ficha-mantenimiento" element={<MaintenanceSheetBuilderPage />} />
<Route path="*" element={<Navigate to="/" replace />} />
```

### Obertura de la fitxa tecnica

La targeta de fitxa tecnica fa:

```tsx
<Link to="/ficha-tecnica">
```

La ruta carrega:

```txt
src/pages/MachineryTechnicalSheetBuilderPage.tsx
```

Aquest component mostra un iframe:

```tsx
<iframe
  title="Creacion de fichas tecnicas"
  src="/machinery-spec-sheet-builder/ficha-tecnica.html"
/>
```

### Obertura de la fitxa de manteniment

La targeta de fitxa de manteniment fa:

```tsx
<Link to="/ficha-mantenimiento">
```

La ruta carrega:

```txt
src/pages/MaintenanceSheetBuilderPage.tsx
```

Aquest component mostra un iframe:

```tsx
<iframe
  title="Creacion de fichas de mantenimiento"
  src="/maintenance-sheet-builder/fichas.html"
/>
```

## 3. Fitxa tecnica

### Fitxers principals

Fitxer principal:

```txt
public/machinery-spec-sheet-builder/ficha-tecnica.html
```

Fitxer auxiliar carregat:

```txt
public/machinery-spec-sheet-builder/maquinaria_completa.js
```

El fitxer `maquinaria_completa.js` aporta la variable/base de dades `maquinaria`, utilitzada per autocompletar dades a partir del codi intern.

### Com s'emmagatzemen les dades

La fitxa tecnica no utilitza state React.

Les dades introduides per l'usuari viuen directament al DOM:

- `input`
- `textarea`
- `contenteditable`
- `img src`
- `input type="file"`

No hi ha un objecte global unic amb tota la fitxa tecnica abans de generar el PDF.

Variables i estructures temporals:

```js
window.__techUndoStack
window.__activeTechGroup
window.__activeTechRow
window.__activeTechPhoto
window.__pendingFieldUndoSnapshot
```

Persistencia parcial a `localStorage`:

```js
const TEC_CODIGOS_INTERNOS_STORAGE_KEY = "fichaTecnicaCodigosInternos";
```

Estructura aproximada guardada:

```js
{
  [codigoInterno]: {
    maquina,
    marcaModelo,
    bastidor,
    matricula
  }
}
```

Funcio que construeix aquest objecte parcial:

```js
obtenerDatosTecnicosActuales()
```

Retorna:

```js
{
  maquina: "...",
  marcaModelo: "...",
  bastidor: "...",
  matricula: "..."
}
```

### Camps principals de capcalera

| Text visible | id | name | acces intern | tipus |
|---|---|---|---|---|
| MAQUINA | `tec_tipoMaquina` | cap | `document.getElementById("tec_tipoMaquina").value` | `textarea` |
| CODIGO / Nº INTERNO | `tec_codigoInterno` | cap | `document.getElementById("tec_codigoInterno").value` | `input` amb `list="tec_codigoInternoList"` |
| MARCA Y MODELO | `tec_marcaModelo` | cap | `document.getElementById("tec_marcaModelo").value` | `textarea` |
| MATRICULA | `tec_matricula` | cap | `document.getElementById("tec_matricula").value` | `textarea` |
| AÑO | `tec_anyo` | cap | `document.getElementById("tec_anyo").value` | `textarea` |

Datalist:

| Element | id | tipus |
|---|---|---|
| Opcions de codi intern | `tec_codigoInternoList` | `datalist` |

### Camps de caracteristiques generals

Grup inicial:

```txt
CARACTERISTICAS GENERALES
```

Taula dins de:

```html
<div id="tec-groups">
```

Cada grup es:

```html
<table class="no-page-break group" data-group>
```

El titol del grup es editable:

```html
<td class="section-title" contenteditable="true">
```

Camps:

| Text visible | id | name | acces intern | tipus |
|---|---|---|---|---|
| MARCA | `tec_marca` | cap | `document.getElementById("tec_marca").value` | `textarea` |
| MODELO | `tec_modelo` | cap | `document.getElementById("tec_modelo").value` | `textarea` |
| NUMERO DE SERIE/BASTIDOR | `tec_serie` | cap | `document.getElementById("tec_serie").value` | `textarea` |
| FECHA DE COMPRA | `tec_fecha_compra` | cap | `document.getElementById("tec_fecha_compra").value` | `textarea` |
| VALOR DE COMPRA | `tec_valor_compra` | cap | `document.getElementById("tec_valor_compra").value` | `textarea` |
| MOTOR | `tec_motor` | cap | `document.getElementById("tec_motor").value` | `textarea` |
| POTENCIA | `tec_potencia` | cap | `document.getElementById("tec_potencia").value` | `textarea` |
| CONSUMO ESTIMADO | `tec_consumo_estimado` | cap | `document.getElementById("tec_consumo_estimado").value` | `textarea` |
| ESTADO | `tec_estado` | cap | `document.getElementById("tec_estado").value` | `textarea` |

### Grups de caracteristiques generiques

Hi ha grups inicials com:

- `DIMENSIONES`
- `SISTEMA ELECTRICO`

Les files generiques tenen estructura:

```html
<tr>
  <th style="width:35%;">
    <textarea class="kv-key-input autogrow" rows="1" placeholder="Caracteristica"></textarea>
  </th>
  <td>
    <textarea class="autogrow" rows="1" placeholder="Valor"></textarea>
  </td>
</tr>
```

No tenen `id` ni `name`.

Estructura conceptual real, reconstruible des del DOM:

```js
groups = Array.from(document.querySelectorAll('#tec-groups [data-group]')).map(group => ({
  title: group.querySelector('.section-title')?.textContent,
  kind: group.getAttribute('data-group-kind') || 'keyvalue',
  rows: Array.from(group.querySelectorAll('[data-rows] tr')).map(row => ({
    key: row.querySelector('.kv-key-input')?.value || textDelThFix,
    value: segonTextareaOValorEditable
  }))
}))
```

Aquesta estructura no existeix formalment com objecte global; el codi treballa directament amb nodes DOM.

### Filtres, materials i recanvis

El grup de materials es:

```html
<table class="no-page-break group" data-group data-group-kind="materials">
```

Titol visible:

```txt
FILTRO Y MATERIALES
```

Capcaleres:

- `Tipo de filtro / material`
- `Cantidad / unidad`

Fila:

```html
<tr>
  <td>
    <textarea class="material-tipo texto-operacion" placeholder="Filtro / material"></textarea>
  </td>
  <td>
    <textarea class="autogrow cantidad-unidad" rows="1" placeholder="Cantidad / unidad"></textarea>
  </td>
</tr>
```

Estructura conceptual:

```js
materials = [
  {
    tipo: "...",
    cantidadUnidad: "..."
  }
]
```

### Imatges

Els blocs d'imatge tenen estructura:

```html
<div class="foto-maquina" data-photo>
  <div class="photo-placeholder">Espacio para imagen de la maquina</div>
  <img alt="" style="display:none;">
  <input type="file" accept="image/*" style="display:none;" />
  <div class="photo-actions">
    <button type="button">Seleccionar imagen</button>
    <button type="button">Quitar imagen</button>
  </div>
</div>
```

No tenen `id` ni `name`.

Quan l'usuari selecciona una imatge, es llegeix amb `FileReader` i es guarda com `dataUrl` a:

```js
img.src
```

Estructura conceptual:

```js
photos = [
  {
    src: "data:image/...",
    visible: true
  }
]
```

### Funcionament de seccions dinamiques

#### Grups

Funcions:

```js
addGroup()
removeActiveGroup()
setActiveGroup(groupEl)
getActiveGroup()
```

`addGroup()` demana el nom amb:

```js
window.prompt(...)
```

I crea:

```html
<table class="no-page-break group" data-group>
```

Amb:

- titol `.section-title`
- `contenteditable`
- `tbody data-rows`
- una primera fila clau/valor

#### Files

Funcions:

```js
addRowToActiveGroup()
removeActiveRow()
clearActiveRowsContent()
clearActiveTechnicalTable()
```

Per grups normals, una fila es:

```js
{
  caracteristica: textarea.kv-key-input.value,
  valor: segonTextarea.value
}
```

#### Recanvis / materials

Funcions:

```js
getMaterialsGroup()
addSpareRow()
removeSpareRow()
clearSpareRowsContent()
```

El menu mostra "Repuestos", pero internament actua sobre:

```html
[data-group-kind="materials"]
```

Fila:

```js
{
  tipo: textarea.material-tipo.value,
  cantidadUnidad: textarea.cantidad-unidad.value
}
```

#### Undo i snapshots

Funcions:

```js
collectFieldStates(root)
createPageSnapshot()
applyFieldStates(root, fieldStates)
saveUndoSnapshot()
restoreUndoSnapshot()
```

`createPageSnapshot()` guarda:

```js
{
  html: page.innerHTML,
  fields: collectFieldStates(page),
  signature: JSON.stringify(...)
}
```

Aixo serveix per restaurar el DOM, pero no es una exportacio formal de dades.

#### Copiar i enganxar files

Funcions:

```js
createKeyValuePasteRow()
createMaterialsPasteRow()
serializeSelectedTechnicalRows()
normalizeClipboardTable(text)
applyBulkPaste(field, text)
ensurePasteTargetRow(tbody, kind, rowIndex)
```

Permeten copiar/enganxar taules de text dins de les files tecniques.

## 4. Fitxa de manteniment

### Fitxers principals

```txt
public/maintenance-sheet-builder/fichas.html
public/maintenance-sheet-builder/fichas_patch.js
```

Fitxers auxiliars carregats:

```html
<script src="maquinaria_completa.js"></script>
<script src="mantenimientos.js"></script>
<script src="mantenimientos_modelos.js"></script>
<script src="fichas_patch.js?v=20260714-row-select-copy-2"></script>
```

### Com s'emmagatzemen les dades

La fitxa de manteniment no utilitza state React.

Les dades viuen directament al DOM:

- `input`
- `textarea`
- `checkbox`
- `img`
- `input type="file"`

No hi ha un objecte intermedi unic amb tota la fitxa abans de generar PDF.

### Camps de capcalera i maquina

| Text visible | id | name | acces intern | tipus |
|---|---|---|---|---|
| Mantenimiento | cap textual | cap | titol fix `.header-title` + `tipoMantenimiento` | text + input |
| Interval de manteniment | `tipoMantenimiento` | cap | `document.getElementById("tipoMantenimiento").value` | `input` amb `list="tipoMantenimientoOpciones"` |
| Text impres del manteniment | `tipoMantenimientoPrint` | cap | `textContent` sincronitzat per `syncTipoMantenimientoPrint()` | `span` |
| MAQUINA | `tipoMaquina` | cap | `document.getElementById("tipoMaquina").value` | `textarea` |
| MARCA Y MODELO | `marcaModelo` | cap | `document.getElementById("marcaModelo").value` | `textarea` |
| CODIGO / Nº INTERNO | `codigoInterno` | cap | `document.getElementById("codigoInterno").value` | `input` amb `list="codigoInternoList"` |
| MATRICULA | `matricula` | cap | `document.getElementById("matricula").value` | `textarea` |
| Nº BASTIDOR / SERIE | `bastidor` | cap | `document.getElementById("bastidor").value` | `textarea` |
| HORAS DE TRABAJO/KILOMETROS | `horasKm` | cap | `document.getElementById("horasKm").value` | `textarea` |

Datalists:

| Element | id | tipus |
|---|---|---|
| Opcions de manteniment | `tipoMantenimientoOpciones` | `datalist` |
| Opcions de codi intern | `codigoInternoList` | `datalist` |

Opcions inicials de `tipoMantenimientoOpciones`:

```txt
ANUAL
DIARIO
50 h
250 h
500 h
1000 h
2000 h
3000 h
60.000 km
```

Aquestes opcions poden actualitzar-se segons `mantenimientos_modelos.js`.

### Operacions

Taula:

```html
<table id="operaciones">
```

Titol visible:

```txt
TIPO DE OPERACION
```

Fila:

| Text visible / placeholder | id | name | acces intern | tipus |
|---|---|---|---|---|
| Descripcion de la operacion | cap | cap | `textarea.texto-operacion.value` | `textarea` |
| Check d'operacio feta | cap | cap | `input[type="checkbox"].checked` | `checkbox` |
| Boto eliminar | cap | cap | `deleteOperacion(this)` | `button` |

Estructura conceptual:

```js
operaciones = [
  {
    descripcion: "...",
    realizada: true
  }
]
```

No existeix com array formal persistent; son files DOM dins de `#operaciones tbody`.

### Filtres i materials

Taula:

```html
<table id="filtrosMateriales">
```

Titol visible:

```txt
FILTRO Y MATERIALES
```

Capcaleres:

- `Tipo de filtro / material`
- `Cantidad / unidad`

Fila:

| Text visible / placeholder | id | name | acces intern | tipus |
|---|---|---|---|---|
| Filtro / material | cap | cap | `textarea.material-tipo.value` | `textarea` |
| Cantidad / unidad | cap | cap | `textarea.cantidad-unidad.value` | `textarea` |
| Boto eliminar | cap | cap | `deleteFiltroMaterial(this)` | `button` |

Estructura conceptual:

```js
filtrosMateriales = [
  {
    tipo: "...",
    cantidadUnidad: "..."
  }
]
```

### Observacions, responsable, data i firma

| Text visible | id | name | acces intern | tipus |
|---|---|---|---|---|
| OBSERVACIONES GENERALES | `observacionesGenerales` | cap | `document.getElementById("observacionesGenerales").value` | `textarea` |
| RESPONSABLE | `responsable` | cap | `document.getElementById("responsable").value` | `textarea` |
| FECHA | `fechaFirma` | cap | `document.getElementById("fechaFirma").value` | `input type="date"` |
| FIRMA - imatge | `firmaImg` | cap | `document.getElementById("firmaImg").src` | `img` |
| FIRMA - selector fitxer | `firmaInput` | cap | `FileReader -> firmaImg.src` | `input type="file"` |

### Funcionament d'accions dinamiques

#### Afegir operacio

Boto original:

```html
<button type="button" onclick="addOperacion()">+ Añadir operación</button>
```

Funcio:

```js
function addOperacion()
```

Crea una fila nova a:

```js
document.querySelector("#operaciones tbody")
```

Amb:

```html
<td>
  <textarea class="texto-operacion" placeholder="Descripción de la operación"></textarea>
</td>
<td class="check"><input type="checkbox"></td>
<td class="delete-cell">
  <button type="button" class="delete-btn" onclick="deleteOperacion(this)">X</button>
</td>
```

#### Treure operacio

Hi ha dues vies:

1. Boto per fila:

```js
deleteOperacion(btn)
```

Fa:

```js
btn?.closest("tr")?.remove();
```

2. `fichas_patch.js` afegeix un boto de toolbar:

```txt
Quitar operacion
```

Amb id:

```js
btnRemoveOperacion
```

Elimina les files seleccionades o la fila activa.

#### Afegir filtre

Boto original:

```html
<button type="button" onclick="addFiltroMaterialRow()">+ Añadir fila</button>
```

`fichas_patch.js` li canvia el text a:

```txt
+ Añadir filtro
```

Funcio:

```js
function addFiltroMaterialRow()
```

Crea una fila nova a:

```js
document.querySelector("#filtrosMateriales tbody")
```

Amb:

```html
<td><textarea class="material-tipo" placeholder="Filtro / material"></textarea></td>
<td><textarea class="cantidad-unidad" rows="1" placeholder="Cantidad / unidad"></textarea></td>
<td class="delete-cell">
  <button type="button" class="delete-btn" onclick="deleteFiltroMaterial(this)">X</button>
</td>
```

#### Treure filtre

Hi ha dues vies:

1. Boto per fila:

```js
deleteFiltroMaterial(btn)
```

Fa:

```js
btn?.closest("tr")?.remove();
```

2. `fichas_patch.js` afegeix un boto de toolbar:

```txt
Quitar filtro
```

Amb id:

```js
btnRemoveFiltro
```

Elimina les files seleccionades o la fila activa.

### Seleccio de files

`fichas_patch.js` gestiona:

```js
activeOperacionRow
activeFiltroRow
activeMaintenanceTable
maintenanceSelectionAnchor
```

I classes CSS:

```txt
is-selected-row
is-active-row
```

Funcions relacionades:

```js
setActiveMaintenanceRow(row, event)
getSelectedRowsForTable(table, fallbackRow)
rememberActiveRow(target)
getActiveRow(tableSelector, savedRow)
```

## 5. Generacio de PDF i HTML

### PDF de fitxa tecnica

Funcio:

```js
guardarPDF()
```

Fitxer:

```txt
public/machinery-spec-sheet-builder/ficha-tecnica.html
```

Implementacio:

```js
function guardarPDF() {
  refreshPrintWatermarks();
  setTimeout(() => window.print(), 50);
}
```

No usa `jsPDF` ni `html2pdf`. Genera el PDF mitjancant el dialeg d'impressio del navegador:

```js
window.print()
```

Abans de generar, refresca marques d'aigua amb:

```js
refreshPrintWatermarks()
```

No crea cap objecte complet de dades abans del PDF.

### PDF de fitxa de manteniment

Funcio:

```js
guardarPDF()
```

Fitxer:

```txt
public/maintenance-sheet-builder/fichas.html
```

Fa:

```js
preparePrintFooter()
paginateForPrint()
window.print()
```

Funcions principals:

```js
preparePrintFooter()
paginateForPrint()
cleanupAfterPrint()
```

`paginateForPrint()` crea pagines d'impressio dins de:

```html
<div id="printPages"></div>
```

I clona:

- capcalera
- taula d'operacions
- taula de filtres/materials
- observacions
- responsable
- firma
- footer

No crea un objecte JSON complet de dades abans del PDF.

### Guardar HTML

S'ha trobat guardat HTML formal a la fitxa de manteniment.

Funcio:

```js
guardarHTMLFicha()
```

Fitxer:

```txt
public/maintenance-sheet-builder/fichas.html
```

Fa:

1. Clona `.page`.
2. Elimina controls de firma tipus file.
3. Copia valors reals de `input`, `textarea`, `select`.
4. Copia textareas sense id per ordre:
   - `#operaciones textarea`
   - `#filtrosMateriales textarea`
5. Copia checkboxes per ordre.
6. Genera un `Blob` HTML.
7. Crea un `<a download>`.
8. Descarrega un `.html`.

Nom del fitxer generat:

```js
guessFileName()
```

Format:

```txt
MANTENIMIENTO-{intervalo}_{codigo}_{yyyymmdd}_{hhmmss}.html
```

A la fitxa tecnica no s'ha trobat una funcio equivalent de `guardarHTML`.

## 6. Funcions reutilitzables

### Fitxa tecnica

Fitxer:

```txt
public/machinery-spec-sheet-builder/ficha-tecnica.html
```

Funcions:

```js
guardarPDF()
volverApp()
refreshPrintWatermarks()
collectFieldStates(root)
createPageSnapshot()
applyFieldStates(root, fieldStates)
saveUndoSnapshot()
restoreUndoSnapshot()
wirePhotoBlock(wrapper)
leerCodigosTecnicosGuardados()
guardarCodigosTecnicosGuardados(codigos)
getMaquinariaTecnica()
obtenerDatosTecnicosActuales()
guardarCodigoTecnicoSiEsNuevo()
rellenarSelectCodigo(input)
rellenarTecnicaDesdeCodigo()
closeAllMenus()
toggleMenu(menuEl)
setActiveGroup(groupEl)
getActiveGroup()
clearRowSelection(tbody)
getSelectedRows(tbody)
getRowsForAction(tbody)
clearRowFields(row)
getActiveRowsBodyFromCursor()
clearActiveTechnicalTable()
setActiveRow(rowEl, event)
setActivePhoto(photoEl)
getActivePhoto()
getActiveRow()
addGroup()
addRowToActiveGroup()
removeActiveRow()
clearActiveRowsContent()
getMaterialsGroup()
addSpareRow()
removeSpareRow()
clearSpareRowsContent()
removeActiveGroup()
addPhotoBeforeActiveGroup()
createPhotoBlock()
removeActivePhoto()
autoGrowTextarea(textarea)
createKeyValuePasteRow()
createMaterialsPasteRow()
getEditableCells(row)
serializeSelectedTechnicalRows()
normalizeClipboardTable(text)
applyBulkPaste(field, text)
ensurePasteTargetRow(tbody, kind, rowIndex)
```

Especialment utils per una futura importacio:

- `addGroup()`, tot i que actualment demana `prompt`.
- `addRowToActiveGroup()`
- `addSpareRow()`
- `createKeyValuePasteRow()`
- `createMaterialsPasteRow()`
- `clearRowFields(row)`
- `rellenarTecnicaDesdeCodigo()`
- `guardarCodigoTecnicoSiEsNuevo()`
- `saveUndoSnapshot()`
- `autoGrowTextarea()`

### Fitxa de manteniment

Fitxer:

```txt
public/maintenance-sheet-builder/fichas.html
```

Funcions:

```js
autoResize(textarea)
syncTipoMantenimientoPrint()
preparePrintFooter()
seleccionarFirma()
quitarFirma()
handleFirmaFile(file)
addOperacion()
addFiltroMaterialRow()
deleteOperacion(btn)
deleteFiltroMaterial(btn)
guardarPDF()
mmToPx(mm)
paginateForPrint()
cleanupAfterPrint()
limpiarDatosMaquina()
rellenarDesdeCodigo()
normalizarCodigoMaquina(codigo)
esIntervaloHoras(k)
pesoIntervaloMantenimiento(k)
labelIntervaloMantenimiento(k)
actualizarIntervalosMantenimientoPorCodigo(codigo)
cargarMantenimiento()
guessFileName()
guardarHTMLFicha()
initSelectCodigoInterno()
```

Fitxer:

```txt
public/maintenance-sheet-builder/fichas_patch.js
```

Funcions:

```js
ensureToolbar()
fallbackAddOperacion()
fallbackAddMaterial()
ensureCodigoInternoOptions()
fetchMachineryFallback()
getRows(table)
clearSelectedRows(table)
setActiveMaintenanceRow(row, event)
getSelectedRowsForTable(table, fallbackRow)
rememberActiveRow(target)
getActiveRow(tableSelector, savedRow)
clearRowFields(row)
getTableFromCursor()
clearActiveMaintenanceTable()
removeActiveMaintenanceTable()
wireActions()
splitLines(text)
parseMaterialLine(line)
setTextareaValue(el, value)
handlePasteOperations(target, clipboardText)
handlePasteMaterials(target, clipboardText)
handlePasteQuantities(target, clipboardText)
getRowValues(row)
serializeSelectedMaintenanceRows()
ensureSaveButtonsHaveIds()
fixEncodingArtifacts()
```

Especialment utils per importacio futura:

- `addOperacion()`
- `addFiltroMaterialRow()`
- `clearRowFields(row)`
- `setTextareaValue(el, value)`
- `parseMaterialLine(line)`
- `handlePasteOperations(...)`
- `handlePasteMaterials(...)`
- `rellenarDesdeCodigo()`
- `actualizarIntervalosMantenimientoPorCodigo(codigo)`
- `syncTipoMantenimientoPrint()`
- `autoResize(textarea)`

## 7. Format de dades recomanat per importar dades

El format mes senzill i segur seria JSON.

Motiu:

- Els formularis tenen seccions repetibles.
- Hi ha grups dinamics.
- Hi ha files de dues columnes.
- Hi ha operacions amb checkbox.
- Hi ha filtres/materials amb quantitat.
- CSV o text delimitat seria fragil per dades incompletes o multilinea.
- Un objecte JavaScript seria util internament, pero per enganxar text generat per ChatGPT es millor JSON pur.

El futur importador hauria d'acceptar JSON directe i tambe extreure JSON si ve dins d'un bloc Markdown del tipus:

````markdown
```json
{ ... }
```
````

### JSON preliminar per fitxa tecnica

Basat exclusivament en camps reals trobats:

```json
{
  "tipoFicha": "tecnica",
  "cabecera": {
    "maquina": "",
    "codigoInterno": "",
    "marcaModelo": "",
    "matricula": "",
    "anyo": ""
  },
  "caracteristicasGenerales": {
    "marca": "",
    "modelo": "",
    "numeroSerieBastidor": "",
    "fechaCompra": "",
    "valorCompra": "",
    "motor": "",
    "potencia": "",
    "consumoEstimado": "",
    "estado": ""
  },
  "grupos": [
    {
      "titulo": "DIMENSIONES",
      "filas": [
        {
          "caracteristica": "",
          "valor": ""
        }
      ]
    },
    {
      "titulo": "SISTEMA ELECTRICO",
      "filas": [
        {
          "caracteristica": "",
          "valor": ""
        }
      ]
    }
  ],
  "filtrosMateriales": [
    {
      "tipo": "",
      "cantidadUnidad": ""
    }
  ],
  "imagenes": [
    {
      "src": ""
    }
  ]
}
```

Nota: `imagenes[].src` podria ser opcional. Si ChatGPT extreu text d'un PDF, probablement no podra aportar imatges; es poden deixar buides.

### JSON preliminar per fitxa de manteniment

```json
{
  "tipoFicha": "mantenimiento",
  "mantenimiento": "",
  "maquina": {
    "tipoMaquina": "",
    "marcaModelo": "",
    "codigoInterno": "",
    "matricula": "",
    "bastidorSerie": "",
    "horasTrabajoKilometros": ""
  },
  "operaciones": [
    {
      "descripcion": "",
      "realizada": false
    }
  ],
  "filtrosMateriales": [
    {
      "tipo": "",
      "cantidadUnidad": ""
    }
  ],
  "observacionesGenerales": "",
  "responsable": "",
  "fecha": "",
  "firma": {
    "src": ""
  }
}
```

## 8. Fitxers que probablement caldria modificar per implementar importacio des de ChatGPT

Funcionalitat futura:

```txt
Importar dades generades per ChatGPT
```

Objectiu:

1. Premer un boto.
2. Obrir una finestra/modal.
3. Enganxar un bloc de text generat per ChatGPT.
4. Premer "Importar".
5. Detectar si es una fitxa tecnica o de manteniment.
6. Crear automaticament les files/grups/operacions necessaries.
7. Emplenar tots els camps disponibles.
8. Deixar en blanc els camps que ChatGPT no hagi pogut extreure del PDF.
9. Continuar permetent editar manualment qualsevol dada.
10. Generar el PDF exactament com es fa actualment.

### Fitxa tecnica

Fitxer probablement a modificar:

```txt
public/machinery-spec-sheet-builder/ficha-tecnica.html
```

Per afegir:

- Boto `Importar dades`
- Modal o finestra d'enganxar text
- Parser JSON
- Detector `tipoFicha`
- Funcions per netejar i reconstruir grups
- Creacio de grups necessaris
- Creacio de files necessaries
- Emplenat de camps per `id`
- Emplenat de `filtrosMateriales`
- Camps no trobats deixats buits
- Edicio manual posterior
- Crides a `autoGrowTextarea()`
- Conservacio de `guardarPDF()` sense canvis

### Fitxa de manteniment

Fitxer probablement a modificar:

```txt
public/maintenance-sheet-builder/fichas.html
```

Per afegir:

- Boto `Importar dades`
- Modal o textarea d'importacio
- Parser JSON
- Emplenat de camps amb `id`
- Reconstruccio de `#operaciones tbody`
- Reconstruccio de `#filtrosMateriales tbody`
- Sincronitzacio de `tipoMantenimientoPrint`
- Crides a `autoResize()`
- Conservacio de `guardarPDF()` i `guardarHTMLFicha()`

### Capa patch de manteniment

Fitxer opcional pero probable:

```txt
public/maintenance-sheet-builder/fichas_patch.js
```

Aquest fitxer ja modifica la toolbar, afegeix botons, seleccio de files, copiar/enganxar i compatibilitat. La nova funcionalitat podria anar aqui si es vol mantenir `fichas.html` mes estable.

### Opcio recomanada de mantenibilitat

Crear fitxers separats:

```txt
public/machinery-spec-sheet-builder/import-chatgpt.js
public/maintenance-sheet-builder/import-chatgpt.js
```

I carregar-los des dels HTML corresponents.

Aixo evitaria barrejar massa logica nova dins dels HTML grans actuals.

També es podria crear una funcio comuna conceptual, pero com les dues fitxes tenen DOM diferent, seria mes segur començar amb importadors separats i mantenir la generacio PDF intacta.

### Fitxers React probablement no necessaris

En principi no cal tocar:

```txt
src/App.tsx
src/pages/MachineryTechnicalSheetBuilderPage.tsx
src/pages/MaintenanceSheetBuilderPage.tsx
```

Nomes caldria tocar-los si es vol que el boto d'importacio estigui fora de l'iframe, cosa que complicaria la comunicacio amb el DOM intern.

La via mes segura es posar el boto dins dels HTML carregats per iframe.

## 9. Conclusio tecnica

La funcionalitat actual de fitxes i PDFs depen del DOM dels fitxers HTML de `public`, no de React state.

Per tant, una futura importacio de dades generades per ChatGPT hauria de:

1. Llegir JSON enganxat.
2. Detectar `tipoFicha`.
3. Emplenar camps amb `document.getElementById(...).value`.
4. Crear files DOM per operacions, filtres, materials i grups.
5. Executar `autoResize()` o `autoGrowTextarea()`.
6. No tocar `guardarPDF()` ni el flux basat en `window.print()`.
7. Deixar tots els camps editables manualment despres de la importacio.

