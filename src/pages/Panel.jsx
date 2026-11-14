import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellOff, Coins, Droplets, Lightbulb, Package, Percent, TrendingDown, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { useDatos } from '../lib/useDatos'
import { cop, mesAnterior, mesLargo, num, pct } from '../lib/format'
import { Badge, Card, CardHeader, Cargando, ErrorCarga, Input, PageHeader, Segmentado, Vacio } from '../components/ui'
import { KpiCard, Variacion } from '../components/KpiCard'
import { colorRecurso, GraficoConsumo, useTema } from '../components/charts'

const iconoRecurso = (nombre) => {
  const n = nombre.toLowerCase()
  return n.includes('agua') ? Droplets : n.includes('energ') ? Zap : Package
}

export default function Panel() {
  const [mes, setMes] = useState('')
  const [serieId, setSerieId] = useState(null)
  const tema = useTema()
  const { datos, cargando, error, recargar } = useDatos(() => api.get('/panel', { mes }), [mes])

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <ErrorCarga error={error} reintentar={recargar} />

  const { tarjetas, merma, desperdicio, series, causas, alertas, recomendaciones } = datos
  const sinDatos = tarjetas.every((t) => t.actual === 0) && desperdicio.costo === 0
  const previo = mesLargo(mesAnterior(datos.mes))
  const serie = series.find((s) => s.id_recurso === serieId) ?? series[0]
  const maxCausa = Math.max(...causas.map((c) => c.cantidad), 1)

  return (
    <>
      <PageHeader
        titulo="Panel"
        descripcion={`Consumo, merma y costo del desperdicio de ${mesLargo(datos.mes)}.`}
        acciones={
          <Input
            type="month"
            aria-label="Mes a consultar"
            value={mes || datos.mes}
            onChange={(e) => e.target.value && setMes(e.target.value)}
            className="w-44"
          />
        }
      />

      {sinDatos && (
        <Card className="mb-6">
          <Vacio icono={TrendingDown} titulo="Todavía no hay registros en este mes">
            Registra consumos y pérdidas para ver aquí los indicadores, o elige otro mes.
          </Vacio>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas
          .filter((t) => t.nombre !== merma.recurso)
          .map((t) => {
            const color = colorRecurso(t.nombre, tema)
            return (
              <KpiCard
                key={t.id_recurso}
                icono={iconoRecurso(t.nombre)}
                color={color}
                etiqueta={t.nombre}
                valor={num(t.actual, 1)}
                unidad={t.unidad}
                pie={<Variacion valor={t.variacion} texto={`vs ${previo}`} />}
              />
            )
          })}
        <KpiCard
          icono={Percent}
          color={tema.materiales}
          etiqueta={merma.recurso ? `Merma de ${merma.recurso.toLowerCase()}` : 'Merma'}
          valor={merma.porcentaje == null ? '—' : num(merma.porcentaje, 1)}
          unidad={merma.porcentaje == null ? '' : '%'}
          pie={
            merma.recurso ? (
              <Variacion valor={merma.variacion_puntos} sufijo="pp" texto={`${num(merma.perdidos)} perdidos de ${num(merma.consumidos)}`} />
            ) : (
              <span className="text-xs text-muted">Marca un recurso como base de la merma en Configuración</span>
            )
          }
        />
        <KpiCard
          icono={Coins}
          color={tema.brand}
          etiqueta="Costo del desperdicio"
          valor={cop(desperdicio.costo)}
          pie={<Variacion valor={desperdicio.variacion} texto={`vs ${previo}`} />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titulo="Consumo mensual"
            descripcion="Últimos 6 meses. La línea punteada es el promedio."
            acciones={
              series.length > 1 && (
                <Segmentado
                  etiqueta="Recurso del gráfico"
                  valor={serie?.id_recurso}
                  onChange={setSerieId}
                  opciones={series.map((s) => ({ valor: s.id_recurso, etiqueta: s.nombre }))}
                />
              )
            }
          />
          <div className="px-3 pb-5 sm:px-5">
            {serie ? (
              <GraficoConsumo serie={serie} color={colorRecurso(serie.nombre, tema)} />
            ) : (
              <Vacio icono={Zap} titulo="Aún no hay recursos configurados" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            icono={Bell}
            titulo="Alertas activas"
            acciones={
              alertas.total_abiertas > 0 && (
                <Link to="/alertas" className="text-[13px] font-medium text-brand hover:underline">
                  Ver las {alertas.total_abiertas}
                </Link>
              )
            }
          />
          {alertas.recientes.length === 0 ? (
            <Vacio icono={BellOff} titulo="Sin alertas abiertas">
              Todo está dentro de lo normal.
            </Vacio>
          ) : (
            <ul className="divide-y divide-line px-5 pb-3 sm:px-6">
              {alertas.recientes.map((a) => (
                <li key={a.id} className="py-3">
                  <Badge tono={a.severidad === 'critica' ? 'crit' : 'warn'}>
                    {a.severidad === 'critica' ? 'Crítica' : 'Aviso'}
                  </Badge>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink">{a.descripcion}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader titulo="Causas de pérdida" descripcion={`Cantidad perdida en ${mesLargo(datos.mes)}.`} icono={TrendingDown} />
          {causas.length === 0 ? (
            <Vacio titulo="Sin pérdidas registradas en este mes" />
          ) : (
            <ul className="space-y-4 px-5 pb-6 sm:px-6">
              {causas.map((c) => (
                <li key={c.causa}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink">{c.causa}</span>
                    <span className="num text-muted">
                      {num(c.cantidad)} <span className="text-faint">·</span> {pct(c.porcentaje, { decimales: 0 })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas" role="presentation">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(c.cantidad / maxCausa) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader titulo="Recomendaciones" descripcion="Sugerencias a partir de tus datos." icono={Lightbulb} />
          <ul className="space-y-3 px-5 pb-6 sm:px-6">
            {recomendaciones.map((r) => (
              <li key={r} className="flex gap-3 rounded-xl bg-canvas p-3.5 text-sm leading-snug">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
