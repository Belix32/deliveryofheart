"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, User, Lock, Phone, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get("redirect"), "/");
  const { signIn, signUp, user } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) router.push(redirect);
  }, [user, router, redirect]);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Введите email и пароль");
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    if (result.success) {
      router.push(redirect);
    } else {
      setError(result.error || "Ошибка входа");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    if (!email.trim()) {
      setError("Введите email");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }

    setLoading(true);
    const result = await signUp({
      email,
      password,
      name,
      phone: phone.trim() || undefined,
    });
    if (result.success) {
      router.push(redirect);
    } else {
      setError(result.error || "Ошибка регистрации");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] dark:bg-[#1A1918] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary dark:bg-primary-dark rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">❤️</span>
          </div>
          <h1 className="text-2xl font-display font-bold">Доставка от души</h1>
          <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mt-2">
            {mode === "register" ? "Создайте аккаунт" : "Войдите в аккаунт"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#2D2A26] rounded-2xl p-6 shadow-lg space-y-4"
        >
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-2">Ваше имя</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как к вам обращаться"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Телефон <span className="text-[#2D2A26]/40">(для курьера, необязательно)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Подождите..."
            ) : mode === "login" ? (
              <>
                Войти <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              "Зарегистрироваться"
            )}
          </button>

          <div className="text-center pt-2">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className="text-primary font-medium"
              >
                Нет аккаунта? Зарегистрироваться
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-[#2D2A26]/60 text-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Уже есть аккаунт? Войти
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
