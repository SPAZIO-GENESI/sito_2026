const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = '/pagefind/pagefind-ui.css'
document.head.appendChild(link)

const script = document.createElement('script')
script.src = '/pagefind/pagefind-ui.js'
script.onload = () => {
  new window.PagefindUI({
    element: '#search',
    showImages: false,
    translations: {
      placeholder: 'Cerca nel sito…',
      zero_results: 'Nessun risultato per "[SEARCH_TERM]"',
      many_results: '[COUNT] risultati per "[SEARCH_TERM]"',
      one_result: '1 risultato per "[SEARCH_TERM]"',
      alt_search: 'Nessun risultato per "[SEARCH_TERM]". Mostrando risultati per "[DIFFERENT_TERM]"',
      search_suggestion: 'Nessun risultato per "[SEARCH_TERM]". Prova con una di queste ricerche:',
      searching: 'Ricerca in corso…',
    }
  })
}
document.body.appendChild(script)
