export function DmListSkeleton() {
  return (
    <div className="space-y-2 px-3 py-3" role="status" aria-label="Carregando conversas">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-center gap-3 rounded-lg px-1 py-2"
          aria-hidden="true"
        >
          <span className="h-11 w-11 shrink-0 rounded-full bg-[color:var(--color-border-default)]" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/3 rounded bg-[color:var(--color-border-default)]" />
            <span className="block h-2.5 w-1/2 rounded bg-[color:var(--color-border-default)]" />
          </span>
        </div>
      ))}
      <span className="visually-hidden">Carregando conversas...</span>
    </div>
  );
}
