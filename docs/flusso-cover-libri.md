# Flusso copertine libri — Centro Documentazione (CD_libri → AppSheet → n8n → SIRV)

> Ricostruzione del flusso n8n che popola la colonna **cdn** delle copertine.
> **Fonte autorevole ritrovata**: export n8n `SGLIBRI_nuova_copertina (1).json`
> (in `Downloads`, versione `active:true`, 10 nodi). Le copie `(2)`/`(3)` (149 KB)
> sono lo stesso flusso con dati di esecuzione pinnati; il file a 4 nodi/Cloudinary
> è un **esperimento più vecchio da ignorare**.
>
> ⚠️ **Sicurezza**: l'export `(1)` contiene il **clientSecret SIRV in chiaro** nel nodo
> `sirvauth`. Trattare i `.json` in Downloads come segreti (vedi § Credenziali).

## In una riga

Google Sheets Trigger su CD_libri → per ogni riga modificata recupera l'immagine da
Google Drive (per `nomefile`) → la fa ingerire a SIRV (`/v2/files/fetch`) → riscrive in
colonna **cdn** l'URL SIRV con profilo di resize, sulla riga giusta (match per `row_id`).

## Identificativi reali

- **Google Sheet CD_libri (produzione)**: `1Ef7n23TnmRFfpdzp4D24v0kKDrBxGQnhUPI6CNOASU4`,
  foglio **"Disponibili"** (`gid=0`). È quello letto dal sito.
  - ⚠️ Nei campi `cachedResultUrl` di alcuni nodi compare anche
    `1EQVcQppdP3oRjcnz3y6QfrBCbP5wcvq56VZdl1PA6tQ` ("Copia di CD_libri"): è un
    **residuo cosmetico** di una bozza precedente. Conta il `value` del `documentId`,
    che punta alla produzione `1Ef7n23…`. La copia NON è usata dal flusso completo.
- **SIRV**: account `spaziogenesi.sirv.com`, profilo di trasformazione **`SGthumb`**.
- **Istanza n8n**: Azure `n8nnotlast-…northeurope-01.azurewebsites.net:5678`.
- **Workflow id**: `EOkD3VY5q5avisBc` · instanceId `2e517f4a…56155`.

## Colonne reali di CD_libri (dallo schema del nodo Google Sheets)

`row_id`, `autore`, `titolo`, `editore`, `isbn`, `google books`, **`cover`**,
**`copertina`**, **`nomefile`**, **`cdn`**, `row_number`.

- `copertina` e `cover` sono due colonne distinte; `nomefile` = solo nome file (no path);
  `cdn` = URL SIRV finale (quella renderizzata dal sito); `row_id` = chiave riga n8n.
- ⚠️ Lo schema nel nodo può essere **datato** rispetto al foglio reale (il sito legge
  anche `visibile` ed estratti che qui non compaiono). Verificare le intestazioni live.

## Nodi e cablaggio (ordine reale di esecuzione)

1. **Google Sheets Trigger** (`googleSheetsTrigger`) — doc `1Ef7n23…`, foglio gid=0,
   evento **`rowUpdate`**, **colonne osservate: `copertina`, `editore`**, polling **ogni
   5 minuti**. Cred: *Google Sheets Trigger account* (OAuth2). → **Loop Over Items**.
   - Nota: la bozza vecchia osservava `nomefile`; la versione attiva osserva
     `copertina`+`editore`.
2. **Loop Over Items** (`splitInBatches`) — ramo "loop" (output 1) → **Edit Fields1**;
   ramo "done" (output 0) vuoto.
3. **Edit Fields1** (`set`) — `AGGIORNATO = {{ $json.row_id }}` (memorizza il row_id
   della riga scatenante). → **Google Drive**.
4. **Google Drive** (`googleDrive`, fileFolder/search) — `queryString =
   {{ $('Loop Over Items').item.json.nomefile }}`: trova il file Drive per **nomefile**,
   restituisce tutti i campi (incl. `webViewLink`, `webContentLink`, `originalFilename`).
   Cred: *Google Drive account*. → **Google Drive1**.
5. **Google Drive1** (`googleDrive`, download) — `fileId = {{ $json.webViewLink }}`
   (mode url): scarica il binario. → **Code**.
6. **Code** (`code`) — forza `mimeType = image/jpeg` sul binario, riespone `binary.data`.
   → **sirvauth**.
7. **sirvauth** (`httpRequest` POST `https://api.sirv.com/v2/token`) — body
   `clientId` + `clientSecret` (⚠️ **in chiaro nel file**) → ritorna un bearer token
   (`fullResponse`). → **Edit Fields**.
