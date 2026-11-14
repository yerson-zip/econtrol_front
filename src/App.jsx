import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { inicioDe, NAV } from './lib/nav'
import { Cargando } from './components/ui'
import Layout from './components/Layout'
import Login from './pages/Login'
import Panel from './pages/Panel'
import Consumos from './pages/Consumos'
import Inventario from './pages/Inventario'
import Alertas from './pages/Alertas'
import Perdidas from './pages/Perdidas'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'

const PAGINAS = {
  '/panel': Panel,
  '/consumos': Consumos,
  '/inventario': Inventario,
  '/alertas': Alertas,
  '/perdidas': Perdidas,
  '/reportes': Reportes,
  '/configuracion': Configuracion,
}

function Protegida({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Cargando texto="Cargando EcoControl" />
  return usuario ? children : <Navigate to="/login" replace />
}

function Inicio() {
  const { usuario } = useAuth()
  return <Navigate to={inicioDe(usuario.rol)} replace />
}

export default function App() {
  const { usuario, cargando } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={cargando ? <Cargando /> : usuario ? <Navigate to={inicioDe(usuario.rol)} replace /> : <Login />}
      />
      <Route
        element={
          <Protegida>
            <Layout />
          </Protegida>
        }
      >
        <Route index element={<Inicio />} />
        {NAV.map(({ to, roles }) => {
          const Pagina = PAGINAS[to]
          return (
            <Route
              key={to}
              path={to}
              element={usuario && !roles.includes(usuario.rol) ? <Navigate to={inicioDe(usuario.rol)} replace /> : <Pagina />}
            />
          )
        })}
        <Route path="*" element={<Inicio />} />
      </Route>
    </Routes>
  )
}
