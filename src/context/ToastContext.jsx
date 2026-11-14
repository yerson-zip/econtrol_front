import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CircleCheck, Info, OctagonAlert, X } from 'lucide-react'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

const ESTILOS = {
  ok: { icono: CircleCheck, color: 'text-ok' },
  error: { icono: OctagonAlert, color: 'text-crit' },
  info: { icono: Info, color: 'text-brand' },
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const quitar = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const mostrar = useCallback(
    (tipo, texto) => {
      const id = crypto.randomUUID()
      setItems((l) => [...l, { id, tipo, texto }])
      setTimeout(() => quitar(id), 5000)
    },
    [quitar],
  )

  const api = useMemo(
    () => ({
      ok: (t) => mostrar('ok', t),
      error: (t) => mostrar('error', t),
      info: (t) => mostrar('info', t),
    }),
    [mostrar],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {items.map((t) => {
          const { icono: Icono, color } = ESTILOS[t.tipo]
          return (
            <div
              key={t.id}
              role="status"
              className="rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-float"
            >
              <Icono className={`mt-0.5 size-5 shrink-0 ${color}`} aria-hidden="true" />
              <p className="flex-1 text-sm text-ink">{t.texto}</p>
              <button
                type="button"
                onClick={() => quitar(t.id)}
                className="rounded-md p-0.5 text-faint hover:text-ink"
                aria-label="Cerrar aviso"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
