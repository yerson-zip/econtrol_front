import { useState } from 'react'
import { Building, Pencil, Plus, Ruler, Users } from 'lucide-react'
import { api, mensajeDe } from '../lib/api'
import { useDatos } from '../lib/useDatos'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cop, num, ROLES } from '../lib/format'
import {
  Badge, Button, Card, Cargando, ErrorCarga, Field, Input, Modal, PageHeader, Segmentado, Select, Tabla, Td, Th, Vacio,
} from '../components/ui'

export default function Configuracion() {
  const [seccion, setSeccion] = useState('usuarios')
  return (
    <>
      <PageHeader titulo="Configuración" descripcion="Usuarios, recursos con sus tarifas y umbrales, y áreas de la empresa." />
      <div className="mb-5">
        <Segmentado
          etiqueta="Sección"
          valor={seccion}
          onChange={setSeccion}
          opciones={[
            { valor: 'usuarios', etiqueta: 'Usuarios', icono: Users },
            { valor: 'recursos', etiqueta: 'Recursos', icono: Ruler },
            { valor: 'areas', etiqueta: 'Áreas', icono: Building },
          ]}
        />
      </div>
      {seccion === 'usuarios' && <Usuarios />}
      {seccion === 'recursos' && <Recursos />}
      {seccion === 'areas' && <Areas />}
    </>
  )
}

/** Encabezado de sección con botón de alta; evita repetir la misma estructura tres veces. */
function Seccion({ cargando, error, datos, recargar, vacio, accion, children }) {
  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <ErrorCarga error={error} reintentar={recargar} />
  return (
    <Card>
      <div className="flex justify-end px-5 pt-5 sm:px-6">{accion}</div>
      {datos.length === 0 ? <Vacio titulo={vacio} /> : children}
    </Card>
  )
}

/* ───────── Usuarios ───────── */
function Usuarios() {
  const { usuario: yo } = useAuth()
  const toast = useToast()
  const lista = useDatos(() => api.get('/usuarios'))
  const [nuevo, setNuevo] = useState(false)

  async function cambiar(u, cambios) {
    try {
      await api.patch(`/usuarios/${u.id}`, cambios)
      toast.ok('Usuario actualizado')
      lista.recargar()
    } catch (e) {
      toast.error(mensajeDe(e))
    }
  }

  return (
    <>
      <Seccion {...lista} vacio="No hay usuarios" accion={<Button icono={Plus} onClick={() => setNuevo(true)}>Agregar usuario</Button>}>
        <p className="px-5 pt-3 pb-4 text-[13px] text-muted sm:px-6">
          Las personas entran con su cuenta de Google: aquí solo registras su correo y su rol.
        </p>
        <Tabla>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Correo</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th><span className="sr-only">Acciones</span></Th>
            </tr>
          </thead>
          <tbody>
            {lista.datos?.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium">{u.nombre}</Td>
                <Td className="text-muted">{u.correo}</Td>
                <Td>
                  <Select
                    aria-label={`Rol de ${u.nombre}`}
                    value={u.rol}
                    disabled={u.id === yo.id}
                    onChange={(e) => cambiar(u, { rol: e.target.value })}
                    className="h-8 w-40 text-[13px]"
                  >
                    {Object.entries(ROLES).map(([v, e]) => <option key={v} value={v}>{e}</option>)}
                  </Select>
                </Td>
                <Td><Badge tono={u.activo ? 'ok' : 'neutral'}>{u.activo ? 'Activo' : 'Desactivado'}</Badge></Td>
                <Td>
                  <div className="flex justify-end">
                    {u.id !== yo.id && (
                      <Button tam="sm" variante="secondary" onClick={() => cambiar(u, { activo: !u.activo })}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Seccion>
      <ModalUsuario abierto={nuevo} onCerrar={() => setNuevo(false)} onListo={() => { setNuevo(false); toast.ok('Usuario agregado'); lista.recargar() }} />
    </>
  )
}

function ModalUsuario({ abierto, onCerrar, onListo }) {
  const toast = useToast()
  const [form, setForm] = useState({ nombre: '', correo: '', rol: 'operario' })
  const [enviando, setEnviando] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post('/usuarios', form)
      setForm({ nombre: '', correo: '', rol: 'operario' })
      onListo()
    } catch (err) {
      toast.error(err.status === 409 ? 'Ya existe un usuario con ese correo' : mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }
  const campo = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) })

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Agregar usuario" descripcion="Debe usar este mismo correo para entrar con Google.">
      <form onSubmit={guardar} className="space-y-4">
        <Field label="Nombre">{(id) => <Input id={id} required {...campo('nombre')} />}</Field>
        <Field label="Correo de Google">{(id) => <Input id={id} type="email" required autoComplete="off" {...campo('correo')} />}</Field>
        <Field label="Rol">
          {(id) => (
            <Select id={id} {...campo('rol')}>
              {Object.entries(ROLES).map(([v, e]) => <option key={v} value={v}>{e}</option>)}
            </Select>
          )}
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variante="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" cargando={enviando}>Agregar</Button>
        </div>
      </form>
    </Modal>
  )
}

