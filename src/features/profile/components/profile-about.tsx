import type { PrivateUser } from '../../../lib/types/auth.js'
import './profile-section.css'

type ProfileAboutProps = Pick<PrivateUser, 'bio'>

export function ProfileAbout({ bio }: ProfileAboutProps) {
  return (
    <section className="profile-section" aria-labelledby="profile-about-title">
      <h2 id="profile-about-title">Sobre</h2>
      <p className={bio ? undefined : 'profile-section__empty'}>
        {bio ?? 'Nenhuma bio adicionada.'}
      </p>
    </section>
  )
}
