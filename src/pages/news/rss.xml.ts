import { getCollection } from 'astro:content'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET(context: { site?: URL }) {
  const site = (context.site?.href ?? 'https://spaziogenesi.org/').replace(/\/$/, '')
  const posts = (await getCollection('news', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  )

  const items = posts
    .map(
      (p) => `
    <item>
      <title>${esc(p.data.title)}</title>
      <link>${site}/news/${p.id}/</link>
      <guid isPermaLink="true">${site}/news/${p.id}/</guid>
      <pubDate>${p.data.pubDate.toUTCString()}</pubDate>
      <description>${esc(p.data.description)}</description>
    </item>`,
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Spazio Genesi ETS — News</title>
    <link>${site}/news/</link>
    <description>Notizie e tappe del progetto Spazio Genesi ETS.</description>
    <language>it-IT</language>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
