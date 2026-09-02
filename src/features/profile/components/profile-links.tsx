import { Camera, ExternalLink as ExternalLinkIcon, GitFork, Globe, Music2 } from 'lucide-react';
import type { ExternalLink } from '../../../lib/types/auth.js';
import './profile-section.css';

interface ProfileLinksProps {
  links: ExternalLink[];
}

function getConnectionIcon(label: string) {
  const normalizedLabel = label.toLocaleLowerCase();
  if (normalizedLabel.includes('github')) return GitFork;
  if (normalizedLabel.includes('instagram')) return Camera;
  if (normalizedLabel.includes('spotify')) return Music2;
  return Globe;
}

export function ProfileLinks({ links }: ProfileLinksProps) {
  if (links.length === 0) return null;

  return (
    <section className="profile-section profile-connections" aria-labelledby="profile-links-title">
      <h2 id="profile-links-title">Conexões</h2>
      <ul className="profile-connections__list">
        {links.map((link) => {
          const ConnectionIcon = getConnectionIcon(link.label);
          return (
            <li key={`${link.label}-${link.url}`}>
              <a href={link.url} target="_blank" rel="noreferrer">
                <span className="profile-connections__icon" aria-hidden="true">
                  <ConnectionIcon size={17} />
                </span>
                <span className="profile-connections__label">{link.label}</span>
                <ExternalLinkIcon size={15} aria-hidden="true" />
                <span className="visually-hidden"> (abre em uma nova aba)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
