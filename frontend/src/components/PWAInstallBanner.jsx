import React, { useState, useEffect } from 'react';

// Muestra banner de instalación PWA solo en móvil para técnicos logueados
export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar en móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // No mostrar si ya fue descartado
    if (localStorage.getItem('pwa_banner_dismissed')) return;

    // No mostrar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Capturar el evento beforeinstallprompt (Android/Chrome)
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // En iOS Safari no hay beforeinstallprompt → mostrar banner manual
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    if (isIOS && isSafari) setVisible(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function handleInstall() {
    if (prompt) {
      prompt.prompt();
      prompt.userChoice.then(() => {
        setVisible(false);
        localStorage.setItem('pwa_banner_dismissed', '1');
      });
    }
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem('pwa_banner_dismissed', '1');
  }

  if (!visible) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg animate-slide-up">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="UrgenteYa" className="w-8 h-8 rounded-lg object-contain" onError={e => e.target.style.display='none'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Instala la app</p>
          {isIOS ? (
            <p className="text-xs text-gray-500">
              Toca <strong>Compartir</strong> <span className="text-base">⎙</span> y luego <strong>"Agregar a inicio"</strong>
            </p>
          ) : (
            <p className="text-xs text-gray-500">Accede más rápido a tu perfil desde el celular</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              Instalar
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
