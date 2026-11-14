import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Carga datos al montar y cada vez que cambian `deps`.
 * Devuelve { datos, cargando, error, recargar }. `recargar` no vuelve a mostrar el estado de carga inicial.
 */
export function useDatos(cargar, deps = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null })
  const cargarRef = useRef(cargar)
  cargarRef.current = cargar
  const version = useRef(0)

  const ejecutar = useCallback((silencioso) => {
    const mia = ++version.current
    if (!silencioso) setEstado((e) => ({ ...e, cargando: true, error: null }))
    return cargarRef.current().then(
      (datos) => mia === version.current && setEstado({ datos, cargando: false, error: null }),
      (error) => mia === version.current && setEstado((e) => ({ ...e, cargando: false, error })),
    )
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void ejecutar(false), [ejecutar, ...deps])

  return { ...estado, recargar: () => ejecutar(true) }
}
