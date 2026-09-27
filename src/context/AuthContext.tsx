import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';

export const ADMIN_EMAIL = 'caddyquivo@gmail.com';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  affiliateRef: string | null;
  setAffiliateRef: (ref: string | null) => void;
  login: (email: string) => Promise<void>;
  register: (name: string, email: string, phone?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [affiliateRef, setAffiliateRefState] = useState<string | null>(null);

  // Check URL for referral code (?ref=XYZ) and store in localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setAffiliateRefState(ref);
      localStorage.setItem('spacepay_ref', ref);
    } else {
      const savedRef = localStorage.getItem('spacepay_ref');
      if (savedRef) {
        setAffiliateRefState(savedRef);
      }
    }
  }, []);

  const setAffiliateRef = (ref: string | null) => {
    setAffiliateRefState(ref);
    if (ref) {
      localStorage.setItem('spacepay_ref', ref);
    } else {
      localStorage.removeItem('spacepay_ref');
    }
  };

  const refreshUser = async () => {
    try {
      const { user: updatedUser } = await api.getMe();
      setUser(updatedUser);
    } catch {
      // User might be logged out or network error
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('spacepay_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Refresh silently from server
        api.getMe().then(res => setUser(res.user)).catch(() => {});
      } catch {
        localStorage.removeItem('spacepay_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await api.login(email);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, phone?: string) => {
    setIsLoading(true);
    try {
      const { user: registeredUser } = await api.register(name, email, phone);
      setUser(registeredUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('spacepay_user');
    setUser(null);
  };

  const isAdmin = Boolean(user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        affiliateRef,
        setAffiliateRef,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
