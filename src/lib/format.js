const LOCALE = 'es-CO'

/** Número con formato es-CO (punto para miles, coma para decimales). */
export const num = (v, decimales = 0) =>
  v == null || Number.isNaN(v)
    ? '—'
    : Number(v).toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: decimales })

export const cop = (v) =>
  v == null ? '—' : Number(v).toLocaleString(LOCALE, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

/** Porcentaje; con `signo` antepone + a los positivos. */
export const pct = (v, { decimales = 1, signo = false } = {}) => {
  if (v == null || Number.isNaN(v)) return '—'
  const s = Number(v).toLocaleString(LOCALE, { maximumFractionDigits: decimales })
  return `${signo && v > 0 ? '+' : ''}${s} %`
}

/** "2026-10" → "octubre de 2026" */
export const mesLargo = (mes) =>
  mes ? new Date(`${mes}-01T00:00:00Z`).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''

/** "2026-10" → "oct" */
export const mesCorto = (mes) =>
  new Date(`${mes}-01T00:00:00Z`).toLocaleDateString(LOCALE, { month: 'short', timeZone: 'UTC' }).replace('.', '')

/** "2026-10-08" → "8 oct 2026" */
export const fechaCorta = (f) =>
  f
    ? new Date(f.length === 10 ? `${f}T00:00:00Z` : f).toLocaleDateString(LOCALE, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: f.length === 10 ? 'UTC' : undefined,
      }).replace(/\./g, '')
    : ''

/** Fecha de hoy en formato AAAA-MM-DD según la zona horaria local. */
export const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const mesAnterior = (mes) => {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export const ROLES = { operario: 'Operario', administrador: 'Administrador', gerencia: 'Gerencia' }
