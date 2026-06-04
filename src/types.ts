export interface ImgEntry {
  img: string
  des: string
  deslunga: string
}

export interface Artista {
  cartella: string
  nome: string
  IG?: string
  social?: string
  email?: string
  portfolio?: string
  bio: string
  img: Array<Record<string, ImgEntry[]>>
}

export function flattenImmagini(img: Artista['img']): ImgEntry[] {
  return img.flatMap(gruppo => Object.values(gruppo).flat())
}

export function extractAbstract(bioHtml: string, maxLen = 160): string {
  const plain = bioHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (plain.length <= maxLen) return plain
  return plain.slice(0, maxLen).replace(/\s\S*$/, '') + '…'
}
