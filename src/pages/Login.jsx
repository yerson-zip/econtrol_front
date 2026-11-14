import { useEffect, useRef, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Building2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { mensajeDe } from '../lib/api'
import { Aviso, Field, Input, Segmentado } from '../components/ui'
import { Logo } from '../components/Logo'
import { VistaPrevia } from '../components/VistaPrevia'
import { BotonTema, useTemaActual } from '../components/Tema'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const PIE = 'Universidad Cooperativa de Colombia · Ingeniería de Sistemas'

// Cuadrícula de puntos que se desvanece hacia los bordes del panel oscuro
const PUNTOS =
  '[background-image:radial-gradient(rgb(255_255_255/0.09)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_35%_45%,black,transparent_72%)]'

export default function Login() {
  const { login, registrar } = useAuth()
  const [modo, setModo] = useState('entrar')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [empresa, setEmpresa] = useState({ nit: '', razon_social: '', sector: '' })

  // El botón de Google necesita un ancho en píxeles: se ajusta al espacio disponible para no desbordar en celular
  const caja = useRef(null)
  const [ancho, setAncho] = useState(320)
  useEffect(() => {
    const el = caja.current
    if (!el) return
    const medir = () => setAncho(Math.min(400, Math.max(200, Math.floor(el.clientWidth))))
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const tema = useTemaActual()

  async function alRecibirCredencial({ credential }) {
    setError('')
    if (modo === 'registro' && (empresa.nit.trim().length < 5 || empresa.razon_social.trim().length < 2)) {
      setError('Completa el NIT y la razón social antes de continuar con Google.')
      return
    }
    setEnviando(true)
    try {
      if (modo === 'entrar') await login(credential)
      else
        await registrar({
          idToken: credential,
          nit: empresa.nit.trim(),
          razon_social: empresa.razon_social.trim(),
          ...(empresa.sector.trim() && { sector: empresa.sector.trim() }),
        })
    } catch (e) {
      setError(mensajeDe(e))
      setEnviando(false)
    }
  }

  const campo = (k) => ({ value: empresa[k], onChange: (e) => setEmpresa((s) => ({ ...s, [k]: e.target.value })) })

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Escritorio: panel de marca */}
      <aside className="relative hidden flex-col overflow-hidden bg-side p-12 text-side-ink lg:flex xl:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(0_122_255/0.22),transparent_60%)]" />
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${PUNTOS}`} />
        <Logo oscuro className="relative" />
        <div className="relative my-auto py-12">
          <h1 className="max-w-lg text-[40px] leading-[1.1] font-bold tracking-tight text-balance xl:text-[44px]">
            Controla el agua, la energía y los materiales de tu empresa.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-side-muted">
            Detecta el desperdicio a tiempo y míralo en pesos, antes de que llegue la factura.
          </p>
          <div className="mt-9">
            <VistaPrevia />
          </div>
        </div>
        <p className="relative text-xs text-side-muted">{PIE}</p>
      </aside>

      <main className="relative flex min-h-screen flex-col bg-canvas px-5 py-6 sm:px-10 lg:min-h-0 lg:justify-center lg:py-12">
        <BotonTema className="absolute top-4 right-4 text-muted hover:bg-line hover:text-ink sm:right-8 lg:top-6" />
        <Logo className="lg:hidden" />

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pt-10 pb-24 lg:flex-none lg:py-0">
          <h2 className="rise text-[28px] leading-tight font-bold tracking-tight lg:text-[32px]">
            {modo === 'entrar' ? 'Te damos la bienvenida' : 'Registra tu empresa'}
          </h2>
          <p className="mt-2 text-[15px] text-muted">
            {modo === 'entrar'
              ? 'Inicia sesión con tu cuenta de Google para entrar.'
              : 'Tu cuenta de Google quedará como administrador de la empresa.'}
          </p>

          <div className="mt-7">
            <Segmentado
              completo
              fondo="bg-ink/[0.06]"
              etiqueta="Acción"
              valor={modo}
              onChange={(v) => {
                setModo(v)
                setError('')
              }}
              opciones={[
                { valor: 'entrar', etiqueta: 'Iniciar sesión', icono: ShieldCheck },
                { valor: 'registro', etiqueta: 'Registrar empresa', icono: Building2 },
              ]}
            />
          </div>

          {modo === 'registro' && (
            <div className="mt-6 space-y-4">
              <Field label="NIT">{(id) => <Input id={id} placeholder="900123456-7" autoComplete="off" {...campo('nit')} />}</Field>
              <Field label="Razón social">
                {(id) => <Input id={id} placeholder="Mi Empresa S.A.S." autoComplete="organization" {...campo('razon_social')} />}
              </Field>
              <Field label="Sector" hint="Opcional">
                {(id) => <Input id={id} placeholder="Confección, alimentos, manufactura" {...campo('sector')} />}
              </Field>
            </div>
          )}

          {error && (
            <div className="mt-5">
              <Aviso tono="crit">{error}</Aviso>
            </div>
          )}

          <div ref={caja} style={{ colorScheme: 'light' }} className={`mt-6 flex justify-center ${enviando ? 'pointer-events-none opacity-60' : ''}`}>
            {CLIENT_ID ? (
              <GoogleLogin
                key={tema}
                onSuccess={alRecibirCredencial}
                onError={() => setError('No se pudo completar el acceso con Google. Inténtalo de nuevo.')}
                text={modo === 'entrar' ? 'signin_with' : 'signup_with'}
                locale="es"
                theme={tema === 'oscuro' ? 'filled_black' : 'outline'}
                shape="pill"
                size="large"
                width={String(ancho)}
              />
            ) : (
              <Aviso tono="warn" titulo="Falta configurar Google">
                Define VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend y reinicia el servidor.
              </Aviso>
            )}
          </div>

          <p className="mt-6 text-center text-[13px] leading-relaxed text-muted">
            {modo === 'entrar'
              ? 'Solo pueden entrar las cuentas que el administrador de tu empresa haya registrado.'
              : 'Al registrarte creas la empresa y quedas como su administrador.'}
          </p>
        </div>

        <p className="text-center text-xs text-muted lg:hidden">{PIE}</p>
      </main>
    </div>
  )
}
