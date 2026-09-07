import type { ExternalLink } from '../../../lib/types/auth.js';

export const PROFILE_LINKS_LIMIT = 5;
export const PROFILE_LINK_LABEL_LIMIT = 32;
export const PROFILE_LINK_URL_LIMIT = 512;

export interface ExternalLinkErrors {
  label?: string;
  url?: string;
}

export function getSafeExternalHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export function validateExternalLink(link: ExternalLink): ExternalLinkErrors {
  const errors: ExternalLinkErrors = {};
  const trimmedLabel = link.label.trim();
  if (!trimmedLabel) errors.label = 'Informe um nome para o link.';
  else if (trimmedLabel.length > PROFILE_LINK_LABEL_LIMIT) errors.label = 'Use no máximo 32 caracteres.';

  if (!link.url) errors.url = 'Informe a URL.';
  else if (link.url.length > PROFILE_LINK_URL_LIMIT) errors.url = 'Use no máximo 512 caracteres.';
  else if (!getSafeExternalHref(link.url)) errors.url = 'Informe uma URL válida.';
  return errors;
}

export function normalizeExternalLinks(links: ExternalLink[]): ExternalLink[] {
  return links.map(({ label, url }) => ({ label: label.trim(), url }));
}
