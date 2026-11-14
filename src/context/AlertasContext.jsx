import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AlertasContext = createContext({ abiertas: 0, refrescar: () => {} })
export const useAlertasAbiertas = () => useContext(AlertasContext)

/** Mantiene el contador de alertas abiertas del menú lateral; cualquier pantalla puede pedir refrescarlo. */
export function AlertasProvider({ children }) {
  const [abiertas, setAbiertas] = useState(0)

  const refrescar = useCallback(() => {
    api.get('/alertas/resumen').then((d) => setAbiertas(d.abiertas)).catch(() => {})
  }, [])

  useEffect(() => {
    refrescar()
    const t = setInterval(refrescar, 60_000)
    return () => clearInterval(t)
  }, [refrescar])

  const valor = useMemo(() => ({ abiertas, refrescar }), [abiertas, refrescar])
  return <AlertasContext.Provider value={valor}>{children}</AlertasContext.Provider>
}
