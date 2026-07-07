"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/browser";
import { normalizePhone } from "@/lib/phone";
import type { UserProfile } from "@/lib/database.types";
import type { User } from "@supabase/supabase-js";

interface AuthResult {
  success: boolean;
  error?: string;
}

interface SignUpInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  authUser: User | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncProfile(
  supabase: ReturnType<typeof createClient>,
  data?: { full_name?: string; phone?: string }
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const response = await fetch("/api/auth/sync-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data ?? {}),
  });

  if (!response.ok) return null;
  const { profile } = await response.json();
  return profile as UserProfile;
}

async function loadProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  syncData?: { full_name?: string; phone?: string }
) {
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profile) return profile as UserProfile;
  return syncProfile(supabase, syncData);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();

      setAuthUser(sessionUser);

      if (sessionUser) {
        const profile = await loadProfile(supabase, sessionUser.id);
        if (profile) setUser(profile);
      }

      setLoading(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        const profile = await loadProfile(supabase, session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (phone: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Неверный телефон или пароль",
        };
      }

      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();

      if (sessionUser) {
        setAuthUser(sessionUser);
        const profile = await loadProfile(supabase, sessionUser.id);
        if (profile) setUser(profile);
      }

      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Ошибка входа";
      return { success: false, error: message };
    }
  };

  const signUp = async ({ email, password, name, phone }: SignUpInput): Promise<AuthResult> => {
    try {
      const normalizedPhone = phone ? normalizePhone(phone) : null;
      if (!normalizedPhone) {
        return { success: false, error: "Введите корректный номер телефона" };
      }

      const phoneCheck = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const phoneResult = await phoneCheck.json();
      if (!phoneCheck.ok || !phoneResult.available) {
        return {
          success: false,
          error: phoneResult.error || "Этот номер телефона уже зарегистрирован",
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: normalizedPhone,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.session) {
        return {
          success: false,
          error:
            "Аккаунт создан, но требуется подтверждение email. Отключите подтверждение в Supabase Dashboard → Auth → Providers → Email.",
        };
      }

      setAuthUser(data.session.user);

      const profile = await loadProfile(supabase, data.session.user.id, {
        full_name: name.trim(),
        phone: normalizedPhone,
      });
      if (profile) setUser(profile);

      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Ошибка регистрации";
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
