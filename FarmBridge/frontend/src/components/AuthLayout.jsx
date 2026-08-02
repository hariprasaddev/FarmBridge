import Icon from './Icon';
import './AuthLayout.css';

/**
 * Right-side brand panel — dark green gradient with a minimal
 * flat SVG farming illustration. Shared by Login and Register
 * via the AuthLayout component.
 */
export function RightIllustration() {
  return (
    <div className="auth-right">
      <div className="auth-right-deco auth-right-deco-1" />
      <div className="auth-right-deco auth-right-deco-2" />

      <div className="auth-illustration" aria-hidden="true">
        <svg viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Concentric rings */}
          <circle cx="180" cy="180" r="168" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
          <circle cx="180" cy="180" r="134" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 10" />
          <circle cx="180" cy="180" r="98" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

          {/* Farmer ⇄ buyer connection */}
          <circle cx="112" cy="180" r="10" fill="rgba(255,255,255,0.9)" />
          <circle cx="248" cy="180" r="10" fill="rgba(255,255,255,0.9)" />
          <path
            d="M124 180 H 236"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2"
            strokeDasharray="2 9"
            strokeLinecap="round"
          />

          {/* Central sprout / leaf */}
          <path
            d="M180 236 C 166 200 144 168 108 152 C 130 172 156 196 166 228 Z"
            fill="rgba(255,255,255,0.88)"
          />
          <path
            d="M180 236 C 194 200 216 168 252 152 C 230 172 204 196 194 228 Z"
            fill="rgba(255,255,255,0.88)"
          />
          <path d="M180 236 V 262" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" />

          {/* Small accent dots */}
          <circle cx="90" cy="100" r="5" fill="rgba(255,255,255,0.35)" />
          <circle cx="268" cy="102" r="5" fill="rgba(255,255,255,0.35)" />
          <circle cx="196" cy="78" r="4" fill="rgba(255,255,255,0.28)" />
          <circle cx="130" cy="250" r="4" fill="rgba(255,255,255,0.28)" />
        </svg>
      </div>

      <h2 className="auth-right-title">Connecting Farmers Directly With Buyers</h2>
      <p className="auth-right-text">
        No middlemen. Fair prices. Fresh products. Trusted marketplace.
      </p>
    </div>
  );
}

/**
 * Split-screen auth layout: white form side (children) + the
 * dark green brand illustration on the right. Mobile hides the
 * right panel and centers the form.
 */
function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <Icon name="leaf" size={20} />
          </span>
          <span className="auth-brand-name">FarmBridge</span>
        </div>
        <div className="auth-left-inner">{children}</div>
      </div>
      <RightIllustration />
    </div>
  );
}

export default AuthLayout;
