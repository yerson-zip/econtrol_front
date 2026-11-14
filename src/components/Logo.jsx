export function Logo({ oscuro = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-brand" />
        <path d="M16 6.5c3.6 4.2 5.5 7.1 5.5 10a5.5 5.5 0 0 1-11 0c0-2.9 1.9-5.8 5.5-10Z" fill="#fff" />
      </svg>
      <span className={`text-[17px] font-semibold tracking-tight ${oscuro ? 'text-side-ink' : 'text-ink'}`}>
        EcoControl
      </span>
    </div>
  )
}
