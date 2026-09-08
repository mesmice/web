import { useState } from 'react';
import type { ChangeEvent, FormEvent, PointerEvent } from 'react';
import { Check, ImagePlus, Mail, Smartphone, Upload, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register } from '../../lib/api/endpoints.js';
import { ApiRequestError } from '../../lib/api/client.js';
import { applyAuthenticatedSession } from '../../lib/auth/session.js';
import { Spinner } from '../../components/ui/spinner.js';
import { AuthBackdrop } from '../../components/ui/auth-backdrop.js';
import { Input } from '../../components/ui/input.js';
import { Textarea } from '../../components/ui/textarea.js';
import { Checkbox } from '../../components/ui/checkbox.js';
import './register-page.css';

const PASSWORD_MIN_LENGTH = 10;

const BRAND = {
  purple: '#693de9',
  lilac: '#cabeff',
  dark: '#2b1861',
  muted: '#66568d'
} as const;
const STEPS = ['Conta', 'Perfil', 'Interesses', 'Revisão'] as const;
const INTERESTS = [
  'Tecnologia',
  'Programação',
  'Games',
  'Música',
  'Filmes e séries',
  'Design',
  'Arte',
  'Futebol',
  'Negócios',
  'Ciência',
  'Anime',
  'Memes',
  'Fotografia',
  'Educação'
] as const;
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];
const YEARS = Array.from({ length: 100 }, (_, index) =>
  String(new Date().getFullYear() - 13 - index)
);
const PHONE_COUNTRIES = [
  { name: 'Brasil', code: '+55', id: 'BR' },
  { name: 'Angola', code: '+244', id: 'AO' },
  { name: 'Portugal', code: '+351', id: 'PT' },
  { name: 'EUA', code: '+1', id: 'US' },
  { name: 'Itália', code: '+39', id: 'IT' },
  { name: 'Reino Unido', code: '+44', id: 'GB' }
] as const;
const COLORS = [
  { name: 'Roxo principal', value: BRAND.purple },
  { name: 'Lilás', value: BRAND.lilac },
  { name: 'Azul claro', value: '#b8d7ff' },
  { name: 'Roxo escuro', value: BRAND.dark }
];
const ABOUT_MAX_LENGTH = 190;

type ContactMethod = 'email' | 'phone';
type Gender = 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_responder';
type RegistrationData = {
  name: string;
  username: string;
  about: string;
  contact: string;
  phoneCountry: (typeof PHONE_COUNTRIES)[number]['id'];
  contactMethod: ContactMethod;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  birthDate: string;
  gender: Gender | '';
  password: string;
  confirmPassword: string;
  profileColor: string;
  avatarUrl: string;
  avatarFileName: string;
  avatarMimeType: string;
  interests: string[];
  termsAccepted: boolean;
};

const optionClass =
  'rounded-lg border px-4 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#cabeff]';

function WaveText({ children }: { children: string }) {
  return (
    <span className="wave-text">
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {children.split('').map((character, index) => (
          <span key={`${character}-${index}`} style={{ animationDelay: `${index * 35}ms` }}>
            {character === ' ' ? '\u00a0' : character}
          </span>
        ))}
      </span>
    </span>
  );
}

function FieldError() {
  return (
    <span className="mt-1 block text-xs font-bold text-red-600">
      Preencha este campo para continuar.
    </span>
  );
}

function formatPhone(value: string, country: RegistrationData['phoneCountry']) {
  const digits = value.replace(/\D/g, '');
  if (country === 'BR') {
    const limited = digits.slice(0, 11);
    if (limited.length <= 2) return limited;
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
  return digits
    .slice(0, 15)
    .replace(/(\d{3})(?=\d)/g, '$1 ')
    .trim();
}

function isUnderage(birthDate: string) {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayHasNotHappened =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (birthdayHasNotHappened) age -= 1;
  return age < 14;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav
      aria-label={`Etapa ${currentStep + 1} de ${STEPS.length}`}
      className="register-progress mb-9"
    >
      {STEPS.map((label, index) => (
        <div
          key={label}
          className={`register-progress__step ${index <= currentStep ? 'register-progress__step--done' : ''} ${index === currentStep ? 'register-progress__step--current' : ''}`}
        >
          <span className="register-progress__dot">
            {index < currentStep ? <Check size={14} strokeWidth={3} /> : index + 1}
          </span>
          <span className="register-progress__label">{label}</span>
        </div>
      ))}
    </nav>
  );
}

