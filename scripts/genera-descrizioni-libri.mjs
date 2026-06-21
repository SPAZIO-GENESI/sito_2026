#!/usr/bin/env node
/**
 * Genera le descrizioni ("abstract") del catalogo Centro Documentazione Ivan Donatelli.
 *
 * Pipeline anti-degenerazione:
 *  - legge il foglio (worker read-only), NON rilegge mai l'abstract vecchio come input;
 *  - per ogni libro recupera una sinossi REALE da Google Books (ISBN, poi titolo+autore);
 *  - Claude scrive la descrizione ancorata a quei dati, con regola "non inventare";
 *  - output: descrizioni.tsv (row_id <TAB> abstract) da incollare nella colonna `abstract`,
 *    + report.csv (row_id, titolo, confidenza, googlebooks).
 *
 * USO (PowerShell):
 *   $env:ANTHROPIC_API_KEY = "sk-ant-..."      # la tua chiave (NON committarla)
 *   node scripts/genera-descrizioni-libri.mjs               # tutti i 205
 *   node scripts/genera-descrizioni-libri.mjs --limit 10    # prova sui primi 10
 *   node scripts/genera-descrizioni-libri.mjs --resume      # riprende saltando i row_id già fatti
 *   node scripts/genera-descrizioni-libri.mjs --dry-run     # solo Google Books, niente Claude
 *
 * Opzioni env:
 *   MODEL            (default claude-sonnet-4-6; per max qualità "claude-opus-4-8")
 *   GOOGLE_BOOKS_KEY (facoltativa: evita il limite giornaliero di Google Books senza chiave)
 * Requisiti: Node 18+ (fetch nativo). Nessuna dipendenza npm.
 *
 * Nota: Google Books spesso NON ha sinossi per cataloghi di mostra e monografie di nicchia.
 * In quei casi la descrizione si basa sui soli metadati + conoscenza del modello, con la
 * regola "non inventare" e il flag confidenza=da_verificare nel report: rivedi quelle righe.
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'

const SHEET_ID = '1Ef7n23TnmRFfpdzp4D24v0kKDrBxGQnhUPI6CNOASU4'
const WORKER_URL = `https://cfg_googledata.it-e3f.workers.dev/?sheet=${SHEET_ID}&f=${process.env.CDID_KEY || ''}`
const MODEL = process.env.MODEL || 'claude-sonnet-4-6'
const API_KEY = process.env.ANTHROPIC_API_KEY

const args = process.argv.slice(2)
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity
const RESUME = args.includes('--resume')
const DRY = args.includes('--dry-run')

const OUT_TSV = new URL('./descrizioni.tsv', import.meta.url)
const OUT_REPORT = new URL('./report.csv', import.meta.url)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const dec = (s) => { try { return decodeURIComponent((s ?? '') + '') } catch { return (s ?? '') + '' } }
const oneLine = (s) => (s ?? '').replace(/\s+/g, ' ').trim()

const SYSTEM = `Sei un bibliotecario esperto d'arte. Scrivi una descrizione in italiano per una scheda di catalogo della biblioteca d'arte "Centro Documentazione Ivan Donatelli" (Spazio Genesi).
REGOLE FERREE:
- Usa SOLO i dati forniti (metadati + eventuale sinossi Google Books). NON inventare nomi propri, pseudonimi, date, biografie, luoghi o contenuti non presenti nelle fonti.
- Se i dati sono scarsi, descrivi il libro per ciò che è (saggio, monografia, catalogo di mostra, libro illustrato…), il tema e i concetti generali, senza attribuire fatti incerti.
- Tono da scheda di catalogo: sobrio, fattuale, ricco di concetti utili alla ricerca (movimenti artistici, tecniche, temi, soggetti, periodo).
- Un solo paragrafo, ~350–550 caratteri. Niente formule promozionali, niente prima persona, niente "questo libro"/"il volume in questione". Italiano corretto.
- Rispondi SOLO con la descrizione, senza preamboli.`

function buildUserPrompt(book, gb) {
  const lines = [
    'Dati del libro:',
    `Titolo: ${book.titolo || '—'}`,
    `Autore/curatore: ${book.autore || '—'}`,
    `Editore/anno: ${book.editore || '—'}`,
    `ISBN: ${book.isbn || '—'}`,
  ]
  if (gb.description) lines.push('', 'Sinossi da Google Books (fonte attendibile, può essere in altra lingua — traduci i concetti in italiano):', gb.description)
  if (gb.categories) lines.push('', `Categorie Google Books: ${gb.categories}`)
  if (!gb.description) lines.push('', '(Nessuna sinossi esterna disponibile: attieniti ai soli metadati, senza inventare.)')
  lines.push('', 'Scrivi la descrizione.')
  return lines.join('\n')
}

async function fetchJson(url, opts, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, opts)
      if (r.status === 429 || r.status >= 500) { await sleep(1500 * (i + 1)); continue }
      return { ok: r.ok, status: r.status, json: await r.json().catch(() => null) }
    } catch (e) { if (i === tries - 1) throw e; await sleep(1500 * (i + 1)) }
  }
  return { ok: false, status: 0, json: null }
}

const GB_KEY = process.env.GOOGLE_BOOKS_KEY ? `&key=${process.env.GOOGLE_BOOKS_KEY}` : ''

async function googleBooks(book) {
  const isbn = (book.isbn || '').replace(/[^0-9Xx]/g, '')
  const queries = []
  if (isbn.length >= 10) queries.push(`isbn:${isbn}`)
  if (book.titolo) queries.push(`intitle:${encodeURIComponent(book.titolo.split('/')[0].slice(0, 60))}`)
  for (const q of queries) {
    const { json } = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1${GB_KEY}`)
    const vi = json?.items?.[0]?.volumeInfo
    if (vi && (vi.description || vi.categories)) {
      return { description: vi.description ? oneLine(vi.description).slice(0, 1500) : '', categories: (vi.categories || []).join(', '), found: true }
    }
    await sleep(300)
  }
  return { description: '', categories: '', found: false }
}

async function generate(book, gb) {
  const { ok, status, json } = await fetchJson('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 500, system: SYSTEM, messages: [{ role: 'user', content: buildUserPrompt(book, gb) }] }),
  })
  if (!ok) throw new Error(`Anthropic ${status}: ${JSON.stringify(json)?.slice(0, 200)}`)
  return oneLine(json?.content?.[0]?.text || '')
}

async function main() {
  if (!DRY && !API_KEY) { console.error('ERRORE: imposta ANTHROPIC_API_KEY (env).'); process.exit(1) }

  const { json } = await fetchJson(WORKER_URL)
  const values = json?.values || []
  const rows = values.slice(1).filter((r) => ((r[1] || '') + '').toUpperCase() === 'TRUE')
  const get = (r) => ({ row_id: (r[0] ?? '') + '', visibile: r[1], autore: dec(r[2]), titolo: dec(r[3]), editore: dec(r[4]), isbn: dec(r[5]) })

  let done = new Set()
  if (RESUME && existsSync(OUT_TSV)) {
    for (const l of readFileSync(OUT_TSV, 'utf8').split('\n')) { const id = l.split('\t')[0]; if (id && id !== 'row_id') done.add(id) }
    console.log(`[resume] già fatti: ${done.size}`)
  } else {
    writeFileSync(OUT_TSV, 'row_id\tabstract\n')
    writeFileSync(OUT_REPORT, 'row_id\ttitolo\tconfidenza\tgooglebooks\n')
  }

  let n = 0
  for (const r of rows) {
    if (n >= LIMIT) break
    const b = get(r)
    if (done.has(b.row_id)) continue
    n++
    process.stdout.write(`(${n}) #${b.row_id} ${b.titolo.slice(0, 50)}… `)
    try {
      const gb = await googleBooks(b)
      const conf = gb.found ? 'alta' : 'da_verificare'
      if (DRY) { console.log(`[dry] gb=${gb.found}`); continue }
      const desc = await generate(b, gb)
      appendFileSync(OUT_TSV, `${b.row_id}\t${oneLine(desc)}\n`)
      appendFileSync(OUT_REPORT, `${b.row_id}\t${oneLine(b.titolo)}\t${conf}\t${gb.found}\n`)
      console.log(`ok [${conf}]`)
      await sleep(700) // gentile con le API
    } catch (e) {
      console.log(`ERRORE: ${e.message}`)
      appendFileSync(OUT_REPORT, `${b.row_id}\t${oneLine(b.titolo)}\tERRORE\t\n`)
      await sleep(1500)
    }
  }
  console.log(`\nFatto. Output: ${OUT_TSV.pathname} (incolla in colonna 'abstract' via VLOOKUP su row_id). Report: ${OUT_REPORT.pathname}`)
}

main()
