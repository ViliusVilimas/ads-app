import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(
    () => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }),
    []
  );

  const c = dark
    ? { bg: '#121212', fg: '#ffffff', card: '#222222', accent: '#4da3ff' }
    : { bg: '#ffffff', fg: '#000000', card: '#eeeeee', accent: '#0066cc' };

  return (
    <AppContext.Provider value={{ dark, toggle: () => setDark(!dark), user, ready, c }}>
      {children}
    </AppContext.Provider>
  );
}
