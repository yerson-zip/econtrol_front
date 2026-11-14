import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { alPerderSesion, api, refrescarSesion, setAccessToken } from '../lib/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Al abrir la app se intenta recuperar la sesión con la cookie del refresh token
  useEffect(() => {
    alPerderSesion(() => setUsuario(null))
    refrescarSesion()
      .then((d) => setUsuario(d.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false))
  }, [])

  const abrirSesion = useCallback((datos) => {
    setAccessToken(datos.accessToken)
    setUsuario(datos.usuario)
  }, [])

  const login = useCallback(async (idToken) => abrirSesion(await api.post('/auth/google', { idToken })), [abrirSesion])
  const registrar = useCallback(
    async (datos) => abrirSesion(await api.post('/auth/registro', datos)),
    [abrirSesion],
  )
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUsuario(null)
    }
  }, [])

  const valor = useMemo(
    () => ({ usuario, cargando, login, registrar, logout }),
    [usuario, cargando, login, registrar, logout],
  )
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