function AccountStep({
  data,
  showErrors,
  onChange,
  onMethodChange,
  onPhoneCountryChange,
  onTermsChange
}: {
  data: RegistrationData;
  showErrors: boolean;
  onChange: (
    field: 'name' | 'username' | 'contact' | 'password' | 'confirmPassword',
    value: string
  ) => void;
  onMethodChange: (method: ContactMethod) => void;
  onPhoneCountryChange: (country: RegistrationData['phoneCountry']) => void;
  onTermsChange: (accepted: boolean) => void;
}) {
  const contactLabel =
    data.contactMethod === 'email' ? 'Seu melhor e-mail' : 'Seu número de celular';
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#2b1861]">Vamos começar pelo básico</h2>
        <p className="mt-1 text-sm text-[#66568d]">Esses dados ajudam a manter sua conta segura.</p>
      </div>
      <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
        Como podemos chamar você?
        <Input
          error={showErrors && !data.name.trim()}
          value={data.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder="Seu nome"
          autoComplete="name"
          required
        />
        {showErrors && !data.name.trim() && <FieldError />}
      </label>
      <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
        Nome de usuário
        <Input
          error={showErrors && !data.username.trim()}
          value={data.username}
          onChange={(event) => onChange('username', event.target.value.trim().toLowerCase())}
          placeholder="como_te_encontram_no_mesmice"
          autoComplete="username"
          required
        />
        {showErrors && !data.username.trim() && <FieldError />}
      </label>
      <div>
        <span className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
          Como você prefere entrar?
        </span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={data.contactMethod === 'email'}
            onClick={() => onMethodChange('email')}
            className={`${optionClass} flex items-center justify-center gap-2 ${data.contactMethod === 'email' ? 'border-[#693de9] bg-[#cabeff]/35 text-[#2b1861]' : 'border-[#cabeff] bg-white text-[#66568d]'}`}
          >
            <Mail size={16} /> E-mail
          </button>
          <button
            type="button"
            disabled
            aria-pressed={data.contactMethod === 'phone'}
            title="Cadastro por celular ainda não está disponível — use e-mail."
            className={`${optionClass} flex cursor-not-allowed items-center justify-center gap-2 border-[#cabeff] bg-white text-[#66568d] opacity-50`}
          >
            <Smartphone size={16} /> Celular
          </button>
        </div>
        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
          <span className="sr-only">{contactLabel}</span>
          {data.contactMethod === 'phone' && (
            <select
              aria-label="País do celular"
              value={data.phoneCountry}
              onChange={(event) =>
                onPhoneCountryChange(event.target.value as RegistrationData['phoneCountry'])
              }
              className="mt-2 w-full rounded-lg border border-[#cabeff] bg-white px-3 py-3 text-sm text-[#2b1861] outline-none transition focus:border-[#693de9] focus:ring-2 focus:ring-[#cabeff]"
            >
              {PHONE_COUNTRIES.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
          )}
          <Input
            error={showErrors && !data.contact.trim()}
            value={data.contact}
            onChange={(event) =>
              onChange(
                'contact',
                data.contactMethod === 'phone'
                  ? formatPhone(event.target.value, data.phoneCountry)
                  : event.target.value
              )
            }
            type={data.contactMethod === 'email' ? 'email' : 'tel'}
            inputMode={data.contactMethod === 'phone' ? 'numeric' : undefined}
            placeholder={data.contactMethod === 'email' ? 'voce@exemplo.com' : '(11) 99999-9999'}
            autoComplete={data.contactMethod === 'email' ? 'email' : 'tel'}
            required
          />
          {showErrors && !data.contact.trim() && <FieldError />}
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
          Crie uma senha
          <Input
            error={showErrors && data.password.trim().length < PASSWORD_MIN_LENGTH}
            value={data.password}
            onChange={(event) => onChange('password', event.target.value)}
            type="password"
            placeholder={`Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
          {showErrors && data.password.trim().length < PASSWORD_MIN_LENGTH && (
            <span className="mt-1 block text-xs font-bold text-red-600">
              A senha deve ter pelo menos {PASSWORD_MIN_LENGTH} caracteres.
            </span>
          )}
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
          Confirme sua senha
          <Input
            error={showErrors && data.password !== data.confirmPassword}
            value={data.confirmPassword}
            onChange={(event) => onChange('confirmPassword', event.target.value)}
            type="password"
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
          {showErrors && data.password !== data.confirmPassword && (
            <span className="mt-1 block text-xs font-bold text-red-600">
              As senhas não coincidem.
            </span>
          )}
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm leading-5 text-[#66568d]">
        <Checkbox
          type="checkbox"
          checked={data.termsAccepted}
          onChange={(event) => onTermsChange(event.target.checked)}
          className="mt-1 shrink-0"
          required
        />
        <span>Concordo com os termos de uso e a política de privacidade.</span>
      </label>
      {showErrors && !data.termsAccepted && <FieldError />}
    </div>
  );
}

function BirthDateFields({
  data,
  showErrors,
  onBirthDateChange
}: {
  data: RegistrationData;
  showErrors: boolean;
  onBirthDateChange: (part: 'day' | 'month' | 'year', value: string) => void;
}) {
  const selectClass =
    'w-full rounded-lg border border-[#cabeff] bg-white px-3 py-3 text-sm text-[#2b1861] outline-none transition focus:border-[#693de9] focus:ring-2 focus:ring-[#cabeff]';
  const underage = isUnderage(data.birthDate);
  return (
    <fieldset className="mt-6 block">
      <legend className="text-xs font-bold uppercase tracking-wide text-[#2b1861]">
        Data de nascimento
      </legend>
      <div className="mt-2 grid grid-cols-[0.7fr_1.5fr_1fr] gap-2">
        <select
          aria-label="Dia de nascimento"
          value={data.birthDay}
          onChange={(event) => onBirthDateChange('day', event.target.value)}
          className={selectClass}
          required
        >
          <option value="">Dia</option>
          {Array.from({ length: 31 }, (_, index) => (
            <option key={index} value={String(index + 1).padStart(2, '0')}>
              {index + 1}
            </option>
          ))}
        </select>
        <select
          aria-label="Mês de nascimento"
          value={data.birthMonth}
          onChange={(event) => onBirthDateChange('month', event.target.value)}
          className={selectClass}
          required
        >
          <option value="">Mês</option>
          {MONTHS.map((month, index) => (
            <option key={month} value={String(index + 1).padStart(2, '0')}>
              {month}
            </option>
          ))}
        </select>
        <select
          aria-label="Ano de nascimento"
          value={data.birthYear}
          onChange={(event) => onBirthDateChange('year', event.target.value)}
          className={selectClass}
          required
        >
          <option value="">Ano</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-[#8e7dbd]">Usamos só para confirmar sua idade.</p>
      {showErrors && !data.birthDate && <FieldError />}
      {underage && (
        <p className="mt-2 rounded-lg bg-[#eeeaff] px-3 py-2 text-xs font-bold text-[#2b1861]">
          Você precisa ter pelo menos 14 anos para criar uma conta.
        </p>
      )}
    </fieldset>
  );
}

function ProfileStep({
  data,
  showErrors,
  onColorChange,
  onAvatarChange,
  onAvatarRemove,
  onAboutChange,
  onGenderChange,
  onBirthDateChange,
  avatarPosition,
  onAvatarPositionChange
}: {
  data: RegistrationData;
  showErrors: boolean;
  onColorChange: (color: string) => void;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAvatarRemove: () => void;
  onAboutChange: (about: string) => void;
  onGenderChange: (gender: Gender) => void;
  onBirthDateChange: (part: 'day' | 'month' | 'year', value: string) => void;
  avatarPosition: { x: number; y: number };
  onAvatarPositionChange: (position: { x: number; y: number }) => void;
}) {
  const initial = data.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div>
      <h2 className="text-xl font-bold text-[#2b1861]">Monte seu perfil</h2>
      <p className="mt-1 text-sm text-[#66568d]">
        Escolha uma foto e uma cor. Você já vê o resultado igual vai ficar no seu perfil.
      </p>
      <BirthDateFields data={data} showErrors={showErrors} onBirthDateChange={onBirthDateChange} />
      <fieldset className="mt-6">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#2b1861]">Gênero</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            ['masculino', 'Masculino'],
            ['feminino', 'Feminino'],
            ['outro', 'Outro'],
            ['prefiro_nao_responder', 'Prefiro não responder']
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#cabeff] bg-white px-3 py-3 text-sm text-[#66568d] transition hover:border-[#693de9]"
            >
              <input
                type="radio"
                name="gender"
                className="register-gender__radio"
                checked={data.gender === value}
                onChange={() => onGenderChange(value as Gender)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-6 flex flex-col items-center gap-8 md:flex-row md:items-start">
        <label className="group relative block shrink-0 cursor-pointer">
          <div
            className="relative flex h-40 w-40 touch-none items-center justify-center overflow-hidden rounded-full border-8 border-white text-5xl text-white shadow-xl ring-4 ring-[#cabeff] transition group-hover:scale-[1.02]"
            style={{ backgroundColor: data.profileColor }}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              onAvatarPositionChange({
                x: Math.max(0, Math.min(100, avatarPosition.x + event.movementX / 2)),
                y: Math.max(0, Math.min(100, avatarPosition.y + event.movementY / 2))
              });
            }}
          >
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt="Prévia da foto do perfil"
                className="h-full w-full object-cover"
                style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }}
              />
            ) : (
              <ImagePlus size={38} />
            )}
          </div>
          <span
            className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#693de9] text-white shadow-lg"
            aria-hidden="true"
          >
            <Upload size={18} />
          </span>
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onAvatarChange}
          />
          {data.avatarUrl && (
            <button
              type="button"
              aria-label="Remover foto do perfil"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAvatarRemove();
              }}
              className="absolute -left-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-red-600 text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="w-full">
          <p className="text-xs font-bold uppercase tracking-wide text-[#2b1861]">Cor do perfil</p>
          <p className="mt-1 text-xs text-[#66568d]">
            Toque numa opção para ver como fica no seu perfil.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLORS.map((color) => {
              const isSelected = data.profileColor === color.value;
              return (
                <button
                  type="button"
                  key={color.value}
                  aria-pressed={isSelected}
                  onClick={() => onColorChange(color.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition focus:outline-none focus:ring-4 focus:ring-[#cabeff] ${isSelected ? 'border-[#693de9] bg-[#cabeff]/30' : 'border-[#cabeff]/60 bg-white hover:border-[#693de9]/60'}`}
                >
                  <span
                    className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: color.value }}
                  >
                    {data.avatarUrl ? (
                      <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initial
                    )}
                    {isSelected && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#693de9] text-white">
                        <Check size={11} />
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-bold text-[#2b1861]">{color.name}</span>
                </button>
              );
            })}
          </div>

          <label className="mt-6 block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
            Sobre você <span className="font-normal normal-case text-[#8e7dbd]">(opcional)</span>
            <Textarea
              className="resize-none"
              value={data.about}
              onChange={(event) => onAboutChange(event.target.value.slice(0, ABOUT_MAX_LENGTH))}
              maxLength={ABOUT_MAX_LENGTH}
              placeholder="Conte um pouco sobre você para quem visitar seu perfil..."
            />
          </label>
          <p className="mt-1 text-right text-xs text-[#8e7dbd]">
            {data.about.length}/{ABOUT_MAX_LENGTH}
          </p>
          {data.avatarUrl && (
            <p className="mt-2 text-xs text-[#8e7dbd]">Arraste a foto para escolher o destaque.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InterestsStep({
  selected,
  onToggle
}: {
  selected: string[];
  onToggle: (interest: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#2b1861]">O que te interessa?</h2>
      <p className="mt-1 text-sm text-[#66568d]">
        Escolha alguns temas para personalizar sua Home.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(interest)}
              className={`rounded-xl border-2 px-3 py-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#cabeff] ${isSelected ? 'border-[#693de9] bg-[#cabeff]/35 text-[#2b1861]' : 'border-[#cabeff]/60 bg-white text-[#66568d] hover:border-[#693de9]'}`}
            >
              {interest}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({
  data,
  avatarPosition
}: {
  data: RegistrationData;
  avatarPosition: { x: number; y: number };
}) {
  const initial = data.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div>
      <h2 className="text-xl font-bold text-[#2b1861]">Tudo certo?</h2>
      <p className="mt-1 text-sm text-[#66568d]">É assim que seu perfil vai aparecer no Mesmice.</p>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#2b1861]/10 bg-white shadow-sm">
        <div className="relative">
          <div className="h-20 w-full bg-white" />
          <div className="absolute -bottom-9 left-5">
            <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#693de9] text-2xl font-bold text-white shadow-lg">
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt="Foto do perfil"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }}
                />
              ) : (
                initial
              )}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-12" style={{ backgroundColor: data.profileColor }}>
          <p className="truncate text-base font-bold leading-tight text-[#2b1861]">
            {data.name || 'Seu novo perfil'}
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-[#8e7dbd]">
            @{data.username || 'usuario'}
          </p>
          {data.about && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#66568d]">
              {data.about}
            </p>
          )}
          {data.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-white/60 px-2 py-1 text-xs font-bold text-[#2b1861]"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-[#66568d]">
        Você personalizou seu perfil com nome, usuário{data.about ? ', sobre' : ''} e cor. Ao
        continuar, você concorda com os termos de uso do Mesmice.
      </p>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const submitted = false;
  const [step, setStep] = useState(0);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [showErrors, setShowErrors] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ x: 50, y: 50 });
  const [data, setData] = useState<RegistrationData>({
    name: '',
    username: '',
    about: '',
    contact: '',
    phoneCountry: 'BR',
    contactMethod: 'email',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    birthDate: '',
    gender: '',
    password: '',
    confirmPassword: '',
    profileColor: BRAND.purple,
    avatarUrl: '',
    avatarFileName: '',
    avatarMimeType: '',
    interests: [],
    termsAccepted: false
  });

  function updateAccount(
    field: 'name' | 'username' | 'contact' | 'password' | 'confirmPassword',
    value: string
  ) {
    setData((current) => ({ ...current, [field]: value }));
  }
  function updateBirthDate(part: 'day' | 'month' | 'year', value: string) {
    setData((current) => {
      const next = {
        birthDay: current.birthDay,
        birthMonth: current.birthMonth,
        birthYear: current.birthYear
      };
      next[part === 'day' ? 'birthDay' : part === 'month' ? 'birthMonth' : 'birthYear'] = value;
      return {
        ...current,
        ...next,
        birthDate:
          next.birthYear && next.birthMonth && next.birthDay
            ? `${next.birthYear}-${next.birthMonth}-${next.birthDay}`
            : ''
      };
    });
  }
  function changeContactMethod(contactMethod: ContactMethod) {
    setData((current) => ({ ...current, contactMethod, contact: '' }));
  }
  function changePhoneCountry(phoneCountry: RegistrationData['phoneCountry']) {
    setData((current) => ({
      ...current,
      phoneCountry,
      contact: formatPhone(current.contact, phoneCountry)
    }));
  }
  function updateAbout(about: string) {
    setData((current) => ({ ...current, about }));
  }
  function updateGender(gender: Gender) {
    setData((current) => ({ ...current, gender }));
  }
  function toggleInterest(interest: string) {
    setData((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest]
    }));
  }
  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.addEventListener('load', () =>
      setData((current) => ({
        ...current,
        avatarUrl: String(reader.result),
        avatarFileName: file.name,
        avatarMimeType: file.type
      }))
    );
    reader.readAsDataURL(file);
  }
  function handleAvatarRemove() {
    setData((current) => ({ ...current, avatarUrl: '', avatarFileName: '', avatarMimeType: '' }));
  }
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (result) => {
      applyAuthenticatedSession(
        { accessToken: result.accessToken, refreshToken: result.refreshToken },
        result.user
      );
      navigate('/app');
    }
  });

  const registerError =
    registerMutation.error instanceof ApiRequestError
      ? registerMutation.error.message
      : registerMutation.error
        ? 'Não foi possível criar sua conta agora. Tente novamente.'
        : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accountIsValid =
      data.name.trim() &&
      data.username.trim() &&
      data.contact.trim() &&
      data.contactMethod === 'email' &&
      data.password.trim().length >= PASSWORD_MIN_LENGTH &&
      data.termsAccepted &&
      data.password === data.confirmPassword;
    const profileIsValid = data.birthDate && !isUnderage(data.birthDate);
    if ((step === 0 && !accountIsValid) || (step === 1 && !profileIsValid)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step < STEPS.length - 1) {
      setStepDirection('forward');
      setStep((current) => current + 1);
    } else if (!registerMutation.isPending) {
      registerMutation.mutate({
        email: data.contact.trim(),
        username: data.username.trim(),
        displayName: data.name.trim(),
        password: data.password
      });
    }
  }

  return (
    <div className="auth-page relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#cabeff] px-4 py-8 font-sans">
      <AuthBackdrop />
      <div className="absolute inset-x-0 top-0 h-64 bg-[#693de9]" />
      <main className="relative w-full max-w-2xl rounded-2xl border border-[#2b1861]/10 bg-[#f8f7ff] p-6 shadow-2xl sm:p-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link to="/" aria-label="Mesmice, página inicial">
              <img
                src="/images/auth/logo-v2-darkmode.png"
                alt="Mesmice"
                className="h-12 w-36 object-contain object-left"
              />
            </Link>
            <h1 className="mt-5 text-2xl font-bold text-[#2b1861]">Crie seu cantinho</h1>
            <p className="mt-1 text-sm text-[#66568d]">
              Vamos montar um perfil que tenha a sua cara.
            </p>
          </div>
        </header>
        {submitted ? (
          <section className="py-8 text-center">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-4xl text-white"
              style={{ backgroundColor: data.profileColor }}
            >
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt="Foto do perfil"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }}
                />
              ) : (
                <ImagePlus size={34} />
              )}
            </div>
            <h2 className="text-2xl font-bold text-[#2b1861]">Seu perfil está pronto!</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#66568d]">
              Você escolheu sua cor e sua foto. Agora falta só começar a conversar.
            </p>
            <Link
              to="/"
              className="mt-7 inline-flex rounded-lg bg-[#693de9] px-6 py-3 text-sm font-bold text-white hover:bg-[#2b1861]"
            >
              Entrar no Mesmice
            </Link>
          </section>
        ) : (
          <>
            <StepIndicator currentStep={step} />
            <form noValidate onSubmit={handleSubmit}>
              <div
                key={step}
                className={`register-step-transition register-step-transition--${stepDirection}`}
              >
                {step === 0 && (
                  <AccountStep
                    data={data}
                    showErrors={showErrors}
                    onChange={updateAccount}
                    onMethodChange={changeContactMethod}
                    onPhoneCountryChange={changePhoneCountry}
                    onTermsChange={(accepted) =>
                      setData((current) => ({ ...current, termsAccepted: accepted }))
                    }
                  />
                )}
                {step === 1 && (
                  <ProfileStep
                    data={data}
                    showErrors={showErrors}
                    onColorChange={(profileColor) =>
                      setData((current) => ({ ...current, profileColor }))
                    }
                    onAvatarChange={handleAvatarChange}
                    onAvatarRemove={handleAvatarRemove}
                    onAboutChange={updateAbout}
                    onGenderChange={updateGender}
                    onBirthDateChange={updateBirthDate}
                    avatarPosition={avatarPosition}
                    onAvatarPositionChange={setAvatarPosition}
                  />
                )}
                {step === 2 && (
                  <InterestsStep selected={data.interests} onToggle={toggleInterest} />
                )}
                {step === 3 && <ReviewStep data={data} avatarPosition={avatarPosition} />}
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => {
                    setStepDirection('backward');
                    setStep((current) => current - 1);
                    setShowErrors(false);
                  }}
                  className="rounded-lg border border-[#c7c9d4] bg-[#e2e3e8] px-4 py-3 text-sm font-bold text-[#555968] transition hover:bg-[#d3d5dc] disabled:invisible"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="auth-action-button rounded-lg bg-[#693de9] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#cabeff] transition focus:outline-none focus:ring-4 focus:ring-[#cabeff]"
                >
                  {registerMutation.isPending ? (
                    <Spinner label="Criando conta" />
                  ) : (
                    <WaveText>
                      {step === 0
                        ? 'Criar conta'
                        : step === STEPS.length - 1
                          ? 'Criar meu perfil'
                          : 'Continuar'}
                    </WaveText>
                  )}
                </button>
              </div>
              {registerError && (
                <p role="alert" className="mt-4 text-center text-sm font-bold text-red-600">
                  {registerError}
                </p>
              )}
              <p className="mt-5 text-left text-sm text-[#66568d]">
                Já possui uma conta?{' '}
                <Link to="/login" className="font-bold text-[#693de9] hover:underline">
                  Entrar
                </Link>
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