/* ───────── Recursos ───────── */
function Recursos() {
  const toast = useToast()
  const lista = useDatos(() => api.get('/recursos'))
  const [edicion, setEdicion] = useState(null) // null | 'nuevo' | recurso

  return (
    <>
      <Seccion {...lista} vacio="No hay recursos" accion={<Button icono={Plus} onClick={() => setEdicion('nuevo')}>Nuevo recurso</Button>}>
        <Tabla>
          <thead>
            <tr>
              <Th>Recurso</Th>
              <Th>Unidad</Th>
              <Th derecha>Tarifa</Th>
              <Th derecha>Umbral de alerta</Th>
              <Th>Base de la merma</Th>
              <Th><span className="sr-only">Acciones</span></Th>
            </tr>
          </thead>
          <tbody>
            {lista.datos?.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium">{r.nombre}</Td>
                <Td>{r.unidad}</Td>
                <Td num>{cop(r.tarifa)}</Td>
                <Td num>+{num(r.umbral_pct)} %</Td>
                <Td>{r.base_merma ? <Badge tono="brand">Base de la merma</Badge> : <span className="text-faint">—</span>}</Td>
                <Td>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setEdicion(r)} className="rounded-lg p-2 text-faint transition-colors hover:bg-canvas hover:text-brand" aria-label={`Editar ${r.nombre}`}>
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Seccion>
      <ModalRecurso
        recurso={edicion}
        onCerrar={() => setEdicion(null)}
        onListo={() => { setEdicion(null); toast.ok('Recurso guardado'); lista.recargar() }}
      />
    </>
  )
}

const RECURSO_VACIO = { nombre: '', unidad: '', tarifa: '', umbral_pct: '30', base_merma: false }

