'use client';

import { createContext, useContext } from 'react';
import { can, type SessionUser } from '@/lib/access';

const AuthContext = createContext<SessionUser | null>(null);
export function AuthProvider({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const user = useContext(AuthContext);
  return { user, can: (permission: string) => can(user, permission) };
}
export function PermissionGate({ permission, children }: { permission: string; children: React.ReactNode }) {
  const auth = useAuth();
  return auth.can(permission) ? children : null;
}
