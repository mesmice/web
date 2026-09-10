import { useState, type CSSProperties } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import {
  isHexColor,
  normalizeHexColor,
  type NicknameMode,
  type NicknameTheme,
  type ProfileThemeColors
} from '../profile-theme.js';
import './profile-customizer.css';

const PROFILE_PRESETS = [
  { name: 'Lilás', primary: '#8B5CF6', secondary: '#D8CCFF' },
  { name: 'Azul', primary: '#1D4ED8', secondary: '#93C5FD' },
  { name: 'Rosa', primary: '#BE185D', secondary: '#FBCFE8' },
  { name: 'Verde', primary: '#166534', secondary: '#86EFAC' },
  { name: 'Laranja', primary: '#C2410C', secondary: '#FED7AA' }
] as const;

interface ColorControlProps {
  id: string;
  label: string;
  value: string;
  confirmedValue: string;
  onPreview(value: string): void;
  onConfirm(value: string): void;
  onCancel(): void;
}

function ColorControl({
  id,
  label,
  value,
  confirmedValue,
  onPreview,
  onConfirm,
  onCancel
}: ColorControlProps) {
  const [hexValue, setHexValue] = useState(confirmedValue);

  function previewColor(nextColor: string) {
    const normalizedColor = normalizeHexColor(nextColor);
    setHexValue(normalizedColor);
    onPreview(normalizedColor);
  }

  const normalizedDraft = isHexColor(hexValue) ? normalizeHexColor(hexValue) : null;
  const hasPendingChange = normalizedDraft !== null && normalizedDraft !== confirmedValue;

  return (
    <div className="profile-customizer__color-control">
      <label htmlFor={`${id}-hex`} className="profile-customizer__color-label">
        {label}
      </label>
      <div className="profile-customizer__controls">
        <label className="profile-customizer__picker-label" aria-label={`Escolher ${label}`}>
          <input
            type="color"
            value={value}
            onInput={(event) => previewColor(event.currentTarget.value)}
            onChange={(event) => previewColor(event.currentTarget.value)}
          />
        </label>
        <Input
          id={`${id}-hex`}
          value={hexValue}
          maxLength={7}
          spellCheck={false}
          aria-label={`${label} hexadecimal`}
          onChange={(event) => {
            const nextValue = event.target.value;
            setHexValue(nextValue);
            if (isHexColor(nextValue)) onPreview(normalizeHexColor(nextValue));
          }}
        />
      </div>
      <div className="profile-customizer__color-actions" aria-live="polite">
        <button
          type="button"
          className="profile-customizer__color-cancel"
          aria-label={`Cancelar ${label}`}
          disabled={!hasPendingChange}
          onClick={() => {
            setHexValue(confirmedValue);
            onCancel();
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="profile-customizer__color-confirm"
          aria-label={`Confirmar ${label}`}
          disabled={!hasPendingChange}
          onClick={() => normalizedDraft && onConfirm(normalizedDraft)}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}

interface ProfileCustomizerProps {
  displayName: string;
  profileTheme: ProfileThemeColors;
  confirmedProfileTheme: ProfileThemeColors;
  nicknameTheme: NicknameTheme;
  confirmedNicknameTheme: NicknameTheme;
  onProfileThemeChange(theme: ProfileThemeColors): void;
  onProfileThemeConfirm(theme: ProfileThemeColors): void;
  onNicknameThemeChange(theme: NicknameTheme): void;
  onNicknameThemeConfirm(theme: NicknameTheme): void;
  onReset(): void;
}

export function ProfileCustomizer({
  displayName,
  profileTheme,
  confirmedProfileTheme,
  nicknameTheme,
  confirmedNicknameTheme,
  onProfileThemeChange,
  onProfileThemeConfirm,
  onNicknameThemeChange,
  onNicknameThemeConfirm,
  onReset
}: ProfileCustomizerProps) {
  const previewProfileColor = (key: keyof ProfileThemeColors, value: string) =>
    onProfileThemeChange({ ...profileTheme, [key]: value });
  const confirmProfileColor = (key: keyof ProfileThemeColors, value: string) => {
    const confirmedTheme = { ...confirmedProfileTheme, [key]: value };
    onProfileThemeConfirm(confirmedTheme);
  };
  const previewNickname = (values: Partial<NicknameTheme>) =>
    onNicknameThemeChange({ ...nicknameTheme, ...values });
  const confirmNicknameColor = (key: 'primary' | 'secondary', value: string) => {
    const confirmedTheme = { ...confirmedNicknameTheme, [key]: value };
    onNicknameThemeConfirm(confirmedTheme);
  };
  const applyProfilePreset = (preset: ProfileThemeColors) => {
    onProfileThemeChange(preset);
    onProfileThemeConfirm(preset);
  };
  const nicknamePreviewStyle =
    nicknameTheme.mode === 'gradient'
      ? { backgroundImage: `linear-gradient(90deg, ${nicknameTheme.primary}, ${nicknameTheme.secondary})` }
      : { color: nicknameTheme.primary };

  return (
    <aside className="profile-customizer" aria-labelledby="profile-customizer-title">
      <h2 id="profile-customizer-title">Personalizar perfil</h2>
      <p className="profile-customizer__notice" role="note">
        As alterações abaixo são apenas uma pré-visualização local nesta etapa.
      </p>

      <section className="profile-customizer__section" aria-labelledby="profile-theme-title">
        <h3 id="profile-theme-title">Tema do perfil</h3>
        <ColorControl
          key={`profile-primary-${confirmedProfileTheme.primary}`}
          id="profile-primary"
          label="Cor principal"
          value={profileTheme.primary}
          confirmedValue={confirmedProfileTheme.primary}
          onPreview={(value) => previewProfileColor('primary', value)}
          onConfirm={(value) => confirmProfileColor('primary', value)}
          onCancel={() => onProfileThemeChange(confirmedProfileTheme)}
        />
        <ColorControl
          key={`profile-secondary-${confirmedProfileTheme.secondary}`}
          id="profile-secondary"
          label="Cor secundária"
          value={profileTheme.secondary}
          confirmedValue={confirmedProfileTheme.secondary}
          onPreview={(value) => previewProfileColor('secondary', value)}
          onConfirm={(value) => confirmProfileColor('secondary', value)}
          onCancel={() => onProfileThemeChange(confirmedProfileTheme)}
        />
        <div className="profile-customizer__presets" aria-label="Presets de tema do perfil">
          {PROFILE_PRESETS.map((preset) => {
            const selected =
              profileTheme.primary === preset.primary && profileTheme.secondary === preset.secondary;
            return (
              <button
                key={preset.name}
                type="button"
                className="profile-customizer__preset"
                style={{
                  '--preset-primary': preset.primary,
                  '--preset-secondary': preset.secondary
                } as CSSProperties}
                aria-label={`Usar preset ${preset.name}`}
                aria-pressed={selected}
                onClick={() => applyProfilePreset(preset)}
              />
            );
          })}
        </div>
        <div
          className="profile-customizer__theme-preview"
          aria-label={`Preview do tema ${profileTheme.primary} e ${profileTheme.secondary}`}
          style={{
            '--preview-primary': profileTheme.primary,
            '--preview-secondary': profileTheme.secondary
          } as CSSProperties}
        />
      </section>

      <section className="profile-customizer__section" aria-labelledby="nickname-theme-title">
        <h3 id="nickname-theme-title">Nick</h3>
        <fieldset className="profile-customizer__modes">
          <legend>Estilo</legend>
          {(['solid', 'gradient'] as NicknameMode[]).map((mode) => (
            <label key={mode}>
              <input
                type="radio"
                name="nickname-mode"
                value={mode}
                checked={nicknameTheme.mode === mode}
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
          label="Cor 1"
          value={nicknameTheme.primary}
          confirmedValue={confirmedNicknameTheme.primary}
          onPreview={(primary) => previewNickname({ primary })}
          onConfirm={(primary) => confirmNicknameColor('primary', primary)}
          onCancel={() => onNicknameThemeChange(confirmedNicknameTheme)}
        />
        {nicknameTheme.mode === 'gradient' ? (
          <ColorControl
            key={`nickname-secondary-${confirmedNicknameTheme.secondary}`}
            id="nickname-secondary"
            label="Cor 2"
            value={nicknameTheme.secondary}
            confirmedValue={confirmedNicknameTheme.secondary}
            onPreview={(secondary) => previewNickname({ secondary })}
            onConfirm={(secondary) => confirmNicknameColor('secondary', secondary)}
            onCancel={() => onNicknameThemeChange(confirmedNicknameTheme)}
          />
        ) : null}
        <div className="profile-customizer__nickname-preview">
          <span>Preview</span>
          <strong
            className={nicknameTheme.mode === 'gradient' ? 'is-gradient' : undefined}
            style={nicknamePreviewStyle}
          >
            {displayName}
          </strong>
        </div>
      </section>

      <Button
        type="button"
        variant="secondary"
        className="profile-customizer__reset"
        onClick={onReset}
      >
        <RotateCcw size={14} aria-hidden="true" />
        Restaurar padrão
      </Button>
    </aside>
  );
}
