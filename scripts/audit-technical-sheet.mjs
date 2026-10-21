import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright')
const base = process.env.AUDIT_URL || 'http://localhost:5173'
const output = path.resolve('docs/audit-technical-sheet')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const checks = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('dialog', (dialog) => dialog.type() === 'prompt' ? dialog.accept('MOTOR') : dialog.accept())
  await page.goto(base + '/ficha-tecnica')
  assert.equal(await page.frameLocator('iframe').getByText('Imprimir PDF', { exact: true }).count(), 1)
  checks.push('Editor accessible inside the application')
  await page.goto(base + '/machinery-spec-sheet-builder/ficha-tecnica.html')
  const materials = page.locator('[data-group-kind="materials"]')
  const groupMenu = page.locator('[data-menu]').filter({ has: page.locator('[data-menu-trigger]', { hasText: 'Grupo' }) })
  async function menuAction(menu, name) {
    await menu.locator('[data-menu-trigger]').click()
    await menu.getByRole('menuitem', { name, exact: true }).click()
  }
  await materials.locator('.material-tipo').fill('FILTRO DE PRUEBA')
  await page.getByRole('button', { name: 'Añadir fila', exact: true }).click()
  assert.equal(await materials.locator('[data-rows] > tr').count(), 2)
  assert.equal(await materials.locator('.material-tipo').count(), 2)
  await page.getByRole('button', { name: 'Eliminar fila', exact: true }).click()
  assert.equal(await materials.locator('[data-rows] > tr').count(), 1)
  assert.equal(await materials.locator('.material-tipo').inputValue(), 'FILTRO DE PRUEBA')
  await page.locator('#tec_marca').focus()
  await page.getByRole('button', { name: 'Añadir fila', exact: true }).click()
  await page.locator('tr.is-active-row textarea').first().fill('DATO ADICIONAL')
  await page.locator('tr.is-active-row textarea').last().fill('CONSERVADO AL RECUPERAR')
  checks.push('Unified row controls work for materials and general characteristics')
  await page.getByRole('textbox', { name: 'Nº bastidor/serie', exact: true }).fill('BASTIDOR-AUDITORIA-001')
  await page.locator('#tec_tipoMaquina').fill('MINICARGADORA SOBRE RUEDAS ELÉCTRICA')
  await page.locator('#tec_marcaModelo').fill('XCMG XC7-SR07EV')
  assert.equal(await page.locator('.tec-header #tec_serie').count(), 1)
  assert.equal(await page.locator('.acciones-ficha button').filter({ hasText: 'Vaciar' }).count(), 0)
  await materials.locator('.material-tipo').focus()
  await menuAction(groupMenu, 'Añadir')
  let motor = page.locator('[data-group]').filter({ has: page.locator('.section-title', { hasText: /^MOTOR$/ }) })
  assert.equal(await motor.evaluate((el) => el.nextElementSibling.dataset.groupKind), 'materials')
  await menuAction(groupMenu, '↑ Subir')
  const order = await page.locator('#tec-groups > [data-group] > tbody > tr > .section-title').allTextContents()
  await page.waitForFunction(() => {
    const draft = JSON.parse(localStorage.getItem('rpFichasDraftTecnicaV1') || 'null')
    return draft?.data.layout.some((item) => item.group?.titulo === 'MOTOR')
  })
  await page.reload()
  await page.getByRole('button', { name: 'Recuperar', exact: true }).click()
  assert.deepEqual(await page.locator('#tec-groups > [data-group] > tbody > tr > .section-title').allTextContents(), order)
  assert.equal(await page.locator('textarea').evaluateAll((fields) => fields.some((field) => field.value === 'CONSERVADO AL RECUPERAR')), true)
  assert.equal(await page.getByRole('textbox', { name: 'Nº bastidor/serie', exact: true }).inputValue(), 'BASTIDOR-AUDITORIA-001')
  assert.equal(await page.locator('#tec_serie').count(), 1)
  checks.push('Bastidor in header survives reload without duplicates; clear controls removed')
  checks.push('Added rows and manual group order survive reload and recovery')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('.tec-header').screenshot({ path: path.join(output, 'header-bastidor.png') })
  await page.screenshot({ path: path.join(output, 'editor-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: path.join(output, 'editor-mobile.png'), fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })

  // Force a normal-sized motor group near a page boundary, followed by a long group.
  await page.evaluate(() => {
    const general = document.querySelector('[data-group]')
    window.setActiveGroup(general)
    const fields = general.querySelectorAll('[data-rows] textarea')
    fields.forEach((field, index) => { field.value = 'GENERAL ' + index + '\n' + 'DETALLE\n'.repeat(2) })
    const motor = Array.from(document.querySelectorAll('[data-group]')).find((g) => g.querySelector('.section-title').textContent === 'MOTOR')
    window.setActiveGroup(motor)
    motor.querySelector('[data-rows] textarea').value = 'MOTOR_INICIO'
    motor.querySelectorAll('[data-rows] textarea')[1].value = 'MOTOR_FIN'
    for (let index = 0; index < 5; index++) {
      window.addRowToActiveGroup()
      const row = window.getActiveRow()
      row.querySelectorAll('textarea')[0].value = 'MOTOR_DATO_' + index
      row.querySelectorAll('textarea')[1].value = 'VALOR_' + index
    }
    window.prompt = () => 'GRUPO EXTENSO'
    window.addGroup()
    const long = window.getActiveGroup()
    long.querySelector('[data-rows]').innerHTML = ''
    for (let index = 0; index < 65; index++) {
      window.addRowToActiveGroup()
      const fields = window.getActiveRow().querySelectorAll('textarea')
      fields[0].value = 'LARGO_' + String(index).padStart(2, '0')
      fields[1].value = 'VALOR_LARGO_' + String(index).padStart(2, '0')
    }
  })
  await page.pdf({ path: path.join(output, 'pagination.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true })
  checks.push('Generated real Chromium PDF with normal and oversized groups')
  assert.deepEqual(errors, [])
  checks.push('No JavaScript runtime errors')
  await writeFile(path.join(output, 'browser-audit.json'), JSON.stringify({ checks, errors }, null, 2))
  console.log(JSON.stringify({ checks, errors, output }, null, 2))
} finally {
  await browser.close()
}
