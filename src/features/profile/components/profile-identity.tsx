import type { PrivateUser } from '../../../lib/types/auth.js'
import './profile-section.css'

type ProfileIdentityProps = Pick<PrivateUser, 'displayName' | 'username'>

export function ProfileIdentity({ displayName, username }: ProfileIdentityProps) {
  return (
    <section className="profile-section profile-identity" aria-labelledby="profile-title">
      <h1 id="profile-title">{displayName}</h1>
      <p className="profile-identity__username">@{username}</p>
    </section>
  )
}
