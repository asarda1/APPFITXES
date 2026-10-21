import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright')
const base = process.env.AUDIT_URL || 'http://localhost:5173'
const output = path.resolve('docs/audit-maintenance-settings')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = [], checks = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => {
    const key = 'rpFichasTemplatesMantenimientoV1'
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(['ANTIGUA', 'RECIENTE'].map((id) => ({
      id, nombre: id, data: { mantenimiento: '500h', maquina: {}, operaciones: [{ descripcion: 'OPERACION ' + id, realizada: false }], filtrosMateriales: [] },
    }))))
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto(base + '/maintenance-sheet-builder/fichas.html')
  await page.waitForFunction(() => window.rpTemplatesMantenimiento?.getCombinedTemplates().some((record) => record.builtin))
  const field = page.getByRole('combobox', { name: 'Tipo de mantenimiento' })
  const arrow = page.getByRole('button', { name: 'Mostrar opciones de mantenimiento' })
  const menu = page.getByRole('listbox', { name: 'Mantenimientos guardados' })
  const defaults = ['Diario', 'Anual', 'Primeras 50h', '500h', '1.000h', '2.000h']
  for (const [prefix, expected] of [['d', 'Diario'], ['D', 'Diario'], ['a', 'Anual'], ['p', 'Primeras 50h'], ['5', '500h'], ['1', '1.000h'], ['2', '2.000h']]) {
    await field.fill(prefix)
    assert.equal(await field.inputValue(), prefix)
    assert.equal(await menu.isVisible(), false)
    await field.press('Enter')
    assert.equal(await field.inputValue(), expected)
  }
  await field.fill('1')
  await field.press('End')
  await field.pressSequentially('.500h')
  assert.equal(await field.inputValue(), '1.500h')
  await field.press('Enter')
  assert.equal(await field.inputValue(), '1.500h')
  await page.getByRole('button', { name: 'Guardar en listado', exact: true }).click()
  await field.fill('d')
  await arrow.click()
  assert.deepEqual(await menu.getByRole('option').allTextContents(), defaults.concat('1.500h'))
  await page.screenshot({ path: path.join(output, 'intervals-desktop.png'), fullPage: true })
  await menu.getByRole('option', { name: '1.500h', exact: true }).click()
  checks.push('Six ordered defaults, case-insensitive Enter completion, free typing and full arrow-only list verified')

  await page.locator('#codigoInterno').fill('CONSERVAR-FICHA')
  await page.getByRole('button', { name: 'Plantillas', exact: true }).click()
  const modal = page.locator('#rp-templates-modal-mantenimiento')
  const count = await modal.locator('.rp-templates-row').count()
  assert.equal(await modal.getByRole('button', { name: 'EDITAR', exact: true }).count(), count)
  assert.equal(await modal.getByRole('button', { name: 'ELIMINAR', exact: true }).count(), count)
  const builtins = await page.evaluate(() => window.rpTemplatesMantenimiento.getCombinedTemplates().filter((record) => record.builtin).map((record) => record.id))
  const row = (id) => modal.locator('[data-template-id="' + id + '"]')
  await row(builtins[0]).getByRole('button', { name: 'EDITAR', exact: true }).click()
  await page.locator('#operaciones textarea').first().fill('PLANTILLA OFICIAL EDITADA')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  assert.equal(await page.locator('#codigoInterno').inputValue(), 'CONSERVAR-FICHA')
  await page.getByRole('button', { name: 'Plantillas', exact: true }).click()
  await row('ANTIGUA').getByRole('button', { name: 'EDITAR', exact: true }).click()
  await page.locator('#operaciones textarea').first().fill('PLANTILLA ANTIGUA EDITADA')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await page.getByRole('button', { name: 'Plantillas', exact: true }).click()
  await row(builtins[1]).getByRole('button', { name: 'ELIMINAR', exact: true }).click()
  assert.equal(await row(builtins[1]).count(), 0)
  await row('RECIENTE').getByRole('button', { name: 'ELIMINAR', exact: true }).click()
  assert.equal(await row('RECIENTE').count(), 0)
  await page.screenshot({ path: path.join(output, 'templates-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  const bounds = await modal.locator('.rp-templates-row').evaluateAll((rows) => rows.map((item) => ({
    width: item.clientWidth, scroll: item.scrollWidth,
    fits: Array.from(item.querySelectorAll('button')).every((button) => {
      const b = button.getBoundingClientRect(), r = item.getBoundingClientRect()
      return b.left >= r.left - 1 && b.right <= r.right + 1
    }),
  })))
  assert.ok(bounds.every((value) => value.fits && value.scroll <= value.width + 1))
  await page.screenshot({ path: path.join(output, 'templates-mobile.png'), fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await modal.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Recuperar', exact: true }).click()
  await page.waitForFunction(() => window.rpTemplatesMantenimiento?.getCombinedTemplates().some((record) => record.builtin))
  const records = await page.evaluate(() => window.rpTemplatesMantenimiento.getCombinedTemplates())
  assert.equal(records.find((record) => record.id === builtins[0]).data.operaciones[0].descripcion, 'PLANTILLA OFICIAL EDITADA')
  assert.equal(records.find((record) => record.id === 'ANTIGUA').data.operaciones[0].descripcion, 'PLANTILLA ANTIGUA EDITADA')
  assert.equal(records.some((record) => record.id === builtins[1] || record.id === 'RECIENTE'), false)
  assert.equal(await page.locator('#codigoInterno').inputValue(), 'CONSERVAR-FICHA')
  checks.push('Packaged and old personal templates can be edited/deleted; changes persist and current sheet is preserved')
  await arrow.click()
  assert.deepEqual(await menu.getByRole('option').allTextContents(), defaults.concat('1.500h'))
  await menu.getByRole('button', { name: 'Quitar Diario del listado', exact: true }).click()
  await menu.getByRole('button', { name: 'Quitar 1.500h del listado', exact: true }).click()
  assert.equal(await field.inputValue(), '1.500h')
  assert.deepEqual(await menu.getByRole('option').allTextContents(), defaults.slice(1))
  await page.reload()
  await page.getByRole('button', { name: 'Recuperar', exact: true }).click()
  await arrow.click()
  assert.deepEqual(await menu.getByRole('option').allTextContents(), defaults.slice(1))
  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(await menu.locator('.maintenance-interval-remove').evaluateAll((buttons) => buttons.every((button) => {
    const rect = button.getBoundingClientRect()
    return rect.left >= 0 && rect.right <= window.innerWidth
  })))
  await page.screenshot({ path: path.join(output, 'remove-interval-mobile.png'), fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await arrow.click()
  await page.getByRole('button', { name: 'Guardar en listado', exact: true }).click()
  await arrow.click()
  assert.deepEqual(await menu.getByRole('option').allTextContents(), defaults.slice(1).concat('1.500h'))
  checks.push('Right-side crosses remove default/custom options persistently without changing the sheet; deleted values can be saved again')
  await menu.getByRole('option', { name: '1.500h', exact: true }).click()
  await page.evaluate(() => { window.__auditPrintCalls = 0; window.print = () => { window.__auditPrintCalls++ } })
  await page.getByRole('button', { name: 'Guardar PDF', exact: true }).click()
  await page.waitForFunction(() => window.__auditPrintCalls === 1)
  await page.pdf({ path: path.join(output, 'maintenance.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true })
  assert.equal(await page.locator('#printPages .maintenance-interval-save, #printPages .maintenance-interval-hint, #printPages .maintenance-interval-toggle').count(), 0)
  checks.push('Saved interval survives reload and PDF excludes new editing controls')
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'browser-audit.json'), JSON.stringify({ checks, errors, mobileRowsFit: true }, null, 2))
  console.log(JSON.stringify({ checks, errors, output }, null, 2))
} finally {
  await browser.close()
}
