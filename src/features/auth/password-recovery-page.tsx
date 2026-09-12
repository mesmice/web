import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiRequestError } from '../../lib/api/client.js';
import { requestPasswordReset, resetPassword } from '../../lib/api/endpoints.js';
import { Spinner } from '../../components/ui/spinner.js';
import './login-page.css';
import './password-recovery-page.css';

const inputClass =
  'mt-2 w-full rounded-lg border border-[#cabeff] bg-white px-3 py-3 text-sm text-[#2b1861] outline-none transition placeholder:text-[#8e7dbd] focus:border-[#693de9] focus:ring-2 focus:ring-[#cabeff]';

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-center text-sm font-bold text-red-600">
      {message}
    </p>
  );
}

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const mutation = useMutation({ mutationFn: requestPasswordReset });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!identifier.trim() || mutation.isPending) return;
    mutation.mutate({ identifier: identifier.trim() });
  }

  const errorMessage =
    mutation.error instanceof ApiRequestError
      ? mutation.error.message
      : mutation.error
        ? 'Não foi possível enviar a recuperação agora. Tente novamente.'
        : null;

  return (
    <RecoveryLayout>
      <Link to="/login" className="auth-back-link">
        <ArrowLeft size={16} /> Voltar para o login
      </Link>
      <div className="mb-7">
        <h2 className="text-3xl font-bold tracking-tight text-[#2b1861]">Recupere sua senha</h2>
        <p className="mt-2 text-sm leading-6 text-[#66568d]">
          Enviaremos um link seguro para o seu e-mail ou telefone cadastrado.
        </p>
      </div>
      {mutation.isSuccess ? (
        <div className="recovery-success" role="status">
          <Mail size={28} aria-hidden="true" />
          <strong>Confira suas mensagens</strong>
          <span>Se os dados estiverem cadastrados, você receberá as instruções em instantes.</span>
          <Link to="/login" className="auth-action-button recovery-button">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
            E-mail ou número de telefone
            <span className="relative block">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e7dbd]" />
              <input
                className={`${inputClass} pl-10 ${submitted && !identifier.trim() ? 'border-red-500' : ''}`}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                type="text"
                placeholder="voce@exemplo.com ou (11) 99999-9999"
                autoComplete="username"
                required
              />
            </span>
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="auth-action-button recovery-button"
          >
            {mutation.isPending ? <Spinner label="Enviando" /> : 'Enviar instruções'}
          </button>
          <FormError message={errorMessage} />
        </form>
      )}
    </RecoveryLayout>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({ mutationFn: resetPassword });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!token || password.length < 8 || password !== confirmation || mutation.isPending) return;
    mutation.mutate({ token, password });
  }

  const errorMessage =
    mutation.error instanceof ApiRequestError
      ? mutation.error.message
      : mutation.error
        ? 'Não foi possível redefinir sua senha agora. Tente novamente.'
        : null;
  const validationMessage =
    submitted && !token
      ? 'O link de recuperação é inválido ou está incompleto.'
      : submitted && password.length < 8
        ? 'A senha precisa ter pelo menos 8 caracteres.'
        : submitted && password !== confirmation
          ? 'As senhas não conferem.'
          : null;

  return (
    <RecoveryLayout>
      <Link to="/login" className="auth-back-link">
        <ArrowLeft size={16} /> Voltar para o login
      </Link>
      <div className="mb-7">
        <h2 className="text-3xl font-bold tracking-tight text-[#2b1861]">Crie uma nova senha</h2>
        <p className="mt-2 text-sm leading-6 text-[#66568d]">
          Escolha uma senha forte para proteger sua conta.
        </p>
      </div>
      {mutation.isSuccess ? (
        <div className="recovery-success" role="status">
          <KeyRound size={28} aria-hidden="true" />
          <strong>Senha atualizada</strong>
          <span>Agora você já pode entrar com sua nova senha.</span>
          <Link to="/login" className="auth-action-button recovery-button">
            Entrar
          </Link>
        </div>
      ) : (
        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
            Nova senha
            <span className="relative block">
              <KeyRound
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e7dbd]"
              />
              <input
                className={`${inputClass} pl-10 pr-11 ${submitted && password.length < 8 ? 'border-red-500' : ''}`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="Pelo menos 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#693de9]"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
            Confirmar nova senha
            <input
              className={`${inputClass} ${submitted && password !== confirmation ? 'border-red-500' : ''}`}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              type="password"
              placeholder="Repita sua nova senha"
              autoComplete="new-password"
              required
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="auth-action-button recovery-button"
          >
            {mutation.isPending ? <Spinner label="Salvando" /> : 'Salvar nova senha'}
          </button>
          <FormError message={validationMessage ?? errorMessage} />
        </form>
      )}
    </RecoveryLayout>
  );
}

function RecoveryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#c9bdff] px-4 py-8 font-sans">
      <main className="recovery-panel w-full max-w-xl rounded-2xl border border-[#2b1861]/10 bg-[#f8f7ff] p-7 shadow-2xl sm:p-12">
        <Link to="/" aria-label="Mesmice, página inicial">
          <img
            src="/images/auth/logo-v2-lightmode.png"
            alt="Mesmice"
            className="mb-10 h-12 w-36 object-contain object-left"
          />
        </Link>
        {children}
      </main>
    </div>
  );
}
