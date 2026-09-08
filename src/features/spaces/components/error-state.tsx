interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <p
      className="max-w-[420px] rounded-lg bg-[color:var(--color-danger-soft)] px-3.5 py-3 text-sm text-[color:var(--color-danger)]"
      role="alert"
    >
      {message}
    </p>
  );
}
