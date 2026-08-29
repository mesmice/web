import type { ReactNode } from 'react'
import './profile-shell.css'

interface ProfileShellProps {
  children: ReactNode
}

export function ProfileShell({ children }: ProfileShellProps) {
  return (
    <section className="profile-shell" aria-labelledby="profile-title">
      {children}
    </section>
  )
}
