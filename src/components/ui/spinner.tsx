import './spinner.css';

interface SpinnerProps {
  label?: string;
  decorative?: boolean;
}

export function Spinner({ label = 'Carregando', decorative = false }: SpinnerProps) {
  return decorative ? (
    <span aria-hidden="true" className="spinner" />
  ) : (
    <span role="status" aria-label={label} className="spinner" />
  );
}
