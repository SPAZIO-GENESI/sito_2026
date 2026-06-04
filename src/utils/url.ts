const _base = import.meta.env.BASE_URL.replace(/\/$/, '')

export function u(path: string): string {
  const p = path.startsWith('/') ? path : '/' + path
  return _base + p
}
