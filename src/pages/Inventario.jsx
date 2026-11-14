import { useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, CircleCheck, OctagonAlert, Package, Pencil, Plus, TriangleAlert } from 'lucide-react'
import { api, mensajeDe } from '../lib/api'
import { useDatos } from '../lib/useDatos'
import { useAuth } from '../context/AuthContext'
import { useAlertasAbiertas } from '../context/AlertasContext'
import { useToast } from '../context/ToastContext'
import { hoy, num } from '../lib/format'
import {
  Badge, Button, Card, Cargando, ErrorCarga, Field, Input, Modal, PageHeader, Segmentado, Tabla, Td, Th, Vacio,
} from '../components/ui'

const ESTADOS = {
  'Bajo mínimo': { tono: 'crit', icono: OctagonAlert, barra: 'bg-crit-solid' },
  'Cerca del mínimo': { tono: 'warn', icono: TriangleAlert, barra: 'bg-brand' },
  Suficiente: { tono: 'ok', icono: CircleCheck, barra: 'bg-faint' },
}

/** La marca vertical indica dónde está el stock mínimo (la barra llega al doble del mínimo). */
function BarraNivel({ nivel, estado }) {
  const ancho = Math.min((nivel ?? 2) / 2, 1) * 100
  return (
    <div className="relative h-2 w-28 overflow-hidden rounded-full bg-line" role="presentation">
      <div className={`h-full rounded-full ${ESTADOS[estado].barra}`} style={{ width: `${ancho}%` }} />
      <span className="absolute inset-y-0 left-1/2 w-px bg-ink/50" />
    </div>
  )
}

