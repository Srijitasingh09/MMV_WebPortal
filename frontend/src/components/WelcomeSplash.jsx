import React, { useState, useEffect } from 'react';

// ─── SPLASH CONFIG -tweak these freely ───────────────────────────────────
// How long the welcome screen stays up before it starts fading (ms).
// You asked for 1–20s, this is set to ~8s. Change the number below.
const SPLASH_DURATION_MS = 5000;

// How long the fade/zoom-out exit transition itself takes (ms).
const EXIT_DURATION_MS = 700;

// true  -> splash plays once per browser tab (won't replay if the user
//          just clicks back to "/" later in the same session)
// false -> splash plays every single time the home page mounts (every reload)
const SHOW_ONCE_PER_SESSION = true;

// Place WelcomeSplash.jpeg in frontend/public/ so it's served from "/WelcomeSplash.jpeg"
const SPLASH_BG_IMAGE = '/bhu/MMV SarthiLogo.png';

const WelcomeSplash = () => {
  const alreadyShown =
    SHOW_ONCE_PER_SESSION && sessionStorage.getItem('mmvSplashShown') === 'true';

  const [visible, setVisible] = useState(!alreadyShown);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;

    const exitTimer = setTimeout(() => setExiting(true), SPLASH_DURATION_MS);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      if (SHOW_ONCE_PER_SESSION) sessionStorage.setItem('mmvSplashShown', 'true');
    }, SPLASH_DURATION_MS + EXIT_DURATION_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [visible]);

  const handleSkip = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      if (SHOW_ONCE_PER_SESSION) sessionStorage.setItem('mmvSplashShown', 'true');
    }, EXIT_DURATION_MS);
  };

  // Also let people tap/press any key to skip, like most app intros.
  useEffect(() => {
    if (!visible) return undefined;
    const onKey = () => handleSkip();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, exiting]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center overflow-hidden"
      style={{
        transition: `opacity ${EXIT_DURATION_MS}ms ease-in-out, transform ${EXIT_DURATION_MS}ms ease-in-out`,
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.06)' : 'scale(1)',
        pointerEvents: exiting ? 'none' : 'auto',
      }}
      onClick={handleSkip}
      role="presentation"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;600;700&display=swap');

        @keyframes mmvSplashTextIn {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes mmvSplashBarFill {
          0%   { width: 0%; }
          100% { width: 100%; }
        }

        .mmv-splash-title { animation: mmvSplashTextIn 0.9s cubic-bezier(0.22,1,0.36,1) both 0.25s; }
        .mmv-splash-rule { animation: mmvSplashTextIn 0.9s cubic-bezier(0.22,1,0.36,1) both 0.42s; }
        .mmv-splash-sub { animation: mmvSplashTextIn 0.9s cubic-bezier(0.22,1,0.36,1) both 0.55s; }
        .mmv-splash-bar-track { animation: mmvSplashTextIn 0.9s cubic-bezier(0.22,1,0.36,1) both 0.7s; }
        .mmv-splash-bar-fill { animation: mmvSplashBarFill ${SPLASH_DURATION_MS}ms linear forwards; }

        .mmv-splash-font-heading { font-family: 'Cormorant Garamond', Georgia, serif; }
        .mmv-splash-font-body { font-family: 'Lato', sans-serif; }
      `}</style>

      {/* Background image + navy gradient overlay, matching the site's hero */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={SPLASH_BG_IMAGE}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(13,31,60,0.90) 0%, rgba(15,51,88,0.86) 50%, rgba(13,31,60,0.94) 100%)',
          }}
        />
      </div>

      {/* Skip control */}
      <button
        onClick={(e) => { e.stopPropagation(); handleSkip(); }}
        className="mmv-splash-font-body absolute top-5 right-5 sm:top-8 sm:right-8 text-[11px] sm:text-xs text-amber-100/80 hover:text-white border border-amber-100/30 hover:border-[#D4AF37] rounded-full px-4 py-1.5 backdrop-blur-xs transition-colors z-10"
      >
        Skip ✕
      </button>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <h1 className="mmv-splash-title mmv-splash-font-heading text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-md mb-3">
          Welcome to MMV Sarthi
        </h1>

        <div className="mmv-splash-rule flex items-center gap-3 w-40 sm:w-48 mx-auto mb-3">
          <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent flex-1" />
          <span className="text-[#D4AF37] text-xs">✦</span>
          <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent flex-1" />
        </div>

        <p className="mmv-splash-sub mmv-splash-font-body text-amber-100/90 text-sm sm:text-base tracking-wide mb-10">
          Mahila Mahavidyalaya • Banaras Hindu University
        </p>

        <div className="mmv-splash-bar-track w-40 sm:w-52 h-[3px] rounded-full bg-white/20 overflow-hidden">
          <div className="mmv-splash-bar-fill h-full bg-[#D4AF37] rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default WelcomeSplash;