const BASE = import.meta.env.VITE_API_URL ?? ''

let accessToken = null
let onSesionPerdida = () => {}

export const setAccessToken = (t) => {
  accessToken = t
}
export const alPerderSesion = (fn) => {
  onSesionPerdida = fn
}

export class ApiError extends Error {
  constructor(status, message, detalles) {
    super(message)
    this.status = status
    this.detalles = detalles
  }
}

// El refresh token rota en cada uso: si dos peticiones lo piden a la vez, solo una debe llegar al servidor
let refrescando = null
export function refrescarSesion() {
  refrescando ??= fetch(`${BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (r) => {
      const datos = await r.json().catch(() => ({}))
      if (!r.ok) throw new ApiError(r.status, datos.error ?? 'Sesión expirada')
      accessToken = datos.accessToken
      return datos
    })
    .finally(() => {
      refrescando = null
    })
  return refrescando
}

function url(path, params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null && v !== '') q.set(k, v)
  const s = q.toString()
  return `${BASE}/api${path}${s ? `?${s}` : ''}`
}

async function peticion(path, { method = 'GET', body, params, blob } = {}, reintentar = true) {
  const r = await fetch(url(path, params), {
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (r.status === 401 && reintentar && !path.startsWith('/auth/')) {
    try {
      await refrescarSesion()
    } catch {
      accessToken = null
      onSesionPerdida()
      throw new ApiError(401, 'Tu sesión expiró. Inicia sesión de nuevo.')
    }
    return peticion(path, { method, body, params, blob }, false)
  }

  if (!r.ok) {
    const datos = await r.json().catch(() => ({}))
    throw new ApiError(r.status, datos.error ?? 'Ocurrió un error inesperado', datos.detalles)
  }
  if (blob) return r.blob()
  return r.status === 204 ? null : r.json()
}

export const api = {
  get: (path, params) => peticion(path, { params }),
  post: (path, body) => peticion(path, { method: 'POST', body: body ?? {} }),
  patch: (path, body) => peticion(path, { method: 'PATCH', body }),
  delete: (path) => peticion(path, { method: 'DELETE' }),
  /** Descarga un archivo autenticado (PDF, Excel) y dispara el guardado en el navegador. */
  async descargar(path, params, nombre) {
    const archivo = await peticion(path, { params, blob: true })
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(archivo)
    enlace.download = nombre
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  },
}

/** Mensaje legible para mostrar en pantalla a partir de cualquier error. */
export function mensajeDe(error) {
  if (error instanceof ApiError && error.status === 400 && error.detalles?.length)
    return `${error.message}: ${error.detalles.map((d) => d.message).join('; ')}`
  return error?.message ?? 'Ocurrió un error inesperado'
}
