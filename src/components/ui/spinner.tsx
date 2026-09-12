import './spinner.css'

export function Spinner({ label = 'Carregando' }: { label?: string }) {
  return <span role="status" aria-label={label} className="spinner" />
}
