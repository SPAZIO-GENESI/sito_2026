import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://spazio-genesi.github.io',
  base: '/sito_2026',
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  }
})
