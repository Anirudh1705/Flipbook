import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthorizedAdminEmail, STORAGE_KEYS } from '../../lib/config';
import { auth, isFirebaseConfigured } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [checking, setChecking] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const isAuthFlag = localStorage.getItem('flipbook_admin_authenticated') === 'true';
    const storedEmail = localStorage.getItem(STORAGE_KEYS.ADMIN_USER_EMAIL);

    if (!isAuthFlag || !storedEmail || !isAuthorizedAdminEmail(storedEmail)) {
      setAuthorized(false);
      setChecking(false);
      return;
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, user => {
        if (user && isAuthorizedAdminEmail(user.email)) {
          setAuthorized(true);
        } else if (isAuthFlag && isAuthorizedAdminEmail(storedEmail)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
        setChecking(false);
      });
      return () => unsubscribe();
    }

    setAuthorized(true);
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-500">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
