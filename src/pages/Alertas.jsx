import { useState } from 'react'
import { BellOff, CircleCheck, Gauge, Package, Percent, TriangleAlert } from 'lucide-react'
import { api, mensajeDe } from '../lib/api'
import { useDatos } from '../lib/useDatos'
import { useAuth } from '../context/AuthContext'
import { useAlertasAbiertas } from '../context/AlertasContext'
import { useToast } from '../context/ToastContext'
import { fechaCorta } from '../lib/format'
import { Badge, Button, Card, Cargando, ErrorCarga, Field, Modal, PageHeader, Segmentado, Textarea, Vacio } from '../components/ui'

const ICONOS = { consumo_inusual: Gauge, stock_bajo: Package, merma: Percent }

export default function Alertas() {
  const { usuario } = useAuth()
  const { abiertas, refrescar } = useAlertasAbiertas()
  const toast = useToast()
  const [estado, setEstado] = useState('abierta')
  const [atendiendo, setAtendiendo] = useState(null)
  const { datos, cargando, error, recargar } = useDatos(() => api.get('/alertas', { estado }), [estado])

  return (
    <>
      <PageHeader
        titulo="Alertas"
        descripcion="Consumos fuera de lo normal y materiales por debajo del stock mínimo."
        acciones={
          <Segmentado
            etiqueta="Estado de las alertas"
            valor={estado}
            onChange={setEstado}
            opciones={[
              { valor: 'abierta', etiqueta: 'Abiertas', contador: abiertas },
              { valor: 'atendida', etiqueta: 'Atendidas' },
            ]}
          />
        }
      />

      {cargando && !datos ? (
        <Cargando />
      ) : error && !datos ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : datos.length === 0 ? (
        <Card>
          <Vacio icono={BellOff} titulo={estado === 'abierta' ? 'No hay alertas abiertas' : 'Aún no hay alertas atendidas'}>
            {estado === 'abierta' ? 'Todo está dentro de lo normal.' : 'Las alertas que se atiendan quedarán aquí con su acción.'}
          </Vacio>
        </Card>
      ) : (
        <ul className="space-y-3">
          {datos.map((a) => {
            const Icono = ICONOS[a.tipo] ?? TriangleAlert
            const critica = a.severidad === 'critica'
            return (
              <li key={a.id} className="rise">
                <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${critica ? 'bg-crit-solid text-white' : 'bg-warn-soft text-warn'}`}>
                      <Icono className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tono={critica ? 'crit' : 'warn'}>{critica ? 'Crítica' : 'Aviso'}</Badge>
                        <span className="text-xs text-muted">{fechaCorta(a.fecha)}</span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-ink">{a.descripcion}</p>
                      {a.estado === 'atendida' && (
                        <p className="mt-2 flex items-start gap-1.5 text-[13px] text-muted">
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
                          <span>
                            {a.accion_tomada}
                            {a.atendida_por && <> — {a.atendida_por}, {fechaCorta(a.atendida_en)}</>}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  {a.estado === 'abierta' && usuario.rol === 'administrador' && (
                    <Button variante="secondary" icono={CircleCheck} onClick={() => setAtendiendo(a)} className="self-start">
                      Marcar atendida
                    </Button>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <ModalAtender
        alerta={atendiendo}
        onCerrar={() => setAtendiendo(null)}
        onListo={() => {
          setAtendiendo(null)
          toast.ok('Alerta marcada como atendida')
          recargar()
          refrescar()
        }}
        onError={(e) => toast.error(mensajeDe(e))}
      />
    </>
  )
}

function ModalAtender({ alerta, onCerrar, onListo, onError }) {
  const [accion, setAccion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [visto, setVisto] = useState(null)

  if ((alerta?.id ?? null) !== visto) {
    setVisto(alerta?.id ?? null)
    setAccion('')
  }

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.patch(`/alertas/${alerta.id}`, { accion_tomada: accion.trim() })
      onListo()
    } catch (err) {
      onError(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto={!!alerta} onCerrar={onCerrar} titulo="Marcar como atendida" descripcion={alerta?.descripcion}>
      <form onSubmit={enviar} className="space-y-4">
        <Field label="Acción tomada" hint="Queda registrada junto con tu nombre.">
          {(id) => (
            <Textarea id={id} required minLength={3} maxLength={500} rows={3} placeholder="Ej.: se reparó la fuga de la llave 3" value={accion} onChange={(e) => setAccion(e.target.value)} />
          )}
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variante="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" cargando={enviando}>Marcar atendida</Button>
        </div>
      </form>
    </Modal>
  )
}
