"use client";

import React, { useEffect, useState } from "react";

const CONSENT_KEY = "cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Уведомление об использовании cookies"
      className="fixed bottom-20 md:bottom-4 left-4 right-4 z-[60] mx-auto max-w-3xl"
    >
      <div className="rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] bg-white dark:bg-[#2D2A26] shadow-xl p-4 md:p-5">
        <p className="text-sm text-[#2D2A26]/80 dark:text-[#E8E6E3]/80 leading-relaxed">
          Мы используем файлы cookie для входа в аккаунт, корзины и настроек сайта.
          Нажимая «Принять», вы соглашаетесь на их использование.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={accept}
            className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