8. **Edit Fields** (`set`) — `bearertoken = {{ $json.body.token }}`. → **HTTP Request2**.
9. **HTTP Request2** (`httpRequest` POST `https://api.sirv.com/v2/files/fetch`) — header
   `Content-Type: application/json`, auth `httpHeaderAuth` (cred *sirv bearer*); body:
   - `url = {{ $('Google Drive1').item.json.webContentLink }}` (SIRV scarica l'immagine
     **direttamente dal link Drive**, server-side),
   - `filename = "/" + $("Code").item.binary.data.fileName` (path su SIRV).
   → **Google Sheets**.
10. **Google Sheets** (`googleSheets`, **update**) — doc `1Ef7n23…`, foglio gid=0,
    match su **`row_id`**, scrive:
    - `row_id = {{ $('Edit Fields1').item.json.AGGIORNATO }}`
    - **`cdn` = `https://spaziogenesi.sirv.com/` + `$('Google Drive1').item.json.originalFilename` + `?profile=SGthumb`**
    Cred: *Google Sheets account*. → torna a **Loop Over Items** (prossima riga).

### Diagramma
```
Trigger(rowUpdate copertina/editore) → Loop → Edit Fields1(row_id)
  → GDrive(search by nomefile) → GDrive1(download) → Code(mime)
  → sirvauth(token) → Edit Fields(bearer) → HTTP Request2(SIRV fetch da Drive)
  → Google Sheets(update cdn, match row_id) → Loop(next)
```

## Forma dell'URL CDN scritto nel foglio

`https://spaziogenesi.sirv.com/<originalFilename>?profile=SGthumb`

- `<originalFilename>` = nome file originale Drive (≈ `nomefile`).
- `?profile=SGthumb` = profilo di resize/ottimizzazione lato SIRV.
- Il sito fa `split('?')[0]` su questo URL per il lightbox (apre l'originale senza il
  profilo thumb). Coerente.

## Credenziali (dove cercarle)

> L'export n8n **non contiene i valori** delle credenziali OAuth: solo i loro **ID**.
> I valori veri stanno **dentro l'istanza n8n** (DB cifrato su Azure).

| Credenziale (nome n8n) | Tipo | Dove sta il valore |
|---|---|---|
| Google Sheets Trigger account | OAuth2 | nell'istanza n8n; per ricrearla: OAuth client su Google Cloud Console + riconnessione |
| Google Drive account | OAuth2 | idem |
| Google Sheets account | OAuth2 | idem |
| SIRV API (`oAuth2Api`) | clientId+clientSecret | **in chiaro nel nodo `sirvauth`** del JSON; fonte ufficiale: console SIRV → Account → Settings → API |
| sirv bearer (`httpHeaderAuth`) | bearer | derivato a runtime dal token SIRV (non è un segreto persistente) |
| cloudinary SG | httpBasicAuth | solo nella bozza vecchia (Cloudinary console) — non serve al flusso SIRV |

**Per la ricostruzione servono dunque:**
1. Le **3 credenziali OAuth Google** (Sheets Trigger, Drive, Sheets) — o riprese
   dall'istanza Azure se ancora viva, o ricreate via Google Cloud Console (OAuth client
   con scope Sheets + Drive) e riconnesse in n8n.
2. Il **clientId/clientSecret SIRV** — già nel JSON `sirvauth`, oppure dalla console SIRV.

## Pre-requisiti / dettagli non ovvi per farlo funzionare

- L'immagine su Drive deve essere **accessibile via `webContentLink`** perché SIRV la
  scarica server-side (`/v2/files/fetch`). Se i file AppSheet sono privati, SIRV non
  riesce a fetcharli → verificare condivisione/permessi della cartella Drive di AppSheet.
- Il trigger è in **polling ogni 5 min** (non istantaneo): latenza fino a 5 minuti tra
  caricamento e comparsa della copertina.
- Il match di aggiornamento è su **`row_id`**: se cambia lo schema/ordine colonne del
  foglio, verificare che `row_id` resti la chiave.
- Dopo l'update il flusso scrive su `cdn` ma **non tocca `cover`/`copertina`**: il sito
  renderizza **solo `cdn`**.

## Azioni consigliate

- [ ] **Mettere in sicurezza** i `.json` in Downloads (contengono il clientSecret SIRV):
      spostarli in un caveau, oppure **ruotare** le credenziali SIRV e ripulire i file.
      Sono duplicati su due profili utente (`masca` e `max`).
- [ ] Reimportare `SGLIBRI_nuova_copertina (1).json` nell'istanza n8n e riconnettere le
      3 credenziali Google + SIRV.
- [ ] Verificare che il trigger punti a `1Ef7n23…` (produzione) e non alla "Copia".
- [ ] Confermare i permessi di condivisione Drive per il fetch SIRV.