export default function Inventario() {
  const { usuario } = useAuth()
  const { refrescar: refrescarContador } = useAlertasAbiertas()
  const toast = useToast()
  const { datos, cargando, error, recargar } = useDatos(() => api.get('/materiales'))
  const [movimiento, setMovimiento] = useState(null) // { material, tipo }
  const [edicion, setEdicion] = useState(null) // null | 'nuevo' | material

  const puedeMover = usuario.rol !== 'gerencia'
  const esAdmin = usuario.rol === 'administrador'

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <ErrorCarga error={error} reintentar={recargar} />

  const despuesDeCambio = (r, mensaje) => {
    toast.ok(mensaje)
    if (r?.alerta) toast.info(`Alerta creada: ${r.alerta.descripcion}`)
    recargar()
    refrescarContador()
  }

  return (
    <>
      <PageHeader
        titulo="Inventario"
        descripcion="Existencias, stock mínimo y cobertura de cada material."
        acciones={esAdmin && <Button icono={Plus} onClick={() => setEdicion('nuevo')}>Nuevo material</Button>}
      />

      <Card>
        {datos.length === 0 ? (
          <Vacio icono={Package} titulo="Todavía no hay materiales">
            {esAdmin ? 'Agrega el primero con el botón Nuevo material.' : 'El administrador debe registrar los materiales.'}
          </Vacio>
        ) : (
          <Tabla className="rounded-2xl">
            <thead>
              <tr>
                <Th className="min-w-48">Material</Th>
                <Th derecha>Existencia</Th>
                <Th derecha>Mínimo</Th>
                <Th>Nivel</Th>
                <Th derecha>Cobertura</Th>
                <Th>Estado</Th>
                {(puedeMover || esAdmin) && <Th><span className="sr-only">Acciones</span></Th>}
              </tr>
            </thead>
            <tbody>
              {datos.map((m) => {
                const e = ESTADOS[m.estado]
                return (
                  <tr key={m.id} className="group transition-colors hover:bg-canvas/70">
                    <Td className="font-medium whitespace-nowrap">{m.nombre}</Td>
                    <Td num>
                      {num(m.existencia, 1)}
                      <span className="ml-1.5 inline-block w-11 text-left text-muted">{m.unidad}</span>
                    </Td>
                    <Td num>
                      {num(m.stock_minimo, 1)}
                      <span className="ml-1.5 inline-block w-11 text-left text-muted">{m.unidad}</span>
                    </Td>
                    <Td>
                      <BarraNivel nivel={m.nivel} estado={m.estado} />
                    </Td>
                    <Td num>{m.cobertura_dias == null ? '—' : `${num(m.cobertura_dias, 1)} días`}</Td>
                    <Td>
                      <Badge tono={e.tono} icono={e.icono}>
                        {m.estado}
                      </Badge>
                    </Td>
                    {(puedeMover || esAdmin) && (
                      <Td>
                        <div className="flex justify-end gap-1.5 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
                          {puedeMover && (
                            <>
                              <Button tam="sm" variante="secondary" icono={ArrowUpFromLine} onClick={() => setMovimiento({ material: m, tipo: 'salida' })}>
                                Salida
                              </Button>
                              <Button tam="sm" variante="secondary" icono={ArrowDownToLine} onClick={() => setMovimiento({ material: m, tipo: 'entrada' })}>
                                Entrada
                              </Button>
                            </>
                          )}
                          {esAdmin && (
                            <button
                              type="button"
                              onClick={() => setEdicion(m)}
                              className="rounded-lg p-2 text-muted transition-colors hover:bg-line hover:text-brand"
                              aria-label={`Editar ${m.nombre}`}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </Td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </Tabla>
        )}
      </Card>

      <ModalMovimiento
        datos={movimiento}
        onCerrar={() => setMovimiento(null)}
        onListo={(r) => {
          setMovimiento(null)
          despuesDeCambio(r, 'Movimiento registrado')
        }}
      />
      <ModalMaterial
        material={edicion}
        onCerrar={() => setEdicion(null)}
        onListo={(r, creado) => {
          setEdicion(null)
          despuesDeCambio(r, creado ? 'Material creado' : 'Material actualizado')
        }}
      />
    </>
  )
}

function ModalMovimiento({ datos, onCerrar, onListo }) {
  const toast = useToast()
  const [form, setForm] = useState({ tipo: 'salida', cantidad: '', fecha: hoy() })
  const [enviando, setEnviando] = useState(false)
  const [visto, setVisto] = useState(null)

  if (datos && (datos.material.id !== visto?.id || datos.tipo !== visto?.tipo)) {
    setVisto({ id: datos.material.id, tipo: datos.tipo })
    setForm({ tipo: datos.tipo, cantidad: '', fecha: hoy() })
  }
  if (!datos && visto) setVisto(null)

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    try {
      onListo(await api.post(`/materiales/${datos.material.id}/movimientos`, { ...form, cantidad: Number(form.cantidad) }))
    } catch (err) {
      toast.error(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      abierto={!!datos}
      onCerrar={onCerrar}
      titulo="Registrar movimiento"
      descripcion={datos ? `${datos.material.nombre}: ${num(datos.material.existencia, 1)} ${datos.material.unidad} en existencia` : ''}
    >
      <form onSubmit={enviar} className="space-y-4">
        <Segmentado
          etiqueta="Tipo de movimiento"
          valor={form.tipo}
          onChange={(tipo) => setForm((f) => ({ ...f, tipo }))}
          opciones={[
            { valor: 'salida', etiqueta: 'Salida', icono: ArrowUpFromLine },
            { valor: 'entrada', etiqueta: 'Entrada', icono: ArrowDownToLine },
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Cantidad${datos ? ` (${datos.material.unidad})` : ''}`}>
            {(id) => (
              <Input id={id} type="number" required min="0" step="any" inputMode="decimal" className="num text-right" value={form.cantidad} onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))} />
            )}
          </Field>
          <Field label="Fecha">
            {(id) => <Input id={id} type="date" required max={hoy()} value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />}
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variante="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" cargando={enviando}>Registrar {form.tipo}</Button>
        </div>
      </form>
    </Modal>
  )
}

const MATERIAL_VACIO = { nombre: '', unidad: '', existencia: '', stock_minimo: '', uso_diario: '', tarifa: '' }

function ModalMaterial({ material, onCerrar, onListo }) {
  const toast = useToast()
  const creando = material === 'nuevo'
  const [form, setForm] = useState(MATERIAL_VACIO)
  const [enviando, setEnviando] = useState(false)
  const [visto, setVisto] = useState(null)

  const clave = material ? (creando ? 'nuevo' : material.id) : null
  if (clave !== visto) {
    setVisto(clave)
    if (material) {
      setForm(
        creando
          ? MATERIAL_VACIO
          : { nombre: material.nombre, unidad: material.unidad, existencia: material.existencia, stock_minimo: material.stock_minimo, uso_diario: material.uso_diario, tarifa: material.tarifa },
      )
    }
  }

  async function guardar(e) {
    e.preventDefault()
    setEnviando(true)
    const n = (k) => Number(form[k] || 0)
    const cuerpo = { nombre: form.nombre.trim(), unidad: form.unidad.trim(), stock_minimo: n('stock_minimo'), uso_diario: n('uso_diario'), tarifa: n('tarifa') }
    try {
      if (creando) {
        const r = await api.post('/materiales', { ...cuerpo, existencia: n('existencia') })
        onListo(r, true)
      } else {
        onListo(await api.patch(`/materiales/${material.id}`, cuerpo), false)
      }
    } catch (err) {
      toast.error(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) })
  const numero = { type: 'number', min: '0', step: 'any', inputMode: 'decimal', className: 'num text-right' }

  return (
    <Modal abierto={!!material} onCerrar={onCerrar} titulo={creando ? 'Nuevo material' : 'Editar material'}>
      <form onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Nombre" className="col-span-2">{(id) => <Input id={id} required {...campo('nombre')} />}</Field>
          <Field label="Unidad">{(id) => <Input id={id} required placeholder="m, und, kg" {...campo('unidad')} />}</Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {creando && <Field label="Existencia inicial">{(id) => <Input id={id} required {...numero} {...campo('existencia')} />}</Field>}
          <Field label="Stock mínimo">{(id) => <Input id={id} required {...numero} {...campo('stock_minimo')} />}</Field>
          <Field label="Uso diario" hint="Para calcular la cobertura">{(id) => <Input id={id} {...numero} {...campo('uso_diario')} />}</Field>
          <Field label="Tarifa (COP)" hint="Costo por unidad en pérdidas">{(id) => <Input id={id} {...numero} {...campo('tarifa')} />}</Field>
        </div>
        {!creando && <p className="text-xs text-muted">La existencia solo cambia con entradas y salidas.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variante="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" cargando={enviando}>{creando ? 'Crear material' : 'Guardar cambios'}</Button>
        </div>
      </form>
    </Modal>
  )
}
