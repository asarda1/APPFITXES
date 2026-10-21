import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright')
const base = process.env.AUDIT_URL || 'http://localhost:5173'
const output = path.resolve('docs/audit-sheet-workflows')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = [], dialogs = [], checks = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('dialog', (dialog) => { dialogs.push(dialog.message()); return dialog.dismiss() })
  for (const type of ['tecnica', 'mantenimiento']) {
    const maintenance = type === 'mantenimiento'
    await page.goto(base + (maintenance ? '/ficha-mantenimiento' : '/ficha-tecnica'))
    assert.equal(await page.frameLocator('iframe').getByRole('button', { name: 'Añadir fila', exact: true }).count(), 1)
    await page.goto(base + (maintenance ? '/maintenance-sheet-builder/fichas.html' : '/machinery-spec-sheet-builder/ficha-tecnica.html'))
    if (maintenance) {
      assert.equal(await page.locator('#codigoInterno').getAttribute('placeholder'), null)
      assert.doesNotMatch(await page.locator('.acciones-ficha').innerText(), /proyecto|Vista impresión|Guardar HTML|Quitar|operación|Vaciar tabla/)
      for (const id of ['operaciones', 'filtrosMateriales']) {
        const body = page.locator('#' + id + ' tbody')
        await body.locator('textarea').first().fill('CONSERVAR ' + id)
        await page.getByRole('button', { name: 'Añadir fila', exact: true }).click()
        assert.equal(await body.locator('tr').count(), 2)
        assert.equal(await body.locator('tr.is-active-row textarea').count(), id === 'operaciones' ? 1 : 2)
        await body.locator('tr.is-active-row textarea').first().fill('NUEVA FILA')
        await page.getByRole('button', { name: 'Eliminar fila', exact: true }).click()
        assert.equal(await body.locator('tr').count(), 1)
        assert.equal(await body.locator('textarea').first().inputValue(), 'CONSERVAR ' + id)
      }
      checks.push('Maintenance direct row buttons target the cursor table exactly once')
    } else {
      const field = page.getByRole('textbox', { name: 'Nº bastidor/serie', exact: true })
      assert.equal(await field.count(), 1)
      assert.equal(await field.evaluate((el) => el.closest('td').previousElementSibling.textContent), 'Nº bastidor/serie')
      await field.fill('SERIE ANTERIOR')
    }
    const payload = maintenance ? {
      formato: 'RP-FICHAS-V1', tipoFicha: type, mantenimiento: '500 h',
      maquina: { codigoInterno: 'MAINT-AUDIT', tipoMaquina: 'TRACTOR', marcaModelo: 'MODELO AUDITORIA', bastidorSerie: 'VIN-AUDIT' },
      operaciones: [{ descripcion: 'REVISAR MOTOR', realizada: true }, { descripcion: 'COMPROBAR NIVELES', realizada: false }],
      filtrosMateriales: [{ tipo: 'ACEITE MOTOR', cantidadUnidad: '10 L' }],
    } : {
      formato: 'RP-FICHAS-V1', tipoFicha: type,
      cabecera: { codigoInterno: 'TECH-AUDIT', maquina: 'TRACTOR', marcaModelo: 'MODELO AUDITORIA' },
      caracteristicasGenerales: { numeroSerieBastidor: 'VIN-AUDIT' },
      grupos: [{ titulo: 'MOTOR', filas: [{ caracteristica: 'CILINDROS', valor: '6' }] }],
      filtrosMateriales: [{ tipo: 'ACEITE MOTOR', cantidadUnidad: '10 L' }],
    }
    await page.getByRole('button', { name: 'Importar ChatGPT', exact: true }).click()
    const modal = page.locator('#rp-chatgpt-import-modal')
    await modal.locator('textarea').fill('```json\n' + JSON.stringify(payload) + '\n```')
    assert.equal(await modal.getByRole('button', { name: 'Analizar', exact: true }).count(), 0)
    await modal.getByRole('button', { name: 'Importar', exact: true }).click()
    assert.equal(await modal.isVisible(), false)
    const codeSelector = maintenance ? '#codigoInterno' : '#tec_codigoInterno'
    const expectedCode = maintenance ? 'MAINT-AUDIT' : 'TECH-AUDIT'
    assert.equal(await page.locator(codeSelector).inputValue(), expectedCode)
    assert.deepEqual(dialogs, [])
    checks.push(type + ': existing data replaced in one import click with no intermediate summary')
    await page.getByRole('button', { name: 'Importar ChatGPT', exact: true }).click()
    await modal.locator('textarea').fill('{JSON INVALIDO')
    await modal.getByRole('button', { name: 'Importar', exact: true }).click()
    assert.ok(await modal.locator('.rp-import-error').innerText())
    assert.equal(await page.locator(codeSelector).inputValue(), expectedCode)
    await page.keyboard.press('Escape')
    await page.reload()
    await page.getByRole('button', { name: 'Recuperar', exact: true }).click()
    assert.equal(await page.locator(codeSelector).inputValue(), expectedCode)
    checks.push(type + ': invalid JSON preserves data; imported data survives reload and recovery')
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: path.join(output, type + '-desktop.png'), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(output, type + '-mobile.png'), fullPage: true })
    await page.setViewportSize({ width: 1440, height: 1000 })
    if (maintenance) {
      await page.evaluate(() => { window.__auditPrintCalls = 0; window.print = () => { window.__auditPrintCalls++ } })
      await page.getByRole('button', { name: 'Guardar PDF', exact: true }).click()
      await page.waitForFunction(() => window.__auditPrintCalls === 1)
      await page.waitForTimeout(150)
      assert.equal(await page.evaluate(() => window.__auditPrintCalls), 1)
      assert.equal(await page.locator('#printPages .no-print, #printPages input[type="file"], #printPages .delete-cell').count(), 0)
      await page.pdf({ path: path.join(output, 'maintenance.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true })
      checks.push('Maintenance PDF action opens print once and excludes editing controls')
    } else {
      await page.pdf({ path: path.join(output, 'technical.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'browser-audit.json'), JSON.stringify({ checks, errors, dialogs }, null, 2))
  console.log(JSON.stringify({ checks, errors, dialogs, output }, null, 2))
} finally {
  await browser.close()
}
