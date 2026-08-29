import type { ExternalLink } from '../../../lib/types/auth.js'
import './profile-section.css'

interface ProfileLinksProps {
  links: ExternalLink[]
}

export function ProfileLinks({ links }: ProfileLinksProps) {
  return (
    <section className="profile-section" aria-labelledby="profile-links-title">
      <h2 id="profile-links-title">Links</h2>
      {links.length > 0 ? (
        <ul className="profile-links">
          {links.map((link) => (
            <li key={`${link.label}-${link.url}`}>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="profile-section__empty">Nenhum link adicionado.</p>
      )}
    </section>
  )
}
