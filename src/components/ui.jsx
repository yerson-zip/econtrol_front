import { useEffect, useId, useRef } from 'react'
import { ChevronDown, LoaderCircle, X } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

/* ───────── Botón ───────── */
const VARIANTES = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover shadow-soft',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas shadow-soft',
  ghost: 'text-muted hover:bg-canvas hover:text-ink',
  danger: 'bg-crit-solid text-white hover:opacity-90 shadow-soft',
}
const TAMANOS = { md: 'h-10 px-4 text-sm', sm: 'h-8 px-3 text-[13px]' }

export function Button({ variante = 'primary', tam = 'md', cargando, icono: Icono, children, className, ...props }) {
  return (
    <button
      type="button"
      disabled={cargando || props.disabled}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        TAMANOS[tam],
        className,
      )}
      {...props}
    >
      {cargando ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        Icono && <Icono className="size-4" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}

/* ───────── Contenedores ───────── */
export function Card({ className, children, ...props }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-surface shadow-soft', className)} {...props}>
      {children}
    </section>
  )
}

export function CardHeader({ titulo, descripcion, acciones, icono: Icono }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icono && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <Icono className="size-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-[13px] text-muted">{descripcion}</p>}
        </div>
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </header>
  )
}

export function PageHeader({ titulo, descripcion, acciones }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-2xl text-sm text-muted">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  )
}

/* ───────── Estados ───────── */
const TONOS = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  crit: 'bg-crit-soft text-crit',
  brand: 'bg-brand-soft text-brand',
  neutral: 'bg-canvas text-muted',
}

/** El estado siempre lleva texto, no solo color. */
export function Badge({ tono = 'neutral', icono: Icono, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', TONOS[tono])}>
      {Icono && <Icono className="size-3" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function Aviso({ tono = 'warn', icono: Icono, titulo, children }) {
  return (
    <div role="alert" className={cx('flex items-start gap-3 rounded-xl p-4 text-sm', TONOS[tono])}>
      {Icono && <Icono className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
      <div>
        {titulo && <p className="font-semibold">{titulo}</p>}
        <div className={titulo ? 'mt-0.5 opacity-90' : ''}>{children}</div>
      </div>
    </div>
  )
}

export function Cargando({ texto = 'Cargando' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function Vacio({ icono: Icono, titulo, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icono && (
        <span className="mb-3 grid size-11 place-items-center rounded-full bg-canvas text-faint">
          <Icono className="size-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-sm font-medium text-ink">{titulo}</p>
      {children && <p className="mt-1 max-w-sm text-[13px] text-muted">{children}</p>}
    </div>
  )
}

export function ErrorCarga({ error, reintentar }) {
  return (
    <div className="p-6">
      <Aviso tono="crit" titulo="No se pudo cargar la información">
        {error?.message}
        {reintentar && (
          <button type="button" onClick={reintentar} className="ml-2 font-medium underline underline-offset-2">
            Reintentar
          </button>
        )}
      </Aviso>
    </div>
  )
}

/* ───────── Formularios ───────── */
export function Field({ label, hint, error, children, className }) {
  const id = useId()
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs text-crit">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

const CONTROL =
  'h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none disabled:opacity-60'

export function Input({ className, ...props }) {
  return <input className={cx(CONTROL, className)} {...props} />
}
export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select className={cx(CONTROL, 'appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-faint"
        aria-hidden="true"
      />
    </div>
  )
}
export function Textarea({ className, ...props }) {
  return <textarea className={cx(CONTROL, 'h-auto min-h-20 py-2', className)} {...props} />
}

export function Segmentado({ opciones, valor, onChange, etiqueta, completo, fondo = 'bg-canvas' }) {
  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className={cx('gap-0.5 rounded-xl p-1', fondo, completo ? 'grid w-full' : 'inline-flex')}
      style={completo ? { gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` } : undefined}
    >
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="tab"
          aria-selected={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={cx(
            'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors',
            valor === o.valor ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink',
          )}
        >
          {o.icono && <o.icono className="size-3.5" aria-hidden="true" />}
          {o.etiqueta}
          {o.contador != null && o.contador > 0 && (
            <span className="rounded-full bg-brand px-1.5 text-[11px] leading-4 text-on-brand">{o.contador}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ───────── Modal (usa <dialog>: foco atrapado y Esc de serie) ───────── */
export function Modal({ abierto, onCerrar, titulo, descripcion, children, ancho = 'max-w-lg' }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  if (!abierto) return null
  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className={cx(
        'rise m-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-black/40 backdrop:backdrop-blur-sm',
        ancho,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <h2 className="text-lg font-semibold">{titulo}</h2>
          {descripcion && <p className="mt-1 text-sm text-muted">{descripcion}</p>}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-lg p-1.5 text-faint transition-colors hover:bg-canvas hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="px-6 pt-5 pb-6">{children}</div>
    </dialog>
  )
}

/* ───────── Tabla ───────── */
export function Tabla({ children, className }) {
  return (
    <div className={cx('overflow-x-auto', className)}>
      <table className="w-full min-w-[560px] border-collapse text-sm">{children}</table>
    </div>
  )
}
export function Th({ derecha, children, className }) {
  return (
    <th
      scope="col"
      className={cx(
        'border-b border-line px-5 py-2.5 text-xs font-medium tracking-wide text-muted uppercase first:sm:pl-6 last:sm:pr-6',
        derecha ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}
export function Td({ derecha, num, children, className, ...props }) {
  return (
    <td
      className={cx(
        'border-b border-line/70 px-5 py-3 align-middle first:sm:pl-6 last:sm:pr-6',
        derecha && 'text-right',
        num && 'num text-right',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}
