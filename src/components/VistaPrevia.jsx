import { ArrowUpRight, TriangleAlert } from 'lucide-react'

// Consumo de energía (kWh) de mayo a octubre y promedio de los 5 meses anteriores a octubre
const DATOS = [4120, 4280, 4050, 4390, 4310, 5020]
const MESES = ['may', 'jun', 'jul', 'ago', 'sep', 'oct']
const PROMEDIO = 4230

const W = 420
const H = 150
const X0 = 12
const X1 = W - 12
const Y0 = 14
const Y1 = H - 30
const MIN = 3800
const MAX = 5250

const x = (i) => X0 + (i * (X1 - X0)) / (DATOS.length - 1)
const y = (v) => Y1 - ((v - MIN) / (MAX - MIN)) * (Y1 - Y0)

/** Curva suave (Catmull-Rom convertida a Bézier) que pasa por todos los puntos. */
function curva(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  return d
}

/** Ilustración del producto para la pantalla de acceso: una lectura típica del panel, con cifras de ejemplo. */
export function VistaPrevia() {
  const pts = DATOS.map((v, i) => [x(i), y(v)])
  const trazo = curva(pts)
  const ultimo = pts[pts.length - 1]

  return (
    <figure
      className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5"
      aria-label="Ejemplo de una lectura del panel: el consumo de energía de octubre supera el promedio"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-side-muted">Energía · octubre de 2026</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="num text-3xl font-semibold tracking-tight text-side-ink">5.020</span>
            <span className="text-sm text-side-muted">kWh</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/15 px-2.5 py-1 text-xs font-medium text-blue-300">
          <ArrowUpRight className="size-3" aria-hidden="true" />
          +16,5 %
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="presentation">
        <defs>
          <linearGradient id="vp-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--blue-400)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--blue-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={X0} x2={X1} y1={y(PROMEDIO)} y2={y(PROMEDIO)} stroke="#aaaaaa" strokeOpacity="0.55" strokeDasharray="4 5" />
        <text x={X1} y={y(PROMEDIO) + 14} textAnchor="end" fontSize="10" fill="#aaaaaa">
          promedio
        </text>
        <path d={`${trazo} L${X1},${Y1} L${X0},${Y1} Z`} fill="url(#vp-area)" />
        <path d={trazo} fill="none" stroke="var(--blue-400)" strokeWidth="2.5" strokeLinecap="round" />
        {pts.slice(0, -1).map(([cx, cy], i) => (
          <circle key={MESES[i]} cx={cx} cy={cy} r="3" fill="var(--side)" stroke="var(--blue-400)" strokeWidth="2" />
        ))}
        <circle cx={ultimo[0]} cy={ultimo[1]} r="9" fill="var(--blue-400)" fillOpacity="0.25" />
        <circle cx={ultimo[0]} cy={ultimo[1]} r="4.5" fill="var(--blue-300)" stroke="var(--side)" strokeWidth="2" />
        {MESES.map((m, i) => (
          <text key={m} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === MESES.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#aaaaaa">
            {m}
          </text>
        ))}
      </svg>

      <figcaption className="mt-4 flex items-start gap-3 rounded-xl bg-white/[0.05] p-3.5">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-blue-300" aria-hidden="true" />
        <p className="text-[13px] leading-snug text-side-ink">
          Consumo por encima del promedio. Costo adicional estimado:{' '}
          <span className="num font-medium">$ 674.500</span>
        </p>
      </figcaption>
    </figure>
  )
}
