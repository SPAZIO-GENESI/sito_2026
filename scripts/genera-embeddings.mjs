#!/usr/bin/env node
/**
 * Calcola gli embedding dei libri del Centro Documentazione e li salva in
 * public/data/libri-embeddings.json — la base della ricerca semantica del catalogo.
 *
 * Usa il Worker cfg_embeddings (Workers AI, bge-m3): nessuna chiave necessaria.
 *
 * PREREQUISITI:
 *   1. aver incollato le descrizioni nella colonna `abstract` del foglio;
 *   2. aver deployato il Worker cfg_embeddings (cartella ../../cfgs_embeddings: `wrangler deploy`).
 *
 * USO:   node scripts/genera-embeddings.mjs
 *        (eventuale override URL Worker: $env:EMB_WORKER="https://...workers.dev")
 *
 * Dopo: committa public/data/libri-embeddings.json — la ricerca userà quel file.
 * Rilancia questo script quando cambi le descrizioni.
 */
import { mkdirSync, writeFileSync } from 'node:fs'

const SHEET_ID = '1Ef7n23TnmRFfpdzp4D24v0kKDrBxGQnhUPI6CNOASU4'
const WORKER_SHEET = `https://cfg_googledata.it-e3f.workers.dev/?sheet=${SHEET_ID}&f=A3SD21`
const WORKER_EMB = (process.env.EMB_WORKER || 'https://cfg_embeddings.it-e3f.workers.dev').replace(/\/$/, '')
const OUT_DIR = new URL('../public/data/', import.meta.url)
const OUT = new URL('../public/data/libri-embeddings.json', import.meta.url)

const dec = (s) => { try { return decodeURIComponent((s ?? '') + '') } catch { return (s ?? '') + '' } }
const clean = (s) => dec(s).replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function embed(text) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(`${WORKER_EMB}/?q=${encodeURIComponent(text)}`, {
        headers: { Origin: 'https://spaziogenesi.org' },
      })
      if (r.status === 429 || r.status >= 500) { await sleep(1200 * (i + 1)); continue }
      const j = await r.json()
      if (Array.isArray(j.vec)) return j.vec
      throw new Error(JSON.stringify(j).slice(0, 140))
    } catch (e) { if (i === 3) throw e; await sleep(1200 * (i + 1)) }
  }
}

const { values } = await (await fetch(WORKER_SHEET)).json()
const h = values[0]
const I = h.indexOf('row_id'), VIS = h.indexOf('visibile'), AUT = h.indexOf('autore'),
      TIT = h.indexOf('titolo'), ED = h.indexOf('editore'), AB = h.indexOf('abstract')
const rows = values.slice(1).filter((r) => ((r[VIS] || '') + '').toUpperCase() === 'TRUE')

const vectors = {}
let n = 0, errori = 0
for (const r of rows) {
  const id = (r[I] ?? '') + ''
  const text = [clean(r[TIT]), clean(r[AUT]), clean(r[ED]), clean(r[AB])].filter(Boolean).join('. ')
  n++
  process.stdout.write(`(${n}/${rows.length}) #${id} `)
  try {
    const v = await embed(text)
    vectors[id] = v.map((x) => Math.round(x * 10000) / 10000) // 4 decimali per ridurre il peso
    console.log('ok')
  } catch (e) { errori++; console.log('ERRORE', e.message) }
  await sleep(200)
}

mkdirSync(OUT_DIR, { recursive: true })
const dim = Object.values(vectors)[0]?.length || 0
writeFileSync(OUT, JSON.stringify({ model: '@cf/baai/bge-m3', dim, vectors }))
console.log(`\nScritto ${OUT.pathname} — ${Object.keys(vectors).length} libri, dim ${dim}${errori ? `, ${errori} errori` : ''}.`)
console.log('Ora committa public/data/libri-embeddings.json.')
