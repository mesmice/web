import { Music2, Play } from 'lucide-react';
import './profile-highlight.css';

export interface ProfileHighlightData {
  title: string;
  artist: string;
  coverUrl: string;
  service: string;
}

interface ProfileHighlightProps {
  highlight?: ProfileHighlightData | null;
}

export function ProfileHighlight({ highlight }: ProfileHighlightProps) {
  if (!highlight) return null;

  return (
    <section className="profile-highlight" aria-labelledby="profile-highlight-title">
      <h2 id="profile-highlight-title">Destaque</h2>
      <article className="profile-highlight__player">
        <img src={highlight.coverUrl} alt="" className="profile-highlight__cover" />
        <div className="profile-highlight__track">
          <strong>{highlight.title}</strong>
          <span>{highlight.artist}</span>
          <span className="profile-highlight__progress" aria-hidden="true">
            <span />
          </span>
        </div>
        <span className="profile-highlight__service">
          <Music2 size={16} aria-hidden="true" />
          {highlight.service}
        </span>
        <span className="profile-highlight__play" aria-hidden="true">
          <Play size={18} fill="currentColor" />
        </span>
      </article>
    </section>
  );
}
