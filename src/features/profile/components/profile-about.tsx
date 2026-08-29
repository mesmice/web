import type { PrivateUser } from '../../../lib/types/auth.js'
import './profile-section.css'

type ProfileAboutProps = Pick<PrivateUser, 'bio'>

export function ProfileAbout({ bio }: ProfileAboutProps) {
  const normalizedBio = bio?.trim()

  return (
    <section className="profile-section" aria-labelledby="profile-about-title">
      <h2 id="profile-about-title">Sobre</h2>
      <p className={normalizedBio ? undefined : 'profile-section__empty'}>
        {normalizedBio || 'Nenhuma bio adicionada.'}
      </p>
    </section>
  )
}
