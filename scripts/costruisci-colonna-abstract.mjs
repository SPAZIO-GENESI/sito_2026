#!/usr/bin/env node
/**
 * Assembla la colonna `abstract` PRONTA DA INCOLLARE, senza CERCA.VERT.
 *
 * Legge le descrizioni generate (descrizioni.tsv, chiave row_id) e il foglio,
 * e produce `colonna-abstract.txt`: una riga per ogni riga-dati del foglio,
 * NELLO STESSO ORDINE, con la nuova descrizione dove esiste e quella vecchia
 * dove non è ancora stata generata. Così si incolla in un colpo solo in L2.
 *
 * USO:  node scripts/costruisci-colonna-abstract.mjs
 * POI:  apri colonna-abstract.txt, copia tutto, vai sul foglio in cella L2 (abstract)
 *       e incolla. (Verifica che il numero di righe combaci con i libri.)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const SHEET_ID = '1Ef7n23TnmRFfpdzp4D24v0kKDrBxGQnhUPI6CNOASU4'
const WORKER_URL = `https://cfg_googledata.it-e3f.workers.dev/?sheet=${SHEET_ID}&f=${process.env.CDID_KEY || ''}`
const TSV = new URL('./descrizioni.tsv', import.meta.url)
const OUT = new URL('./colonna-abstract.txt', import.meta.url)
const oneLine = (s) => ((s ?? '') + '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()

if (!existsSync(TSV)) { console.error('Manca descrizioni.tsv: genera prima le descrizioni.'); process.exit(1) }

// mappa row_id -> nuova descrizione
const nuove = new Map()
for (const line of readFileSync(TSV, 'utf8').split('\n')) {
  const i = line.indexOf('\t'); if (i < 0) continue
  const id = line.slice(0, i).trim(); const txt = line.slice(i + 1)
  if (id && id !== 'row_id') nuove.set(id, oneLine(txt))
}

const res = await fetch(WORKER_URL)
const { values } = await res.json()
const headers = values[0] || []
const ABS = headers.indexOf('abstract')   // colonna esistente nel foglio
const rows = values.slice(1)

const col = rows.map((r) => {
  const id = ((r[0] ?? '') + '').trim()
  return nuove.has(id) ? nuove.get(id) : oneLine(r[ABS])
})

writeFileSync(OUT, col.join('\n') + '\n')
console.log(`Righe scritte: ${col.length} (devono combaciare con i libri del foglio).`)
console.log(`Nuove descrizioni applicate: ${[...nuove.keys()].length}`)
console.log(`File: ${OUT.pathname}`)
console.log(`Ora: apri il file, copia tutto, vai in cella L2 del foglio e incolla.`)
