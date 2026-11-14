import { NavLink, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AlertasProvider, useAlertasAbiertas } from '../context/AlertasContext'
import { NAV } from '../lib/nav'
import { ROLES } from '../lib/format'
import { Logo } from './Logo'

function Avatar({ usuario }) {
  const iniciales = usuario.nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return usuario.foto ? (
    <img src={usuario.foto} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full object-cover" />
  ) : (
    <span className="grid size-9 place-items-center rounded-full bg-brand text-xs font-semibold text-on-brand">
      {iniciales}
    </span>
  )
}

function Contador({ n }) {
  if (!n) return null
  return (
    <span
      className="ml-auto min-w-5 rounded-full bg-crit-solid px-1.5 text-center text-[11px] leading-5 font-semibold text-white"
      aria-label={`${n} alertas abiertas`}
    >
      {n}
    </span>
  )
}

export default function Layout() {
  return (
    <AlertasProvider>
      <Estructura />
    </AlertasProvider>
  )
}

function Estructura() {
  const { usuario, logout } = useAuth()
  const { abiertas } = useAlertasAbiertas()
  const items = NAV.filter((i) => i.roles.includes(usuario.rol)).map((i) => ({
    ...i,
    etiqueta: usuario.rol === 'gerencia' && i.etiquetaGerencia ? i.etiquetaGerencia : i.etiqueta,
  }))

  return (
    <div className="min-h-screen">
      {/* Escritorio: barra lateral oscura */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-side px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo oscuro />
        </div>
        <nav aria-label="Principal" className="mt-8 flex flex-1 flex-col gap-1">
          {items.map(({ to, etiqueta, icono: Icono, contador }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand text-white' : 'text-side-muted hover:bg-side-hover hover:text-side-ink'
                }`
              }
            >
              <Icono className="size-[18px]" aria-hidden="true" />
              {etiqueta}
              {contador && <Contador n={abiertas} />}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-xl bg-side-hover p-3">
          <Avatar usuario={usuario} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-side-ink">{usuario.nombre}</p>
            <p className="text-xs text-side-muted">{ROLES[usuario.rol]}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-2 text-side-muted transition-colors hover:bg-side-hover hover:text-side-ink"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Celular: barra superior y menú horizontal */}
      <header className="sticky top-0 z-30 bg-side lg:hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <Logo oscuro />
          <div className="flex items-center gap-2">
            <Avatar usuario={usuario} />
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-side-muted hover:text-side-ink"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav aria-label="Principal" className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none]">
          {items.map(({ to, etiqueta, icono: Icono, contador }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-brand text-white' : 'text-side-muted hover:text-side-ink'
                }`
              }
            >
              <Icono className="size-4" aria-hidden="true" />
              {etiqueta}
              {contador && abiertas > 0 && (
                <span className="rounded-full bg-crit-solid px-1.5 text-[11px] leading-4 text-white">{abiertas}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
