import { useState } from 'react'
import { ArrowRight, ChartColumn, FileSpreadsheet, FileText, Lightbulb } from 'lucide-react'
import { api, mensajeDe } from '../lib/api'
import { useDatos } from '../lib/useDatos'
import { useToast } from '../context/ToastContext'
import { cop, mesAnterior, mesLargo, num } from '../lib/format'
import {
  Aviso, Badge, Button, Card, CardHeader, Cargando, ErrorCarga, Field, Input, PageHeader, Tabla, Td, Th, Vacio,
} from '../components/ui'
import { Variacion } from '../components/KpiCard'
import { GraficoDesperdicio } from '../components/charts'

const TONO_LECTURA = { Revisar: 'crit', Vigilar: 'warn', Normal: 'ok' }

export default function Reportes() {
  // El último mes con datos viene del panel; así los períodos iniciales siempre tienen información
  const { datos, error, recargar } = useDatos(() => api.get('/panel'))
  if (error && !datos) return <ErrorCarga error={error} reintentar={recargar} />
  if (!datos) return <Cargando />
  return <Comparacion mesInicial={datos.mes} />
}

function Comparacion({ mesInicial }) {
  const toast = useToast()
  const [a, setA] = useState(mesAnterior(mesInicial))
  const [b, setB] = useState(mesInicial)
  const [exportando, setExportando] = useState('')
  const valido = a && b && a !== b
  const { datos, cargando, error, recargar } = useDatos(() => (valido ? api.get('/reportes/comparar', { a, b }) : Promise.resolve(null)), [a, b])

  async function exportar(formato) {
    setExportando(formato)
    try {
      await api.descargar('/reportes/exportar', { a, b, formato }, `ecocontrol-${a}-vs-${b}.${formato}`)
    } catch (e) {
      toast.error(mensajeDe(e))
    } finally {
      setExportando('')
    }
  }

  return (
    <>
      <PageHeader
        titulo="Reportes"
        descripcion="Compara dos meses y mira cuánto cambió el consumo, en cantidad y en pesos."
        acciones={
          <>
            <Button variante="secondary" icono={FileText} cargando={exportando === 'pdf'} disabled={!valido} onClick={() => exportar('pdf')}>
              PDF
            </Button>
            <Button variante="secondary" icono={FileSpreadsheet} cargando={exportando === 'xlsx'} disabled={!valido} onClick={() => exportar('xlsx')}>
              Excel
            </Button>
          </>
        }
      />

      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Período base" className="w-48">
            {(id) => <Input id={id} type="month" value={a} onChange={(e) => setA(e.target.value)} />}
          </Field>
          <ArrowRight className="mb-3 hidden size-5 text-faint sm:block" aria-hidden="true" />
          <Field label="Período a comparar" className="w-48">
            {(id) => <Input id={id} type="month" value={b} onChange={(e) => setB(e.target.value)} />}
          </Field>
        </div>
        {!valido && (
          <div className="mt-4">
            <Aviso tono="warn">Elige dos meses distintos para comparar.</Aviso>
          </div>
        )}
      </Card>

      {valido && cargando && !datos ? (
        <Cargando />
      ) : valido && error && !datos ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : (
        datos && (
          <>
            <Card>
              <CardHeader
                icono={ChartColumn}
                titulo={`${mesLargo(datos.a)} frente a ${mesLargo(datos.b)}`}
                descripcion="Impacto = diferencia × tarifa. Más de 10 % se revisa; más de 3 % se vigila."
              />
              <Tabla>
                <thead>
                  <tr>
                    <Th>Concepto</Th>
                    <Th derecha>{mesLargo(datos.a)}</Th>
                    <Th derecha>{mesLargo(datos.b)}</Th>
                    <Th derecha>Variación</Th>
                    <Th derecha>Impacto en costo</Th>
                    <Th>Lectura</Th>
                  </tr>
                </thead>
                <tbody>
                  {datos.filas.map((f) => (
                    <tr key={f.concepto}>
                      <Td className="font-medium">
                        {f.concepto} {f.unidad && <span className="font-normal text-muted">({f.unidad})</span>}
                      </Td>
                      <Td num>{num(f.a, 1)}</Td>
                      <Td num>{num(f.b, 1)}</Td>
                      <Td derecha>
                        <span className="inline-flex justify-end"><Variacion valor={f.variacion} /></span>
                      </Td>
                      <Td num>{cop(f.impacto)}</Td>
                      <Td>
                        <Badge tono={TONO_LECTURA[f.lectura]}>{f.lectura}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <Td className="font-semibold" colSpan={4}>Impacto total</Td>
                    <Td num className="font-semibold">{cop(datos.impacto_total)}</Td>
                    <Td />
                  </tr>
                </tfoot>
              </Tabla>
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader titulo="Costo mensual del desperdicio" descripcion="Últimos 6 meses hasta el período comparado." />
                <div className="px-3 pb-5 sm:px-5">
                  {datos.desperdicio_serie.every((p) => p.costo === 0) ? (
                    <Vacio titulo="Sin pérdidas en estos meses" />
                  ) : (
                    <GraficoDesperdicio serie={datos.desperdicio_serie} />
                  )}
                </div>
              </Card>
              <Card>
                <CardHeader icono={Lightbulb} titulo="Recomendaciones" />
                <ul className="space-y-3 px-5 pb-6 sm:px-6">
                  {datos.recomendaciones.map((r) => (
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
      )}
    </>
  )
}
