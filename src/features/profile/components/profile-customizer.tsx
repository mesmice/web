import { useState, type CSSProperties } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Textarea } from '../../../components/ui/textarea.js';
import type { PublicUser } from '../../../lib/types/auth.js';
import type { ProfileMediaKind } from '../api/profile-media-endpoints.js';
import {
  isHexColor,
  normalizeHexColor,
  type NicknameMode,
  type NicknameTheme,
  type ProfileThemeColors
} from '../profile-theme.js';
import { ProfileLinks } from './profile-links.js';
import './profile-customizer.css';

const PROFILE_PRESETS = [
  { name: 'Lilás', primary: '#8B5CF6', secondary: '#D8CCFF' },
  { name: 'Rosa', primary: '#BE185D', secondary: '#FBCFE8' },
  { name: 'Violeta', primary: '#7C4DFF', secondary: '#C5B4FF' },
  { name: 'Azul', primary: '#1D4ED8', secondary: '#93C5FD' },
  { name: 'Verde', primary: '#166534', secondary: '#86EFAC' },
  { name: 'Dourado', primary: '#B7791F', secondary: '#F7D78A' },
  { name: 'Laranja', primary: '#C2410C', secondary: '#FED7AA' },
  { name: 'Rosé', primary: '#C94F6D', secondary: '#F2A8B9' }
] as const;

interface ColorControlProps {
  id: string;
  label: string;
  value: string;
  confirmedValue: string;
  disabled?: boolean;
  onPreview(value: string): void;
  onConfirm(value: string): void;
  onCancel(): void;
}

function ColorControl({
  id,
  label,
  value,
  confirmedValue,
  disabled = false,
  onPreview,
  onConfirm,
  onCancel
}: ColorControlProps) {
  const [hexValue, setHexValue] = useState(confirmedValue);
  const normalizedDraft = isHexColor(hexValue) ? normalizeHexColor(hexValue) : null;
  const hasPendingChange = normalizedDraft !== null && normalizedDraft !== confirmedValue;
  const hasError = hexValue.trim().length > 0 && normalizedDraft === null;

  function previewColor(nextColor: string) {
    const normalizedColor = normalizeHexColor(nextColor);
    setHexValue(normalizedColor);
    onPreview(normalizedColor);
  }

  return (
    <div className="profile-customizer__color-control">
      <label htmlFor={`${id}-hex`} className="profile-customizer__field-label">
        {label}
      </label>
      <div className="profile-customizer__controls">
        <label className="profile-customizer__picker-label">
          <span className="visually-hidden">Escolher {label}</span>
          <input
            type="color"
            value={value}
            disabled={disabled}
            aria-label={`Escolher ${label}`}
            onInput={(event) => previewColor(event.currentTarget.value)}
            onChange={(event) => previewColor(event.currentTarget.value)}
          />
        </label>
        <Input
          id={`${id}-hex`}
          value={hexValue}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          inputMode="text"
          error={hasError}
          disabled={disabled}
          aria-label={`${label} hexadecimal`}
          aria-describedby={hasError ? `${id}-error` : undefined}
          onBlur={() => {
            if (normalizedDraft) setHexValue(normalizedDraft);
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setHexValue(nextValue);
            if (isHexColor(nextValue)) onPreview(normalizeHexColor(nextValue));
          }}
        />
      </div>
      {hasError ? (
        <span id={`${id}-error`} className="profile-customizer__field-error" role="alert">
          Use um hexadecimal com 6 caracteres, por exemplo #8B5CF6.
        </span>
      ) : null}
      <div className="profile-customizer__color-actions" aria-live="polite">
        <Button
          type="button"
          variant="ghost"
          aria-label={`Cancelar ${label}`}
          disabled={disabled || !hasPendingChange}
          onClick={() => {
            setHexValue(confirmedValue);
            onCancel();
          }}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          aria-label={`Confirmar ${label}`}
          disabled={disabled || !hasPendingChange}
          onClick={() => {
            if (!normalizedDraft) return;
            setHexValue(normalizedDraft);
            onConfirm(normalizedDraft);
          }}
        >
          Confirmar cor
        </Button>
      </div>
    </div>
  );
}

