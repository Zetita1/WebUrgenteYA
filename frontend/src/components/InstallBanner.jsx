import React, { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // No mostrar si ya lo instaló o lo descartó antes
    if (localStorage.getItem('pwa-dismissed')) return;

    function handler(e) {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setVisible(false));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setPrompt(null);
  }

  function handleDismiss() {
    setHidden(true);
    setTimeout(() => setVisible(false), 300);
    localStorage.setItem('pwa-dismissed', '1');
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${hidden ? 'translate-y-full' : 'translate-y-0'}`}
    >
      <div className="bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3 max-w-lg mx-auto mb-0 sm:mb-4 sm:rounded-2xl sm:border sm:shadow-xl">
        <img src="/logo.png" alt="UrgenteYa" className="w-9 h-9 rounded-xl object-contain flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Instalar UrgenteYa</p>
          <p className="text-xs text-gray-400">Acceso rápido desde tu pantalla de inicio</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-gray-300 hover:text-gray-500 flex-shrink-0 p-1"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
