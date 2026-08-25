import './auth-backdrop.css';

export function AuthBackdrop() {
  return (
    <div className="auth-backdrop" aria-hidden="true">
      <img
        className="auth-backdrop__logo auth-backdrop__logo--top"
        src="/images/auth/logo-v2-lightmode.png"
        alt=""
      />
      <img
        className="auth-backdrop__logo auth-backdrop__logo--bottom"
        src="/images/auth/logo-v2-darkmode.png"
        alt=""
      />
      <img
        className="auth-backdrop__mascot auth-backdrop__mascot--left"
        src="/images/auth/mascote-neutro-lightmode.png"
        alt=""
      />
      <img
        className="auth-backdrop__mascot auth-backdrop__mascot--right"
        src="/images/auth/mascote-neutro-lightmode.png"
        alt=""
      />
    </div>
  );
}
