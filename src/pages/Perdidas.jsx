import { useState } from 'react'
import { Coins, Scale, Send, TrendingDown, X } from 'lucide-react'
import { api, mensajeDe } from '../lib/api'
import { useDatos } from '../lib/useDatos'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cop, fechaCorta, hoy, mesLargo, num, pct } from '../lib/format'
import {
  Button, Card, CardHeader, Cargando, ErrorCarga, Field, Input, PageHeader, Select, Tabla, Td, Th, Vacio,
} from '../components/ui'
import { KpiCard } from '../components/KpiCard'

const CAUSAS_COMUNES = ['Error en el corte', 'Retazos no reutilizados', 'Defecto del proveedor', 'Mala manipulación', 'Falla de máquina']
const VACIO = { id_material: '', id_area: '', cantidad: '', causa: '', fecha: hoy() }

/** Convierte "2026-10" en el rango desde/hasta de ese mes. */
const rangoDe = (mes) => {
  if (!mes) return {}
  const [y, m] = mes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { desde: `${mes}-01`, hasta: `${mes}-${String(ultimo).padStart(2, '0')}` }
}

export default function Perdidas() {
  const { usuario } = useAuth()
  const toast = useToast()
  const puedeRegistrar = usuario.rol !== 'gerencia'
  const [mes, setMes] = useState('')
  const [form, setForm] = useState(VACIO)
  const [enviando, setEnviando] = useState(false)

  const catalogo = useDatos(() => Promise.all([api.get('/materiales'), api.get('/areas')]))
  const perdidas = useDatos(() => api.get('/perdidas', rangoDe(mes)), [mes])

  if (catalogo.cargando && !catalogo.datos) return <Cargando />
  if (catalogo.error && !catalogo.datos) return <ErrorCarga error={catalogo.error} reintentar={catalogo.recargar} />
  const [materiales, areas] = catalogo.datos
  const d = perdidas.datos

  const causasConocidas = [...new Set([...CAUSAS_COMUNES, ...(d?.por_causa.map((c) => c.causa) ?? [])])]
  const maxCausa = Math.max(...(d?.por_causa.map((c) => c.cantidad) ?? [1]), 1)
  const unidad = materiales.find((m) => m.id === Number(form.id_material))?.unidad

  async function registrar(e) {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post('/perdidas', {
        id_material: Number(form.id_material),
        id_area: Number(form.id_area),
        cantidad: Number(form.cantidad),
        causa: form.causa.trim(),
        fecha: form.fecha,
      })
      toast.ok('Pérdida registrada')
      setForm((f) => ({ ...VACIO, id_material: f.id_material, id_area: f.id_area, fecha: f.fecha }))
      perdidas.recargar()
    } catch (err) {
      toast.error(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) })

  return (
    <>
      <PageHeader
        titulo="Pérdidas"
        descripcion="Cantidad perdida, causa y costo del desperdicio."
        acciones={
          <div className="flex items-center gap-2">
            <Input type="month" aria-label="Filtrar por mes" value={mes} onChange={(e) => setMes(e.target.value)} className="w-44" />
            {mes && (
              <Button variante="ghost" icono={X} onClick={() => setMes('')}>
                Ver todo
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard icono={Scale} color="var(--materiales)" etiqueta={mes ? `Cantidad perdida en ${mesLargo(mes)}` : 'Cantidad perdida (acumulado)'} valor={d ? num(d.total_cantidad, 1) : '—'} />
        <KpiCard icono={Coins} color="var(--brand)" etiqueta="Costo del desperdicio" valor={d ? cop(d.total_costo) : '—'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className={puedeRegistrar ? 'lg:col-span-3' : 'lg:col-span-5'}>
          <CardHeader icono={TrendingDown} titulo="Pérdidas por causa" />
          {perdidas.cargando && !d ? (
            <Cargando />
          ) : !d?.por_causa.length ? (
            <Vacio titulo="Sin pérdidas en este período" />
          ) : (
            <ul className="space-y-4 px-5 pb-6 sm:px-6">
              {d.por_causa.map((c) => (
                <li key={c.causa}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span>{c.causa}</span>
                    <span className="num text-muted">
                      {num(c.cantidad, 1)} <span className="text-faint">·</span> {pct(c.porcentaje, { decimales: 0 })} <span className="text-faint">·</span> {cop(c.costo)}
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

        {puedeRegistrar && (
          <Card className="lg:col-span-2">
            <CardHeader titulo="Registrar pérdida" />
            <form onSubmit={registrar} className="space-y-4 px-5 pb-6 sm:px-6">
              <Field label="Material">
                {(id) => (
                  <Select id={id} required {...campo('id_material')}>
                    <option value="">Elige un material</option>
                    {materiales.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Área">
                {(id) => (
                  <Select id={id} required {...campo('id_area')}>
                    <option value="">Elige un área</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={unidad ? `Cantidad (${unidad})` : 'Cantidad'}>
                  {(id) => <Input id={id} type="number" required min="0" step="any" inputMode="decimal" className="num text-right" {...campo('cantidad')} />}
                </Field>
                <Field label="Fecha">{(id) => <Input id={id} type="date" required max={hoy()} {...campo('fecha')} />}</Field>
              </div>
              <Field label="Causa" hint="Elige una de la lista o escribe otra.">
                {(id) => (
                  <>
                    <Input id={id} required maxLength={100} list="causas-lista" autoComplete="off" {...campo('causa')} />
                    <datalist id="causas-lista">
                      {causasConocidas.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </>
                )}
              </Field>
              <Button type="submit" cargando={enviando} icono={Send} className="w-full">
                Registrar pérdida
              </Button>
            </form>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader titulo="Pérdidas recientes" />
        {!d?.recientes.length ? (
          <Vacio titulo="Sin pérdidas registradas" />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Material</Th>
                <Th>Área</Th>
                <Th>Causa</Th>
                <Th derecha>Cantidad</Th>
                <Th derecha>Costo</Th>
              </tr>
            </thead>
            <tbody>
              {d.recientes.map((p) => (
                <tr key={p.id}>
                  <Td className="whitespace-nowrap">{fechaCorta(p.fecha)}</Td>
                  <Td className="font-medium">{p.material.nombre}</Td>
                  <Td>{p.area.nombre}</Td>
                  <Td>{p.causa}</Td>
                  <Td num>{num(p.cantidad, 1)} <span className="text-muted">{p.material.unidad}</span></Td>
                  <Td num>{cop(p.costo)}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Card>
    </>
  )
}
