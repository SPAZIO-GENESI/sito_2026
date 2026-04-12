# sito_2026

Copia statica del sito di staging [Spazio Genesi su B12](https://spazio-genesi-staging.b12sites.com/), acquisita il 12 aprile 2026 con `wget` (pagine HTML, CSS in `_astro/`, immagini in `assets/media/`). I collegamenti interni sono stati adattati per funzionare da file locali; le immagini del CDN B12 sono state scaricate nel repository.

Per anteprima locale dalla radice del repo:

```bash
python3 -m http.server 8080
```

Poi apri `http://127.0.0.1:8080/`.

**Nota:** le pagine includono ancora script di terze parti (B12, Google reCAPTCHA, ecc.) presenti nell’HTML originale. Il layout e i contenuti principali funzionano offline; funzioni legate a moduli o analytics possono richiedere rete.
