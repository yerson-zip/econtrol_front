import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Badge } from './ui'

/** Lectura de una variación: más de 10 % "Revisar", más de 3 % "Vigilar", si no "Normal". */
export const tonoVariacion = (v) => (v == null ? 'neutral' : v > 10 ? 'crit' : v > 3 ? 'warn' : 'ok')

export function Variacion({ valor, sufijo = '%', texto }) {
  if (valor == null) return <span className="text-xs text-muted">Sin mes anterior para comparar</span>
  const Icono = valor > 0.05 ? ArrowUpRight : valor < -0.05 ? ArrowDownRight : Minus
  const s = `${valor > 0 ? '+' : ''}${valor.toLocaleString('es-CO', { maximumFractionDigits: 1 })} ${sufijo}`
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge tono={tonoVariacion(valor)} icono={Icono}>
        {s}
      </Badge>
      {texto && <span className="text-xs text-muted">{texto}</span>}
    </span>
  )
}

export function KpiCard({ icono: Icono, color, etiqueta, valor, unidad, pie }) {
  return (
    <article className="rise rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-8 place-items-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
        >
          <Icono className="size-4" aria-hidden="true" />
        </span>
        <h3 className="text-[13px] font-medium text-muted">{etiqueta}</h3>
      </div>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="num text-[28px] leading-none font-semibold tracking-tight">{valor}</span>
        {unidad && <span className="text-sm text-muted">{unidad}</span>}
      </p>
      <div className="mt-3 min-h-6">{pie}</div>
    </article>
  )
}
