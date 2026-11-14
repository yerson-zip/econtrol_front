import { Bell, ChartColumn, LayoutDashboard, Package, PenLine, Settings, TrendingDown } from 'lucide-react'

const TODOS = ['operario', 'administrador', 'gerencia']

/** Menú lateral: cada ítem declara qué roles lo ven. */
export const NAV = [
  { to: '/panel', etiqueta: 'Panel', icono: LayoutDashboard, roles: ['administrador', 'gerencia'] },
  { to: '/consumos', etiqueta: 'Registrar consumo', etiquetaGerencia: 'Consumos', icono: PenLine, roles: TODOS },
  { to: '/inventario', etiqueta: 'Inventario', icono: Package, roles: TODOS },
  { to: '/alertas', etiqueta: 'Alertas', icono: Bell, roles: TODOS, contador: true },
  { to: '/perdidas', etiqueta: 'Pérdidas', icono: TrendingDown, roles: TODOS },
  { to: '/reportes', etiqueta: 'Reportes', icono: ChartColumn, roles: ['administrador', 'gerencia'] },
  { to: '/configuracion', etiqueta: 'Configuración', icono: Settings, roles: ['administrador'] },
]

export const inicioDe = (rol) => (rol === 'operario' ? '/consumos' : '/panel')
