import { useState } from 'react'
import { ClipboardList, Gauge, Pencil, PenLine, Send, TriangleAlert } from 'lucide-react'
import { api, mensajeDe } from '../lib/api'
import { useDatos } from '../lib/useDatos'
import { useAuth } from '../context/AuthContext'
import { useAlertasAbiertas } from '../context/AlertasContext'
import { useToast } from '../context/ToastContext'
import { cop, fechaCorta, hoy, num } from '../lib/format'
import {
  Aviso, Button, Card, CardHeader, Cargando, ErrorCarga, Field, Input, Modal, PageHeader, Select, Tabla, Td, Textarea, Th, Vacio,
} from '../components/ui'

const VACIO = { id_recurso: '', id_area: '', fecha: hoy(), cantidad: '', observacion: '' }

export default function Consumos() {
  const { usuario } = useAuth()
  const toast = useToast()
  const { refrescar: refrescarContador } = useAlertasAbiertas()
  const puedeRegistrar = usuario.rol !== 'gerencia'

  const catalogo = useDatos(() => Promise.all([api.get('/recursos'), api.get('/areas')]))
  const umbrales = useDatos(() => api.get('/consumos/umbrales'))
  const recientes = useDatos(() => api.get('/consumos', { limite: 20 }))

  const [form, setForm] = useState(VACIO)
  const [enviando, setEnviando] = useState(false)
  const [alertaCreada, setAlertaCreada] = useState(null)
  const [edicion, setEdicion] = useState(null)

  if (catalogo.cargando && !catalogo.datos) return <Cargando />
  if (catalogo.error && !catalogo.datos) return <ErrorCarga error={catalogo.error} reintentar={catalogo.recargar} />
  const [recursos, areas] = catalogo.datos

  const umbral = umbrales.datos?.find((u) => u.id_recurso === Number(form.id_recurso))
  const supera = umbral?.umbral != null && Number(form.cantidad) > umbral.umbral
  const unidad = recursos.find((r) => r.id === Number(form.id_recurso))?.unidad

  const actualizar = () => {
    umbrales.recargar()
    recientes.recargar()
    refrescarContador()
  }

  async function registrar(e) {
    e.preventDefault()
    setEnviando(true)
    setAlertaCreada(null)
    try {
      const r = await api.post('/consumos', {
        id_recurso: Number(form.id_recurso),
        id_area: Number(form.id_area),
        fecha: form.fecha,
        cantidad: Number(form.cantidad),
        observacion: form.observacion.trim() || null,
      })
      setAlertaCreada(r.alerta)
      toast.ok('Consumo registrado')
      setForm((f) => ({ ...VACIO, id_recurso: f.id_recurso, id_area: f.id_area, fecha: f.fecha }))
      actualizar()
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
        titulo={puedeRegistrar ? 'Registrar consumo' : 'Consumos'}
        descripcion={
          puedeRegistrar
            ? 'Anota el consumo del día. Si se sale de lo normal, el sistema crea una alerta.'
            : 'Consulta los registros recientes y los umbrales de cada recurso.'
        }
      />

      {alertaCreada && (
        <div className="mb-6">
          <Aviso tono="crit" icono={TriangleAlert} titulo="Se creó una alerta crítica">
            {alertaCreada.descripcion}
          </Aviso>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {puedeRegistrar && (
          <Card className="lg:col-span-2">
            <CardHeader icono={PenLine} titulo="Nuevo registro" />
            <form onSubmit={registrar} className="space-y-4 px-5 pb-6 sm:px-6">
              <Field label="Recurso">
                {(id) => (
                  <Select id={id} required {...campo('id_recurso')}>
                    <option value="">Elige un recurso</option>
                    {recursos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} ({r.unidad})
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Área">
                {(id) => (
                  <Select id={id} required {...campo('id_area')}>
                    <option value="">Elige un área</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha">
                  {(id) => <Input id={id} type="date" required max={hoy()} {...campo('fecha')} />}
                </Field>
                <Field
                  label={unidad ? `Cantidad (${unidad})` : 'Cantidad'}
                  error={supera ? `Supera el umbral de ${num(umbral.umbral, 1)} ${unidad}` : undefined}
                >
                  {(id) => (
                    <Input id={id} type="number" required min="0" step="any" inputMode="decimal" className="num text-right" {...campo('cantidad')} />
                  )}
                </Field>
              </div>
              <Field label="Observación" hint="Opcional">
                {(id) => <Textarea id={id} rows={2} maxLength={500} placeholder="Ej.: posible fuga en llave 3" {...campo('observacion')} />}
              </Field>
              <Button type="submit" cargando={enviando} icono={Send} className="w-full">
                Registrar consumo
              </Button>
            </form>
          </Card>
        )}

        <Card className={puedeRegistrar ? 'lg:col-span-3' : 'lg:col-span-5'}>
          <CardHeader
            icono={Gauge}
            titulo="Promedio diario y umbral"
            descripcion="Promedio de los 5 meses anteriores dividido entre 26 días."
          />
          {umbrales.cargando && !umbrales.datos ? (
            <Cargando />
          ) : !umbrales.datos?.length ? (
            <Vacio titulo="No hay recursos configurados" />
          ) : (
            <Tabla>
              <thead>
                <tr>
                  <Th>Recurso</Th>
                  <Th derecha>Promedio diario</Th>
                  <Th derecha>Umbral</Th>
                  <Th derecha>Margen</Th>
                </tr>
              </thead>
              <tbody>
                {umbrales.datos.map((u) => (
                  <tr key={u.id_recurso}>
                    <Td className="font-medium">{u.recurso}</Td>
                    <Td num>{u.promedio_diario == null ? '—' : `${num(u.promedio_diario, 1)} ${u.unidad}`}</Td>
                    <Td num>{u.umbral == null ? '—' : `${num(u.umbral, 1)} ${u.unidad}`}</Td>
                    <Td num>{num(u.umbral_pct)} %</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader icono={ClipboardList} titulo="Registros recientes" descripcion="Los 20 más recientes, con su costo estimado." />
        {recientes.cargando && !recientes.datos ? (
          <Cargando />
        ) : recientes.error && !recientes.datos ? (
          <ErrorCarga error={recientes.error} reintentar={recientes.recargar} />
        ) : !recientes.datos.length ? (
          <Vacio icono={ClipboardList} titulo="Aún no hay registros">
            Los consumos que registres aparecerán aquí.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Recurso</Th>
                <Th>Área</Th>
                <Th derecha>Cantidad</Th>
                <Th derecha>Costo estimado</Th>
                <Th>Observación</Th>
                {puedeRegistrar && <Th className="w-12"><span className="sr-only">Acciones</span></Th>}
              </tr>
            </thead>
            <tbody>
              {recientes.datos.map((c) => {
                const editable = usuario.rol === 'administrador' || c.usuario === usuario.nombre
                return (
                  <tr key={c.id}>
                    <Td className="whitespace-nowrap">{fechaCorta(c.fecha)}</Td>
                    <Td className="font-medium">{c.recurso.nombre}</Td>
                    <Td>{c.area.nombre}</Td>
                    <Td num>
                      {num(c.cantidad, 2)} <span className="text-muted">{c.recurso.unidad}</span>
                    </Td>
                    <Td num>{cop(c.costo_estimado)}</Td>
                    <Td className="max-w-48 truncate text-muted" title={c.observacion ?? ''}>
                      {c.observacion ?? '—'}
                    </Td>
                    {puedeRegistrar && (
                      <Td>
                        {editable && (
                          <button
                            type="button"
                            onClick={() => setEdicion(c)}
                            className="rounded-lg p-1.5 text-faint transition-colors hover:bg-canvas hover:text-brand"
                            aria-label={`Corregir registro de ${c.recurso.nombre} del ${fechaCorta(c.fecha)}`}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </button>
                        )}
                      </Td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </Tabla>
        )}
      </Card>

      <ModalCorregir
        consumo={edicion}
        areas={areas}
        onCerrar={() => setEdicion(null)}
        onGuardado={(r) => {
          setEdicion(null)
          toast.ok('Registro corregido')
          if (r.alerta) setAlertaCreada(r.alerta)
          actualizar()
        }}
      />
    </>
  )
}

function ModalCorregir({ consumo, areas, onCerrar, onGuardado }) {
  const toast = useToast()
  const [enviando, setEnviando] = useState(false)
  const [form, setForm] = useState(null)
  const [vistoId, setVistoId] = useState(null)

  // Reinicia el formulario cada vez que se abre con otro registro
  if (consumo && consumo.id !== vistoId) {
    setVistoId(consumo.id)
    setForm({ id_area: consumo.area.id, fecha: consumo.fecha, cantidad: consumo.cantidad, observacion: consumo.observacion ?? '' })
  }
  if (!consumo && vistoId !== null) setVistoId(null)

  async function guardar(e) {
    e.preventDefault()
    setEnviando(true)
    try {
      onGuardado(
        await api.patch(`/consumos/${consumo.id}`, {
          id_area: Number(form.id_area),
          fecha: form.fecha,
          cantidad: Number(form.cantidad),
          observacion: form.observacion.trim() || null,
        }),
      )
    } catch (err) {
      toast.error(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  const campo = (k) => ({ value: form?.[k] ?? '', onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) })

  return (
    <Modal
      abierto={!!consumo}
      onCerrar={onCerrar}
      titulo="Corregir registro"
      descripcion={consumo ? `${consumo.recurso.nombre} · ${consumo.recurso.unidad}` : ''}
    >
      {form && (
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha">{(id) => <Input id={id} type="date" required max={hoy()} {...campo('fecha')} />}</Field>
            <Field label="Cantidad">
              {(id) => <Input id={id} type="number" required min="0" step="any" className="num text-right" {...campo('cantidad')} />}
            </Field>
          </div>
          <Field label="Área">
            {(id) => (
              <Select id={id} required {...campo('id_area')}>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Observación">{(id) => <Textarea id={id} rows={2} maxLength={500} {...campo('observacion')} />}</Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variante="secondary" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" cargando={enviando}>
              Guardar cambios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