interface ProfileCustomizerProps {
  displayName: string;
  bio: PublicUser['bio'];
  links: PublicUser['externalLinks'];
  profileTheme: ProfileThemeColors;
  confirmedProfileTheme: ProfileThemeColors;
  nicknameTheme: NicknameTheme;
  confirmedNicknameTheme: NicknameTheme;
  isSaving?: boolean;
  saveError?: string | null;
  onDisplayNameChange(value: string): void;
  onBioChange(value: string): void;
  onProfileThemeChange(theme: ProfileThemeColors): void;
  onProfileThemeConfirm(theme: ProfileThemeColors): void;
  onNicknameThemeChange(theme: NicknameTheme): void;
  onNicknameThemeConfirm(theme: NicknameTheme): void;
  onSaveLinks?: (links: PublicUser['externalLinks']) => Promise<void>;
  onEditMedia?: (kind: ProfileMediaKind) => void;
  onReset(): void;
  onCancel(): void;
  onSave(): void;
}

export function ProfileCustomizer({
  displayName,
  bio,
  links,
  profileTheme,
  confirmedProfileTheme,
  nicknameTheme,
  confirmedNicknameTheme,
  isSaving = false,
  saveError = null,
  onDisplayNameChange,
  onBioChange,
  onProfileThemeChange,
  onProfileThemeConfirm,
  onNicknameThemeChange,
  onNicknameThemeConfirm,
  onSaveLinks,
  onEditMedia,
  onReset,
  onCancel,
  onSave
}: ProfileCustomizerProps) {
  const previewProfileColor = (key: keyof ProfileThemeColors, value: string) =>
    onProfileThemeChange({ ...profileTheme, [key]: value });
  const confirmProfileColor = (key: keyof ProfileThemeColors, value: string) => {
    const confirmedTheme = { ...confirmedProfileTheme, [key]: value };
    onProfileThemeChange(confirmedTheme);
    onProfileThemeConfirm(confirmedTheme);
  };
  const previewNickname = (values: Partial<NicknameTheme>) =>
    onNicknameThemeChange({ ...nicknameTheme, ...values });
  const confirmNicknameColor = (key: 'primary' | 'secondary', value: string) => {
    const confirmedTheme = { ...confirmedNicknameTheme, [key]: value };
    onNicknameThemeChange(confirmedTheme);
    onNicknameThemeConfirm(confirmedTheme);
  };
  const applyProfilePreset = (preset: ProfileThemeColors) => {
    onProfileThemeChange(preset);
    onProfileThemeConfirm(preset);
  };
  const nicknamePreviewStyle =
    nicknameTheme.mode === 'gradient'
      ? {
          backgroundImage: `linear-gradient(90deg, ${nicknameTheme.primary}, ${nicknameTheme.secondary})`
        }
      : { color: nicknameTheme.primary };

  return (
    <aside className="profile-customizer" aria-labelledby="profile-customizer-title">
      <header className="profile-customizer__header">
        <h2 id="profile-customizer-title">Editar perfil</h2>
        <p>
          Ajuste as informações e a aparência. O card ao lado acompanha as alterações antes de
          guardar.
        </p>
      </header>

      <section
        className="profile-customizer__section"
        aria-labelledby="profile-main-information-title"
      >
        <div className="profile-customizer__section-heading">
          <h3 id="profile-main-information-title">Informações principais</h3>
          <span className="profile-customizer__pending" role="status" aria-label="Prévia local">
            Prévia local
          </span>
        </div>
        <label htmlFor="profile-display-name" className="profile-customizer__field-label">
          Display name / nick
        </label>
        <Input
          id="profile-display-name"
          value={displayName}
          maxLength={32}
          disabled={isSaving}
          onChange={(event) => onDisplayNameChange(event.target.value)}
        />
        <div className="profile-customizer__field-heading">
          <label htmlFor="profile-bio" className="profile-customizer__field-label">
            Bio
          </label>
          <span>{bio?.length ?? 0}/190</span>
        </div>
        <Textarea
          id="profile-bio"
          value={bio ?? ''}
          maxLength={190}
          rows={4}
          disabled={isSaving}
          placeholder="Fale um pouco sobre você..."
          onChange={(event) => onBioChange(event.target.value)}
        />
        {onEditMedia ? (
          <div className="profile-customizer__media-actions" aria-label="Imagens do perfil">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onEditMedia('avatar')}
              disabled={isSaving}
            >
              Alterar avatar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onEditMedia('banner')}
              disabled={isSaving}
            >
              Alterar banner
            </Button>
          </div>
        ) : null}
      </section>

      <section
        className="profile-customizer__section"
        aria-labelledby="profile-personalization-title"
      >
        <div className="profile-customizer__section-heading">
          <div>
            <h3 id="profile-personalization-title">Personalização</h3>
            <p>Escolha as cores da superfície e dos detalhes do seu perfil.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="profile-customizer__reset"
            onClick={onReset}
            disabled={isSaving}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Restaurar
          </Button>
        </div>

        <div className="profile-customizer__preset-group">
          <span className="profile-customizer__field-label">Cores prontas</span>
          <div className="profile-customizer__presets" aria-label="Presets de cor do perfil">
            {PROFILE_PRESETS.map((preset) => {
              const selected =
                profileTheme.primary === preset.primary &&
                profileTheme.secondary === preset.secondary;
              return (
                <button
                  key={preset.name}
                  type="button"
                  className="profile-customizer__preset"
                  style={
                    {
                      '--preset-primary': preset.primary,
                      '--preset-secondary': preset.secondary
                    } as CSSProperties
                  }
                  aria-label={`Usar preset ${preset.name}`}
                  aria-pressed={selected}
                  title={preset.name}
                  disabled={isSaving}
                  onClick={() => applyProfilePreset(preset)}
                >
                  <span aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>

        <ColorControl
          key={`profile-primary-${confirmedProfileTheme.primary}`}
          id="profile-primary"
          label="Cor do perfil"
          value={profileTheme.primary}
          confirmedValue={confirmedProfileTheme.primary}
          disabled={isSaving}
          onPreview={(value) => previewProfileColor('primary', value)}
          onConfirm={(value) => confirmProfileColor('primary', value)}
          onCancel={() => onProfileThemeChange(confirmedProfileTheme)}
        />

        <details className="profile-customizer__advanced">
          <summary>Opções avançadas de cor</summary>
          <div className="profile-customizer__advanced-content">
            <ColorControl
              key={`profile-secondary-${confirmedProfileTheme.secondary}`}
              id="profile-secondary"
              label="Cor de apoio"
              value={profileTheme.secondary}
              confirmedValue={confirmedProfileTheme.secondary}
              disabled={isSaving}
              onPreview={(value) => previewProfileColor('secondary', value)}
              onConfirm={(value) => confirmProfileColor('secondary', value)}
              onCancel={() => onProfileThemeChange(confirmedProfileTheme)}
            />
            <fieldset className="profile-customizer__modes">
              <legend>Estilo do nick</legend>
              {(['solid', 'gradient'] as NicknameMode[]).map((mode) => (
                <label key={mode}>
                  <input
                    type="radio"
                    name="nickname-mode"
                    value={mode}
                    checked={nicknameTheme.mode === mode}
                    disabled={isSaving}
                    onChange={() => {
                      const theme = { ...nicknameTheme, mode };
                      onNicknameThemeChange(theme);
                      onNicknameThemeConfirm(theme);
                    }}
                  />
                  {mode === 'solid' ? 'Cor sólida' : 'Gradiente'}
                </label>
              ))}
            </fieldset>
            <ColorControl
              key={`nickname-primary-${confirmedNicknameTheme.primary}`}
              id="nickname-primary"
              label="Cor do nick"
              value={nicknameTheme.primary}
              confirmedValue={confirmedNicknameTheme.primary}
              disabled={isSaving}
              onPreview={(primary) => previewNickname({ primary })}
              onConfirm={(primary) => confirmNicknameColor('primary', primary)}
              onCancel={() => onNicknameThemeChange(confirmedNicknameTheme)}
            />
            {nicknameTheme.mode === 'gradient' ? (
              <ColorControl
                key={`nickname-secondary-${confirmedNicknameTheme.secondary}`}
                id="nickname-secondary"
                label="Segunda cor do nick"
                value={nicknameTheme.secondary}
                confirmedValue={confirmedNicknameTheme.secondary}
                disabled={isSaving}
                onPreview={(secondary) => previewNickname({ secondary })}
                onConfirm={(secondary) => confirmNicknameColor('secondary', secondary)}
                onCancel={() => onNicknameThemeChange(confirmedNicknameTheme)}
              />
            ) : null}
            <div className="profile-customizer__nickname-preview">
              <span>Prévia do nick</span>
              <strong
                className={nicknameTheme.mode === 'gradient' ? 'is-gradient' : undefined}
                style={nicknamePreviewStyle}
              >
                {displayName || 'Seu nome'}
              </strong>
            </div>
          </div>
        </details>
      </section>

      <section
        className="profile-customizer__section profile-customizer__connections"
        aria-label="Editar conexões"
      >
        <ProfileLinks
          links={links}
          isOwner
          onSave={onSaveLinks}
          titleId="profile-editor-links-title"
        />
      </section>

      {saveError ? (
        <p className="profile-customizer__save-error" role="alert">
          {saveError}
        </p>
      ) : null}

      <footer className="profile-customizer__footer">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar alterações'}
        </Button>
      </footer>
    </aside>
  );
}
