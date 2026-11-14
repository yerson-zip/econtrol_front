import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const CLAVE = 'ecocontrol-tema'

const guardado = () => {
  try {
    const t = localStorage.getItem(CLAVE)
    return t === 'claro' || t === 'oscuro' ? t : null
  } catch {
    return null
  }
}

const delSistema = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro')

const aplicar = (tema) => {
  document.documentElement.dataset.tema = tema
}

export function iniciarTema() {
  aplicar(guardado() ?? delSistema())
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!guardado()) aplicar(delSistema())
  })
}

export function useTemaActual() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema ?? delSistema())
  useEffect(() => {
    const obs = new MutationObserver(() => setTema(document.documentElement.dataset.tema))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
    return () => obs.disconnect()
  }, [])
  return tema
}

export function BotonTema({ className = '' }) {
  const tema = useTemaActual()
  const siguiente = tema === 'oscuro' ? 'claro' : 'oscuro'
  const Icono = tema === 'oscuro' ? Sun : Moon

  function alternar() {
    try {
      localStorage.setItem(CLAVE, siguiente)
    } catch {
      aplicar(siguiente)
    }
    aplicar(siguiente)
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className={`rounded-lg p-2 transition-colors ${className}`}
      aria-label={`Cambiar a modo ${siguiente}`}
      title={`Modo ${siguiente}`}
    >
      <Icono className="size-[18px]" aria-hidden="true" />
    </button>
  )
}
