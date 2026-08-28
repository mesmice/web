import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import QRCode from 'qrcode';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../lib/api/endpoints.js';
import { ApiRequestError } from '../../lib/api/client.js';
import { Spinner } from '../../components/ui/spinner.js';
import { AuthBackdrop } from '../../components/ui/auth-backdrop.js';
import { Input } from '../../components/ui/input.js';
import { Checkbox } from '../../components/ui/checkbox.js';
import './login-page.css';

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

export function LoginPage() {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const mascotClickCount = useRef(0);
  const mascotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate('/')
  });

  useEffect(() => {
    return () => {
      if (mascotTimer.current) clearTimeout(mascotTimer.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(`${window.location.origin}/login`, {
      width: 340,
      margin: 1,
      color: { dark: '#2b1861', light: '#ffffff' }
    }).then((url) => {
      if (active) setQrCodeUrl(url);
    });
    return () => {
      active = false;
    };
  }, []);

  function handleMascotClick() {
    mascotClickCount.current += 1;
    if (mascotClickCount.current < 3) return;

    mascotClickCount.current = 0;
    setMascotVisible(true);
    if (mascotTimer.current) clearTimeout(mascotTimer.current);
    mascotTimer.current = setTimeout(() => setMascotVisible(false), 10000);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!email.trim() || !password.trim() || loginMutation.isPending) return;

    loginMutation.mutate({ identifier: email.trim(), password, rememberMe });
  }

  const errorMessage =
    loginMutation.error instanceof ApiRequestError
      ? loginMutation.error.message
      : loginMutation.error
        ? 'Não foi possível entrar agora. Tente novamente.'
        : null;

  return (
    <div className="auth-page relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#c9bdff] px-4 py-8 font-sans">
      <AuthBackdrop />
      <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#693de9]/25 blur-3xl" />
      <div className="absolute -bottom-36 -right-20 h-96 w-96 rounded-full bg-[#f8f7ff]/70 blur-3xl" />

      <main className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#2b1861]/10 bg-[#f8f7ff] shadow-2xl lg:grid-cols-[1fr_1.12fr]">
        <section className="relative hidden flex-col justify-between bg-[#693de9] p-10 text-white lg:flex">
          <Link to="/" aria-label="Mesmice, página inicial">
            <img
              src="/images/auth/logo-v2-lightmode.png"
              alt="Mesmice"
              className="h-12 w-36 object-contain object-left"
            />
          </Link>
          <div>
            {mascotVisible && (
              <img
                src="/images/auth/mascote-neutro-lightmode.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2 right-2 w-20 animate-[mascot-reveal_500ms_ease-out]"
              />
            )}
            <button
              type="button"
              aria-label="Abrir mascote"
              onClick={handleMascotClick}
              className="absolute bottom-3 right-3 z-10 h-9 w-9 rounded-full opacity-25 transition hover:opacity-60 focus:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#cabeff]"
            >
              <img
                src="/images/auth/mascote-neutro-lightmode.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
              />
            </button>
            <div className="mt-10 text-center">
              {qrCodeUrl ? (
                <img
                  className="mx-auto h-64 w-64 rounded-lg object-contain"
                  src={qrCodeUrl}
                  alt="QR code para abrir o Mesmice no celular"
                />
              ) : (
                <div className="mx-auto h-64 w-64" aria-hidden="true" />
              )}
              <p className="mt-4 text-base font-bold text-white">Continue pelo celular</p>
              <p className="mt-1 text-xs leading-5 text-[#cabeff]">
                Aponte a câmera para acessar o Mesmice.
              </p>
            </div>
          </div>
          <p className="text-xs text-[#cabeff]">© 2026 mesmice</p>
        </section>

        <section className="p-7 sm:p-12">
          <div className="mb-8 lg:hidden">
            <Link to="/" aria-label="Mesmice, página inicial">
              <img
                src="/images/auth/logo-v2-lightmode.png"
                alt="Mesmice"
                className="h-12 w-36 object-contain object-left"
              />
            </Link>
          </div>
          <div className="mb-7">
            <h2 className="text-3xl font-bold tracking-tight text-[#2b1861]">
              Seja bem-vindo de volta!
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#66568d]">
              Entre para continuar de onde parou e reencontrar a sua comunidade.
            </p>
          </div>

          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
              E-mail ou número de telefone
              <span className="relative block">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e7dbd]"
                />
                <Input
                  className="pl-10"
                  error={submitted && !email.trim()}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="text"
                  placeholder="voce@exemplo.com ou (11) 99999-9999"
                  autoComplete="username"
                  required
                />
              </span>
            </label>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#2b1861]">
              Senha
              <span className="relative block">
                <LockKeyhole
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e7dbd]"
                />
                <Input
                  className="pr-11 pl-10"
                  error={submitted && !password.trim()}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  autoComplete="current-password"
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
              <Link
                to="/forgot-password"
                className="mt-2 text-xs font-bold text-[#693de9] hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-[#66568d]">
              <Checkbox
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Lembrar de mim
            </label>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="auth-action-button w-full rounded-lg bg-[#693de9] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#cabeff] transition focus:outline-none focus:ring-4 focus:ring-[#cabeff]"
            >
              {loginMutation.isPending ? <Spinner label="Entrando" /> : <WaveText>Entrar</WaveText>}
            </button>
            {errorMessage && (
              <p role="alert" className="text-center text-sm font-bold text-red-600">
                {errorMessage}
              </p>
            )}
            {submitted && !errorMessage && !loginMutation.isPending && (
              <p role="status" className="text-center text-sm font-bold text-[#2b1861]">
                Informe seus dados para entrar.
              </p>
            )}
          </form>

          <p className="mt-7 text-sm text-[#66568d]">
            Ainda não tem uma conta?{' '}
            <Link to="/register" className="font-bold text-[#693de9] hover:underline">
              Cadastre-se
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
