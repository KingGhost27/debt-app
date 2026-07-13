/**
 * Auth Context
 *
 * Manages Supabase user session state.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const INITIAL_SESSION_TIMEOUT_MS = 10000;
const AUTH_ERROR_MESSAGE = 'Couldn\'t reach the server';

class AuthSessionTimeoutError extends Error {
  constructor() {
    super('Timed out while loading auth session');
    this.name = 'AuthSessionTimeoutError';
  }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authError: string | null;
  isPasswordRecovery: boolean;
  retryAuth: () => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const isMountedRef = useRef(true);
  const loadRequestRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const loadInitialSession = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    let timeoutId: ReturnType<typeof window.setTimeout> | null = null;

    try {
      type SessionResponse = Awaited<ReturnType<typeof supabase.auth.getSession>>;

      const sessionResponse: SessionResponse = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new AuthSessionTimeoutError());
          }, INITIAL_SESSION_TIMEOUT_MS);
          timeoutRef.current = timeoutId;
        }),
      ]);

      if (!isMountedRef.current || loadRequestRef.current !== requestId) {
        return;
      }

      const { data: { session } } = sessionResponse;

      setSession(session);
      setUser(session?.user ?? null);
      setAuthError(null);
      setIsLoading(false);
    } catch {
      if (!isMountedRef.current || loadRequestRef.current !== requestId) {
        return;
      }

      setAuthError(AUTH_ERROR_MESSAGE);
      setIsLoading(false);
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        if (timeoutRef.current === timeoutId) {
          timeoutRef.current = null;
        }
      }
    }
  }, []);

  const retryAuth = useCallback(() => {
    setAuthError(null);
    setIsLoading(true);
    void loadInitialSession();
  }, [loadInitialSession]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthError(null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      subscription.unsubscribe();
    };
  }, [loadInitialSession]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setIsPasswordRecovery(false);
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, authError, isPasswordRecovery, retryAuth, signUp, signIn, signInWithGoogle, signOut, resetPasswordForEmail, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
