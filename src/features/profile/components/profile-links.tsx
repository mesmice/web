import { useState } from 'react';
import { ArrowDown, ArrowUp, Camera, ExternalLink as ExternalLinkIcon, GitFork, Globe, Music2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import type { ExternalLink } from '../../../lib/types/auth.js';
import { getSafeExternalHref, normalizeExternalLinks, PROFILE_LINKS_LIMIT, validateExternalLink, type ExternalLinkErrors } from '../links/profile-links-utils.js';
import './profile-section.css';
import './profile-links.css';

interface ProfileLinksProps {
  links: ExternalLink[];
  isOwner?: boolean;
  onSave?: (links: ExternalLink[]) => Promise<void>;
}

interface EditableLink extends ExternalLink { clientId: string; }
let nextClientId = 0;
function makeEditable(link: ExternalLink = { label: '', url: '' }): EditableLink {
  return { ...link, clientId: `profile-link-${++nextClientId}` };
}

function getConnectionIcon(label: string) {
  const normalizedLabel = label.toLocaleLowerCase();
  if (normalizedLabel.includes('github')) return GitFork;
  if (normalizedLabel.includes('instagram')) return Camera;
  if (normalizedLabel.includes('spotify')) return Music2;
  return Globe;
}

export function ProfileLinks({ links, isOwner = false, onSave }: ProfileLinksProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EditableLink[]>(() => links.map(makeEditable));
  const [errors, setErrors] = useState<Record<string, ExternalLinkErrors>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOwner && links.length === 0) return null;

  const startEditing = () => {
    setDraft(links.length ? links.map(makeEditable) : [makeEditable()]); setErrors({}); setSaveError(null); setSaveSuccess(false); setIsEditing(true);
  };
  const cancelEditing = () => {
    setDraft(links.map(makeEditable)); setErrors({}); setSaveError(null); setSaveSuccess(false); setIsEditing(false);
  };
  const updateDraft = (clientId: string, field: keyof ExternalLink, value: string) => {
    setDraft((current) => current.map((link) => link.clientId === clientId ? { ...link, [field]: value } : link));
    setErrors((current) => ({ ...current, [clientId]: { ...current[clientId], [field]: undefined } }));
    setSaveError(null); setSaveSuccess(false);
  };
  const move = (index: number, offset: -1 | 1) => setDraft((current) => {
    const next = [...current]; const [item] = next.splice(index, 1); next.splice(index + offset, 0, item); return next;
  });
  const save = async () => {
    const nextErrors = Object.fromEntries(draft.map((link) => [link.clientId, validateExternalLink(link)] as const).filter(([, value]) => value.label || value.url));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      await onSave?.(normalizeExternalLinks(draft.map(({ label, url }) => ({ label, url }))));
      setSaveSuccess(true);
      setIsEditing(false);
    } catch {
      setSaveError('Não foi possível salvar os links. Tente novamente.');
    } finally { setIsSaving(false); }
  };

  return (
    <section className="profile-section profile-connections" aria-labelledby="profile-links-title">
      <div className="profile-connections__heading">
        <h2 id="profile-links-title">Conexões</h2>
        {isOwner && !isEditing && links.length ? <button className="profile-links__icon-button" type="button" onClick={startEditing} aria-label="Editar links"><Pencil size={16} aria-hidden="true" /></button> : null}
      </div>
      {isEditing ? (
        <div className="profile-links__editor">
          <ol className="profile-links__fields" aria-label="Links em edição">
            {draft.map((link, index) => {
              const fieldErrors = errors[link.clientId] ?? {};
              return <li key={link.clientId} className="profile-links__field-group">
                <div className="profile-links__field-heading"><span>Link {index + 1}</span><div className="profile-links__item-actions">
                  <button type="button" className="profile-links__icon-button" onClick={() => move(index, -1)} disabled={isSaving || index === 0} aria-label={`Mover link ${index + 1} para cima`}><ArrowUp size={16} aria-hidden="true" /></button>
                  <button type="button" className="profile-links__icon-button" onClick={() => move(index, 1)} disabled={isSaving || index === draft.length - 1} aria-label={`Mover link ${index + 1} para baixo`}><ArrowDown size={16} aria-hidden="true" /></button>
                  <button type="button" className="profile-links__icon-button profile-links__remove" onClick={() => setDraft((current) => current.filter((item) => item.clientId !== link.clientId))} disabled={isSaving} aria-label={`Remover link ${index + 1}`}><Trash2 size={16} aria-hidden="true" /></button>
                </div></div>
                <label htmlFor={`${link.clientId}-label`}>Nome</label>
                <Input id={`${link.clientId}-label`} value={link.label} disabled={isSaving} error={Boolean(fieldErrors.label)} aria-describedby={fieldErrors.label ? `${link.clientId}-label-error` : undefined} onChange={(event) => updateDraft(link.clientId, 'label', event.target.value)} />
                {fieldErrors.label ? <span id={`${link.clientId}-label-error`} className="profile-links__field-error">{fieldErrors.label}</span> : null}
                <label htmlFor={`${link.clientId}-url`}>URL</label>
                <Input id={`${link.clientId}-url`} type="text" inputMode="url" value={link.url} disabled={isSaving} error={Boolean(fieldErrors.url)} aria-describedby={fieldErrors.url ? `${link.clientId}-url-error` : undefined} onChange={(event) => updateDraft(link.clientId, 'url', event.target.value)} />
                {fieldErrors.url ? <span id={`${link.clientId}-url-error`} className="profile-links__field-error">{fieldErrors.url}</span> : null}
              </li>;
            })}
          </ol>
          {draft.length < PROFILE_LINKS_LIMIT ? <Button type="button" variant="ghost" onClick={() => setDraft((current) => [...current, makeEditable()])} disabled={isSaving}><Plus size={16} aria-hidden="true" /> Adicionar outro link</Button> : <p className="profile-links__limit">Limite de 5 links atingido.</p>}
          {saveError ? <p className="profile-links__save-error" role="alert">{saveError}</p> : null}
          {saveSuccess ? <p className="profile-links__save-success" role="status">Links salvos com sucesso.</p> : null}
          <div className="profile-links__editor-actions"><Button type="button" variant="ghost" onClick={cancelEditing} disabled={isSaving}>Cancelar</Button><Button type="button" onClick={() => void save()} disabled={isSaving}>{isSaving ? 'Salvando…' : 'Salvar links'}</Button></div>
        </div>
      ) : <>
        {saveSuccess ? <p className="profile-links__save-success" role="status">Links salvos com sucesso.</p> : null}
        {links.length ? <LinksList links={links} /> : <div className="profile-links__empty"><p>Adicione links para seus projetos e redes.</p><Button type="button" variant="secondary" onClick={startEditing}><Plus size={16} aria-hidden="true" /> Adicionar link</Button></div>}
      </>}
    </section>
  );
}

function LinksList({ links }: { links: ExternalLink[] }) {
  return <ul className="profile-connections__list">{links.map((link, index) => {
    const ConnectionIcon = getConnectionIcon(link.label); const safeHref = getSafeExternalHref(link.url);
    const content = <><span className="profile-connections__icon" aria-hidden="true"><ConnectionIcon size={17} /></span><span className="profile-connections__label">{link.label}</span>{safeHref ? <ExternalLinkIcon size={15} aria-hidden="true" /> : null}</>;
    return <li key={`view-link-${index}`}>{safeHref ? <a href={safeHref} target="_blank" rel="noopener noreferrer">{content}<span className="visually-hidden"> (abre em uma nova aba)</span></a> : <span className="profile-connections__unsafe" title={link.url}>{content}</span>}</li>;
  })}</ul>;
}
