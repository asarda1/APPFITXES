import { mkdir, copyFile, cp } from 'node:fs/promises'

const source = new URL('../node_modules/pdfjs-dist/', import.meta.url)
const target = new URL('../public/pdf-import/vendor/', import.meta.url)
await mkdir(target, { recursive: true })
await Promise.all(['pdf.mjs', 'pdf.worker.mjs'].map((name) => copyFile(new URL('legacy/build/' + name, source), new URL(name, target))))
await cp(new URL('standard_fonts/', source), new URL('standard_fonts/', target), { recursive: true })
await copyFile(new URL('LICENSE', source), new URL('LICENSE', target))
