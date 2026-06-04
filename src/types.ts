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
