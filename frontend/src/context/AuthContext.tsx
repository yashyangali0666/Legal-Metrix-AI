import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ApiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('legalmetrix_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('legalmetrix_token');
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('legalmetrix_token');
      if (savedToken) {
        try {
          const me = await ApiService.getCurrentUser();
          setUser(me);
          localStorage.setItem('legalmetrix_user', JSON.stringify(me));
        } catch (err) {
          console.warn('Token validation failed, clearing session', err);
          localStorage.removeItem('legalmetrix_token');
          localStorage.removeItem('legalmetrix_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await ApiService.login(username, password);
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const register = async (userData: any) => {
    const res = await ApiService.register(userData);
    if (res.access_token) {
      setToken(res.access_token);
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    await ApiService.logout();
    setToken(null);
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    let name = user.full_name;
    let dept = user.department;
    let badge = user.badge_number;

    if (newRole === 'admin') {
      name = 'Chief Legal Metrology Controller';
      dept = 'Headquarters Enforcement Cell';
      badge = 'LM-DL-HQ-01';
    } else if (newRole === 'reviewer') {
      name = 'Anita Sharma';
      dept = 'Statutory Standards Review Board';
      badge = 'LM-REV-07';
    } else {
      name = 'Rajesh Kumar';
      dept = 'Delhi North District Inspection Unit';
      badge = 'LM-DL-N-42';
    }

    const updated = {
      ...user,
      role: newRole,
      full_name: name,
      department: dept,
      badge_number: badge,
    };
    setUser(updated);
    localStorage.setItem('legalmetrix_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        switchRole,
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