function ModalRecurso({ recurso, onCerrar, onListo }) {
  const toast = useToast()
  const creando = recurso === 'nuevo'
  const [form, setForm] = useState(RECURSO_VACIO)
  const [enviando, setEnviando] = useState(false)
  const [visto, setVisto] = useState(null)

  const clave = recurso ? (creando ? 'nuevo' : recurso.id) : null
  if (clave !== visto) {
    setVisto(clave)
    if (recurso) setForm(creando ? RECURSO_VACIO : { nombre: recurso.nombre, unidad: recurso.unidad, tarifa: recurso.tarifa, umbral_pct: recurso.umbral_pct, base_merma: recurso.base_merma })
  }

  async function guardar(e) {
    e.preventDefault()
    setEnviando(true)
    const cuerpo = { nombre: form.nombre.trim(), unidad: form.unidad.trim(), tarifa: Number(form.tarifa), umbral_pct: Number(form.umbral_pct), base_merma: form.base_merma }
    try {
      await (creando ? api.post('/recursos', cuerpo) : api.patch(`/recursos/${recurso.id}`, cuerpo))
      onListo()
    } catch (err) {
      toast.error(err.status === 409 ? 'Ya existe un recurso con ese nombre' : mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }
  const campo = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) })

  return (
    <Modal abierto={!!recurso} onCerrar={onCerrar} titulo={creando ? 'Nuevo recurso' : 'Editar recurso'}>
      <form onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Nombre" className="col-span-2">{(id) => <Input id={id} required {...campo('nombre')} />}</Field>
          <Field label="Unidad">{(id) => <Input id={id} required placeholder="kWh, m³, kg" {...campo('unidad')} />}</Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tarifa (COP por unidad)">
            {(id) => <Input id={id} type="number" required min="0" step="any" className="num text-right" {...campo('tarifa')} />}
          </Field>
          <Field label="Umbral de alerta (%)" hint="Sobre el promedio diario">
            {(id) => <Input id={id} type="number" required min="1" max="1000" step="any" className="num text-right" {...campo('umbral_pct')} />}
          </Field>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-canvas p-3.5 text-sm">
          <input
            type="checkbox"
            checked={form.base_merma}
            onChange={(e) => setForm((f) => ({ ...f, base_merma: e.target.checked }))}
            className="mt-0.5 size-4 accent-brand"
          />
          <span>
            <span className="font-medium">Usar como base de la merma</span>
            <span className="block text-muted">La merma se mide como pérdidas divididas entre el consumo de este recurso. Solo uno por empresa.</span>
          </span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variante="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" cargando={enviando}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}

/* ───────── Áreas ───────── */
function Areas() {
  const toast = useToast()
  const lista = useDatos(() => api.get('/areas'))
  const [edicion, setEdicion] = useState(null)

  return (
    <>
      <Seccion {...lista} vacio="No hay áreas" accion={<Button icono={Plus} onClick={() => setEdicion('nueva')}>Nueva área</Button>}>
        <Tabla>
          <thead>
            <tr>
              <Th>Área</Th>
              <Th><span className="sr-only">Acciones</span></Th>
            </tr>
          </thead>
          <tbody>
            {lista.datos?.map((a) => (
              <tr key={a.id}>
                <Td className="font-medium">{a.nombre}</Td>
                <Td>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setEdicion(a)} className="rounded-lg p-2 text-faint transition-colors hover:bg-canvas hover:text-brand" aria-label={`Renombrar ${a.nombre}`}>
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Seccion>
      <ModalArea area={edicion} onCerrar={() => setEdicion(null)} onListo={() => { setEdicion(null); toast.ok('Área guardada'); lista.recargar() }} />
    </>
  )
}

function ModalArea({ area, onCerrar, onListo }) {
  const toast = useToast()
  const creando = area === 'nueva'
  const [nombre, setNombre] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [visto, setVisto] = useState(null)

  const clave = area ? (creando ? 'nueva' : area.id) : null
  if (clave !== visto) {
    setVisto(clave)
    if (area) setNombre(creando ? '' : area.nombre)
  }

  async function guardar(e) {
    e.preventDefault()
    setEnviando(true)
    try {
      await (creando ? api.post('/areas', { nombre: nombre.trim() }) : api.patch(`/areas/${area.id}`, { nombre: nombre.trim() }))
      onListo()
    } catch (err) {
      toast.error(err.status === 409 ? 'Ya existe un área con ese nombre' : mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto={!!area} onCerrar={onCerrar} titulo={creando ? 'Nueva área' : 'Renombrar área'} ancho="max-w-sm">
      <form onSubmit={guardar} className="space-y-4">
        <Field label="Nombre">{(id) => <Input id={id} required value={nombre} onChange={(e) => setNombre(e.target.value)} />}</Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variante="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" cargando={enviando}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}
