import { useEffect, useState } from 'react'
import {
  BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { mesCorto, num, cop } from '../lib/format'

ChartJS.register(BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip)

const VARS = ['ink', 'muted', 'faint', 'line', 'brand', 'surface', 'agua', 'energia', 'materiales']

const leerTema = () => {
  const css = getComputedStyle(document.documentElement)
  return Object.fromEntries(VARS.map((v) => [v, css.getPropertyValue(`--${v}`).trim()]))
}

/** Colores del tema actual; se actualiza al cambiar entre claro y oscuro. */
export function useTema() {
  const [tema, setTema] = useState(leerTema)
  useEffect(() => {
    const obs = new MutationObserver(() => setTema(leerTema()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
    return () => obs.disconnect()
  }, [])
  return tema
}

/** Cada recurso usa un tono distinto de la escala azul; cualquier otro recurso usa el tono de materiales. */
export const colorRecurso = (nombre, tema) => {
  const n = nombre.toLowerCase()
  return n.includes('agua') ? tema.agua : n.includes('energ') ? tema.energia : tema.materiales
}

const base = (tema) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  layout: { padding: { top: 10, right: 6 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: tema.surface,
      titleColor: tema.ink,
      bodyColor: tema.muted,
      borderColor: tema.line,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
      boxPadding: 4,
    },
  },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: tema.muted, font: { family: 'Public Sans' } } },
    y: {
      beginAtZero: false,
      grace: '10%',
      grid: { color: tema.line },
      border: { display: false },
      ticks: { color: tema.muted, font: { family: 'IBM Plex Mono', size: 11 }, callback: (v) => num(v) },
    },
  },
})

/** Consumo mensual de un recurso con su línea de promedio. */
export function GraficoConsumo({ serie, color, llenar = false }) {
  const tema = useTema()
  const etiquetas = serie.puntos.map((p) => mesCorto(p.mes))
  const opciones = base(tema)
  opciones.plugins.tooltip.callbacks = {
    label: (c) => ` ${c.dataset.label}: ${num(c.parsed.y, 1)} ${serie.unidad}`,
  }
  return (
    <div className={llenar ? 'absolute inset-0' : 'h-64 sm:h-72'} role="img" aria-label={`Consumo mensual de ${serie.nombre}`}>
      <Line
        options={opciones}
        data={{
          labels: etiquetas,
          datasets: [
            {
              label: serie.nombre,
              data: serie.puntos.map((p) => p.total),
              borderColor: color,
              backgroundColor: `${color}22`,
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: tema.surface,
              pointBorderColor: color,
              pointBorderWidth: 2,
              pointHoverRadius: 6,
            },
            {
              label: 'Promedio',
              data: serie.puntos.map(() => serie.promedio),
              borderColor: tema.faint,
              borderDash: [6, 6],
              borderWidth: 1.5,
              pointRadius: 0,
              pointHoverRadius: 0,
              fill: false,
            },
          ],
        }}
      />
    </div>
  )
}

/** Costo mensual del desperdicio. */
export function GraficoDesperdicio({ serie }) {
  const tema = useTema()
  const opciones = base(tema)
  opciones.scales.y.beginAtZero = true
  opciones.scales.y.ticks.callback = (v) => num(v / 1000) + ' mil'
  opciones.plugins.tooltip.callbacks = { label: (c) => ` ${cop(c.parsed.y)}` }
  return (
    <div className="h-64" role="img" aria-label="Costo mensual del desperdicio">
      <Bar
        options={opciones}
        data={{
          labels: serie.map((p) => mesCorto(p.mes)),
          datasets: [
            {
              data: serie.map((p) => p.costo),
              backgroundColor: serie.map((_, i) => (i === serie.length - 1 ? tema.brand : `${tema.brand}66`)),
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 44,
            },
          ],
        }}
      />
    </div>
  )
}
