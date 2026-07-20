import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://spaziogenesi.org',

  output: 'static',

  integrations: [
    sitemap({
      // Escludi pagine non indicizzabili
      filter: (page) =>
        !page.includes('/mostre/') &&
        !page.includes('/newsletter/') &&
        !page.includes('/news/vincitrice-contest-logo-attestazioni/'),

      // Priorità e changefreq per tipo di pagina
      serialize(item) {
        // Home
        if (item.url === 'https://spaziogenesi.org/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' }
        }
        // Sezioni principali
        if (
          item.url.endsWith('/archivio/') ||
          item.url.endsWith('/attivita/')
        ) {
          return { ...item, priority: 0.9, changefreq: 'weekly' }
        }
        if (
          item.url.endsWith('/biografie/') ||
          item.url.endsWith('/grafo/') ||
          item.url.endsWith('/iscrizione/')
        ) {
          return { ...item, priority: 0.8, changefreq: 'monthly' }
        }
        // Pagine bio individuali
        if (item.url.includes('/biografie/')) {
          return { ...item, priority: 0.7, changefreq: 'monthly' }
        }
        // Centro documentazione
        if (item.url.includes('/centrodocumentazione')) {
          return { ...item, priority: 0.6, changefreq: 'monthly' }
        }
        // Altre pagine (chisiamo, ecc.)
        return { ...item, priority: 0.5, changefreq: 'monthly' }
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
})
